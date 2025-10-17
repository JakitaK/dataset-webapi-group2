const fs = require('fs');
const csv = require('csv-parse/sync');
const { stringify } = require('csv-stringify/sync');

// Read the source CSV
const input = fs.readFileSync('../data/movies_last30years.csv', 'utf-8');
const records = csv.parse(input, { columns: true });

// Transform the data
const transformed = records.map(record => ({
    title: record.Title,
    release_year: new Date(record['Release Date']).getFullYear(),
    runtime_minutes: parseInt(record['Runtime (min)'], 10),
    rating: 7.5, // placeholder since we don't have ratings
    box_office: record.Revenue || 0,
    director_id: 1, // placeholder - you'll need to map directors
    country_id: 1  // placeholder - you'll need to map countries
}));

// Write the transformed CSV
const output = stringify(transformed, { 
    header: true,
    columns: ['title', 'release_year', 'runtime_minutes', 'rating', 'box_office', 'director_id', 'country_id']
});

fs.writeFileSync('../data/transformed_movies.csv', output);