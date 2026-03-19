import { z } from 'zod';

/**
 * Validation schemas for user management endpoints
 * Security: Input validation and sanitization
 */

export const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['user', 'admin', 'moderator']).optional(),
  expiryHours: z.number().min(1).max(168).optional(), // Max 7 days
});

export const updateUserSchema = z.object({
  email: z.string().email('Invalid email address').optional(),
  role: z.enum(['user', 'admin', 'moderator']).optional(),
});

export const resendTemporaryPasswordSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  expiryHours: z.number().min(1).max(168).optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ResendTemporaryPasswordInput = z.infer<typeof resendTemporaryPasswordSchema>;
