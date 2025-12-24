const { query } = require('../config/database');

async function up() {
  console.log('📚 Creating course_prerequisites table...');

  try {
    // Create course_prerequisites table
    await query(`
      CREATE TABLE IF NOT EXISTS course_prerequisites (
        id SERIAL PRIMARY KEY,
        course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        prerequisite_course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(course_id, prerequisite_course_id),
        CHECK (course_id != prerequisite_course_id)
      );
    `);

    // Create indexes for faster lookups
    await query(`
      CREATE INDEX IF NOT EXISTS idx_course_prerequisites_course_id
      ON course_prerequisites(course_id);
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_course_prerequisites_prerequisite_id
      ON course_prerequisites(prerequisite_course_id);
    `);

    console.log('✅ course_prerequisites table created successfully');

  } catch (error) {
    console.error('❌ Error creating course_prerequisites table:', error);
    throw error;
  }
}

module.exports = { up };
