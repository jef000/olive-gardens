import { Request, Response, NextFunction } from 'express';
import { query } from '../db/pool';
import { User, UserResponse } from '../types/user';
import { sendSuccess, sendError } from '../utils/response';
import { hashPassword } from '../utils/password';
import { sanitizeEmail } from '../utils/sanitize';
import notificationService from '../services/notification.service';

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
  async getAllUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { role, search } = req.query;

      let queryText = 'SELECT id, email, role, created_at, updated_at FROM users WHERE 1=1';
      const queryParams: any[] = [];
      let paramCount = 1;

      if (role) {
        queryText += ` AND role = $${paramCount}`;
        queryParams.push(role);
        paramCount++;
      }

      if (search) {
        queryText += ` AND email ILIKE $${paramCount}`;
        queryParams.push(`%${search}%`);
        paramCount++;
      }

      queryText += ' ORDER BY created_at DESC';

      const result = await query<UserResponse>(queryText, queryParams);

      sendSuccess(res, {
        users: result.rows,
        total: result.rows.length,
      });
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
        'SELECT id, email, role, created_at, updated_at FROM users WHERE id = $1',
        [id]
      );

      if (result.rows.length === 0) {
        sendError(res, 'User not found', 404);
        return;
      }

      sendSuccess(res, { user: result.rows[0] });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create new user (Admin only)
   * POST /api/users
   */
  async createUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password, role = 'user' } = req.body;

      const sanitizedEmail = sanitizeEmail(email);

      const existingUser = await query<User>(
        'SELECT id FROM users WHERE email = $1',
        [sanitizedEmail]
      );

      if (existingUser.rows.length > 0) {
        sendError(res, 'User with this email already exists', 409);
        return;
      }

      const hashedPassword = await hashPassword(password);

      const result = await query<UserResponse>(
        `INSERT INTO users (email, password, role) 
         VALUES ($1, $2, $3) 
         RETURNING id, email, role, created_at`,
        [sanitizedEmail, hashedPassword, role]
      );

      sendSuccess(res, { user: result.rows[0] }, 'User created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user (Admin only)
   * PUT /api/users/:id
   */
  async updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { email, password, role } = req.body;

      const existingUser = await query<User>(
        'SELECT * FROM users WHERE id = $1',
        [id]
      );

      if (existingUser.rows.length === 0) {
        sendError(res, 'User not found', 404);
        return;
      }

      const updates: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      if (email) {
        const sanitizedEmail = sanitizeEmail(email);
        const emailCheck = await query<User>(
          'SELECT id FROM users WHERE email = $1 AND id != $2',
          [sanitizedEmail, id]
        );

        if (emailCheck.rows.length > 0) {
          sendError(res, 'Email already in use by another user', 409);
          return;
        }

        updates.push(`email = $${paramCount}`);
        values.push(sanitizedEmail);
        paramCount++;
      }

      if (password) {
        const hashedPassword = await hashPassword(password);
        updates.push(`password = $${paramCount}`);
        values.push(hashedPassword);
        paramCount++;
      }

      if (role) {
        updates.push(`role = $${paramCount}`);
        values.push(role);
        paramCount++;
      }

      if (updates.length === 0) {
        sendError(res, 'No valid fields to update', 400);
        return;
      }

      values.push(id);

      const result = await query<UserResponse>(
        `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount} 
         RETURNING id, email, role, created_at, updated_at`,
        values
      );

      // Notify admins about user update
      await notificationService.notifyUserEvent(
        'user_updated',
        result.rows[0].id,
        result.rows[0].email,
        result.rows[0].role,
        'low'
      );

      sendSuccess(res, { user: result.rows[0] }, 'User updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete user (Admin only)
   * DELETE /api/users/:id
   */
  async deleteUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const currentUserId = req.user?.userId;

      if (id === currentUserId) {
        sendError(res, 'Cannot delete your own account', 400);
        return;
      }

      const result = await query<UserResponse>(
        'DELETE FROM users WHERE id = $1 RETURNING id, email, role',
        [id]
      );

      if (result.rows.length === 0) {
        sendError(res, 'User not found', 404);
        return;
      }

      // Notify admins about user deletion
      await notificationService.notifyUserEvent(
        'user_deleted',
        result.rows[0].id,
        result.rows[0].email,
        result.rows[0].role,
        'medium'
      );

      sendSuccess(res, { user: result.rows[0] }, 'User deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user statistics (Admin only)
   * GET /api/users/stats/summary
   */
  async getUserStats(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const totalUsersResult = await query<{ count: string }>('SELECT COUNT(*) as count FROM users');
      
      const roleBreakdown = await query<{ role: string; count: string }>(
        'SELECT role, COUNT(*) as count FROM users GROUP BY role'
      );

      const recentUsersResult = await query<{ count: string }>(
        `SELECT COUNT(*) as count FROM users 
         WHERE created_at >= NOW() - INTERVAL '30 days'`
      );

      sendSuccess(res, {
        total_users: parseInt(totalUsersResult.rows[0].count),
        role_breakdown: roleBreakdown.rows,
        recent_users: parseInt(recentUsersResult.rows[0].count),
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new UserController();
