import { z } from 'zod';

const eventTypes = ['Wedding', 'Corporate', 'Workshop', 'Session', 'Conference', 'Party', 'Other'] as const;
const venues = ['Main Arena', 'Garden Hall', 'Therapy Room', 'Conference Room'] as const;

/**
 * Public booking submissions come straight from an unauthenticated form.
 * Bounds every field and defaults the amounts so no NaN/replica values reach SQL.
 */
export const publicBookingSchema = z.object({
  client_name: z.string().trim().min(1, 'Name is required').max(150),
  client_email: z.string().trim().email('A valid email is required').max(255),
  client_phone: z.string().trim().max(30).optional(),
  event_name: z.string().trim().min(1, 'Event name is required').max(200),
  event_type: z.enum(eventTypes),
  venue: z.enum(venues),
  event_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Event date must be YYYY-MM-DD'),
  start_time: z.string().trim().max(10).optional(),
  end_time: z.string().trim().max(10).optional(),
  total_amount: z.coerce.number().finite().min(0).max(100_000_000).optional().default(0),
  deposit_amount: z.coerce.number().finite().min(0).max(100_000_000).optional().default(0),
  guest_count: z.coerce.number().int().min(0).max(100_000).optional(),
  special_requests: z.string().max(2000).optional(),
  notes: z.string().max(2000).optional(),
});

export type PublicBookingInput = z.infer<typeof publicBookingSchema>;
