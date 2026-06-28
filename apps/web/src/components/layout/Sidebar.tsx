'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import {
  LayoutDashboard,
  ImageIcon,
  Upload,
  MessageSquare,
  Inbox,
  ShieldCheck,
  BarChart3,
  LogOut,
} from 'lucide-react';

interface NavLink {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  adminOnly?: boolean;
}

const navLinks: NavLink[] = [
  // All users
  { href: '/dashboard',       label: 'Dashboard',       icon: LayoutDashboard },
  { href: '/submissions',     label: 'My Submissions',  icon: ImageIcon },
  { href: '/submissions/new', label: 'Upload Images',   icon: Upload },
  { href: '/appeals',         label: 'My Appeals',      icon: MessageSquare },
  // Admin only
  { href: '/admin/appeals',   label: 'Appeals Queue',   icon: Inbox,       adminOnly: true },
  { href: '/admin/policies',  label: 'Policies',        icon: ShieldCheck, adminOnly: true },
  { href: '/admin/analytics', label: 'Analytics',       icon: BarChart3,   adminOnly: true },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const isAdmin = user?.role === 'admin';

  // Filter links based on role
  const visibleLinks = navLinks.filter((link) => !link.adminOnly || isAdmin);

  const handleLogout = async () => {
    try {
      const { default: api } = await import('@/lib/api');
      await api.post('/auth/logout');
    } catch {
      // ignore — clear state regardless
    }
    clearAuth();
    router.push('/login');
  };

  return (
    <aside className="w-64 shrink-0 border-r border-border bg-card flex flex-col min-h-screen">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-border">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-primary" />
          <span className="font-bold text-base text-foreground">AI Moderation</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {visibleLinks.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User info + Logout */}
      <div className="px-4 py-4 border-t border-border space-y-3">
        {user && (
          <div className="px-2">
            <p className="text-sm font-medium text-foreground truncate">{user.email}</p>
            <span
              className={cn(
                'mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
                isAdmin
                  ? 'bg-primary/15 text-primary'
                  : 'bg-muted text-muted-foreground',
              )}
            >
              {user.role}
            </span>
          </div>
        )}
        <button
          id="sidebar-logout"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
