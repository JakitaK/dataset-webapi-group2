const { Pool } = require('pg');
require('dotenv').config();

// Create pool using individual connection parameters
const pool = new Pool({
  host: process.env.PGHOST,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  port: process.env.PGPORT
});

module.exports = pool;
