const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/v1/moviebyyear?year=YYYY
// Returns an array of movies released in the specified year.
// Response shape: { data: [ { movie_id, title, release_year, runtime_minutes, rating, box_office, director_id, country_id } ], total }
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
