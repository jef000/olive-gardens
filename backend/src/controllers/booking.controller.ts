import { Request, Response, NextFunction } from 'express';
import { query } from '../db/pool';
import { Booking, CreateBookingDTO, UpdateBookingDTO, BookingFilters } from '../types/booking';
import { sendSuccess, sendError } from '../utils/response';
import notificationService from '../services/notification.service';
import { safeNotify } from '../utils/safeNotify';
import { randomBytes } from 'crypto';

export class BookingController {
  /**
   * Get public availability by venue
   * GET /api/bookings/public/availability
   * Security: Public
   */
  async getPublicAvailability(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { venue } = req.query as { venue?: string };

      if (!venue) {
        sendError(res, 'Venue is required', 400);
        return;
      }

      const result = await query<{
        event_date: string;
        status: string;
      }>(
        `SELECT event_date, status
         FROM bookings
         WHERE venue = $1
           AND status IN ('pending', 'confirmed', 'completed')
           AND event_date >= CURRENT_DATE
         ORDER BY event_date ASC`,
        [venue]
      );

      const availability = result.rows
        .map((row) => {
          if (!row.event_date) {
            return null;
          }

          const parsedDate = new Date(row.event_date);
          if (Number.isNaN(parsedDate.getTime())) {
            return null;
          }

          return {
            date: parsedDate.toISOString().split('T')[0],
            status: row.status === 'pending' ? 'tentative' : 'booked',
          };
        })
        .filter(Boolean) as { date: string; status: string; label?: string }[];

      sendSuccess(res, { availability });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all bookings with optional filters
   * GET /api/bookings
   * Security: Admin and moderator only
   */
  async getAllBookings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status, venue, event_type, payment_status, start_date, end_date, search } =
        req.query as BookingFilters;

      let queryText = 'SELECT * FROM bookings WHERE 1=1';
      const queryParams: any[] = [];
      let paramCount = 1;

      if (status) {
        queryText += ` AND status = $${paramCount}`;
        queryParams.push(status);
        paramCount++;
      }

      if (venue) {
        queryText += ` AND venue = $${paramCount}`;
        queryParams.push(venue);
        paramCount++;
      }

      if (event_type) {
        queryText += ` AND event_type = $${paramCount}`;
        queryParams.push(event_type);
        paramCount++;
      }

      if (payment_status) {
        queryText += ` AND payment_status = $${paramCount}`;
        queryParams.push(payment_status);
        paramCount++;
      }

      if (start_date) {
        queryText += ` AND event_date >= $${paramCount}`;
        queryParams.push(start_date);
        paramCount++;
      }

      if (end_date) {
        queryText += ` AND event_date <= $${paramCount}`;
        queryParams.push(end_date);
        paramCount++;
      }

      if (search) {
        queryText += ` AND (client_name ILIKE $${paramCount} OR event_name ILIKE $${paramCount} OR booking_reference ILIKE $${paramCount})`;
        queryParams.push(`%${search}%`);
        paramCount++;
      }

      const countResult = await query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM bookings WHERE ${queryText.split(' WHERE ')[1]}`,
        queryParams
      );
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 25));
      const offset = (page - 1) * limit;
      queryText += ` ORDER BY event_date DESC, created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
      queryParams.push(limit, offset);

      const result = await query<Booking>(queryText, queryParams);

      sendSuccess(res, {
        bookings: result.rows,
        total: Number(countResult.rows[0]?.count || 0),
        page,
        limit,
        has_more: offset + result.rows.length < Number(countResult.rows[0]?.count || 0),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get booking by ID
   * GET /api/bookings/:id
   * Security: Admin and moderator only
   */
  async getBookingById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const result = await query<Booking>('SELECT * FROM bookings WHERE id = $1', [id]);

      if (result.rows.length === 0) {
        sendError(res, 'Booking not found', 404);
        return;
      }

      sendSuccess(res, { booking: result.rows[0] });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get booking by reference
   * GET /api/bookings/reference/:reference
   * Security: Admin and moderator only
   */
  async getBookingByReference(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { reference } = req.params;

      const result = await query<Booking>('SELECT * FROM bookings WHERE booking_reference = $1', [
        reference,
      ]);

      if (result.rows.length === 0) {
        sendError(res, 'Booking not found', 404);
        return;
      }

      sendSuccess(res, { booking: result.rows[0] });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create new booking
   * POST /api/bookings
   * Security: Admin and moderator only
   */
  async createBooking(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const bookingData: CreateBookingDTO = req.body;
      const userId = req.user?.userId;
      const isPublicRequest = !req.user;

      // Public submissions may not double-book a space that already has a live
      // booking on that date.
      if (isPublicRequest) {
        const conflict = await query<{ id: string }>(
          `SELECT id FROM bookings
           WHERE venue = $1 AND event_date = $2 AND status IN ('pending', 'confirmed')
           LIMIT 1`,
          [bookingData.venue, bookingData.event_date]
        );
        if (conflict.rows.length > 0) {
          sendError(
            res,
            'This space is already booked for the selected date. Please choose another date or contact us.',
            409
          );
          return;
        }
      }

      const bookingReference = await this.generateBookingReference();

      const totalAmount = Number(bookingData.total_amount || 0);
      const depositAmount = Number(bookingData.deposit_amount || 0);
      const balanceAmount = totalAmount - depositAmount;

      const result = await query<Booking>(
        `INSERT INTO bookings (
          booking_reference, client_name, client_email, client_phone,
          event_name, event_type, venue, event_date, start_time, end_time,
          total_amount, deposit_amount, balance_amount, guest_count,
          special_requests, notes, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        RETURNING *`,
        [
          bookingReference,
          bookingData.client_name,
          bookingData.client_email.toLowerCase(),
          bookingData.client_phone,
          bookingData.event_name,
          bookingData.event_type,
          bookingData.venue,
          bookingData.event_date,
          bookingData.start_time,
          bookingData.end_time,
          totalAmount,
          depositAmount,
          balanceAmount,
          bookingData.guest_count,
          bookingData.special_requests,
          bookingData.notes,
          userId,
        ]
      );

      // Send notification to admins/moderators
      safeNotify(
        notificationService.notifyBookingEvent(
          'booking_created',
          result.rows[0].id,
          bookingReference,
          bookingData.client_name,
          bookingData.event_name,
          'high'
        ),
        'booking_created'
      );

      sendSuccess(res, { booking: result.rows[0] }, 'Booking created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update booking
   * PUT /api/bookings/:id
   * Security: Admin and moderator only
   */
  async updateBooking(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const updateData: UpdateBookingDTO = req.body;

      const existingBooking = await query<Booking>('SELECT * FROM bookings WHERE id = $1', [id]);

      if (existingBooking.rows.length === 0) {
        sendError(res, 'Booking not found', 404);
        return;
      }

      const updates: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      // Only known columns may be updated; keys from the request body are never
      // interpolated into SQL directly.
      const updatableFields: (keyof UpdateBookingDTO)[] = [
        'client_name',
        'client_email',
        'client_phone',
        'event_name',
        'event_type',
        'venue',
        'event_date',
        'start_time',
        'end_time',
        'total_amount',
        'deposit_amount',
        'guest_count',
        'special_requests',
        'notes',
        'status',
        'payment_status',
      ];

      updatableFields.forEach((field) => {
        const value = updateData[field];
        if (value !== undefined) {
          updates.push(`${field} = $${paramCount}`);
          values.push(value);
          paramCount++;
        }
      });

      if (updateData.total_amount !== undefined || updateData.deposit_amount !== undefined) {
        const totalAmount = updateData.total_amount ?? existingBooking.rows[0].total_amount;
        const depositAmount = updateData.deposit_amount ?? existingBooking.rows[0].deposit_amount;
        const balanceAmount = totalAmount - depositAmount;

        updates.push(`balance_amount = $${paramCount}`);
        values.push(balanceAmount);
        paramCount++;
      }

      if (updates.length === 0) {
        sendError(res, 'No valid fields to update', 400);
        return;
      }

      values.push(id);

      const result = await query<Booking>(
        `UPDATE bookings SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
        values
      );

      const booking = result.rows[0];

      // Send notification for status changes
      if (updateData.status) {
        const notifType =
          updateData.status === 'confirmed'
            ? 'booking_confirmed'
            : updateData.status === 'cancelled'
              ? 'booking_cancelled'
              : updateData.status === 'completed'
                ? 'booking_completed'
                : 'booking_updated';

        safeNotify(
          notificationService.notifyBookingEvent(
            notifType,
            booking.id,
            booking.booking_reference,
            booking.client_name,
            booking.event_name,
            updateData.status === 'confirmed' || updateData.status === 'cancelled'
              ? 'high'
              : 'medium'
          ),
          notifType
        );
      } else {
        // General update notification
        safeNotify(
          notificationService.notifyBookingEvent(
            'booking_updated',
            booking.id,
            booking.booking_reference,
            booking.client_name,
            booking.event_name,
            'medium'
          ),
          'booking_updated'
        );
      }

      sendSuccess(res, { booking }, 'Booking updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete booking
   * DELETE /api/bookings/:id
   * Security: Admin only
   */
  async deleteBooking(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const result = await query<Booking>('DELETE FROM bookings WHERE id = $1 RETURNING *', [id]);

      if (result.rows.length === 0) {
        sendError(res, 'Booking not found', 404);
        return;
      }

      sendSuccess(res, { booking: result.rows[0] }, 'Booking deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get booking statistics
   * GET /api/bookings/stats/summary
   * Security: Admin and moderator only
   */
  async getBookingStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { start_date, end_date } = req.query as { start_date?: string; end_date?: string };

      const dateClause = (offset: number): { sql: string; values: string[] } => {
        const conditions: string[] = [];
        const values: string[] = [];
        if (start_date) {
          values.push(start_date);
          conditions.push(`event_date >= $${offset + values.length}`);
        }
        if (end_date) {
          values.push(end_date);
          conditions.push(`event_date <= $${offset + values.length}`);
        }
        return { sql: conditions.length ? ` AND ${conditions.join(' AND ')}` : '', values };
      };

      const bookingsFilter = dateClause(0);
      const totalBookingsResult = await query<{ count: string }>(
        `SELECT COUNT(*) as count FROM bookings WHERE 1=1${bookingsFilter.sql}`,
        bookingsFilter.values
      );

      const revenueFilter = dateClause(1);
      const totalRevenueResult = await query<{ revenue: string }>(
        `SELECT COALESCE(SUM(total_amount), 0) as revenue FROM bookings WHERE status != $1${revenueFilter.sql}`,
        ['cancelled', ...revenueFilter.values]
      );

      const pendingFilter = dateClause(1);
      const pendingBookingsResult = await query<{ count: string }>(
        `SELECT COUNT(*) as count FROM bookings WHERE status = $1${pendingFilter.sql}`,
        ['pending', ...pendingFilter.values]
      );

      const confirmedFilter = dateClause(1);
      const confirmedBookingsResult = await query<{ count: string }>(
        `SELECT COUNT(*) as count FROM bookings WHERE status = $1${confirmedFilter.sql}`,
        ['confirmed', ...confirmedFilter.values]
      );

      const statusFilter = dateClause(0);
      const statusBreakdown = await query<{ status: string; count: string }>(
        `SELECT status, COUNT(*) as count FROM bookings WHERE 1=1${statusFilter.sql} GROUP BY status`,
        statusFilter.values
      );

      const venueFilter = dateClause(0);
      const venueBreakdown = await query<{ venue: string; count: string }>(
        `SELECT venue, COUNT(*) as count FROM bookings WHERE 1=1${venueFilter.sql} GROUP BY venue ORDER BY count DESC`,
        venueFilter.values
      );

      const eventTypeFilter = dateClause(0);
      const eventTypeBreakdown = await query<{ event_type: string; count: string }>(
        `SELECT event_type, COUNT(*) as count FROM bookings WHERE 1=1${eventTypeFilter.sql} GROUP BY event_type ORDER BY count DESC`,
        eventTypeFilter.values
      );

      const paymentStatusFilter = dateClause(0);
      const paymentStatusBreakdown = await query<{ payment_status: string; count: string }>(
        `SELECT payment_status, COUNT(*) as count FROM bookings WHERE 1=1${paymentStatusFilter.sql} GROUP BY payment_status`,
        paymentStatusFilter.values
      );

      sendSuccess(res, {
        total_bookings: parseInt(totalBookingsResult.rows[0].count),
        total_revenue: parseFloat(totalRevenueResult.rows[0].revenue || '0'),
        pending_bookings: parseInt(pendingBookingsResult.rows[0].count),
        confirmed_bookings: parseInt(confirmedBookingsResult.rows[0].count),
        status_breakdown: statusBreakdown.rows,
        venue_breakdown: venueBreakdown.rows,
        event_type_breakdown: eventTypeBreakdown.rows,
        payment_status_breakdown: paymentStatusBreakdown.rows,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Generate unique booking reference.
   * 32 bits of randomness keeps collisions negligible; the UNIQUE constraint
   * (23505) remains the backstop instead of a racy SELECT-then-insert.
   */
  private async generateBookingReference(): Promise<string> {
    return `BK-${randomBytes(4).toString('hex').toUpperCase()}`;
  }
}

export default new BookingController();
