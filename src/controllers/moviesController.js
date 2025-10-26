/**
 * Movie controller - Business logic for all movie-related routes
 * Handles database queries, data processing, and response formatting
 * Following message-api controller pattern
 */

const pool = require('../db');
const { sendSuccess, sendError } = require('../utilities/responseUtils');

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
      SELECT movie_id, title, release_year, runtime_minutes, rating, box_office, director_id, country_id
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
      SELECT movie_id, title, release_year, runtime_minutes, rating, box_office, director_id, country_id
      FROM movie
      ORDER BY box_office DESC, title ASC
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

    // Query for paginated movies by director
    const moviesSql = `
      SELECT movie_id, title, release_year, runtime_minutes, rating, box_office, director_id, country_id
      FROM movie
      WHERE director_id = $1
      ORDER BY release_year DESC, title ASC
      LIMIT $2 OFFSET $3
    `;

    // Query for total count for this director
    const countSql = 'SELECT COUNT(*) FROM movie WHERE director_id = $1';

    // Execute both queries in parallel
    const [moviesResult, countResult] = await Promise.all([
      pool.query(moviesSql, [directorId, limit, offset]),
      pool.query(countSql, [directorId])
    ]);

    const totalCount = parseInt(countResult.rows[0].count);

    // Check if director has any movies
    if (totalCount === 0) {
      return sendError(res, 404, 'No movies found', `No movies found for director ID ${directorId}`);
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
      directorId
    };

    return sendSuccess(res, responseData, `Retrieved ${moviesResult.rows.length} movies for director ID ${directorId}`);

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

    // Query for paginated movies by actor (using JOIN)
    const moviesSql = `
      SELECT m.movie_id, m.title, m.release_year, m.runtime_minutes, m.rating, m.box_office, m.director_id, m.country_id
      FROM movie m
      JOIN movie_actor ma ON m.movie_id = ma.movie_id
      WHERE ma.actor_id = $1
      ORDER BY m.release_year DESC, m.title ASC
      LIMIT $2 OFFSET $3
    `;

    // Query for total count for this actor
    const countSql = `
      SELECT COUNT(*)
      FROM movie m
      JOIN movie_actor ma ON m.movie_id = ma.movie_id
      WHERE ma.actor_id = $1
    `;

    // Execute both queries in parallel
    const [moviesResult, countResult] = await Promise.all([
      pool.query(moviesSql, [actorId, limit, offset]),
      pool.query(countSql, [actorId])
    ]);

    const totalCount = parseInt(countResult.rows[0].count);

    // Check if actor has any movies
    if (totalCount === 0) {
      return sendError(res, 404, 'No movies found', `No movies found for actor ID ${actorId}`);
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
      actorId
    };

    return sendSuccess(res, responseData, `Retrieved ${moviesResult.rows.length} movies for actor ID ${actorId}`);

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
      SELECT movie_id, title, release_year, runtime_minutes, rating, box_office, director_id, country_id
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

module.exports = {
  getTopRatedMovies,
  getTopGrossingMovies,
  getMoviesByDirector,
  getMoviesByActor,
  getRecentMovies
};
