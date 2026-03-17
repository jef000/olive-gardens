const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function runNotificationsSchema() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Applying notifications schema...');
    
    const schemaPath = path.join(__dirname, '../database/notifications-schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    await client.query(schemaSql);
    
    console.log('✅ Notifications schema applied successfully');
  } catch (error) {
    console.error('❌ Error applying notifications schema:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
    console.log('🎉 Notifications schema migration finished.');
  }
}

runNotificationsSchema().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
