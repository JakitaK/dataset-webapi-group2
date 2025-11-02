const { Pool } = require('pg');

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL, 
  ssl: { rejectUnauthorized: false } 
});

async function checkData() {
  try {
    // Check movie director_id distribution
    const movieResult = await pool.query(
      'SELECT director_id, COUNT(*) as count FROM movie GROUP BY director_id ORDER BY count DESC LIMIT 10'
    );
    console.log('\n=== Movie director_id distribution (top 10) ===');
    movieResult.rows.forEach(row => {
      console.log(`director_id ${row.director_id}: ${row.count} movies`);
    });

    // Check director table
    const directorResult = await pool.query(
      'SELECT COUNT(*) as count FROM director'
    );
    console.log('\n=== Director table ===');
    console.log(`Total directors: ${directorResult.rows[0].count}`);

    if (directorResult.rows[0].count > 0) {
      const sampleDirectors = await pool.query(
        'SELECT director_id, name FROM director ORDER BY director_id LIMIT 10'
      );
      console.log('\nSample directors:');
      sampleDirectors.rows.forEach(row => {
        console.log(`  ${row.director_id}: ${row.name}`);
      });
    }

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

checkData();
