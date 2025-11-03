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
     * Show password reset form (GET)
     * GET /auth/password/reset?token=xyz
     * Public route - displays HTML form
     */
    static async showPasswordResetForm(req, res) {
        const { token } = req.query;
        
        if (!token) {
            return res.status(400).send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Password Reset - Error</title>
                    <style>
                        body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
                        .error { color: #d32f2f; background: #ffebee; padding: 15px; border-radius: 4px; }
                    </style>
                </head>
                <body>
                    <h1>Password Reset</h1>
                    <div class="error">
                        <strong>Error:</strong> No reset token provided. Please use the link from your email.
                    </div>
                </body>
                </html>
            `);
        }
        
        // Return HTML form with token embedded
        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Reset Your Password</title>
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <style>
                    body {
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        min-height: 100vh;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        margin: 0;
                        padding: 20px;
                    }
                    .container {
                        background: white;
                        padding: 40px;
                        border-radius: 10px;
                        box-shadow: 0 10px 25px rgba(0,0,0,0.2);
                        max-width: 400px;
                        width: 100%;
                    }
                    h1 {
                        color: #333;
                        margin-top: 0;
                        font-size: 24px;
                    }
                    .form-group {
                        margin-bottom: 20px;
                    }
                    label {
                        display: block;
                        margin-bottom: 5px;
                        color: #555;
                        font-weight: 500;
                    }
                    input[type="password"] {
                        width: 100%;
                        padding: 12px;
                        border: 2px solid #ddd;
                        border-radius: 4px;
                        font-size: 14px;
                        box-sizing: border-box;
                        transition: border-color 0.3s;
                    }
                    input[type="password"]:focus {
                        outline: none;
                        border-color: #667eea;
                    }
                    button {
                        width: 100%;
                        padding: 12px;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        border: none;
                        border-radius: 4px;
                        font-size: 16px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: opacity 0.3s;
                    }
                    button:hover {
                        opacity: 0.9;
                    }
                    button:disabled {
                        opacity: 0.6;
                        cursor: not-allowed;
                    }
                    .message {
                        padding: 12px;
                        border-radius: 4px;
                        margin-bottom: 20px;
                        display: none;
                    }
                    .success {
                        background: #d4edda;
                        color: #155724;
                        border: 1px solid #c3e6cb;
                    }
                    .error {
                        background: #f8d7da;
                        color: #721c24;
                        border: 1px solid #f5c6cb;
                    }
                    .requirements {
                        font-size: 12px;
                        color: #666;
                        margin-top: 5px;
                        line-height: 1.4;
                    }
                    .spinner {
                        display: none;
                        border: 3px solid #f3f3f3;
                        border-top: 3px solid #667eea;
                        border-radius: 50%;
                        width: 20px;
                        height: 20px;
                        animation: spin 1s linear infinite;
                        margin: 0 auto;
                    }
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>🔑 Reset Your Password</h1>
                    <div id="message" class="message"></div>
                    
                    <form id="resetForm">
                        <div class="form-group">
                            <label for="password">New Password</label>
                            <input type="password" id="password" name="password" required minlength="8">
                            <div class="requirements">
                                Must be at least 8 characters with uppercase, lowercase, number, and special character
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="confirmPassword">Confirm New Password</label>
                            <input type="password" id="confirmPassword" name="confirmPassword" required>
                        </div>
                        
                        <div id="spinner" class="spinner"></div>
                        <button type="submit" id="submitBtn">Reset Password</button>
                    </form>
                </div>
                
                <script>
                    const form = document.getElementById('resetForm');
                    const message = document.getElementById('message');
                    const submitBtn = document.getElementById('submitBtn');
                    const spinner = document.getElementById('spinner');
                    const token = '${token}';
                    
                    function showMessage(text, type) {
                        message.textContent = text;
                        message.className = 'message ' + type;
                        message.style.display = 'block';
                    }
                    
                    form.addEventListener('submit', async (e) => {
                        e.preventDefault();
                        
                        const password = document.getElementById('password').value;
                        const confirmPassword = document.getElementById('confirmPassword').value;
                        
                        // Validate passwords match
                        if (password !== confirmPassword) {
                            showMessage('Passwords do not match', 'error');
                            return;
                        }
                        
                        // Disable form
                        submitBtn.disabled = true;
                        submitBtn.textContent = 'Resetting...';
                        spinner.style.display = 'block';
                        message.style.display = 'none';
                        
                        try {
                            const response = await fetch('/auth/password/reset', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({ token, password })
                            });
                            
                            const data = await response.json();
                            
                            if (response.ok) {
                                showMessage('✅ Password reset successful! You can now log in with your new password.', 'success');
                                form.style.display = 'none';
                            } else {
                                showMessage(data.message || 'Failed to reset password. The link may have expired.', 'error');
                                submitBtn.disabled = false;
                                submitBtn.textContent = 'Reset Password';
                            }
                        } catch (error) {
                            showMessage('Network error. Please try again.', 'error');
                            submitBtn.disabled = false;
                            submitBtn.textContent = 'Reset Password';
                        } finally {
                            spinner.style.display = 'none';
                        }
                    });
                </script>
            </body>
            </html>
        `);
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

    /**
     * Delete current user account
     * DELETE /auth/me
     */
    static async deleteAccount(req, res) {
        const accountId = req.claims.id; // Get from JWT claims
        
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            
            // Delete from Account_Credential first (foreign key constraint)
            await client.query(
                'DELETE FROM Account_Credential WHERE Account_ID = $1',
                [accountId]
            );
            
            // Delete verification records
            await client.query(
                'DELETE FROM Email_Verification WHERE Account_ID = $1',
                [accountId]
            );
            await client.query(
                'DELETE FROM Phone_Verification WHERE Account_ID = $1',
                [accountId]
            );
            
            // Finally delete the account
            const result = await client.query(
                'DELETE FROM Account WHERE Account_ID = $1 RETURNING Email, Username',
                [accountId]
            );
            
            await client.query('COMMIT');
            
            if (result.rows.length === 0) {
                return sendError(res, 404, 'Account not found');
            }
            
            sendSuccess(res, {
                message: 'Account deleted successfully',
                email: result.rows[0].email,
                username: result.rows[0].username
            });
            
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Delete account error:', error);
            sendError(res, 500, 'Failed to delete account');
        } finally {
            client.release();
        }
    }
}

module.exports = AuthController;
