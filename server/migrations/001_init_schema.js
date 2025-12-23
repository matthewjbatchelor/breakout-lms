const { query } = require('../config/database');

async function up() {
  console.log('Running database migrations...');

  try {
    // Check if tables already exist
    const tablesCheck = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'users'
      );
    `);

    if (tablesCheck.rows[0].exists) {
      console.log('✓ Database tables already exist, skipping migration');
      return;
    }

    // Create Users table
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role VARCHAR(50) NOT NULL CHECK(role IN ('admin', 'mentor', 'participant', 'viewer')),
        first_name VARCHAR(255),
        last_name VARCHAR(255),
        avatar_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP,
        is_active BOOLEAN DEFAULT true
      );
      CREATE INDEX idx_users_username ON users(username);
      CREATE INDEX idx_users_email ON users(email);
      CREATE INDEX idx_users_role ON users(role);
    `);
    console.log('✓ Created users table');

    // Create Programmes table
    await query(`
      CREATE TABLE IF NOT EXISTS programmes (
        id SERIAL PRIMARY KEY,
        name VARCHAR(500) NOT NULL,
        description TEXT,
        programme_type VARCHAR(100) CHECK(programme_type IN ('breakout', 'mentoring_day', 'other')),
        start_date DATE,
        end_date DATE,
        status VARCHAR(50) CHECK(status IN ('draft', 'active', 'completed', 'archived')) DEFAULT 'draft',
        max_participants INTEGER,
        thumbnail_url TEXT,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX idx_programmes_status ON programmes(status);
      CREATE INDEX idx_programmes_type ON programmes(programme_type);
    `);
    console.log('✓ Created programmes table');

    // Create Cohorts table
    await query(`
      CREATE TABLE IF NOT EXISTS cohorts (
        id SERIAL PRIMARY KEY,
        programme_id INTEGER REFERENCES programmes(id) ON DELETE CASCADE,
        name VARCHAR(500) NOT NULL,
        description TEXT,
        start_date DATE,
        end_date DATE,
        status VARCHAR(50) CHECK(status IN ('draft', 'active', 'completed', 'archived')) DEFAULT 'draft',
        max_participants INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX idx_cohorts_programme_id ON cohorts(programme_id);
      CREATE INDEX idx_cohorts_status ON cohorts(status);
    `);
    console.log('✓ Created cohorts table');

    // Create Courses table
    await query(`
      CREATE TABLE IF NOT EXISTS courses (
        id SERIAL PRIMARY KEY,
        programme_id INTEGER REFERENCES programmes(id) ON DELETE CASCADE,
        title VARCHAR(500) NOT NULL,
        description TEXT,
        thumbnail_url TEXT,
        duration_minutes INTEGER,
        sequence_order INTEGER DEFAULT 0,
        is_published BOOLEAN DEFAULT false,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX idx_courses_programme_id ON courses(programme_id);
      CREATE INDEX idx_courses_published ON courses(is_published);
    `);
    console.log('✓ Created courses table');

    // Create Modules table
    await query(`
      CREATE TABLE IF NOT EXISTS modules (
        id SERIAL PRIMARY KEY,
        course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
        title VARCHAR(500) NOT NULL,
        description TEXT,
        content_type VARCHAR(50) CHECK(content_type IN ('text', 'video', 'document', 'quiz', 'discussion', 'assignment')),
        content_data JSONB,
        sequence_order INTEGER DEFAULT 0,
        duration_minutes INTEGER,
        is_published BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX idx_modules_course_id ON modules(course_id);
      CREATE INDEX idx_modules_content_type ON modules(content_type);
    `);
    console.log('✓ Created modules table');

    // Create Module Resources table
    await query(`
      CREATE TABLE IF NOT EXISTS module_resources (
        id SERIAL PRIMARY KEY,
        module_id INTEGER REFERENCES modules(id) ON DELETE CASCADE,
        resource_type VARCHAR(50) CHECK(resource_type IN ('document', 'video', 'link', 'pdf', 'image', 'audio')),
        title VARCHAR(500) NOT NULL,
        file_url TEXT,
        external_url TEXT,
        file_size INTEGER,
        mime_type VARCHAR(100),
        description TEXT,
        sequence_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX idx_module_resources_module_id ON module_resources(module_id);
    `);
    console.log('✓ Created module_resources table');

    // Create Enrollments table
    await query(`
      CREATE TABLE IF NOT EXISTS enrollments (
        id SERIAL PRIMARY KEY,
        cohort_id INTEGER REFERENCES cohorts(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        enrollment_status VARCHAR(50) CHECK(enrollment_status IN ('enrolled', 'in_progress', 'completed', 'dropped', 'waitlist')) DEFAULT 'enrolled',
        enrollment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completion_date TIMESTAMP,
        completion_percentage INTEGER DEFAULT 0,
        certificate_issued BOOLEAN DEFAULT false,
        certificate_url TEXT,
        notes TEXT,
        UNIQUE(cohort_id, user_id)
      );
      CREATE INDEX idx_enrollments_cohort_id ON enrollments(cohort_id);
      CREATE INDEX idx_enrollments_user_id ON enrollments(user_id);
      CREATE INDEX idx_enrollments_status ON enrollments(enrollment_status);
    `);
    console.log('✓ Created enrollments table');

    // Create Mentor Assignments table
    await query(`
      CREATE TABLE IF NOT EXISTS mentor_assignments (
        id SERIAL PRIMARY KEY,
        cohort_id INTEGER REFERENCES cohorts(id) ON DELETE CASCADE,
        mentor_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        assigned_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_lead_mentor BOOLEAN DEFAULT false,
        notes TEXT,
        UNIQUE(cohort_id, mentor_id)
      );
      CREATE INDEX idx_mentor_assignments_cohort_id ON mentor_assignments(cohort_id);
      CREATE INDEX idx_mentor_assignments_mentor_id ON mentor_assignments(mentor_id);
    `);
    console.log('✓ Created mentor_assignments table');

    // Create Attendance Records table
    await query(`
      CREATE TABLE IF NOT EXISTS attendance_records (
        id SERIAL PRIMARY KEY,
        cohort_id INTEGER REFERENCES cohorts(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        session_date DATE NOT NULL,
        session_name VARCHAR(500),
        attendance_status VARCHAR(50) CHECK(attendance_status IN ('present', 'absent', 'late', 'excused')) DEFAULT 'present',
        notes TEXT,
        recorded_by INTEGER REFERENCES users(id),
        recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX idx_attendance_cohort_user ON attendance_records(cohort_id, user_id);
      CREATE INDEX idx_attendance_date ON attendance_records(session_date);
    `);
    console.log('✓ Created attendance_records table');

    // Create Progress Tracking table
    await query(`
      CREATE TABLE IF NOT EXISTS progress_tracking (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        module_id INTEGER REFERENCES modules(id) ON DELETE CASCADE,
        status VARCHAR(50) CHECK(status IN ('not_started', 'in_progress', 'completed', 'skipped')) DEFAULT 'not_started',
        started_at TIMESTAMP,
        completed_at TIMESTAMP,
        time_spent_minutes INTEGER DEFAULT 0,
        last_accessed_at TIMESTAMP,
        UNIQUE(user_id, module_id)
      );
      CREATE INDEX idx_progress_user_id ON progress_tracking(user_id);
      CREATE INDEX idx_progress_module_id ON progress_tracking(module_id);
      CREATE INDEX idx_progress_status ON progress_tracking(status);
    `);
    console.log('✓ Created progress_tracking table');

    // Create Assessments table
    await query(`
      CREATE TABLE IF NOT EXISTS assessments (
        id SERIAL PRIMARY KEY,
        module_id INTEGER REFERENCES modules(id) ON DELETE CASCADE,
        title VARCHAR(500) NOT NULL,
        description TEXT,
        assessment_type VARCHAR(50) CHECK(assessment_type IN ('quiz', 'assignment', 'survey', 'feedback')),
        questions JSONB,
        passing_score INTEGER DEFAULT 70,
        max_attempts INTEGER,
        time_limit_minutes INTEGER,
        is_published BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX idx_assessments_module_id ON assessments(module_id);
    `);
    console.log('✓ Created assessments table');

    // Create Assessment Submissions table
    await query(`
      CREATE TABLE IF NOT EXISTS assessment_submissions (
        id SERIAL PRIMARY KEY,
        assessment_id INTEGER REFERENCES assessments(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        answers JSONB,
        score INTEGER,
        passed BOOLEAN,
        attempt_number INTEGER DEFAULT 1,
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        graded_by INTEGER REFERENCES users(id),
        graded_at TIMESTAMP,
        feedback TEXT
      );
      CREATE INDEX idx_submissions_assessment_id ON assessment_submissions(assessment_id);
      CREATE INDEX idx_submissions_user_id ON assessment_submissions(user_id);
    `);
    console.log('✓ Created assessment_submissions table');

    // Create Discussion Threads table
    await query(`
      CREATE TABLE IF NOT EXISTS discussion_threads (
        id SERIAL PRIMARY KEY,
        module_id INTEGER REFERENCES modules(id) ON DELETE CASCADE,
        cohort_id INTEGER REFERENCES cohorts(id) ON DELETE CASCADE,
        created_by INTEGER REFERENCES users(id),
        title VARCHAR(500) NOT NULL,
        content TEXT,
        is_pinned BOOLEAN DEFAULT false,
        is_locked BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX idx_threads_module_id ON discussion_threads(module_id);
      CREATE INDEX idx_threads_cohort_id ON discussion_threads(cohort_id);
    `);
    console.log('✓ Created discussion_threads table');

    // Create Discussion Posts table
    await query(`
      CREATE TABLE IF NOT EXISTS discussion_posts (
        id SERIAL PRIMARY KEY,
        thread_id INTEGER REFERENCES discussion_threads(id) ON DELETE CASCADE,
        parent_post_id INTEGER REFERENCES discussion_posts(id) ON DELETE CASCADE,
        created_by INTEGER REFERENCES users(id),
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX idx_posts_thread_id ON discussion_posts(thread_id);
      CREATE INDEX idx_posts_parent_id ON discussion_posts(parent_post_id);
    `);
    console.log('✓ Created discussion_posts table');

    // Create Engagement Logs table
    await query(`
      CREATE TABLE IF NOT EXISTS engagement_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        cohort_id INTEGER REFERENCES cohorts(id) ON DELETE CASCADE,
        module_id INTEGER REFERENCES modules(id) ON DELETE SET NULL,
        event_type VARCHAR(100) NOT NULL,
        event_data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX idx_engagement_user_id ON engagement_logs(user_id);
      CREATE INDEX idx_engagement_cohort_id ON engagement_logs(cohort_id);
      CREATE INDEX idx_engagement_event_type ON engagement_logs(event_type);
      CREATE INDEX idx_engagement_created_at ON engagement_logs(created_at);
    `);
    console.log('✓ Created engagement_logs table');

    // Create Session table (for express-session)
    await query(`
      CREATE TABLE IF NOT EXISTS session (
        sid VARCHAR NOT NULL COLLATE "default",
        sess JSON NOT NULL,
        expire TIMESTAMP(6) NOT NULL,
        CONSTRAINT session_pkey PRIMARY KEY (sid)
      );
      CREATE INDEX IDX_session_expire ON session (expire);
    `);
    console.log('✓ Created session table');

    // Create Notifications table
    await query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(500) NOT NULL,
        message TEXT,
        notification_type VARCHAR(50) CHECK(notification_type IN ('info', 'success', 'warning', 'error')),
        is_read BOOLEAN DEFAULT false,
        action_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX idx_notifications_user_id ON notifications(user_id);
      CREATE INDEX idx_notifications_is_read ON notifications(is_read);
    `);
    console.log('✓ Created notifications table');

    // Create Import History table
    await query(`
      CREATE TABLE IF NOT EXISTS import_history (
        id SERIAL PRIMARY KEY,
        import_type VARCHAR(100) NOT NULL,
        file_name VARCHAR(500),
        records_imported INTEGER DEFAULT 0,
        records_failed INTEGER DEFAULT 0,
        status VARCHAR(50) CHECK(status IN ('in_progress', 'completed', 'failed')) DEFAULT 'in_progress',
        error_log JSONB,
        imported_by INTEGER REFERENCES users(id),
        imported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX idx_import_history_type ON import_history(import_type);
    `);
    console.log('✓ Created import_history table');

    console.log('✅ All database tables created successfully');
  } catch (error) {
    console.error('❌ Error running migrations:', error);
    throw error;
  }
}

module.exports = { up };
