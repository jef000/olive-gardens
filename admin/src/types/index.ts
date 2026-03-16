export interface User {
  id: string;
  email: string;
  role: 'user' | 'admin' | 'moderator';
  created_at: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
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
