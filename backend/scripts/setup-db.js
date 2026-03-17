const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

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
    
    // Read schema file
    const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Execute the entire schema as one transaction
    await client.query('BEGIN');
    
    // Remove comments
    const cleanSchema = schema
      .replace(/--.*$/gm, '')
      .trim();
    
    // Execute as raw SQL
    await client.query(cleanSchema);
    
    await client.query('COMMIT');
    
    console.log('✅ Database setup complete!');
    console.log('👤 Admin user created: admin@olivegarden.com / Admin123!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Database setup failed:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

setupDatabase();
