/**
 * Directors routes - CRUD endpoints for director data
 */

const express = require('express');
const router = express.Router();

// Import controller functions
const {
  getAllDirectors,
  searchDirectors,
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
 * /api/v1/directors/search:
 *   get:
 *     summary: Search directors by name
 *     description: Search for directors using a partial name match (case-insensitive)
 *     tags: [Directors]
 *     parameters:
 *       - in: query
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *         description: Director name to search for (partial match supported)
 *         example: "Nolan"
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
 *         description: Successfully found matching directors
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Found 2 director(s) matching \"Nolan\""
 *                 data:
 *                   type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           director_id:
 *                             type: integer
 *                             example: 123
 *                           name:
 *                             type: string
 *                             example: "Christopher Nolan"
 *                           movie_count:
 *                             type: integer
 *                             example: 11
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         limit:
 *                           type: integer
 *                         offset:
 *                           type: integer
 *                         totalCount:
 *                           type: integer
 *                         hasNext:
 *                           type: boolean
 *                         hasPrevious:
 *                           type: boolean
 *                     searchTerm:
 *                       type: string
 *                       example: "Nolan"
 *       400:
 *         description: Missing search term or invalid pagination parameters
 *       500:
 *         description: Internal server error
 */
router.get('/directors/search', validateApiKey, validatePagination, searchDirectors);

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