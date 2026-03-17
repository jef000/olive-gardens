export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';
export type PaymentStatus = 'unpaid' | 'partial' | 'paid' | 'refunded';
export type EventType = 'Wedding' | 'Corporate' | 'Workshop' | 'Session' | 'Conference' | 'Party' | 'Other';
export type Venue = 'Main Arena' | 'Garden Hall' | 'Therapy Room' | 'Conference Room';

export interface Booking {
  id: string;
  booking_reference: string;
  client_name: string;
  client_email: string;
  client_phone?: string;
  event_name: string;
  event_type: EventType;
  venue: Venue;
  event_date: string;
  start_time?: string;
  end_time?: string;
  total_amount: number;
  deposit_amount: number;
  balance_amount: number;
  status: BookingStatus;
  payment_status: PaymentStatus;
  guest_count?: number;
  special_requests?: string;
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateBookingDTO {
  client_name: string;
  client_email: string;
  client_phone?: string;
  event_name: string;
  event_type: EventType;
  venue: Venue;
  event_date: string;
  start_time?: string;
  end_time?: string;
  total_amount: number;
  deposit_amount: number;
  guest_count?: number;
  special_requests?: string;
  notes?: string;
}

export interface UpdateBookingDTO {
  client_name?: string;
  client_email?: string;
  client_phone?: string;
  event_name?: string;
  event_type?: EventType;
  venue?: Venue;
  event_date?: string;
  start_time?: string;
  end_time?: string;
  total_amount?: number;
  deposit_amount?: number;
  status?: BookingStatus;
  payment_status?: PaymentStatus;
  guest_count?: number;
  special_requests?: string;
  notes?: string;
}

export interface BookingStats {
  total_bookings: number;
  total_revenue: number;
  pending_bookings: number;
  confirmed_bookings: number;
  status_breakdown: { status: string; count: string }[];
  venue_breakdown: { venue: string; count: string }[];
  event_type_breakdown: { event_type: string; count: string }[];
  payment_status_breakdown: { payment_status: string; count: string }[];
}

export interface BookingFilters {
  status?: BookingStatus;
  venue?: Venue;
  event_type?: EventType;
  payment_status?: PaymentStatus;
  start_date?: string;
  end_date?: string;
  search?: string;
}
