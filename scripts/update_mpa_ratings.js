// scripts/update_mpa_ratings.js
// Updates mpa_rating column in Heroku database from CSV data

require('dotenv').config();
const fs = require('fs');
const { parse } = require('csv-parse/sync');
const { Pool } = require('pg');

// Use Heroku DATABASE_URL from command line argument or environment
const DATABASE_URL = process.argv[2] || process.env.HEROKU_DATABASE_URL || process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in environment');
  console.error('Usage: node scripts/update_mpa_ratings.js [DATABASE_URL]');
  process.exit(1);
}

console.log('🔗 Connecting to database:', DATABASE_URL.split('@')[1]?.split('/')[0] || 'unknown');

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
});

async function updateMPARatings() {
  try {
    console.log('📖 Reading CSV file...');
    const csvContent = fs.readFileSync('data/transformed_movies.csv', 'utf-8');
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    console.log(`Found ${records.length} movies in CSV`);

    let updated = 0;
    let notFound = 0;
    let errors = 0;

    for (const record of records) {
      const { title, release_year, rating } = record;
      
      // Skip if no MPA rating
      if (!rating || rating.trim() === '') {
        continue;
      }

      try {
        // Update by title and year to be more precise
        const result = await pool.query(
          `UPDATE movie 
           SET mpa_rating = $1 
           WHERE title = $2 AND release_year = $3::integer`,
          [rating, title, release_year]
        );

        if (result.rowCount > 0) {
          updated++;
          if (updated % 100 === 0) {
            console.log(`✅ Updated ${updated} movies...`);
          }
        } else {
          notFound++;
        }
      } catch (error) {
        errors++;
        console.error(`Error updating "${title}" (${release_year}):`, error.message);
      }
    }

    console.log('\n✅ Update complete!');
    console.log(`   Updated: ${updated}`);
    console.log(`   Not found: ${notFound}`);
    console.log(`   Errors: ${errors}`);

    // Verify the update
    const verifyResult = await pool.query(
      'SELECT COUNT(*) as total, COUNT(mpa_rating) as with_mpa FROM movie'
    );
    console.log(`\n📊 Database status:`);
    console.log(`   Total movies: ${verifyResult.rows[0].total}`);
    console.log(`   With MPA rating: ${verifyResult.rows[0].with_mpa}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

updateMPARatings();
