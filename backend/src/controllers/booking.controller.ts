import { Request, Response, NextFunction } from 'express';
import { query } from '../db/pool';
import { Booking, CreateBookingDTO, UpdateBookingDTO, BookingFilters } from '../types/booking';
import { sendSuccess, sendError } from '../utils/response';
import notificationService from '../services/notification.service';

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
        event_name: string;
      }>(
        `SELECT event_date, status, event_name
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
            label: row.event_name,
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
      const {
        status,
        venue,
        event_type,
        payment_status,
        start_date,
        end_date,
        search,
      } = req.query as BookingFilters;

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

      queryText += ' ORDER BY event_date DESC, created_at DESC';

      const result = await query<Booking>(queryText, queryParams);

      sendSuccess(res, {
        bookings: result.rows,
        total: result.rows.length,
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

      const result = await query<Booking>(
        'SELECT * FROM bookings WHERE id = $1',
        [id]
      );

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

      const result = await query<Booking>(
        'SELECT * FROM bookings WHERE booking_reference = $1',
        [reference]
      );

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

      const bookingReference = await this.generateBookingReference();

      const balanceAmount = bookingData.total_amount - (bookingData.deposit_amount || 0);

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
          bookingData.total_amount,
          bookingData.deposit_amount || 0,
          balanceAmount,
          bookingData.guest_count,
          bookingData.special_requests,
          bookingData.notes,
          userId,
        ]
      );

      // Send notification to admins/moderators
      await notificationService.notifyBookingEvent(
        'booking_created',
        result.rows[0].id,
        bookingReference,
        bookingData.client_name,
        bookingData.event_name,
        'high'
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

      const existingBooking = await query<Booking>(
        'SELECT * FROM bookings WHERE id = $1',
        [id]
      );

      if (existingBooking.rows.length === 0) {
        sendError(res, 'Booking not found', 404);
        return;
      }

      const updates: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      Object.entries(updateData).forEach(([key, value]) => {
        if (value !== undefined) {
          updates.push(`${key} = $${paramCount}`);
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
        const notifType = updateData.status === 'confirmed' 
          ? 'booking_confirmed' 
          : updateData.status === 'cancelled'
          ? 'booking_cancelled'
          : updateData.status === 'completed'
          ? 'booking_completed'
          : 'booking_updated';

        await notificationService.notifyBookingEvent(
          notifType,
          booking.id,
          booking.booking_reference,
          booking.client_name,
          booking.event_name,
          updateData.status === 'confirmed' || updateData.status === 'cancelled' ? 'high' : 'medium'
        );
      } else {
        // General update notification
        await notificationService.notifyBookingEvent(
          'booking_updated',
          booking.id,
          booking.booking_reference,
          booking.client_name,
          booking.event_name,
          'medium'
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

      const result = await query<Booking>(
        'DELETE FROM bookings WHERE id = $1 RETURNING *',
        [id]
      );

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
  async getBookingStats(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const totalBookingsResult = await query<{ count: string }>('SELECT COUNT(*) as count FROM bookings');
      const totalRevenueResult = await query<{ revenue: string }>('SELECT SUM(total_amount) as revenue FROM bookings WHERE status != $1', ['cancelled']);
      const pendingBookingsResult = await query<{ count: string }>('SELECT COUNT(*) as count FROM bookings WHERE status = $1', ['pending']);
      const confirmedBookingsResult = await query<{ count: string }>('SELECT COUNT(*) as count FROM bookings WHERE status = $1', ['confirmed']);

      const statusBreakdown = await query<{ status: string; count: string }>(
        'SELECT status, COUNT(*) as count FROM bookings GROUP BY status'
      );

      const venueBreakdown = await query<{ venue: string; count: string }>(
        'SELECT venue, COUNT(*) as count FROM bookings GROUP BY venue ORDER BY count DESC'
      );

      const eventTypeBreakdown = await query<{ event_type: string; count: string }>(
        'SELECT event_type, COUNT(*) as count FROM bookings GROUP BY event_type ORDER BY count DESC'
      );

      const paymentStatusBreakdown = await query<{ payment_status: string; count: string }>(
        'SELECT payment_status, COUNT(*) as count FROM bookings GROUP BY payment_status'
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
   * Generate unique booking reference
   */
  private async generateBookingReference(): Promise<string> {
    const prefix = 'BK';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const reference = `${prefix}-${timestamp}${random}`;

    const existing = await query(
      'SELECT id FROM bookings WHERE booking_reference = $1',
      [reference]
    );

    if (existing.rows.length > 0) {
      return this.generateBookingReference();
    }

    return reference;
  }
}

export default new BookingController();
