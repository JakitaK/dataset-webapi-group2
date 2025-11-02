// credentials-api/src/controllers/index.js
// Central export for all controllers

const AuthController = require('./authController');
const VerificationController = require('./verificationController');
const AdminController = require('./adminController');

module.exports = {
    AuthController,
    VerificationController,
    AdminController
};
