import { Request, Response, NextFunction } from 'express';
import { JwtPayload } from '../utils/jwt';

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * Auth disabled — attach a mock admin user so all routes work without tokens.
 * Replace this with real JWT verification when auth is re-enabled.
 */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  req.user = {
    sub: 'demo-user-id',
    role: 'admin',
    type: 'access',
  };
  next();
}

/** Role-based guard — disabled, pass-through. */
export function authorize(..._roles: Array<'user' | 'admin'>) {
  return (_req: Request, _res: Response, next: NextFunction): void => {
    next();
  };
}
