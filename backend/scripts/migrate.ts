import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import config from '../src/config/env';

const pool = new Pool({
  host: config.database.host,
  port: config.database.port,
  database: config.database.name,
  user: config.database.user,
  password: config.database.password,
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Starting database migration...');
    
    const migrationPath = path.join(__dirname, '../database/migrations/001_add_temporary_password_fields.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    await client.query('BEGIN');
    await client.query(migrationSQL);
    await client.query('COMMIT');
    
    console.log('✅ Migration completed successfully!');
    console.log('📋 Added columns:');
    console.log('   - is_temporary_password');
    console.log('   - temp_password_expires_at');
    console.log('   - must_change_password');
    console.log('   - password_changed_at');
    console.log('   - failed_login_attempts');
    console.log('   - account_locked_until');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration()
  .then(() => {
    console.log('✨ Database is ready!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed to run migration:', error);
    process.exit(1);
  });
