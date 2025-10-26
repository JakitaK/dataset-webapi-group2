require('dotenv').config();
const pool = require('./src/db');

async function removeDuplicates() {
  const client = await pool.connect();
  
  try {
    console.log('Starting duplicate removal process...');
    
    // First, let's see the scope of the problem
    const duplicateCheck = await client.query(`
      SELECT title, release_year, COUNT(*) as count 
      FROM movie 
      GROUP BY title, release_year 
      HAVING COUNT(*) > 1 
      ORDER BY count DESC, title
    `);
    
    console.log(`Found ${duplicateCheck.rows.length} movies with duplicates:`);
    duplicateCheck.rows.slice(0, 10).forEach(row => {
      console.log(`"${row.title}" (${row.release_year}): ${row.count} entries`);
    });
    
    if (duplicateCheck.rows.length === 0) {
      console.log('No duplicates found!');
      return;
    }
    
    console.log('\nRemoving duplicates (keeping the first occurrence of each movie)...');
    
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
    console.log(`Removed ${result.rowCount} duplicate movie records`);
    
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
      console.log('✅ All duplicates successfully removed!');
    } else {
      console.log(`⚠️  Still ${remainingDuplicates.rows.length} movies with duplicates remaining`);
    }
    
  } catch (error) {
    console.error('Error removing duplicates:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

removeDuplicates();