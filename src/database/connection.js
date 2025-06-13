const { Pool } = require('pg');

// Use environment variables from Render or fall back to local config
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:your_password@localhost:5432/sentinent_bot',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Test the connection
pool.connect((err, client, release) => {
    if (err) {
        console.error('Error connecting to the database:', err.stack);
    } else {
        console.log('Successfully connected to database');
        release();
    }
});

module.exports = { pool };
