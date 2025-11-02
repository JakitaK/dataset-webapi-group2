// Initialize the credentials database
require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function initializeDatabase() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        console.log('🔌 Connecting to database...');
        await client.connect();
        console.log('✅ Connected!\n');

        // Read SQL file
        const sqlPath = path.join(__dirname, 'init.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('📝 Running database initialization script...\n');
        
        // Execute SQL
        await client.query(sql);
        
        console.log('✅ Database initialized successfully!');
        console.log('\nTables created:');
        console.log('  - Account');
        console.log('  - Account_Credential');
        console.log('  - Email_Verification');
        console.log('  - Phone_Verification');
        console.log('\nIndexes created for performance');
        console.log('\n🎉 Database is ready to use!');
        
    } catch (error) {
        console.error('❌ Error initializing database:', error.message);
        process.exit(1);
    } finally {
        await client.end();
    }
}

initializeDatabase();
