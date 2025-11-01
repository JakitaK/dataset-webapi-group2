const fs = require('fs');
const path = require('path');
const csv = require('csv-parse/sync');
const { stringify } = require('csv-stringify/sync');

// Resolve paths relative to this script to make the script cwd-agnostic
const DATA_DIR = path.resolve(__dirname, '..', 'data');
const INPUT_CSV = path.join(DATA_DIR, 'movies_last30years.csv');
const OUTPUT_CSV = path.join(DATA_DIR, 'transformed_movies.csv');
const OUTPUT_UTF8 = path.join(DATA_DIR, 'transformed_movies_utf8.csv');
const DIRECTORS_MAP_CSV = path.join(DATA_DIR, 'directors_mapping.csv');

// Read the source CSV
const input = fs.readFileSync(INPUT_CSV, 'utf-8');
const records = csv.parse(input, { columns: true, skip_empty_lines: true });

// Build director name -> id map so each unique director gets a persistent id
const directorMap = new Map();
let nextDirectorId = 1;

// Transform the data
const transformed = records.map((record) => {
    const runtime = parseInt(record['Runtime (min)'], 10);
    const revenue = parseFloat(record.Revenue) || 0;
    const budget = parseFloat(record.Budget) || null;
    const mpaRating = (record['MPA Rating'] || record.MPA || 'NR').trim();

    // Collect actor names (Actor 1-10 Name columns)
    const actors = [];
    for (let i = 1; i <= 10; i++) {
        const actorName = record[`Actor ${i} Name`];
        if (actorName && actorName.trim()) {
            actors.push(actorName.trim());
        }
    }

    const directorName = (record.Directors || record['Director'] || '').trim();

    // Assign a unique director_id based on director name
    let directorId = null;
    if (directorName) {
        if (directorMap.has(directorName)) {
            directorId = directorMap.get(directorName);
        } else {
            directorId = nextDirectorId++;
            directorMap.set(directorName, directorId);
        }
    }

    return {
        title: record.Title || '',
        release_year: record['Release Date'] ? new Date(record['Release Date']).getFullYear() : (record['Year'] ? parseInt(record['Year'], 10) : null),
        runtime_minutes: runtime > 0 ? runtime : null,
        rating: mpaRating,
        box_office: revenue,
        director_id: directorId || '',
        country_id: 1,  // keep default for country for now; can be improved similarly
        overview: record.Overview || '',
        genres: record.Genres || '',
        director_name: directorName,
        budget: budget,
        studios: record.Studios || '',
        poster_url: record['Poster URL'] || '',
        backdrop_url: record['Backdrop URL'] || '',
        collection: record.Collection || '',
        original_title: record['Original Title'] || '',
        actors: actors.join(', ') // Convert array to comma-separated string
    };
});

// Emit transformed CSV (UTF-8 and plain)
const columns = [
    'title', 'release_year', 'runtime_minutes', 'rating', 'box_office',
    'director_id', 'country_id', 'overview', 'genres', 'director_name',
    'budget', 'studios', 'poster_url', 'backdrop_url', 'collection',
    'original_title', 'actors'
];

const output = stringify(transformed, { header: true, columns });
fs.writeFileSync(OUTPUT_CSV, output);
fs.writeFileSync(OUTPUT_UTF8, output, { encoding: 'utf8' });

// Write directors mapping CSV so callers can populate the `director` table correctly
const directorsArray = Array.from(directorMap.entries()).map(([name, id]) => ({ director_id: id, name }));
const directorsCsv = stringify(directorsArray, { header: true, columns: ['director_id', 'name'] });
fs.writeFileSync(DIRECTORS_MAP_CSV, directorsCsv, { encoding: 'utf8' });

console.log(`Wrote ${OUTPUT_CSV} (${transformed.length} rows)`);
console.log(`Wrote ${DIRECTORS_MAP_CSV} (${directorsArray.length} unique directors)`);