import { Router } from 'express';
import authController from '../controllers/auth.controller';
import { validate } from '../middleware/validate';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from '../validators/auth.validator';
import { authLimiter } from '../middleware/rateLimiter';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

/**
 * Authentication Routes
 * All routes are rate-limited to prevent brute force attacks
 */

// POST /auth/register - Register new user
router.post(
  '/register',
  authLimiter,
  validate(registerSchema),
  authController.register.bind(authController)
);

// POST /auth/login - Login user
router.post(
  '/login',
  authLimiter,
  validate(loginSchema),
  authController.login.bind(authController)
);

// GET /auth/me - Get current user (protected)
router.get('/me', authenticate, authController.getMe.bind(authController));

// POST /auth/logout - Logout user
router.post('/logout', authController.logout.bind(authController));

// POST /auth/forgot-password - Request password reset
router.post(
  '/forgot-password',
  authLimiter,
  validate(forgotPasswordSchema),
  authController.forgotPassword.bind(authController)
);

// POST /auth/reset-password - Reset password with token
router.post(
  '/reset-password',
  authLimiter,
  validate(resetPasswordSchema),
  authController.resetPassword.bind(authController)
);

// POST /auth/change-password - Change password (protected)
router.post(
  '/change-password',
  authenticate,
  authLimiter,
  validate(changePasswordSchema),
  authController.changePassword.bind(authController)
);

export default router;
