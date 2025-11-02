// credentials-api/src/controllers/verificationController.js
// Verification controller - handles email and phone verification

const pool = require('../db');
const {
    sendSuccess,
    sendError,
    generateSecureToken,
    generateVerificationCode,
    sendVerificationEmail,
    sendSMSViaEmail,
    getSupportedCarriers
} = require('../utilities');

class VerificationController {
    /**
     * Send email verification
     * POST /auth/verify/email/send
     * Protected route - requires JWT
     */
    static async sendEmailVerification(req, res) {
        const userId = req.claims.id;
        
        try {
            // Get user info
            const userResult = await pool.query(
                'SELECT FirstName, Email, Email_Verified FROM Account WHERE Account_ID = $1',
                [userId]
            );
            
            if (userResult.rows.length === 0) {
                return sendError(res, 404, 'User not found');
            }
            
            const { firstname, email, email_verified } = userResult.rows[0];
            
            if (email_verified) {
                return sendError(res, 400, 'Email is already verified');
            }
            
            // Check rate limiting (5 minutes)
            const recentVerification = await pool.query(
                `SELECT COUNT(*) as count 
                 FROM Email_Verification 
                 WHERE Account_ID = $1 AND Token_Expires > NOW() AND Created_At > NOW() - INTERVAL '5 minutes'`,
                [userId]
            );
            
            if (parseInt(recentVerification.rows[0].count) > 0) {
                return sendError(res, 429, 'Please wait before requesting another verification email');
            }
            
            // Delete old verification tokens for this user
            await pool.query(
                'DELETE FROM Email_Verification WHERE Account_ID = $1',
                [userId]
            );
            
            // Generate verification token (64-character hex string)
            const verificationToken = generateSecureToken();
            const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours
            
            // Store verification token in database
            await pool.query(
                `INSERT INTO Email_Verification
                 (Account_ID, Email, Verification_Token, Token_Expires)
                 VALUES ($1, $2, $3, $4)`,
                [userId, email, verificationToken, expiresAt]
            );
            
            // Create verification URL
            const baseUrl = process.env.APP_BASE_URL || `http://localhost:${process.env.PORT || 3001}`;
            const verificationUrl = `${baseUrl}/auth/verify/email/confirm?token=${verificationToken}`;
            
            // Send email
            const emailSent = await sendVerificationEmail(email, firstname, verificationUrl);
            
            if (!emailSent && process.env.NODE_ENV === 'production') {
                return sendError(res, 500, 'Failed to send verification email');
            }
            
            // Build response data
            const responseData = {
                expiresIn: '48 hours'
            };
            
            // In development, include the verification URL
            if (process.env.NODE_ENV !== 'production') {
                responseData.verificationUrl = verificationUrl;
            }
            
            sendSuccess(res, responseData, 'Verification email sent successfully');
            
        } catch (error) {
            console.error('Send email verification error:', error);
            sendError(res, 500, 'Failed to send verification email');
        }
    }
    
    /**
     * Confirm email verification (click link in email)
     * GET /auth/verify/email/confirm?token=xxx
     * Public route
     */
    static async confirmEmailVerification(req, res) {
        const { token } = req.query;
        
        if (!token) {
            return sendError(res, 400, 'Verification token is required');
        }
        
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            
            // Find verification record
            const verificationResult = await client.query(
                `SELECT ev.*, a.Email_Verified 
                 FROM Email_Verification ev
                 JOIN Account a ON ev.Account_ID = a.Account_ID
                 WHERE ev.Verification_Token = $1`,
                [token]
            );
            
            if (verificationResult.rows.length === 0) {
                await client.query('ROLLBACK');
                return sendError(res, 400, 'Invalid or expired verification token');
            }
            
            const verification = verificationResult.rows[0];
            
            // Check if already verified
            if (verification.email_verified) {
                await client.query('ROLLBACK');
                return sendSuccess(res, null, 'Email is already verified');
            }
            
            // Check if token expired
            if (new Date() > new Date(verification.token_expires)) {
                await client.query('ROLLBACK');
                return sendError(res, 400, 'Verification token has expired. Please request a new one.');
            }
            
            // Update account email_verified status
            await client.query(
                'UPDATE Account SET Email_Verified = TRUE, Updated_At = CURRENT_TIMESTAMP WHERE Account_ID = $1',
                [verification.account_id]
            );
            
            // Delete verification record (single-use)
            await client.query(
                'DELETE FROM Email_Verification WHERE Verification_Token = $1',
                [token]
            );
            
            await client.query('COMMIT');
            
            sendSuccess(res, null, 'Email verified successfully');
            
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Confirm email verification error:', error);
            sendError(res, 500, 'Failed to verify email');
        } finally {
            client.release();
        }
    }
    
    /**
     * Send SMS verification code
     * POST /auth/verify/phone/send
     * Protected route - requires JWT
     */
    static async sendSMSVerification(req, res) {
        const userId = req.claims.id;
        const { carrier } = req.body;
        
        try {
            // Get user info
            const userResult = await pool.query(
                'SELECT FirstName, Phone, Phone_Verified FROM Account WHERE Account_ID = $1',
                [userId]
            );
            
            if (userResult.rows.length === 0) {
                return sendError(res, 404, 'User not found');
            }
            
            const { firstname, phone, phone_verified } = userResult.rows[0];
            
            if (phone_verified) {
                return sendError(res, 400, 'Phone is already verified');
            }
            
            // Check rate limiting (1 minute)
            const recentVerification = await pool.query(
                `SELECT COUNT(*) as count 
                 FROM Phone_Verification 
                 WHERE Account_ID = $1 AND Code_Expires > NOW() AND Created_At > NOW() - INTERVAL '1 minute'`,
                [userId]
            );
            
            if (parseInt(recentVerification.rows[0].count) > 0) {
                return sendError(res, 429, 'Please wait before requesting another SMS code');
            }
            
            // Delete old verification codes for this user
            await pool.query(
                'DELETE FROM Phone_Verification WHERE Account_ID = $1',
                [userId]
            );
            
            // Generate 6-digit verification code
            const verificationCode = generateVerificationCode();
            const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
            
            // Store verification code in database
            await pool.query(
                `INSERT INTO Phone_Verification
                 (Account_ID, Phone, Verification_Code, Code_Expires, Attempts)
                 VALUES ($1, $2, $3, $4, 0)`,
                [userId, phone, verificationCode, expiresAt]
            );
            
            // Send SMS code
            const message = `Auth Code: ${verificationCode}\nExpires in 15 min\nDo not share`;
            const smsSent = await sendSMSViaEmail(phone, message, carrier || 'att');
            
            if (!smsSent && process.env.NODE_ENV === 'production') {
                return sendError(res, 500, 'Failed to send SMS verification code');
            }
            
            // Build response data
            const responseData = {
                expiresIn: '15 minutes',
                method: 'email-to-sms',
                availableCarriers: getSupportedCarriers()
            };
            
            // In development, include the verification code
            if (process.env.NODE_ENV !== 'production') {
                responseData.verificationCode = verificationCode;
            }
            
            sendSuccess(res, responseData, 'SMS verification code sent successfully');
            
        } catch (error) {
            console.error('Send SMS verification error:', error);
            sendError(res, 500, 'Failed to send SMS verification code');
        }
    }
    
    /**
     * Verify SMS code
     * POST /auth/verify/phone/verify
     * Protected route - requires JWT
     */
    static async verifySMSCode(req, res) {
        const userId = req.claims.id;
        const { code } = req.body;
        
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            
            // Find verification record
            const verificationResult = await client.query(
                `SELECT pv.*, a.Phone_Verified
                 FROM Phone_Verification pv
                 JOIN Account a ON pv.Account_ID = a.Account_ID
                 WHERE pv.Account_ID = $1`,
                [userId]
            );
            
            if (verificationResult.rows.length === 0) {
                await client.query('ROLLBACK');
                return sendError(res, 400, 'No verification code found. Please request a new code.');
            }
            
            const verification = verificationResult.rows[0];
            
            // Check if already verified
            if (verification.phone_verified) {
                await client.query('ROLLBACK');
                return sendSuccess(res, null, 'Phone is already verified');
            }
            
            // Check if token expired
            if (new Date() > new Date(verification.code_expires)) {
                await client.query('ROLLBACK');
                return sendError(res, 400, 'Verification code has expired. Please request a new one.');
            }
            
            // Check attempts
            if (verification.attempts >= 3) {
                await client.query('ROLLBACK');
                return sendError(res, 400, 'Maximum verification attempts exceeded. Please request a new code.');
            }
            
            // Verify code
            if (code !== verification.verification_code) {
                // Increment attempts
                await client.query(
                    'UPDATE Phone_Verification SET Attempts = Attempts + 1 WHERE Account_ID = $1',
                    [userId]
                );
                await client.query('COMMIT');
                
                const remainingAttempts = 3 - (verification.attempts + 1);
                return sendError(res, 400, `Invalid verification code. ${remainingAttempts} attempts remaining.`);
            }
            
            // Update account phone_verified status
            await client.query(
                'UPDATE Account SET Phone_Verified = TRUE, Updated_At = CURRENT_TIMESTAMP WHERE Account_ID = $1',
                [userId]
            );
            
            // Delete verification record (single-use)
            await client.query(
                'DELETE FROM Phone_Verification WHERE Account_ID = $1',
                [userId]
            );
            
            await client.query('COMMIT');
            
            sendSuccess(res, null, 'Phone verified successfully');
            
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Verify SMS code error:', error);
            sendError(res, 500, 'Failed to verify phone');
        } finally {
            client.release();
        }
    }
    
    /**
     * Get supported SMS carriers
     * GET /auth/verify/carriers
     * Public route
     */
    static async getCarriers(req, res) {
        const carriers = getSupportedCarriers();
        sendSuccess(res, { carriers });
    }
}

module.exports = VerificationController;
