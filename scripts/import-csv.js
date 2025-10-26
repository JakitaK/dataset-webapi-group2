const fs = require('fs');
const { parse } = require('csv-parse');
const { Pool } = require('pg');

// Use Heroku DATABASE_URL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function importMovieData() {
  const client = await pool.connect();
  
  try {
    console.log('Starting CSV import...');
    
    // Clear existing data first
    await client.query('DELETE FROM movie_actor');
    await client.query('DELETE FROM movie_genre'); 
    await client.query('DELETE FROM movie');
    await client.query('DELETE FROM director');
    await client.query('DELETE FROM genre');
    await client.query('DELETE FROM country');
    await client.query('DELETE FROM actor');
    
    console.log('Cleared existing data');
    
    // Reset sequences
    await client.query('ALTER SEQUENCE movie_movie_id_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE director_director_id_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE genre_genre_id_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE country_country_id_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE actor_actor_id_seq RESTART WITH 1');
    
    console.log('Reset sequences');
    
    const movies = [];
    const directors = new Set();
    const genres = new Set();
    const actors = new Set();
    const countries = new Set(['United States']); // Default country
    
    // Read CSV file
    return new Promise((resolve, reject) => {
      fs.createReadStream('data/movies_last30years.csv')
        .pipe(parse({ columns: true, skip_empty_lines: true }))
        .on('data', (row) => {
          // Extract and clean data
          const movie = {
            title: row.Title || 'Unknown Title',
            original_title: row['Original Title'] || row.Title,
            release_year: row['Release Date'] ? new Date(row['Release Date']).getFullYear() : null,
            runtime_minutes: row['Runtime (min)'] ? parseInt(row['Runtime (min)']) : null,
            overview: row.Overview || null,
            budget: row.Budget ? parseInt(row.Budget) || null : null,
            revenue: row.Revenue ? parseInt(row.Revenue) || null : null,
            studios: row.Studios || null,
            producers: row.Producers || null,
            director_name: row.Directors || 'Unknown Director',
            mpa_rating: row['MPA Rating'] || null,
            collection: row.Collection || null,
            poster_url: row['Poster URL'] || null,
            backdrop_url: row['Backdrop URL'] || null,
            genres: row.Genres || null,
            actors: []
          };
          
          // Extract actors (Actor 1 Name, Actor 2 Name, etc.)
          for (let i = 1; i <= 10; i++) {
            const actorName = row[`Actor ${i} Name`];
            const actorCharacter = row[`Actor ${i} Character`];
            if (actorName && actorName.trim()) {
              movie.actors.push({
                name: actorName.trim(),
                character: actorCharacter || null
              });
              actors.add(actorName.trim());
            }
          }
          
          // Collect unique values
          if (movie.director_name && movie.director_name !== 'Unknown Director') {
            directors.add(movie.director_name);
          }
          
          if (movie.genres) {
            movie.genres.split(';').forEach(genre => {
              const cleanGenre = genre.trim();
              if (cleanGenre) genres.add(cleanGenre);
            });
          }
          
          movies.push(movie);
        })
        .on('end', async () => {
          try {
            console.log(`Parsed ${movies.length} movies`);
            console.log(`Found ${directors.size} unique directors`);
            console.log(`Found ${genres.size} unique genres`);
            console.log(`Found ${actors.size} unique actors`);
            
            // Insert reference data first
            console.log('Inserting countries...');
            for (const country of countries) {
              await client.query('INSERT INTO country (name) VALUES ($1)', [country]);
            }
            
            console.log('Inserting directors...');
            for (const director of directors) {
              await client.query('INSERT INTO director (name) VALUES ($1)', [director]);
            }
            
            console.log('Inserting genres...');
            for (const genre of genres) {
              await client.query('INSERT INTO genre (name) VALUES ($1)', [genre]);
            }
            
            console.log('Inserting actors...');
            for (const actor of actors) {
              await client.query('INSERT INTO actor (name) VALUES ($1)', [actor]);
            }
            
            // Get director and genre mappings
            const directorMap = new Map();
            const genreMap = new Map();
            const actorMap = new Map();
            
            const directorResult = await client.query('SELECT director_id, name FROM director');
            directorResult.rows.forEach(row => directorMap.set(row.name, row.director_id));
            
            const genreResult = await client.query('SELECT genre_id, name FROM genre');
            genreResult.rows.forEach(row => genreMap.set(row.name, row.genre_id));
            
            const actorResult = await client.query('SELECT actor_id, name FROM actor');
            actorResult.rows.forEach(row => actorMap.set(row.name, row.actor_id));
            
            const countryResult = await client.query('SELECT country_id FROM country WHERE name = $1', ['United States']);
            const countryId = countryResult.rows[0].country_id;
            
            // Insert movies
            console.log('Inserting movies...');
            let inserted = 0;
            
            for (const movie of movies) {
              const directorId = directorMap.get(movie.director_name) || null;
              
              const movieResult = await client.query(`
                INSERT INTO movie (
                  title, release_year, runtime_minutes, rating, box_office, 
                  director_id, country_id, overview, genres, director_name, 
                  budget, studios, poster_url, backdrop_url, collection, 
                  original_title, actors
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
                RETURNING movie_id
              `, [
                movie.title,
                movie.release_year,
                movie.runtime_minutes,
                null, // rating (will be calculated later if needed)
                movie.revenue,
                directorId,
                countryId,
                movie.overview,
                movie.genres,
                movie.director_name,
                movie.budget,
                movie.studios,
                movie.poster_url,
                movie.backdrop_url,
                movie.collection,
                movie.original_title,
                JSON.stringify(movie.actors) // Store actors as JSON for now
              ]);
              
              const movieId = movieResult.rows[0].movie_id;
              
              // Insert movie-genre relationships
              if (movie.genres) {
                const movieGenres = movie.genres.split(';').map(g => g.trim()).filter(g => g);
                for (const genreName of movieGenres) {
                  const genreId = genreMap.get(genreName);
                  if (genreId) {
                    await client.query('INSERT INTO movie_genre (movie_id, genre_id) VALUES ($1, $2)', [movieId, genreId]);
                  }
                }
              }
              
              // Insert movie-actor relationships
              for (const actor of movie.actors) {
                const actorId = actorMap.get(actor.name);
                if (actorId) {
                  await client.query('INSERT INTO movie_actor (movie_id, actor_id, character_name) VALUES ($1, $2, $3)', 
                    [movieId, actorId, actor.character]);
                }
              }
              
              inserted++;
              if (inserted % 100 === 0) {
                console.log(`Inserted ${inserted} movies...`);
              }
            }
            
            console.log(`✅ Successfully imported ${inserted} movies!`);
            console.log(`✅ Database now contains rich movie data with overviews, genres, budgets, actors, etc.`);
            
            resolve();
          } catch (error) {
            reject(error);
          }
        })
        .on('error', reject);
    });
    
  } catch (error) {
    console.error('Error importing movie data:', error);
    throw error;
  } finally {
    client.release();
    pool.end();
  }
}

if (require.main === module) {
  importMovieData().catch(console.error);
}

module.exports = { importMovieData };