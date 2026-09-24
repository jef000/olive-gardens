import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { query, getClient } from '../src/db/pool';
import { PoolClient } from 'pg';

/**
 * Migration runner script
 * Reads and executes SQL migration files in order
 */

interface MigrationFile {
  filename: string;
  number: number;
  path: string;
}

const MIGRATIONS_DIR = join(__dirname, '../database/migrations');

/**
 * Create migrations tracking table if it doesn't exist
 */
async function ensureMigrationsTable(): Promise<void> {
  await query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) NOT NULL UNIQUE,
      executed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('✅ Migrations tracking table ready');
}

/**
 * Get list of already executed migrations
 */
async function getExecutedMigrations(): Promise<string[]> {
  const result = await query<{ filename: string }>(
    'SELECT filename FROM migrations ORDER BY id'
  );
  return result.rows.map(row => row.filename);
}

/**
 * Get all migration files sorted by number
 */
async function getMigrationFiles(): Promise<MigrationFile[]> {
  const files = await readdir(MIGRATIONS_DIR);
  
  const migrations = files
    .filter(file => file.endsWith('.sql'))
    .map(file => {
      // Extract number from filename (e.g., "001_add_columns.sql" -> 1)
      const match = file.match(/^(\d+)_/);
      const number = match ? parseInt(match[1], 10) : 0;
      
      return {
        filename: file,
        number,
        path: join(MIGRATIONS_DIR, file),
      };
    })
    .sort((a, b) => a.number - b.number);
  
  return migrations;
}

/**
 * Execute a single migration file
 */
async function executeMigration(
  client: PoolClient,
  migration: MigrationFile
): Promise<void> {
  console.log(`\n📝 Running migration: ${migration.filename}`);
  
  try {
    // Read migration file
    const sql = await readFile(migration.path, 'utf-8');
    
    // Execute migration SQL
    await client.query(sql);
    
    // Record migration as executed
    await client.query(
      'INSERT INTO migrations (filename) VALUES ($1)',
      [migration.filename]
    );
    
    console.log(`✅ Migration completed: ${migration.filename}`);
  } catch (error) {
    console.error(`❌ Migration failed: ${migration.filename}`);
    throw error;
  }
}

/**
 * Run all pending migrations
 */
async function runMigrations(): Promise<void> {
  console.log('🚀 Starting migration runner...\n');
  
  try {
    // Ensure migrations table exists
    await ensureMigrationsTable();
    
    // Get executed and available migrations
    const executed = await getExecutedMigrations();
    const available = await getMigrationFiles();
    
    // Filter pending migrations
    const pending = available.filter(m => !executed.includes(m.filename));
    
    if (pending.length === 0) {
      console.log('✅ No pending migrations. Database is up to date.');
      return;
    }
    
    console.log(`📋 Found ${pending.length} pending migration(s):\n`);
    pending.forEach(m => console.log(`   - ${m.filename}`));
    
    // Execute each pending migration in a transaction
    const client = await getClient();
    
    try {
      // Prevent two deploy processes from applying the same migration concurrently.
      await client.query('SELECT pg_advisory_lock($1)', [4815162342]);
      await client.query('BEGIN');
      
      for (const migration of pending) {
        await executeMigration(client, migration);
      }
      
      await client.query('COMMIT');
      console.log('\n✅ All migrations completed successfully!');
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('\n❌ Migration failed. All changes rolled back.');
      throw error;
    } finally {
      await client.query('SELECT pg_advisory_unlock($1)', [4815162342]).catch(() => undefined);
      client.release();
    }
  } catch (error) {
    console.error('\n❌ Migration runner error:', error);
    process.exit(1);
  }
}

// Run migrations if executed directly
if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log('\n🎉 Migration process completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Migration process failed:', error);
      process.exit(1);
    });
}

export { runMigrations };
