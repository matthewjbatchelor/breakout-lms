const { query } = require('../config/database');

class Progress {
  static serialize(data) {
    const serialized = {};

    if (data.userId !== undefined) serialized.user_id = data.userId;
    if (data.moduleId !== undefined) serialized.module_id = data.moduleId;
    if (data.status !== undefined) serialized.status = data.status;
    if (data.startedAt !== undefined) serialized.started_at = data.startedAt;
    if (data.completedAt !== undefined) serialized.completed_at = data.completedAt;
    if (data.timeSpentMinutes !== undefined) serialized.time_spent_minutes = data.timeSpentMinutes;
    if (data.lastAccessedAt !== undefined) serialized.last_accessed_at = data.lastAccessedAt;

    return serialized;
  }

  static deserialize(row) {
    if (!row) return null;

    return {
      id: row.id,
      userId: row.user_id,
      moduleId: row.module_id,
      status: row.status,
      startedAt: row.started_at,
      completedAt: row.completed_at,
      timeSpentMinutes: row.time_spent_minutes,
      lastAccessedAt: row.last_accessed_at
    };
  }

  static async findById(id) {
    const result = await query('SELECT * FROM progress_tracking WHERE id = $1', [id]);
    return this.deserialize(result.rows[0]);
  }

  static async findByUser(userId) {
    const result = await query(
      'SELECT * FROM progress_tracking WHERE user_id = $1 ORDER BY last_accessed_at DESC',
      [userId]
    );
    return result.rows.map(row => this.deserialize(row));
  }

  static async findByUserAndModule(userId, moduleId) {
    const result = await query(
      'SELECT * FROM progress_tracking WHERE user_id = $1 AND module_id = $2',
      [userId, moduleId]
    );
    return this.deserialize(result.rows[0]);
  }

  static async create(data) {
    const serialized = this.serialize(data);

    const columns = Object.keys(serialized).join(', ');
    const placeholders = Object.keys(serialized).map((_, i) => `$${i + 1}`).join(', ');
    const values = Object.values(serialized);

    const result = await query(
      `INSERT INTO progress_tracking (${columns}) VALUES (${placeholders}) RETURNING *`,
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
      `UPDATE progress_tracking SET ${setClauses} WHERE id = $1 RETURNING *`,
      values
    );

    return this.deserialize(result.rows[0]);
  }

  static async upsert(userId, moduleId, data) {
    const existing = await this.findByUserAndModule(userId, moduleId);

    if (existing) {
      return this.update(existing.id, data);
    } else {
      return this.create({ userId, moduleId, ...data });
    }
  }

  static async markModuleStarted(userId, moduleId) {
    return this.upsert(userId, moduleId, {
      status: 'in_progress',
      startedAt: new Date(),
      lastAccessedAt: new Date()
    });
  }

  static async markModuleCompleted(userId, moduleId) {
    return this.upsert(userId, moduleId, {
      status: 'completed',
      completedAt: new Date(),
      lastAccessedAt: new Date()
    });
  }

  static async getUserProgressSummary(userId) {
    const result = await query(`
      SELECT
        COUNT(*) as total_modules,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_modules,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_modules,
        SUM(time_spent_minutes) as total_time_spent
      FROM progress_tracking
      WHERE user_id = $1
    `, [userId]);

    const row = result.rows[0];
    return {
      totalModules: parseInt(row.total_modules) || 0,
      completedModules: parseInt(row.completed_modules) || 0,
      inProgressModules: parseInt(row.in_progress_modules) || 0,
      totalTimeSpent: parseInt(row.total_time_spent) || 0
    };
  }
}

module.exports = Progress;
