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
    const budget = parseFloat(record.Budget) || null;
    const mpaRating = record['MPA Rating'] || 'NR';
    
    // Collect actor names (Actor 1-10 Name columns)
    const actors = [];
    for (let i = 1; i <= 10; i++) {
        const actorName = record[`Actor ${i} Name`];
        if (actorName && actorName.trim()) {
            actors.push(actorName.trim());
        }
    }
    
    return {
        title: record.Title || '',
        release_year: new Date(record['Release Date']).getFullYear(),
        runtime_minutes: runtime > 0 ? runtime : null,
        rating: mpaRating,
        box_office: revenue,
        director_id: 1, // keep for compatibility
        country_id: 1,  // keep for compatibility
        overview: record.Overview || '',
        genres: record.Genres || '',
        director_name: record.Directors || '',
        budget: budget,
        studios: record.Studios || '',
        poster_url: record['Poster URL'] || '',
        backdrop_url: record['Backdrop URL'] || '',
        collection: record.Collection || '',
        original_title: record['Original Title'] || '',
        actors: actors.join(', ') // Convert array to comma-separated string
    };
});

// Write the transformed CSV
const output = stringify(transformed, { 
    header: true,
    columns: [
        'title', 'release_year', 'runtime_minutes', 'rating', 'box_office', 
        'director_id', 'country_id', 'overview', 'genres', 'director_name', 
        'budget', 'studios', 'poster_url', 'backdrop_url', 'collection', 
        'original_title', 'actors'
    ]
});

fs.writeFileSync('../data/transformed_movies.csv', output);