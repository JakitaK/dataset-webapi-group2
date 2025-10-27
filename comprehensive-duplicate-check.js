require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function comprehensiveDuplicateCheck() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 COMPREHENSIVE DUPLICATE ANALYSIS ON HEROKU DATABASE\n');
    
    // Check 1: Movies with same title and year (current approach)
    const exactDuplicates = await client.query(`
      SELECT title, release_year, COUNT(*) as count,
             array_agg(movie_id ORDER BY movie_id) as movie_ids
      FROM movie 
      WHERE release_year = 2019
      GROUP BY title, release_year 
      HAVING COUNT(*) > 1 
      ORDER BY title
      LIMIT 10
    `);
    
    console.log(`1. Exact duplicates (same title + year) in 2019: ${exactDuplicates.rows.length}`);
    exactDuplicates.rows.forEach(row => {
      console.log(`   "${row.title}": IDs ${row.movie_ids.join(', ')}`);
    });
    
    // Check 2: All 2019 movies to see the pattern
    const all2019 = await client.query(`
      SELECT movie_id, title, release_year, director_name, overview
      FROM movie 
      WHERE release_year = 2019 
      ORDER BY title, movie_id
    `);
    
    console.log(`\n2. Total 2019 movies in database: ${all2019.rows.length}`);
    
    // Group by title to find duplicates manually
    const titleGroups = {};
    all2019.rows.forEach(movie => {
      if (!titleGroups[movie.title]) {
        titleGroups[movie.title] = [];
      }
      titleGroups[movie.title].push(movie);
    });
    
    const manualDuplicates = Object.entries(titleGroups).filter(([title, movies]) => movies.length > 1);
    console.log(`   Titles appearing multiple times: ${manualDuplicates.length}`);
    
    manualDuplicates.slice(0, 5).forEach(([title, movies]) => {
      console.log(`   "${title}": ${movies.length} entries`);
      movies.forEach(movie => {
        console.log(`      ID: ${movie.movie_id}, Director: ${movie.director_name || 'N/A'}`);
        console.log(`      Overview: ${(movie.overview || 'N/A').substring(0, 60)}...`);
      });
    });
    
    // Check 3: Look at ID ranges
    const idRanges = await client.query(`
      SELECT 
        MIN(movie_id) as min_id,
        MAX(movie_id) as max_id,
        COUNT(*) as total_count
      FROM movie
    `);
    
    console.log(`\n3. Movie ID ranges:`);
    console.log(`   Min ID: ${idRanges.rows[0].min_id}`);
    console.log(`   Max ID: ${idRanges.rows[0].max_id}`);
    console.log(`   Total movies: ${idRanges.rows[0].total_count}`);
    
    // Check 4: Look for movies in different ID ranges
    const idDistribution = await client.query(`
      SELECT 
        CASE 
          WHEN movie_id < 10000 THEN 'Low (< 10k)'
          WHEN movie_id < 20000 THEN 'Mid-Low (10k-20k)'
          WHEN movie_id < 30000 THEN 'Mid-High (20k-30k)'
          ELSE 'High (30k+)'
        END as id_range,
        COUNT(*) as count,
        MIN(movie_id) as min_id,
        MAX(movie_id) as max_id
      FROM movie 
      GROUP BY 1 
      ORDER BY min_id
    `);
    
    console.log(`\n4. Movie ID distribution:`);
    idDistribution.rows.forEach(row => {
      console.log(`   ${row.id_range}: ${row.count} movies (${row.min_id} - ${row.max_id})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

comprehensiveDuplicateCheck();