// credentials-api/src/utilities/index.js
// Central export for all utilities

const { sendSuccess, sendError } = require('./responseUtils');
const passwordUtils = require('./passwordUtils');
const tokenUtils = require('./tokenUtils');
const emailService = require('./emailService');
const smsService = require('./smsService');

module.exports = {
    // Response utilities (from shared)
    sendSuccess,
    sendError,
    
    // Password utilities
    ...passwordUtils,
    
    // Token utilities
    ...tokenUtils,
    
    // Email service
    ...emailService,
    
    // SMS service
    ...smsService
};
