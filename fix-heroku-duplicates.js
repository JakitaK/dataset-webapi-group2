require('dotenv').config();
const { Pool } = require('pg');

// Force connection to Heroku production database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function fixProductionDuplicates() {
  const client = await pool.connect();
  
  try {
    console.log('🚨 FIXING PRODUCTION DUPLICATES ON HEROKU');
    console.log('Connecting to Heroku production database...\n');
    
    // First, verify we have duplicates
    const duplicateCheck = await client.query(`
      SELECT title, release_year, COUNT(*) as count,
             array_agg(movie_id ORDER BY movie_id) as movie_ids
      FROM movie 
      GROUP BY title, release_year 
      HAVING COUNT(*) > 1 
      ORDER BY count DESC
      LIMIT 10
    `);
    
    console.log(`Found ${duplicateCheck.rows.length} sets of duplicate movies:`);
    duplicateCheck.rows.forEach(row => {
      console.log(`"${row.title}" (${row.release_year}): ${row.count} entries - IDs: ${row.movie_ids.join(', ')}`);
    });
    
    if (duplicateCheck.rows.length === 0) {
      console.log('✅ No duplicates found!');
      return;
    }
    
    // Get total count before cleanup
    const totalBefore = await client.query('SELECT COUNT(*) FROM movie');
    console.log(`\nTotal movies before cleanup: ${totalBefore.rows[0].count}`);
    
    // Start transaction for safety
    await client.query('BEGIN');
    
    console.log('\n🔧 Removing duplicates (keeping movie with smallest ID for each title/year)...');
    
    // Delete duplicates, keeping only the one with the minimum movie_id
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
    
    // Check if duplicates still exist
    const remainingDuplicates = await client.query(`
      SELECT title, release_year, COUNT(*) as count 
      FROM movie 
      GROUP BY title, release_year 
      HAVING COUNT(*) > 1
    `);
    
    if (remainingDuplicates.rows.length === 0) {
      console.log('🎉 SUCCESS! All duplicates removed from production database!');
      console.log('🚀 Your Heroku API should now show unique movies.');
    } else {
      console.log(`⚠️ ${remainingDuplicates.rows.length} sets of duplicates still remain`);
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

fixProductionDuplicates();