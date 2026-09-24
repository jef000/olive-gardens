import { Router } from 'express';
import pricingController from '../controllers/pricing.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate';
import { updateServicePricesSchema } from '../validators/pricing.validator';

const router = Router();

/**
 * Service Pricing Routes
 * Public: the website reads price labels.
 * Admin: edits them from the operations portal.
 */

// GET /pricing - Get all service price labels
router.get('/', pricingController.getAllPrices.bind(pricingController));

// PUT /pricing - Bulk update price labels (Admin only)
router.put(
  '/',
  authenticate,
  authorize('admin'),
  validate(updateServicePricesSchema),
  pricingController.updatePrices.bind(pricingController)
);

export default router;
