const fs = require('fs');
const { Pool } = require('pg');
const csv = require('csv-parse/sync');
require('dotenv').config();

// Connect to Heroku or local Postgres
let pool;
if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  console.log('📡 Connecting to Heroku PostgreSQL...');
} else {
  pool = new Pool({
    host: process.env.PGHOST,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE,
    port: parseInt(process.env.PGPORT, 10)
  });
  console.log('🏠 Connecting to local PostgreSQL...');
}

async function importMovies() {
  try {
    const input = fs.readFileSync('./data/transformed_movies.csv', 'utf-8');
    const records = csv.parse(input, { columns: true });
    console.log(`📊 Found ${records.length} movies to import...`);

    // 🧠 Resume mode: get all titles already in DB
    console.log('🔎 Checking existing movie titles in database...');
    const existingRes = await pool.query('SELECT title FROM movie');
    const existingTitles = new Set(existingRes.rows.map(row => row.title.toLowerCase()));
    console.log(`📁 Found ${existingTitles.size} existing movies, skipping duplicates...`);

    const batchSize = 500;
    let inserted = 0;
    let skipped = 0;

    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      const placeholders = [];
      const values = [];
      let valueIndex = 1;

      for (const record of batch) {
        // Skip if invalid or already exists
        if (!record.title || record.title.trim() === '') {
          skipped++;
          continue;
        }

        const titleLower = record.title.toLowerCase();
        if (existingTitles.has(titleLower)) {
          skipped++;
          continue; // Resume mode: already imported
        }

        const releaseYear = parseInt(record.release_year, 10);
        if (isNaN(releaseYear) || releaseYear < 1990 || releaseYear > 2025) {
          skipped++;
          continue;
        }

        const runtime = parseInt(record.runtime_minutes, 10) || 0;
        const rating = parseFloat(record.rating) || 7.5;
        const boxOffice = parseFloat(record.box_office) || 0;
        const directorId = parseInt(record.director_id, 10) || 1;
        const countryId = parseInt(record.country_id, 10) || 1;

        placeholders.push(
          `($${valueIndex++}, $${valueIndex++}, $${valueIndex++}, $${valueIndex++}, $${valueIndex++}, $${valueIndex++}, $${valueIndex++})`
        );
        values.push(record.title, releaseYear, runtime, rating, boxOffice, directorId, countryId);

        // Track as inserted to avoid re-insertion in later batches
        existingTitles.add(titleLower);
      }

      if (values.length === 0) continue;

      const query = `
        INSERT INTO movie (title, release_year, runtime_minutes, rating, box_office, director_id, country_id)
        VALUES ${placeholders.join(', ')}
        ON CONFLICT DO NOTHING
      `;

      try {
        const result = await pool.query(query, values);
        inserted += result.rowCount;
      } catch (err) {
        console.error(`❌ Batch insert failed at index ${i}:`, err.message);
      }

      console.log(`✅ Progress: Inserted=${inserted}, Skipped=${skipped}`);
    }

    console.log(`\n✅ Import complete!`);
    console.log(`   Total inserted: ${inserted}`);
    console.log(`   Total skipped: ${skipped}`);

    const result = await pool.query('SELECT COUNT(*) FROM movie');
    console.log(`\n📊 Total movies in database: ${result.rows[0].count}`);
  } catch (err) {
    console.error('❌ Import failed:', err.message);
  } finally {
    await pool.end();
  }
}

importMovies();
