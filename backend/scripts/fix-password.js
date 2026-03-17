require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'olive_garden',
});

async function fixPassword() {
  try {
    const password = 'Admin123!';
    const hash = await bcrypt.hash(password, 12);
    console.log('New hash for Admin123!:', hash);
    
    await pool.query('UPDATE users SET password = $1 WHERE email = $2', [hash, 'admin@olivegarden.com']);
    console.log('Password updated successfully.');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

fixPassword();
