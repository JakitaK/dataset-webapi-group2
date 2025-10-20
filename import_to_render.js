const fs = require('fs');
const csv = require('csv-parse/sync');
const { Pool } = require('pg');

// Render database connection (you'll need to update these with your actual Render credentials)
const pool = new Pool({
  host: process.env.PGHOST, // Your Render database host
  user: process.env.PGUSER, // Your Render database user
  password: process.env.PGPASSWORD, // Your Render database password
  database: process.env.PGDATABASE, // Your Render database name
  port: parseInt(process.env.PGPORT, 10), // Your Render database port
  ssl: { rejectUnauthorized: false } // Required for Render
});

async function importToRender() {
  try {
    console.log('Connecting to Render database...');
    
    // Test connection
    await pool.query('SELECT NOW()');
    console.log('✅ Connected to Render database');

    // Read the CSV file
    console.log('Reading CSV file...');
    const csvContent = fs.readFileSync('./data/movies_last30years.csv', 'utf-8');
    const records = csv.parse(csvContent, { 
      columns: true,
      skip_empty_lines: true
    });

    console.log(`Found ${records.length} movies in CSV`);

    // Create tables first
    console.log('Creating tables...');
    const initSql = fs.readFileSync('./project_files/init.sql', 'utf-8');
    await pool.query(initSql);
    console.log('✅ Tables created');

    // Clear existing data
    console.log('Clearing existing movie data...');
    await pool.query('DELETE FROM movie');

    // Import movies
    console.log('Importing movies...');
    let imported = 0;
    let skipped = 0;

    for (const record of records) {
      try {
        // Extract and transform data
        const title = record.Title || record['Original Title'] || 'Unknown';
        const releaseDate = record['Release Date'];
        const runtime = parseInt(record['Runtime (min)']) || 0;
        const revenue = parseFloat(record.Revenue) || 0;
        
        // Parse release year from date
        let releaseYear = null;
        if (releaseDate) {
          const date = new Date(releaseDate);
          if (!isNaN(date.getTime())) {
            releaseYear = date.getFullYear();
          }
        }

        // Skip if no valid year or title
        if (!releaseYear || !title || title === 'Unknown') {
          skipped++;
          continue;
        }

        // For now, use placeholder values for director_id and country_id
        const directorId = 1; // Default director
        const countryId = 1;  // Default country
        const rating = 7.5;   // Default rating

        // Insert movie
        await pool.query(
          `INSERT INTO movie (title, release_year, runtime_minutes, rating, box_office, director_id, country_id) 
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [title, releaseYear, runtime, rating, revenue, directorId, countryId]
        );

        imported++;
        
        if (imported % 100 === 0) {
          console.log(`Imported ${imported} movies...`);
        }
      } catch (err) {
        console.error(`Error importing movie: ${record.Title}`, err.message);
        skipped++;
      }
    }

    console.log(`\nImport complete!`);
    console.log(`✅ Imported: ${imported} movies`);
    console.log(`⚠️  Skipped: ${skipped} movies`);
    
    // Show some sample data
    const result = await pool.query('SELECT COUNT(*) FROM movie');
    console.log(`📊 Total movies in Render database: ${result.rows[0].count}`);

  } catch (err) {
    console.error('Import failed:', err);
  } finally {
    await pool.end();
  }
}

importToRender();



