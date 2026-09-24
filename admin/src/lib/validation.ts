import { z } from 'zod';

export const emailSchema = z.string().trim().min(1, 'Email is required').email('Enter a valid email address');
export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Add an uppercase letter')
  .regex(/[a-z]/, 'Add a lowercase letter')
  .regex(/[0-9]/, 'Add a number')
  .regex(/[^A-Za-z0-9]/, 'Add a special character');
export const mfaCodeSchema = z.string().trim().regex(/^\d{6}$/, 'Enter the 6-digit code from your authenticator app');
export const backupCodeSchema = z.string().trim().regex(/^[A-Fa-f0-9]{8}$/, 'Enter your 8-character backup code');
export const phoneSchema = z.string().regex(/^\+?[0-9 ()-]{7,20}$/, 'Enter a valid phone number');
export const dateRangeSchema = z.object({ start: z.coerce.date(), end: z.coerce.date() }).refine(({ start, end }) => end >= start, 'End date must be on or after start date');
export function validateSchema<T>(schema: z.ZodType<T>, value: unknown): string | null { const result = schema.safeParse(value); return result.success ? null : result.error.issues[0]?.message || 'Invalid value'; }
