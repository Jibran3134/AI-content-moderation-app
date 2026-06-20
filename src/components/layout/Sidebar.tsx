'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  ImageIcon,
  Upload,
  MessageSquare,
  Inbox,
  ShieldCheck,
  BarChart3,
} from 'lucide-react';

const navLinks = [
  { href: '/dashboard',       label: 'Dashboard',       icon: LayoutDashboard },
  { href: '/submissions',     label: 'Submissions',     icon: ImageIcon },
  { href: '/submissions/new', label: 'Upload Images',   icon: Upload },
  { href: '/appeals',         label: 'My Appeals',      icon: MessageSquare },
  { href: '/admin/appeals',   label: 'Appeals Queue',   icon: Inbox },
  { href: '/admin/policies',  label: 'Policies',        icon: ShieldCheck },
  { href: '/admin/analytics', label: 'Analytics',       icon: BarChart3 },
];

export default function Sidebar() {
  const pathname = usePathname();

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
        {navLinks.map(({ href, label, icon: Icon }) => {
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

      <div className="px-6 py-4 border-t border-border">
        <p className="text-xs text-muted-foreground">AI Moderation Platform</p>
      </div>
    </aside>
  );
}
