const { query, getClient } = require('../config/database');

class Enrollment {
  static serialize(data) {
    const serialized = {};

    if (data.cohortId !== undefined) serialized.cohort_id = data.cohortId;
    if (data.userId !== undefined) serialized.user_id = data.userId;
    if (data.enrollmentStatus !== undefined) serialized.enrollment_status = data.enrollmentStatus;
    if (data.completionDate !== undefined) serialized.completion_date = data.completionDate;
    if (data.completionPercentage !== undefined) serialized.completion_percentage = data.completionPercentage;
    if (data.certificateIssued !== undefined) serialized.certificate_issued = data.certificateIssued;
    if (data.certificateUrl !== undefined) serialized.certificate_url = data.certificateUrl;
    if (data.notes !== undefined) serialized.notes = data.notes;

    return serialized;
  }

  static deserialize(row) {
    if (!row) return null;

    return {
      id: row.id,
      cohortId: row.cohort_id,
      userId: row.user_id,
      enrollmentStatus: row.enrollment_status,
      enrollmentDate: row.enrollment_date,
      completionDate: row.completion_date,
      completionPercentage: row.completion_percentage,
      certificateIssued: row.certificate_issued,
      certificateUrl: row.certificate_url,
      notes: row.notes
    };
  }

  static async findById(id) {
    const result = await query('SELECT * FROM enrollments WHERE id = $1', [id]);
    return this.deserialize(result.rows[0]);
  }

  static async findAll() {
    const result = await query('SELECT * FROM enrollments ORDER BY enrollment_date DESC');
    return result.rows.map(row => this.deserialize(row));
  }

  static async findByCohort(cohortId) {
    const result = await query(
      'SELECT * FROM enrollments WHERE cohort_id = $1 ORDER BY enrollment_date DESC',
      [cohortId]
    );
    return result.rows.map(row => this.deserialize(row));
  }

  static async findByUser(userId) {
    const result = await query(
      'SELECT * FROM enrollments WHERE user_id = $1 ORDER BY enrollment_date DESC',
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
      `INSERT INTO enrollments (${columns}) VALUES (${placeholders}) RETURNING *`,
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
      `UPDATE enrollments SET ${setClauses} WHERE id = $1 RETURNING *`,
      values
    );

    return this.deserialize(result.rows[0]);
  }

  static async delete(id) {
    const result = await query('DELETE FROM enrollments WHERE id = $1 RETURNING *', [id]);
    return this.deserialize(result.rows[0]);
  }

  // Bulk enroll participants
  static async bulkEnroll(cohortId, userIds) {
    const client = await getClient();

    try {
      await client.query('BEGIN');

      const enrollments = [];
      for (const userId of userIds) {
        const result = await client.query(
          `INSERT INTO enrollments (cohort_id, user_id, enrollment_status)
           VALUES ($1, $2, $3)
           ON CONFLICT (cohort_id, user_id) DO NOTHING
           RETURNING *`,
          [cohortId, userId, 'enrolled']
        );

        if (result.rows[0]) {
          enrollments.push(this.deserialize(result.rows[0]));
        }
      }

      await client.query('COMMIT');
      return enrollments;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Get enrollment with user details
  static async getWithUserDetails(cohortId) {
    const result = await query(`
      SELECT
        e.*,
        u.username,
        u.email,
        u.first_name,
        u.last_name,
        u.avatar_url
      FROM enrollments e
      JOIN users u ON u.id = e.user_id
      WHERE e.cohort_id = $1
      ORDER BY u.last_name, u.first_name
    `, [cohortId]);

    return result.rows.map(row => ({
      ...this.deserialize(row),
      user: {
        username: row.username,
        email: row.email,
        firstName: row.first_name,
        lastName: row.last_name,
        avatarUrl: row.avatar_url
      }
    }));
  }
}

module.exports = Enrollment;
