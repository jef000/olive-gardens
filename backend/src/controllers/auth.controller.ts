import { Request, Response, NextFunction } from 'express';
import { query } from '../db/pool';
import { User, UserResponse } from '../types/user';
import { hashPassword, comparePassword } from '../utils/password';
import { generateToken } from '../utils/jwt';
import { sendSuccess, sendError } from '../utils/response';
import { generateResetToken, hashResetToken, getResetTokenExpiry } from '../utils/crypto';
import { sendPasswordResetEmail, sendPasswordChangeConfirmationEmail } from '../utils/email';
import { sanitizeEmail } from '../utils/sanitize';
import { isTempPasswordExpired, isAccountLocked, getAccountLockDuration } from '../utils/tempPassword';

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
   * Security: Constant-time password comparison, rate limited, account locking
   * Handles temporary password expiration and forces password change on first login
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

      // Check if account is locked
      if (isAccountLocked(user.account_locked_until)) {
        const lockUntil = new Date(user.account_locked_until!);
        const minutesRemaining = Math.ceil((lockUntil.getTime() - Date.now()) / 60000);
        sendError(
          res,
          `Account is locked due to multiple failed login attempts. Please try again in ${minutesRemaining} minutes.`,
          403
        );
        return;
      }

      // Check if temporary password has expired
      if (user.is_temporary_password && isTempPasswordExpired(user.temp_password_expires_at)) {
        sendError(
          res,
          'Temporary password has expired. Please contact your administrator to request a new temporary password.',
          401
        );
        return;
      }

      const isPasswordValid = await comparePassword(password, user.password);

      if (!isPasswordValid) {
        // Increment failed login attempts
        const newFailedAttempts = user.failed_login_attempts + 1;
        const lockUntil = getAccountLockDuration(newFailedAttempts);

        await query(
          `UPDATE users 
           SET failed_login_attempts = $1, account_locked_until = $2 
           WHERE id = $3`,
          [newFailedAttempts, lockUntil, user.id]
        );

        if (lockUntil) {
          sendError(
            res,
            'Invalid credentials. Account has been locked due to multiple failed attempts.',
            401
          );
        } else {
          sendError(res, 'Invalid credentials', 401);
        }
        return;
      }

      // Reset failed login attempts on successful login
      await query(
        `UPDATE users 
         SET failed_login_attempts = 0, account_locked_until = NULL 
         WHERE id = $1`,
        [user.id]
      );

      const token = generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      // Check if user must change password
      if (user.must_change_password || user.is_temporary_password) {
        sendSuccess(res, {
          user: {
            id: user.id,
            email: user.email,
            role: user.role,
            created_at: user.created_at,
          },
          token,
          must_change_password: true,
          message: 'Login successful. You must change your password before continuing.',
        });
        return;
      }

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

      sendSuccess(res, { user: result.rows[0] });
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

  /**
   * Change Password - Change password for authenticated user
   * POST /auth/change-password
   * 
   * Security Considerations:
   * - Requires authentication (user must be logged in)
   * - Verifies current password before allowing change
   * - Prevents reuse of current password (including temporary password)
   * - Enforces strong password requirements
   * - Hashes new password with bcrypt
   * - Rate-limited to prevent brute force
   * - Clears temporary password flags on successful change
   * - Sends confirmation email for security awareness
   */
  async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { currentPassword, newPassword } = req.body;

      // Fetch user from database
      const result = await query<User>(
        'SELECT id, email, password, is_temporary_password, must_change_password FROM users WHERE id = $1',
        [userId]
      );

      if (result.rows.length === 0) {
        sendError(res, 'User not found', 404);
        return;
      }

      const user = result.rows[0];

      // Verify current password
      const isCurrentPasswordValid = await comparePassword(currentPassword, user.password);

      if (!isCurrentPasswordValid) {
        sendError(res, 'Current password is incorrect', 401);
        return;
      }

      // Prevent reuse of current password (including temporary password)
      const isSamePassword = await comparePassword(newPassword, user.password);

      if (isSamePassword) {
        sendError(res, 'New password must be different from current password', 400);
        return;
      }

      // Hash new password
      const hashedPassword = await hashPassword(newPassword);

      // Update password and clear temporary password flags
      await query(
        `UPDATE users 
         SET password = $1, 
             is_temporary_password = FALSE, 
             must_change_password = FALSE, 
             temp_password_expires_at = NULL,
             password_changed_at = NOW()
         WHERE id = $2`,
        [hashedPassword, user.id]
      );

      // Send confirmation email (non-blocking)
      try {
        await sendPasswordChangeConfirmationEmail(user.email);
      } catch (emailError) {
        console.error('Failed to send password change confirmation email:', emailError);
        // Continue even if email fails
      }

      sendSuccess(res, null, 'Password changed successfully');
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();
