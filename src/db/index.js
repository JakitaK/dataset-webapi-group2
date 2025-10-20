const { Pool } = require('pg');
require('dotenv').config();

// Validate required environment variables
const requiredEnvVars = ['PGHOST', 'PGUSER', 'PGPASSWORD', 'PGDATABASE', 'PGPORT'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingVars.join(', '));
  console.error('📝 Please check your .env file and ensure all PostgreSQL variables are set.');
  console.error('💡 Example .env file:');
  console.error('   PGHOST=localhost');
  console.error('   PGUSER=postgres');
  console.error('   PGPASSWORD=your_password');
  console.error('   PGDATABASE=movies_db');
  console.error('   PGPORT=5432');
  process.exit(1);
}

// Create pool using individual connection parameters
const pool = new Pool({
  host: process.env.PGHOST,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  port: parseInt(process.env.PGPORT, 10)
});

// Test the connection
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL connection error:', err.message);
});

module.exports = pool;
