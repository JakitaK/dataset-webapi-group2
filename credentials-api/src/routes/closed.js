// credentials-api/src/routes/closed.js
// Protected routes - requires JWT authentication

const express = require('express');
const { AuthController, VerificationController } = require('../controllers');
const {
    checkToken,
    validatePasswordChange,
    validatePhoneSend,
    validatePhoneVerify
} = require('../middleware');

const router = express.Router();

// Apply JWT authentication to ALL routes in this router
router.use(checkToken);

// ===== AUTHENTICATED USER ROUTES =====

/**
 * Get current user information
 * GET /auth/me
 */
router.get('/auth/me', AuthController.getCurrentUser);

/**
 * Change password (requires authentication and old password)
 * POST /auth/user/password/change
 */
router.post('/auth/user/password/change', validatePasswordChange, AuthController.changePassword);

// ===== VERIFICATION ROUTES =====

/**
 * Send SMS verification code
 * POST /auth/verify/phone/send
 */
router.post('/auth/verify/phone/send', validatePhoneSend, VerificationController.sendSMSVerification);

/**
 * Verify SMS code
 * POST /auth/verify/phone/verify
 */
router.post('/auth/verify/phone/verify', validatePhoneVerify, VerificationController.verifySMSCode);

/**
 * Send email verification
 * POST /auth/verify/email/send
 */
router.post('/auth/verify/email/send', VerificationController.sendEmailVerification);

module.exports = router;
