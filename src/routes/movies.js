/**
 * Movie routes - RESTful endpoints for movie data
 * Wires together validation middleware and controller functions
 * Following message-api routing pattern
 */

const express = require('express');
const router = express.Router();

// Import controller functions
const {
  getAllMovies,
  getTopRatedMovies,
  getTopGrossingMovies,
  getMoviesByDirector,
  getMoviesByActor,
  getRecentMovies,
  searchMovies,
  getMoviesByRating,
  getMovieById,
  getStats,
  createMovie,
  updateMovie,
  deleteMovie
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
 * /api/v1/movies:
 *   get:
 *     summary: Get all movies with pagination
 *     description: Returns paginated list of all movies with comprehensive metadata including overview, genres, cast, etc.
 *     tags: [Movies]
 *     parameters:
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *           maximum: 100
 *         description: Number of movies to return per page
 *       - in: query
 *         name: offset
 *         required: false
 *         schema:
 *           type: integer
 *           default: 0
 *           minimum: 0
 *         description: Number of movies to skip
 *     responses:
 *       200:
 *         description: Successfully retrieved movies
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
 *                         $ref: '#/components/schemas/Movie'
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
 *       400:
 *         description: Invalid pagination parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 */
router.get('/movies', validateApiKey, validatePagination, getAllMovies);

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

/**
 * @swagger
 * /api/v1/movies:
 *   post:
 *     summary: Create a new movie
 *     description: Adds a new movie to the database
 *     tags: [Movies]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - release_year
 *             properties:
 *               title:
 *                 type: string
 *                 description: Movie title
 *               release_year:
 *                 type: integer
 *                 description: Year the movie was released
 *               runtime_minutes:
 *                 type: integer
 *                 description: Movie runtime in minutes
 *               rating:
 *                 type: number
 *                 format: float
 *                 description: Movie rating (0-10)
 *               box_office:
 *                 type: number
 *                 description: Box office earnings
 *               director_id:
 *                 type: integer
 *                 description: Director ID reference
 *               country_id:
 *                 type: integer  
 *                 description: Country ID reference
 *               overview:
 *                 type: string
 *                 description: Movie plot overview
 *               genres:
 *                 type: string
 *                 description: Movie genres (comma-separated)
 *               budget:
 *                 type: number
 *                 description: Movie production budget
 *               studios:
 *                 type: string
 *                 description: Production studios
 *               poster_url:
 *                 type: string
 *                 description: Movie poster image URL
 *               backdrop_url:
 *                 type: string
 *                 description: Movie backdrop image URL
 *               collection:
 *                 type: string
 *                 description: Movie collection/franchise
 *               original_title:
 *                 type: string
 *                 description: Original movie title
 *               mpa_rating:
 *                 type: string
 *                 description: MPA rating (G, PG, PG-13, R, etc.)
 *     responses:
 *       200:
 *         description: Movie created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Bad request - missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized - invalid API key
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/movies', validateApiKey, createMovie);

/**
 * @swagger
 * /api/v1/movies/{id}:
 *   put:
 *     summary: Update an existing movie
 *     description: Updates movie information in the database
 *     tags: [Movies]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Movie ID to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Movie title
 *               release_year:
 *                 type: integer
 *                 description: Year the movie was released
 *               runtime_minutes:
 *                 type: integer
 *                 description: Movie runtime in minutes
 *               rating:
 *                 type: number
 *                 format: float
 *                 description: Movie rating (0-10)
 *               box_office:
 *                 type: number
 *                 description: Box office earnings
 *               director_id:
 *                 type: integer
 *                 description: Director ID reference
 *               country_id:
 *                 type: integer
 *                 description: Country ID reference
 *               overview:
 *                 type: string
 *                 description: Movie plot overview
 *               genres:
 *                 type: string
 *                 description: Movie genres (comma-separated)
 *               budget:
 *                 type: number
 *                 description: Movie production budget
 *               studios:
 *                 type: string
 *                 description: Production studios
 *               poster_url:
 *                 type: string
 *                 description: Movie poster image URL
 *               backdrop_url:
 *                 type: string
 *                 description: Movie backdrop image URL
 *               collection:
 *                 type: string
 *                 description: Movie collection/franchise
 *               original_title:
 *                 type: string
 *                 description: Original movie title
 *               mpa_rating:
 *                 type: string
 *                 description: MPA rating (G, PG, PG-13, R, etc.)
 *     responses:
 *       200:
 *         description: Movie updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Bad request - invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Movie not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized - invalid API key
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   delete:
 *     summary: Delete a movie
 *     description: Removes a movie from the database
 *     tags: [Movies]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Movie ID to delete
 *     responses:
 *       200:
 *         description: Movie deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       404:
 *         description: Movie not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized - invalid API key
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put('/movies/:id', validateApiKey, updateMovie);
router.delete('/movies/:id', validateApiKey, deleteMovie);

module.exports = router;
