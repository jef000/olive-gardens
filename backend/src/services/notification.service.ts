import { query } from '../db/pool';
import { 
  Notification, 
  CreateNotificationDTO, 
  NotificationFilters,
  NotificationType,
  NotificationPriority 
} from '../types/notification';

/**
 * Notification Service
 * Handles all notification-related business logic
 */
export class NotificationService {
  /**
   * Create a new notification
   */
  async createNotification(data: CreateNotificationDTO): Promise<Notification> {
    const result = await query<Notification>(
      `INSERT INTO notifications (
        type, priority, title, message, user_id, 
        resource_type, resource_id, data, expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        data.type,
        data.priority || 'medium',
        data.title,
        data.message,
        data.user_id || null,
        data.resource_type || null,
        data.resource_id || null,
        data.data ? JSON.stringify(data.data) : '{}',
        data.expires_at || null,
      ]
    );

    return result.rows[0];
  }

  /**
   * Create notification for all admins/moderators
   */
  async createBroadcastNotification(
    data: Omit<CreateNotificationDTO, 'user_id'>
  ): Promise<Notification[]> {
    // Get all admin and moderator users
    const users = await query<{ id: string }>(
      `SELECT id FROM users WHERE role IN ('admin', 'moderator')`
    );

    const notifications: Notification[] = [];
    
    for (const user of users.rows) {
      const notification = await this.createNotification({
        ...data,
        user_id: user.id,
      });
      notifications.push(notification);
    }

    return notifications;
  }

  /**
   * Get notifications with filters
   */
  async getNotifications(filters: NotificationFilters): Promise<Notification[]> {
    let queryText = 'SELECT * FROM notifications WHERE 1=1';
    const queryParams: any[] = [];
    let paramCount = 1;

    if (filters.user_id) {
      queryText += ` AND user_id = $${paramCount}`;
      queryParams.push(filters.user_id);
      paramCount++;
    }

    if (filters.type) {
      queryText += ` AND type = $${paramCount}`;
      queryParams.push(filters.type);
      paramCount++;
    }

    if (filters.priority) {
      queryText += ` AND priority = $${paramCount}`;
      queryParams.push(filters.priority);
      paramCount++;
    }

    if (filters.is_read !== undefined) {
      queryText += ` AND is_read = $${paramCount}`;
      queryParams.push(filters.is_read);
      paramCount++;
    }

    if (filters.resource_type) {
      queryText += ` AND resource_type = $${paramCount}`;
      queryParams.push(filters.resource_type);
      paramCount++;
    }

    if (filters.start_date) {
      queryText += ` AND created_at >= $${paramCount}`;
      queryParams.push(filters.start_date);
      paramCount++;
    }

    if (filters.end_date) {
      queryText += ` AND created_at <= $${paramCount}`;
      queryParams.push(filters.end_date);
      paramCount++;
    }

    queryText += ' ORDER BY created_at DESC LIMIT 100';

    const result = await query<Notification>(queryText, queryParams);
    return result.rows;
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId?: string): Promise<Notification | null> {
    let queryText = `
      UPDATE notifications 
      SET is_read = true, read_at = CURRENT_TIMESTAMP 
      WHERE id = $1
    `;
    const queryParams: any[] = [notificationId];

    if (userId) {
      queryText += ` AND user_id = $2`;
      queryParams.push(userId);
    }

    queryText += ' RETURNING *';

    const result = await query<Notification>(queryText, queryParams);
    return result.rows[0] || null;
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<number> {
    const result = await query(
      `UPDATE notifications 
       SET is_read = true, read_at = CURRENT_TIMESTAMP 
       WHERE user_id = $1 AND is_read = false`,
      [userId]
    );

    return result.rowCount || 0;
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string, userId?: string): Promise<boolean> {
    let queryText = 'DELETE FROM notifications WHERE id = $1';
    const queryParams: any[] = [notificationId];

    if (userId) {
      queryText += ` AND user_id = $2`;
      queryParams.push(userId);
    }

    const result = await query(queryText, queryParams);
    return (result.rowCount || 0) > 0;
  }

  /**
   * Get notification statistics for a user
   */
  async getStats(userId: string): Promise<{
    total: number;
    unread: number;
    by_type: { type: NotificationType; count: number }[];
    by_priority: { priority: NotificationPriority; count: number }[];
  }> {
    const totalResult = await query<{ count: string }>(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1',
      [userId]
    );

    const unreadResult = await query<{ count: string }>(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false',
      [userId]
    );

    const byTypeResult = await query<{ type: NotificationType; count: string }>(
      `SELECT type, COUNT(*) as count 
       FROM notifications 
       WHERE user_id = $1 
       GROUP BY type 
       ORDER BY count DESC`,
      [userId]
    );

    const byPriorityResult = await query<{ priority: NotificationPriority; count: string }>(
      `SELECT priority, COUNT(*) as count 
       FROM notifications 
       WHERE user_id = $1 
       GROUP BY priority 
       ORDER BY 
         CASE priority 
           WHEN 'urgent' THEN 1 
           WHEN 'high' THEN 2 
           WHEN 'medium' THEN 3 
           WHEN 'low' THEN 4 
         END`,
      [userId]
    );

    return {
      total: parseInt(totalResult.rows[0]?.count || '0'),
      unread: parseInt(unreadResult.rows[0]?.count || '0'),
      by_type: byTypeResult.rows.map(row => ({
        type: row.type,
        count: parseInt(row.count),
      })),
      by_priority: byPriorityResult.rows.map(row => ({
        priority: row.priority,
        count: parseInt(row.count),
      })),
    };
  }

  /**
   * Delete expired notifications
   */
  async deleteExpired(): Promise<number> {
    const result = await query(
      'DELETE FROM notifications WHERE expires_at IS NOT NULL AND expires_at < CURRENT_TIMESTAMP'
    );

    return result.rowCount || 0;
  }

  /**
   * Helper: Create booking notification
   */
  async notifyBookingEvent(
    type: NotificationType,
    bookingId: string,
    bookingReference: string,
    clientName: string,
    eventName: string,
    priority: NotificationPriority = 'medium'
  ): Promise<Notification[]> {
    const titles: Record<string, string> = {
      booking_created: 'New Booking Created',
      booking_updated: 'Booking Updated',
      booking_confirmed: 'Booking Confirmed',
      booking_cancelled: 'Booking Cancelled',
      booking_completed: 'Booking Completed',
    };

    const messages: Record<string, string> = {
      booking_created: `New booking ${bookingReference} for ${eventName} by ${clientName}`,
      booking_updated: `Booking ${bookingReference} has been updated`,
      booking_confirmed: `Booking ${bookingReference} for ${eventName} has been confirmed`,
      booking_cancelled: `Booking ${bookingReference} for ${eventName} has been cancelled`,
      booking_completed: `Booking ${bookingReference} for ${eventName} has been completed`,
    };

    return this.createBroadcastNotification({
      type,
      priority,
      title: titles[type] || 'Booking Update',
      message: messages[type] || `Booking ${bookingReference} updated`,
      resource_type: 'booking',
      resource_id: bookingId,
      data: { bookingReference, clientName, eventName },
    });
  }

  /**
   * Helper: Create user notification
   */
  async notifyUserEvent(
    type: NotificationType,
    userId: string,
    userEmail: string,
    role: string,
    priority: NotificationPriority = 'low'
  ): Promise<Notification[]> {
    const titles: Record<string, string> = {
      user_created: 'New User Created',
      user_updated: 'User Updated',
      user_deleted: 'User Deleted',
    };

    const messages: Record<string, string> = {
      user_created: `New ${role} user created: ${userEmail}`,
      user_updated: `User ${userEmail} has been updated`,
      user_deleted: `User ${userEmail} has been deleted`,
    };

    return this.createBroadcastNotification({
      type,
      priority,
      title: titles[type] || 'User Update',
      message: messages[type] || `User ${userEmail} updated`,
      resource_type: 'user',
      resource_id: userId,
      data: { userEmail, role },
    });
  }

  /**
   * Helper: Create gallery notification
   */
  async notifyGalleryEvent(
    type: NotificationType,
    imageId: string,
    imageTitle: string,
    album: string,
    uploadedBy: string,
    priority: NotificationPriority = 'low'
  ): Promise<Notification[]> {
    const titles: Record<string, string> = {
      gallery_upload: 'New Image Uploaded',
      gallery_deleted: 'Image Deleted',
    };

    const messages: Record<string, string> = {
      gallery_upload: `New image "${imageTitle}" uploaded to ${album}`,
      gallery_deleted: `Image "${imageTitle}" has been deleted from ${album}`,
    };

    return this.createBroadcastNotification({
      type,
      priority,
      title: titles[type] || 'Gallery Update',
      message: messages[type] || `Gallery updated`,
      resource_type: 'gallery',
      resource_id: imageId,
      data: { imageTitle, album, uploadedBy },
    });
  }
  /**
   * Helper: Create inquiry notification
   */
  async notifyInquiryEvent(
    inquiryId: string,
    customerName: string,
    customerEmail: string
  ): Promise<Notification[]> {
    return this.createBroadcastNotification({
      type: 'inquiry_received',
      priority: 'medium',
      title: 'New Inquiry Received',
      message: `New message from ${customerName} (${customerEmail})`,
      resource_type: 'inquiry',
      resource_id: inquiryId,
      data: { customerName, customerEmail },
    });
  }
}

export default new NotificationService();
