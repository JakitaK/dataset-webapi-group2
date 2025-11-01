/**
 * Directors routes - CRUD endpoints for director data
 */

const express = require('express');
const router = express.Router();

// Import controller functions
const {
  getAllDirectors,
  createDirector,
  updateDirector,
  deleteDirector
} = require('../controllers/directorsController');

// Import validation middleware
const { validatePagination } = require('../middleware/movieValidation');

// Import API key authentication middleware
const { validateApiKey } = require('../middleware/apiKeyAuth');

/**
 * @swagger
 * /api/v1/directors:
 *   get:
 *     summary: Get all directors
 *     description: Returns paginated list of all directors with movie counts
 *     tags: [Directors]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *           minimum: 1
 *           maximum: 100
 *         description: Number of directors to return per page
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *           minimum: 0
 *         description: Number of directors to skip
 *     responses:
 *       200:
 *         description: Successfully retrieved directors
 *       400:
 *         description: Invalid pagination parameters
 *       500:
 *         description: Internal server error
 */
router.get('/directors', validateApiKey, validatePagination, getAllDirectors);

/**
 * @swagger
 * /api/v1/directors:
 *   post:
 *     summary: Create a new director
 *     description: Add a new director to the database
 *     tags: [Directors]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Christopher Nolan"
 *     responses:
 *       201:
 *         description: Director created successfully
 *       400:
 *         description: Missing required field
 *       409:
 *         description: Director already exists
 *       500:
 *         description: Internal server error
 */
router.post('/directors', validateApiKey, createDirector);

/**
 * @swagger
 * /api/v1/directors/{id}:
 *   put:
 *     summary: Update a director
 *     description: Update director information by ID
 *     tags: [Directors]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Director ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Christopher Nolan"
 *     responses:
 *       200:
 *         description: Director updated successfully
 *       400:
 *         description: Invalid director ID or missing name
 *       404:
 *         description: Director not found
 *       500:
 *         description: Internal server error
 */
router.put('/directors/:id', validateApiKey, updateDirector);

/**
 * @swagger
 * /api/v1/directors/{id}:
 *   delete:
 *     summary: Delete a director
 *     description: Remove a director from the database by ID
 *     tags: [Directors]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Director ID
 *     responses:
 *       200:
 *         description: Director deleted successfully
 *       400:
 *         description: Invalid director ID
 *       404:
 *         description: Director not found
 *       409:
 *         description: Cannot delete - director has associated movies
 *       500:
 *         description: Internal server error
 */
router.delete('/directors/:id', validateApiKey, deleteDirector);

module.exports = router;