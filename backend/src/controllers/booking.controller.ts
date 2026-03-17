import { Request, Response, NextFunction } from 'express';
import { query } from '../db/pool';
import { Booking, CreateBookingDTO, UpdateBookingDTO, BookingFilters } from '../types/booking';
import { sendSuccess, sendError } from '../utils/response';

export class BookingController {
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

      sendSuccess(res, { booking: result.rows[0] }, 'Booking updated successfully');
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
