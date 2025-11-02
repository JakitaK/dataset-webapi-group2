// shared/responseUtils.js
// Shared response utility functions for consistent API responses

/**
 * Send a successful response
 * @param {Object} res - Express response object
 * @param {*} data - Response data
 * @param {string} message - Success message
 * @param {number} statusCode - HTTP status code (default: 200)
 */
const sendSuccess = (res, data, message = 'Success', statusCode = 200) => {
  res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

/**
 * Send an error response
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} error - Error title
 * @param {string} details - Error details
 */
const sendError = (res, statusCode, error, details) => {
  res.status(statusCode).json({
    success: false,
    error,
    details
  });
};

module.exports = {
  sendSuccess,
  sendError
};
