const fs = require('fs');
const csv = require('csv-parse/sync');
const { stringify } = require('csv-stringify/sync');

// Read the source CSV
const input = fs.readFileSync('../data/movies_last30years.csv', 'utf-8');
const records = csv.parse(input, { columns: true });

// Transform the data
const transformed = records.map((record, index) => {
    const runtime = parseInt(record['Runtime (min)'], 10);
    const revenue = parseFloat(record.Revenue) || 0;
    const mpaRating = record['MPA Rating'] || 'NR'; // Default to Not Rated if empty
    
    return {
        title: record.Title,
        release_year: new Date(record['Release Date']).getFullYear(),
        runtime_minutes: runtime > 0 ? runtime : null,
        rating: mpaRating, // Use MPA rating directly (G, PG, PG-13, R, etc.)
        box_office: revenue,
        director_id: 1, // placeholder - you'll need to map directors
        country_id: 1  // placeholder - you'll need to map countries
    };
});

// Write the transformed CSV
const output = stringify(transformed, { 
    header: true,
    columns: ['title', 'release_year', 'runtime_minutes', 'rating', 'box_office', 'director_id', 'country_id']
});

fs.writeFileSync('../data/transformed_movies.csv', output);