const express = require('express');
const router = express.Router();
const pool = require('../db');

/**
 * @swagger
 * /api/v1/moviebyyear:
 *   get:
 *     summary: Get movies by release year
 *     description: Returns all movies released in the specified year
 *     tags: [Movies]
 *     parameters:
 *       - in: query
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *           example: 2019
 *         description: The year to filter movies by
 *     responses:
 *       200:
 *         description: Successful response with movies data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MovieResponse'
 *             example:
 *               data:
 *                 - movie_id: 7350
 *                   title: "1917"
 *                   release_year: 2019
 *                   runtime_minutes: 119
 *                   rating: "7.5"
 *                   box_office: "394638258.00"
 *                   director_id: 1
 *                   country_id: 1
 *               total: 486
 *       400:
 *         description: Bad request - invalid year parameter
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Invalid year"
 *               details: "year query parameter must be an integer"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/moviebyyear', async (req, res) => {
  const year = parseInt(req.query.year, 10);
  if (Number.isNaN(year)) {
    return res.status(400).json({ error: 'Invalid year', details: 'year query parameter must be an integer' });
  }

  try {
    const sql = `SELECT movie_id, title, release_year, runtime_minutes, rating, box_office, director_id, country_id
                 FROM movie WHERE release_year = $1 ORDER BY title ASC`;
    const { rows } = await pool.query(sql, [year]);
    return res.json({ data: rows, total: rows.length });
  } catch (err) {
    // Log and return error following OpenAPI Error schema used elsewhere
    console.error('DB error in /moviebyyear', err);
    return res.status(500).json({ error: 'Internal Server Error', details: err.message });
  }
});

module.exports = router;
