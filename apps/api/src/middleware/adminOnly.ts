import { Request, Response, NextFunction } from 'express';

/**
 * Admin-only guard. Must be used after `authenticate`.
 * Checks `req.user.role === 'admin'`, returns 403 if not.
 */
export function adminOnly(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Authentication required' });
    return;
  }

  if (req.user.role !== 'admin') {
    res.status(403).json({ success: false, message: 'Admin access required' });
    return;
  }

  next();
}
