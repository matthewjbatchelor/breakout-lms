const { query } = require('../config/database');

class CohortSession {
  // Serialize camelCase to snake_case for database
  static serialize(data) {
    const serialized = {};
    if (data.cohortId !== undefined) serialized.cohort_id = data.cohortId;
    if (data.sessionName !== undefined) serialized.session_name = data.sessionName;
    if (data.sessionDate !== undefined) serialized.session_date = data.sessionDate;
    if (data.startTime !== undefined) serialized.start_time = data.startTime;
    if (data.endTime !== undefined) serialized.end_time = data.endTime;
    if (data.location !== undefined) serialized.location = data.location;
    if (data.description !== undefined) serialized.description = data.description;
    if (data.sessionType !== undefined) serialized.session_type = data.sessionType;
    if (data.isCompleted !== undefined) serialized.is_completed = data.isCompleted;
    if (data.notes !== undefined) serialized.notes = data.notes;
    return serialized;
  }

  // Deserialize snake_case to camelCase for JavaScript
  static deserialize(row) {
    if (!row) return null;
    return {
      id: row.id,
      cohortId: row.cohort_id,
      sessionName: row.session_name,
      sessionDate: row.session_date,
      startTime: row.start_time,
      endTime: row.end_time,
      location: row.location,
      description: row.description,
      sessionType: row.session_type,
      isCompleted: row.is_completed,
      notes: row.notes,
      createdAt: row.created_at
    };
  }

  // Find all sessions for a cohort
  static async findByCohort(cohortId) {
    const result = await query(
      'SELECT * FROM cohort_sessions WHERE cohort_id = $1 ORDER BY session_date ASC, start_time ASC',
      [cohortId]
    );
    return result.rows.map(row => this.deserialize(row));
  }

  // Find session by ID
  static async findById(id) {
    const result = await query('SELECT * FROM cohort_sessions WHERE id = $1', [id]);
    return this.deserialize(result.rows[0]);
  }

  // Create new session
  static async create(data) {
    const serialized = this.serialize(data);
    const columns = Object.keys(serialized).join(', ');
    const placeholders = Object.keys(serialized).map((_, i) => `$${i + 1}`).join(', ');
    const values = Object.values(serialized);

    const result = await query(
      `INSERT INTO cohort_sessions (${columns}) VALUES (${placeholders}) RETURNING *`,
      values
    );

    return this.deserialize(result.rows[0]);
  }

  // Update session
  static async update(id, data) {
    const serialized = this.serialize(data);
    const updates = Object.keys(serialized)
      .map((key, i) => `${key} = $${i + 2}`)
      .join(', ');
    const values = [id, ...Object.values(serialized)];

    const result = await query(
      `UPDATE cohort_sessions SET ${updates} WHERE id = $1 RETURNING *`,
      values
    );

    return this.deserialize(result.rows[0]);
  }

  // Delete session
  static async delete(id) {
    const result = await query('DELETE FROM cohort_sessions WHERE id = $1 RETURNING *', [id]);
    return this.deserialize(result.rows[0]);
  }

  // Get sessions with attendance stats
  static async getWithAttendanceStats(cohortId) {
    const result = await query(`
      SELECT
        cs.*,
        COUNT(DISTINCT ar.id) as total_marked,
        COUNT(DISTINCT CASE WHEN ar.status = 'present' THEN ar.id END) as present_count,
        COUNT(DISTINCT CASE WHEN ar.status = 'absent' THEN ar.id END) as absent_count,
        COUNT(DISTINCT CASE WHEN ar.status = 'late' THEN ar.id END) as late_count
      FROM cohort_sessions cs
      LEFT JOIN attendance_records ar ON ar.session_date = cs.session_date
        AND ar.cohort_id = cs.cohort_id
      WHERE cs.cohort_id = $1
      GROUP BY cs.id
      ORDER BY cs.session_date ASC, cs.start_time ASC
    `, [cohortId]);

    return result.rows.map(row => ({
      ...this.deserialize(row),
      totalMarked: parseInt(row.total_marked) || 0,
      presentCount: parseInt(row.present_count) || 0,
      absentCount: parseInt(row.absent_count) || 0,
      lateCount: parseInt(row.late_count) || 0
    }));
  }

  // Mark session as completed
  static async markCompleted(id, notes = null) {
    const result = await query(
      'UPDATE cohort_sessions SET is_completed = true, notes = $2 WHERE id = $1 RETURNING *',
      [id, notes]
    );
    return this.deserialize(result.rows[0]);
  }
}

module.exports = CohortSession;
