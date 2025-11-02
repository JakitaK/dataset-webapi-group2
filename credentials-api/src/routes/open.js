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
 * Root endpoint - API information
 * GET /
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
 * Authenticate user and return JWT token
 * POST /auth/login
 */
router.post('/auth/login', validateLogin, AuthController.login);

/**
 * Register a new user (always creates basic user with role 1)
 * POST /auth/register
 */
router.post('/auth/register', validateRegister, AuthController.register);

// ===== PASSWORD RESET ROUTES =====

/**
 * Request password reset (requires verified email)
 * POST /auth/password/reset-request
 */
router.post('/auth/password/reset-request', validatePasswordResetRequest, AuthController.requestPasswordReset);

/**
 * Reset password with token
 * POST /auth/password/reset
 */
router.post('/auth/password/reset', validatePasswordReset, AuthController.resetPassword);

// ===== VERIFICATION ROUTES =====

/**
 * Get list of supported carriers
 * GET /auth/verify/carriers
 */
router.get('/auth/verify/carriers', VerificationController.getCarriers);

/**
 * Verify email token (can be accessed via link without authentication)
 * GET /auth/verify/email/confirm?token=xxx
 */
router.get('/auth/verify/email/confirm', VerificationController.confirmEmailVerification);

// ===== TESTING ROUTES =====

/**
 * Welcome/root endpoint
 * GET /
 */
router.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Welcome to Credentials API',
        version: '1.0.0',
        service: 'credentials-api',
        endpoints: {
            public: [
                'POST /auth/register',
                'POST /auth/login',
                'POST /auth/password/reset-request',
                'POST /auth/password/reset',
                'GET /auth/verify/email/confirm?token=xxx',
                'GET /auth/verify/carriers',
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
        documentation: 'See API documentation for request/response schemas'
    });
});

/**
 * Simple health check endpoint
 * GET /health
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
