// credentials-api/src/middleware/validation.js
// Request validation middleware

const { sendError } = require('../utilities');
const { isValidCarrier } = require('../utilities/smsService');

/**
 * Validate email format
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate phone number (basic - at least 10 digits)
 */
function isValidPhone(phone) {
    const digitsOnly = phone.replace(/\D/g, '');
    return digitsOnly.length >= 10;
}

/**
 * Validate username format (3-50 chars, alphanumeric with underscore/hyphen)
 */
function isValidUsername(username) {
    const usernameRegex = /^[a-zA-Z0-9_-]{3,50}$/;
    return usernameRegex.test(username);
}

/**
 * Middleware: Validate registration request
 */
function validateRegister(req, res, next) {
    const { firstname, lastname, email, password, username, phone } = req.body;
    
    // Check required fields
    if (!firstname || !lastname || !email || !password || !username || !phone) {
        return sendError(res, 400, 'All fields are required: firstname, lastname, email, password, username, phone');
    }
    
    // Validate firstname/lastname length
    if (firstname.length < 1 || firstname.length > 100) {
        return sendError(res, 400, 'First name must be between 1 and 100 characters');
    }
    if (lastname.length < 1 || lastname.length > 100) {
        return sendError(res, 400, 'Last name must be between 1 and 100 characters');
    }
    
    // Validate email
    if (!isValidEmail(email)) {
        return sendError(res, 400, 'Invalid email format');
    }
    
    // Validate username
    if (!isValidUsername(username)) {
        return sendError(res, 400, 'Username must be 3-50 characters and contain only letters, numbers, underscores, and hyphens');
    }
    
    // Validate phone
    if (!isValidPhone(phone)) {
        return sendError(res, 400, 'Phone number must contain at least 10 digits');
    }
    
    // Password validation is done in controller using passwordUtils
    
    next();
}

/**
 * Middleware: Validate login request
 */
function validateLogin(req, res, next) {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return sendError(res, 400, 'Email and password are required');
    }
    
    if (!isValidEmail(email)) {
        return sendError(res, 400, 'Invalid email format');
    }
    
    next();
}

/**
 * Middleware: Validate password reset request
 */
function validatePasswordResetRequest(req, res, next) {
    const { email } = req.body;
    
    if (!email) {
        return sendError(res, 400, 'Email is required');
    }
    
    if (!isValidEmail(email)) {
        return sendError(res, 400, 'Invalid email format');
    }
    
    next();
}

/**
 * Middleware: Validate password reset with token
 */
function validatePasswordReset(req, res, next) {
    const { token, password } = req.body;
    
    if (!token || !password) {
        return sendError(res, 400, 'Token and new password are required');
    }
    
    // Password validation is done in controller using passwordUtils
    
    next();
}

/**
 * Middleware: Validate password change request
 */
function validatePasswordChange(req, res, next) {
    const { oldPassword, newPassword } = req.body;
    
    if (!oldPassword || !newPassword) {
        return sendError(res, 400, 'Old password and new password are required');
    }
    
    if (oldPassword === newPassword) {
        return sendError(res, 400, 'New password must be different from old password');
    }
    
    // Password validation is done in controller using passwordUtils
    
    next();
}

/**
 * Middleware: Validate phone verification code
 */
function validatePhoneVerify(req, res, next) {
    const { code } = req.body;
    
    if (!code) {
        return sendError(res, 400, 'Verification code is required');
    }
    
    if (!/^\d{6}$/.test(code)) {
        return sendError(res, 400, 'Verification code must be exactly 6 digits');
    }
    
    next();
}

/**
 * Middleware: Validate phone send request (optional carrier)
 */
function validatePhoneSend(req, res, next) {
    const { carrier } = req.body;
    
    // Carrier is optional, but if provided must be valid
    if (carrier && !isValidCarrier(carrier)) {
        return sendError(res, 400, 'Invalid carrier. Supported carriers: att, tmobile, verizon, sprint, metropcs, boost, cricket, uscellular');
    }
    
    next();
}

module.exports = {
    validateRegister,
    validateLogin,
    validatePasswordResetRequest,
    validatePasswordReset,
    validatePasswordChange,
    validatePhoneVerify,
    validatePhoneSend
};
