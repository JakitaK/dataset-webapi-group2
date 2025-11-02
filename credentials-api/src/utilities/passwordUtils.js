// credentials-api/src/utilities/passwordUtils.js
// Password hashing and validation utilities using bcrypt

const crypto = require('crypto');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

/**
 * Generate a random salt for password hashing
 * @returns {string} Hex-encoded salt
 */
function generateSalt() {
    return crypto.randomBytes(16).toString('hex');
}

/**
 * Hash a password with a given salt using bcrypt
 * @param {string} password - Plain text password
 * @param {string} salt - Salt to use for hashing
 * @returns {string} Bcrypt hash
 */
function generateHash(password, salt) {
    // Combine password with salt before hashing
    const saltedPassword = password + salt;
    return bcrypt.hashSync(saltedPassword, SALT_ROUNDS);
}

/**
 * Verify a password against a stored hash and salt
 * @param {string} password - Plain text password to verify
 * @param {string} salt - Stored salt
 * @param {string} storedHash - Stored bcrypt hash
 * @returns {boolean} True if password matches
 */
function verifyPassword(password, salt, storedHash) {
    const saltedPassword = password + salt;
    return bcrypt.compareSync(saltedPassword, storedHash);
}

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {object} { valid: boolean, error: string|null }
 */
function validatePassword(password) {
    if (!password || password.length < 8) {
        return { valid: false, error: 'Password must be at least 8 characters long' };
    }
    
    if (password.length > 128) {
        return { valid: false, error: 'Password must be less than 128 characters' };
    }
    
    // Check for uppercase letter
    if (!/[A-Z]/.test(password)) {
        return { valid: false, error: 'Password must contain at least one uppercase letter' };
    }
    
    // Check for lowercase letter
    if (!/[a-z]/.test(password)) {
        return { valid: false, error: 'Password must contain at least one lowercase letter' };
    }
    
    // Check for number
    if (!/[0-9]/.test(password)) {
        return { valid: false, error: 'Password must contain at least one number' };
    }
    
    // Check for special character
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        return { valid: false, error: 'Password must contain at least one special character' };
    }
    
    return { valid: true, error: null };
}

module.exports = {
    generateSalt,
    generateHash,
    verifyPassword,
    validatePassword
};
