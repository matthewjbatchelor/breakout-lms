const { query } = require('../config/database');

class Module {
  static serialize(data) {
    const serialized = {};

    if (data.courseId !== undefined) serialized.course_id = data.courseId;
    if (data.title !== undefined) serialized.title = data.title;
    if (data.description !== undefined) serialized.description = data.description;
    if (data.contentType !== undefined) serialized.content_type = data.contentType;
    if (data.contentData !== undefined) serialized.content_data = JSON.stringify(data.contentData);
    if (data.sequenceOrder !== undefined) serialized.sequence_order = data.sequenceOrder;
    if (data.durationMinutes !== undefined) serialized.duration_minutes = data.durationMinutes;
    if (data.isPublished !== undefined) serialized.is_published = data.isPublished;

    return serialized;
  }

  static deserialize(row) {
    if (!row) return null;

    return {
      id: row.id,
      courseId: row.course_id,
      title: row.title,
      description: row.description,
      contentType: row.content_type,
      contentData: row.content_data ? (typeof row.content_data === 'string' ? JSON.parse(row.content_data) : row.content_data) : null,
      sequenceOrder: row.sequence_order,
      durationMinutes: row.duration_minutes,
      isPublished: row.is_published,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  static async findById(id) {
    const result = await query('SELECT * FROM modules WHERE id = $1', [id]);
    return this.deserialize(result.rows[0]);
  }

  static async findByCourse(courseId) {
    const result = await query(
      'SELECT * FROM modules WHERE course_id = $1 ORDER BY sequence_order',
      [courseId]
    );
    return result.rows.map(row => this.deserialize(row));
  }

  static async create(data) {
    const serialized = this.serialize(data);

    const columns = Object.keys(serialized).join(', ');
    const placeholders = Object.keys(serialized).map((_, i) => `$${i + 1}`).join(', ');
    const values = Object.values(serialized);

    const result = await query(
      `INSERT INTO modules (${columns}) VALUES (${placeholders}) RETURNING *`,
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
      `UPDATE modules SET ${setClauses} WHERE id = $1 RETURNING *`,
      values
    );

    return this.deserialize(result.rows[0]);
  }

  static async delete(id) {
    const result = await query('DELETE FROM modules WHERE id = $1 RETURNING *', [id]);
    return this.deserialize(result.rows[0]);
  }

  static async getWithResources(id) {
    const module = await this.findById(id);
    if (!module) return null;

    const resources = await query(
      'SELECT * FROM module_resources WHERE module_id = $1 ORDER BY sequence_order',
      [id]
    );

    module.resources = resources.rows.map(row => ({
      id: row.id,
      resourceType: row.resource_type,
      title: row.title,
      fileUrl: row.file_url,
      externalUrl: row.external_url,
      fileSize: row.file_size,
      mimeType: row.mime_type,
      description: row.description
    }));

    return module;
  }
}

module.exports = Module;
