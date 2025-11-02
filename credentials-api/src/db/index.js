// credentials-api/src/db/index.js
// PostgreSQL database connection pool

const { Pool } = require('pg');

// Create connection pool
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// Test connection on startup
pool.on('connect', () => {
    console.log('✅ Connected to credentials database');
});

pool.on('error', (err) => {
    console.error('❌ Unexpected database error:', err);
    process.exit(-1);
});

module.exports = pool;
