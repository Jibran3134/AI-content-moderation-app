import { Request, Response, NextFunction } from 'express';

/**
 * Admin-only guard — disabled for demo. Pass-through.
 * Re-enable role check when auth is restored.
 */
export function adminOnly(_req: Request, _res: Response, next: NextFunction): void {
  next();
}
