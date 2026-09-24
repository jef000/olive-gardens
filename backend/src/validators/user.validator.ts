import { z } from 'zod';

/**
 * Validation schemas for user management endpoints
 * Security: Input validation and sanitization
 */

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

export const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['user', 'admin', 'moderator']).optional(),
  expiryHours: z.coerce.number().int().min(1).max(168).optional(), // Max 7 days
});

export const updateUserSchema = z.object({
  email: z.string().email('Invalid email address').optional(),
  role: z.enum(['user', 'admin', 'moderator']).optional(),
  password: passwordSchema.optional(),
});

export const resendTemporaryPasswordSchema = z.object({
  expiryHours: z.coerce.number().int().min(1).max(168).optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ResendTemporaryPasswordInput = z.infer<typeof resendTemporaryPasswordSchema>;
