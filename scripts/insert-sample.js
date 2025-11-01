const { Pool } = require('pg');

// Use Heroku DATABASE_URL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function insertSampleData() {
  const client = await pool.connect();
  
  try {
    console.log('Inserting sample movie data with rich information...');
    
    // Insert a few sample movies with rich data from your CSV
    const sampleMovies = [
      {
        title: 'Weapons',
        original_title: 'Weapons',
        release_year: 2025,
        runtime_minutes: 129,
        overview: 'When all but one child from the same class mysteriously vanish on the same night at exactly the same time, a community is left questioning who or what is behind their disappearance.',
        budget: 38000000,
        revenue: 210852983,
        studios: 'New Line Cinema; Subconscious; Vertigo Entertainment; BoulderLight Pictures; Domain Entertainment',
        director_name: 'Zach Cregger',
        mpa_rating: 'R',
        genres: 'Horror; Mystery',
        actors: 'Julia Garner as Justine, Josh Brolin as Archer, Alden Ehrenreich as Paul',
        poster_url: '/cpf7vsRZ0MYRQcnLWteD5jK9ymT.jpg',
        backdrop_url: '/kyqM6padQzZ1eYxv84i9smNvZAG.jpg'
      },
      {
        title: 'My Oxford Year',
        original_title: 'My Oxford Year', 
        release_year: 2025,
        runtime_minutes: 113,
        overview: 'An ambitious American fulfilling her dream of studying at Oxford falls for a charming Brit hiding a secret that may upend her perfectly planned life.',
        budget: 0,
        revenue: 0,
        studios: 'Temple Hill Entertainment',
        director_name: 'Iain Morris',
        mpa_rating: 'PG-13',
        genres: 'Romance; Comedy; Drama',
        actors: 'Sofia Carson as Anna De La Vega, Corey Mylchreest as Jamie Davenport, Esmé Kingdom as Maggie Timbs',
        poster_url: '/jrhXbIOFingzdLjkccjg9vZnqIp.jpg',
        backdrop_url: '/A466i5iATrpbVjX30clP1Zyfp31.jpg'
      },
      {
        title: 'The Naked Gun',
        original_title: 'The Naked Gun',
        release_year: 2025, 
        runtime_minutes: 85,
        overview: 'Only one man has the particular set of skills... to lead Police Squad and save the world: Lt. Frank Drebin Jr.',
        budget: 42000000,
        revenue: 86540700,
        studios: 'Fuzzy Door Productions; Paramount Pictures; Domain Entertainment',
        director_name: 'Akiva Schaffer',
        mpa_rating: 'PG-13',
        genres: 'Comedy; Crime; Action',
        actors: 'Liam Neeson as Frank Drebin Jr., Pamela Anderson as Beth Davenport, Paul Walter Hauser as Ed Hocken Jr.',
        poster_url: '/rmwQ8GsdQ1M3LtemNWLErle2nBU.jpg',
        backdrop_url: '/1wi1hcbl6KYqARjdQ4qrBWZdiau.jpg'
      }
    ];
    
    // Clear existing data and reset
    await client.query('DELETE FROM movie_actor');
    await client.query('DELETE FROM movie_genre');
    await client.query('DELETE FROM movie');
    await client.query('DELETE FROM director');
    await client.query('DELETE FROM genre');
    await client.query('DELETE FROM country');
    await client.query('DELETE FROM actor');
    
    // Reset sequences
    await client.query('ALTER SEQUENCE movie_movie_id_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE director_director_id_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE genre_genre_id_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE country_country_id_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE actor_actor_id_seq RESTART WITH 1');
    
    // Insert country
    await client.query('INSERT INTO country (name) VALUES ($1)', ['United States']);
    const countryResult = await client.query('SELECT country_id FROM country WHERE name = $1', ['United States']);
    const countryId = countryResult.rows[0].country_id;
    
    // Insert directors
    const directors = [...new Set(sampleMovies.map(m => m.director_name))];
    for (const director of directors) {
      await client.query('INSERT INTO director (name) VALUES ($1)', [director]);
    }
    
    // Insert genres
    const allGenres = new Set();
    sampleMovies.forEach(movie => {
      if (movie.genres) {
        movie.genres.split(';').forEach(g => allGenres.add(g.trim()));
      }
    });
    
    for (const genre of allGenres) {
      await client.query('INSERT INTO genre (name) VALUES ($1)', [genre]);
    }
    
    // Get mappings
    const directorMap = new Map();
    const genreMap = new Map();
    
    const directorResult = await client.query('SELECT director_id, name FROM director');
    directorResult.rows.forEach(row => directorMap.set(row.name, row.director_id));
    
    const genreResult = await client.query('SELECT genre_id, name FROM genre');
    genreResult.rows.forEach(row => genreMap.set(row.name, row.genre_id));
    
    // Insert movies
    for (const movie of sampleMovies) {
      const directorId = directorMap.get(movie.director_name);
      
      const movieResult = await client.query(`
        INSERT INTO movie (
          title, release_year, runtime_minutes, director_id, country_id,
          overview, genres, director_name, budget, box_office, studios,
          poster_url, backdrop_url, original_title, actors
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
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
        movie.original_title,
        movie.actors
      ]);
      
      const movieId = movieResult.rows[0].movie_id;
      
      // Insert movie-genre relationships
      if (movie.genres) {
        const movieGenres = movie.genres.split(';').map(g => g.trim());
        for (const genreName of movieGenres) {
          const genreId = genreMap.get(genreName);
          if (genreId) {
            await client.query('INSERT INTO movie_genre (movie_id, genre_id) VALUES ($1, $2)', [movieId, genreId]);
          }
        }
      }
      
      console.log(`✅ Inserted: ${movie.title}`);
    }
    
    console.log(`✅ Successfully inserted ${sampleMovies.length} sample movies with rich data!`);
    console.log('🎬 Movies now have: overviews, budgets, genres, directors, actors, posters, etc.');
    
  } catch (error) {
    console.error('Error inserting sample data:', error);
    throw error;
  } finally {
    client.release();
    pool.end();
  }
}

if (require.main === module) {
  insertSampleData().catch(console.error);
}

module.exports = { insertSampleData };