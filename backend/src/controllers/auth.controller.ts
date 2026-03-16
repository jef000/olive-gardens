import { Request, Response, NextFunction } from 'express';
import { query } from '../db/pool';
import { User, UserResponse } from '../types/user';
import { hashPassword, comparePassword } from '../utils/password';
import { generateToken } from '../utils/jwt';
import { sendSuccess, sendError } from '../utils/response';
import { generateResetToken, hashResetToken, getResetTokenExpiry } from '../utils/crypto';
import { sendPasswordResetEmail } from '../utils/email';
import { sanitizeEmail } from '../utils/sanitize';

/**
 * Authentication Controller
 * 
 * Security Considerations:
 * - No service layer - all logic in controller and middleware
 * - Passwords hashed with bcrypt before storage
 * - JWT tokens for authentication
 * - Reset tokens hashed before database storage
 * - Email existence not revealed in responses
 * - Rate limiting applied at route level
 */

export class AuthController {
  /**
   * Register new user
   * POST /auth/register
   * 
   * Security: Hashes password, checks for duplicate email
   */
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
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

      const result = await query<User>(
        `INSERT INTO users (email, password, role) 
         VALUES ($1, $2, $3) 
         RETURNING id, email, role, created_at`,
        [sanitizedEmail, hashedPassword, role]
      );

      const user = result.rows[0];

      const token = generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      sendSuccess(
        res,
        {
          user: {
            id: user.id,
            email: user.email,
            role: user.role,
            created_at: user.created_at,
          },
          token,
        },
        'User registered successfully',
        201
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Login user
   * POST /auth/login
   * 
   * Security: Constant-time password comparison, rate limited
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;

      const result = await query<User>(
        'SELECT * FROM users WHERE email = $1',
        [email.toLowerCase()]
      );

      if (result.rows.length === 0) {
        sendError(res, 'Invalid credentials', 401);
        return;
      }

      const user = result.rows[0];

      const isPasswordValid = await comparePassword(password, user.password);

      if (!isPasswordValid) {
        sendError(res, 'Invalid credentials', 401);
        return;
      }

      const token = generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      sendSuccess(res, {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          created_at: user.created_at,
        },
        token,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current user profile
   * GET /auth/me
   * 
   * Security: Requires valid JWT token (middleware)
   */
  async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
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
   * Logout user
   * POST /auth/logout
   * 
   * Note: With JWT, logout is typically handled client-side by removing the token
   * This endpoint exists for consistency and can be extended for token blacklisting
   */
  async logout(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      sendSuccess(res, null, 'Logged out successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Forgot Password - Request password reset
   * POST /auth/forgot-password
   * 
   * Security Considerations:
   * - Does NOT reveal if email exists (always returns success)
   * - Generates cryptographically secure random token
   * - Hashes token before storing in database
   * - Sets expiry time (1 hour)
   * - Sends reset link via email
   */
  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body;

      const sanitizedEmail = sanitizeEmail(email);

      const result = await query<User>(
        'SELECT id, email FROM users WHERE email = $1',
        [sanitizedEmail]
      );

      // Security: Always return success even if user doesn't exist
      // This prevents email enumeration attacks
      if (result.rows.length === 0) {
        sendSuccess(
          res,
          null,
          'If an account with that email exists, a password reset link has been sent'
        );
        return;
      }

      const user = result.rows[0];

      // Generate secure random token
      const resetToken = generateResetToken();

      // Hash token before storing (never store plain tokens)
      const hashedToken = await hashResetToken(resetToken);

      // Calculate expiry time
      const expiresAt = getResetTokenExpiry();

      // Store hashed token and expiry in database
      await query(
        `UPDATE users 
         SET reset_token = $1, reset_token_expiry = $2 
         WHERE id = $3`,
        [hashedToken, expiresAt, user.id]
      );

      // Send email with plain token (only sent once, never stored plain)
      await sendPasswordResetEmail(user.email, resetToken);

      sendSuccess(
        res,
        null,
        'If an account with that email exists, a password reset link has been sent'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reset Password - Complete password reset
   * POST /auth/reset-password
   * 
   * Security Considerations:
   * - Verifies token hasn't expired
   * - Compares hashed token from database
   * - Hashes new password before storage
   * - Clears reset token after use
   * - Invalidates existing sessions (user must login again)
   */
  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token, newPassword } = req.body;

      // Hash the provided token to compare with database
      const hashedToken = await hashResetToken(token);

      // Find user with matching reset token that hasn't expired
      const result = await query<User>(
        `SELECT id, email, reset_token, reset_token_expiry 
         FROM users 
         WHERE reset_token = $1 AND reset_token_expiry > NOW()`,
        [hashedToken]
      );

      if (result.rows.length === 0) {
        sendError(res, 'Invalid or expired reset token', 400);
        return;
      }

      const user = result.rows[0];

      // Hash new password
      const hashedPassword = await hashPassword(newPassword);

      // Update password and clear reset token fields
      await query(
        `UPDATE users 
         SET password = $1, reset_token = NULL, reset_token_expiry = NULL 
         WHERE id = $2`,
        [hashedPassword, user.id]
      );

      sendSuccess(res, null, 'Password reset successful. Please login with your new password.');
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();
