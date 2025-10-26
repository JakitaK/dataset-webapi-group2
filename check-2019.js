require('dotenv').config();
const pool = require('./src/db');

async function check2019Duplicates() {
  const client = await pool.connect();
  
  try {
    console.log('Checking 2019 movies for duplicates...');
    
    // Get all 2019 movies with exact duplicates (same title AND year)
    const duplicates2019 = await client.query(`
      SELECT title, release_year, COUNT(*) as count, 
             string_agg(movie_id::text, ', ' ORDER BY movie_id) as movie_ids
      FROM movie 
      WHERE release_year = 2019
      GROUP BY title, release_year 
      HAVING COUNT(*) > 1 
      ORDER BY title
    `);
    
    console.log(`Found ${duplicates2019.rows.length} duplicate movie titles in 2019:`);
    duplicates2019.rows.forEach(row => {
      console.log(`"${row.title}" (${row.release_year}): ${row.count} entries - IDs: ${row.movie_ids}`);
    });
    
    // Get total count of 2019 movies
    const total2019 = await client.query('SELECT COUNT(*) FROM movie WHERE release_year = 2019');
    console.log(`\nTotal 2019 movies in database: ${total2019.rows[0].count}`);
    
    // Get sample 2019 movies to see the actual data
    const sample2019 = await client.query(`
      SELECT movie_id, title, director_name, overview 
      FROM movie 
      WHERE release_year = 2019 
      ORDER BY title 
      LIMIT 10
    `);
    
    console.log('\nSample 2019 movies:');
    sample2019.rows.forEach(movie => {
      console.log(`ID: ${movie.movie_id} - "${movie.title}" by ${movie.director_name}`);
      console.log(`   Overview: ${movie.overview?.substring(0, 100)}...`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

check2019Duplicates();