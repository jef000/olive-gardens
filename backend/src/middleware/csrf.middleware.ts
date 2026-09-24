import { NextFunction, Request, Response } from 'express';
import csrfService from '../services/csrf.service';
import { sendError } from '../utils/response';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const PUBLIC_PATHS = new Set([
  '/auth/login',
  '/auth/register',
  '/auth/refresh',
  '/auth/forgot-password',
  '/auth/reset-password',
]);

function readCookie(req: Request, name: string): string | undefined {
  const header = req.headers.cookie;
  if (!header) return undefined;
  const value = header.split(';').find((part) => part.trim().startsWith(`${name}=`));
  return value ? decodeURIComponent(value.trim().slice(name.length + 1)) : undefined;
}

/**
 * Double-submit-style CSRF protection backed by the server-side session token.
 * Safe requests receive a token header; state-changing authenticated requests
 * must echo it in X-CSRF-Token.
 */
export async function csrfMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const sessionId = req.sessionId ?? readCookie(req, 'session_id');
  const routePath = req.originalUrl.split('?')[0].replace(/^\/api/, '') || req.path;

  if (!sessionId || PUBLIC_PATHS.has(routePath)) {
    next();
    return;
  }

  try {
    if (!MUTATING_METHODS.has(req.method)) {
      // Reuse the session's existing token: rotating on every safe request made
      // concurrent writes fail intermittently with a stale token.
      const token =
        (await csrfService.getToken(sessionId)) ?? (await csrfService.generateToken(sessionId));
      res.setHeader('X-CSRF-Token', token);
      next();
      return;
    }

    const token = req.header('X-CSRF-Token');
    if (!token || !(await csrfService.validateToken(sessionId, token))) {
      sendError(res, 'CSRF token is missing or invalid', 403, 'CSRF_VALIDATION_FAILED');
      return;
    }

    next();
  } catch (error) {
    next(error);
  }
}

export default csrfMiddleware;
