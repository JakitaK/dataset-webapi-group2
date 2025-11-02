// credentials-api/src/controllers/adminController.js
// Admin controller - user management for admins (role >= 3)

const pool = require('../db');
const {
    sendSuccess,
    sendError,
    generateHash,
    generateSalt,
    validatePassword
} = require('../utilities');

class AdminController {
    /**
     * Get all users with pagination
     * GET /admin/users
     * Requires: Admin role (3+)
     */
    static async getAllUsers(req, res) {
        try {
            const limit = parseInt(req.query.limit) || 50;
            const offset = parseInt(req.query.offset) || 0;

            // Get total count
            const countResult = await pool.query('SELECT COUNT(*) FROM Account');
            const totalCount = parseInt(countResult.rows[0].count);

            // Get users
            const result = await pool.query(
                `SELECT Account_ID as id, FirstName as firstname, LastName as lastname, 
                        Username, Email, Phone, Account_Role as role, 
                        Email_Verified as emailVerified, Phone_Verified as phoneVerified,
                        Account_Status as status, Created_At as memberSince
                 FROM Account
                 ORDER BY Account_ID
                 LIMIT $1 OFFSET $2`,
                [limit, offset]
            );

            sendSuccess(res, {
                users: result.rows,
                pagination: {
                    total: totalCount,
                    limit,
                    offset,
                    count: result.rows.length
                }
            }, 'Users retrieved successfully');

        } catch (error) {
            console.error('Get all users error:', error);
            sendError(res, 500, 'Failed to retrieve users');
        }
    }

    /**
     * Search users by email, username, name
     * GET /admin/users/search?q=search_term
     * Requires: Admin role (3+)
     */
    static async searchUsers(req, res) {
        try {
            const searchTerm = req.query.q || '';
            
            if (!searchTerm || searchTerm.length < 2) {
                return sendError(res, 400, 'Search term must be at least 2 characters');
            }

            const result = await pool.query(
                `SELECT Account_ID as id, FirstName as firstname, LastName as lastname, 
                        Username, Email, Phone, Account_Role as role, 
                        Email_Verified as emailVerified, Phone_Verified as phoneVerified,
                        Account_Status as status, Created_At as memberSince
                 FROM Account
                 WHERE LOWER(Email) LIKE LOWER($1) 
                    OR LOWER(Username) LIKE LOWER($1)
                    OR LOWER(FirstName) LIKE LOWER($1)
                    OR LOWER(LastName) LIKE LOWER($1)
                 ORDER BY Account_ID
                 LIMIT 50`,
                [`%${searchTerm}%`]
            );

            sendSuccess(res, {
                users: result.rows,
                count: result.rows.length,
                searchTerm
            }, 'Search completed successfully');

        } catch (error) {
            console.error('Search users error:', error);
            sendError(res, 500, 'Failed to search users');
        }
    }

    /**
     * Get user by ID
     * GET /admin/users/:id
     * Requires: Admin role (3+)
     */
    static async getUserById(req, res) {
        try {
            const userId = parseInt(req.params.id);

            if (isNaN(userId)) {
                return sendError(res, 400, 'Invalid user ID');
            }

            const result = await pool.query(
                `SELECT Account_ID as id, FirstName as firstname, LastName as lastname, 
                        Username, Email, Phone, Account_Role as role, 
                        Email_Verified as emailVerified, Phone_Verified as phoneVerified,
                        Account_Status as status, Created_At as memberSince, Updated_At as lastUpdated
                 FROM Account
                 WHERE Account_ID = $1`,
                [userId]
            );

            if (result.rows.length === 0) {
                return sendError(res, 404, 'User not found');
            }

            sendSuccess(res, { user: result.rows[0] }, 'User retrieved successfully');

        } catch (error) {
            console.error('Get user by ID error:', error);
            sendError(res, 500, 'Failed to retrieve user');
        }
    }

    /**
     * Create new user (admin)
     * POST /admin/users
     * Requires: Admin role (3+)
     * Can create users with role <= admin's role
     */
    static async createUser(req, res) {
        try {
            const { firstname, lastname, email, username, password, phone, role } = req.body;
            const adminRole = req.claims.role;
            const userRole = role || 1; // Default to basic user

            // Admins can only create users with role <= their own role
            if (userRole > adminRole) {
                return sendError(res, 403, 'Cannot create user with role higher than your own');
            }

            // Validate password
            const passwordValidation = validatePassword(password);
            if (!passwordValidation.valid) {
                return sendError(res, 400, passwordValidation.message);
            }

            // Check if email or username already exists
            const existingUser = await pool.query(
                'SELECT Account_ID FROM Account WHERE Email = $1 OR Username = $2',
                [email, username]
            );

            if (existingUser.rows.length > 0) {
                return sendError(res, 409, 'Email or username already exists');
            }

            // Generate password hash
            const salt = generateSalt();
            const hash = generateHash(password, salt);

            // Create account
            const accountResult = await pool.query(
                `INSERT INTO Account (FirstName, LastName, Username, Email, Phone, Account_Role)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 RETURNING Account_ID as id, FirstName as firstname, LastName as lastname, 
                           Username, Email, Phone, Account_Role as role`,
                [firstname, lastname, username, email, phone || null, userRole]
            );

            const newUser = accountResult.rows[0];

            // Store credentials
            await pool.query(
                'INSERT INTO Account_Credential (Account_ID, Salted_Hash, Salt) VALUES ($1, $2, $3)',
                [newUser.id, hash, salt]
            );

            sendSuccess(res, { user: newUser }, 'User created successfully', 201);

        } catch (error) {
            console.error('Create user error:', error);
            sendError(res, 500, 'Failed to create user');
        }
    }

    /**
     * Update user information
     * PUT /admin/users/:id
     * Requires: Admin role (3+)
     */
    static async updateUser(req, res) {
        try {
            const userId = parseInt(req.params.id);
            const { firstname, lastname, username, email, phone, status } = req.body;

            if (isNaN(userId)) {
                return sendError(res, 400, 'Invalid user ID');
            }

            // Check if user exists
            const userCheck = await pool.query('SELECT Account_ID FROM Account WHERE Account_ID = $1', [userId]);
            if (userCheck.rows.length === 0) {
                return sendError(res, 404, 'User not found');
            }

            // Build update query dynamically
            const updates = [];
            const values = [];
            let paramCount = 1;

            if (firstname) {
                updates.push(`FirstName = $${paramCount++}`);
                values.push(firstname);
            }
            if (lastname) {
                updates.push(`LastName = $${paramCount++}`);
                values.push(lastname);
            }
            if (username) {
                updates.push(`Username = $${paramCount++}`);
                values.push(username);
            }
            if (email) {
                updates.push(`Email = $${paramCount++}`);
                values.push(email);
            }
            if (phone) {
                updates.push(`Phone = $${paramCount++}`);
                values.push(phone);
            }
            if (status) {
                updates.push(`Account_Status = $${paramCount++}`);
                values.push(status);
            }

            if (updates.length === 0) {
                return sendError(res, 400, 'No fields to update');
            }

            updates.push(`Updated_At = CURRENT_TIMESTAMP`);
            values.push(userId);

            const result = await pool.query(
                `UPDATE Account 
                 SET ${updates.join(', ')}
                 WHERE Account_ID = $${paramCount}
                 RETURNING Account_ID as id, FirstName as firstname, LastName as lastname, 
                           Username, Email, Phone, Account_Role as role, Account_Status as status`,
                values
            );

            sendSuccess(res, { user: result.rows[0] }, 'User updated successfully');

        } catch (error) {
            console.error('Update user error:', error);
            if (error.code === '23505') { // Unique violation
                return sendError(res, 409, 'Email or username already exists');
            }
            sendError(res, 500, 'Failed to update user');
        }
    }

    /**
     * Delete user
     * DELETE /admin/users/:id
     * Requires: Admin role (3+)
     * Cannot delete users with role >= your role
     */
    static async deleteUser(req, res) {
        try {
            const userId = parseInt(req.params.id);
            const adminRole = req.claims.role;

            if (isNaN(userId)) {
                return sendError(res, 400, 'Invalid user ID');
            }

            // Get user to check role
            const userResult = await pool.query(
                'SELECT Account_Role as role, Email, Username FROM Account WHERE Account_ID = $1',
                [userId]
            );

            if (userResult.rows.length === 0) {
                return sendError(res, 404, 'User not found');
            }

            const targetUser = userResult.rows[0];

            // Admins can only delete users with role < their own role
            if (targetUser.role >= adminRole) {
                return sendError(res, 403, 'Cannot delete user with equal or higher role');
            }

            // Delete user (CASCADE will delete credentials and verification records)
            await pool.query('DELETE FROM Account WHERE Account_ID = $1', [userId]);

            sendSuccess(res, {
                message: 'User deleted successfully',
                email: targetUser.email,
                username: targetUser.username
            });

        } catch (error) {
            console.error('Delete user error:', error);
            sendError(res, 500, 'Failed to delete user');
        }
    }

    /**
     * Change user role
     * PUT /admin/users/:id/role
     * Requires: Admin role (3+)
     * Can only assign roles <= your own role
     */
    static async changeUserRole(req, res) {
        try {
            const userId = parseInt(req.params.id);
            const { role } = req.body;
            const adminRole = req.claims.role;

            if (isNaN(userId) || !role) {
                return sendError(res, 400, 'Invalid user ID or role');
            }

            const newRole = parseInt(role);
            if (isNaN(newRole) || newRole < 1 || newRole > 5) {
                return sendError(res, 400, 'Role must be between 1 and 5');
            }

            // Admins can only assign roles <= their own role
            if (newRole > adminRole) {
                return sendError(res, 403, 'Cannot assign role higher than your own');
            }

            // Get current user info
            const userResult = await pool.query(
                'SELECT Account_Role as role, Email FROM Account WHERE Account_ID = $1',
                [userId]
            );

            if (userResult.rows.length === 0) {
                return sendError(res, 404, 'User not found');
            }

            const currentRole = userResult.rows[0].role;

            // Admins can only modify users with role < their own
            if (currentRole >= adminRole) {
                return sendError(res, 403, 'Cannot modify user with equal or higher role');
            }

            // Update role
            const result = await pool.query(
                `UPDATE Account 
                 SET Account_Role = $1, Updated_At = CURRENT_TIMESTAMP
                 WHERE Account_ID = $2
                 RETURNING Account_ID as id, Email, Username, Account_Role as role`,
                [newRole, userId]
            );

            sendSuccess(res, {
                user: result.rows[0],
                previousRole: currentRole,
                newRole: newRole
            }, 'User role updated successfully');

        } catch (error) {
            console.error('Change user role error:', error);
            sendError(res, 500, 'Failed to change user role');
        }
    }

    /**
     * Reset user password (admin)
     * PUT /admin/users/:id/password
     * Requires: Admin role (3+)
     */
    static async resetUserPassword(req, res) {
        try {
            const userId = parseInt(req.params.id);
            const { newPassword } = req.body;
            const adminRole = req.claims.role;

            if (isNaN(userId)) {
                return sendError(res, 400, 'Invalid user ID');
            }

            // Validate password
            const passwordValidation = validatePassword(newPassword);
            if (!passwordValidation.valid) {
                return sendError(res, 400, passwordValidation.message);
            }

            // Get user info
            const userResult = await pool.query(
                'SELECT Account_Role as role FROM Account WHERE Account_ID = $1',
                [userId]
            );

            if (userResult.rows.length === 0) {
                return sendError(res, 404, 'User not found');
            }

            const targetRole = userResult.rows[0].role;

            // Admins can only reset passwords for users with role < their own
            if (targetRole >= adminRole) {
                return sendError(res, 403, 'Cannot reset password for user with equal or higher role');
            }

            // Generate new password hash
            const salt = generateSalt();
            const hash = generateHash(newPassword, salt);

            // Update password
            await pool.query(
                `UPDATE Account_Credential 
                 SET Salted_Hash = $1, Salt = $2, Updated_At = CURRENT_TIMESTAMP
                 WHERE Account_ID = $3`,
                [hash, salt, userId]
            );

            sendSuccess(res, { message: 'Password reset successfully' });

        } catch (error) {
            console.error('Reset user password error:', error);
            sendError(res, 500, 'Failed to reset password');
        }
    }

    /**
     * Get dashboard statistics
     * GET /admin/users/stats/dashboard
     * Requires: Admin role (3+)
     */
    static async getDashboardStats(req, res) {
        try {
            // Get total users
            const totalResult = await pool.query('SELECT COUNT(*) as count FROM Account');
            const total = parseInt(totalResult.rows[0].count);

            // Get users by role
            const roleResult = await pool.query(
                `SELECT Account_Role as role, COUNT(*) as count 
                 FROM Account 
                 GROUP BY Account_Role 
                 ORDER BY Account_Role`
            );

            // Get verification stats
            const verifiedResult = await pool.query(
                `SELECT 
                    COUNT(*) FILTER (WHERE Email_Verified = true) as emailVerified,
                    COUNT(*) FILTER (WHERE Phone_Verified = true) as phoneVerified,
                    COUNT(*) FILTER (WHERE Email_Verified = true AND Phone_Verified = true) as fullyVerified
                 FROM Account`
            );

            // Get users by status
            const statusResult = await pool.query(
                `SELECT Account_Status as status, COUNT(*) as count 
                 FROM Account 
                 GROUP BY Account_Status`
            );

            // Get recent registrations (last 30 days)
            const recentResult = await pool.query(
                `SELECT COUNT(*) as count 
                 FROM Account 
                 WHERE Created_At > NOW() - INTERVAL '30 days'`
            );

            sendSuccess(res, {
                totalUsers: total,
                byRole: roleResult.rows,
                verification: verifiedResult.rows[0],
                byStatus: statusResult.rows,
                recentRegistrations: parseInt(recentResult.rows[0].count)
            }, 'Dashboard statistics retrieved successfully');

        } catch (error) {
            console.error('Get dashboard stats error:', error);
            sendError(res, 500, 'Failed to retrieve statistics');
        }
    }
}

module.exports = AdminController;
