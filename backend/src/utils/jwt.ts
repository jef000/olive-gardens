import jwt from 'jsonwebtoken';
import config from '../config/env';

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

/**
 * Generate JWT access token
 * Security: Short-lived token for API authentication
 */
export const generateToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiry,
    issuer: 'olive-garden-api',
    audience: 'olive-garden-client',
  });
};

/**
 * Verify and decode JWT token
 * Security: Validates signature, expiry, issuer, and audience
 */
export const verifyToken = (token: string): JwtPayload => {
  try {
    return jwt.verify(token, config.jwt.secret, {
      issuer: 'olive-garden-api',
      audience: 'olive-garden-client',
    }) as JwtPayload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};
