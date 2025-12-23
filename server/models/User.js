const { query } = require('../config/database');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 12;

class User {
  // Serialize camelCase → snake_case for database
  static serialize(data) {
    const serialized = {};

    if (data.username !== undefined) serialized.username = data.username;
    if (data.email !== undefined) serialized.email = data.email;
    if (data.passwordHash !== undefined) serialized.password_hash = data.passwordHash;
    if (data.role !== undefined) serialized.role = data.role;
    if (data.firstName !== undefined) serialized.first_name = data.firstName;
    if (data.lastName !== undefined) serialized.last_name = data.lastName;
    if (data.avatarUrl !== undefined) serialized.avatar_url = data.avatarUrl;
    if (data.isActive !== undefined) serialized.is_active = data.isActive;

    return serialized;
  }

  // Deserialize snake_case → camelCase for JavaScript
  static deserialize(row) {
    if (!row) return null;

    return {
      id: row.id,
      username: row.username,
      email: row.email,
      role: row.role,
      firstName: row.first_name,
      lastName: row.last_name,
      avatarUrl: row.avatar_url,
      isActive: row.is_active,
      createdAt: row.created_at,
      lastLogin: row.last_login
      // Note: password_hash is intentionally excluded from deserialization
    };
  }

  // Find user by ID
  static async findById(id) {
    const result = await query('SELECT * FROM users WHERE id = $1', [id]);
    return this.deserialize(result.rows[0]);
  }

  // Find user by username (for login)
  static async findByUsername(username) {
    const result = await query('SELECT * FROM users WHERE username = $1', [username]);
    return result.rows[0] || null;
  }

  // Find user by email
  static async findByEmail(email) {
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    return this.deserialize(result.rows[0]);
  }

  // Find users by role
  static async findByRole(role) {
    const result = await query('SELECT * FROM users WHERE role = $1 ORDER BY created_at DESC', [role]);
    return result.rows.map(row => this.deserialize(row));
  }

  // Get all users
  static async findAll() {
    const result = await query('SELECT * FROM users ORDER BY created_at DESC');
    return result.rows.map(row => this.deserialize(row));
  }

  // Create new user
  static async create(data) {
    // Hash password if provided
    let passwordHash = data.passwordHash;
    if (data.password) {
      passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);
    }

    const userData = {
      ...data,
      passwordHash
    };

    const serialized = this.serialize(userData);

    const columns = Object.keys(serialized).join(', ');
    const placeholders = Object.keys(serialized).map((_, i) => `$${i + 1}`).join(', ');
    const values = Object.values(serialized);

    const result = await query(
      `INSERT INTO users (${columns}) VALUES (${placeholders}) RETURNING *`,
      values
    );

    return this.deserialize(result.rows[0]);
  }

  // Update user
  static async update(id, data) {
    // Hash password if being updated
    if (data.password) {
      data.passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);
      delete data.password;
    }

    const serialized = this.serialize(data);
    serialized.updated_at = new Date();

    const setClauses = Object.keys(serialized)
      .map((key, i) => `${key} = $${i + 2}`)
      .join(', ');
    const values = [id, ...Object.values(serialized)];

    const result = await query(
      `UPDATE users SET ${setClauses} WHERE id = $1 RETURNING *`,
      values
    );

    return this.deserialize(result.rows[0]);
  }

  // Delete user
  static async delete(id) {
    const result = await query('DELETE FROM users WHERE id = $1 RETURNING *', [id]);
    return this.deserialize(result.rows[0]);
  }

  // Verify password
  static async verifyPassword(plainPassword, passwordHash) {
    return await bcrypt.compare(plainPassword, passwordHash);
  }

  // Update last login timestamp
  static async updateLastLogin(id) {
    await query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [id]);
  }

  // Set avatar URL
  static async setAvatar(id, avatarUrl) {
    const result = await query(
      'UPDATE users SET avatar_url = $1 WHERE id = $2 RETURNING *',
      [avatarUrl, id]
    );
    return this.deserialize(result.rows[0]);
  }

  // Activate/deactivate user
  static async setActive(id, isActive) {
    const result = await query(
      'UPDATE users SET is_active = $1 WHERE id = $2 RETURNING *',
      [isActive, id]
    );
    return this.deserialize(result.rows[0]);
  }

  // Get user count by role
  static async countByRole() {
    const result = await query(`
      SELECT role, COUNT(*) as count
      FROM users
      GROUP BY role
      ORDER BY role
    `);
    return result.rows.reduce((acc, row) => {
      acc[row.role] = parseInt(row.count);
      return acc;
    }, {});
  }

  // Search users
  static async search(searchTerm) {
    const result = await query(`
      SELECT * FROM users
      WHERE
        username ILIKE $1 OR
        email ILIKE $1 OR
        first_name ILIKE $1 OR
        last_name ILIKE $1
      ORDER BY created_at DESC
    `, [`%${searchTerm}%`]);
    return result.rows.map(row => this.deserialize(row));
  }
}

module.exports = User;
