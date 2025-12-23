const { Pool } = require('pg');

// PostgreSQL connection pool configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test database connection
pool.on('connect', () => {
  console.log('✓ Database connected successfully');
});

pool.on('error', (err) => {
  console.error('Unexpected database error:', err);
  process.exit(-1);
});

// Helper function to execute queries with error handling and logging
async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;

    // Log slow queries in development
    if (process.env.NODE_ENV === 'development' && duration > 100) {
      console.log('Slow query detected:', {
        text: text.substring(0, 100),
        duration,
        rows: res.rowCount
      });
    }

    return res;
  } catch (error) {
    console.error('Database query error:', {
      text: text.substring(0, 100),
      error: error.message
    });
    throw error;
  }
}

// Helper to get a client from the pool for transactions
async function getClient() {
  const client = await pool.connect();

  // Add query method to client for consistency
  const originalQuery = client.query;
  client.query = function(...args) {
    return originalQuery.apply(client, args);
  };

  // Add release method with logging
  const originalRelease = client.release;
  client.release = function() {
    client.query = originalQuery;
    client.release = originalRelease;
    return originalRelease.apply(client);
  };

  return client;
}

module.exports = {
  pool,
  query,
  getClient
};
