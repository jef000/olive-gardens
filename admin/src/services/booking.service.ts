import api from '@/lib/api';
import type { ApiResponse } from '@/types';
import type { 
  Booking, 
  CreateBookingDTO, 
  UpdateBookingDTO, 
  BookingStats,
  BookingFilters 
} from '@/types/booking';

/**
 * Booking Service
 * Centralized API calls for booking management
 */
class BookingService {
  private readonly baseUrl = '/bookings';

  /**
   * Get all bookings with optional filters
   */
  async getBookings(filters?: BookingFilters): Promise<{ bookings: Booking[]; total: number }> {
    const params = new URLSearchParams();
    
    if (filters?.status) params.append('status', filters.status);
    if (filters?.venue) params.append('venue', filters.venue);
    if (filters?.event_type) params.append('event_type', filters.event_type);
    if (filters?.payment_status) params.append('payment_status', filters.payment_status);
    if (filters?.start_date) params.append('start_date', filters.start_date);
    if (filters?.end_date) params.append('end_date', filters.end_date);
    if (filters?.search) params.append('search', filters.search);

    const response = await api.get<ApiResponse<{ bookings: Booking[]; total: number }>>(
      `${this.baseUrl}?${params.toString()}`
    );
    return response.data.data;
  }

  /**
   * Get booking by ID
   */
  async getBookingById(id: string): Promise<Booking> {
    const response = await api.get<ApiResponse<{ booking: Booking }>>(
      `${this.baseUrl}/${id}`
    );
    return response.data.data.booking;
  }

  /**
   * Create new booking
   */
  async createBooking(data: CreateBookingDTO): Promise<Booking> {
    const response = await api.post<ApiResponse<{ booking: Booking }>>(
      this.baseUrl,
      data
    );
    return response.data.data.booking;
  }

  /**
   * Update existing booking
   */
  async updateBooking(id: string, data: UpdateBookingDTO): Promise<Booking> {
    const response = await api.put<ApiResponse<{ booking: Booking }>>(
      `${this.baseUrl}/${id}`,
      data
    );
    return response.data.data.booking;
  }

  /**
   * Delete booking
   */
  async deleteBooking(id: string): Promise<void> {
    await api.delete(`${this.baseUrl}/${id}`);
  }

  /**
   * Get booking statistics
   */
  async getStats(): Promise<BookingStats> {
    const response = await api.get<ApiResponse<BookingStats>>(
      `${this.baseUrl}/stats/summary`
    );
    return response.data.data;
  }

  /**
   * Update booking status
   */
  async updateStatus(id: string, status: string): Promise<Booking> {
    return this.updateBooking(id, { status: status as any });
  }

  /**
   * Update payment status
   */
  async updatePaymentStatus(id: string, paymentStatus: string): Promise<Booking> {
    return this.updateBooking(id, { payment_status: paymentStatus as any });
  }
}

export default new BookingService();
