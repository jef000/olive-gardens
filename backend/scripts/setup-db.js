const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcrypt');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'olive_garden',
});

async function setupDatabase() {
  const client = await pool.connect();

  try {
    console.log('🔄 Setting up database...');

    // Apply every schema artifact in dependency order. Previously only
    // schema.sql (users) ran, so bookings/gallery/notifications/audit queries
    // failed on a fresh database and migration 008 rolled the whole batch back.
    const schemaFiles = [
      'schema.sql',
      'extended-schema.sql',
      'notifications-schema.sql',
      'audit-schema.sql',
    ];

    for (const file of schemaFiles) {
      const schemaPath = path.join(__dirname, '..', 'database', file);
      if (!fs.existsSync(schemaPath)) {
        console.warn(`⚠️  ${file} not found, skipping.`);
        continue;
      }

      const schema = fs.readFileSync(schemaPath, 'utf8').replace(/--.*$/gm, '').trim();
      if (!schema) continue;

      await client.query('BEGIN');
      try {
        await client.query(schema);
        await client.query('COMMIT');
        console.log(`   ✓ ${file}`);
      } catch (error) {
        await client.query('ROLLBACK');
        throw new Error(`${file}: ${error.message}`);
      }
    }

    console.log('✅ Database setup complete!');

    // First admin bootstrap. No credential is committed to the repository:
    // use ADMIN_PASSWORD if provided, otherwise generate a random one and print
    // it exactly once. The account must change it on first login.
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@olivegarden.com';
    const existing = await client.query('SELECT id FROM users WHERE email = $1', [adminEmail]);

    if (existing.rows.length > 0) {
      console.log(`👤 Admin ${adminEmail} already exists — leaving credentials untouched.`);
    } else {
      const providedPassword = process.env.ADMIN_PASSWORD;
      const generatedPassword = providedPassword && providedPassword.length >= 8
        ? providedPassword
        : crypto.randomBytes(15).toString('base64url');
      const hash = await bcrypt.hash(generatedPassword, parseInt(process.env.BCRYPT_ROUNDS || '12', 10));

      await client.query(
        `INSERT INTO users (email, password, role, is_temporary_password, must_change_password, temp_password_expires_at)
         VALUES ($1, $2, 'admin', TRUE, TRUE, NOW() + INTERVAL '24 hours')`,
        [adminEmail, hash]
      );

      console.log('👤 First admin created (must change password on first login):');
      console.log(`   email:    ${adminEmail}`);
      console.log(`   password: ${generatedPassword}`);
      if (!providedPassword) {
        console.log('   (generated once — store it now; it will not be shown again)');
      }
    }
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

setupDatabase();
