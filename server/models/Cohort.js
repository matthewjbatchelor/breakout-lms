const { query } = require('../config/database');

class Cohort {
  // Serialize camelCase → snake_case for database
  static serialize(data) {
    const serialized = {};

    if (data.programmeId !== undefined) serialized.programme_id = data.programmeId;
    if (data.name !== undefined) serialized.name = data.name;
    if (data.description !== undefined) serialized.description = data.description;
    if (data.startDate !== undefined) serialized.start_date = data.startDate;
    if (data.endDate !== undefined) serialized.end_date = data.endDate;
    if (data.status !== undefined) serialized.status = data.status;
    if (data.maxParticipants !== undefined) serialized.max_participants = data.maxParticipants;

    return serialized;
  }

  // Deserialize snake_case → camelCase for JavaScript
  static deserialize(row) {
    if (!row) return null;

    return {
      id: row.id,
      programmeId: row.programme_id,
      name: row.name,
      description: row.description,
      startDate: row.start_date,
      endDate: row.end_date,
      status: row.status,
      maxParticipants: row.max_participants,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  // Find cohort by ID
  static async findById(id) {
    const result = await query('SELECT * FROM cohorts WHERE id = $1', [id]);
    return this.deserialize(result.rows[0]);
  }

  // Get all cohorts
  static async findAll() {
    const result = await query('SELECT * FROM cohorts ORDER BY created_at DESC');
    return result.rows.map(row => this.deserialize(row));
  }

  // Find cohorts by programme ID
  static async findByProgramme(programmeId) {
    const result = await query(
      'SELECT * FROM cohorts WHERE programme_id = $1 ORDER BY created_at DESC',
      [programmeId]
    );
    return result.rows.map(row => this.deserialize(row));
  }

  // Find cohorts by status
  static async findByStatus(status) {
    const result = await query(
      'SELECT * FROM cohorts WHERE status = $1 ORDER BY created_at DESC',
      [status]
    );
    return result.rows.map(row => this.deserialize(row));
  }

  // Create new cohort
  static async create(data) {
    const serialized = this.serialize(data);

    const columns = Object.keys(serialized).join(', ');
    const placeholders = Object.keys(serialized).map((_, i) => `$${i + 1}`).join(', ');
    const values = Object.values(serialized);

    const result = await query(
      `INSERT INTO cohorts (${columns}) VALUES (${placeholders}) RETURNING *`,
      values
    );

    return this.deserialize(result.rows[0]);
  }

  // Update cohort
  static async update(id, data) {
    const serialized = this.serialize(data);
    serialized.updated_at = new Date();

    const setClauses = Object.keys(serialized)
      .map((key, i) => `${key} = $${i + 2}`)
      .join(', ');
    const values = [id, ...Object.values(serialized)];

    const result = await query(
      `UPDATE cohorts SET ${setClauses} WHERE id = $1 RETURNING *`,
      values
    );

    return this.deserialize(result.rows[0]);
  }

  // Delete cohort
  static async delete(id) {
    const result = await query('DELETE FROM cohorts WHERE id = $1 RETURNING *', [id]);
    return this.deserialize(result.rows[0]);
  }

  // Get cohort with participants
  static async getWithParticipants(id) {
    const result = await query(`
      SELECT
        c.*,
        COUNT(DISTINCT e.id) as participant_count,
        COUNT(DISTINCT CASE WHEN e.enrollment_status = 'completed' THEN e.id END) as completed_count
      FROM cohorts c
      LEFT JOIN enrollments e ON e.cohort_id = c.id
      WHERE c.id = $1
      GROUP BY c.id
    `, [id]);

    if (!result.rows[0]) return null;

    const cohort = this.deserialize(result.rows[0]);
    cohort.participantCount = parseInt(result.rows[0].participant_count);
    cohort.completedCount = parseInt(result.rows[0].completed_count);

    return cohort;
  }

  // Get participants for a cohort
  static async getParticipants(id) {
    const result = await query(`
      SELECT
        u.id,
        u.username,
        u.email,
        u.first_name,
        u.last_name,
        u.avatar_url,
        e.enrollment_status,
        e.enrollment_date,
        e.completion_percentage
      FROM enrollments e
      JOIN users u ON u.id = e.user_id
      WHERE e.cohort_id = $1
      ORDER BY u.last_name, u.first_name
    `, [id]);

    return result.rows.map(row => ({
      id: row.id,
      username: row.username,
      email: row.email,
      firstName: row.first_name,
      lastName: row.last_name,
      avatarUrl: row.avatar_url,
      enrollmentStatus: row.enrollment_status,
      enrollmentDate: row.enrollment_date,
      completionPercentage: row.completion_percentage
    }));
  }

  // Get progress summary for a cohort
  static async getProgressSummary(id) {
    const result = await query(`
      SELECT
        COUNT(DISTINCT e.id) as total_participants,
        COUNT(DISTINCT CASE WHEN e.enrollment_status = 'enrolled' THEN e.id END) as enrolled_count,
        COUNT(DISTINCT CASE WHEN e.enrollment_status = 'in_progress' THEN e.id END) as in_progress_count,
        COUNT(DISTINCT CASE WHEN e.enrollment_status = 'completed' THEN e.id END) as completed_count,
        COUNT(DISTINCT CASE WHEN e.enrollment_status = 'dropped' THEN e.id END) as dropped_count,
        AVG(e.completion_percentage) as avg_completion
      FROM enrollments e
      WHERE e.cohort_id = $1
    `, [id]);

    const row = result.rows[0];
    return {
      totalParticipants: parseInt(row.total_participants) || 0,
      enrolledCount: parseInt(row.enrolled_count) || 0,
      inProgressCount: parseInt(row.in_progress_count) || 0,
      completedCount: parseInt(row.completed_count) || 0,
      droppedCount: parseInt(row.dropped_count) || 0,
      avgCompletion: parseFloat(row.avg_completion) || 0
    };
  }

  // Search cohorts
  static async search(searchTerm) {
    const result = await query(`
      SELECT * FROM cohorts
      WHERE
        name ILIKE $1 OR
        description ILIKE $1
      ORDER BY created_at DESC
    `, [`%${searchTerm}%`]);
    return result.rows.map(row => this.deserialize(row));
  }
}

module.exports = Cohort;
