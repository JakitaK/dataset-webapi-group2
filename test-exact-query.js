require('dotenv').config();
const pool = require('./src/db'); // Use the same pool as the API

async function testExactAPIQuery() {
  try {
    console.log('Testing the EXACT same query and pool that the API uses...\n');
    
    const year = 2019;
    const sql = `SELECT movie_id, title, release_year, runtime_minutes, rating, box_office, director_id, country_id
                 FROM movie WHERE release_year = $1 ORDER BY title ASC`;
    
    console.log(`Query: ${sql}`);
    console.log(`Parameter: ${year}\n`);
    
    const { rows } = await pool.query(sql, [year]);
    
    console.log(`Total rows returned: ${rows.length}`);
    
    // Check for duplicates
    const titleCounts = {};
    const movieIds = new Set();
    
    rows.forEach(movie => {
      const key = `${movie.title}|${movie.release_year}`;
      titleCounts[key] = (titleCounts[key] || 0) + 1;
      
      if (movieIds.has(movie.movie_id)) {
        console.log(`🚨 Duplicate movie ID found: ${movie.movie_id}`);
      }
      movieIds.add(movie.movie_id);
    });
    
    const duplicates = Object.entries(titleCounts).filter(([key, count]) => count > 1);
    
    if (duplicates.length > 0) {
      console.log('\n🚨 DUPLICATES FOUND in query result:');
      duplicates.slice(0, 10).forEach(([key, count]) => {
        const [title, year] = key.split('|');
        console.log(`   "${title}" (${year}): ${count} times`);
        
        // Show the IDs for this duplicate
        const duplicateEntries = rows.filter(row => 
          row.title === title && row.release_year.toString() === year
        );
        const ids = duplicateEntries.map(entry => entry.movie_id).join(', ');
        console.log(`      Movie IDs: ${ids}`);
      });
    } else {
      console.log('✅ No duplicates found in query result');
    }
    
    // Show first few results
    console.log('\nFirst 5 results:');
    rows.slice(0, 5).forEach((movie, index) => {
      console.log(`${index + 1}. ID: ${movie.movie_id} - "${movie.title}" (${movie.release_year})`);
    });
    
    await pool.end();
    
  } catch (error) {
    console.error('❌ Error:', error);
    await pool.end();
  }
}

testExactAPIQuery();