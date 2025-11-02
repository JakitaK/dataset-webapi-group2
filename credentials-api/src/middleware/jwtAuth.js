// credentials-api/src/middleware/jwtAuth.js
// JWT authentication middleware

const { verifyToken } = require('../utilities/tokenUtils');
const { sendError } = require('../utilities');

/**
 * Middleware to check and verify JWT token
 * Extracts token from Authorization header and validates it
 * Adds decoded claims to request.claims for use in controllers
 */
function checkToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    
    if (!authHeader) {
        return sendError(res, 401, 'No authorization token provided');
    }
    
    // Extract token from "Bearer <token>" format
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return sendError(res, 401, 'Invalid authorization header format. Use: Bearer <token>');
    }
    
    const token = parts[1];
    
    // Verify token
    const decoded = verifyToken(token);
    if (!decoded) {
        return sendError(res, 401, 'Invalid or expired token');
    }
    
    // Add claims to request for use in controllers
    req.claims = decoded;
    
    next();
}

/**
 * Middleware to check if user has required role
 * Must be used after checkToken middleware
 * 
 * @param {number} minimumRole - Minimum role level required (1=User, 2=Moderator, 3=Admin, etc.)
 */
function requireRole(minimumRole) {
    return (req, res, next) => {
        if (!req.claims) {
            return sendError(res, 401, 'Authentication required');
        }
        
        if (req.claims.role < minimumRole) {
            return sendError(res, 403, 'Insufficient permissions');
        }
        
        next();
    };
}

/**
 * Middleware to check if user is admin (role >= 3)
 */
function requireAdmin(req, res, next) {
    return requireRole(3)(req, res, next);
}

module.exports = {
    checkToken,
    requireRole,
    requireAdmin
};
