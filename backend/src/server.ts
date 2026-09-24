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
import { standardRateLimiter } from './middleware/enhancedRateLimiter';
import { auditContextMiddleware, auditLogMiddleware } from './middleware/audit.middleware';
import { securityHeaders } from './middleware/securityHeaders';
import csrfMiddleware from './middleware/csrf.middleware';
import { cspDirectives } from './config/csp';
import inquiryReplyService from './services/inquiryReply.service';

/**
 * Express Application Setup
 * Production-ready Node.js API with PostgreSQL and comprehensive security
 */

const app: Application = express();

// Only honor X-Forwarded-For when a trusted proxy is configured; otherwise the
// rate limiter and audit log key on the socket address (anti-spoofing).
app.set('trust proxy', config.trustProxy);

/**
 * Security Middleware
 * 
 * - helmet: Sets secure HTTP headers (XSS, clickjacking, etc.)
 * - cors: Configures Cross-Origin Resource Sharing
 * - Rate limiting: Prevents abuse and DDoS attacks
 */
app.use(
  helmet({
    contentSecurityPolicy: { directives: cspDirectives },
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);
app.use(securityHeaders);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      const allowedOrigins = [
        ...config.cors.allowedOrigins,
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:8080',
      ];
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`CORS blocked origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
    exposedHeaders: ['X-CSRF-Token'],
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
 * Securely serve processed gallery files through an explicit endpoint. The
 * storage directory is not exposed as a static web root.
 */
const secureUploadDir = path.join(__dirname, '../uploads/secure');
app.get('/uploads/secure/:filename', (req, res, next) => {
  const filename = path.basename(req.params.filename);
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  res.sendFile(filename, { root: secureUploadDir }, (error) => {
    if (error) next(error);
  });
});

/**
 * Static files serving for legacy/public uploads.
 */
app.use('/uploads', express.static(path.join(__dirname, '../uploads/public'), {
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  },
}));

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

// CSRF tokens are issued for safe requests and checked for state changes.
app.use(csrfMiddleware);

/**
 * Rate Limiting
 * Applied globally to all routes
 */
app.use(standardRateLimiter);

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

app.post('/api/csp-report', (_req, res) => {
  res.status(204).end();
});

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

    // Re-attempt replies that were queued when the process last stopped.
    void inquiryReplyService
      .recoverQueued()
      .then((count) => {
        if (count > 0) console.log(`🔁 Re-queued ${count} pending inquiry ${count === 1 ? 'reply' : 'replies'}`);
      })
      .catch((error) => console.error('❌ Failed to recover queued inquiry replies:', error));
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
