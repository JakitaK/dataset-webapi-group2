// credentials-api/src/controllers/index.js
// Central export for all controllers

const AuthController = require('./authController');
const VerificationController = require('./verificationController');

module.exports = {
    AuthController,
    VerificationController
};
