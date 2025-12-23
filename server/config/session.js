const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const { pool } = require('./database');

// Session configuration with PostgreSQL store
const sessionConfig = {
  store: new pgSession({
    pool: pool,
    tableName: 'session',
    createTableIfMissing: false, // We create it in migrations
    pruneSessionInterval: 60 * 15 // Prune expired sessions every 15 minutes
  }),
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-this',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    sameSite: 'strict'
  },
  name: 'sessionId' // Custom session cookie name
};

module.exports = sessionConfig;
