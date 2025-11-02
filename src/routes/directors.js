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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         type: object
 *                     pagination:
 *                       type: object
 *             example:
 *               success: true
 *               message: "Retrieved 3 directors"
 *               data:
 *                 data:
 *                   - director_id: 1
 *                     name: "Christopher Nolan"
 *                     movie_count: 7404
 *                   - director_id: 2
 *                     name: "Greta Gerwig"
 *                     movie_count: 0
 *                   - director_id: 3
 *                     name: "Quentin Tarantino"
 *                     movie_count: 0
 *                 pagination:
 *                   limit: 50
 *                   offset: 0
 *                   totalCount: 3
 *                   hasNext: false
 *                   hasPrevious: false
 *       400:
 *         description: Invalid pagination parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Invalid pagination parameters"
 *               details: "limit must be between 1 and 100"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
 *           example:
 *             name: "Steven Spielberg"
 *     responses:
 *       201:
 *         description: Director created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *             example:
 *               success: true
 *               message: "Director created successfully"
 *               data:
 *                 director_id: 4
 *                 name: "Steven Spielberg"
 *       400:
 *         description: Missing required field
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Bad Request"
 *               details: "Missing required field: name"
 *       409:
 *         description: Director already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Conflict"
 *               details: "Director already exists"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
 *           example:
 *             name: "Christopher Nolan (Updated)"
 *     responses:
 *       200:
 *         description: Director updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *             example:
 *               success: true
 *               message: "Director updated successfully"
 *               data:
 *                 director_id: 1
 *                 name: "Christopher Nolan (Updated)"
 *       400:
 *         description: Invalid director ID or missing name
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Bad Request"
 *               details: "Invalid director ID or missing name"
 *       404:
 *         description: Director not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Not Found"
 *               details: "Director not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
 *         example: 3
 *     responses:
 *       200:
 *         description: Director deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *             example:
 *               success: true
 *               message: "Director deleted successfully"
 *               data:
 *                 director_id: 3
 *       400:
 *         description: Invalid director ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Bad Request"
 *               details: "Invalid director ID"
 *       404:
 *         description: Director not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Not Found"
 *               details: "Director not found"
 *       409:
 *         description: Cannot delete - director has associated movies
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Conflict"
 *               details: "Cannot delete director with associated movies"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/directors/:id', validateApiKey, deleteDirector);

module.exports = router;