import { User } from '../models/User';
import { AppError } from '../middleware/error';
import { signAccess, signRefresh, verifyRefresh } from '../utils/jwt';
import { env } from '../config/env';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RegisterInput {
  name?: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  email: string;
  role: 'user' | 'admin';
}

export interface LoginResult {
  accessToken: string;
  refreshToken: string;  // route sets this as httpOnly cookie
  user: AuthUser;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class AuthService {
  async register(input: RegisterInput): Promise<{ accessToken: string; user: AuthUser }> {
    const exists = await User.findOne({ email: input.email });
    if (exists) throw new AppError(409, 'An account with this email already exists');

    const user = await User.create({
      name: input.name,
      email: input.email,
      passwordHash: input.password,   // pre-save hook hashes it
      role: 'user',
    });

    const accessToken = signAccess(user._id.toString(), user.role);
    return {
      accessToken,
      user: { id: user._id.toString(), email: user.email, role: user.role },
    };
  }

  async login(input: LoginInput): Promise<LoginResult> {
    const user = await User.findOne({ email: input.email }).select('+passwordHash');
    if (!user) throw new AppError(401, 'Invalid email or password');

    const valid = await user.comparePassword(input.password);
    if (!valid) throw new AppError(401, 'Invalid email or password');

    const accessToken  = signAccess(user._id.toString(), user.role);
    const refreshToken = signRefresh(user._id.toString());

    return {
      accessToken,
      refreshToken,
      user: { id: user._id.toString(), email: user.email, role: user.role },
    };
  }

  async refresh(refreshToken: string): Promise<{ accessToken: string }> {
    let payload;
    try {
      payload = verifyRefresh(refreshToken);
    } catch {
      throw new AppError(401, 'Invalid or expired refresh token');
    }

    const user = await User.findById(payload.sub);
    if (!user) throw new AppError(401, 'User not found');

    return { accessToken: signAccess(user._id.toString(), user.role) };
  }

  async seedAdmin(): Promise<void> {
    const exists = await User.findOne({ email: env.ADMIN_EMAIL });
    if (exists) return;

    await User.create({
      name: 'Platform Admin',
      email: env.ADMIN_EMAIL,
      passwordHash: env.ADMIN_PASSWORD,
      role: 'admin',
    });

    console.log(`✅ Admin user seeded: ${env.ADMIN_EMAIL}`);
  }
}

export const authService = new AuthService();
