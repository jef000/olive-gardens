import { randomBytes, createHmac, timingSafeEqual } from 'crypto';
import config from '../config/env';
import redisClient from '../db/redis';

/**
 * CSRF Service
 * Handles CSRF token generation, validation, and invalidation
 */
export class CSRFService {
  private readonly CSRF_PREFIX = 'csrf:';
  private readonly TOKEN_EXPIRY = 60 * 60; // 1 hour in seconds

  /**
   * Generate CSRF token for session
   */
  async generateToken(sessionId: string): Promise<string> {
    // Generate cryptographically random token (32 bytes = 64 hex chars)
    const token = randomBytes(32).toString('hex');

    // Store token in Redis associated with session
    const key = `${this.CSRF_PREFIX}${sessionId}`;
    await redisClient.setex(key, this.TOKEN_EXPIRY, token);

    return token;
  }

  /**
   * Read the current token for a session, if any
   */
  async getToken(sessionId: string): Promise<string | null> {
    return redisClient.get(`${this.CSRF_PREFIX}${sessionId}`);
  }

  /**
   * Validate CSRF token for session
   */
  async validateToken(sessionId: string, token: string): Promise<boolean> {
    const key = `${this.CSRF_PREFIX}${sessionId}`;
    const storedToken = await redisClient.get(key);

    if (!storedToken) {
      return false; // No token found or expired
    }

    // Constant-time comparison to prevent timing attacks
    return timingSafeTokenEqual(token, storedToken);
  }

  /**
   * Invalidate CSRF token (on logout)
   */
  async invalidateToken(sessionId: string): Promise<void> {
    const key = `${this.CSRF_PREFIX}${sessionId}`;
    await redisClient.del(key);
  }

  /**
   * Timing-safe string comparison using HMAC
   * Prevents timing attacks by ensuring comparison takes constant time
   */
}

/** Compare arbitrary token strings without leaking their contents by timing. */
export function timingSafeTokenEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  const hmacA = createHmac('sha256', config.jwt.secret as string)
    .update(bufA)
    .digest();
  const hmacB = createHmac('sha256', config.jwt.secret as string)
    .update(bufB)
    .digest();
  return timingSafeEqual(hmacA, hmacB) && a.length === b.length;
}

export default new CSRFService();
