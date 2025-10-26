require('dotenv').config();
const { Pool } = require('pg');

// Force connection to Heroku production database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function testProductionAPI() {
  const client = await pool.connect();
  
  try {
    console.log('Testing production database queries...\n');
    
    // Test the exact query used by moviebyyear endpoint
    console.log('🔍 Testing moviebyyear query for 2019:');
    const moviesByYear = await client.query(`
      SELECT movie_id, title, release_year, runtime_minutes, rating, box_office, director_id, country_id
      FROM movie 
      WHERE release_year = $1
      ORDER BY title
    `, [2019]);
    
    console.log(`Found ${moviesByYear.rows.length} movies for 2019`);
    
    // Check for any exact duplicates in the result
    const titleCounts = {};
    moviesByYear.rows.forEach(movie => {
      const key = `${movie.title}|${movie.release_year}`;
      titleCounts[key] = (titleCounts[key] || 0) + 1;
    });
    
    const duplicates = Object.entries(titleCounts).filter(([key, count]) => count > 1);
    
    if (duplicates.length > 0) {
      console.log('\n❌ Found duplicates in query result:');
      duplicates.forEach(([key, count]) => {
        const [title, year] = key.split('|');
        console.log(`"${title}" (${year}): ${count} times`);
      });
    } else {
      console.log('✅ No duplicates in query result');
    }
    
    // Show first 10 movies
    console.log('\nFirst 10 movies from 2019:');
    moviesByYear.rows.slice(0, 10).forEach((movie, index) => {
      console.log(`${index + 1}. ID: ${movie.movie_id} - "${movie.title}"`);
    });
    
    // Test a specific movie that should appear once
    const testMovie = await client.query(`
      SELECT movie_id, title, release_year 
      FROM movie 
      WHERE title = '1917' AND release_year = 2019
    `);
    
    console.log(`\n🎬 Testing specific movie "1917" (2019): Found ${testMovie.rows.length} entries`);
    testMovie.rows.forEach(movie => {
      console.log(`   ID: ${movie.movie_id} - "${movie.title}" (${movie.release_year})`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

testProductionAPI();