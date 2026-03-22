import { Router, Request, Response, NextFunction } from 'express';
import { body, param, validationResult } from 'express-validator';
import { sendSuccess, sendError } from '../utils/response';
import { query } from '../db/pool';
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { inquiryController } from '../controllers/inquiry.controller';

const router = Router();
const window = new JSDOM('').window;
const purify = DOMPurify(window);

/**
 * Public Routes
 */

// POST /api/inquiries/public - Create new contact inquiry
router.post(
  '/public',
  [
    body('first_name')
      .trim()
      .notEmpty()
      .withMessage('First name is required')
      .isLength({ max: 100 }),
    body('last_name').trim().notEmpty().withMessage('Last name is required').isLength({ max: 100 }),
    body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('phone').optional({ checkFalsy: true }).trim().isLength({ max: 20 }),
    body('message').trim().notEmpty().withMessage('Message is required').isLength({ max: 2000 }),
  ],
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        sendError(res, 'Validation error', 400, errors.array() as any);
        return;
      }

      const { first_name, last_name, email, phone, message } = req.body;
      const cleanMessage = purify.sanitize(message);

      const result = await query(
        `INSERT INTO inquiries (
          first_name, 
          last_name, 
          email, 
          phone, 
          message,
          status
        ) VALUES ($1, $2, $3, $4, $5, 'new') RETURNING id`,
        [first_name, last_name, email, phone || null, cleanMessage]
      );

      // In a real app, we might want to trigger an email notification to admins here.
      const inquiryId = (result.rows[0] as any).id;
      
      // Notify admins about the new inquiry
      import('../services/notification.service').then(module => {
        const notificationService = module.default;
        notificationService.notifyInquiryEvent(
          inquiryId,
          `${first_name} ${last_name}`,
          email
        ).catch(err => console.error('Failed to send inquiry notification:', err));
      });

      sendSuccess(res, { inquiryId }, 'Inquiry sent successfully', 201);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Admin Routes (Protected)
 */

// GET /api/inquiries
router.get(
  '/',
  authenticate,
  authorize('admin', 'moderator'),
  inquiryController.getInquiries
);

// GET /api/inquiries/:id
router.get(
  '/:id',
  authenticate,
  authorize('admin', 'moderator'),
  [param('id').isUUID().withMessage('Invalid ID format')],
  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      sendError(res, 'Validation error', 400, errors.array() as any);
      return;
    }
    next();
  },
  inquiryController.getInquiry
);

// PATCH /api/inquiries/:id/status
router.patch(
  '/:id/status',
  authenticate,
  authorize('admin', 'moderator'),
  [
    param('id').isUUID().withMessage('Invalid ID format'),
    body('status').isIn(['new', 'read', 'replied', 'archived']).withMessage('Invalid status')
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      sendError(res, 'Validation error', 400, errors.array() as any);
      return;
    }
    next();
  },
  inquiryController.updateStatus
);

// DELETE /api/inquiries/:id
router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  [param('id').isUUID().withMessage('Invalid ID format')],
  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      sendError(res, 'Validation error', 400, errors.array() as any);
      return;
    }
    next();
  },
  inquiryController.deleteInquiry
);

export default router;
