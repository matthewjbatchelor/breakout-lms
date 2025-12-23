const { query } = require('../config/database');

class MentorAssignment {
  static serialize(data) {
    const serialized = {};

    if (data.cohortId !== undefined) serialized.cohort_id = data.cohortId;
    if (data.mentorId !== undefined) serialized.mentor_id = data.mentorId;
    if (data.isLeadMentor !== undefined) serialized.is_lead_mentor = data.isLeadMentor;
    if (data.notes !== undefined) serialized.notes = data.notes;

    return serialized;
  }

  static deserialize(row) {
    if (!row) return null;

    return {
      id: row.id,
      cohortId: row.cohort_id,
      mentorId: row.mentor_id,
      assignedDate: row.assigned_date,
      isLeadMentor: row.is_lead_mentor,
      notes: row.notes
    };
  }

  static async findById(id) {
    const result = await query('SELECT * FROM mentor_assignments WHERE id = $1', [id]);
    return this.deserialize(result.rows[0]);
  }

  static async findByCohort(cohortId) {
    const result = await query(
      'SELECT * FROM mentor_assignments WHERE cohort_id = $1 ORDER BY is_lead_mentor DESC, assigned_date',
      [cohortId]
    );
    return result.rows.map(row => this.deserialize(row));
  }

  static async findByMentor(mentorId) {
    const result = await query(
      'SELECT * FROM mentor_assignments WHERE mentor_id = $1 ORDER BY assigned_date DESC',
      [mentorId]
    );
    return result.rows.map(row => this.deserialize(row));
  }

  static async create(data) {
    const serialized = this.serialize(data);

    const columns = Object.keys(serialized).join(', ');
    const placeholders = Object.keys(serialized).map((_, i) => `$${i + 1}`).join(', ');
    const values = Object.values(serialized);

    const result = await query(
      `INSERT INTO mentor_assignments (${columns}) VALUES (${placeholders}) RETURNING *`,
      values
    );

    return this.deserialize(result.rows[0]);
  }

  static async delete(id) {
    const result = await query('DELETE FROM mentor_assignments WHERE id = $1 RETURNING *', [id]);
    return this.deserialize(result.rows[0]);
  }

  // Get mentors with details for a cohort
  static async getMentorsForCohort(cohortId) {
    const result = await query(`
      SELECT
        ma.*,
        u.username,
        u.email,
        u.first_name,
        u.last_name,
        u.avatar_url
      FROM mentor_assignments ma
      JOIN users u ON u.id = ma.mentor_id
      WHERE ma.cohort_id = $1
      ORDER BY ma.is_lead_mentor DESC, u.last_name, u.first_name
    `, [cohortId]);

    return result.rows.map(row => ({
      ...this.deserialize(row),
      mentor: {
        username: row.username,
        email: row.email,
        firstName: row.first_name,
        lastName: row.last_name,
        avatarUrl: row.avatar_url
      }
    }));
  }
}

module.exports = MentorAssignment;
