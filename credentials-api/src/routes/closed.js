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
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current user
 *     description: Returns authenticated user's information
 *     tags: [User]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User information retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *             example:
 *               success: true
 *               user:
 *                 id: 1
 *                 email: "user@example.com"
 *                 username: "johndoe"
 *                 firstname: "John"
 *                 lastname: "Doe"
 *                 role: 1
 *                 email_verified: true
 *                 phone_verified: false
 *                 phone: null
 *                 created_at: "2024-01-15T10:30:00.000Z"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error: "Unauthorized"
 *               details: "Invalid or missing JWT token"
 */
router.get('/auth/me', AuthController.getCurrentUser);

/**
 * @swagger
 * /auth/me:
 *   delete:
 *     summary: Delete account
 *     description: Permanently delete the authenticated user's account and all associated data
 *     tags: [User]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Account deleted successfully
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
 *                   example: Account deleted successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: Account deleted successfully
 *                     email:
 *                       type: string
 *                       example: user@example.com
 *                     username:
 *                       type: string
 *                       example: johndoe
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Account not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete('/auth/me', AuthController.deleteAccount);

/**
 * @swagger
 * /auth/user/password/change:
 *   post:
 *     summary: Change password
 *     description: Change user password (requires current password and JWT)
 *     tags: [User]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PasswordChange'
 *           example:
 *             currentPassword: "OldPassword123!"
 *             newPassword: "NewSecurePassword123!"
 *     responses:
 *       200:
 *         description: Password changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               message: "Password changed successfully"
 *       400:
 *         description: Invalid current password or validation failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error: "Bad Request"
 *               details: "Current password is incorrect"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error: "Unauthorized"
 *               details: "Invalid or missing JWT token"
 */
router.post('/auth/user/password/change', validatePasswordChange, AuthController.changePassword);

// ===== VERIFICATION ROUTES =====

/**
 * @swagger
 * /auth/verify/phone/send:
 *   post:
 *     summary: Send SMS verification code
 *     description: Send 6-digit verification code via SMS to phone number
 *     tags: [Verification]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PhoneVerifySend'
 *           example:
 *             phone: "5551234567"
 *             carrier: "verizon"
 *     responses:
 *       200:
 *         description: SMS sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               message: "Verification code sent via SMS"
 *       400:
 *         description: Invalid phone or carrier
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error: "Bad Request"
 *               details: "Invalid phone number format"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error: "Unauthorized"
 *               details: "Invalid or missing JWT token"
 */
router.post('/auth/verify/phone/send', validatePhoneSend, VerificationController.sendSMSVerification);

/**
 * @swagger
 * /auth/verify/phone/verify:
 *   post:
 *     summary: Verify SMS code
 *     description: Verify phone number using 6-digit code from SMS
 *     tags: [Verification]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PhoneVerifyCode'
 *           example:
 *             code: "123456"
 *     responses:
 *       200:
 *         description: Phone verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               message: "Phone verified successfully"
 *       400:
 *         description: Invalid or expired code
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error: "Bad Request"
 *               details: "Invalid or expired verification code"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error: "Unauthorized"
 *               details: "Invalid or missing JWT token"
 */
router.post('/auth/verify/phone/verify', validatePhoneVerify, VerificationController.verifySMSCode);

/**
 * @swagger
 * /auth/verify/email/send:
 *   post:
 *     summary: Send email verification
 *     description: Send verification email to user's registered email address
 *     tags: [Verification]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Verification email sent
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               message: "Verification email sent"
 *       400:
 *         description: Email already verified
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error: "Bad Request"
 *               details: "Email is already verified"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error: "Unauthorized"
 *               details: "Invalid or missing JWT token"
 */
router.post('/auth/verify/email/send', VerificationController.sendEmailVerification);

module.exports = router;
