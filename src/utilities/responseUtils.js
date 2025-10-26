/**
 * Utility functions for consistent API response formatting
 * Following message-api pattern for standardized success/error responses
 */

/**
 * Send a successful response with data
 *
 * @param {Object} res - Express response object
 * @param {*} data - Data to return in response
 * @param {string} message - Success message (optional)
 * @param {number} statusCode - HTTP status code (default: 200)
 * @returns {Object} JSON response
 *
 * @example
 * sendSuccess(res, { movies: [...] }, 'Movies retrieved successfully', 200);
 * // Returns: { success: true, message: "Movies retrieved successfully", data: { movies: [...] } }
 */
const sendSuccess = (res, data, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

/**
 * Send an error response with details
 *
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code (400, 404, 500, etc.)
 * @param {string} message - Error message
 * @param {string} details - Additional error details (optional)
 * @returns {Object} JSON response
 *
 * @example
 * sendError(res, 404, 'Movie not found', 'No movie exists with ID 123');
 * // Returns: { success: false, error: "Movie not found", details: "No movie exists with ID 123" }
 */
const sendError = (res, statusCode, message, details = null) => {
  const response = {
    success: false,
    error: message
  };

  if (details) {
    response.details = details;
  }

  return res.status(statusCode).json(response);
};

module.exports = {
  sendSuccess,
  sendError
};
