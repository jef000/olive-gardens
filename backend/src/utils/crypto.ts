import crypto from 'crypto';
import config from '../config/env';

/**
 * Generate secure random token for password reset
 * Security: Uses crypto.randomBytes for cryptographically secure random values
 */
export const generateResetToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Hash reset token before storing in database.
 * HMAC-SHA256 is deterministic (so the stored value can be compared) and keyed
 * with the server secret, so a database leak alone cannot derive tokens.
 */
export const hashResetToken = async (token: string): Promise<string> => {
  return crypto.createHmac('sha256', config.jwt.secret).update(token).digest('hex');
};

/**
 * Calculate reset token expiry timestamp
 */
export const getResetTokenExpiry = (): Date => {
  const expiry = new Date();
  expiry.setTime(expiry.getTime() + config.resetToken.expiry);
  return expiry;
};
