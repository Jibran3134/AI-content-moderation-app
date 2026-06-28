'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface AuthUser {
  id: string;
  email: string;
  role: 'user' | 'admin';
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;

  setAuth: (user: AuthUser, token: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,

      setAuth: (user, accessToken) =>
        set({ user, accessToken }),

      clearAuth: () =>
        set({ user: null, accessToken: null }),
    }),
    {
      name: 'ai-moderation-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
      }),
    },
  ),
);
