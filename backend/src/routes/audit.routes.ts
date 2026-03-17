// Audit Routes
// API routes for audit log retrieval and management

import { Router } from 'express';
import auditController from '../controllers/audit.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

/**
 * All audit routes require authentication and admin role
 */
router.use(authenticate);
router.use(authorize('admin'));

/**
 * @route   GET /api/audit/logs
 * @desc    Get audit logs with filtering and pagination
 * @access  Admin only
 */
router.get('/logs', auditController.getAuditLogs.bind(auditController));

/**
 * @route   GET /api/audit/stats
 * @desc    Get audit statistics
 * @access  Admin only
 */
router.get('/stats', auditController.getAuditStats.bind(auditController));

/**
 * @route   GET /api/audit/recent
 * @desc    Get recent audit activity (last 7 days)
 * @access  Admin only
 */
router.get('/recent', auditController.getRecentActivity.bind(auditController));

/**
 * @route   GET /api/audit/failures
 * @desc    Get failed audit operations
 * @access  Admin only
 */
router.get('/failures', auditController.getFailedOperations.bind(auditController));

/**
 * @route   GET /api/audit/resource/:resourceType/:resourceId
 * @desc    Get audit history for a specific resource
 * @access  Admin only
 */
router.get('/resource/:resourceType/:resourceId', auditController.getResourceAuditHistory.bind(auditController));

/**
 * @route   GET /api/audit/user/:userId
 * @desc    Get audit history for a specific user
 * @access  Admin only
 */
router.get('/user/:userId', auditController.getUserAuditHistory.bind(auditController));

/**
 * @route   POST /api/audit/cleanup
 * @desc    Clean up old audit logs (admin only)
 * @access  Admin only
 */
router.post('/cleanup', auditController.cleanupOldLogs.bind(auditController));

export default router;
