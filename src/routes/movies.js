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
  getTopGrossingMovies,
  getMoviesByDirector,
  getMoviesByActor,
  getRecentMovies,
  searchMovies,
  getMoviesByMPARating,
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
 * Specific routes (like /movies/top-grossing or /movies/mpa/:rating) must come BEFORE generic path params (like /movies/:id)
 * Otherwise Express will match "top-grossing" or "mpa" as a parameter value
 */

/**
 * @swagger
 * /api/v1/movies:
 *   get:
 *     summary: Get all movies with pagination and filtering
 *     description: Returns paginated list of movies with comprehensive metadata. Supports filtering by MPA rating, year range, genre, director, and actor.
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
 *       - in: query
 *         name: mpaRating
 *         required: false
 *         schema:
 *           type: string
 *           enum: [G, PG, PG-13, R, NC-17, NR, Unrated]
 *         description: Filter by MPA rating (e.g., PG, PG-13, R)
 *         example: "PG-13"
 *       - in: query
 *         name: yearMin
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1995
 *         description: Minimum release year (inclusive)
 *         example: 2019
 *       - in: query
 *         name: yearMax
 *         required: false
 *         schema:
 *           type: integer
 *           maximum: 2025
 *         description: Maximum release year (inclusive)
 *         example: 2023
 *       - in: query
 *         name: genre
 *         required: false
 *         schema:
 *           type: string
 *         description: Filter by genre (partial match, case-insensitive)
 *         example: "Action"
 *       - in: query
 *         name: director
 *         required: false
 *         schema:
 *           type: string
 *         description: Filter by director name (partial match, case-insensitive)
 *         example: "Christopher Nolan"
 *       - in: query
 *         name: actor
 *         required: false
 *         schema:
 *           type: string
 *         description: Filter by actor name (partial match, case-insensitive)
 *         example: "Tom Hanks"
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
 *             example:
 *               success: true
 *               message: "Retrieved 10 movies"
 *               data:
 *                 data:
 *                   - movie_id: 2462
 *                     title: "Barbie"
 *                     release_year: 2023
 *                     runtime_minutes: 114
 *                     rating: "7.5"
 *                     box_office: "1445638421.00"
 *                     director_id: 1
 *                     country_id: 1
 *                   - movie_id: 2441
 *                     title: "Oppenheimer"
 *                     release_year: 2023
 *                     runtime_minutes: 181
 *                     rating: "7.5"
 *                     box_office: "952000000.00"
 *                     director_id: 1
 *                     country_id: 1
 *                 pagination:
 *                   limit: 10
 *                   offset: 0
 *                   totalCount: 7404
 *                   hasNext: true
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
router.get('/movies', validateApiKey, validatePagination, getAllMovies);

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
 *             example:
 *               success: true
 *               message: "Retrieved 10 top-grossing movies"
 *               data:
 *                 data:
 *                   - movie_id: 2462
 *                     title: "Barbie"
 *                     release_year: 2023
 *                     runtime_minutes: 114
 *                     rating: "7.5"
 *                     box_office: "1445638421.00"
 *                     director_id: 1
 *                     country_id: 1
 *                   - movie_id: 2441
 *                     title: "Oppenheimer"
 *                     release_year: 2023
 *                     runtime_minutes: 181
 *                     rating: "7.5"
 *                     box_office: "952000000.00"
 *                     director_id: 1
 *                     country_id: 1
 *                 pagination:
 *                   limit: 10
 *                   offset: 0
 *                   totalCount: 7404
 *                   hasNext: true
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
 *             example:
 *               success: true
 *               message: "Retrieved 15 movies from 2025"
 *               data:
 *                 data:
 *                   - movie_id: 1963
 *                     title: "Weapons"
 *                     release_year: 2025
 *                     runtime_minutes: 129
 *                     rating: "7.5"
 *                     box_office: "210852983.00"
 *                     director_id: 1
 *                     country_id: 1
 *                 total: 15
 *                 year: 2025
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
 *             example:
 *               success: true
 *               message: "Retrieved 8 movies for director ID 1"
 *               data:
 *                 data:
 *                   - movie_id: 2462
 *                     title: "Barbie"
 *                     release_year: 2023
 *                     runtime_minutes: 114
 *                     rating: "7.5"
 *                     box_office: "1445638421.00"
 *                     director_id: 1
 *                     country_id: 1
 *                   - movie_id: 2441
 *                     title: "Oppenheimer"
 *                     release_year: 2023
 *                     runtime_minutes: 181
 *                     rating: "7.5"
 *                     box_office: "952000000.00"
 *                     director_id: 1
 *                     country_id: 1
 *                 pagination:
 *                   limit: 10
 *                   offset: 0
 *                   totalCount: 8
 *                   hasNext: false
 *                   hasPrevious: false
 *                 directorId: 1
 *       400:
 *         description: Invalid director ID or pagination parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Invalid director ID"
 *               details: "Director ID must be a positive integer"
 *       404:
 *         description: No movies found for this director
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "No movies found"
 *               details: "No movies found for director ID 99"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
 *             example:
 *               success: true
 *               message: "Retrieved 5 movies for actor ID 2"
 *               data:
 *                 data:
 *                   - movie_id: 2462
 *                     title: "Barbie"
 *                     release_year: 2023
 *                     runtime_minutes: 114
 *                     rating: "7.5"
 *                     box_office: "1445638421.00"
 *                     director_id: 1
 *                     country_id: 1
 *                 pagination:
 *                   limit: 10
 *                   offset: 0
 *                   totalCount: 5
 *                   hasNext: false
 *                   hasPrevious: false
 *                 actorId: 2
 *       400:
 *         description: Invalid actor ID or pagination parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Invalid actor ID"
 *               details: "Actor ID must be a positive integer"
 *       404:
 *         description: No movies found for this actor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "No movies found"
 *               details: "No movies found for actor ID 99"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/movies/actor/:id', validateApiKey, validateActorId, validatePagination, getMoviesByActor);

/**
 * @swagger
 * /api/v1/movies/search:
 *   get:
 *     summary: Search movies by title
 *     description: Returns movies matching the search query (partial, case-insensitive match)
 *     tags: [Movies]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query for movie title
 *         example: "Barbie"
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
 *         description: Successful response with matching movies
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedMoviesResponse'
 *             example:
 *               success: true
 *               message: "Found 2 movies matching \"Barbie\""
 *               data:
 *                 data:
 *                   - movie_id: 2462
 *                     title: "Barbie"
 *                     release_year: 2023
 *                     runtime_minutes: 114
 *                     rating: "7.5"
 *                     box_office: "1445638421.00"
 *                     director_id: 1
 *                     country_id: 1
 *                 pagination:
 *                   limit: 10
 *                   offset: 0
 *                   totalCount: 2
 *                   hasNext: false
 *                   hasPrevious: false
 *                 searchTerm: "Barbie"
 *       400:
 *         description: Bad request - missing search query
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Bad Request"
 *               details: "Search query (q) parameter is required"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/movies/search', validateApiKey, validatePagination, searchMovies);

/**
 * @swagger
 * /api/v1/movies/mpa/{rating}:
 *   get:
 *     summary: Get movies by MPA rating
 *     description: Returns all movies with a specific MPA rating (G, PG, PG-13, R, NC-17, etc.)
 *     tags: [Movies]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: rating
 *         required: true
 *         schema:
 *           type: string
 *           enum: [G, PG, PG-13, R, NC-17, NR, NOT RATED]
 *         description: MPA rating to filter by (e.g., PG-13, R)
 *         example: PG-13
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
 *         description: Successfully retrieved movies with specified MPA rating
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedMoviesResponse'
 *       400:
 *         description: Invalid rating parameter
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - invalid API key
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 */
router.get('/movies/mpa/:rating', validateApiKey, validatePagination, getMoviesByMPARating);

/**
 * @swagger
 * /api/v1/stats:
 *   get:
 *     summary: Get API statistics
 *     description: Returns overall statistics about the movies database
 *     tags: [Statistics]
 *     responses:
 *       200:
 *         description: Successful response with API statistics
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
 *                     totalMovies:
 *                       type: integer
 *                     yearRange:
 *                       type: object
 *                       properties:
 *                         earliest:
 *                           type: integer
 *                         latest:
 *                           type: integer
 *                     uniqueRatings:
 *                       type: integer
 *                     totalBoxOffice:
 *                       type: number
 *                     topGrossingMovie:
 *                       type: object
 *             example:
 *               success: true
 *               message: "API statistics retrieved successfully"
 *               data:
 *                 totalMovies: 7404
 *                 yearRange:
 *                   earliest: 1995
 *                   latest: 2025
 *                 uniqueRatings: 1
 *                 totalBoxOffice: 29384562384.00
 *                 topGrossingMovie:
 *                   title: "Barbie"
 *                   box_office: "1445638421.00"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/stats', validateApiKey, getStats);

/**
 * @swagger
 * /api/v1/movies/{id}:
 *   get:
 *     summary: Get movie by ID
 *     description: Returns detailed information about a specific movie
 *     tags: [Movies]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Movie ID
 *         example: 2462
 *     responses:
 *       200:
 *         description: Successful response with movie details
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
 *                   $ref: '#/components/schemas/Movie'
 *             example:
 *               success: true
 *               message: "Movie details retrieved successfully"
 *               data:
 *                 movie_id: 2462
 *                 title: "Barbie"
 *                 release_year: 2023
 *                 runtime_minutes: 114
 *                 rating: "7.5"
 *                 box_office: "1445638421.00"
 *                 director_id: 1
 *                 country_id: 1
 *       400:
 *         description: Invalid movie ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Bad Request"
 *               details: "Movie ID must be a valid number"
 *       404:
 *         description: Movie not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Not Found"
 *               details: "Movie with ID 99999 not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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
 *           example:
 *             title: "Inception"
 *             release_year: 2010
 *             runtime_minutes: 148
 *             rating: 8.8
 *             box_office: 836800000
 *             director_id: 1
 *             country_id: 1
 *     responses:
 *       200:
 *         description: Movie created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               message: "Movie created successfully"
 *               data:
 *                 movie_id: 7405
 *                 title: "Inception"
 *                 release_year: 2010
 *                 runtime_minutes: 148
 *                 rating: "8.8"
 *                 box_office: "836800000.00"
 *                 director_id: 1
 *                 country_id: 1
 *       400:
 *         description: Bad request - missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Bad Request"
 *               details: "Missing required field: title"
 *       401:
 *         description: Unauthorized - invalid API key
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "API key required"
 *               details: "Please provide an API key in the x-api-key header"
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
 *           example:
 *             title: "Inception - Updated"
 *             runtime_minutes: 150
 *             rating: 9.0
 *     responses:
 *       200:
 *         description: Movie updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               message: "Movie updated successfully"
 *               data:
 *                 movie_id: 2462
 *                 title: "Inception - Updated"
 *                 release_year: 2010
 *                 runtime_minutes: 150
 *                 rating: "9.0"
 *                 box_office: "836800000.00"
 *                 director_id: 1
 *                 country_id: 1
 *       400:
 *         description: Bad request - invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Bad Request"
 *               details: "Invalid input data"
 *       404:
 *         description: Movie not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Not Found"
 *               details: "Movie with ID 99999 not found"
 *       401:
 *         description: Unauthorized - invalid API key
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "API key required"
 *               details: "Please provide an API key in the x-api-key header"
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
 *         example: 2462
 *     responses:
 *       200:
 *         description: Movie deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               message: "Movie deleted successfully"
 *               data:
 *                 movie_id: 2462
 *       404:
 *         description: Movie not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Not Found"
 *               details: "Movie with ID 99999 not found"
 *       401:
 *         description: Unauthorized - invalid API key
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "API key required"
 *               details: "Please provide an API key in the x-api-key header"
 */
router.put('/movies/:id', validateApiKey, updateMovie);
router.delete('/movies/:id', validateApiKey, deleteMovie);

module.exports = router;
