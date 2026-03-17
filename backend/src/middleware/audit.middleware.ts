// Audit Logging Middleware
// Automatically tracks and logs all HTTP requests for audit trail

import { Request, Response, NextFunction } from 'express';
import { AuditService } from '../services/audit.service';
import { AuditAction, AuditResourceType, AuditStatus } from '../types/audit';

// Extend Express Request to include audit context
declare global {
  namespace Express {
    interface Request {
      auditContext?: {
        startTime: number;
        action?: AuditAction;
        resourceType?: AuditResourceType;
        resourceId?: string;
      };
    }
  }
}

/**
 * Extract IP address from request, considering proxies
 */
function getClientIp(req: Request): string | undefined {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket.remoteAddress;
}

/**
 * Map HTTP method and path to audit action
 */
function mapToAuditAction(method: string, path: string): AuditAction {
  const normalizedMethod = method.toUpperCase();
  
  // Authentication endpoints
  if (path.includes('/auth/login')) return AuditAction.LOGIN;
  if (path.includes('/auth/logout')) return AuditAction.LOGOUT;
  if (path.includes('/auth/reset-password')) return AuditAction.PASSWORD_RESET;
  if (path.includes('/auth/change-password')) return AuditAction.PASSWORD_CHANGE;
  
  // File operations
  if (path.includes('/upload')) return AuditAction.UPLOAD;
  if (path.includes('/download')) return AuditAction.DOWNLOAD;
  if (path.includes('/export')) return AuditAction.EXPORT;
  if (path.includes('/import')) return AuditAction.IMPORT;
  
  // Status changes
  if (path.includes('/approve')) return AuditAction.APPROVE;
  if (path.includes('/reject')) return AuditAction.REJECT;
  if (path.includes('/cancel')) return AuditAction.CANCEL;
  if (path.includes('/restore')) return AuditAction.RESTORE;
  
  // Standard CRUD operations
  switch (normalizedMethod) {
    case 'POST':
      return AuditAction.CREATE;
    case 'GET':
      return AuditAction.READ;
    case 'PUT':
    case 'PATCH':
      return AuditAction.UPDATE;
    case 'DELETE':
      return AuditAction.DELETE;
    default:
      return AuditAction.READ;
  }
}

/**
 * Map path to resource type
 */
function mapToResourceType(path: string): AuditResourceType {
  if (path.includes('/users')) return AuditResourceType.USER;
  if (path.includes('/bookings')) return AuditResourceType.BOOKING;
  if (path.includes('/gallery')) return AuditResourceType.GALLERY;
  if (path.includes('/analytics')) return AuditResourceType.ANALYTICS;
  if (path.includes('/auth')) return AuditResourceType.AUTH;
  return AuditResourceType.SYSTEM;
}

/**
 * Extract resource ID from path or request body
 */
function extractResourceId(req: Request): string | undefined {
  // Try to extract from path parameters
  if (req.params.id) return req.params.id;
  if (req.params.userId) return req.params.userId;
  if (req.params.bookingId) return req.params.bookingId;
  if (req.params.imageId) return req.params.imageId;
  
  // Try to extract from body for create operations
  if (req.body?.id) return req.body.id;
  
  return undefined;
}

/**
 * Middleware to initialize audit context at the start of request
 */
export const auditContextMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Initialize audit context
  req.auditContext = {
    startTime: Date.now(),
    action: mapToAuditAction(req.method, req.path),
    resourceType: mapToResourceType(req.path),
    resourceId: extractResourceId(req),
  };
  
  next();
};

/**
 * Middleware to log audit trail after request completion
 */
export const auditLogMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Skip audit logging for certain paths
  const skipPaths = ['/health', '/metrics', '/favicon.ico', '/static'];
  if (skipPaths.some(path => req.path.includes(path))) {
    return next();
  }

  // Store original response methods
  const originalJson = res.json.bind(res);
  const originalSend = res.send.bind(res);

  // Override res.json to capture response
  res.json = function (body: any): Response {
    logAudit(req, res, body);
    return originalJson(body);
  };

  // Override res.send to capture response
  res.send = function (body: any): Response {
    logAudit(req, res, body);
    return originalSend(body);
  };

  next();
};

/**
 * Helper function to log audit entry
 */
async function logAudit(req: Request, res: Response, responseBody?: any): Promise<void> {
  try {
    const duration = req.auditContext ? Date.now() - req.auditContext.startTime : 0;
    const statusCode = res.statusCode;
    const isSuccess = statusCode >= 200 && statusCode < 400;

    // Extract user information from request (assuming auth middleware sets req.user)
    const user = (req as any).user;
    const userId = user?.id;
    const userEmail = user?.email;
    const userRole = user?.role;

    // Determine if we should log this request
    // Skip logging for READ operations on analytics (too verbose)
    if (req.auditContext?.action === AuditAction.READ && 
        req.auditContext?.resourceType === AuditResourceType.ANALYTICS) {
      return;
    }

    // Build description
    let description = `${req.method} ${req.path}`;
    if (req.auditContext?.resourceId) {
      description += ` (ID: ${req.auditContext.resourceId})`;
    }

    // Extract changes for UPDATE/DELETE operations
    let changes: Record<string, any> | undefined;
    if (req.auditContext?.action === AuditAction.UPDATE && req.body) {
      changes = { ...req.body };
      // Remove sensitive fields
      if (changes) {
        delete changes.password;
        delete changes.reset_token;
      }
    }

    // Build metadata
    const metadata: Record<string, any> = {
      query: req.query,
      statusCode,
      userAgent: req.headers['user-agent'],
    };

    // Add response data for certain operations
    if (responseBody && typeof responseBody === 'object') {
      if (responseBody.data?.id) {
        metadata.resultId = responseBody.data.id;
      }
    }

    // Create audit log entry
    await AuditService.createAuditLog({
      user_id: userId,
      user_email: userEmail,
      user_role: userRole,
      action: req.auditContext?.action || AuditAction.READ,
      resource_type: req.auditContext?.resourceType || AuditResourceType.SYSTEM,
      resource_id: req.auditContext?.resourceId,
      ip_address: getClientIp(req),
      user_agent: req.headers['user-agent'],
      endpoint: req.path,
      http_method: req.method,
      description,
      changes,
      metadata,
      status: isSuccess ? AuditStatus.SUCCESS : AuditStatus.FAILURE,
      error_message: !isSuccess && responseBody?.message ? responseBody.message : undefined,
      duration_ms: duration,
    });
  } catch (error) {
    // Don't fail the request if audit logging fails
    console.error('Failed to create audit log:', error);
  }
}

/**
 * Manual audit logging helper for use in controllers
 */
export async function logManualAudit(
  req: Request,
  action: AuditAction,
  resourceType: AuditResourceType,
  resourceId: string | undefined,
  options?: {
    description?: string;
    changes?: Record<string, any>;
    metadata?: Record<string, any>;
    status?: AuditStatus;
    errorMessage?: string;
  }
): Promise<void> {
  try {
    const user = (req as any).user;
    const duration = req.auditContext ? Date.now() - req.auditContext.startTime : 0;

    await AuditService.createAuditLog({
      user_id: user?.id,
      user_email: user?.email,
      user_role: user?.role,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      ip_address: getClientIp(req),
      user_agent: req.headers['user-agent'],
      endpoint: req.path,
      http_method: req.method,
      description: options?.description,
      changes: options?.changes,
      metadata: options?.metadata,
      status: options?.status || AuditStatus.SUCCESS,
      error_message: options?.errorMessage,
      duration_ms: duration,
    });
  } catch (error) {
    console.error('Failed to create manual audit log:', error);
  }
}
