/**
 * API Key Authentication Middleware
 * Validates API key from request headers
 * Following message-api authentication pattern
 */

const { sendError } = require('../utilities/responseUtils');

/**
 * Validate API key middleware
 * Checks for x-api-key header and validates against environment variable
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 * @returns {void}
 *
 * @example
 * // In routes:
 * router.get('/movies/top-rated', validateApiKey, getTopRatedMovies);
 *
 * // Client request:
 * fetch('/api/v1/movies/top-rated', {
 *   headers: { 'x-api-key': 'your-api-key-here' }
 * })
 */
const validateApiKey = (req, res, next) => {
  // Get API key from request header
  const apiKey = req.headers['x-api-key'];

  // Check if API key was provided
  if (!apiKey) {
    return sendError(
      res,
      401,
      'API key required',
      'Please provide an API key in the x-api-key header'
    );
  }

  // Get valid API key from environment variable
  const validApiKey = process.env.API_KEY;

  // Check if valid API key is configured
  if (!validApiKey) {
    console.error('❌ API_KEY not configured in environment variables');
    return sendError(
      res,
      500,
      'Server configuration error',
      'API key validation is not properly configured'
    );
  }

  // Validate the provided API key
  if (apiKey !== validApiKey) {
    return sendError(
      res,
      403,
      'Invalid API key',
      'The provided API key is not valid'
    );
  }

  // API key is valid, proceed to next middleware/controller
  next();
};

module.exports = {
  validateApiKey
};
