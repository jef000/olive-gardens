import { z } from 'zod';

const notificationTypes = [
  'booking_created',
  'booking_updated',
  'booking_confirmed',
  'booking_cancelled',
  'booking_completed',
  'payment_received',
  'payment_pending',
  'user_created',
  'user_updated',
  'user_deleted',
  'gallery_upload',
  'gallery_deleted',
  'inquiry_received',
  'system_alert',
  'admin_action',
] as const;

const priorities = ['low', 'medium', 'high', 'urgent'] as const;

export const createNotificationSchema = z.object({
  type: z.enum(notificationTypes),
  priority: z.enum(priorities).optional(),
  title: z.string().trim().min(1, 'Title is required').max(200),
  message: z.string().trim().min(1, 'Message is required').max(2000),
  user_id: z.string().uuid('Invalid user ID').optional(),
  resource_type: z.string().trim().max(50).optional(),
  resource_id: z.string().trim().max(100).optional(),
  data: z.record(z.unknown()).optional(),
  expires_at: z.coerce.date().optional(),
});

export const broadcastNotificationSchema = createNotificationSchema.omit({ user_id: true });

export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;
