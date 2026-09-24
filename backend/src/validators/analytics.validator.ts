import { z } from 'zod';

/**
 * Analytics events arrive from authenticated clients; bound every field so a
 * free-form body cannot write arbitrary rows.
 */
export const trackEventSchema = z.object({
  event_type: z.string().trim().min(1, 'Event type is required').max(100),
  event_category: z.string().trim().max(100).optional(),
  event_action: z.string().trim().max(100).optional(),
  event_label: z.string().trim().max(200).optional(),
  event_data: z.record(z.unknown()).optional(),
  session_id: z.string().trim().max(100).optional(),
  page_url: z.string().trim().max(1000).optional(),
  page_title: z.string().trim().max(300).optional(),
  referrer: z.string().trim().max(1000).optional(),
  value: z.coerce.number().finite().optional(),
  duration: z.coerce
    .number()
    .int()
    .min(0)
    .max(24 * 60 * 60 * 1000)
    .optional(),
});

export type TrackEventInput = z.infer<typeof trackEventSchema>;
