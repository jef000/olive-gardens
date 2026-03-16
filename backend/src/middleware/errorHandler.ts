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
