const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'olive_garden',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function runAuditMigration() {
  const client = await pool.connect();

  try {
    console.log('🔄 Applying audit schema...');

    const schemaPath = path.join(__dirname, '..', 'database', 'audit-schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, { encoding: 'utf8' });

    await client.query(schemaSql);

    console.log('✅ Audit schema applied successfully.');
  } catch (error) {
    console.error('❌ Failed to apply audit schema:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runAuditMigration()
  .then(() => {
    console.log('\n🎉 Audit schema migration finished.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Audit schema migration error:', error);
    process.exit(1);
  });
