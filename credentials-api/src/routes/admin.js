// credentials-api/src/routes/admin.js
// Admin routes - requires admin role (role >= 3)

const express = require('express');
const { AdminController } = require('../controllers');
const { checkToken, requireRole } = require('../middleware');

const router = express.Router();

// Apply JWT authentication to ALL admin routes
router.use(checkToken);

// Apply admin role requirement (role >= 3) to ALL admin routes
router.use(requireRole(3));

// ===== USER MANAGEMENT ROUTES =====

/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: Get all users (Admin)
 *     description: Retrieve paginated list of all users
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *           minimum: 1
 *           maximum: 100
 *         description: Number of users per page
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *           minimum: 0
 *         description: Number of users to skip
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     users:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/User'
 *                     pagination:
 *                       type: object
 *             example:
 *               success: true
 *               message: "Retrieved 2 users"
 *               data:
 *                 users:
 *                   - id: 1
 *                     email: "admin@example.com"
 *                     username: "adminuser"
 *                     firstname: "Admin"
 *                     lastname: "User"
 *                     role: 3
 *                     email_verified: true
 *                     phone_verified: false
 *                   - id: 2
 *                     email: "user@example.com"
 *                     username: "johndoe"
 *                     firstname: "John"
 *                     lastname: "Doe"
 *                     role: 1
 *                     email_verified: true
 *                     phone_verified: false
 *                 pagination:
 *                   limit: 50
 *                   offset: 0
 *                   totalCount: 2
 *                   hasNext: false
 *                   hasPrevious: false
 *       403:
 *         description: Insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error: "Forbidden"
 *               details: "Admin role required"
 */
router.get('/admin/users', AdminController.getAllUsers);

/**
 * @swagger
 * /admin/users/search:
 *   get:
 *     summary: Search users (Admin)
 *     description: Search users by email, username, or name
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           minimum: 2
 *         description: Search term (min 2 characters)
 *     responses:
 *       200:
 *         description: Search completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     users:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/User'
 *             example:
 *               success: true
 *               message: "Found 1 user matching \"john\""
 *               data:
 *                 users:
 *                   - id: 2
 *                     email: "john@example.com"
 *                     username: "johndoe"
 *                     firstname: "John"
 *                     lastname: "Doe"
 *                     role: 1
 *                     email_verified: true
 *                     phone_verified: false
 *       400:
 *         description: Invalid search term
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error: "Bad Request"
 *               details: "Search term must be at least 2 characters"
 *       403:
 *         description: Insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error: "Forbidden"
 *               details: "Admin role required"
 */
router.get('/admin/users/search', AdminController.searchUsers);

/**
 * @swagger
 * /admin/users/stats/dashboard:
 *   get:
 *     summary: Get dashboard statistics (Admin)
 *     description: Retrieve system statistics for admin dashboard
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *             example:
 *               success: true
 *               message: "Dashboard statistics retrieved"
 *               data:
 *                 totalUsers: 150
 *                 activeUsers: 120
 *                 verifiedEmails: 100
 *                 verifiedPhones: 45
 *                 usersByRole:
 *                   basic: 130
 *                   moderator: 15
 *                   admin: 5
 *       403:
 *         description: Insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error: "Forbidden"
 *               details: "Admin role required"
 */
router.get('/admin/users/stats/dashboard', AdminController.getDashboardStats);

/**
 * @swagger
 * /admin/users/{id}:
 *   get:
 *     summary: Get user by ID (Admin)
 *     description: Retrieve detailed information for a specific user
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *         example: 2
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *             example:
 *               success: true
 *               message: "User retrieved successfully"
 *               data:
 *                 user:
 *                   id: 2
 *                   email: "user@example.com"
 *                   username: "johndoe"
 *                   firstname: "John"
 *                   lastname: "Doe"
 *                   role: 1
 *                   email_verified: true
 *                   phone_verified: false
 *                   created_at: "2024-01-15T10:30:00.000Z"
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error: "Not Found"
 *               details: "User not found"
 *       403:
 *         description: Insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error: "Forbidden"
 *               details: "Admin role required"
 */
router.get('/admin/users/:id', AdminController.getUserById);

/**
 * @swagger
 * /admin/users:
 *   post:
 *     summary: Create new user (Admin)
 *     description: Create a new user account with specified role
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstname
 *               - lastname
 *               - email
 *               - username
 *               - password
 *             properties:
 *               firstname:
 *                 type: string
 *               lastname:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *                 format: password
 *               phone:
 *                 type: string
 *               role:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 default: 1
 *                 description: User role (1=User, 2=Moderator, 3=Admin, 4=SuperAdmin, 5=Owner)
 *           example:
 *             firstname: "Jane"
 *             lastname: "Smith"
 *             email: "jane.smith@example.com"
 *             username: "janesmith"
 *             password: "SecurePassword123!"
 *             role: 2
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *             example:
 *               success: true
 *               message: "User created successfully"
 *               data:
 *                 user:
 *                   id: 3
 *                   email: "jane.smith@example.com"
 *                   username: "janesmith"
 *                   firstname: "Jane"
 *                   lastname: "Smith"
 *                   role: 2
 *       403:
 *         description: Cannot create user with higher role
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error: "Forbidden"
 *               details: "Cannot create user with role higher than your own"
 *       409:
 *         description: Email or username already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error: "Conflict"
 *               details: "Email already registered"
 */
router.post('/admin/users', AdminController.createUser);

/**
 * @swagger
 * /admin/users/{id}:
 *   put:
 *     summary: Update user information (Admin)
 *     description: Update user's basic information
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstname:
 *                 type: string
 *               lastname:
 *                 type: string
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [pending, active, suspended, locked]
 *           example:
 *             firstname: "John"
 *             lastname: "Smith"
 *             status: "active"
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *             example:
 *               success: true
 *               message: "User updated successfully"
 *               data:
 *                 user:
 *                   id: 2
 *                   email: "user@example.com"
 *                   username: "johndoe"
 *                   firstname: "John"
 *                   lastname: "Smith"
 *                   role: 1
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error: "Not Found"
 *               details: "User not found"
 *       403:
 *         description: Insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error: "Forbidden"
 *               details: "Admin role required"
 */
router.put('/admin/users/:id', AdminController.updateUser);

/**
 * @swagger
 * /admin/users/{id}:
 *   delete:
 *     summary: Delete user (Admin)
 *     description: Permanently delete a user account
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *         example: 2
 *     responses:
 *       200:
 *         description: User deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *             example:
 *               success: true
 *               message: "User deleted successfully"
 *               data:
 *                 user_id: 2
 *       403:
 *         description: Cannot delete user with equal or higher role
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error: "Forbidden"
 *               details: "Cannot delete user with equal or higher role"
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error: "Not Found"
 *               details: "User not found"
 */
router.delete('/admin/users/:id', AdminController.deleteUser);

/**
 * @swagger
 * /admin/users/{id}/role:
 *   put:
 *     summary: Change user role (Admin)
 *     description: Update a user's role level
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: New role (1=User, 2=Moderator, 3=Admin, 4=SuperAdmin, 5=Owner)
 *           example:
 *             role: 2
 *     responses:
 *       200:
 *         description: Role updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *             example:
 *               success: true
 *               message: "User role updated successfully"
 *               data:
 *                 user:
 *                   id: 2
 *                   email: "user@example.com"
 *                   username: "johndoe"
 *                   role: 2
 *       403:
 *         description: Cannot assign role higher than your own
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error: "Forbidden"
 *               details: "Cannot assign role higher than your own"
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error: "Not Found"
 *               details: "User not found"
 */
router.put('/admin/users/:id/role', AdminController.changeUserRole);

/**
 * @swagger
 * /admin/users/{id}/password:
 *   put:
 *     summary: Reset user password (Admin)
 *     description: Reset a user's password (admin override)
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newPassword
 *             properties:
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 description: New password for the user
 *           example:
 *             newPassword: "NewSecurePassword123!"
 *     responses:
 *       200:
 *         description: Password reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *             example:
 *               success: true
 *               message: "Password reset successfully"
 *               data:
 *                 user_id: 2
 *       403:
 *         description: Cannot reset password for user with equal or higher role
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error: "Forbidden"
 *               details: "Cannot reset password for user with equal or higher role"
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error: "Not Found"
 *               details: "User not found"
 */
router.put('/admin/users/:id/password', AdminController.resetUserPassword);

module.exports = router;
