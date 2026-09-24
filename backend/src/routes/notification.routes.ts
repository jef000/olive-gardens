import { Router } from 'express';
import notificationController from '../controllers/notification.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate';
import {
  broadcastNotificationSchema,
  createNotificationSchema,
} from '../validators/notification.validator';

const router = Router();

/**
 * Notification Routes
 * All routes require authentication
 */

// GET /notifications/unread/count - Get unread count
router.get(
  '/unread/count',
  authenticate,
  notificationController.getUnreadCount.bind(notificationController)
);

// GET /notifications/stats - Get notification statistics
router.get('/stats', authenticate, notificationController.getStats.bind(notificationController));

// PATCH /notifications/read-all - Mark all as read
router.patch(
  '/read-all',
  authenticate,
  notificationController.markAllAsRead.bind(notificationController)
);

// POST /notifications/broadcast - Create broadcast (Admin only)
router.post(
  '/broadcast',
  authenticate,
  authorize('admin'),
  validate(broadcastNotificationSchema),
  notificationController.createBroadcast.bind(notificationController)
);

// DELETE /notifications/expired - Delete expired (Admin only)
router.delete(
  '/expired',
  authenticate,
  authorize('admin'),
  notificationController.deleteExpired.bind(notificationController)
);

// PATCH /notifications/:id/read - Mark as read
router.patch(
  '/:id/read',
  authenticate,
  notificationController.markAsRead.bind(notificationController)
);

// DELETE /notifications/:id - Delete notification
router.delete(
  '/:id',
  authenticate,
  notificationController.deleteNotification.bind(notificationController)
);

// GET /notifications - Get all notifications
router.get('/', authenticate, notificationController.getNotifications.bind(notificationController));

// POST /notifications - Create notification (Admin only)
router.post(
  '/',
  authenticate,
  authorize('admin'),
  validate(createNotificationSchema),
  notificationController.createNotification.bind(notificationController)
);

export default router;
