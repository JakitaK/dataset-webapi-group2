// credentials-api/src/middleware/index.js
// Central export for all middleware

const jwtAuth = require('./jwtAuth');
const validation = require('./validation');

module.exports = {
    // JWT authentication
    ...jwtAuth,
    
    // Validation
    ...validation
};
