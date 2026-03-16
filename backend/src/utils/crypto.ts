import crypto from 'crypto';
import { hashPassword } from './password';

/**
 * Generate secure random token for password reset
 * Security: Uses crypto.randomBytes for cryptographically secure random values
 */
export const generateResetToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Hash reset token before storing in database
 * Security: Never store plain tokens in database
 */
export const hashResetToken = async (token: string): Promise<string> => {
  return hashPassword(token);
};

/**
 * Calculate reset token expiry timestamp
 */
export const getResetTokenExpiry = (): Date => {
  const expiry = new Date();
  expiry.setTime(expiry.getTime() + config.resetToken.expiry);
  return expiry;
};

import config from '../config/env';
