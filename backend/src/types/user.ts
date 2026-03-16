export interface User {
  id: string;
  email: string;
  password: string;
  role: 'user' | 'admin' | 'moderator';
  reset_token: string | null;
  reset_token_expiry: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface UserResponse {
  id: string;
  email: string;
  role: string;
  created_at: Date;
}
