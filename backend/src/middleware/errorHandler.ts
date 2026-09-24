import { Request, Response, NextFunction } from 'express';
import config from '../config/env';

/**
 * Custom error class for application-specific errors
 */
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

function isPostgresError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    typeof (error as { code?: unknown }).code === 'string' &&
    /^[0-9A-Z]{5}$/.test((error as { code: string }).code)
  );
}

/**
 * Global error handling middleware
 *
 * Security Considerations:
 * - Hides internal error details in production
 * - Logs errors for debugging
 * - Returns consistent error responses
 * - Prevents information leakage
 */
export const errorHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void => {
  let statusCode = 500;
  let message = 'Internal server error';
  let error: string | undefined;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err.name === 'ValidationError') {
    statusCode = 400;
    message = err.message;
    error = 'VALIDATION_ERROR';
  } else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Invalid or expired token';
    error = 'INVALID_TOKEN';
  } else if (err.name === 'MulterError' || /Only JPEG|File too large/i.test(err.message)) {
    statusCode = 400;
    message = err.message;
    error = 'INVALID_UPLOAD';
  } else if (
    (err as { type?: string }).type === 'entity.parse.failed' ||
    (err instanceof SyntaxError && 'body' in err)
  ) {
    statusCode = 400;
    message = 'Malformed JSON body';
    error = 'INVALID_JSON';
  } else if (isPostgresError(err)) {
    // Map common database errors to client-facing statuses instead of 500.
    const mapped: Record<string, { statusCode: number; message: string; error: string }> = {
      '22P02': { statusCode: 400, message: 'Invalid input format', error: 'INVALID_INPUT' },
      '23502': { statusCode: 400, message: 'A required field is missing', error: 'MISSING_FIELD' },
      '23503': {
        statusCode: 409,
        message: 'Referenced record does not exist',
        error: 'FOREIGN_KEY_VIOLATION',
      },
      '23505': {
        statusCode: 409,
        message: 'A record with these details already exists',
        error: 'DUPLICATE_RECORD',
      },
      '23514': {
        statusCode: 400,
        message: 'A value violates a database constraint',
        error: 'CONSTRAINT_VIOLATION',
      },
    };
    const match = mapped[(err as { code?: string }).code ?? ''];
    if (match) {
      statusCode = match.statusCode;
      message = match.message;
      error = match.error;
    }
  }

  if (config.isDevelopment) {
    console.error('Error:', {
      message: err.message,
      stack: err.stack,
      statusCode,
    });
  }

  res.status(statusCode).json({
    success: false,
    message,
    error: error || (config.isDevelopment ? err.message : undefined),
    timestamp: new Date().toISOString(),
    ...(config.isDevelopment && { stack: err.stack }),
  });
};

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (_req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    message: `Route ${_req.originalUrl} not found`,
    error: 'NOT_FOUND',
    timestamp: new Date().toISOString(),
  });
};
