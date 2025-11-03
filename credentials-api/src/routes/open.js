// credentials-api/src/routes/open.js
// Public routes - no authentication required

const express = require('express');
const { AuthController, VerificationController } = require('../controllers');
const {
    validateLogin,
    validateRegister,
    validatePasswordResetRequest,
    validatePasswordReset
} = require('../middleware');

const router = express.Router();

// ===== ROOT / WELCOME =====

/**
 * @swagger
 * /:
 *   get:
 *     summary: API welcome and information
 *     description: Returns API information and list of available endpoints
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API information
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               message: "Credentials API"
 *               version: "1.0.0"
 *               endpoints:
 *                 public:
 *                   - "POST /auth/register"
 *                   - "POST /auth/login"
 *                   - "POST /auth/password/reset/request"
 *                   - "POST /auth/password/reset"
 *                   - "GET /auth/verify/email/:token"
 *                   - "GET /auth/carriers"
 *                   - "GET /health"
 *                 protected:
 *                   - "GET /auth/me (requires JWT)"
 *                   - "POST /auth/password/change (requires JWT)"
 *                   - "POST /auth/verify/email/send (requires JWT)"
 *                   - "POST /auth/verify/phone/send (requires JWT)"
 *                   - "POST /auth/verify/phone/verify (requires JWT)"
 *               documentation: "https://github.com/JakitaK/dataset-webapi-group2"
 */
router.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Credentials API',
        version: '1.0.0',
        endpoints: {
            public: [
                'POST /auth/register',
                'POST /auth/login',
                'POST /auth/password/reset/request',
                'POST /auth/password/reset',
                'GET /auth/verify/email/:token',
                'GET /auth/carriers',
                'GET /health'
            ],
            protected: [
                'GET /auth/me (requires JWT)',
                'POST /auth/password/change (requires JWT)',
                'POST /auth/verify/email/send (requires JWT)',
                'POST /auth/verify/phone/send (requires JWT)',
                'POST /auth/verify/phone/verify (requires JWT)'
            ]
        },
        documentation: 'https://github.com/JakitaK/dataset-webapi-group2'
    });
});

// ===== AUTHENTICATION ROUTES =====

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: User login
 *     description: Authenticate user with email and password, returns JWT token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *           example:
 *             email: "user@example.com"
 *             password: "SecurePassword123!"
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *             example:
 *               success: true
 *               message: "Login successful"
 *               token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGUiOjEsImlhdCI6MTcwOTMyMTYwMCwiZXhwIjoxNzA5NDA4MDAwfQ.dGVzdFRva2VuU2lnbmF0dXJl"
 *               user:
 *                 id: 1
 *                 email: "user@example.com"
 *                 username: "johndoe"
 *                 firstname: "John"
 *                 lastname: "Doe"
 *                 role: 1
 *                 email_verified: true
 *                 phone_verified: false
 *       400:
 *         description: Invalid email or password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error: "Bad Request"
 *               details: "Invalid email format"
 *       401:
 *         description: Authentication failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error: "Unauthorized"
 *               details: "Invalid email or password"
 */
router.post('/auth/login', validateLogin, AuthController.login);

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register new user
 *     description: Create a new user account with basic role (role=1)
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *           example:
 *             firstname: "John"
 *             lastname: "Doe"
 *             email: "johndoe@example.com"
 *             username: "johndoe"
 *             password: "SecurePassword123!"
 *     responses:
 *       201:
 *         description: Registration successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *             example:
 *               success: true
 *               message: "Registration successful"
 *               token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsInJvbGUiOjEsImlhdCI6MTcwOTMyMTYwMCwiZXhwIjoxNzA5NDA4MDAwfQ.dGVzdFRva2VuU2lnbmF0dXJl"
 *               user:
 *                 id: 2
 *                 email: "johndoe@example.com"
 *                 username: "johndoe"
 *                 firstname: "John"
 *                 lastname: "Doe"
 *                 role: 1
 *                 email_verified: false
 *                 phone_verified: false
 *       400:
 *         description: Invalid input or validation failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error: "Bad Request"
 *               details: "Password must be at least 8 characters"
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
router.post('/auth/register', validateRegister, AuthController.register);

// ===== PASSWORD RESET ROUTES =====

/**
 * @swagger
 * /auth/password/reset-request:
 *   post:
 *     summary: Request password reset
 *     description: Send password reset email to verified email address
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PasswordResetRequest'
 *           example:
 *             email: "user@example.com"
 *     responses:
 *       200:
 *         description: Reset email sent
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               message: "Password reset email sent"
 *       400:
 *         description: Email not verified or user not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error: "Bad Request"
 *               details: "Email address is not verified"
 */
router.post('/auth/password/reset-request', validatePasswordResetRequest, AuthController.requestPasswordReset);

/**
 * @swagger
 * /auth/password/reset:
 *   post:
 *     summary: Reset password with token
 *     description: Reset password using token from email
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PasswordReset'
 *           example:
 *             token: "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
 *             newPassword: "NewSecurePassword123!"
 *     responses:
 *       200:
 *         description: Password reset successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               message: "Password reset successful"
 *       400:
 *         description: Invalid or expired token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error: "Bad Request"
 *               details: "Invalid or expired reset token"
 */
router.post('/auth/password/reset', validatePasswordReset, AuthController.resetPassword);

// ===== VERIFICATION ROUTES =====

/**
 * @swagger
 * /auth/verify/carriers:
 *   get:
 *     summary: Get SMS carriers
 *     description: Returns list of supported SMS carriers for phone verification
 *     tags: [Verification]
 *     responses:
 *       200:
 *         description: List of carriers
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 carriers:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Carrier'
 *             example:
 *               success: true
 *               carriers:
 *                 - id: "att"
 *                   name: "AT&T"
 *                   domain: "txt.att.net"
 *                 - id: "tmobile"
 *                   name: "T-Mobile"
 *                   domain: "tmomail.net"
 *                 - id: "verizon"
 *                   name: "Verizon"
 *                   domain: "vtext.com"
 *                 - id: "sprint"
 *                   name: "Sprint"
 *                   domain: "messaging.sprintpcs.com"
 */
router.get('/auth/verify/carriers', VerificationController.getCarriers);

/**
 * @swagger
 * /auth/verify/email/confirm:
 *   get:
 *     summary: Confirm email verification
 *     description: Verify email address using token from verification email (no auth required)
 *     tags: [Verification]
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Email verification token from email link
 *         example: "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0"
 *     responses:
 *       200:
 *         description: Email verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               message: "Email verified successfully"
 *       400:
 *         description: Invalid or expired token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error: "Bad Request"
 *               details: "Invalid or expired verification token"
 */
router.get('/auth/verify/email/confirm', VerificationController.confirmEmailVerification);

// ===== HEALTH CHECK =====

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check
 *     description: Check if API is running and responsive
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: 'Credentials API is running'
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 service:
 *                   type: string
 *                   example: 'credentials-api'
 */
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Credentials API is running',
        timestamp: new Date().toISOString(),
        service: 'credentials-api'
    });
});

module.exports = router;
