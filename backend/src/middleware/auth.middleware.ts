import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { sendError } from '../utils/response';
import tokenService from '../services/token.service';
import sessionService from '../services/session.service';
import { getCookie } from '../utils/cookies';

/**
 * Routes a session with a pending forced password change may still call.
 * Paths are compared after stripping the /api mount prefix.
 */
const PASSWORD_CHANGE_ALLOWLIST = new Set([
  '/auth/change-password',
  '/auth/logout',
  '/auth/me',
  '/auth/refresh',
]);

/**
 * Authentication middleware
 *
 * Security Considerations:
 * - Verifies JWT token from Authorization header
 * - Validates token signature and expiry
 * - Attaches user payload to request object
 * - Returns 401 for missing or invalid tokens
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const accessToken = authHeader?.startsWith('Bearer ')
      ? authHeader.substring(7)
      : getCookie(req.headers.cookie, 'access_token');

    if (!accessToken) {
      sendError(res, 'No token provided', 401, 'UNAUTHORIZED');
      return;
    }

    const payload = authHeader?.startsWith('Bearer ')
      ? verifyToken(accessToken)
      : tokenService.verifyAccessToken(accessToken);
    req.user = payload;
    req.sessionId = getCookie(req.headers.cookie, 'session_id');

    // Cookie sessions must still exist server-side: logout, password change,
    // deletion and role changes all revoke sessions. Bearer tokens (automation,
    // short-lived) keep their JWT-only trust model.
    if (!authHeader?.startsWith('Bearer ')) {
      const session = req.sessionId ? await sessionService.getSession(req.sessionId) : null;
      if (!session || session.userId !== payload.userId) {
        sendError(res, 'Session expired or revoked', 401, 'UNAUTHORIZED');
        return;
      }
    }

    // Temporary passwords are single-purpose credentials: until the owner
    // replaces the password, only the change-password/logout/me flow is
    // reachable. Enforced server-side so the flag cannot be ignored.
    if (payload.mustChangePassword) {
      const routePath = req.path.replace(/^\/api(?=\/|$)/, '');
      if (!PASSWORD_CHANGE_ALLOWLIST.has(routePath)) {
        sendError(
          res,
          'You must change your temporary password before using the application',
          403,
          'PASSWORD_CHANGE_REQUIRED'
        );
        return;
      }
    }

    next();
  } catch (error) {
    sendError(res, 'Invalid or expired token', 401, 'UNAUTHORIZED');
  }
};

/**
 * Optional authentication for mixed public/private reads (e.g. the gallery).
 * Attaches req.user when a valid, live session is presented and otherwise
 * continues anonymously instead of rejecting.
 */
export const optionalAuthenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const accessToken = authHeader?.startsWith('Bearer ')
      ? authHeader.substring(7)
      : getCookie(req.headers.cookie, 'access_token');

    if (!accessToken) {
      next();
      return;
    }

    const payload = authHeader?.startsWith('Bearer ')
      ? verifyToken(accessToken)
      : tokenService.verifyAccessToken(accessToken);
    req.sessionId = getCookie(req.headers.cookie, 'session_id');

    if (!authHeader?.startsWith('Bearer ')) {
      const session = req.sessionId ? await sessionService.getSession(req.sessionId) : null;
      if (!session || session.userId !== payload.userId) {
        next();
        return;
      }
    }

    req.user = payload;
  } catch {
    // Invalid credentials are treated as anonymous for public reads.
  }
  next();
};

/**
 * Role-based authorization middleware
 * Security: Restricts access based on user roles
 */
export const authorize = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'Authentication required', 401, 'UNAUTHORIZED');
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      sendError(res, 'Insufficient permissions', 403, 'FORBIDDEN');
      return;
    }

    next();
  };
};
