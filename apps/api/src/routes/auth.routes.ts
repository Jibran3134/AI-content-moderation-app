import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authService } from '../services/auth.service';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

const COOKIE_NAME = 'refreshToken';
const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,   // 7 days
};

const RegisterSchema = z.object({
  name: z.string().max(100).optional(),
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// POST /api/v1/auth/register
router.post(
  '/register',
  validate(RegisterSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.register(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },
);

// POST /api/v1/auth/login  → { accessToken, user } + sets httpOnly refreshToken cookie
router.post(
  '/login',
  validate(LoginSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { accessToken, refreshToken, user } = await authService.login(req.body);
      res.cookie(COOKIE_NAME, refreshToken, COOKIE_OPTS);
      res.status(200).json({ success: true, data: { accessToken, user } });
    } catch (err) {
      next(err);
    }
  },
);

// POST /api/v1/auth/refresh  → reads cookie, returns new accessToken
router.post(
  '/refresh',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token: string | undefined = req.cookies?.[COOKIE_NAME];
      if (!token) {
        res.status(401).json({ success: false, message: 'No refresh token' });
        return;
      }
      const result = await authService.refresh(token);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },
);

// POST /api/v1/auth/logout  → clear cookie, return 200
router.post(
  '/logout',
  authenticate,
  (_req: Request, res: Response) => {
    res.clearCookie(COOKIE_NAME, COOKIE_OPTS);
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  },
);

// GET /api/v1/auth/me
router.get('/me', authenticate, (req: Request, res: Response) => {
  res.status(200).json({ success: true, data: req.user });
});

export default router;
