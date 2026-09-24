import { Request, Response, NextFunction } from 'express';
import type { RedisStore } from '../db/redis';
import redisClient from '../db/redis';
import tokenService from '../services/token.service';
import { getCookie } from '../utils/cookies';
import config from '../config/env';

/**
 * Rate limiting configuration per endpoint type
 */
interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests allowed in window
  keyPrefix: string; // Redis key prefix
}

/**
 * Default rate limit configurations
 */
const RATE_LIMITS = {
  // Unauthenticated requests by IP
  UNAUTHENTICATED: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    keyPrefix: 'ratelimit:ip:',
  },
  // Authenticated requests by user ID
  AUTHENTICATED: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 1000,
    keyPrefix: 'ratelimit:user:',
  },
  // Admin users get higher limits
  ADMIN: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 2000,
    keyPrefix: 'ratelimit:admin:',
  },
  // Strict limits for authentication endpoints
  AUTH_ENDPOINT: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    keyPrefix: 'ratelimit:auth:',
  },
};

/**
 * Extract client IP address from request.
 *
 * Forwarding headers are only trusted when TRUST_PROXY is enabled; otherwise a
 * client could rotate X-Forwarded-For to reset its rate-limit bucket. When
 * enabled, Express's req.ip resolves the value using the configured hops.
 */
function getClientIp(req: Request): string {
  if (config.trustProxy) {
    return req.ip || req.socket.remoteAddress || 'unknown';
  }

  return req.socket.remoteAddress || 'unknown';
}

/**
 * Sliding window rate limiter using Redis sorted sets
 *
 * This implementation uses Redis sorted sets where:
 * - Set members are request timestamps
 * - Scores are also the timestamps
 *
 * Algorithm:
 * 1. Remove all entries older than the time window
 * 2. Count remaining entries (requests in window)
 * 3. If under limit, add current request timestamp
 * 4. Set expiry on the key to clean up automatically
 */
async function checkRateLimit(
  redis: RedisStore,
  key: string,
  config: RateLimitConfig
): Promise<{ allowed: boolean; current: number; resetTime: number }> {
  const now = Date.now();
  const windowStart = now - config.windowMs;

  try {
    // Start a pipeline for atomic operations
    const pipeline = redis.pipeline();
    // Unique member per request: identical members collapse in the sorted set,
    // which would undercount bursts that arrive within the same millisecond.
    const member = `${now}-${Math.random().toString(36).slice(2, 10)}`;

    // Remove old entries outside the sliding window
    pipeline.zremrangebyscore(key, 0, windowStart);

    // Count current entries in the window
    pipeline.zcard(key);

    // Add current request timestamp
    pipeline.zadd(key, now, member);

    // Set expiry on the key (window duration + buffer)
    pipeline.expire(key, Math.ceil(config.windowMs / 1000) + 60);

    // Execute pipeline
    const results = await pipeline.exec();

    if (!results) {
      throw new Error('Redis pipeline execution failed');
    }

    // Extract count from results (index 1 is the ZCARD result)
    const countResult = results[1];
    if (countResult[0]) {
      throw countResult[0]; // Error occurred
    }

    const currentCount = (countResult[1] as number) || 0;

    // Calculate reset time (when the oldest request will expire)
    const resetTime = now + config.windowMs;

    // Check if under limit (count before adding current request)
    const allowed = currentCount < config.maxRequests;

    if (!allowed) {
      // If not allowed, remove the request we just added
      await redis.zrem(key, member);
    }

    return {
      allowed,
      current: allowed ? currentCount + 1 : currentCount,
      resetTime,
    };
  } catch (error) {
    console.error('Rate limit check failed:', error);
    // Fail closed: sessions are Redis-backed too, so a Redis outage is already
    // an outage. Allowing unlimited traffic here would be free brute-force.
    return {
      allowed: false,
      current: config.maxRequests,
      resetTime: now + config.windowMs,
    };
  }
}

/**
 * Enhanced rate limiter middleware factory
 *
 * @param options - Optional configuration
 * @param options.isAuthEndpoint - Whether this is an authentication endpoint (stricter limits)
 */
export function enhancedRateLimiter(options: { isAuthEndpoint?: boolean } = {}) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const { isAuthEndpoint = false } = options;

    // Extract identification info
    const clientIp = getClientIp(req);
    let userId = req.user?.userId;
    let userRole = req.user?.role;
    if (!userId) {
      const authHeader = req.headers.authorization;
      const token = authHeader?.startsWith('Bearer ')
        ? authHeader.substring(7)
        : getCookie(req.headers.cookie, 'access_token');
      if (token) {
        try {
          const payload = tokenService.verifyAccessToken(token);
          userId = payload.userId;
          userRole = payload.role;
        } catch {
          // Treat invalid or expired credentials as unauthenticated for limiting.
        }
      }
    }

    let config: RateLimitConfig;
    let rateLimitKey: string;

    // Determine rate limit configuration based on context
    if (isAuthEndpoint) {
      // Strict limits for auth endpoints (by IP)
      config = RATE_LIMITS.AUTH_ENDPOINT;
      rateLimitKey = `${config.keyPrefix}${clientIp}`;
    } else if (userId) {
      // Authenticated user - check by user ID
      if (userRole === 'admin') {
        // Admin users get higher limits
        config = RATE_LIMITS.ADMIN;
        rateLimitKey = `${config.keyPrefix}${userId}`;
      } else {
        // Regular authenticated users
        config = RATE_LIMITS.AUTHENTICATED;
        rateLimitKey = `${config.keyPrefix}${userId}`;
      }
    } else {
      // Unauthenticated - rate limit by IP
      config = RATE_LIMITS.UNAUTHENTICATED;
      rateLimitKey = `${config.keyPrefix}${clientIp}`;
    }

    // Check rate limit
    const result = await checkRateLimit(redisClient, rateLimitKey, config);

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', config.maxRequests.toString());
    res.setHeader(
      'X-RateLimit-Remaining',
      Math.max(0, config.maxRequests - result.current).toString()
    );
    res.setHeader('X-RateLimit-Reset', result.resetTime.toString());

    if (!result.allowed) {
      // Calculate Retry-After in seconds
      const retryAfterSeconds = Math.ceil((result.resetTime - Date.now()) / 1000);

      res.setHeader('Retry-After', retryAfterSeconds.toString());

      res.status(429).json({
        error: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please try again later.',
        retryAfter: retryAfterSeconds,
        limit: config.maxRequests,
        windowMs: config.windowMs,
      });
      return;
    }

    // Request allowed, proceed
    next();
  };
}

/**
 * Convenience middleware for standard endpoints
 */
export const standardRateLimiter = enhancedRateLimiter({ isAuthEndpoint: false });

/**
 * Convenience middleware for authentication endpoints
 */
export const authRateLimiter = enhancedRateLimiter({ isAuthEndpoint: true });

export default enhancedRateLimiter;
