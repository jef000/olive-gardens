import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import path from 'path';
import config from './config/env';
import { testConnection, closePool } from './db/pool';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimiter';
import { auditContextMiddleware, auditLogMiddleware } from './middleware/audit.middleware';

/**
 * Express Application Setup
 * Production-ready Node.js API with PostgreSQL and comprehensive security
 */

const app: Application = express();

/**
 * Security Middleware
 * 
 * - helmet: Sets secure HTTP headers (XSS, clickjacking, etc.)
 * - cors: Configures Cross-Origin Resource Sharing
 * - Rate limiting: Prevents abuse and DDoS attacks
 */
app.use(
  helmet({
    contentSecurityPolicy: false, // Disabled to allow images to load from local IP
    crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow loading static resources from other origins
  })
);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || config.cors.allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

/**
 * Performance Middleware
 * 
 * - compression: Gzip compression for responses
 * - JSON parsing with size limits to prevent payload attacks
 */
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/**
 * Static Files serving (for local uploads)
 */
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

/**
 * Logging Middleware
 * 
 * - morgan: HTTP request logger
 * - Different formats for development vs production
 */
if (config.isDevelopment) {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

/**
 * Rate Limiting
 * Applied globally to all routes
 */
app.use(apiLimiter);

/**
 * Audit Trail Middleware
 * Tracks all API requests for audit logging
 */
app.use(auditContextMiddleware);
app.use(auditLogMiddleware);

/**
 * API Routes
 */
app.use('/api', routes);

/**
 * Root endpoint
 */
app.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'Olive Garden Gateway API - PostgreSQL Edition',
    version: '1.0.0',
    documentation: '/api/health',
  });
});

/**
 * Error Handling
 * - 404 handler for unknown routes
 * - Global error handler for all errors
 */
app.use(notFoundHandler);
app.use(errorHandler);

/**
 * Database Connection & Server Startup
 */
const startServer = async () => {
  try {
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      console.error('❌ Failed to connect to database. Please check your configuration.');
      process.exit(1);
    }

    app.listen(config.port, () => {
      console.log('🚀 Server running on port', config.port);
      console.log('📝 Environment:', config.env);
      console.log('🔗 API URL: http://localhost:' + config.port + '/api');
      console.log('💾 Database:', config.database.name);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

/**
 * Graceful Shutdown
 * Properly close database connections on shutdown
 */
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await closePool();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await closePool();
  process.exit(0);
});

startServer();

export default app;
