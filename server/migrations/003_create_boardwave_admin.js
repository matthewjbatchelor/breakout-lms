const { query } = require('../config/database');
const bcrypt = require('bcrypt');

async function up() {
  console.log('🔧 Creating boardwaveadmin user...');

  try {
    // Check if this specific admin user already exists
    const userCheck = await query(`
      SELECT * FROM users WHERE username = $1
    `, ['boardwaveadmin']);

    if (userCheck.rows.length > 0) {
      console.log('✓ User "boardwaveadmin" already exists');
      console.log('   Updating password...');

      // Update the password
      const passwordHash = await bcrypt.hash('B04rdwav3admin', 12);
      await query(`
        UPDATE users
        SET password_hash = $1, is_active = true, role = 'admin'
        WHERE username = $2
      `, [passwordHash, 'boardwaveadmin']);

      console.log('✅ Password updated for boardwaveadmin');
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash('B04rdwav3admin', 12);

    // Create boardwave admin user
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
      'boardwaveadmin',
      'admin@boardwave.com',
      passwordHash,
      'admin',
      'Boardwave',
      'Admin',
      true
    ]);

    console.log('✅ Created boardwaveadmin user');
    console.log('   Username: boardwaveadmin');
    console.log('   Email: admin@boardwave.com');
    console.log('   Password: B04rdwav3admin');

  } catch (error) {
    console.error('❌ Error creating boardwaveadmin user:', error);
    throw error;
  }
}

module.exports = { up };
