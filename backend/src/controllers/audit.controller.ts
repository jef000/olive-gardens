// Audit Controller
// Handles audit log retrieval and statistics endpoints

import { Request, Response, NextFunction } from 'express';
import { AuditService } from '../services/audit.service';
import { sendSuccess } from '../utils/response';
import { AuditLogFilters, AuditResourceType } from '../types/audit';

export class AuditController {
  /**
   * Get audit logs with filtering and pagination
   * GET /api/audit/logs
   */
  async getAuditLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters: AuditLogFilters = {
        user_id: req.query.user_id as string,
        user_email: req.query.user_email as string,
        action: req.query.action as any,
        resource_type: req.query.resource_type as any,
        resource_id: req.query.resource_id as string,
        status: req.query.status as any,
        start_date: req.query.start_date as string,
        end_date: req.query.end_date as string,
        ip_address: req.query.ip_address as string,
        search: req.query.search as string,
        page: Math.max(1, parseInt(req.query.page as string) || 1),
        limit: Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50)),
        sort_by: (req.query.sort_by as any) || 'timestamp',
        sort_order: (req.query.sort_order as any) || 'desc',
      };

      const result = await AuditService.getAuditLogs(filters);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get audit statistics
   * GET /api/audit/stats
   */
  async getAuditStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters = {
        start_date: req.query.start_date as string,
        end_date: req.query.end_date as string,
      };

      const stats = await AuditService.getAuditStats(filters);
      sendSuccess(res, stats);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get audit history for a specific resource
   * GET /api/audit/resource/:resourceType/:resourceId
   */
  async getResourceAuditHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { resourceType, resourceId } = req.params;
      const limit = Math.min(500, Math.max(1, parseInt(req.query.limit as string) || 50));

      const logs = await AuditService.getResourceAuditHistory(
        resourceType as AuditResourceType,
        resourceId,
        limit
      );

      sendSuccess(res, { logs, total: logs.length });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get audit history for a specific user
   * GET /api/audit/user/:userId
   */
  async getUserAuditHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;
      const limit = Math.min(500, Math.max(1, parseInt(req.query.limit as string) || 50));

      const logs = await AuditService.getUserAuditHistory(userId, limit);
      sendSuccess(res, { logs, total: logs.length });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get recent audit activity (last 7 days)
   * GET /api/audit/recent
   */
  async getRecentActivity(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = Math.min(500, Math.max(1, parseInt(req.query.limit as string) || 100));
      
      const filters: AuditLogFilters = {
        start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        limit,
        sort_by: 'timestamp',
        sort_order: 'desc',
      };

      const result = await AuditService.getAuditLogs(filters);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get failed audit operations
   * GET /api/audit/failures
   */
  async getFailedOperations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = Math.min(500, Math.max(1, parseInt(req.query.limit as string) || 100));
      
      const filters: AuditLogFilters = {
        status: 'failure' as any,
        limit,
        sort_by: 'timestamp',
        sort_order: 'desc',
      };

      const result = await AuditService.getAuditLogs(filters);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Clean up old audit logs (admin only)
   * POST /api/audit/cleanup
   */
  async cleanupOldLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // A negative or missing retention would delete the whole tamper trail.
      const requested = Number(req.body.retention_days);
      const retentionDays = Number.isFinite(requested) && requested >= 1 ? Math.min(3650, Math.floor(requested)) : 365;
      const deletedCount = await AuditService.cleanupOldLogs(retentionDays);
      
      sendSuccess(res, {
        message: `Successfully cleaned up ${deletedCount} old audit logs`,
        deleted_count: deletedCount,
        retention_days: retentionDays,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AuditController();
