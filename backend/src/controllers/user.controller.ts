import { Request, Response, NextFunction } from 'express';
import { query } from '../db/pool';
import { User, UserResponse } from '../types/user';
import { hashPassword } from '../utils/password';
import { sendSuccess, sendError } from '../utils/response';
import { sanitizeEmail } from '../utils/sanitize';
import { generateTemporaryPassword, getTempPasswordExpiry } from '../utils/tempPassword';
import { sendTemporaryPasswordEmail } from '../utils/email';
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
   * 
   * Security:
   * - Generates secure temporary password
   * - Sends temporary password via email
   * - Sets expiration time (24 hours by default)
   * - Forces password change on first login
   * - Logs user creation event
   */
  async createUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, role = 'user', expiryHours = 24 } = req.body;

      const sanitizedEmail = sanitizeEmail(email);

      // Check if user already exists
      const existingUser = await query<User>(
        'SELECT id FROM users WHERE email = $1',
        [sanitizedEmail]
      );

      if (existingUser.rows.length > 0) {
        sendError(res, 'User with this email already exists', 409);
        return;
      }

      // Generate secure temporary password
      const temporaryPassword = generateTemporaryPassword();
      const hashedPassword = await hashPassword(temporaryPassword);
      const tempPasswordExpiry = getTempPasswordExpiry(expiryHours);

      // Create user with temporary password flags
      const result = await query<UserResponse>(
        `INSERT INTO users (
          email, 
          password, 
          role, 
          is_temporary_password, 
          temp_password_expires_at, 
          must_change_password
        ) 
         VALUES ($1, $2, $3, TRUE, $4, TRUE) 
         RETURNING id, email, role, created_at`,
        [sanitizedEmail, hashedPassword, role, tempPasswordExpiry]
      );

      const newUser = result.rows[0];

      // Send temporary password via email
      try {
        await sendTemporaryPasswordEmail(sanitizedEmail, temporaryPassword, expiryHours);
        console.log(`✅ User created: ${sanitizedEmail} (ID: ${newUser.id})`);
      } catch (emailError) {
        console.error('Failed to send temporary password email:', emailError);
        // Rollback user creation if email fails
        await query('DELETE FROM users WHERE id = $1', [newUser.id]);
        sendError(
          res,
          'Failed to send temporary password email. User creation rolled back.',
          500
        );
        return;
      }

      sendSuccess(
        res,
        { 
          user: newUser,
          message: `User created successfully. Temporary password sent to ${sanitizedEmail}`,
        },
        'User created successfully',
        201
      );
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
   * Resend temporary password (Admin only)
   * POST /api/users/:id/resend-temporary-password
   * 
   * Security:
   * - Generates new secure temporary password
   * - Invalidates previous temporary password
   * - Resets expiration time
   * - Sends new password via email
   * - Logs password resend event
   */
  async resendTemporaryPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { expiryHours = 24 } = req.body;

      // Fetch user
      const userResult = await query<User>(
        'SELECT id, email, is_temporary_password FROM users WHERE id = $1',
        [id]
      );

      if (userResult.rows.length === 0) {
        sendError(res, 'User not found', 404);
        return;
      }

      const user = userResult.rows[0];

      // Generate new temporary password
      const temporaryPassword = generateTemporaryPassword();
      const hashedPassword = await hashPassword(temporaryPassword);
      const tempPasswordExpiry = getTempPasswordExpiry(expiryHours);

      // Update user with new temporary password
      await query(
        `UPDATE users 
         SET password = $1, 
             is_temporary_password = TRUE, 
             temp_password_expires_at = $2, 
             must_change_password = TRUE,
             failed_login_attempts = 0,
             account_locked_until = NULL
         WHERE id = $3`,
        [hashedPassword, tempPasswordExpiry, user.id]
      );

      // Send new temporary password via email
      try {
        await sendTemporaryPasswordEmail(user.email, temporaryPassword, expiryHours);
        console.log(`✅ Temporary password resent to: ${user.email} (ID: ${user.id})`);
      } catch (emailError) {
        console.error('Failed to send temporary password email:', emailError);
        sendError(
          res,
          'Failed to send temporary password email. Please try again.',
          500
        );
        return;
      }

      sendSuccess(
        res,
        { 
          message: `New temporary password sent to ${user.email}`,
        },
        'Temporary password resent successfully'
      );
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
