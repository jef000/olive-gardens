import { Request, Response, NextFunction } from 'express';
import { query } from '../db/pool';
import { AnalyticsEvent, CreateAnalyticsEventDTO } from '../types/analytics';
import { sendSuccess } from '../utils/response';

export class AnalyticsController {
  /**
   * Track analytics event
   * POST /api/analytics/track
   * Security: Authenticated users
   */
  async trackEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const eventData: CreateAnalyticsEventDTO = req.body;
      const userId = req.user?.userId;

      const result = await query<AnalyticsEvent>(
        `INSERT INTO analytics_events (
          event_type, event_category, event_action, event_label, event_data,
          user_id, session_id, page_url, page_title, referrer, value, duration
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *`,
        [
          eventData.event_type,
          eventData.event_category,
          eventData.event_action,
          eventData.event_label,
          eventData.event_data ? JSON.stringify(eventData.event_data) : null,
          userId,
          eventData.session_id,
          eventData.page_url,
          eventData.page_title,
          eventData.referrer,
          eventData.value,
          eventData.duration,
        ]
      );

      sendSuccess(res, { event: result.rows[0] }, 'Event tracked successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get analytics overview
   * GET /api/analytics/overview
   * Security: Admin and moderator only
   */
  async getOverview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { start_date, end_date } = req.query;

      let dateFilter = '';
      const queryParams: any[] = [];

      if (start_date && end_date) {
        dateFilter = 'WHERE created_at BETWEEN $1 AND $2';
        queryParams.push(start_date, end_date);
      }

      const totalBookingsResult = await query<{ count: string }>(
        `SELECT COUNT(*) as count FROM bookings ${dateFilter}`,
        queryParams
      );

      const totalRevenueResult = await query<{ revenue: string }>(
        `SELECT COALESCE(SUM(total_amount), 0) as revenue FROM bookings WHERE status != 'cancelled' ${dateFilter ? 'AND created_at BETWEEN $1 AND $2' : ''}`,
        queryParams
      );

      const totalUsersResult = await query<{ count: string }>(
        `SELECT COUNT(*) as count FROM users ${dateFilter}`,
        queryParams
      );

      const totalEventsResult = await query<{ count: string }>(
        `SELECT COUNT(*) as count FROM analytics_events ${dateFilter}`,
        queryParams
      );

      sendSuccess(res, {
        total_bookings: parseInt(totalBookingsResult.rows[0].count),
        total_revenue: parseFloat(totalRevenueResult.rows[0].revenue),
        total_users: parseInt(totalUsersResult.rows[0].count),
        total_events: parseInt(totalEventsResult.rows[0].count),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get revenue analytics
   * GET /api/analytics/revenue
   * Security: Admin and moderator only
   */
  async getRevenueAnalytics(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const revenueByMonth = await query<{ month: string; revenue: string }>(
        `SELECT 
          TO_CHAR(created_at, 'Mon') as month,
          COALESCE(SUM(total_amount), 0) as revenue
        FROM bookings
        WHERE status != 'cancelled'
          AND created_at >= NOW() - INTERVAL '12 months'
        GROUP BY TO_CHAR(created_at, 'Mon'), EXTRACT(MONTH FROM created_at)
        ORDER BY EXTRACT(MONTH FROM created_at)`
      );

      const revenueByVenue = await query<{ venue: string; revenue: string }>(
        `SELECT venue, COALESCE(SUM(total_amount), 0) as revenue
        FROM bookings
        WHERE status != 'cancelled'
        GROUP BY venue
        ORDER BY revenue DESC`
      );

      const revenueByEventType = await query<{ event_type: string; revenue: string }>(
        `SELECT event_type, COALESCE(SUM(total_amount), 0) as revenue
        FROM bookings
        WHERE status != 'cancelled'
        GROUP BY event_type
        ORDER BY revenue DESC`
      );

      sendSuccess(res, {
        revenue_by_month: revenueByMonth.rows.map(row => ({
          month: row.month,
          revenue: parseFloat(row.revenue),
        })),
        revenue_by_venue: revenueByVenue.rows.map(row => ({
          venue: row.venue,
          revenue: parseFloat(row.revenue),
        })),
        revenue_by_event_type: revenueByEventType.rows.map(row => ({
          event_type: row.event_type,
          revenue: parseFloat(row.revenue),
        })),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get booking trends
   * GET /api/analytics/bookings/trends
   * Security: Admin and moderator only
   */
  async getBookingTrends(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dailyBookings = await query<{ date: string; count: string }>(
        `SELECT 
          DATE(created_at) as date,
          COUNT(*) as count
        FROM bookings
        WHERE created_at >= NOW() - INTERVAL '30 days'
        GROUP BY DATE(created_at)
        ORDER BY date DESC`
      );

      const bookingsByStatus = await query<{ status: string; count: string }>(
        `SELECT status, COUNT(*) as count
        FROM bookings
        GROUP BY status`
      );

      const bookingsByVenue = await query<{ venue: string; count: string }>(
        `SELECT venue, COUNT(*) as count
        FROM bookings
        GROUP BY venue
        ORDER BY count DESC`
      );

      const bookingsByEventType = await query<{ event_type: string; count: string }>(
        `SELECT event_type, COUNT(*) as count
        FROM bookings
        GROUP BY event_type
        ORDER BY count DESC`
      );

      sendSuccess(res, {
        daily_bookings: dailyBookings.rows.map(row => ({
          date: row.date,
          count: parseInt(row.count),
        })),
        bookings_by_status: bookingsByStatus.rows.map(row => ({
          status: row.status,
          count: parseInt(row.count),
        })),
        bookings_by_venue: bookingsByVenue.rows.map(row => ({
          venue: row.venue,
          count: parseInt(row.count),
        })),
        bookings_by_event_type: bookingsByEventType.rows.map(row => ({
          event_type: row.event_type,
          count: parseInt(row.count),
        })),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user engagement analytics
   * GET /api/analytics/engagement
   * Security: Admin and moderator only
   */
  async getEngagementAnalytics(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const eventsByType = await query<{ event_type: string; count: string }>(
        `SELECT event_type, COUNT(*) as count
        FROM analytics_events
        WHERE created_at >= NOW() - INTERVAL '30 days'
        GROUP BY event_type
        ORDER BY count DESC
        LIMIT 10`
      );

      const eventsByCategory = await query<{ event_category: string; count: string }>(
        `SELECT event_category, COUNT(*) as count
        FROM analytics_events
        WHERE event_category IS NOT NULL
          AND created_at >= NOW() - INTERVAL '30 days'
        GROUP BY event_category
        ORDER BY count DESC`
      );

      const topPages = await query<{ page_url: string; count: string }>(
        `SELECT page_url, COUNT(*) as count
        FROM analytics_events
        WHERE page_url IS NOT NULL
          AND created_at >= NOW() - INTERVAL '30 days'
        GROUP BY page_url
        ORDER BY count DESC
        LIMIT 10`
      );

      sendSuccess(res, {
        events_by_type: eventsByType.rows.map(row => ({
          event_type: row.event_type,
          count: parseInt(row.count),
        })),
        events_by_category: eventsByCategory.rows.map(row => ({
          category: row.event_category,
          count: parseInt(row.count),
        })),
        top_pages: topPages.rows.map(row => ({
          page: row.page_url,
          views: parseInt(row.count),
        })),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get dashboard metrics
   * GET /api/analytics/dashboard
   * Security: Admin and moderator only
   */
  async getDashboardMetrics(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {

      const currentMonthBookings = await query<{ count: string; revenue: string }>(
        `SELECT 
          COUNT(*) as count,
          COALESCE(SUM(total_amount), 0) as revenue
        FROM bookings
        WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)
          AND status != 'cancelled'`
      );

      const lastMonthBookings = await query<{ count: string; revenue: string }>(
        `SELECT 
          COUNT(*) as count,
          COALESCE(SUM(total_amount), 0) as revenue
        FROM bookings
        WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
          AND created_at < DATE_TRUNC('month', CURRENT_DATE)
          AND status != 'cancelled'`
      );

      const upcomingBookings = await query<{ count: string }>(
        `SELECT COUNT(*) as count
        FROM bookings
        WHERE event_date >= CURRENT_DATE
          AND status = 'confirmed'`
      );

      const pendingBookings = await query<{ count: string }>(
        `SELECT COUNT(*) as count
        FROM bookings
        WHERE status = 'pending'`
      );

      const currentCount = parseInt(currentMonthBookings.rows[0].count);
      const lastCount = parseInt(lastMonthBookings.rows[0].count);
      const bookingGrowth = lastCount > 0 ? ((currentCount - lastCount) / lastCount) * 100 : 0;

      const currentRevenue = parseFloat(currentMonthBookings.rows[0].revenue);
      const lastRevenue = parseFloat(lastMonthBookings.rows[0].revenue);
      const revenueGrowth = lastRevenue > 0 ? ((currentRevenue - lastRevenue) / lastRevenue) * 100 : 0;

      sendSuccess(res, {
        current_month: {
          bookings: currentCount,
          revenue: currentRevenue,
        },
        last_month: {
          bookings: lastCount,
          revenue: lastRevenue,
        },
        growth: {
          bookings: Math.round(bookingGrowth * 10) / 10,
          revenue: Math.round(revenueGrowth * 10) / 10,
        },
        upcoming_bookings: parseInt(upcomingBookings.rows[0].count),
        pending_bookings: parseInt(pendingBookings.rows[0].count),
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AnalyticsController();
