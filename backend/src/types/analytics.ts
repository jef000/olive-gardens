export interface AnalyticsEvent {
  id: string;
  event_type: string;
  event_category?: string;
  event_action?: string;
  event_label?: string;
  event_data?: Record<string, any>;
  user_id?: string;
  session_id?: string;
  ip_address?: string;
  user_agent?: string;
  page_url?: string;
  page_title?: string;
  referrer?: string;
  value?: number;
  duration?: number;
  created_at: Date;
}

export interface CreateAnalyticsEventDTO {
  event_type: string;
  event_category?: string;
  event_action?: string;
  event_label?: string;
  event_data?: Record<string, any>;
  session_id?: string;
  page_url?: string;
  page_title?: string;
  referrer?: string;
  value?: number;
  duration?: number;
}

export interface AnalyticsMetrics {
  total_bookings: number;
  total_revenue: number;
  total_users: number;
  total_events: number;
  bookings_by_status: Record<string, number>;
  bookings_by_venue: Record<string, number>;
  bookings_by_type: Record<string, number>;
  revenue_by_month: Array<{ month: string; revenue: number }>;
  booking_trends: Array<{ date: string; count: number }>;
}

export interface DateRange {
  start_date?: string;
  end_date?: string;
}
