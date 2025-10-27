const { Pool } = require('pg');

// Use the ACTUAL Heroku database URL that the deployed app uses
const HEROKU_DATABASE_URL = 'postgres://ub53cc4b3bsh46:pd232a2a4c6db76cf2debc2a240d77ff3299c54afbf8e8193a518d5d5f4195782@c34u0gd6rbe7bo.cluster-czrs8kj4isg7.us-east-1.rds.amazonaws.com:5432/d4ah8hde9jno0o';

const pool = new Pool({
  connectionString: HEROKU_DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function fixActualHerokuDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('🎯 FIXING THE ACTUAL HEROKU DATABASE');
    console.log('Connecting to the database that the deployed app actually uses...\n');
    
    // First, verify this is the right database by checking the ID ranges
    const idCheck = await client.query(`
      SELECT MIN(movie_id) as min_id, MAX(movie_id) as max_id, COUNT(*) as total
      FROM movie
    `);
    
    console.log(`Database ID range: ${idCheck.rows[0].min_id} - ${idCheck.rows[0].max_id}`);
    console.log(`Total movies: ${idCheck.rows[0].total}\n`);
    
    // Check for 2019 movies specifically
    const movies2019 = await client.query(`
      SELECT title, COUNT(*) as count,
             array_agg(movie_id ORDER BY movie_id) as movie_ids
      FROM movie 
      WHERE release_year = 2019
      GROUP BY title 
      HAVING COUNT(*) > 1
      ORDER BY count DESC, title
      LIMIT 10
    `);
    
    console.log(`Found ${movies2019.rows.length} duplicate movie titles in 2019:`);
    movies2019.rows.forEach(row => {
      console.log(`"${row.title}": ${row.count} entries - IDs: ${row.movie_ids.join(', ')}`);
    });
    
    if (movies2019.rows.length === 0) {
      console.log('❌ No duplicates found - this might not be the right database!');
      return;
    }
    
    // Get total count before cleanup
    const totalBefore = await client.query('SELECT COUNT(*) FROM movie');
    console.log(`\nTotal movies before cleanup: ${totalBefore.rows[0].count}`);
    
    // Check all duplicates, not just 2019
    const allDuplicates = await client.query(`
      SELECT title, release_year, COUNT(*) as count
      FROM movie 
      GROUP BY title, release_year 
      HAVING COUNT(*) > 1
    `);
    
    console.log(`Total duplicate sets across all years: ${allDuplicates.rows.length}`);
    
    if (allDuplicates.rows.length === 0) {
      console.log('✅ No duplicates found in this database');
      return;
    }
    
    console.log('\n🔧 Starting cleanup - removing duplicates (keeping movie with smallest ID)...');
    
    // Start transaction for safety
    await client.query('BEGIN');
    
    // Delete duplicates, keeping only the one with the minimum movie_id for each title+year combination
    const deleteResult = await client.query(`
      DELETE FROM movie 
      WHERE movie_id IN (
        SELECT movie_id 
        FROM (
          SELECT movie_id,
                 ROW_NUMBER() OVER (PARTITION BY title, release_year ORDER BY movie_id) as rn
          FROM movie
        ) t 
        WHERE t.rn > 1
      )
    `);
    
    console.log(`✅ Removed ${deleteResult.rowCount} duplicate records`);
    
    // Commit the transaction
    await client.query('COMMIT');
    
    // Verify cleanup
    const totalAfter = await client.query('SELECT COUNT(*) FROM movie');
    console.log(`Total movies after cleanup: ${totalAfter.rows[0].count}`);
    
    // Check 2019 specifically
    const movies2019After = await client.query(`
      SELECT COUNT(*) FROM movie WHERE release_year = 2019
    `);
    console.log(`2019 movies after cleanup: ${movies2019After.rows[0].count}`);
    
    // Final verification - no duplicates should remain
    const remainingDuplicates = await client.query(`
      SELECT title, release_year, COUNT(*) as count 
      FROM movie 
      GROUP BY title, release_year 
      HAVING COUNT(*) > 1
    `);
    
    if (remainingDuplicates.rows.length === 0) {
      console.log('\n🎉 SUCCESS! All duplicates removed from the ACTUAL Heroku database!');
      console.log('🚀 Your API should now return unique movies for all years.');
    } else {
      console.log(`\n⚠️ ${remainingDuplicates.rows.length} sets of duplicates still remain`);
    }
    
  } catch (error) {
    // Rollback on error
    await client.query('ROLLBACK');
    console.error('❌ Error removing duplicates:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

console.log('🚨 WARNING: This will modify the PRODUCTION database that your Heroku app uses!');
console.log('This will remove duplicate movie records permanently.');
console.log('Press Ctrl+C within 5 seconds to cancel...\n');

setTimeout(() => {
  fixActualHerokuDatabase();
}, 5000);