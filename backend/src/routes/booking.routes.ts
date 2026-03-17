import { Router } from 'express';
import bookingController from '../controllers/booking.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

/**
 * Public Routes
 */

// POST /bookings/public - Create new booking from frontend
router.post(
  '/public',
  bookingController.createBooking.bind(bookingController)
);

/**
 * Admin Routes
 * All routes require authentication and admin/moderator access
 */

// GET /bookings/stats/summary - Get booking statistics
router.get(
  '/stats/summary',
  authenticate,
  authorize('admin', 'moderator'),
  bookingController.getBookingStats.bind(bookingController)
);

// GET /bookings/reference/:reference - Get booking by reference
router.get(
  '/reference/:reference',
  authenticate,
  authorize('admin', 'moderator'),
  bookingController.getBookingByReference.bind(bookingController)
);

// GET /bookings/:id - Get booking by ID
router.get(
  '/:id',
  authenticate,
  authorize('admin', 'moderator'),
  bookingController.getBookingById.bind(bookingController)
);

// GET /bookings - Get all bookings with filters
router.get(
  '/',
  authenticate,
  authorize('admin', 'moderator'),
  bookingController.getAllBookings.bind(bookingController)
);

// POST /bookings - Create new booking
router.post(
  '/',
  authenticate,
  authorize('admin', 'moderator'),
  bookingController.createBooking.bind(bookingController)
);

// PUT /bookings/:id - Update booking
router.put(
  '/:id',
  authenticate,
  authorize('admin', 'moderator'),
  bookingController.updateBooking.bind(bookingController)
);

// DELETE /bookings/:id - Delete booking
router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  bookingController.deleteBooking.bind(bookingController)
);

export default router;
