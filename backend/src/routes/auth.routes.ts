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
import { authRateLimiter } from '../middleware/enhancedRateLimiter';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

/**
 * Authentication Routes
 * All routes are rate-limited to prevent brute force attacks
 */

// POST /auth/register - Register new user
router.post(
  '/register',
  authRateLimiter,
  validate(registerSchema),
  authController.register.bind(authController)
);

// POST /auth/login - Login user
router.post(
  '/login',
  authRateLimiter,
  validate(loginSchema),
  authController.login.bind(authController)
);

router.post('/refresh', authRateLimiter, authController.refresh.bind(authController));

// GET /auth/me - Get current user (protected)
router.get('/me', authenticate, authController.getMe.bind(authController));

// POST /auth/logout - Logout user
router.post('/logout', authController.logout.bind(authController));

router.post('/mfa/setup', authenticate, authController.setupMFA.bind(authController));
router.post('/mfa/verify', authenticate, authController.verifyMFA.bind(authController));
router.post('/mfa/validate', authRateLimiter, authController.validateMFA.bind(authController));
router.post('/mfa/backup-code', authRateLimiter, authController.validateBackupCode.bind(authController));
router.post('/mfa/disable', authenticate, authController.disableMFA.bind(authController));

// POST /auth/forgot-password - Request password reset
router.post(
  '/forgot-password',
  authRateLimiter,
  validate(forgotPasswordSchema),
  authController.forgotPassword.bind(authController)
);

// POST /auth/reset-password - Reset password with token
router.post(
  '/reset-password',
  authRateLimiter,
  validate(resetPasswordSchema),
  authController.resetPassword.bind(authController)
);

// POST /auth/change-password - Change password (protected)
router.post(
  '/change-password',
  authenticate,
  authRateLimiter,
  validate(changePasswordSchema),
  authController.changePassword.bind(authController)
);

export default router;
