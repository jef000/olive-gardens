export interface Booking {
  id: string;
  booking_reference: string;
  client_name: string;
  client_email: string;
  client_phone?: string;
  event_name: string;
  event_type: 'Wedding' | 'Corporate' | 'Workshop' | 'Session' | 'Conference' | 'Party' | 'Other';
  venue: 'Main Arena' | 'Garden Hall' | 'Therapy Room' | 'Conference Room';
  event_date: Date;
  start_time?: string;
  end_time?: string;
  total_amount: number;
  deposit_amount: number;
  balance_amount: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  payment_status: 'unpaid' | 'partial' | 'paid' | 'refunded';
  guest_count?: number;
  special_requests?: string;
  notes?: string;
  created_by?: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateBookingDTO {
  client_name: string;
  client_email: string;
  client_phone?: string;
  event_name: string;
  event_type: string;
  venue: string;
  event_date: string;
  start_time?: string;
  end_time?: string;
  total_amount: number;
  deposit_amount?: number;
  guest_count?: number;
  special_requests?: string;
  notes?: string;
}

export interface UpdateBookingDTO {
  client_name?: string;
  client_email?: string;
  client_phone?: string;
  event_name?: string;
  event_type?: string;
  venue?: string;
  event_date?: string;
  start_time?: string;
  end_time?: string;
  total_amount?: number;
  deposit_amount?: number;
  balance_amount?: number;
  status?: string;
  payment_status?: string;
  guest_count?: number;
  special_requests?: string;
  notes?: string;
}

export interface BookingFilters {
  status?: string;
  venue?: string;
  event_type?: string;
  payment_status?: string;
  start_date?: string;
  end_date?: string;
  search?: string;
}
