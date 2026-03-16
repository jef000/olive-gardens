import { Router } from 'express';
import userController from '../controllers/user.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

/**
 * User Routes
 * All routes require authentication
 */

// GET /users/me - Get current user profile
router.get('/me', authenticate, userController.getProfile.bind(userController));

// GET /users - Get all users (Admin only)
router.get(
  '/',
  authenticate,
  authorize('admin'),
  userController.getAllUsers.bind(userController)
);

// GET /users/:id - Get user by ID (Admin only)
router.get(
  '/:id',
  authenticate,
  authorize('admin'),
  userController.getUserById.bind(userController)
);

export default router;
