import { Request, Response, NextFunction } from 'express';
import { query } from '../db/pool';
import { GalleryImage, CreateGalleryImageDTO, UpdateGalleryImageDTO, GalleryFilters } from '../types/gallery';
import { sendSuccess, sendError } from '../utils/response';

export class GalleryController {
  /**
   * Get all gallery images with optional filters
   * GET /api/gallery
   * Security: Public or authenticated based on is_published
   */
  async getAllImages(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        album,
        category,
        is_featured,
        is_published,
        search,
      } = req.query as GalleryFilters;

      let queryText = 'SELECT * FROM gallery_images WHERE 1=1';
      const queryParams: any[] = [];
      let paramCount = 1;

      if (!req.user) {
        queryText += ' AND is_published = true';
      }

      if (album) {
        queryText += ` AND album = $${paramCount}`;
        queryParams.push(album);
        paramCount++;
      }

      if (category) {
        queryText += ` AND category = $${paramCount}`;
        queryParams.push(category);
        paramCount++;
      }

      if (is_featured !== undefined) {
        queryText += ` AND is_featured = $${paramCount}`;
        queryParams.push(String(is_featured) === 'true');
        paramCount++;
      }

      if (is_published !== undefined && req.user) {
        queryText += ` AND is_published = $${paramCount}`;
        queryParams.push(String(is_published) === 'true');
        paramCount++;
      }

      if (search) {
        queryText += ` AND (title ILIKE $${paramCount} OR description ILIKE $${paramCount})`;
        queryParams.push(`%${search}%`);
        paramCount++;
      }

      queryText += ' ORDER BY is_featured DESC, created_at DESC';

      const result = await query<GalleryImage>(queryText, queryParams);

      sendSuccess(res, {
        images: result.rows,
        total: result.rows.length,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get image by ID
   * GET /api/gallery/:id
   */
  async getImageById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      let queryText = 'SELECT * FROM gallery_images WHERE id = $1';
      const queryParams: any[] = [id];

      if (!req.user) {
        queryText += ' AND is_published = true';
      }

      const result = await query<GalleryImage>(queryText, queryParams);

      if (result.rows.length === 0) {
        sendError(res, 'Image not found', 404);
        return;
      }

      sendSuccess(res, { image: result.rows[0] });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get images by album
   * GET /api/gallery/album/:album
   */
  async getImagesByAlbum(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { album } = req.params;

      let queryText = 'SELECT * FROM gallery_images WHERE album = $1';
      const queryParams: any[] = [album];

      if (!req.user) {
        queryText += ' AND is_published = true';
      }

      queryText += ' ORDER BY is_featured DESC, created_at DESC';

      const result = await query<GalleryImage>(queryText, queryParams);

      sendSuccess(res, {
        album,
        images: result.rows,
        total: result.rows.length,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Upload new gallery image from multipart form data
   * POST /api/gallery/upload
   * Security: Admin and moderator only
   */
  async uploadImage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        sendError(res, 'No image file provided', 400);
        return;
      }

      const { title, description, album, category, tags, is_featured, is_published } = req.body;
      const userId = req.user?.userId;

      // Construct URL paths based on the file saved by multer
      // In a real production app, this would upload to S3/Cloudinary and get their URLs
      const url = `/uploads/${req.file.filename}`;
      const thumbnailUrl = url; // For MVP, using same image for thumbnail

      const result = await query<GalleryImage>(
        `INSERT INTO gallery_images (
          title, description, url, thumbnail_url, album, category, tags,
          file_size, file_type, width, height, is_featured, is_published, uploaded_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *`,
        [
          title || req.file.originalname,
          description || '',
          url,
          thumbnailUrl,
          album || 'Other',
          category || 'General',
          tags ? (typeof tags === 'string' ? JSON.parse(tags) : tags) : [],
          req.file.size,
          req.file.mimetype,
          0, // Would need image processing library to get actual dimensions
          0,
          is_featured === 'true' || is_featured === true,
          is_published !== undefined ? (is_published === 'true' || is_published === true) : true,
          userId,
        ]
      );

      sendSuccess(res, { image: result.rows[0] }, 'Image uploaded successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create new gallery image
   * POST /api/gallery
   * Security: Admin and moderator only
   */
  async createImage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const imageData: CreateGalleryImageDTO = req.body;
      const userId = req.user?.userId;

      const result = await query<GalleryImage>(
        `INSERT INTO gallery_images (
          title, description, url, thumbnail_url, album, category, tags,
          file_size, file_type, width, height, is_featured, is_published, uploaded_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *`,
        [
          imageData.title,
          imageData.description,
          imageData.url,
          imageData.thumbnail_url,
          imageData.album,
          imageData.category,
          imageData.tags || [],
          imageData.file_size,
          imageData.file_type,
          imageData.width,
          imageData.height,
          imageData.is_featured || false,
          imageData.is_published !== undefined ? imageData.is_published : true,
          userId,
        ]
      );

      sendSuccess(res, { image: result.rows[0] }, 'Image uploaded successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update gallery image
   * PUT /api/gallery/:id
   * Security: Admin and moderator only
   */
  async updateImage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const updateData: UpdateGalleryImageDTO = req.body;

      const existingImage = await query<GalleryImage>(
        'SELECT * FROM gallery_images WHERE id = $1',
        [id]
      );

      if (existingImage.rows.length === 0) {
        sendError(res, 'Image not found', 404);
        return;
      }

      const updates: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      Object.entries(updateData).forEach(([key, value]) => {
        if (value !== undefined) {
          updates.push(`${key} = $${paramCount}`);
          values.push(value);
          paramCount++;
        }
      });

      if (updates.length === 0) {
        sendError(res, 'No valid fields to update', 400);
        return;
      }

      values.push(id);

      const result = await query<GalleryImage>(
        `UPDATE gallery_images SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
        values
      );

      sendSuccess(res, { image: result.rows[0] }, 'Image updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete gallery image
   * DELETE /api/gallery/:id
   * Security: Admin only
   */
  async deleteImage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const result = await query<GalleryImage>(
        'DELETE FROM gallery_images WHERE id = $1 RETURNING *',
        [id]
      );

      if (result.rows.length === 0) {
        sendError(res, 'Image not found', 404);
        return;
      }

      sendSuccess(res, { image: result.rows[0] }, 'Image deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get gallery statistics
   * GET /api/gallery/stats/summary
   * Security: Admin and moderator only
   */
  async getGalleryStats(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const totalImagesResult = await query<{ count: string }>('SELECT COUNT(*) as count FROM gallery_images');
      const publishedImagesResult = await query<{ count: string }>('SELECT COUNT(*) as count FROM gallery_images WHERE is_published = true');
      const featuredImagesResult = await query<{ count: string }>('SELECT COUNT(*) as count FROM gallery_images WHERE is_featured = true');

      const albumBreakdown = await query<{ album: string; count: string }>(
        'SELECT album, COUNT(*) as count FROM gallery_images GROUP BY album ORDER BY count DESC'
      );

      const totalStorageResult = await query<{ total_size: string }>(
        'SELECT SUM(file_size) as total_size FROM gallery_images'
      );

      sendSuccess(res, {
        total_images: parseInt(totalImagesResult.rows[0].count),
        published_images: parseInt(publishedImagesResult.rows[0].count),
        featured_images: parseInt(featuredImagesResult.rows[0].count),
        album_breakdown: albumBreakdown.rows,
        total_storage_bytes: parseInt(totalStorageResult.rows[0].total_size || '0'),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Toggle featured status
   * PATCH /api/gallery/:id/featured
   * Security: Admin and moderator only
   */
  async toggleFeatured(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const result = await query<GalleryImage>(
        'UPDATE gallery_images SET is_featured = NOT is_featured WHERE id = $1 RETURNING *',
        [id]
      );

      if (result.rows.length === 0) {
        sendError(res, 'Image not found', 404);
        return;
      }

      sendSuccess(res, { image: result.rows[0] }, 'Featured status updated');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Toggle published status
   * PATCH /api/gallery/:id/publish
   * Security: Admin and moderator only
   */
  async togglePublished(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const result = await query<GalleryImage>(
        'UPDATE gallery_images SET is_published = NOT is_published WHERE id = $1 RETURNING *',
        [id]
      );

      if (result.rows.length === 0) {
        sendError(res, 'Image not found', 404);
        return;
      }

      sendSuccess(res, { image: result.rows[0] }, 'Published status updated');
    } catch (error) {
      next(error);
    }
  }
}

export default new GalleryController();
