// credentials-api/src/utilities/tokenUtils.js
// JWT token generation and validation utilities

const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Token expiry constants
const JWT_EXPIRY = '14d';           // Access token: 14 days
const JWT_RESET_EXPIRY = '1h';      // Password reset token: 1 hour

/**
 * Generate a JWT access token for authenticated user
 * @param {object} payload - { id, email, role }
 * @returns {string} JWT token
 */
function generateAccessToken(payload) {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
        throw new Error('JWT_SECRET not configured');
    }
    
    return jwt.sign(
        {
            id: payload.id,
            email: payload.email,
            role: payload.role
        },
        jwtSecret,
        { expiresIn: JWT_EXPIRY }
    );
}

/**
 * Generate a password reset token (short-lived)
 * @param {number} accountId - User account ID
 * @param {string} email - User email
 * @returns {string} JWT token for password reset
 */
function generatePasswordResetToken(accountId, email) {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
        throw new Error('JWT_SECRET not configured');
    }
    
    return jwt.sign(
        {
            id: accountId,
            email: email,
            type: 'password_reset'
        },
        jwtSecret,
        { expiresIn: JWT_RESET_EXPIRY }
    );
}

/**
 * Verify and decode a JWT token
 * @param {string} token - JWT token to verify
 * @returns {object|null} Decoded payload or null if invalid
 */
function verifyToken(token) {
    try {
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            throw new Error('JWT_SECRET not configured');
        }
        
        return jwt.verify(token, jwtSecret);
    } catch (error) {
        return null;
    }
}

/**
 * Generate a cryptographically secure random token
 * Used for email verification tokens
 * @param {number} bytes - Number of random bytes (default: 32)
 * @returns {string} Hex-encoded token
 */
function generateSecureToken(bytes = 32) {
    return crypto.randomBytes(bytes).toString('hex');
}

/**
 * Generate a 6-digit verification code
 * Used for SMS verification
 * @returns {string} 6-digit code
 */
function generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

module.exports = {
    generateAccessToken,
    generatePasswordResetToken,
    verifyToken,
    generateSecureToken,
    generateVerificationCode,
    JWT_EXPIRY,
    JWT_RESET_EXPIRY
};
