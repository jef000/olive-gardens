require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'olive_garden',
});

/**
 * Rotate a user's password from the command line.
 *
 * Usage: RESET_EMAIL=user@x.co RESET_PASSWORD='...' node scripts/fix-password.js
 * The password is never hardcoded: unset RESET_PASSWORD generates a random one.
 * When rotating an admin, pass --temporary to force a change on next login.
 */
async function fixPassword() {
  const email = process.env.RESET_EMAIL;
  if (!email) {
    console.error('❌ RESET_EMAIL is required (e.g. RESET_EMAIL=user@example.com).');
    process.exit(1);
  }

  const provided = process.env.RESET_PASSWORD;
  const password = provided && provided.length >= 8 ? provided : crypto.randomBytes(15).toString('base64url');
  const temporary = process.argv.includes('--temporary');

  try {
    const hash = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS || '12', 10));
    const result = await pool.query(
      `UPDATE users
       SET password = $1,
           is_temporary_password = $2,
           must_change_password = $2,
           temp_password_expires_at = CASE WHEN $2 THEN NOW() + INTERVAL '24 hours' ELSE NULL END,
           failed_login_attempts = 0,
           account_locked_until = NULL,
           reset_token = NULL,
           reset_token_expiry = NULL
       WHERE email = $3
       RETURNING id`,
      [hash, temporary, email]
    );

    if (result.rows.length === 0) {
      console.error(`❌ No user found with email ${email}.`);
      process.exitCode = 1;
      return;
    }

    console.log(`✅ Password rotated for ${email}.`);
    console.log(`   password: ${password}`);
    if (!provided) console.log('   (generated once — store it now; it will not be shown again)');
    if (temporary) console.log('   A password change is required on next login.');
  } catch (error) {
    console.error('Error:', error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

fixPassword();
