export type NotificationType =
  | 'booking_created'
  | 'booking_updated'
  | 'booking_confirmed'
  | 'booking_cancelled'
  | 'booking_completed'
  | 'payment_received'
  | 'payment_pending'
  | 'user_created'
  | 'user_updated'
  | 'user_deleted'
  | 'gallery_upload'
  | 'gallery_deleted'
  | 'inquiry_received'
  | 'system_alert'
  | 'admin_action';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Notification {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  user_id?: string;
  resource_type?: string;
  resource_id?: string;
  data?: Record<string, any>;
  is_read: boolean;
  read_at?: string;
  created_at: string;
  expires_at?: string;
}

export interface NotificationStats {
  total: number;
  unread: number;
  by_type: { type: NotificationType; count: number }[];
  by_priority: { priority: NotificationPriority; count: number }[];
}
