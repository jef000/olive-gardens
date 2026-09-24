// Audit Service
// Centralized service for creating and managing audit logs

import { query } from '../db/pool';
import {
  AuditLog,
  CreateAuditLogDTO,
  AuditLogFilters,
  AuditLogResponse,
  AuditStats,
  AuditAction,
  AuditResourceType,
  AuditStatus,
} from '../types/audit';

export class AuditService {
  /** Write the normalized security record used for request correlation and compliance reporting. */
  static async createDetailedAuditLog(data: {
    userId?: string;
    sessionId?: string;
    requestId: string;
    operationType: string;
    resourceType?: string;
    resourceId?: string;
    httpMethod: string;
    endpoint: string;
    ipAddress?: string;
    userAgent?: string;
    statusCode: number;
    success: boolean;
    errorMessage?: string;
    changes?: Record<string, unknown>;
  }): Promise<void> {
    try {
      await query(
        `INSERT INTO audit_detailed (
          user_id, session_id, request_id, operation_type, resource_type, resource_id,
          http_method, endpoint, ip_address, user_agent, status_code, success,
          error_message, changes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
        [
          data.userId || null,
          data.sessionId || null,
          data.requestId,
          data.operationType,
          data.resourceType || null,
          data.resourceId || null,
          data.httpMethod,
          data.endpoint,
          data.ipAddress || null,
          data.userAgent || null,
          data.statusCode,
          data.success,
          data.errorMessage || null,
          data.changes ? JSON.stringify(data.changes) : null,
        ]
      );
    } catch (error) {
      // Audit failures must never turn a successful API request into a 500. This also
      // keeps deployments compatible while the audit_detailed migration is pending.
      console.error('Failed to create detailed audit log:', error);
    }
  }

  /**
   * Create a new audit log entry
   */
  static async createAuditLog(data: CreateAuditLogDTO): Promise<AuditLog> {
    const {
      user_id,
      user_email,
      user_role,
      action,
      resource_type,
      resource_id,
      ip_address,
      user_agent,
      endpoint,
      http_method,
      description,
      changes,
      metadata,
      status = AuditStatus.SUCCESS,
      error_message,
      duration_ms,
    } = data;

    const result = await query<AuditLog>(
      `INSERT INTO audit_logs (
        user_id, user_email, user_role,
        action, resource_type, resource_id,
        ip_address, user_agent, endpoint, http_method,
        description, changes, metadata,
        status, error_message, duration_ms
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *`,
      [
        user_id || null,
        user_email || null,
        user_role || null,
        action,
        resource_type,
        resource_id || null,
        ip_address || null,
        user_agent || null,
        endpoint || null,
        http_method || null,
        description || null,
        changes ? JSON.stringify(changes) : null,
        metadata ? JSON.stringify(metadata) : null,
        status,
        error_message || null,
        duration_ms || null,
      ]
    );

    return result.rows[0];
  }

  /**
   * Log a successful operation
   */
  static async logSuccess(
    action: AuditAction,
    resourceType: AuditResourceType,
    resourceId: string | undefined,
    userId: string | undefined,
    userEmail: string | undefined,
    userRole: string | undefined,
    context: {
      ip_address?: string;
      user_agent?: string;
      endpoint?: string;
      http_method?: string;
      description?: string;
      changes?: Record<string, any>;
      metadata?: Record<string, any>;
      duration_ms?: number;
    }
  ): Promise<AuditLog> {
    return this.createAuditLog({
      user_id: userId,
      user_email: userEmail,
      user_role: userRole,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      status: AuditStatus.SUCCESS,
      ...context,
    });
  }

  /**
   * Log a failed operation
   */
  static async logFailure(
    action: AuditAction,
    resourceType: AuditResourceType,
    error: Error,
    userId: string | undefined,
    userEmail: string | undefined,
    userRole: string | undefined,
    context: {
      ip_address?: string;
      user_agent?: string;
      endpoint?: string;
      http_method?: string;
      description?: string;
      metadata?: Record<string, any>;
      duration_ms?: number;
    }
  ): Promise<AuditLog> {
    return this.createAuditLog({
      user_id: userId,
      user_email: userEmail,
      user_role: userRole,
      action,
      resource_type: resourceType,
      status: AuditStatus.FAILURE,
      error_message: error.message,
      ...context,
    });
  }

  /**
   * Get audit logs with filtering and pagination
   */
  static async getAuditLogs(filters: AuditLogFilters): Promise<AuditLogResponse> {
    const {
      user_id,
      user_email,
      action,
      resource_type,
      resource_id,
      status,
      start_date,
      end_date,
      ip_address,
      search,
      page = 1,
      limit = 50,
      sort_by = 'timestamp',
      sort_order = 'desc',
    } = filters;

    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (user_id) {
      conditions.push(`user_id = $${paramIndex++}`);
      params.push(user_id);
    }

    if (user_email) {
      conditions.push(`user_email ILIKE $${paramIndex++}`);
      params.push(`%${user_email}%`);
    }

    if (action) {
      if (Array.isArray(action)) {
        conditions.push(`action = ANY($${paramIndex++})`);
        params.push(action);
      } else {
        conditions.push(`action = $${paramIndex++}`);
        params.push(action);
      }
    }

    if (resource_type) {
      if (Array.isArray(resource_type)) {
        conditions.push(`resource_type = ANY($${paramIndex++})`);
        params.push(resource_type);
      } else {
        conditions.push(`resource_type = $${paramIndex++}`);
        params.push(resource_type);
      }
    }

    if (resource_id) {
      conditions.push(`resource_id = $${paramIndex++}`);
      params.push(resource_id);
    }

    if (status) {
      conditions.push(`status = $${paramIndex++}`);
      params.push(status);
    }

    if (start_date) {
      conditions.push(`timestamp >= $${paramIndex++}`);
      params.push(start_date);
    }

    if (end_date) {
      conditions.push(`timestamp <= $${paramIndex++}`);
      params.push(end_date);
    }

    if (ip_address) {
      conditions.push(`ip_address = $${paramIndex++}`);
      params.push(ip_address);
    }

    if (search) {
      conditions.push(`(description ILIKE $${paramIndex} OR endpoint ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM audit_logs ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // Get paginated results
    const offset = (page - 1) * limit;

    // Never interpolate raw query strings: order by a known column and direction.
    const sortableColumns = ['timestamp', 'action', 'resource_type', 'resource_id', 'user_email', 'status', 'duration_ms'];
    const safeSortBy = sortableColumns.includes(sort_by) ? sort_by : 'timestamp';
    const safeSortOrder = sort_order === 'asc' || sort_order === 'desc' ? sort_order.toUpperCase() : 'DESC';
    const orderBy = `ORDER BY ${safeSortBy} ${safeSortOrder}`;

    const logsResult = await query<AuditLog>(
      `SELECT * FROM audit_logs ${whereClause} ${orderBy} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    return {
      logs: logsResult.rows,
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
    };
  }

  /**
   * Get audit statistics
   */
  static async getAuditStats(filters?: {
    start_date?: Date | string;
    end_date?: Date | string;
  }): Promise<AuditStats> {
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (filters?.start_date) {
      conditions.push(`timestamp >= $${paramIndex++}`);
      params.push(filters.start_date);
    }

    if (filters?.end_date) {
      conditions.push(`timestamp <= $${paramIndex++}`);
      params.push(filters.end_date);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const andPrefix = conditions.length > 0 ? `${whereClause} AND` : 'WHERE';

    // Total logs
    const totalResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM audit_logs ${whereClause}`,
      params
    );

    // Logs by action
    const actionResult = await query<{ action: string; count: string }>(
      `SELECT action, COUNT(*) as count FROM audit_logs ${whereClause} GROUP BY action ORDER BY count DESC`,
      params
    );

    // Logs by resource type
    const resourceResult = await query<{ resource_type: string; count: string }>(
      `SELECT resource_type, COUNT(*) as count FROM audit_logs ${whereClause} GROUP BY resource_type ORDER BY count DESC`,
      params
    );

    // Logs by status
    const statusResult = await query<{ status: string; count: string }>(
      `SELECT status, COUNT(*) as count FROM audit_logs ${whereClause} GROUP BY status ORDER BY count DESC`,
      params
    );

    // Logs by user
    const userResult = await query<{ user_email: string; count: string }>(
      `SELECT user_email, COUNT(*) as count FROM audit_logs ${andPrefix} user_email IS NOT NULL GROUP BY user_email ORDER BY count DESC LIMIT 10`,
      params
    );

    // Recent failures (last 24 hours)
    const failuresResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM audit_logs WHERE status = 'failure' AND timestamp >= NOW() - INTERVAL '24 hours'`,
      []
    );

    // Average duration
    const durationResult = await query<{ avg_duration: string }>(
      `SELECT AVG(duration_ms) as avg_duration FROM audit_logs ${andPrefix} duration_ms IS NOT NULL`,
      params
    );

    return {
      total_logs: parseInt(totalResult.rows[0].count),
      logs_by_action: actionResult.rows.map((row: { action: string; count: string }) => ({
        action: row.action,
        count: parseInt(row.count),
      })),
      logs_by_resource: resourceResult.rows.map(
        (row: { resource_type: string; count: string }) => ({
          resource_type: row.resource_type,
          count: parseInt(row.count),
        })
      ),
      logs_by_status: statusResult.rows.map((row: { status: string; count: string }) => ({
        status: row.status,
        count: parseInt(row.count),
      })),
      logs_by_user: userResult.rows.map((row: { user_email: string; count: string }) => ({
        user_email: row.user_email,
        count: parseInt(row.count),
      })),
      recent_failures: parseInt(failuresResult.rows[0].count),
      average_duration_ms: parseFloat(durationResult.rows[0].avg_duration || '0'),
    };
  }

  /**
   * Get audit logs for a specific resource
   */
  static async getResourceAuditHistory(
    resourceType: AuditResourceType,
    resourceId: string,
    limit: number = 50
  ): Promise<AuditLog[]> {
    const result = await query<AuditLog>(
      `SELECT * FROM audit_logs 
       WHERE resource_type = $1 AND resource_id = $2 
       ORDER BY timestamp DESC 
       LIMIT $3`,
      [resourceType, resourceId, limit]
    );

    return result.rows;
  }

  /**
   * Get audit logs for a specific user
   */
  static async getUserAuditHistory(userId: string, limit: number = 50): Promise<AuditLog[]> {
    const result = await query<AuditLog>(
      `SELECT * FROM audit_logs 
       WHERE user_id = $1 
       ORDER BY timestamp DESC 
       LIMIT $2`,
      [userId, limit]
    );

    return result.rows;
  }

  /**
   * Clean up old audit logs based on retention policy
   */
  static async cleanupOldLogs(retentionDays: number = 365): Promise<number> {
    const result = await query<{ cleanup_old_audit_logs: number }>(
      `SELECT cleanup_old_audit_logs($1) as cleanup_old_audit_logs`,
      [retentionDays]
    );

    return result.rows[0].cleanup_old_audit_logs;
  }
}
