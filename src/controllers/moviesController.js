/**
 * Movie controller - Business logic for all movie-related routes
 * Handles database queries, data processing, and response formatting
 * Following message-api controller pattern
 */

const pool = require('../db');
const { sendSuccess, sendError } = require('../utilities/responseUtils');

/**
 * Get all movies with pagination and enhanced data
 * Returns movies with comprehensive metadata including overview, genres, cast, etc.
 *
 * @route GET /api/v1/movies
 * @param {Object} req - Express request object
 * @param {Object} req.query.limit - Number of movies per page (default: 10, max: 100)
 * @param {Object} req.query.offset - Number of records to skip (default: 0)
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const getAllMovies = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;

    // Query for paginated movies with all enhanced fields
    const moviesSql = `
      SELECT movie_id, title, release_year, runtime_minutes, rating, box_office, director_id, country_id,
             overview, genres, director_name, budget, studios, poster_url, backdrop_url, 
             collection, original_title, actors
      FROM movie
      ORDER BY title ASC
      LIMIT $1 OFFSET $2
    `;

    // Query for total count
    const countSql = 'SELECT COUNT(*) FROM movie';

    // Execute both queries in parallel
    const [moviesResult, countResult] = await Promise.all([
      pool.query(moviesSql, [limit, offset]),
      pool.query(countSql)
    ]);

    const totalCount = parseInt(countResult.rows[0].count);

    const responseData = {
      data: moviesResult.rows,
      pagination: {
        limit,
        offset,
        totalCount,
        hasNext: offset + limit < totalCount,
        hasPrevious: offset > 0
      }
    };

    sendSuccess(res, 'Retrieved all movies', responseData);
  } catch (error) {
    console.error('Error getting all movies:', error);
    sendError(res, 500, 'Failed to retrieve movies');
  }
};

/**
 * Get top-rated movies sorted by rating (highest first)
 * Supports pagination with limit and offset
 *
 * @route GET /api/v1/movies/top-rated
 * @param {Object} req - Express request object
 * @param {Object} req.query.limit - Number of movies per page (default: 10, max: 100)
 * @param {Object} req.query.offset - Number of records to skip (default: 0)
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 *
 * @example
 * GET /api/v1/movies/top-rated?limit=10&offset=0
 * Response: {
 *   success: true,
 *   message: "Retrieved top-rated movies",
 *   data: {
 *     data: [...movies],
 *     pagination: { limit: 10, offset: 0, totalCount: 5432, hasNext: true, hasPrevious: false }
 *   }
 * }
 */
const getTopRatedMovies = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;

    // Query for paginated movies sorted by rating  
    const moviesSql = `
      SELECT movie_id, title, release_year, runtime_minutes, rating, box_office, director_id, country_id,
             overview, genres, director_name, budget, studios, poster_url, backdrop_url, 
             collection, original_title, actors
      FROM movie
      ORDER BY rating DESC, title ASC
      LIMIT $1 OFFSET $2
    `;

    // Query for total count
    const countSql = 'SELECT COUNT(*) FROM movie';

    // Execute both queries in parallel
    const [moviesResult, countResult] = await Promise.all([
      pool.query(moviesSql, [limit, offset]),
      pool.query(countSql)
    ]);

    const totalCount = parseInt(countResult.rows[0].count);

    const responseData = {
      data: moviesResult.rows,
      pagination: {
        limit,
        offset,
        totalCount,
        hasNext: offset + limit < totalCount,
        hasPrevious: offset > 0
      }
    };

    return sendSuccess(res, responseData, `Retrieved ${moviesResult.rows.length} top-rated movies`);

  } catch (error) {
    console.error('Error in getTopRatedMovies:', error);
    return sendError(res, 500, 'Internal Server Error', 'An error occurred while retrieving top-rated movies');
  }
};

/**
 * Get top-grossing movies sorted by box office revenue (highest first)
 * Supports pagination with limit and offset
 *
 * @route GET /api/v1/movies/top-grossing
 * @param {Object} req - Express request object
 * @param {Object} req.query.limit - Number of movies per page (default: 10, max: 100)
 * @param {Object} req.query.offset - Number of records to skip (default: 0)
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 *
 * @example
 * GET /api/v1/movies/top-grossing?limit=20&offset=0
 * Response: {
 *   success: true,
 *   message: "Retrieved top-grossing movies",
 *   data: {
 *     data: [...movies],
 *     pagination: { limit: 20, offset: 0, totalCount: 5432, hasNext: true, hasPrevious: false }
 *   }
 * }
 */
const getTopGrossingMovies = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;

    // Query for paginated movies sorted by box office
    const moviesSql = `
      SELECT movie_id, title, release_year, runtime_minutes, rating, box_office, director_id, country_id,
             overview, genres, director_name, budget, studios, poster_url, backdrop_url,
             collection, original_title, actors
      FROM movie
      ORDER BY box_office DESC NULLS LAST, title ASC
      LIMIT $1 OFFSET $2
    `;

    // Query for total count
    const countSql = 'SELECT COUNT(*) FROM movie';

    // Execute both queries in parallel
    const [moviesResult, countResult] = await Promise.all([
      pool.query(moviesSql, [limit, offset]),
      pool.query(countSql)
    ]);

    const totalCount = parseInt(countResult.rows[0].count);

    const responseData = {
      data: moviesResult.rows,
      pagination: {
        limit,
        offset,
        totalCount,
        hasNext: offset + limit < totalCount,
        hasPrevious: offset > 0
      }
    };

    return sendSuccess(res, responseData, `Retrieved ${moviesResult.rows.length} top-grossing movies`);

  } catch (error) {
    console.error('Error in getTopGrossingMovies:', error);
    return sendError(res, 500, 'Internal Server Error', 'An error occurred while retrieving top-grossing movies');
  }
};

/**
 * Get all movies by a specific director
 * Supports pagination with limit and offset
 *
 * @route GET /api/v1/movies/director/:id
 * @param {Object} req - Express request object
 * @param {string} req.params.id - Director ID (validated as positive integer)
 * @param {Object} req.query.limit - Number of movies per page (default: 10, max: 100)
 * @param {Object} req.query.offset - Number of records to skip (default: 0)
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 *
 * @example
 * GET /api/v1/movies/director/5?limit=10&offset=0
 * Response: {
 *   success: true,
 *   message: "Retrieved 8 movies for director ID 5",
 *   data: {
 *     data: [...movies],
 *     pagination: { limit: 10, offset: 0, totalCount: 8, hasNext: false, hasPrevious: false },
 *     directorId: 5
 *   }
 * }
 */
const getMoviesByDirector = async (req, res) => {
  try {
    const directorId = parseInt(req.params.id);
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;

    // Validate director ID
    if (isNaN(directorId) || directorId < 1) {
      return sendError(res, 400, 'Invalid director ID', 'Director ID must be a positive integer');
    }

    // First, get all unique director names and create a mapping
    const directorMappingSql = `
      SELECT DISTINCT director_name
      FROM movie 
      WHERE director_name IS NOT NULL AND director_name != ''
      ORDER BY director_name
    `;

    const directorMappingResult = await pool.query(directorMappingSql);
    
    // Check if the requested director ID exists
    if (directorId > directorMappingResult.rows.length) {
      return sendError(res, 404, 'Director not found', `Director ID ${directorId} not found. Available director IDs: 1-${directorMappingResult.rows.length}`);
    }

    // Get the director name for the requested ID (1-indexed)
    const targetDirectorName = directorMappingResult.rows[directorId - 1].director_name;

    // Query for paginated movies by this specific director
    const moviesSql = `
      SELECT movie_id, title, release_year, runtime_minutes, rating, box_office, director_id, country_id,
             overview, genres, director_name, budget, studios, poster_url, backdrop_url,
             collection, original_title, actors
      FROM movie
      WHERE director_name = $1
      ORDER BY release_year DESC, title ASC
      LIMIT $2 OFFSET $3
    `;

    // Query for total count for this director
    const countSql = 'SELECT COUNT(*) FROM movie WHERE director_name = $1';

    // Execute both queries in parallel
    const [moviesResult, countResult] = await Promise.all([
      pool.query(moviesSql, [targetDirectorName, limit, offset]),
      pool.query(countSql, [targetDirectorName])
    ]);

    const totalCount = parseInt(countResult.rows[0].count);

    // Check if director has any movies
    if (totalCount === 0) {
      return sendError(res, 404, 'No movies found', `No movies found for director ID ${directorId} (${targetDirectorName})`);
    }

    const responseData = {
      data: moviesResult.rows,
      pagination: {
        limit,
        offset,
        totalCount,
        hasNext: offset + limit < totalCount,
        hasPrevious: offset > 0
      },
      directorId,
      directorName: targetDirectorName
    };

    return sendSuccess(res, responseData, `Retrieved ${moviesResult.rows.length} movies for director ID ${directorId} (${targetDirectorName})`);

  } catch (error) {
    console.error('Error in getMoviesByDirector:', error);
    return sendError(res, 500, 'Internal Server Error', 'An error occurred while retrieving movies by director');
  }
};

/**
 * Get all movies featuring a specific actor
 * Uses JOIN with movie_actor table
 * Supports pagination with limit and offset
 *
 * @route GET /api/v1/movies/actor/:id
 * @param {Object} req - Express request object
 * @param {string} req.params.id - Actor ID (validated as positive integer)
 * @param {Object} req.query.limit - Number of movies per page (default: 10, max: 100)
 * @param {Object} req.query.offset - Number of records to skip (default: 0)
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 *
 * @example
 * GET /api/v1/movies/actor/12?limit=10&offset=0
 * Response: {
 *   success: true,
 *   message: "Retrieved 15 movies for actor ID 12",
 *   data: {
 *     data: [...movies],
 *     pagination: { limit: 10, offset: 0, totalCount: 15, hasNext: true, hasPrevious: false },
 *     actorId: 12
 *   }
 * }
 */
const getMoviesByActor = async (req, res) => {
  try {
    const actorId = parseInt(req.params.id);
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;

    // Validate actor ID
    if (isNaN(actorId) || actorId < 1) {
      return sendError(res, 400, 'Invalid actor ID', 'Actor ID must be a positive integer');
    }

    // First, get all unique actor names and create a mapping
    const actorMappingSql = `
      SELECT DISTINCT 
        UNNEST(STRING_TO_ARRAY(actors, ', ')) as actor_name
      FROM movie 
      WHERE actors IS NOT NULL AND actors != ''
      ORDER BY actor_name
    `;

    const actorMappingResult = await pool.query(actorMappingSql);
    
    // Check if the requested actor ID exists
    if (actorId > actorMappingResult.rows.length) {
      return sendError(res, 404, 'Actor not found', `Actor ID ${actorId} not found. Available actor IDs: 1-${actorMappingResult.rows.length}`);
    }

    // Get the actor name for the requested ID (1-indexed)
    const targetActorName = actorMappingResult.rows[actorId - 1].actor_name;

    // Query for paginated movies by this specific actor name
    const moviesSql = `
      SELECT movie_id, title, release_year, runtime_minutes, rating, box_office, director_id, country_id,
             overview, genres, director_name, budget, studios, poster_url, backdrop_url,
             collection, original_title, actors
      FROM movie
      WHERE actors ILIKE $1 AND actors IS NOT NULL AND actors != ''
      ORDER BY release_year DESC, title ASC
      LIMIT $2 OFFSET $3
    `;

    // Query for total count for this actor
    const countSql = `
      SELECT COUNT(*)
      FROM movie
      WHERE actors ILIKE $1 AND actors IS NOT NULL AND actors != ''
    `;

    // Execute both queries in parallel
    const [moviesResult, countResult] = await Promise.all([
      pool.query(moviesSql, [`%${targetActorName}%`, limit, offset]),
      pool.query(countSql, [`%${targetActorName}%`])
    ]);

    const totalCount = parseInt(countResult.rows[0].count);

    // Check if actor has any movies
    if (totalCount === 0) {
      return sendError(res, 404, 'No movies found', `No movies found for actor ID ${actorId} (${targetActorName})`);
    }

    const responseData = {
      data: moviesResult.rows,
      pagination: {
        limit,
        offset,
        totalCount,
        hasNext: offset + limit < totalCount,
        hasPrevious: offset > 0
      },
      actorId,
      actorName: targetActorName
    };

    return sendSuccess(res, responseData, `Retrieved ${moviesResult.rows.length} movies for actor ID ${actorId} (${targetActorName})`);

  } catch (error) {
    console.error('Error in getMoviesByActor:', error);
    return sendError(res, 500, 'Internal Server Error', 'An error occurred while retrieving movies by actor');
  }
};

/**
 * Get movies from the most recent/current calendar year
 * No pagination - returns all movies from current year
 * Sorted by title ascending
 *
 * @route GET /api/v1/movies/recent
 * @param {Object} req - Express request object (no parameters needed)
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 *
 * @example
 * GET /api/v1/movies/recent
 * Response: {
 *   success: true,
 *   message: "Retrieved 145 movies from 2025",
 *   data: {
 *     data: [...movies],
 *     total: 145,
 *     year: 2025
 *   }
 * }
 */
const getRecentMovies = async (req, res) => {
  try {
    // Get current year from database
    const currentYear = new Date().getFullYear();

    // Query for all movies from current year
    const moviesSql = `
      SELECT movie_id, title, release_year, runtime_minutes, rating, box_office, director_id, country_id,
             overview, genres, director_name, budget, studios, poster_url, backdrop_url,
             collection, original_title, actors
      FROM movie
      WHERE release_year = $1
      ORDER BY title ASC
    `;

    const moviesResult = await pool.query(moviesSql, [currentYear]);

    const responseData = {
      data: moviesResult.rows,
      total: moviesResult.rows.length,
      year: currentYear
    };

    // If no movies for current year, return empty array (not an error)
    if (moviesResult.rows.length === 0) {
      return sendSuccess(res, responseData, `No movies found for ${currentYear}`);
    }

    return sendSuccess(res, responseData, `Retrieved ${moviesResult.rows.length} movies from ${currentYear}`);

  } catch (error) {
    console.error('Error in getRecentMovies:', error);
    return sendError(res, 500, 'Internal Server Error', 'An error occurred while retrieving recent movies');
  }
};

/**
 * Search movies by title (partial match)
 * Supports pagination with limit and offset
 */
const searchMovies = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;
    const searchTerm = req.query.q || '';

    if (!searchTerm.trim()) {
      return sendError(res, 400, 'Bad Request', 'Search query (q) parameter is required');
    }

    // Search movies with case-insensitive partial matching
    const moviesSql = `
      SELECT movie_id, title, release_year, runtime_minutes, rating, box_office, director_id, country_id,
             overview, genres, director_name, budget, studios, poster_url, backdrop_url,
             collection, original_title, actors
      FROM movie
      WHERE LOWER(title) LIKE LOWER($1)
      ORDER BY title ASC
      LIMIT $2 OFFSET $3
    `;

    // Count total matches
    const countSql = `
      SELECT COUNT(*) FROM movie 
      WHERE LOWER(title) LIKE LOWER($1)
    `;

    const searchPattern = `%${searchTerm}%`;
    const [moviesResult, countResult] = await Promise.all([
      pool.query(moviesSql, [searchPattern, limit, offset]),
      pool.query(countSql, [searchPattern])
    ]);

    const totalCount = parseInt(countResult.rows[0].count);

    const responseData = {
      data: moviesResult.rows,
      pagination: {
        limit,
        offset,
        totalCount,
        hasNext: offset + limit < totalCount,
        hasPrevious: offset > 0
      },
      searchTerm
    };

    return sendSuccess(res, responseData, `Found ${moviesResult.rows.length} movies matching "${searchTerm}"`);

  } catch (error) {
    console.error('Error in searchMovies:', error);
    return sendError(res, 500, 'Internal Server Error', 'An error occurred while searching movies');
  }
};

/**
 * Get movies by MPA rating (G, PG, PG-13, R, etc.)
 */
const getMoviesByRating = async (req, res) => {
  try {
    const rating = req.params.rating?.toUpperCase();
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;

    if (!rating) {
      return sendError(res, 400, 'Bad Request', 'Rating parameter is required');
    }

    const moviesSql = `
      SELECT movie_id, title, release_year, runtime_minutes, rating, box_office, director_id, country_id,
             overview, genres, director_name, budget, studios, poster_url, backdrop_url,
             collection, original_title, actors
      FROM movie
      WHERE UPPER(rating) = $1
      ORDER BY box_office DESC, title ASC
      LIMIT $2 OFFSET $3
    `;

    const countSql = `SELECT COUNT(*) FROM movie WHERE UPPER(rating) = $1`;

    const [moviesResult, countResult] = await Promise.all([
      pool.query(moviesSql, [rating, limit, offset]),
      pool.query(countSql, [rating])
    ]);

    const totalCount = parseInt(countResult.rows[0].count);

    const responseData = {
      data: moviesResult.rows,
      pagination: {
        limit,
        offset,
        totalCount,
        hasNext: offset + limit < totalCount,
        hasPrevious: offset > 0
      },
      rating
    };

    return sendSuccess(res, responseData, `Retrieved ${moviesResult.rows.length} movies with ${rating} rating`);

  } catch (error) {
    console.error('Error in getMoviesByRating:', error);
    return sendError(res, 500, 'Internal Server Error', 'An error occurred while retrieving movies by rating');
  }
};

/**
 * Get individual movie by ID
 */
const getMovieById = async (req, res) => {
  try {
    const movieId = parseInt(req.params.id);

    if (Number.isNaN(movieId)) {
      return sendError(res, 400, 'Bad Request', 'Movie ID must be a valid number');
    }

    const sql = `
      SELECT movie_id, title, release_year, runtime_minutes, rating, box_office, director_id, country_id,
             overview, genres, director_name, budget, studios, poster_url, backdrop_url,
             collection, original_title, actors
      FROM movie
      WHERE movie_id = $1
    `;

    const result = await pool.query(sql, [movieId]);

    if (result.rows.length === 0) {
      return sendError(res, 404, 'Not Found', `Movie with ID ${movieId} not found`);
    }

    return sendSuccess(res, result.rows[0], 'Movie details retrieved successfully');

  } catch (error) {
    console.error('Error in getMovieById:', error);
    return sendError(res, 500, 'Internal Server Error', 'An error occurred while retrieving movie details');
  }
};

/**
 * Get basic API statistics
 */
const getStats = async (req, res) => {
  try {
    const queries = [
      'SELECT COUNT(*) as total_movies FROM movie',
      'SELECT MIN(release_year) as earliest_year, MAX(release_year) as latest_year FROM movie',
      'SELECT COUNT(DISTINCT rating) as rating_count FROM movie WHERE rating IS NOT NULL',
      'SELECT SUM(box_office) as total_box_office FROM movie WHERE box_office IS NOT NULL',
      `SELECT title, box_office FROM movie 
       WHERE box_office IS NOT NULL 
       ORDER BY box_office DESC LIMIT 1`
    ];

    const [totalResult, yearResult, ratingResult, boxOfficeResult, topMovieResult] = await Promise.all(
      queries.map(query => pool.query(query))
    );

    const stats = {
      totalMovies: parseInt(totalResult.rows[0].total_movies),
      yearRange: {
        earliest: yearResult.rows[0].earliest_year,
        latest: yearResult.rows[0].latest_year
      },
      uniqueRatings: parseInt(ratingResult.rows[0].rating_count),
      totalBoxOffice: parseFloat(boxOfficeResult.rows[0].total_box_office || 0),
      topGrossingMovie: topMovieResult.rows[0] || null
    };

    return sendSuccess(res, stats, 'API statistics retrieved successfully');

  } catch (error) {
    console.error('Error in getStats:', error);
    return sendError(res, 500, 'Internal Server Error', 'An error occurred while retrieving statistics');
  }
};

module.exports = {
  getAllMovies,
  getTopRatedMovies,
  getTopGrossingMovies,
  getMoviesByDirector,
  getMoviesByActor,
  getRecentMovies,
  searchMovies,
  getMoviesByRating,
  getMovieById,
  getStats
};
