import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface JwtPayload {
  sub: string;
  role: 'user' | 'admin';
  type: 'access' | 'refresh';
}

// ─── Simple helpers (spec API) ────────────────────────────────────────────────

/** Sign a 15-minute access token */
export function signAccess(userId: string, role: 'user' | 'admin'): string {
  return jwt.sign({ sub: userId, role, type: 'access' }, env.JWT_SECRET, { expiresIn: '15m' });
}

/** Sign a 7-day refresh token */
export function signRefresh(userId: string): string {
  return jwt.sign({ sub: userId, type: 'refresh' }, env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
}

export function verifyAccess(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
}

export function verifyRefresh(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtPayload;
}

// ─── Legacy aliases (used by existing auth middleware) ────────────────────────
export function signAccessToken(payload: Omit<JwtPayload, 'type'>): string {
  return signAccess(payload.sub, payload.role);
}
export function signRefreshToken(payload: Omit<JwtPayload, 'type'>): string {
  return signRefresh(payload.sub);
}
export function verifyAccessToken(token: string): JwtPayload {
  return verifyAccess(token);
}
export function verifyRefreshToken(token: string): JwtPayload {
  return verifyRefresh(token);
}
