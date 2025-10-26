require('dotenv').config();
const pool = require('./src/db');

async function checkForDuplicates() {
  try {
    console.log('Checking for duplicate movies in database...');
    
    // Check for duplicate titles
    const duplicateTitles = await pool.query(`
      SELECT title, COUNT(*) as count 
      FROM movie 
      GROUP BY title 
      HAVING COUNT(*) > 1 
      ORDER BY count DESC 
      LIMIT 10
    `);
    
    console.log('\nMovies with duplicate titles:');
    duplicateTitles.rows.forEach(row => {
      console.log(`"${row.title}": ${row.count} entries`);
    });
    
    // Check total movie count
    const totalCount = await pool.query('SELECT COUNT(*) FROM movie');
    console.log(`\nTotal movies in database: ${totalCount.rows[0].count}`);
    
    // Get a sample movie to see data structure
    const sample = await pool.query('SELECT * FROM movie LIMIT 1');
    console.log('\nSample movie record:');
    console.log(JSON.stringify(sample.rows[0], null, 2));
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    await pool.end();
  }
}

checkForDuplicates();