require('dotenv').config();
const { Pool } = require('pg');

// Force connection to Heroku production database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // Required for Heroku PostgreSQL
});

async function removeProductionDuplicates() {
  const client = await pool.connect();
  
  try {
    console.log('Connecting to Heroku production database...');
    console.log('🚨 WARNING: This will modify the PRODUCTION database!');
    
    // First, check what duplicates exist in production
    const duplicateCheck = await client.query(`
      SELECT title, release_year, COUNT(*) as count,
             string_agg(movie_id::text, ', ' ORDER BY movie_id) as movie_ids
      FROM movie 
      GROUP BY title, release_year 
      HAVING COUNT(*) > 1 
      ORDER BY count DESC, title
      LIMIT 20
    `);
    
    console.log(`\nFound ${duplicateCheck.rows.length} sets of duplicate movies in production:`);
    duplicateCheck.rows.forEach(row => {
      console.log(`"${row.title}" (${row.release_year}): ${row.count} entries - IDs: ${row.movie_ids}`);
    });
    
    if (duplicateCheck.rows.length === 0) {
      console.log('✅ No duplicates found in production database!');
      return;
    }
    
    // Check specifically 2019 movies
    const duplicates2019 = await client.query(`
      SELECT title, release_year, COUNT(*) as count,
             string_agg(movie_id::text, ', ' ORDER BY movie_id) as movie_ids
      FROM movie 
      WHERE release_year = 2019
      GROUP BY title, release_year 
      HAVING COUNT(*) > 1 
      ORDER BY title
    `);
    
    console.log(`\nFound ${duplicates2019.rows.length} duplicate 2019 movies:`);
    duplicates2019.rows.forEach(row => {
      console.log(`"${row.title}" (${row.release_year}): ${row.count} entries - IDs: ${row.movie_ids}`);
    });
    
    const totalBefore = await client.query('SELECT COUNT(*) FROM movie');
    console.log(`\nTotal movies before cleanup: ${totalBefore.rows[0].count}`);
    
    console.log('\n🔧 Removing duplicates (keeping the movie with the smallest movie_id for each title/year combination)...');
    
    // Remove duplicates by keeping only the movie with the smallest movie_id for each title/year combination
    const removeQuery = `
      DELETE FROM movie 
      WHERE movie_id NOT IN (
        SELECT MIN(movie_id)
        FROM movie
        GROUP BY title, release_year
      )
    `;
    
    const result = await client.query(removeQuery);
    console.log(`✅ Removed ${result.rowCount} duplicate movie records from PRODUCTION`);
    
    // Check the final count
    const finalCount = await client.query('SELECT COUNT(*) FROM movie');
    console.log(`Final movie count: ${finalCount.rows[0].count}`);
    
    // Verify no duplicates remain
    const remainingDuplicates = await client.query(`
      SELECT title, release_year, COUNT(*) as count 
      FROM movie 
      GROUP BY title, release_year 
      HAVING COUNT(*) > 1
    `);
    
    if (remainingDuplicates.rows.length === 0) {
      console.log('🎉 All duplicates successfully removed from PRODUCTION database!');
      console.log('🚀 Your Heroku app should now show unique movies for 2019 and all other years.');
    } else {
      console.log(`⚠️  Still ${remainingDuplicates.rows.length} movies with duplicates remaining`);
    }
    
  } catch (error) {
    console.error('❌ Error removing duplicates from production:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

console.log('🎯 Production Database Duplicate Removal');
console.log('This script will clean up duplicate movies in your Heroku database.');
console.log('Press Ctrl+C within 5 seconds if you want to cancel...\n');

setTimeout(() => {
  removeProductionDuplicates();
}, 5000);