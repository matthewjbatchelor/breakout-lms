const { query } = require('../config/database');

class ModuleResource {
  static serialize(data) {
    const serialized = {};

    if (data.moduleId !== undefined) serialized.module_id = data.moduleId;
    if (data.resourceType !== undefined) serialized.resource_type = data.resourceType;
    if (data.title !== undefined) serialized.title = data.title;
    if (data.fileUrl !== undefined) serialized.file_url = data.fileUrl;
    if (data.externalUrl !== undefined) serialized.external_url = data.externalUrl;
    if (data.fileSize !== undefined) serialized.file_size = data.fileSize;
    if (data.mimeType !== undefined) serialized.mime_type = data.mimeType;
    if (data.description !== undefined) serialized.description = data.description;
    if (data.sequenceOrder !== undefined) serialized.sequence_order = data.sequenceOrder;

    return serialized;
  }

  static deserialize(row) {
    if (!row) return null;

    return {
      id: row.id,
      moduleId: row.module_id,
      resourceType: row.resource_type,
      title: row.title,
      fileUrl: row.file_url,
      externalUrl: row.external_url,
      fileSize: row.file_size,
      mimeType: row.mime_type,
      description: row.description,
      sequenceOrder: row.sequence_order,
      createdAt: row.created_at
    };
  }

  static async findById(id) {
    const result = await query('SELECT * FROM module_resources WHERE id = $1', [id]);
    return this.deserialize(result.rows[0]);
  }

  static async findByModule(moduleId) {
    const result = await query(
      'SELECT * FROM module_resources WHERE module_id = $1 ORDER BY sequence_order',
      [moduleId]
    );
    return result.rows.map(row => this.deserialize(row));
  }

  static async create(data) {
    const serialized = this.serialize(data);

    const columns = Object.keys(serialized).join(', ');
    const placeholders = Object.keys(serialized).map((_, i) => `$${i + 1}`).join(', ');
    const values = Object.values(serialized);

    const result = await query(
      `INSERT INTO module_resources (${columns}) VALUES (${placeholders}) RETURNING *`,
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
      `UPDATE module_resources SET ${setClauses} WHERE id = $1 RETURNING *`,
      values
    );

    return this.deserialize(result.rows[0]);
  }

  static async delete(id) {
    const result = await query('DELETE FROM module_resources WHERE id = $1 RETURNING *', [id]);
    return this.deserialize(result.rows[0]);
  }
}

module.exports = ModuleResource;
