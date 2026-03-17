// Audit Trail Types
// Comprehensive type definitions for audit logging system

export enum AuditAction {
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  PASSWORD_RESET = 'PASSWORD_RESET',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  UPLOAD = 'UPLOAD',
  DOWNLOAD = 'DOWNLOAD',
  EXPORT = 'EXPORT',
  IMPORT = 'IMPORT',
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  CANCEL = 'CANCEL',
  RESTORE = 'RESTORE',
}

export enum AuditResourceType {
  USER = 'USER',
  BOOKING = 'BOOKING',
  GALLERY = 'GALLERY',
  ANALYTICS = 'ANALYTICS',
  AUTH = 'AUTH',
  SYSTEM = 'SYSTEM',
}

export enum AuditStatus {
  SUCCESS = 'success',
  FAILURE = 'failure',
  PENDING = 'pending',
}

export interface AuditLog {
  id: string;
  
  // WHO
  user_id?: string;
  user_email?: string;
  user_role?: string;
  
  // WHAT
  action: AuditAction;
  resource_type: AuditResourceType;
  resource_id?: string;
  
  // WHEN
  timestamp: Date;
  
  // WHERE
  ip_address?: string;
  user_agent?: string;
  endpoint?: string;
  http_method?: string;
  
  // WHY/DETAILS
  description?: string;
  changes?: Record<string, any>;
  metadata?: Record<string, any>;
  
  // STATUS
  status: AuditStatus;
  error_message?: string;
  
  // PERFORMANCE
  duration_ms?: number;
  
  created_at: Date;
}

export interface CreateAuditLogDTO {
  // WHO
  user_id?: string;
  user_email?: string;
  user_role?: string;
  
  // WHAT
  action: AuditAction;
  resource_type: AuditResourceType;
  resource_id?: string;
  
  // WHERE
  ip_address?: string;
  user_agent?: string;
  endpoint?: string;
  http_method?: string;
  
  // WHY/DETAILS
  description?: string;
  changes?: Record<string, any>;
  metadata?: Record<string, any>;
  
  // STATUS
  status?: AuditStatus;
  error_message?: string;
  
  // PERFORMANCE
  duration_ms?: number;
}

export interface AuditLogFilters {
  user_id?: string;
  user_email?: string;
  action?: AuditAction | AuditAction[];
  resource_type?: AuditResourceType | AuditResourceType[];
  resource_id?: string;
  status?: AuditStatus;
  start_date?: Date | string;
  end_date?: Date | string;
  ip_address?: string;
  search?: string;
  page?: number;
  limit?: number;
  sort_by?: 'timestamp' | 'action' | 'resource_type' | 'status';
  sort_order?: 'asc' | 'desc';
}

export interface AuditLogResponse {
  logs: AuditLog[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface AuditStats {
  total_logs: number;
  logs_by_action: Array<{ action: string; count: number }>;
  logs_by_resource: Array<{ resource_type: string; count: number }>;
  logs_by_status: Array<{ status: string; count: number }>;
  logs_by_user: Array<{ user_email: string; count: number }>;
  recent_failures: number;
  average_duration_ms: number;
}

// Request extension for audit context
export interface AuditContext {
  start_time: number;
  user_id?: string;
  user_email?: string;
  user_role?: string;
}
