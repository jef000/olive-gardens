/**
 * Sanitize user input to prevent injection attacks
 * Removes potentially dangerous characters and patterns
 */
export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') return '';

  return input
    .trim()
    .replace(/[<>]/g, '') // Remove HTML tags
    .replace(/[{}]/g, '') // Remove curly braces
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, ''); // Remove event handlers
};

/**
 * Sanitize email address
 */
export const sanitizeEmail = (email: string): string => {
  return email.toLowerCase().trim();
};

/**
 * Validate and sanitize object properties
 */
export const sanitizeObject = <T extends Record<string, unknown>>(obj: T): T => {
  const sanitized = {} as T;

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key as keyof T] = sanitizeInput(value) as T[keyof T];
    } else {
      sanitized[key as keyof T] = value as T[keyof T];
    }
  }

  return sanitized;
};
