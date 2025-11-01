/**
 * Directors controller - CRUD operations for directors
 */

const pool = require('../db');
const { sendSuccess, sendError } = require('../utilities/responseUtils');

/**
 * Get all directors
 * 
 * @route GET /api/v1/directors
 */
const getAllDirectors = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    const directorsSql = `
      SELECT d.director_id, d.name, COUNT(m.movie_id) as movie_count
      FROM director d
      LEFT JOIN movie m ON d.director_id = m.director_id
      GROUP BY d.director_id, d.name
      ORDER BY d.name ASC
      LIMIT $1 OFFSET $2
    `;

    const countSql = 'SELECT COUNT(*) FROM director';

    const [directorsResult, countResult] = await Promise.all([
      pool.query(directorsSql, [limit, offset]),
      pool.query(countSql)
    ]);

    const totalCount = parseInt(countResult.rows[0].count);

    const responseData = {
      data: directorsResult.rows,
      pagination: {
        limit,
        offset,
        totalCount,
        hasNext: offset + limit < totalCount,
        hasPrevious: offset > 0
      }
    };

    return sendSuccess(res, responseData, 'Retrieved directors successfully');

  } catch (error) {
    console.error('Error getting directors:', error);
    return sendError(res, 500, 'Internal Server Error', 'An error occurred while retrieving directors');
  }
};

/**
 * Create a new director
 * 
 * @route POST /api/v1/directors
 */
const createDirector = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return sendError(res, 400, 'Missing Required Field', 'Director name is required');
    }

    // Check if director already exists
    const existingDirector = await pool.query('SELECT * FROM director WHERE name = $1', [name]);
    if (existingDirector.rows.length > 0) {
      return sendError(res, 409, 'Director Already Exists', 'A director with this name already exists');
    }

    const result = await pool.query(
      'INSERT INTO director (name) VALUES ($1) RETURNING *',
      [name]
    );

    return sendSuccess(res, result.rows[0], 'Director created successfully');

  } catch (error) {
    console.error('Error creating director:', error);
    return sendError(res, 500, 'Internal Server Error', 'An error occurred while creating the director');
  }
};

/**
 * Update a director
 * 
 * @route PUT /api/v1/directors/:id
 */
const updateDirector = async (req, res) => {
  try {
    const directorId = parseInt(req.params.id);
    const { name } = req.body;

    if (!directorId) {
      return sendError(res, 400, 'Invalid Director ID', 'Director ID must be a valid number');
    }

    if (!name) {
      return sendError(res, 400, 'Missing Required Field', 'Director name is required');
    }

    // Check if director exists
    const existingDirector = await pool.query('SELECT * FROM director WHERE director_id = $1', [directorId]);
    if (existingDirector.rows.length === 0) {
      return sendError(res, 404, 'Director Not Found', 'Director with the specified ID does not exist');
    }

    const result = await pool.query(
      'UPDATE director SET name = $1 WHERE director_id = $2 RETURNING *',
      [name, directorId]
    );

    return sendSuccess(res, result.rows[0], 'Director updated successfully');

  } catch (error) {
    console.error('Error updating director:', error);
    return sendError(res, 500, 'Internal Server Error', 'An error occurred while updating the director');
  }
};

/**
 * Delete a director
 * 
 * @route DELETE /api/v1/directors/:id
 */
const deleteDirector = async (req, res) => {
  try {
    const directorId = parseInt(req.params.id);

    if (!directorId) {
      return sendError(res, 400, 'Invalid Director ID', 'Director ID must be a valid number');
    }

    // Check if director exists
    const existingDirector = await pool.query('SELECT * FROM director WHERE director_id = $1', [directorId]);
    if (existingDirector.rows.length === 0) {
      return sendError(res, 404, 'Director Not Found', 'Director with the specified ID does not exist');
    }

    // Check if director has movies
    const movieCount = await pool.query('SELECT COUNT(*) FROM movie WHERE director_id = $1', [directorId]);
    if (parseInt(movieCount.rows[0].count) > 0) {
      return sendError(res, 409, 'Cannot Delete Director', 'Director has associated movies. Update or delete movies first.');
    }

    const directorName = existingDirector.rows[0].name;
    await pool.query('DELETE FROM director WHERE director_id = $1', [directorId]);

    return sendSuccess(res, { director_id: directorId, name: directorName }, 'Director deleted successfully');

  } catch (error) {
    console.error('Error deleting director:', error);
    return sendError(res, 500, 'Internal Server Error', 'An error occurred while deleting the director');
  }
};

module.exports = {
  getAllDirectors,
  createDirector,
  updateDirector,
  deleteDirector
};