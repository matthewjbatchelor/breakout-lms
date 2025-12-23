const { query } = require('../config/database');
const bcrypt = require('bcrypt');

async function up() {
  console.log('Seeding initial data...');

  try {
    // Check if admin user already exists
    const adminCheck = await query(`
      SELECT EXISTS (
        SELECT FROM users WHERE role = 'admin' LIMIT 1
      );
    `);

    if (adminCheck.rows[0].exists) {
      console.log('✓ Admin user already exists, skipping seed');
      return;
    }

    // Get admin credentials from environment variables
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'changeme123';
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';

    // Hash password
    const passwordHash = await bcrypt.hash(adminPassword, 12);

    // Create default admin user
    await query(`
      INSERT INTO users (
        username,
        email,
        password_hash,
        role,
        first_name,
        last_name,
        is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      adminUsername,
      adminEmail,
      passwordHash,
      'admin',
      'System',
      'Administrator',
      true
    ]);

    console.log('✅ Created default admin user');
    console.log(`   Username: ${adminUsername}`);
    console.log(`   Email: ${adminEmail}`);
    console.log('   ⚠️  Please change the admin password after first login!');

  } catch (error) {
    console.error('❌ Error seeding initial data:', error);
    throw error;
  }
}

module.exports = { up };
