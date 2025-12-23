const { query } = require('../config/database');

class Programme {
  // Serialize camelCase → snake_case for database
  static serialize(data) {
    const serialized = {};

    if (data.name !== undefined) serialized.name = data.name;
    if (data.description !== undefined) serialized.description = data.description;
    if (data.programmeType !== undefined) serialized.programme_type = data.programmeType;
    if (data.startDate !== undefined) serialized.start_date = data.startDate;
    if (data.endDate !== undefined) serialized.end_date = data.endDate;
    if (data.status !== undefined) serialized.status = data.status;
    if (data.maxParticipants !== undefined) serialized.max_participants = data.maxParticipants;
    if (data.thumbnailUrl !== undefined) serialized.thumbnail_url = data.thumbnailUrl;
    if (data.createdBy !== undefined) serialized.created_by = data.createdBy;

    return serialized;
  }

  // Deserialize snake_case → camelCase for JavaScript
  static deserialize(row) {
    if (!row) return null;

    return {
      id: row.id,
      name: row.name,
      description: row.description,
      programmeType: row.programme_type,
      startDate: row.start_date,
      endDate: row.end_date,
      status: row.status,
      maxParticipants: row.max_participants,
      thumbnailUrl: row.thumbnail_url,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  // Find programme by ID
  static async findById(id) {
    const result = await query('SELECT * FROM programmes WHERE id = $1', [id]);
    return this.deserialize(result.rows[0]);
  }

  // Get all programmes
  static async findAll() {
    const result = await query('SELECT * FROM programmes ORDER BY created_at DESC');
    return result.rows.map(row => this.deserialize(row));
  }

  // Find programmes by status
  static async findByStatus(status) {
    const result = await query(
      'SELECT * FROM programmes WHERE status = $1 ORDER BY created_at DESC',
      [status]
    );
    return result.rows.map(row => this.deserialize(row));
  }

  // Find programmes by type
  static async findByType(type) {
    const result = await query(
      'SELECT * FROM programmes WHERE programme_type = $1 ORDER BY created_at DESC',
      [type]
    );
    return result.rows.map(row => this.deserialize(row));
  }

  // Create new programme
  static async create(data) {
    const serialized = this.serialize(data);

    const columns = Object.keys(serialized).join(', ');
    const placeholders = Object.keys(serialized).map((_, i) => `$${i + 1}`).join(', ');
    const values = Object.values(serialized);

    const result = await query(
      `INSERT INTO programmes (${columns}) VALUES (${placeholders}) RETURNING *`,
      values
    );

    return this.deserialize(result.rows[0]);
  }

  // Update programme
  static async update(id, data) {
    const serialized = this.serialize(data);
    serialized.updated_at = new Date();

    const setClauses = Object.keys(serialized)
      .map((key, i) => `${key} = $${i + 2}`)
      .join(', ');
    const values = [id, ...Object.values(serialized)];

    const result = await query(
      `UPDATE programmes SET ${setClauses} WHERE id = $1 RETURNING *`,
      values
    );

    return this.deserialize(result.rows[0]);
  }

  // Delete programme
  static async delete(id) {
    const result = await query('DELETE FROM programmes WHERE id = $1 RETURNING *', [id]);
    return this.deserialize(result.rows[0]);
  }

  // Get programme with statistics
  static async getWithStats(id) {
    const result = await query(`
      SELECT
        p.*,
        COUNT(DISTINCT c.id) as cohort_count,
        COUNT(DISTINCT e.id) as participant_count
      FROM programmes p
      LEFT JOIN cohorts c ON c.programme_id = p.id
      LEFT JOIN enrollments e ON e.cohort_id = c.id
      WHERE p.id = $1
      GROUP BY p.id
    `, [id]);

    if (!result.rows[0]) return null;

    const programme = this.deserialize(result.rows[0]);
    programme.cohortCount = parseInt(result.rows[0].cohort_count);
    programme.participantCount = parseInt(result.rows[0].participant_count);

    return programme;
  }

  // Get all programmes with statistics
  static async getAllWithStats() {
    const result = await query(`
      SELECT
        p.*,
        COUNT(DISTINCT c.id) as cohort_count,
        COUNT(DISTINCT e.id) as participant_count
      FROM programmes p
      LEFT JOIN cohorts c ON c.programme_id = p.id
      LEFT JOIN enrollments e ON e.cohort_id = c.id
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `);

    return result.rows.map(row => {
      const programme = this.deserialize(row);
      programme.cohortCount = parseInt(row.cohort_count);
      programme.participantCount = parseInt(row.participant_count);
      return programme;
    });
  }

  // Search programmes
  static async search(searchTerm) {
    const result = await query(`
      SELECT * FROM programmes
      WHERE
        name ILIKE $1 OR
        description ILIKE $1
      ORDER BY created_at DESC
    `, [`%${searchTerm}%`]);
    return result.rows.map(row => this.deserialize(row));
  }
}

module.exports = Programme;
