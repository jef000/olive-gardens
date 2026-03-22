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
    console.log('🔄 Starting database migrations...');
    
    const migrationsDir = path.join(__dirname, '../database/migrations');
    const files = fs.readdirSync(migrationsDir).sort();
    
    await client.query('BEGIN');
    
    // Create migrations table to track state if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    for (const file of files) {
      if (!file.endsWith('.sql')) continue;
      
      const { rows } = await client.query('SELECT id FROM migrations WHERE filename = $1', [file]);
      if (rows.length > 0) {
        console.log(`⏩ Skipping ${file} (already executed)`);
        continue;
      }
      
      console.log(`⏳ Executing ${file}...`);
      const migrationPath = path.join(migrationsDir, file);
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
      
      await client.query(migrationSQL);
      await client.query('INSERT INTO migrations (filename) VALUES ($1)', [file]);
      console.log(`✅ Completed ${file}`);
    }
    
    await client.query('COMMIT');
    console.log('✨ All migrations completed successfully!');
    
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
    console.error('Failed to run migrations:', error);
    process.exit(1);
  });
