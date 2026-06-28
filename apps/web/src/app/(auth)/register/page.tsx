'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { toast } from 'sonner';
import apiClient from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

const RegisterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100).trim().optional(),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type RegisterInput = z.infer<typeof RegisterSchema>;

function RegisterForm() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({ resolver: zodResolver(RegisterSchema) });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterInput) => {
      const res = await apiClient.post('/auth/register', data);
      return res.data.data;
    },
    onSuccess: (data) => {
      // Backend returns { accessToken, user: { id, email, role } }
      setAuth(data.user, data.accessToken);
      toast.success('Account created successfully!');
      router.push('/dashboard');
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      const msg = err.response?.data?.message ?? 'Registration failed. Please try again.';
      setServerError(msg);
      toast.error(msg);
    },
  });

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 right-0 h-80 w-80 rounded-full bg-purple-500/10 blur-3xl" />
        <div className="absolute bottom-0 -left-40 h-80 w-80 rounded-full bg-indigo-500/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="text-2xl">🛡️</span>
            <span className="text-xl font-bold gradient-text">ModerateAI</span>
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-foreground">Create your account</h1>
          <p className="mt-1 text-sm text-muted-foreground">Join the moderation platform</p>
        </div>

        <div className="glass rounded-2xl p-8">
          {serverError && (
            <div className="mb-6 rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
              {serverError}
            </div>
          )}

          <form
            id="register-form"
            onSubmit={handleSubmit((data) => {
              setServerError(null);
              registerMutation.mutate(data);
            })}
            className="space-y-5"
          >
            <div>
              <label htmlFor="register-name" className="mb-1.5 block text-sm font-medium text-foreground">
                Full name
              </label>
              <input
                id="register-name"
                type="text"
                autoComplete="name"
                placeholder="Jane Smith"
                {...register('name')}
                className="w-full rounded-xl border border-border bg-secondary/50 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
              {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div>
              <label htmlFor="register-email" className="mb-1.5 block text-sm font-medium text-foreground">
                Email address
              </label>
              <input
                id="register-email"
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                {...register('email')}
                className="w-full rounded-xl border border-border bg-secondary/50 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
              {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div>
              <label htmlFor="register-password" className="mb-1.5 block text-sm font-medium text-foreground">
                Password
              </label>
              <input
                id="register-password"
                type="password"
                autoComplete="new-password"
                placeholder="Min 8 characters"
                {...register('password')}
                className="w-full rounded-xl border border-border bg-secondary/50 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
              {errors.password && (
                <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>

            <button
              id="register-submit"
              type="submit"
              disabled={registerMutation.isPending}
              className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {registerMutation.isPending ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-primary hover:text-primary/80 transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return <RegisterForm />;
}
