'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { FileImage, AlertCircle, CheckCircle, Ban } from 'lucide-react';

interface Overview {
  totalSubmissions: number;
  pendingAppeals: number;
  verdictDistribution: { approved: number; flagged: number; blocked: number };
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'admin';

  const { data, isLoading } = useQuery<{ data: Overview }>({
    queryKey: ['analytics', 'overview'],
    queryFn: () => api.get('/analytics/overview').then((r) => r.data),
    enabled: isAdmin, // Only fetch analytics for admins
  });

  // For regular users, fetch their own submission count
  const { data: userSubs, isLoading: subsLoading } = useQuery({
    queryKey: ['submissions', 'mine'],
    queryFn: () => api.get('/submissions?limit=1').then((r) => r.data),
    enabled: !isAdmin,
  });

  const o = data?.data;

  return (
    <div>
      {/* Welcome header with user info */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          {user && (
            <Badge
              variant={isAdmin ? 'default' : 'secondary'}
              className="text-xs uppercase tracking-wider"
            >
              {user.role}
            </Badge>
          )}
        </div>
        {user && (
          <p className="text-muted-foreground">
            Welcome back, <span className="text-foreground font-medium">{user.email}</span>
          </p>
        )}
      </div>

      {/* Admin stats */}
      {isAdmin && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Total Submissions', value: o?.totalSubmissions, icon: FileImage, color: 'text-blue-400' },
            { label: 'Pending Appeals', value: o?.pendingAppeals, icon: AlertCircle, color: 'text-amber-400' },
            { label: 'Approved', value: o?.verdictDistribution?.approved, icon: CheckCircle, color: 'text-green-400' },
            { label: 'Blocked', value: o?.verdictDistribution?.blocked, icon: Ban, color: 'text-red-400' },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label} className="border border-border">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
                <Icon className={`h-5 w-5 ${color}`} />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-9 w-20" />
                ) : (
                  <p className="text-4xl font-bold text-foreground">{value ?? '—'}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Regular user stats */}
      {!isAdmin && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Card className="border border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">My Submissions</CardTitle>
              <FileImage className="h-5 w-5 text-blue-400" />
            </CardHeader>
            <CardContent>
              {subsLoading ? (
                <Skeleton className="h-9 w-20" />
              ) : (
                <p className="text-4xl font-bold text-foreground">
                  {userSubs?.meta?.total ?? 0}
                </p>
              )}
            </CardContent>
          </Card>
          <Card className="border border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Your Role</CardTitle>
              <CheckCircle className="h-5 w-5 text-green-400" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground capitalize">{user?.role}</p>
              <p className="text-sm text-muted-foreground mt-1">Upload images to get started</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
