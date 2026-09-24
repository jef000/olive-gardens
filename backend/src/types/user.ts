export interface User {
  id: string;
  email: string;
  password: string;
  role: 'user' | 'admin' | 'moderator';
  reset_token: string | null;
  reset_token_expiry: Date | null;
  is_temporary_password: boolean;
  temp_password_expires_at: Date | null;
  must_change_password: boolean;
  password_changed_at: Date | null;
  failed_login_attempts: number;
  account_locked_until: Date | null;
  created_at: Date;
  updated_at: Date;
  mfa_enabled?: boolean;
  mfa_secret?: string | null;
  mfa_backup_codes?: string | null;
}

export interface UserResponse {
  id: string;
  email: string;
  role: string;
  created_at: Date;
  mfa_enabled?: boolean;
}
