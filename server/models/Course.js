const { query } = require('../config/database');

class Course {
  static serialize(data) {
    const serialized = {};

    if (data.programmeId !== undefined) serialized.programme_id = data.programmeId;
    if (data.title !== undefined) serialized.title = data.title;
    if (data.description !== undefined) serialized.description = data.description;
    if (data.thumbnailUrl !== undefined) serialized.thumbnail_url = data.thumbnailUrl;
    if (data.durationMinutes !== undefined) serialized.duration_minutes = data.durationMinutes;
    if (data.sequenceOrder !== undefined) serialized.sequence_order = data.sequenceOrder;
    if (data.isPublished !== undefined) serialized.is_published = data.isPublished;
    if (data.createdBy !== undefined) serialized.created_by = data.createdBy;

    return serialized;
  }

  static deserialize(row) {
    if (!row) return null;

    return {
      id: row.id,
      programmeId: row.programme_id,
      title: row.title,
      description: row.description,
      thumbnailUrl: row.thumbnail_url,
      durationMinutes: row.duration_minutes,
      sequenceOrder: row.sequence_order,
      isPublished: row.is_published,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  static async findById(id) {
    const result = await query('SELECT * FROM courses WHERE id = $1', [id]);
    return this.deserialize(result.rows[0]);
  }

  static async findAll() {
    const result = await query('SELECT * FROM courses ORDER BY sequence_order, created_at');
    return result.rows.map(row => this.deserialize(row));
  }

  static async findByProgramme(programmeId) {
    const result = await query(
      'SELECT * FROM courses WHERE programme_id = $1 ORDER BY sequence_order, created_at',
      [programmeId]
    );
    return result.rows.map(row => this.deserialize(row));
  }

  static async create(data) {
    const serialized = this.serialize(data);

    const columns = Object.keys(serialized).join(', ');
    const placeholders = Object.keys(serialized).map((_, i) => `$${i + 1}`).join(', ');
    const values = Object.values(serialized);

    const result = await query(
      `INSERT INTO courses (${columns}) VALUES (${placeholders}) RETURNING *`,
      values
    );

    return this.deserialize(result.rows[0]);
  }

  static async update(id, data) {
    const serialized = this.serialize(data);
    serialized.updated_at = new Date();

    const setClauses = Object.keys(serialized)
      .map((key, i) => `${key} = $${i + 2}`)
      .join(', ');
    const values = [id, ...Object.values(serialized)];

    const result = await query(
      `UPDATE courses SET ${setClauses} WHERE id = $1 RETURNING *`,
      values
    );

    return this.deserialize(result.rows[0]);
  }

  static async delete(id) {
    const result = await query('DELETE FROM courses WHERE id = $1 RETURNING *', [id]);
    return this.deserialize(result.rows[0]);
  }

  static async getWithModules(id) {
    const course = await this.findById(id);
    if (!course) return null;

    const modules = await query(
      'SELECT * FROM modules WHERE course_id = $1 ORDER BY sequence_order',
      [id]
    );

    course.modules = modules.rows.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      contentType: row.content_type,
      sequenceOrder: row.sequence_order,
      durationMinutes: row.duration_minutes,
      isPublished: row.is_published
    }));

    return course;
  }
}

module.exports = Course;
