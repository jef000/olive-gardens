import { Pool, PoolClient, QueryResult } from 'pg';
import config from '../config/env';

/**
 * PostgreSQL Connection Pool
 * 
 * Security & Performance Considerations:
 * - Uses connection pooling to reuse database connections
 * - Limits max connections to prevent resource exhaustion
 * - Automatically handles connection lifecycle
 * - Provides error handling and logging
 */

const pool = new Pool({
  host: config.database.host,
  port: config.database.port,
  database: config.database.name,
  user: config.database.user,
  password: config.database.password,
  max: config.database.maxConnections,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('connect', () => {
  if (config.isDevelopment) {
    console.log('📊 New database connection established');
  }
});

pool.on('error', (err) => {
  console.error('❌ Unexpected database error:', err);
  process.exit(-1);
});

/**
 * Execute a query with automatic connection management
 */
export const query = async <T = unknown>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<T>> => {
  const start = Date.now();
  
  try {
    const result = await pool.query<T>(text, params);
    
    if (config.isDevelopment) {
      const duration = Date.now() - start;
      console.log('📝 Query executed:', { text, duration: `${duration}ms`, rows: result.rowCount });
    }
    
    return result;
  } catch (error) {
    console.error('❌ Database query error:', error);
    throw error;
  }
};

/**
 * Get a client from the pool for transactions
 */
export const getClient = async (): Promise<PoolClient> => {
  return await pool.connect();
};

/**
 * Test database connection
 */
export const testConnection = async (): Promise<boolean> => {
  try {
    const result = await query('SELECT NOW()');
    console.log('✅ Database connected successfully at:', result.rows[0].now);
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
};

/**
 * Close all connections in the pool
 */
export const closePool = async (): Promise<void> => {
  await pool.end();
  console.log('🔌 Database connection pool closed');
};

export default pool;
