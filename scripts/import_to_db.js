#!/usr/bin/env node
/**
 * Safe importer for directors and movies CSV files.
 *
 * Usage (PowerShell):
 *   $env:DATABASE_URL = (heroku config:get DATABASE_URL -a movie-api-group2)
 *   node scripts/import_to_db.js --force
 *
 * The script will:
 *  - connect to the DB using process.env.DATABASE_URL
 *  - optionally delete existing movie and director rows (destructive)
 *  - import directors from data/directors_mapping.csv (id + name)
 *  - import movies from data/transformed_movies.csv (per-row, errors logged but import continues)
 */

const fs = require('fs');
const path = require('path');
const csv = require('csv-parse/sync');
const { Pool } = require('pg');

const DATA_DIR = path.resolve(__dirname, '..', 'data');
const DIRECTORS_CSV = path.join(DATA_DIR, 'directors_mapping.csv');
const MOVIES_CSV = path.join(DATA_DIR, 'transformed_movies.csv');

const argv = require('minimist')(process.argv.slice(2));
const FORCE = argv.force || argv.f;

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL not set. Set it in env or run: $env:DATABASE_URL = (heroku config:get DATABASE_URL -a <app>)');
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function importDirectors() {
  if (!fs.existsSync(DIRECTORS_CSV)) {
    console.warn(`Directors CSV not found at ${DIRECTORS_CSV}, skipping directors import.`);
    return 0;
  }

  const content = fs.readFileSync(DIRECTORS_CSV, 'utf8');
  const rows = csv.parse(content, { columns: true, skip_empty_lines: true });
  console.log(`Found ${rows.length} directors in ${DIRECTORS_CSV}`);

  let inserted = 0;
  for (const r of rows) {
    const id = r.director_id ? parseInt(r.director_id, 10) : null;
    const name = (r.name || '').trim();
    if (!id || !name) continue;
    try {
      // Use upsert to avoid duplicates
      await pool.query(
        `INSERT INTO director(director_id, name) VALUES ($1, $2)
         ON CONFLICT (director_id) DO UPDATE SET name = EXCLUDED.name`,
        [id, name]
      );
      inserted++;
    } catch (err) {
      console.error(`Failed to insert director ${id} - ${name}:`, err.message);
    }
  }

  // fix sequence for director_id
  try {
    await pool.query("SELECT setval(pg_get_serial_sequence('director','director_id'), (SELECT COALESCE(MAX(director_id),0) FROM director));");
  } catch (err) {
    console.warn('Could not set director sequence:', err.message);
  }

  return inserted;
}

async function importMovies() {
  if (!fs.existsSync(MOVIES_CSV)) {
    console.warn(`Movies CSV not found at ${MOVIES_CSV}, skipping movies import.`);
    return 0;
  }

  const content = fs.readFileSync(MOVIES_CSV, 'utf8');
  const rows = csv.parse(content, { columns: true, skip_empty_lines: true });
  console.log(`Found ${rows.length} movies in ${MOVIES_CSV}`);

  let inserted = 0;
  for (const r of rows) {
    // Map fields with safe parsing
    const title = (r.title || '').trim();
    const release_year = r.release_year ? parseInt(r.release_year, 10) : null;
    const runtime_minutes = r.runtime_minutes ? parseInt(r.runtime_minutes, 10) : null;
    const rating = r.rating || null;
    const box_office = r.box_office ? parseFloat(r.box_office) : null;
    const director_id = r.director_id ? (r.director_id === '' ? null : parseInt(r.director_id, 10)) : null;
    const country_id = r.country_id ? parseInt(r.country_id, 10) : null;
    const overview = r.overview || null;
    const genres = r.genres || null;
    const director_name = r.director_name || null;
    const budget = r.budget ? parseFloat(r.budget) : null;
    const studios = r.studios || null;
    const poster_url = r.poster_url || null;
    const backdrop_url = r.backdrop_url || null;
    const collection = r.collection || null;
    const original_title = r.original_title || null;
    const actors = r.actors || null;

    try {
      await pool.query(
        `INSERT INTO movie (title, release_year, runtime_minutes, rating, box_office, director_id, country_id, overview, genres, director_name, budget, studios, poster_url, backdrop_url, collection, original_title, actors)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
        [title, release_year, runtime_minutes, rating, box_office, director_id, country_id, overview, genres, director_name, budget, studios, poster_url, backdrop_url, collection, original_title, actors]
      );
      inserted++;
      if (inserted % 500 === 0) console.log(`Inserted ${inserted} movies...`);
    } catch (err) {
      // Log and continue - do not abort entire import
      console.error(`⚠️ Skipped movie: ${title} - ${err.message}`);
      // If the error was a transaction-aborted error, issue a rollback to clear state
      if (err.code === '25P02') {
        console.warn('Transaction aborted on server; issuing ROLLBACK to clear state and continue');
        try {
          await pool.query('ROLLBACK');
        } catch (rbErr) {
          console.error('Rollback failed:', rbErr.message);
        }
      }
    }
  }

  // fix movie sequence
  try {
    await pool.query("SELECT setval(pg_get_serial_sequence('movie','movie_id'), (SELECT COALESCE(MAX(movie_id),0) FROM movie));");
  } catch (err) {
    console.warn('Could not set movie sequence:', err.message);
  }

  return inserted;
}

async function main() {
  console.log('Connecting to DB...');
  try {
    await pool.query('SELECT 1');
  } catch (err) {
    console.error('DB connection failed:', err.message);
    process.exit(1);
  }

  if (!FORCE) {
    console.log('This script is destructive (it will DELETE existing movies and directors).');
    console.log('Re-run with --force to proceed.');
    await pool.end();
    process.exit(0);
  }

  try {
    console.log('Clearing existing movie data...');
    await pool.query('DELETE FROM movie');
    console.log('Clearing existing director data...');
    await pool.query('DELETE FROM director');
  } catch (err) {
    console.error('Failed to clear existing data:', err.message);
    await pool.end();
    process.exit(1);
  }

  const dCount = await importDirectors();
  console.log(`Imported ${dCount} directors`);

  const mCount = await importMovies();
  console.log(`Imported ${mCount} movies`);

  await pool.end();
  console.log('Import finished');
}

main().catch(err => {
  console.error('Fatal error during import:', err);
  process.exit(1);
});
