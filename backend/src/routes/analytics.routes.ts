import { Router } from 'express';
import analyticsController from '../controllers/analytics.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

/**
 * Analytics Routes
 * All routes require authentication
 * Admin/Moderator access for viewing analytics
 */

// POST /analytics/track - Track analytics event
router.post(
  '/track',
  authenticate,
  analyticsController.trackEvent.bind(analyticsController)
);

// GET /analytics/overview - Get analytics overview
router.get(
  '/overview',
  authenticate,
  authorize('admin', 'moderator'),
  analyticsController.getOverview.bind(analyticsController)
);

// GET /analytics/revenue - Get revenue analytics
router.get(
  '/revenue',
  authenticate,
  authorize('admin', 'moderator'),
  analyticsController.getRevenueAnalytics.bind(analyticsController)
);

// GET /analytics/bookings/trends - Get booking trends
router.get(
  '/bookings/trends',
  authenticate,
  authorize('admin', 'moderator'),
  analyticsController.getBookingTrends.bind(analyticsController)
);

// GET /analytics/engagement - Get user engagement analytics
router.get(
  '/engagement',
  authenticate,
  authorize('admin', 'moderator'),
  analyticsController.getEngagementAnalytics.bind(analyticsController)
);

// GET /analytics/dashboard - Get dashboard metrics
router.get(
  '/dashboard',
  authenticate,
  authorize('admin', 'moderator'),
  analyticsController.getDashboardMetrics.bind(analyticsController)
);

// GET /analytics/sidebar - Get sidebar badge counts
router.get(
  '/sidebar',
  authenticate,
  authorize('admin', 'moderator'),
  analyticsController.getSidebarMetrics.bind(analyticsController)
);

export default router;
