import { Request, Response, NextFunction } from 'express';
import { verifyAccess, JwtPayload } from '../utils/jwt';

// Extend Express Request to carry the authenticated user payload
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * Verify Bearer JWT from Authorization header.
 * Attaches `req.user = { sub, role, type }` on success.
 * Returns 401 if token is missing or invalid.
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Authentication required' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = verifyAccess(token);
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
    return;
  }
}

/**
 * Role-based authorization guard.
 * Must be used after `authenticate`.
 */
export function authorize(...roles: Array<'user' | 'admin'>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    if (roles.length > 0 && !roles.includes(req.user.role)) {
      res.status(403).json({ success: false, message: 'Insufficient permissions' });
      return;
    }

    next();
  };
}
