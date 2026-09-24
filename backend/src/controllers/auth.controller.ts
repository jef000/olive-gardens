import { Request, Response, NextFunction } from 'express';
import { query } from '../db/pool';
import { User, UserResponse } from '../types/user';
import { hashPassword, comparePassword } from '../utils/password';
import { sendSuccess, sendError } from '../utils/response';
import { generateResetToken, hashResetToken, getResetTokenExpiry } from '../utils/crypto';
import { sendPasswordResetEmail, sendPasswordChangeConfirmationEmail } from '../utils/email';
import { sanitizeEmail } from '../utils/sanitize';
import {
  isTempPasswordExpired,
  isAccountLocked,
  getAccountLockDuration,
} from '../utils/tempPassword';
import tokenService, { JwtPayload } from '../services/token.service';
import csrfService from '../services/csrf.service';
import sessionService from '../services/session.service';
import { clearAuthCookies, getCookie, setAuthCookies } from '../utils/cookies';
import { randomUUID, createHash } from 'crypto';
import redisClient from '../db/redis';

const MFA_ATTEMPT_LIMIT = 5;
const MFA_ATTEMPT_WINDOW_SECONDS = 15 * 60;
const MFA_CHALLENGE_MARKER_KEY = 'mfa:challenge:used';

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
  private async establishSession(
    req: Request,
    res: Response,
    payload: JwtPayload,
    user: User,
    message?: string,
    statusCode = 200
  ): Promise<void> {
    const sessionId = randomUUID();
    const tokens = await tokenService.generateTokenPair(payload);
    await sessionService.createSession(sessionId, payload, {
      device: req.get('user-agent') || 'unknown',
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('user-agent') || 'unknown',
    });
    const csrfToken = await csrfService.generateToken(sessionId);

    setAuthCookies(res, tokens.accessToken, tokens.refreshToken, sessionId);
    res.setHeader('X-CSRF-Token', csrfToken);

    sendSuccess(
      res,
      {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          created_at: user.created_at,
        },
        ...(user.must_change_password || user.is_temporary_password
          ? { must_change_password: true }
          : {}),
      },
      message,
      statusCode
    );
  }

  /**
   * Register new user
   * POST /auth/register
   *
   * Security: Hashes password, checks for duplicate email
   */
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Self-registration always creates a standard user. Privileged roles can
      // only be granted by an existing admin through /api/users.
      const { email, password } = req.body;

      const sanitizedEmail = sanitizeEmail(email);

      const existingUser = await query<User>('SELECT id FROM users WHERE email = $1', [
        sanitizedEmail,
      ]);

      if (existingUser.rows.length > 0) {
        sendError(res, 'User with this email already exists', 409);
        return;
      }

      const hashedPassword = await hashPassword(password);

      const result = await query<User>(
        `INSERT INTO users (email, password, role) 
         VALUES ($1, $2, 'user') 
         RETURNING id, email, role, created_at`,
        [sanitizedEmail, hashedPassword]
      );

      const user = result.rows[0];

      const payload: JwtPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
      };

      await this.establishSession(req, res, payload, user, 'User registered successfully', 201);
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
      const sanitizedEmail = sanitizeEmail(email);

      const result = await query<User>('SELECT * FROM users WHERE email = $1', [sanitizedEmail]);

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
        // Increment atomically: a read-modify-write lets parallel attempts all
        // read the same counter and never reach the lockout threshold.
        const updated = await query<{ failed_login_attempts: number }>(
          `UPDATE users SET failed_login_attempts = failed_login_attempts + 1
           WHERE id = $1
           RETURNING failed_login_attempts`,
          [user.id]
        );
        const newFailedAttempts = updated.rows[0]?.failed_login_attempts ?? 1;
        const lockUntil = getAccountLockDuration(newFailedAttempts);

        if (lockUntil) {
          await query('UPDATE users SET account_locked_until = $1 WHERE id = $2', [
            lockUntil,
            user.id,
          ]);
        }

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

      const payload: JwtPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
        mustChangePassword: Boolean(user.must_change_password || user.is_temporary_password),
      };

      if (user.mfa_enabled) {
        sendSuccess(res, {
          user: {
            id: user.id,
            email: user.email,
            role: user.role,
            created_at: user.created_at,
          },
          mfa_required: true,
          mfa_token: tokenService.createMFAChallenge(user.id),
        });
        return;
      }

      await this.establishSession(req, res, payload, user);
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

      const result = await query<
        UserResponse & {
          mfa_enabled: boolean;
          must_change_password: boolean | null;
          is_temporary_password: boolean | null;
        }
      >(
        'SELECT id, email, role, created_at, mfa_enabled, must_change_password, is_temporary_password FROM users WHERE id = $1',
        [userId]
      );

      if (result.rows.length === 0) {
        sendError(res, 'User not found', 404);
        return;
      }

      const profile = result.rows[0];
      sendSuccess(res, {
        user: {
          ...profile,
          must_change_password: Boolean(
            profile.must_change_password || profile.is_temporary_password
          ),
        },
      });
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
  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken = getCookie(req.headers.cookie, 'refresh_token');
      const sessionId = req.sessionId || getCookie(req.headers.cookie, 'session_id');
      const refreshPayload = refreshToken
        ? await tokenService.validateRefreshToken(refreshToken)
        : null;
      const userId = req.user?.userId || refreshPayload?.userId;
      if (refreshToken) await tokenService.revokeRefreshToken(refreshToken);
      if (userId) await tokenService.revokeAllUserTokens(userId);
      if (sessionId) {
        await csrfService.invalidateToken(sessionId);
        await sessionService.terminateSession(sessionId);
      }
      clearAuthCookies(res);
      sendSuccess(res, null, 'Logged out successfully');
    } catch (error) {
      next(error);
    }
  }

  /** Rotate the refresh token stored in the httpOnly cookie. */
  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken = getCookie(req.headers.cookie, 'refresh_token');
      if (!refreshToken) {
        sendError(res, 'Refresh token is required', 401, 'UNAUTHORIZED');
        return;
      }

      const payload = await tokenService.validateRefreshToken(refreshToken);
      if (!payload) {
        clearAuthCookies(res);
        sendError(res, 'Invalid or expired refresh token', 401, 'UNAUTHORIZED');
        return;
      }

      // Refresh tokens may outlive the user (deletion) or the role (demotion):
      // always rebuild the payload from the current database row.
      const currentUser = await query<User>(
        'SELECT id, email, role, must_change_password, is_temporary_password FROM users WHERE id = $1',
        [payload.userId]
      );
      if (currentUser.rows.length === 0) {
        await tokenService.revokeAllUserTokens(payload.userId);
        clearAuthCookies(res);
        sendError(res, 'Account no longer exists', 401, 'UNAUTHORIZED');
        return;
      }

      const currentPayload: JwtPayload = {
        userId: currentUser.rows[0].id,
        email: currentUser.rows[0].email,
        role: currentUser.rows[0].role,
        mustChangePassword: Boolean(
          currentUser.rows[0].must_change_password || currentUser.rows[0].is_temporary_password
        ),
      };

      const tokens = await tokenService.rotateRefreshToken(refreshToken, currentPayload);
      if (!tokens) {
        // Another request already redeemed this refresh token (replay).
        await tokenService.revokeAllUserTokens(currentPayload.userId);
        clearAuthCookies(res);
        sendError(res, 'Refresh token has already been used', 401, 'UNAUTHORIZED');
        return;
      }

      const sessionId = getCookie(req.headers.cookie, 'session_id') || randomUUID();
      if (await sessionService.getSession(sessionId)) {
        await sessionService.updateActivity(sessionId);
      } else {
        await sessionService.createSession(sessionId, currentPayload, {
          device: req.get('user-agent') || 'unknown',
          ipAddress: req.ip || 'unknown',
          userAgent: req.get('user-agent') || 'unknown',
        });
      }
      const csrfToken = await csrfService.generateToken(sessionId);
      setAuthCookies(res, tokens.accessToken, tokens.refreshToken, sessionId);
      res.setHeader('X-CSRF-Token', csrfToken);
      sendSuccess(res, { user: currentPayload });
    } catch (error) {
      next(error);
    }
  }

  async setupMFA(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        sendError(res, 'Authentication required', 401, 'UNAUTHORIZED');
        return;
      }
      const result = await query<{ email: string }>('SELECT email FROM users WHERE id = $1', [
        userId,
      ]);
      if (!result.rows[0]) {
        sendError(res, 'User not found', 404);
        return;
      }
      const setup = await (
        await import('../services/mfa.service')
      ).default.setupMFA(userId, result.rows[0].email);
      sendSuccess(res, setup);
    } catch (error) {
      next(error);
    }
  }

  async verifyMFA(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      const token = String(req.body.token || '');
      if (!userId || !token) {
        sendError(res, 'Authentication and MFA token are required', 400);
        return;
      }
      const valid = await (
        await import('../services/mfa.service')
      ).default.verifyAndEnableMFA(userId, token);
      if (!valid) {
        sendError(res, 'Invalid MFA token', 400, 'INVALID_MFA_TOKEN');
        return;
      }
      sendSuccess(res, null, 'Multi-factor authentication enabled');
    } catch (error) {
      next(error);
    }
  }

  async validateMFA(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const challengeToken = String(req.body.mfa_token || '');
      const userId = tokenService.verifyMFAChallenge(challengeToken);
      const token = String(req.body.token || '');
      if (!userId || !token) {
        sendError(res, 'Invalid MFA challenge', 401, 'UNAUTHORIZED');
        return;
      }
      if (await this.tooManyMFAAttempts(userId)) {
        sendError(
          res,
          'Too many verification attempts. Please sign in again later.',
          429,
          'MFA_LOCKED'
        );
        return;
      }
      if (!(await this.claimMFAChallenge(challengeToken))) {
        sendError(
          res,
          'This verification session has already been used. Please sign in again.',
          401,
          'MFA_CHALLENGE_USED'
        );
        return;
      }
      const mfaService = (await import('../services/mfa.service')).default;
      const valid = await mfaService.verifyTOTP(userId, token);
      if (!valid) {
        await this.recordMFAAttempt(userId, false);
        sendError(res, 'Invalid MFA token', 401, 'INVALID_MFA_TOKEN');
        return;
      }
      await this.recordMFAAttempt(userId, true);
      const result = await query<User>('SELECT * FROM users WHERE id = $1', [userId]);
      const user = result.rows[0];
      if (!user) {
        sendError(res, 'User not found', 404);
        return;
      }
      await this.establishSession(
        req,
        res,
        {
          userId: user.id,
          email: user.email,
          role: user.role,
          mustChangePassword: Boolean(user.must_change_password || user.is_temporary_password),
        },
        user
      );
    } catch (error) {
      next(error);
    }
  }

  async validateBackupCode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const challengeToken = String(req.body.mfa_token || '');
      const userId = tokenService.verifyMFAChallenge(challengeToken);
      const code = String(req.body.code || '');
      if (!userId || !code) {
        sendError(res, 'Invalid MFA challenge', 401, 'UNAUTHORIZED');
        return;
      }
      if (await this.tooManyMFAAttempts(userId)) {
        sendError(
          res,
          'Too many verification attempts. Please sign in again later.',
          429,
          'MFA_LOCKED'
        );
        return;
      }
      if (!(await this.claimMFAChallenge(challengeToken))) {
        sendError(
          res,
          'This verification session has already been used. Please sign in again.',
          401,
          'MFA_CHALLENGE_USED'
        );
        return;
      }
      const valid = await (
        await import('../services/mfa.service')
      ).default.verifyBackupCode(userId, code);
      if (!valid) {
        await this.recordMFAAttempt(userId, false);
        sendError(res, 'Invalid backup code', 401, 'INVALID_BACKUP_CODE');
        return;
      }
      await this.recordMFAAttempt(userId, true);
      const result = await query<User>('SELECT * FROM users WHERE id = $1', [userId]);
      const user = result.rows[0];
      if (!user) {
        sendError(res, 'User not found', 404);
        return;
      }
      await this.establishSession(
        req,
        res,
        {
          userId: user.id,
          email: user.email,
          role: user.role,
          mustChangePassword: Boolean(user.must_change_password || user.is_temporary_password),
        },
        user
      );
    } catch (error) {
      next(error);
    }
  }

  async disableMFA(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        sendError(res, 'Authentication required', 401, 'UNAUTHORIZED');
        return;
      }

      // Disabling the second factor is a credential downgrade: require the
      // account password so a stolen token alone cannot turn MFA off.
      const password = String(req.body.password || '');
      if (!password) {
        sendError(
          res,
          'Password confirmation is required to disable MFA',
          400,
          'PASSWORD_REQUIRED'
        );
        return;
      }
      const result = await query<User>('SELECT password FROM users WHERE id = $1', [userId]);
      if (!result.rows[0] || !(await comparePassword(password, result.rows[0].password))) {
        sendError(res, 'Password is incorrect', 401, 'INVALID_PASSWORD');
        return;
      }

      await (await import('../services/mfa.service')).default.disableMFA(userId);

      // Any token minted while MFA was enabled must not survive the downgrade.
      await tokenService.revokeAllUserTokens(userId);
      await sessionService.terminateAllUserSessions(userId);
      clearAuthCookies(res);

      sendSuccess(res, null, 'Multi-factor authentication disabled. Please sign in again.');
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

      const result = await query<User>('SELECT id, email FROM users WHERE email = $1', [
        sanitizedEmail,
      ]);

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

      // Hash the provided token to compare with the stored HMAC
      const hashedToken = await hashResetToken(token);

      // Hash new password before the single atomic consumption below
      const hashedPassword = await hashPassword(newPassword);

      // Consume the token atomically: the UPDATE only matches a live token, so
      // concurrent requests cannot both redeem it.
      const result = await query<{ id: string }>(
        `UPDATE users 
         SET password = $1, reset_token = NULL, reset_token_expiry = NULL,
             is_temporary_password = FALSE, must_change_password = FALSE
         WHERE reset_token = $2 AND reset_token_expiry > NOW()
         RETURNING id`,
        [hashedPassword, hashedToken]
      );

      if (result.rows.length === 0) {
        sendError(res, 'Invalid or expired reset token', 400);
        return;
      }

      // A reset must evict any stolen refresh chain and live sessions.
      await tokenService.revokeAllUserTokens(result.rows[0].id);
      await sessionService.terminateAllUserSessions(result.rows[0].id);

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

      // A password change must evict every other refresh chain and session:
      // otherwise a stolen token survives the rotation.
      await tokenService.revokeAllUserTokens(user.id);
      await sessionService.terminateAllUserSessions(user.id);
      clearAuthCookies(res);

      sendSuccess(res, null, 'Password changed successfully. Please sign in again.');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Claim an MFA challenge token exactly once. SADD returns 0 when the marker
   * already exists, which makes the claim atomic across concurrent requests.
   */
  private async claimMFAChallenge(challengeToken: string): Promise<boolean> {
    const marker = createHash('sha256').update(challengeToken).digest('hex');
    const added = await redisClient.sadd(MFA_CHALLENGE_MARKER_KEY, marker);
    if (added === 0) return false;

    const pipeline = redisClient.pipeline();
    pipeline.expire(MFA_CHALLENGE_MARKER_KEY, MFA_ATTEMPT_WINDOW_SECONDS);
    await pipeline.exec();
    return true;
  }

  private async tooManyMFAAttempts(userId: string): Promise<boolean> {
    const raw = await redisClient.get(`mfa:failed:${userId}`);
    return Number(raw || 0) >= MFA_ATTEMPT_LIMIT;
  }

  private async recordMFAAttempt(userId: string, success: boolean): Promise<void> {
    const key = `mfa:failed:${userId}`;
    if (success) {
      await redisClient.del(key);
      return;
    }
    const attempts = Number((await redisClient.get(key)) || 0) + 1;
    await redisClient.setex(key, MFA_ATTEMPT_WINDOW_SECONDS, String(attempts));
  }
}

export default new AuthController();
