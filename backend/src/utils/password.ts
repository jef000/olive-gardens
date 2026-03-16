import bcrypt from 'bcrypt';
import config from '../config/env';

/**
 * Hash password using bcrypt
 * Security: Uses configurable salt rounds for security vs performance balance
 */
export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, config.bcrypt.rounds);
};

/**
 * Compare plain text password with hashed password
 * Security: Constant-time comparison to prevent timing attacks
 */
export const comparePassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};
