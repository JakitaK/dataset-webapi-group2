const fs = require('fs');
const path = require('path');
const csv = require('csv-parse/sync');
const { Pool } = require('pg');

// Use Heroku DATABASE_URL from environment
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable not set!');
  console.log('Run: $env:DATABASE_URL = "your-database-url-here"');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function reimportData() {
  const client = await pool.connect();
  
  try {
    console.log('📡 Connected to Heroku PostgreSQL database');
    
    // Start transaction
    await client.query('BEGIN');
    
    // 1. Clear existing movie data (CASCADE will handle foreign keys)
    console.log('\n🗑️  Clearing existing movie data...');
    await client.query('DELETE FROM movie');
    console.log('✅ Movies cleared');
    
    // 2. Clear existing director data
    console.log('\n🗑️  Clearing existing director data...');
    await client.query('DELETE FROM director');
    console.log('✅ Directors cleared');
    
    // 3. Import directors from directors_mapping.csv
    console.log('\n📥 Importing directors from directors_mapping.csv...');
    const directorsPath = path.join(__dirname, '..', 'data', 'directors_mapping.csv');
    const directorsContent = fs.readFileSync(directorsPath, 'utf-8');
    const directors = csv.parse(directorsContent, { columns: true, skip_empty_lines: true });
    
    let directorCount = 0;
    for (const director of directors) {
      await client.query(
        'INSERT INTO director (director_id, name) VALUES ($1, $2)',
        [parseInt(director.director_id), director.name]
      );
      directorCount++;
      if (directorCount % 500 === 0) {
        console.log(`   Imported ${directorCount} directors...`);
      }
    }
    console.log(`✅ Imported ${directorCount} directors`);
    
    // 4. Fix the director sequence
    console.log('\n🔧 Updating director sequence...');
    await client.query(`SELECT setval(pg_get_serial_sequence('director','director_id'), (SELECT MAX(director_id) FROM director))`);
    console.log('✅ Sequence updated');
    
    // 5. Import movies from transformed_movies_utf8.csv
    console.log('\n📥 Importing movies from transformed_movies_utf8.csv...');
    const moviesPath = path.join(__dirname, '..', 'data', 'transformed_movies_utf8.csv');
    const moviesContent = fs.readFileSync(moviesPath, 'utf-8');
    const movies = csv.parse(moviesContent, { columns: true, skip_empty_lines: true });
    
    let movieCount = 0;
    let skipped = 0;
    
    for (const movie of movies) {
      try {
        const directorId = movie.director_id ? parseInt(movie.director_id) : null;
        const releaseYear = movie.release_year ? parseInt(movie.release_year) : null;
        const runtimeMinutes = movie.runtime_minutes ? parseInt(movie.runtime_minutes) : null;
        const boxOffice = movie.box_office ? parseFloat(movie.box_office) : null;
        const budget = movie.budget ? parseFloat(movie.budget) : null;
        const countryId = movie.country_id ? parseInt(movie.country_id) : 1;
        
        await client.query(
          `INSERT INTO movie (
            title, release_year, runtime_minutes, rating, box_office, 
            director_id, country_id, overview, genres, director_name,
            budget, studios, poster_url, backdrop_url, collection,
            original_title, actors
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
          [
            movie.title || 'Unknown',
            releaseYear,
            runtimeMinutes,
            movie.rating || 'NR',
            boxOffice,
            directorId,
            countryId,
            movie.overview || '',
            movie.genres || '',
            movie.director_name || '',
            budget,
            movie.studios || '',
            movie.poster_url || '',
            movie.backdrop_url || '',
            movie.collection || '',
            movie.original_title || '',
            movie.actors || ''
          ]
        );
        
        movieCount++;
        if (movieCount % 500 === 0) {
          console.log(`   Imported ${movieCount} movies...`);
        }
      } catch (err) {
        console.error(`   ⚠️  Skipped movie: ${movie.title} - ${err.message}`);
        skipped++;
      }
    }
    
    console.log(`✅ Imported ${movieCount} movies`);
    if (skipped > 0) {
      console.log(`⚠️  Skipped ${skipped} movies due to errors`);
    }
    
    // Commit transaction
    await client.query('COMMIT');
    console.log('\n✅ Transaction committed successfully!');
    
    // Show summary
    console.log('\n📊 Summary:');
    const directorSummary = await client.query('SELECT COUNT(*) FROM director');
    const movieSummary = await client.query('SELECT COUNT(*) FROM movie');
    const topDirectors = await client.query(`
      SELECT d.name, COUNT(m.movie_id) as movie_count 
      FROM director d 
      LEFT JOIN movie m ON d.director_id = m.director_id 
      GROUP BY d.director_id, d.name 
      ORDER BY movie_count DESC 
      LIMIT 10
    `);
    
    console.log(`   Total directors: ${directorSummary.rows[0].count}`);
    console.log(`   Total movies: ${movieSummary.rows[0].count}`);
    console.log('\n   Top 10 directors by movie count:');
    topDirectors.rows.forEach((row, i) => {
      console.log(`   ${i + 1}. ${row.name}: ${row.movie_count} movies`);
    });
    
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('\n❌ Error during import:', err);
    console.error('Transaction rolled back - database unchanged');
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

console.log('🚀 Starting Heroku database re-import...');
console.log('⚠️  This will DELETE all existing movie and director data!');
console.log('');

reimportData()
  .then(() => {
    console.log('\n✅ Re-import completed successfully!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ Re-import failed:', err);
    process.exit(1);
  });
