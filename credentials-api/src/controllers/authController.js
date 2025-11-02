// credentials-api/src/controllers/authController.js
// Authentication controller - handles registration, login, password operations

const pool = require('../db');
const {
    sendSuccess,
    sendError,
    generateSalt,
    generateHash,
    verifyPassword,
    validatePassword,
    generateAccessToken,
    generatePasswordResetToken,
    verifyToken,
    sendPasswordResetEmail
} = require('../utilities');

class AuthController {
    /**
     * User registration
     * POST /auth/register
     */
    static async register(req, res) {
        const { firstname, lastname, email, password, username, phone } = req.body;
        
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            
            // Validate password strength
            const passwordValidation = validatePassword(password);
            if (!passwordValidation.valid) {
                return sendError(res, 400, passwordValidation.error);
            }
            
            // Check if email already exists
            const emailCheck = await client.query(
                'SELECT Account_ID FROM Account WHERE Email = $1',
                [email]
            );
            if (emailCheck.rows.length > 0) {
                await client.query('ROLLBACK');
                return sendError(res, 400, 'Email already in use');
            }
            
            // Check if username already exists
            const usernameCheck = await client.query(
                'SELECT Account_ID FROM Account WHERE Username = $1',
                [username]
            );
            if (usernameCheck.rows.length > 0) {
                await client.query('ROLLBACK');
                return sendError(res, 400, 'Username already taken');
            }
            
            // Check if phone already exists
            const phoneCheck = await client.query(
                'SELECT Account_ID FROM Account WHERE Phone = $1',
                [phone]
            );
            if (phoneCheck.rows.length > 0) {
                await client.query('ROLLBACK');
                return sendError(res, 400, 'Phone number already in use');
            }
            
            // Create account (always role 1 = User)
            const insertAccountResult = await client.query(
                `INSERT INTO Account 
                 (FirstName, LastName, Username, Email, Phone, Account_Role, Email_Verified, Phone_Verified, Account_Status)
                 VALUES ($1, $2, $3, $4, $5, 1, FALSE, FALSE, 'pending')
                 RETURNING Account_ID`,
                [firstname, lastname, username, email, phone]
            );
            
            const accountId = insertAccountResult.rows[0].account_id;
            
            // Generate salt and hash for password
            const salt = generateSalt();
            const saltedHash = generateHash(password, salt);
            
            // Store credentials
            await client.query(
                'INSERT INTO Account_Credential (Account_ID, Salted_Hash, Salt) VALUES ($1, $2, $3)',
                [accountId, saltedHash, salt]
            );
            
            await client.query('COMMIT');
            
            // Generate JWT token
            const token = generateAccessToken({
                id: accountId,
                email,
                role: 1
            });
            
            sendSuccess(res, {
                accessToken: token,
                user: {
                    id: accountId,
                    email,
                    name: firstname,
                    lastname,
                    username,
                    role: 'User',
                    emailVerified: false,
                    phoneVerified: false,
                    accountStatus: 'pending'
                }
            }, 'User registration successful', 201);
            
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Registration error:', error);
            sendError(res, 500, 'Registration failed');
        } finally {
            client.release();
        }
    }
    
    /**
     * User login
     * POST /auth/login
     */
    static async login(req, res) {
        const { email, password } = req.body;
        
        try {
            // Find account with credentials
            const accountResult = await pool.query(
                `SELECT 
                    a.Account_ID, a.FirstName, a.LastName, a.Username, 
                    a.Email, a.Account_Role, a.Email_Verified, 
                    a.Phone_Verified, a.Account_Status,
                    ac.Salted_Hash, ac.Salt
                FROM Account a 
                LEFT JOIN Account_Credential ac ON a.Account_ID = ac.Account_ID 
                WHERE a.Email = $1`,
                [email]
            );
            
            if (accountResult.rows.length === 0) {
                return sendError(res, 401, 'Invalid credentials');
            }
            
            const account = accountResult.rows[0];
            
            // Check account status
            if (account.account_status === 'suspended') {
                return sendError(res, 403, 'Account is suspended. Please contact support.');
            }
            if (account.account_status === 'locked') {
                return sendError(res, 403, 'Account is locked. Please contact support.');
            }
            
            // Verify password
            if (!account.salted_hash || !verifyPassword(password, account.salt, account.salted_hash)) {
                return sendError(res, 401, 'Invalid credentials');
            }
            
            // Generate JWT token
            const token = generateAccessToken({
                id: account.account_id,
                email: account.email,
                role: account.account_role
            });
            
            // Get role name
            const roleNames = ['', 'User', 'Moderator', 'Admin', 'SuperAdmin', 'Owner'];
            const roleName = roleNames[account.account_role] || 'User';
            
            sendSuccess(res, {
                accessToken: token,
                user: {
                    id: account.account_id,
                    email: account.email,
                    name: account.firstname,
                    lastname: account.lastname,
                    username: account.username,
                    role: roleName,
                    emailVerified: account.email_verified,
                    phoneVerified: account.phone_verified,
                    accountStatus: account.account_status
                }
            }, 'Login successful');
            
        } catch (error) {
            console.error('Login error:', error);
            sendError(res, 500, 'Server error - contact support');
        }
    }
    
    /**
     * Change user password (requires old password)
     * POST /auth/user/password/change
     * Protected route - requires JWT
     */
    static async changePassword(req, res) {
        const userId = req.claims.id;
        const { oldPassword, newPassword } = req.body;
        
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            
            // Validate new password strength
            const passwordValidation = validatePassword(newPassword);
            if (!passwordValidation.valid) {
                await client.query('ROLLBACK');
                return sendError(res, 400, passwordValidation.error);
            }
            
            // Get current credentials
            const credResult = await client.query(
                'SELECT Salted_Hash, Salt FROM Account_Credential WHERE Account_ID = $1',
                [userId]
            );
            
            if (credResult.rows.length === 0) {
                await client.query('ROLLBACK');
                return sendError(res, 404, 'Account credentials not found');
            }
            
            const { salted_hash, salt } = credResult.rows[0];
            
            // Verify old password
            if (!verifyPassword(oldPassword, salt, salted_hash)) {
                await client.query('ROLLBACK');
                return sendError(res, 401, 'Current password is incorrect');
            }
            
            // Generate new salt and hash
            const newSalt = generateSalt();
            const newHash = generateHash(newPassword, newSalt);
            
            // Update credentials
            await client.query(
                'UPDATE Account_Credential SET Salted_Hash = $1, Salt = $2, Updated_At = CURRENT_TIMESTAMP WHERE Account_ID = $3',
                [newHash, newSalt, userId]
            );
            
            await client.query('COMMIT');
            
            sendSuccess(res, null, 'Password changed successfully');
            
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Change password error:', error);
            sendError(res, 500, 'Failed to change password');
        } finally {
            client.release();
        }
    }
    
    /**
     * Request password reset (sends email)
     * POST /auth/password/reset-request
     * Public route
     */
    static async requestPasswordReset(req, res) {
        const { email } = req.body;
        
        try {
            // Find account with verified email
            const accountResult = await pool.query(
                'SELECT Account_ID, FirstName, Email_Verified FROM Account WHERE Email = $1',
                [email]
            );
            
            // Always return success to prevent email enumeration
            if (accountResult.rows.length === 0 || !accountResult.rows[0].email_verified) {
                return sendSuccess(res, null, 'If the email exists and is verified, a reset link will be sent.');
            }
            
            const { account_id, firstname } = accountResult.rows[0];
            
            // Generate reset token (valid for 1 hour)
            const resetToken = generatePasswordResetToken(account_id, email);
            
            // Create reset URL
            const baseUrl = process.env.APP_BASE_URL || `http://localhost:${process.env.PORT || 3001}`;
            const resetUrl = `${baseUrl}/auth/password/reset?token=${resetToken}`;
            
            // Send email
            const emailSent = await sendPasswordResetEmail(email, firstname, resetUrl);
            
            if (!emailSent && process.env.NODE_ENV === 'production') {
                return sendError(res, 500, 'Failed to send reset email');
            }
            
            sendSuccess(res, null, 'If the email exists and is verified, a reset link will be sent.');
            
        } catch (error) {
            console.error('Password reset request error:', error);
            sendError(res, 500, 'Failed to process reset request');
        }
    }
    
    /**
     * Reset password with token
     * POST /auth/password/reset
     * Public route
     */
    static async resetPassword(req, res) {
        const { token, password } = req.body;
        
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            
            // Verify token
            const decoded = verifyToken(token);
            if (!decoded || decoded.type !== 'password_reset') {
                await client.query('ROLLBACK');
                return sendError(res, 400, 'Invalid or expired reset token');
            }
            
            // Validate new password strength
            const passwordValidation = validatePassword(password);
            if (!passwordValidation.valid) {
                await client.query('ROLLBACK');
                return sendError(res, 400, passwordValidation.error);
            }
            
            // Generate new salt and hash
            const salt = generateSalt();
            const saltedHash = generateHash(password, salt);
            
            // Update credentials
            const updateResult = await client.query(
                'UPDATE Account_Credential SET Salted_Hash = $1, Salt = $2, Updated_At = CURRENT_TIMESTAMP WHERE Account_ID = $3',
                [saltedHash, salt, decoded.id]
            );
            
            if (updateResult.rowCount === 0) {
                await client.query('ROLLBACK');
                return sendError(res, 404, 'Account not found');
            }
            
            await client.query('COMMIT');
            
            sendSuccess(res, null, 'Password reset successful');
            
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Password reset error:', error);
            sendError(res, 500, 'Failed to reset password');
        } finally {
            client.release();
        }
    }
    
    /**
     * Get current user info
     * GET /auth/me
     * Protected route - requires JWT
     */
    static async getCurrentUser(req, res) {
        const userId = req.claims.id;
        
        try {
            const userResult = await pool.query(
                `SELECT Account_ID, FirstName, LastName, Username, Email, Phone, 
                        Account_Role, Email_Verified, Phone_Verified, Account_Status
                 FROM Account WHERE Account_ID = $1`,
                [userId]
            );
            
            if (userResult.rows.length === 0) {
                return sendError(res, 404, 'User not found');
            }
            
            const user = userResult.rows[0];
            const roleNames = ['', 'User', 'Moderator', 'Admin', 'SuperAdmin', 'Owner'];
            const roleName = roleNames[user.account_role] || 'User';
            
            sendSuccess(res, {
                id: user.account_id,
                email: user.email,
                name: user.firstname,
                lastname: user.lastname,
                username: user.username,
                phone: user.phone,
                role: roleName,
                emailVerified: user.email_verified,
                phoneVerified: user.phone_verified,
                accountStatus: user.account_status
            });
            
        } catch (error) {
            console.error('Get current user error:', error);
            sendError(res, 500, 'Failed to retrieve user information');
        }
    }
}

module.exports = AuthController;
