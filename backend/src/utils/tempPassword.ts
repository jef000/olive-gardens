import crypto from 'crypto';

/**
 * Temporary Password Utility Functions
 * 
 * Security Considerations:
 * - Generates cryptographically secure random passwords
 * - Configurable expiration time
 * - Prevents predictable password patterns
 */

/**
 * Generate a secure temporary password
 * Format: 3 words + 2 digits + 1 special char for memorability and security
 * Example: Correct-Horse-Battery-42!
 */
export const generateTemporaryPassword = (): string => {
  // Generate a random password with high entropy
  const length = 16;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  const values = crypto.randomBytes(length);
  
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset[values[i] % charset.length];
  }
  
  // Ensure password meets complexity requirements
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*]/.test(password);
  
  if (!hasUpper || !hasLower || !hasNumber || !hasSpecial) {
    // Recursively generate until we get a valid password
    return generateTemporaryPassword();
  }
  
  return password;
};

/**
 * Calculate temporary password expiration timestamp
 * Default: 24 hours from now
 */
export const getTempPasswordExpiry = (hoursFromNow: number = 24): Date => {
  const expiry = new Date();
  expiry.setTime(expiry.getTime() + (hoursFromNow * 60 * 60 * 1000));
  return expiry;
};

/**
 * Check if temporary password has expired
 */
export const isTempPasswordExpired = (expiryDate: Date | null): boolean => {
  if (!expiryDate) return false;
  return new Date() > new Date(expiryDate);
};

/**
 * Check if account is locked due to failed login attempts
 */
export const isAccountLocked = (lockedUntil: Date | null): boolean => {
  if (!lockedUntil) return false;
  return new Date() < new Date(lockedUntil);
};

/**
 * Calculate account lock duration based on failed attempts
 * Progressive lockout: more attempts = longer lock
 */
export const getAccountLockDuration = (failedAttempts: number): Date | null => {
  const MAX_ATTEMPTS = 5;
  
  if (failedAttempts < MAX_ATTEMPTS) {
    return null;
  }
  
  // Lock for 15 minutes after 5 attempts, doubles for each additional attempt
  const baseMinutes = 15;
  const multiplier = Math.pow(2, failedAttempts - MAX_ATTEMPTS);
  const lockMinutes = Math.min(baseMinutes * multiplier, 1440); // Max 24 hours
  
  const lockUntil = new Date();
  lockUntil.setTime(lockUntil.getTime() + (lockMinutes * 60 * 1000));
  
  return lockUntil;
};
