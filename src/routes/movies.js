/**
 * Movie routes - RESTful endpoints for movie data
 * Wires together validation middleware and controller functions
 * Following message-api routing pattern
 */

const express = require('express');
const router = express.Router();

// Import controller functions
const {
  getTopRatedMovies,
  getTopGrossingMovies,
  getMoviesByDirector,
  getMoviesByActor,
  getRecentMovies,
  searchMovies,
  getMoviesByRating,
  getMovieById,
  getStats
} = require('../controllers/moviesController');

// Import validation middleware
const {
  validatePagination,
  validateDirectorId,
  validateActorId
} = require('../middleware/movieValidation');

// Import API key authentication middleware
const { validateApiKey } = require('../middleware/apiKeyAuth');

/**
 * IMPORTANT: Route ordering matters!
 * Specific routes (like /movies/top-rated) must come BEFORE generic path params (like /movies/:id)
 * Otherwise Express will match "top-rated" as a parameter value
 */

/**
 * @swagger
 * /api/v1/movies/top-rated:
 *   get:
 *     summary: Get highest rated movies
 *     description: Returns movies sorted by rating (highest first) with pagination support
 *     tags: [Movies]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of movies per page
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Number of records to skip
 *     responses:
 *       200:
 *         description: Successful response with top-rated movies
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedMoviesResponse'
 *       400:
 *         description: Invalid pagination parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 */
router.get('/movies/top-rated', validateApiKey, validatePagination, getTopRatedMovies);

/**
 * @swagger
 * /api/v1/movies/top-grossing:
 *   get:
 *     summary: Get highest grossing movies
 *     description: Returns movies sorted by box office revenue (highest first) with pagination support
 *     tags: [Movies]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of movies per page
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Number of records to skip
 *     responses:
 *       200:
 *         description: Successful response with top-grossing movies
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedMoviesResponse'
 *       400:
 *         description: Invalid pagination parameters
 *       500:
 *         description: Internal server error
 */
router.get('/movies/top-grossing', validateApiKey, validatePagination, getTopGrossingMovies);

/**
 * @swagger
 * /api/v1/movies/recent:
 *   get:
 *     summary: Get recently released movies
 *     description: Returns all movies from the current calendar year, sorted by title
 *     tags: [Movies]
 *     responses:
 *       200:
 *         description: Successful response with recent movies
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RecentMoviesResponse'
 *       500:
 *         description: Internal server error
 */
router.get('/movies/recent', validateApiKey, getRecentMovies);

/**
 * @swagger
 * /api/v1/movies/director/{id}:
 *   get:
 *     summary: Get movies by director
 *     description: Returns all movies directed by a specific director with pagination support
 *     tags: [Movies]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Director ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of movies per page
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Number of records to skip
 *     responses:
 *       200:
 *         description: Successful response with director's movies
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedMoviesWithIdResponse'
 *       400:
 *         description: Invalid director ID or pagination parameters
 *       404:
 *         description: No movies found for this director
 *       500:
 *         description: Internal server error
 */
router.get('/movies/director/:id', validateApiKey, validateDirectorId, validatePagination, getMoviesByDirector);

/**
 * @swagger
 * /api/v1/movies/actor/{id}:
 *   get:
 *     summary: Get movies by actor
 *     description: Returns all movies featuring a specific actor with pagination support
 *     tags: [Movies]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Actor ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of movies per page
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Number of records to skip
 *     responses:
 *       200:
 *         description: Successful response with actor's movies
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedMoviesWithIdResponse'
 *       400:
 *         description: Invalid actor ID or pagination parameters
 *       404:
 *         description: No movies found for this actor
 *       500:
 *         description: Internal server error
 */
router.get('/movies/actor/:id', validateApiKey, validateActorId, validatePagination, getMoviesByActor);

// Movie search route
router.get('/movies/search', validateApiKey, validatePagination, searchMovies);

// Movies by MPA rating route  
router.get('/movies/rating/:rating', validateApiKey, validatePagination, getMoviesByRating);

// API statistics route
router.get('/stats', validateApiKey, getStats);

// Individual movie details route (MUST be last due to :id param matching)
router.get('/movies/:id', validateApiKey, getMovieById);

module.exports = router;
