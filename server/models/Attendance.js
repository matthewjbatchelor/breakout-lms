const { query, getClient } = require('../config/database');

class Attendance {
  static serialize(data) {
    const serialized = {};

    if (data.cohortId !== undefined) serialized.cohort_id = data.cohortId;
    if (data.userId !== undefined) serialized.user_id = data.userId;
    if (data.sessionDate !== undefined) serialized.session_date = data.sessionDate;
    if (data.sessionName !== undefined) serialized.session_name = data.sessionName;
    if (data.attendanceStatus !== undefined) serialized.attendance_status = data.attendanceStatus;
    if (data.notes !== undefined) serialized.notes = data.notes;
    if (data.recordedBy !== undefined) serialized.recorded_by = data.recordedBy;

    return serialized;
  }

  static deserialize(row) {
    if (!row) return null;

    return {
      id: row.id,
      cohortId: row.cohort_id,
      userId: row.user_id,
      sessionDate: row.session_date,
      sessionName: row.session_name,
      attendanceStatus: row.attendance_status,
      notes: row.notes,
      recordedBy: row.recorded_by,
      recordedAt: row.recorded_at
    };
  }

  static async findById(id) {
    const result = await query('SELECT * FROM attendance_records WHERE id = $1', [id]);
    return this.deserialize(result.rows[0]);
  }

  static async findByCohort(cohortId) {
    const result = await query(
      'SELECT * FROM attendance_records WHERE cohort_id = $1 ORDER BY session_date DESC',
      [cohortId]
    );
    return result.rows.map(row => this.deserialize(row));
  }

  static async findByUser(userId) {
    const result = await query(
      'SELECT * FROM attendance_records WHERE user_id = $1 ORDER BY session_date DESC',
      [userId]
    );
    return result.rows.map(row => this.deserialize(row));
  }

  static async create(data) {
    const serialized = this.serialize(data);

    const columns = Object.keys(serialized).join(', ');
    const placeholders = Object.keys(serialized).map((_, i) => `$${i + 1}`).join(', ');
    const values = Object.values(serialized);

    const result = await query(
      `INSERT INTO attendance_records (${columns}) VALUES (${placeholders}) RETURNING *`,
      values
    );

    return this.deserialize(result.rows[0]);
  }

  static async update(id, data) {
    const serialized = this.serialize(data);

    const setClauses = Object.keys(serialized)
      .map((key, i) => `${key} = $${i + 2}`)
      .join(', ');
    const values = [id, ...Object.values(serialized)];

    const result = await query(
      `UPDATE attendance_records SET ${setClauses} WHERE id = $1 RETURNING *`,
      values
    );

    return this.deserialize(result.rows[0]);
  }

  static async delete(id) {
    const result = await query('DELETE FROM attendance_records WHERE id = $1 RETURNING *', [id]);
    return this.deserialize(result.rows[0]);
  }

  // Bulk record attendance
  static async bulkRecord(cohortId, sessionDate, sessionName, attendanceData, recordedBy) {
    const client = await getClient();

    try {
      await client.query('BEGIN');

      const records = [];
      for (const item of attendanceData) {
        const result = await client.query(
          `INSERT INTO attendance_records
           (cohort_id, user_id, session_date, session_name, attendance_status, recorded_by)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING *`,
          [cohortId, item.userId, sessionDate, sessionName, item.status, recordedBy]
        );

        records.push(this.deserialize(result.rows[0]));
      }

      await client.query('COMMIT');
      return records;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Get attendance with user details
  static async getWithUserDetails(cohortId) {
    const result = await query(`
      SELECT
        a.*,
        u.username,
        u.email,
        u.first_name,
        u.last_name
      FROM attendance_records a
      JOIN users u ON u.id = a.user_id
      WHERE a.cohort_id = $1
      ORDER BY a.session_date DESC, u.last_name, u.first_name
    `, [cohortId]);

    return result.rows.map(row => ({
      ...this.deserialize(row),
      user: {
        username: row.username,
        email: row.email,
        firstName: row.first_name,
        lastName: row.last_name
      }
    }));
  }

  // Get all attendance records with user and cohort details
  static async getAllWithDetails() {
    const result = await query(`
      SELECT
        a.*,
        u.username,
        u.email,
        u.first_name,
        u.last_name,
        c.name as cohort_name,
        c.programme_id,
        p.name as programme_name
      FROM attendance_records a
      JOIN users u ON u.id = a.user_id
      JOIN cohorts c ON c.id = a.cohort_id
      LEFT JOIN programmes p ON p.id = c.programme_id
      ORDER BY a.session_date DESC, c.name, u.last_name, u.first_name
    `);

    return result.rows.map(row => ({
      ...this.deserialize(row),
      participantName: `${row.first_name} ${row.last_name}`,
      cohortName: row.cohort_name,
      programmeName: row.programme_name,
      user: {
        username: row.username,
        email: row.email,
        firstName: row.first_name,
        lastName: row.last_name
      }
    }));
  }

  // Get attendance stats for a cohort
  static async getStatsForCohort(cohortId) {
    const result = await query(`
      SELECT
        COUNT(*) as total_records,
        COUNT(DISTINCT user_id) as unique_participants,
        COUNT(DISTINCT session_date) as total_sessions,
        COUNT(CASE WHEN attendance_status = 'present' THEN 1 END) as present_count,
        COUNT(CASE WHEN attendance_status = 'absent' THEN 1 END) as absent_count,
        COUNT(CASE WHEN attendance_status = 'late' THEN 1 END) as late_count,
        COUNT(CASE WHEN attendance_status = 'excused' THEN 1 END) as excused_count
      FROM attendance_records
      WHERE cohort_id = $1
    `, [cohortId]);

    const row = result.rows[0];
    return {
      totalRecords: parseInt(row.total_records) || 0,
      uniqueParticipants: parseInt(row.unique_participants) || 0,
      totalSessions: parseInt(row.total_sessions) || 0,
      presentCount: parseInt(row.present_count) || 0,
      absentCount: parseInt(row.absent_count) || 0,
      lateCount: parseInt(row.late_count) || 0,
      excusedCount: parseInt(row.excused_count) || 0
    };
  }
}

module.exports = Attendance;
