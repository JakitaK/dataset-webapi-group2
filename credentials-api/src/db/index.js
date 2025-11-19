// credentials-api/src/db/index.js
// PostgreSQL database connection pool

const { Pool } = require('pg');

let pool;

// Check if running on Heroku/Render (DATABASE_URL is set)
if (process.env.DATABASE_URL) {
    // Production - use DATABASE_URL with SSL
    pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });
    console.log('📡 Using production PostgreSQL (DATABASE_URL)');
} else {
    // Local development - use individual env vars without SSL
    pool = new Pool({
        host: process.env.PGHOST,
        user: process.env.PGUSER,
        password: process.env.PGPASSWORD,
        database: process.env.PGDATABASE,
        port: parseInt(process.env.PGPORT, 10)
    });
    console.log('🏠 Using local PostgreSQL');
}

// Test connection on startup
pool.on('connect', () => {
    console.log('✅ Connected to credentials database');
});

pool.on('error', (err) => {
    console.error('❌ Unexpected database error:', err);
    process.exit(-1);
});

module.exports = pool;
