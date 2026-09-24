import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';
import config from '../config/env';
import redisClient from '../db/redis';

/**
 * JWT Payload structure
 */
export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  /**
   * Set while the account still uses an admin-issued temporary password. The
   * authenticate middleware refuses every route except the change-password
   * allow-list so the flag cannot be ignored client-side.
   */
  mustChangePassword?: boolean;
}

/**
 * Token pair returned to client
 */
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/**
 * Token Service
 * Handles JWT generation, validation, and refresh token management
 */
export class TokenService {
  private readonly ACCESS_TOKEN_EXPIRY = '15m';
  private readonly REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60; // 7 days in seconds
  private readonly REFRESH_TOKEN_PREFIX = 'refresh:';
  private readonly MFA_CHALLENGE_EXPIRY = '5m';

  /**
   * Generate access and refresh token pair
   */
  async generateTokenPair(payload: JwtPayload): Promise<TokenPair> {
    // Generate access token (short-lived JWT)
    const accessToken = jwt.sign(payload, config.jwt.secret as string, {
      expiresIn: this.ACCESS_TOKEN_EXPIRY,
      issuer: 'olive-garden-api',
      audience: 'olive-garden-client',
    });

    // Generate refresh token (long-lived, cryptographically random)
    const refreshToken = randomBytes(32).toString('hex');

    // Store refresh token in Redis with expiry
    const key = `${this.REFRESH_TOKEN_PREFIX}${refreshToken}`;

    await redisClient.setex(
      key,
      this.REFRESH_TOKEN_EXPIRY,
      JSON.stringify({
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
        createdAt: new Date().toISOString(),
      })
    );

    return { accessToken, refreshToken };
  }

  createMFAChallenge(userId: string): string {
    return jwt.sign({ userId, purpose: 'mfa-challenge' }, config.jwt.secret as string, {
      expiresIn: this.MFA_CHALLENGE_EXPIRY,
      issuer: 'olive-garden-api',
      audience: 'olive-garden-mfa',
    });
  }

  verifyMFAChallenge(token: string): string | null {
    try {
      const payload = jwt.verify(token, config.jwt.secret as string, {
        issuer: 'olive-garden-api',
        audience: 'olive-garden-mfa',
      }) as { userId?: string; purpose?: string };
      return payload.purpose === 'mfa-challenge' && payload.userId ? payload.userId : null;
    } catch {
      return null;
    }
  }

  /**
   * Verify and decode access token
   */
  verifyAccessToken(token: string): JwtPayload {
    try {
      const decoded = jwt.verify(token, config.jwt.secret as string, {
        issuer: 'olive-garden-api',
        audience: 'olive-garden-client',
      });

      return decoded as JwtPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Access token expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid access token');
      }
      throw new Error('Token verification failed');
    }
  }

  /**
   * Validate refresh token and return payload
   */
  async validateRefreshToken(refreshToken: string): Promise<JwtPayload | null> {
    const key = `${this.REFRESH_TOKEN_PREFIX}${refreshToken}`;
    const data = await redisClient.get(key);

    if (!data) {
      return null; // Token not found or expired
    }

    try {
      const payload = JSON.parse(data);
      return {
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
      };
    } catch (error) {
      console.error('Error parsing refresh token payload:', error);
      return null;
    }
  }

  /**
   * Rotate refresh token (invalidate old, issue new pair).
   * The DEL doubles as an atomic claim: exactly one caller can remove a given
   * token, so a replayed/stolen token cannot mint a second chain.
   * Returns null when the token was already consumed.
   */
  async rotateRefreshToken(
    oldRefreshToken: string,
    payload: JwtPayload
  ): Promise<TokenPair | null> {
    const oldKey = `${this.REFRESH_TOKEN_PREFIX}${oldRefreshToken}`;
    const removed = await redisClient.del(oldKey);

    if (removed === 0) {
      return null;
    }

    return this.generateTokenPair(payload);
  }

  /**
   * Revoke refresh token (logout)
   */
  async revokeRefreshToken(refreshToken: string): Promise<void> {
    const key = `${this.REFRESH_TOKEN_PREFIX}${refreshToken}`;
    await redisClient.del(key);
  }

  /**
   * Revoke all refresh tokens for user
   */
  async revokeAllUserTokens(userId: string): Promise<void> {
    try {
      // Get all refresh token keys
      const pattern = `${this.REFRESH_TOKEN_PREFIX}*`;
      const keys = await redisClient.keys(pattern);

      // Check each token and delete if belongs to user
      for (const key of keys) {
        const data = await redisClient.get(key);
        if (data) {
          try {
            const payload = JSON.parse(data);
            if (payload.userId === userId) {
              await redisClient.del(key);
            }
          } catch (error) {
            console.error('Error parsing token data:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error revoking all user tokens:', error);
      throw error;
    }
  }
}

export default new TokenService();
