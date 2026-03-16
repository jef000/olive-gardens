import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { sendError } from '../utils/response';

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

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      sendError(res, 'No token provided', 401, 'UNAUTHORIZED');
      return;
    }

    const token = authHeader.substring(7);

    const payload = verifyToken(token);
    req.user = payload;

    next();
  } catch (error) {
    sendError(res, 'Invalid or expired token', 401, 'UNAUTHORIZED');
  }
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
