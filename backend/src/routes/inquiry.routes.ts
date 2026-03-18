import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { sendSuccess, sendError } from '../utils/response';
import { query } from '../db/pool';
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

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

      sendSuccess(res, { inquiryId: (result.rows[0] as any).id }, 'Inquiry sent successfully', 201);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
