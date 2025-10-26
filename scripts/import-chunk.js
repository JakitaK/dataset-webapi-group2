const fs = require('fs');
const { parse } = require('csv-parse');
const { Pool } = require('pg');

// Use Heroku DATABASE_URL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const BATCH_SIZE = 2500; // Import 2500 movies at a time

async function importBatch(movies, startIndex, batchSize) {
  const client = await pool.connect();
  
  try {
    console.log(`Processing batch ${startIndex + 1} - ${Math.min(startIndex + batchSize, movies.length)}`);
    
    const batch = movies.slice(startIndex, startIndex + batchSize);
    
    // Get existing directors/genres/actors to avoid duplicates
    const directorsResult = await client.query('SELECT name FROM director');
    const genresResult = await client.query('SELECT name FROM genre');
    const actorsResult = await client.query('SELECT name FROM actor');
    
    const existingDirectors = new Set(directorsResult.rows.map(r => r.name));
    const existingGenres = new Set(genresResult.rows.map(r => r.name));
    const existingActors = new Set(actorsResult.rows.map(r => r.name));
    
    // Collect new unique values from this batch
    const newDirectors = new Set();
    const newGenres = new Set();
    const newActors = new Set();
    
    batch.forEach(movie => {
      if (movie.director_name && !existingDirectors.has(movie.director_name)) {
        newDirectors.add(movie.director_name);
      }
      
      if (movie.genres) {
        movie.genres.split(';').forEach(genre => {
          const cleanGenre = genre.trim();
          if (cleanGenre && !existingGenres.has(cleanGenre)) {
            newGenres.add(cleanGenre);
          }
        });
      }
      
      movie.actors.forEach(actor => {
        if (actor.name && !existingActors.has(actor.name)) {
          newActors.add(actor.name);
        }
      });
    });
    
    // Insert new reference data
    for (const director of newDirectors) {
      try {
        await client.query('INSERT INTO director (name) VALUES ($1)', [director]);
      } catch (error) {
        if (error.code !== '23505') throw error; // Ignore duplicate key errors
      }
    }
    
    for (const genre of newGenres) {
      try {
        await client.query('INSERT INTO genre (name) VALUES ($1)', [genre]);
      } catch (error) {
        if (error.code !== '23505') throw error; // Ignore duplicate key errors
      }
    }
    
    for (const actor of newActors) {
      try {
        await client.query('INSERT INTO actor (name) VALUES ($1)', [actor]);
      } catch (error) {
        if (error.code !== '23505') throw error; // Ignore duplicate key errors
      }
    }
    
    // Get updated mappings
    const directorMap = new Map();
    const genreMap = new Map();
    const actorMap = new Map();
    
    const updatedDirectorsResult = await client.query('SELECT director_id, name FROM director');
    updatedDirectorsResult.rows.forEach(row => directorMap.set(row.name, row.director_id));
    
    const updatedGenresResult = await client.query('SELECT genre_id, name FROM genre');
    updatedGenresResult.rows.forEach(row => genreMap.set(row.name, row.genre_id));
    
    const updatedActorsResult = await client.query('SELECT actor_id, name FROM actor');
    updatedActorsResult.rows.forEach(row => actorMap.set(row.name, row.actor_id));
    
    const countryResult = await client.query('SELECT country_id FROM country WHERE name = $1', ['United States']);
    const countryId = countryResult.rows[0].country_id;
    
    // Insert movies
    for (const movie of batch) {
      const directorId = directorMap.get(movie.director_name) || null;
      
      try {
        const movieResult = await client.query(`
          INSERT INTO movie (
            title, release_year, runtime_minutes, director_id, country_id,
            overview, genres, director_name, budget, box_office, studios,
            poster_url, backdrop_url, collection, original_title, actors, mpa_rating
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
          RETURNING movie_id
        `, [
          movie.title,
          movie.release_year,
          movie.runtime_minutes,
          directorId,
          countryId,
          movie.overview,
          movie.genres,
          movie.director_name,
          movie.budget,
          movie.revenue,
          movie.studios,
          movie.poster_url,
          movie.backdrop_url,
          movie.collection,
          movie.original_title,
          JSON.stringify(movie.actors),
          movie.mpa_rating
        ]);
        
        const movieId = movieResult.rows[0].movie_id;
        
        // Insert movie-genre relationships
        if (movie.genres) {
          const movieGenres = movie.genres.split(';').map(g => g.trim()).filter(g => g);
          for (const genreName of movieGenres) {
            const genreId = genreMap.get(genreName);
            if (genreId) {
              try {
                await client.query('INSERT INTO movie_genre (movie_id, genre_id) VALUES ($1, $2)', [movieId, genreId]);
              } catch (error) {
                if (error.code !== '23505') throw error; // Ignore duplicate key errors
              }
            }
          }
        }
        
        // Insert movie-actor relationships
        for (const actor of movie.actors) {
          const actorId = actorMap.get(actor.name);
          if (actorId) {
            try {
              await client.query('INSERT INTO movie_actor (movie_id, actor_id, character_name) VALUES ($1, $2, $3)', 
                [movieId, actorId, actor.character]);
            } catch (error) {
              if (error.code !== '23505') throw error; // Ignore duplicate key errors
            }
          }
        }
      } catch (error) {
        console.error(`Error inserting movie "${movie.title}":`, error.message);
      }
    }
    
    console.log(`✅ Completed batch ${startIndex + 1} - ${Math.min(startIndex + batchSize, movies.length)}`);
    
  } finally {
    client.release();
  }
}

async function parseCSVData() {
  return new Promise((resolve, reject) => {
    const movies = [];
    
    fs.createReadStream('data/movies_last30years.csv')
      .pipe(parse({ columns: true, skip_empty_lines: true }))
      .on('data', (row) => {
        const movie = {
          title: row.Title || 'Unknown Title',
          original_title: row['Original Title'] || row.Title,
          release_year: row['Release Date'] ? new Date(row['Release Date']).getFullYear() : null,
          runtime_minutes: row['Runtime (min)'] ? parseInt(row['Runtime (min)']) : null,
          overview: row.Overview || null,
          budget: row.Budget ? parseInt(row.Budget) || null : null,
          revenue: row.Revenue ? parseInt(row.Revenue) || null : null,
          studios: row.Studios || null,
          director_name: row.Directors || 'Unknown Director',
          mpa_rating: row['MPA Rating'] || null,
          collection: row.Collection || null,
          poster_url: row['Poster URL'] || null,
          backdrop_url: row['Backdrop URL'] || null,
          genres: row.Genres || null,
          actors: []
        };
        
        // Extract actors
        for (let i = 1; i <= 10; i++) {
          const actorName = row[`Actor ${i} Name`];
          const actorCharacter = row[`Actor ${i} Character`];
          if (actorName && actorName.trim()) {
            movie.actors.push({
              name: actorName.trim(),
              character: actorCharacter || null
            });
          }
        }
        
        movies.push(movie);
      })
      .on('end', () => resolve(movies))
      .on('error', reject);
  });
}

async function importChunk(chunkStart = 0) {
  try {
    console.log('🚀 Starting CSV chunk import...');
    
    const movies = await parseCSVData();
    console.log(`📊 Parsed ${movies.length} movies total`);
    
    const endIndex = Math.min(chunkStart + BATCH_SIZE, movies.length);
    
    if (chunkStart >= movies.length) {
      console.log('✅ All movies have been processed!');
      return;
    }
    
    await importBatch(movies, chunkStart, BATCH_SIZE);
    
    console.log(`✅ Imported movies ${chunkStart + 1} - ${endIndex}`);
    console.log(`📈 Progress: ${endIndex}/${movies.length} (${Math.round(endIndex/movies.length*100)}%)`);
    
    if (endIndex < movies.length) {
      console.log(`⏭️  Run again with: npm run import-chunk-${endIndex}`);
    } else {
      console.log('🎉 Full import complete!');
    }
    
  } catch (error) {
    console.error('💥 Error importing chunk:', error);
    throw error;
  } finally {
    pool.end();
  }
}

// Get chunk start from command line args
const chunkStart = parseInt(process.argv[2]) || 0;

if (require.main === module) {
  importChunk(chunkStart).catch(console.error);
}

module.exports = { importChunk };