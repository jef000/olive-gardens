export interface User {
  id: string;
  email: string;
  role: 'user' | 'admin' | 'moderator';
  created_at: string;
  mfa_enabled?: boolean;
  must_change_password?: boolean;
}

export interface Inquiry {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  message: string;
  status: 'new' | 'read' | 'replied' | 'archived';
  created_at: string;
  updated_at: string;
}

export type ReplyStatus = 'queued' | 'sent' | 'failed';

export interface InquiryReply {
  id: string;
  inquiryId: string;
  toEmail: string;
  subject: string;
  body: string;
  status: ReplyStatus;
  error: string | null;
  attempts: number;
  sentAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token?: string;
    must_change_password?: boolean;
    message?: string;
    mfa_required?: boolean;
    mfa_token?: string;
  };
}

export interface Booking {
  id: string;
  user_id: string;
  venue_id: string;
  booking_date: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  guests: number;
  total_amount: number;
  created_at: string;
  updated_at: string;
  user?: User;
}

export interface GalleryImage {
  id: string;
  url: string;
  album: string;
  caption: string;
  created_at: string;
}

export interface DashboardStats {
  totalBookings: number;
  totalRevenue: number;
  totalUsers: number;
  pendingBookings: number;
  recentBookings: Booking[];
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}
