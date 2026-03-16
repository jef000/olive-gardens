import { Request, Response, NextFunction } from 'express';
import { query } from '../db/pool';
import { UserResponse } from '../types/user';
import { sendSuccess, sendError } from '../utils/response';

/**
 * User Controller
 * Handles user-related operations using PostgreSQL
 */
export class UserController {
  /**
   * Get current user profile
   * GET /api/users/me
   */
  async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;

      const result = await query<UserResponse>(
        'SELECT id, email, role, created_at FROM users WHERE id = $1',
        [userId]
      );

      if (result.rows.length === 0) {
        sendError(res, 'User not found', 404);
        return;
      }

      sendSuccess(res, result.rows[0]);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all users (Admin only)
   * GET /api/users
   */
  async getAllUsers(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await query<UserResponse>(
        'SELECT id, email, role, created_at FROM users ORDER BY created_at DESC'
      );

      sendSuccess(res, result.rows);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user by ID (Admin only)
   * GET /api/users/:id
   */
  async getUserById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const result = await query<UserResponse>(
        'SELECT id, email, role, created_at FROM users WHERE id = $1',
        [id]
      );

      if (result.rows.length === 0) {
        sendError(res, 'User not found', 404);
        return;
      }

      sendSuccess(res, result.rows[0]);
    } catch (error) {
      next(error);
    }
  }
}

export default new UserController();
