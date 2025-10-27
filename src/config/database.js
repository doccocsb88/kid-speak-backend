const { Pool } = require('pg');
require('dotenv').config();

// Database configuration
const config = {
  connectionString: process.env.DATABASE_URL || 'postgres://localhost:5432/kidspeak_dev',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  // Connection pool settings
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
};

const pool = new Pool(config);

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Handle pool connect events (for debugging)
if (process.env.NODE_ENV === 'development') {
  pool.on('connect', (client) => {
    console.log('New client connected to database');
  });
  
  pool.on('acquire', (client) => {
    console.log('Client acquired from pool');
  });
}

module.exports = pool;
