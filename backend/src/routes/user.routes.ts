import { Router } from 'express';
import userController from '../controllers/user.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate';
import { createUserSchema, resendTemporaryPasswordSchema, updateUserSchema } from '../validators/user.validator';

const router = Router();

/**
 * User Routes
 * All routes require authentication
 */

// GET /users/me - Get current user profile
router.get('/me', authenticate, userController.getProfile.bind(userController));

// GET /users/stats/summary - Get user statistics (Admin only)
router.get(
  '/stats/summary',
  authenticate,
  authorize('admin'),
  userController.getUserStats.bind(userController)
);

// GET /users - Get all users (Admin only)
router.get(
  '/',
  authenticate,
  authorize('admin'),
  userController.getAllUsers.bind(userController)
);

// POST /users - Create new user (Admin only)
router.post(
  '/',
  authenticate,
  authorize('admin'),
  validate(createUserSchema),
  userController.createUser.bind(userController)
);

// GET /users/:id - Get user by ID (Admin only)
router.get(
  '/:id',
  authenticate,
  authorize('admin'),
  userController.getUserById.bind(userController)
);

// PUT /users/:id - Update user (Admin only)
router.put(
  '/:id',
  authenticate,
  authorize('admin'),
  validate(updateUserSchema),
  userController.updateUser.bind(userController)
);

// POST /users/:id/resend-temporary-password - Resend temporary password (Admin only)
router.post(
  '/:id/resend-temporary-password',
  authenticate,
  authorize('admin'),
  validate(resendTemporaryPasswordSchema),
  userController.resendTemporaryPassword.bind(userController)
);

// DELETE /users/:id - Delete user (Admin only)
router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  userController.deleteUser.bind(userController)
);

export default router;
