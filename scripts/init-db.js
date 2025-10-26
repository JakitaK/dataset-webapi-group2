const { Pool } = require('pg');

// Use Heroku DATABASE_URL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function initializeDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('Creating movies table...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS movies (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        original_title VARCHAR(255),
        release_date DATE,
        runtime INTEGER,
        genres TEXT,
        overview TEXT,
        budget BIGINT,
        revenue BIGINT,
        studios TEXT,
        producers TEXT,
        director_name TEXT,
        mpa_rating VARCHAR(10),
        collection VARCHAR(255),
        poster_url TEXT,
        backdrop_url TEXT,
        studio_logos TEXT,
        studio_countries TEXT,
        actors TEXT
      );
    `);
    
    console.log('Creating indexes...');
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_movies_title ON movies(title);
      CREATE INDEX IF NOT EXISTS idx_movies_director ON movies(director_name);
      CREATE INDEX IF NOT EXISTS idx_movies_release_date ON movies(release_date);
      CREATE INDEX IF NOT EXISTS idx_movies_mpa_rating ON movies(mpa_rating);
    `);
    
    // Check if table has any data
    const result = await client.query('SELECT COUNT(*) FROM movies');
    console.log(`Movies table has ${result.rows[0].count} records`);
    
    console.log('Database initialization complete!');
  } catch (error) {
    console.error('Error initializing database:', error);
  } finally {
    client.release();
    pool.end();
  }
}

if (require.main === module) {
  initializeDatabase();
}

module.exports = { initializeDatabase };