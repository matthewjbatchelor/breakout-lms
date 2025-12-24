const { query } = require('../config/database');

async function up() {
  console.log('📅 Creating cohort_sessions table...');

  try {
    // Create cohort_sessions table
    await query(`
      CREATE TABLE IF NOT EXISTS cohort_sessions (
        id SERIAL PRIMARY KEY,
        cohort_id INTEGER NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
        session_name VARCHAR(255) NOT NULL,
        session_date DATE NOT NULL,
        start_time TIME,
        end_time TIME,
        location VARCHAR(255),
        description TEXT,
        session_type VARCHAR(50) DEFAULT 'lecture',
        is_completed BOOLEAN DEFAULT false,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create index for faster lookups
    await query(`
      CREATE INDEX IF NOT EXISTS idx_cohort_sessions_cohort_id
      ON cohort_sessions(cohort_id);
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_cohort_sessions_date
      ON cohort_sessions(session_date);
    `);

    console.log('✅ cohort_sessions table created successfully');

  } catch (error) {
    console.error('❌ Error creating cohort_sessions table:', error);
    throw error;
  }
}

module.exports = { up };
