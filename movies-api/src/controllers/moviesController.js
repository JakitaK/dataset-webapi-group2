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
    
    // Extract filter parameters
    const { mpaRating, yearMin, yearMax, genre, director, actor } = req.query;
    
    // Build WHERE clause dynamically
    const conditions = [];
    const params = [];
    let paramCounter = 1;
    
    if (mpaRating) {
      conditions.push(`UPPER(mpa_rating) = UPPER($${paramCounter})`);
      params.push(mpaRating);
      paramCounter++;
    }
    
    if (yearMin) {
      conditions.push(`release_year >= $${paramCounter}`);
      params.push(parseInt(yearMin));
      paramCounter++;
    }
    
    if (yearMax) {
      conditions.push(`release_year <= $${paramCounter}`);
      params.push(parseInt(yearMax));
      paramCounter++;
    }
    
    if (genre) {
      conditions.push(`LOWER(genres) LIKE LOWER($${paramCounter})`);
      params.push(`%${genre}%`);
      paramCounter++;
    }
    
    if (director) {
      conditions.push(`LOWER(director_name) LIKE LOWER($${paramCounter})`);
      params.push(`%${director}%`);
      paramCounter++;
    }
    
    if (actor) {
      conditions.push(`LOWER(actors) LIKE LOWER($${paramCounter})`);
      params.push(`%${actor}%`);
      paramCounter++;
    }
    
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Query for paginated movies with all enhanced fields
    const moviesSql = `
      SELECT movie_id, title, release_year, runtime_minutes, rating, box_office, director_id, country_id,
             overview, genres, director_name, budget, studios, poster_url, backdrop_url, 
             collection, original_title, actors, mpa_rating
      FROM movie
      ${whereClause}
      ORDER BY title ASC
      LIMIT $${paramCounter} OFFSET $${paramCounter + 1}
    `;
    
    params.push(limit, offset);

    // Query for total count
    const countSql = `SELECT COUNT(*) FROM movie ${whereClause}`;
    const countParams = params.slice(0, -2); // Remove limit and offset for count query

    // Execute both queries in parallel
    const [moviesResult, countResult] = await Promise.all([
      pool.query(moviesSql, params),
      pool.query(countSql, countParams)
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

    sendSuccess(res, responseData, `Retrieved ${moviesResult.rows.length} movies`);
  } catch (error) {
    console.error('Error getting all movies:', error);
    sendError(res, 'Failed to retrieve movies', 500);
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
 * Search for a movie by its ID
 * Returns the movie with the specified ID
 *
 * @route GET /api/v1/movies/search/id?movieId=500
 */
const searchMovieById = async (req, res) => {
  try {
    const movieId = req.query.movieId ? parseInt(req.query.movieId) : null;

    if (!movieId) {
      return sendError(res, 400, 'Bad Request', 'movieId query parameter is required');
    }

    if (Number.isNaN(movieId) || movieId < 1) {
      return sendError(res, 400, 'Bad Request', 'Movie ID must be a valid positive number');
    }

    const movieSql = `
      SELECT movie_id, title, release_year, runtime_minutes, rating, box_office, director_id, country_id,
             overview, genres, director_name, budget, studios, poster_url, backdrop_url,
             collection, original_title, actors
      FROM movie
      WHERE movie_id = $1
    `;

    const movieResult = await pool.query(movieSql, [movieId]);

    if (movieResult.rows.length === 0) {
      return sendError(res, 404, 'Movie Not Found', `No movie found with ID ${movieId}`);
    }

    const responseData = {
      data: movieResult.rows,
      movieId,
      total: movieResult.rows.length
    };

    return sendSuccess(res, responseData, `Found movie with ID ${movieId}`);

  } catch (error) {
    console.error('Error in searchMovieById:', error);
    return sendError(res, 500, 'Internal Server Error', 'An error occurred while searching for movie by ID');
  }
};

/**
 * Get poster URL for a specific movie
 * Returns only the poster and backdrop URLs for a movie
 *
 * @route GET /api/v1/movies/:id/poster
 */
const getMoviePoster = async (req, res) => {
  try {
    const movieId = parseInt(req.params.id);

    if (Number.isNaN(movieId) || movieId < 1) {
      return sendError(res, 400, 'Bad Request', 'Movie ID must be a valid positive number');
    }

    const posterSql = `
      SELECT movie_id, title, poster_url, backdrop_url
      FROM movie
      WHERE movie_id = $1
    `;

    const result = await pool.query(posterSql, [movieId]);

    if (result.rows.length === 0) {
      return sendError(res, 404, 'Movie Not Found', `No movie found with ID ${movieId}`);
    }

    const movie = result.rows[0];

    // TMDB image base URL
    const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

    // Build complete URLs for posters
    const posterUrl = movie.poster_url ? `${TMDB_IMAGE_BASE_URL}${movie.poster_url}` : null;
    const backdropUrl = movie.backdrop_url ? `${TMDB_IMAGE_BASE_URL}${movie.backdrop_url}` : null;

    const responseData = {
      movieId: movie.movie_id,
      title: movie.title,
      posterUrl,
      backdropUrl
    };

    return sendSuccess(res, responseData, `Retrieved poster information for movie "${movie.title}"`);

  } catch (error) {
    console.error('Error in getMoviePoster:', error);
    return sendError(res, 500, 'Internal Server Error', 'An error occurred while retrieving poster information');
  }
};

/**
 * Search for actors by name
 * Returns all movies featuring actors that match the search term
 *
 * @example Request:
 * GET /api/v1/actors/search?q=Tom&limit=5
 *
 * @example Response:
 * {
 *   success: true,
 *   message: "Found 3 movies with actors matching 'Tom'",
 *   data: {
 *     data: [...movies...],
 *     pagination: { limit: 5, offset: 0, totalCount: 3, hasNext: false, hasPrevious: false },
 *     searchTerm: "Tom"
 *   }
 * }
 */
const searchActors = async (req, res) => {
  try {
    const searchTerm = req.query.q || '';
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    // SQL query to search for actors (case-insensitive partial match)
    const moviesSql = `
      SELECT movie_id, title, release_year, runtime_minutes, rating, box_office,
             director_id, country_id, overview, genres, director_name, budget,
             studios, poster_url, backdrop_url, collection, original_title, actors
      FROM movie
      WHERE LOWER(actors) LIKE LOWER($1)
      ORDER BY box_office DESC, title ASC
      LIMIT $2 OFFSET $3
    `;

    const countSql = `
      SELECT COUNT(*)
      FROM movie
      WHERE LOWER(actors) LIKE LOWER($1)
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

    return sendSuccess(res, responseData, `Found ${moviesResult.rows.length} movies with actors matching "${searchTerm}"`);

  } catch (error) {
    console.error('Error in searchActors:', error);
    return sendError(res, 500, 'Internal Server Error', 'An error occurred while searching actors');
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
 * Get movies by MPA rating (G, PG, PG-13, R, NC-17, etc.)
 * 
 * @route GET /api/v1/movies/mpa/:rating
 * @param {Object} req - Express request object
 * @param {string} req.params.rating - MPA rating to filter by
 * @param {number} req.query.limit - Number of movies per page
 * @param {number} req.query.offset - Number of records to skip
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const getMoviesByMPARating = async (req, res) => {
  try {
    const rating = req.params.rating?.toUpperCase();
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;

    if (!rating) {
      return sendError(res, 400, 'Bad Request', 'MPA rating parameter is required');
    }

    const moviesSql = `
      SELECT movie_id, title, release_year, runtime_minutes, rating, box_office, director_id, country_id,
             overview, genres, director_name, budget, studios, poster_url, backdrop_url,
             collection, original_title, actors, mpa_rating
      FROM movie
      WHERE UPPER(mpa_rating) = $1
      ORDER BY box_office DESC NULLS LAST, title ASC
      LIMIT $2 OFFSET $3
    `;

    const countSql = `SELECT COUNT(*) FROM movie WHERE UPPER(mpa_rating) = $1`;

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
      mpaRating: rating
    };

    return sendSuccess(res, responseData, `Retrieved ${moviesResult.rows.length} movies with ${rating} rating`);

  } catch (error) {
    console.error('Error in getMoviesByMPARating:', error);
    return sendError(res, 500, 'Internal Server Error', 'An error occurred while retrieving movies by MPA rating');
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
 * Get actor IDs from a specific movie
 * Returns a list of actors with their assigned IDs based on alphabetical ordering
 *
 * @route GET /api/v1/movies/:id/actors
 */
const getActorsFromMovie = async (req, res) => {
  try {
    const movieId = parseInt(req.params.id);

    if (Number.isNaN(movieId) || movieId < 1) {
      return sendError(res, 400, 'Bad Request', 'Movie ID must be a valid positive number');
    }

    // Get the movie's actors
    const movieSql = `
      SELECT movie_id, title, actors
      FROM movie
      WHERE movie_id = $1
    `;

    const movieResult = await pool.query(movieSql, [movieId]);

    if (movieResult.rows.length === 0) {
      return sendError(res, 404, 'Movie Not Found', `Movie with ID ${movieId} not found`);
    }

    const movie = movieResult.rows[0];

    if (!movie.actors || movie.actors.trim() === '') {
      return sendSuccess(res, {
        movieId: movie.movie_id,
        title: movie.title,
        actors: [],
        totalActors: 0
      }, 'No actors found for this movie');
    }

    // Get all unique actors from the database to create consistent IDs
    const allActorsSql = `
      SELECT DISTINCT
        UNNEST(STRING_TO_ARRAY(actors, ', ')) as actor_name
      FROM movie
      WHERE actors IS NOT NULL AND actors != ''
      ORDER BY actor_name
    `;

    const allActorsResult = await pool.query(allActorsSql);

    // Create a mapping of actor names to IDs
    const actorNameToId = {};
    allActorsResult.rows.forEach((row, index) => {
      actorNameToId[row.actor_name] = index + 1;
    });

    // Parse the movie's actors and assign IDs
    const movieActors = movie.actors.split(', ').map(actorName => ({
      actorId: actorNameToId[actorName] || null,
      actorName: actorName.trim()
    }));

    const responseData = {
      movieId: movie.movie_id,
      title: movie.title,
      actors: movieActors,
      totalActors: movieActors.length
    };

    return sendSuccess(res, responseData, `Retrieved ${movieActors.length} actors for movie "${movie.title}"`);

  } catch (error) {
    console.error('Error in getActorsFromMovie:', error);
    return sendError(res, 500, 'Internal Server Error', 'An error occurred while retrieving actors');
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

/**
 * Create a new movie
 * 
 * @route POST /api/v1/movies
 */
const createMovie = async (req, res) => {
  try {
    const { 
      title, 
      release_year, 
      runtime_minutes, 
      rating, 
      box_office, 
      director_id, 
      country_id,
      overview,
      genres,
      budget,
      studios,
      poster_url,
      backdrop_url,
      collection,
      original_title,
      mpa_rating
    } = req.body;

    if (!title || !release_year) {
      return sendError(res, 400, 'Missing Required Fields', 'Title and release year are required');
    }

    // Validate constraints to provide better error messages
    const currentYear = new Date().getFullYear();
    if (release_year < 1900 || release_year > currentYear) {
      return sendError(res, 400, 'Invalid Release Year', `Release year must be between 1900 and ${currentYear}`);
    }

    if (runtime_minutes !== undefined && runtime_minutes !== null && runtime_minutes <= 0) {
      return sendError(res, 400, 'Invalid Runtime', 'Runtime must be greater than 0 minutes');
    }

    if (rating !== undefined && rating !== null && (rating < 0 || rating > 10)) {
      return sendError(res, 400, 'Invalid Rating', 'Rating must be between 0 and 10');
    }

    const movieSql = `
      INSERT INTO movie (
        title, release_year, runtime_minutes, rating, box_office, director_id, country_id,
        overview, genres, budget, studios, poster_url, backdrop_url, collection, 
        original_title, mpa_rating
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *
    `;

    const result = await pool.query(movieSql, [
      title, release_year, runtime_minutes, rating, box_office, director_id, country_id,
      overview, genres, budget, studios, poster_url, backdrop_url, collection, 
      original_title, mpa_rating
    ]);

    return sendSuccess(res, result.rows[0], 'Movie created successfully');

  } catch (error) {
    console.error('Error creating movie:', error);
    
    // Provide specific error messages for constraint violations
    if (error.code === '23514') { // Check constraint violation
      return sendError(res, 400, 'Validation Error', error.detail || 'Data violates database constraints');
    }
    if (error.code === '23503') { // Foreign key violation
      return sendError(res, 400, 'Invalid Reference', 'Referenced director or country does not exist');
    }
    
    return sendError(res, 500, 'Internal Server Error', 'An error occurred while creating the movie');
  }
};

/**
 * Update an existing movie
 * 
 * @route PUT /api/v1/movies/:id
 */
const updateMovie = async (req, res) => {
  try {
    const movieId = parseInt(req.params.id);
    const updates = req.body;

    if (!movieId) {
      return sendError(res, 400, 'Invalid Movie ID', 'Movie ID must be a valid number');
    }

    const existingMovie = await pool.query('SELECT * FROM movie WHERE movie_id = $1', [movieId]);
    if (existingMovie.rows.length === 0) {
      return sendError(res, 404, 'Movie Not Found', 'Movie with the specified ID does not exist');
    }

    // Validate constraints before updating
    const currentYear = new Date().getFullYear();
    if (updates.release_year !== undefined) {
      if (updates.release_year < 1900 || updates.release_year > currentYear) {
        return sendError(res, 400, 'Invalid Release Year', `Release year must be between 1900 and ${currentYear}`);
      }
    }

    if (updates.runtime_minutes !== undefined && updates.runtime_minutes !== null) {
      if (updates.runtime_minutes <= 0) {
        return sendError(res, 400, 'Invalid Runtime', 'Runtime must be greater than 0 minutes');
      }
    }

    if (updates.rating !== undefined && updates.rating !== null) {
      if (updates.rating < 0 || updates.rating > 10) {
        return sendError(res, 400, 'Invalid Rating', 'Rating must be between 0 and 10');
      }
    }

    const updateFields = [];
    const values = [];
    let paramCounter = 1;

    Object.keys(updates).forEach(field => {
      if (updates[field] !== undefined) {
        updateFields.push(`${field} = $${paramCounter}`);
        values.push(updates[field]);
        paramCounter++;
      }
    });

    if (updateFields.length === 0) {
      return sendError(res, 400, 'No Updates Provided', 'At least one field must be provided for update');
    }

    values.push(movieId);

    const updateSql = `
      UPDATE movie 
      SET ${updateFields.join(', ')}
      WHERE movie_id = $${paramCounter}
      RETURNING *
    `;

    const result = await pool.query(updateSql, values);
    return sendSuccess(res, result.rows[0], 'Movie updated successfully');

  } catch (error) {
    console.error('Error updating movie:', error);
    
    // Provide specific error messages for constraint violations
    if (error.code === '23514') { // Check constraint violation
      return sendError(res, 400, 'Validation Error', error.detail || 'Data violates database constraints');
    }
    if (error.code === '23503') { // Foreign key violation
      return sendError(res, 400, 'Invalid Reference', 'Referenced director or country does not exist');
    }
    
    return sendError(res, 500, 'Internal Server Error', 'An error occurred while updating the movie');
  }
};

/**
 * Delete a movie
 * 
 * @route DELETE /api/v1/movies/:id
 */
const deleteMovie = async (req, res) => {
  try {
    const movieId = parseInt(req.params.id);

    if (!movieId) {
      return sendError(res, 400, 'Invalid Movie ID', 'Movie ID must be a valid number');
    }

    const existingMovie = await pool.query('SELECT title FROM movie WHERE movie_id = $1', [movieId]);
    if (existingMovie.rows.length === 0) {
      return sendError(res, 404, 'Movie Not Found', 'Movie with the specified ID does not exist');
    }

    const movieTitle = existingMovie.rows[0].title;
    await pool.query('DELETE FROM movie WHERE movie_id = $1', [movieId]);

    return sendSuccess(res, { movie_id: movieId, title: movieTitle }, 'Movie deleted successfully');

  } catch (error) {
    console.error('Error deleting movie:', error);
    return sendError(res, 500, 'Internal Server Error', 'An error occurred while deleting the movie');
  }
};

module.exports = {
  getAllMovies,
  getTopGrossingMovies,
  getMoviesByDirector,
  getMoviesByActor,
  getRecentMovies,
  searchMovies,
  searchMovieById,
  searchActors,
  getMoviesByRating,
  getMoviesByMPARating,
  getMovieById,
  getMoviePoster,
  getActorsFromMovie,
  getStats,
  createMovie,
  updateMovie,
  deleteMovie
};
