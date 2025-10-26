/**
 * Input validation middleware for movie routes
 * Uses express-validator to validate request parameters, query strings, and body data
 * Following message-api validation pattern
 */

const { query, param, validationResult } = require('express-validator');

/**
 * Handle validation errors
 * If validation fails, return 400 with error details
 * Otherwise, proceed to next middleware/controller
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array().map(err => ({
        field: err.path,
        message: err.msg,
        value: err.value
      }))
    });
  }
  next();
};

/**
 * Validate pagination query parameters (limit and offset)
 * Used by: top-rated, top-grossing, director, actor routes
 *
 * Rules:
 * - limit: optional, integer, 1-100, defaults to 10
 * - offset: optional, integer, >= 0, defaults to 0
 *
 * @example
 * GET /movies/top-rated?limit=20&offset=40
 */
const validatePagination = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be an integer between 1 and 100'),

  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be a non-negative integer'),

  handleValidationErrors
];

/**
 * Validate director ID path parameter
 * Used by: /movies/director/:id route
 *
 * Rules:
 * - id: required, positive integer
 *
 * @example
 * GET /movies/director/5
 */
const validateDirectorId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Director ID must be a positive integer'),

  handleValidationErrors
];

/**
 * Validate actor ID path parameter
 * Used by: /movies/actor/:id route
 *
 * Rules:
 * - id: required, positive integer
 *
 * @example
 * GET /movies/actor/12
 */
const validateActorId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Actor ID must be a positive integer'),

  handleValidationErrors
];

module.exports = {
  validatePagination,
  validateDirectorId,
  validateActorId
};
