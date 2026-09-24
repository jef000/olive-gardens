import { Request, Response, NextFunction } from 'express';
import notificationService from '../services/notification.service';
import { CreateNotificationDTO, NotificationFilters } from '../types/notification';
import { sendSuccess, sendError } from '../utils/response';

/**
 * Notification Controller
 * Handles HTTP requests for notification management
 */
export class NotificationController {
  /**
   * Get all notifications for the authenticated user
   * GET /api/notifications
   */
  async getNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      const filters: NotificationFilters = {
        ...req.query,
        user_id: userId,
      };

      const page = await notificationService.getNotifications(filters);

      sendSuccess(res, {
        ...page,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get unread notifications count
   * GET /api/notifications/unread/count
   */
  async getUnreadCount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        sendError(res, 'Unauthorized', 401);
        return;
      }

      const stats = await notificationService.getStats(userId);

      sendSuccess(res, {
        unread_count: stats.unread,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get notification statistics
   * GET /api/notifications/stats
   */
  async getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        sendError(res, 'Unauthorized', 401);
        return;
      }

      const stats = await notificationService.getStats(userId);

      sendSuccess(res, stats);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mark notification as read
   * PATCH /api/notifications/:id/read
   */
  async markAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      const notification = await notificationService.markAsRead(id, userId);

      if (!notification) {
        sendError(res, 'Notification not found', 404);
        return;
      }

      sendSuccess(res, { notification }, 'Notification marked as read');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mark all notifications as read
   * PATCH /api/notifications/read-all
   */
  async markAllAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        sendError(res, 'Unauthorized', 401);
        return;
      }

      const count = await notificationService.markAllAsRead(userId);

      sendSuccess(res, { count }, `${count} notifications marked as read`);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete notification
   * DELETE /api/notifications/:id
   */
  async deleteNotification(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      const deleted = await notificationService.deleteNotification(id, userId);

      if (!deleted) {
        sendError(res, 'Notification not found', 404);
        return;
      }

      sendSuccess(res, null, 'Notification deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create notification (Admin only)
   * POST /api/notifications
   */
  async createNotification(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const notificationData: CreateNotificationDTO = req.body;

      const notification = await notificationService.createNotification(notificationData);

      sendSuccess(res, { notification }, 'Notification created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create broadcast notification (Admin only)
   * POST /api/notifications/broadcast
   */
  async createBroadcast(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const notificationData: Omit<CreateNotificationDTO, 'user_id'> = req.body;

      const notifications = await notificationService.createBroadcastNotification(notificationData);

      sendSuccess(
        res,
        { notifications, count: notifications.length },
        `Broadcast sent to ${notifications.length} users`,
        201
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete expired notifications (Admin only)
   * DELETE /api/notifications/expired
   */
  async deleteExpired(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const count = await notificationService.deleteExpired();

      sendSuccess(res, { count }, `${count} expired notifications deleted`);
    } catch (error) {
      next(error);
    }
  }
}

export default new NotificationController();
