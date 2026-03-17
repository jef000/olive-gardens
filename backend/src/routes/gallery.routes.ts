import { Router } from 'express';
import galleryController from '../controllers/gallery.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

/**
 * Gallery Routes
 * Public routes for viewing, authenticated routes for management
 */

// GET /gallery/stats/summary - Get gallery statistics (Admin/Moderator only)
router.get(
  '/stats/summary',
  authenticate,
  authorize('admin', 'moderator'),
  galleryController.getGalleryStats.bind(galleryController)
);

// GET /gallery/album/:album - Get images by album
router.get(
  '/album/:album',
  galleryController.getImagesByAlbum.bind(galleryController)
);

// PATCH /gallery/:id/featured - Toggle featured status (Admin/Moderator only)
router.patch(
  '/:id/featured',
  authenticate,
  authorize('admin', 'moderator'),
  galleryController.toggleFeatured.bind(galleryController)
);

// PATCH /gallery/:id/publish - Toggle published status (Admin/Moderator only)
router.patch(
  '/:id/publish',
  authenticate,
  authorize('admin', 'moderator'),
  galleryController.togglePublished.bind(galleryController)
);

// GET /gallery/:id - Get image by ID
router.get(
  '/:id',
  galleryController.getImageById.bind(galleryController)
);

// GET /gallery - Get all images with filters
router.get(
  '/',
  galleryController.getAllImages.bind(galleryController)
);

// POST /gallery - Create new image (Admin/Moderator only)
router.post(
  '/',
  authenticate,
  authorize('admin', 'moderator'),
  galleryController.createImage.bind(galleryController)
);

// PUT /gallery/:id - Update image (Admin/Moderator only)
router.put(
  '/:id',
  authenticate,
  authorize('admin', 'moderator'),
  galleryController.updateImage.bind(galleryController)
);

// DELETE /gallery/:id - Delete image (Admin only)
router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  galleryController.deleteImage.bind(galleryController)
);

export default router;
