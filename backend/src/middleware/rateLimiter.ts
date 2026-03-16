import rateLimit from 'express-rate-limit';
import config from '../config/env';

/**
 * General API rate limiter
 * Security: Prevents abuse by limiting requests per IP address
 */
export const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later',
    error: 'RATE_LIMIT_EXCEEDED',
    timestamp: new Date().toISOString(),
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Strict rate limiter for authentication endpoints
 * Security: More restrictive to prevent brute force attacks
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later',
    error: 'AUTH_RATE_LIMIT_EXCEEDED',
    timestamp: new Date().toISOString(),
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});
