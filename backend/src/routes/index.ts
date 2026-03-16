import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';

const router = Router();

/**
 * API Routes
 * Centralized route configuration
 */

router.use('/auth', authRoutes);
router.use('/users', userRoutes);

// Health check endpoint
router.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

export default router;
