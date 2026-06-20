'use client';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { FileImage, AlertCircle, CheckCircle, Ban } from 'lucide-react';

interface Overview {
  totalSubmissions: number;
  pendingAppeals: number;
  verdictDistribution: { approved: number; flagged: number; blocked: number };
}

export default function DashboardPage() {
  const { data, isLoading } = useQuery<{ data: Overview }>({
    queryKey: ['analytics', 'overview'],
    queryFn: () => api.get('/analytics/overview').then((r) => r.data),
  });

  const o = data?.data;

  const stats = [
    { label: 'Total Submissions', value: o?.totalSubmissions, icon: FileImage, color: 'text-blue-400' },
    { label: 'Pending Appeals', value: o?.pendingAppeals, icon: AlertCircle, color: 'text-amber-400' },
    { label: 'Approved', value: o?.verdictDistribution?.approved, icon: CheckCircle, color: 'text-green-400' },
    { label: 'Blocked', value: o?.verdictDistribution?.blocked, icon: Ban, color: 'text-red-400' },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Platform overview and key metrics</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map(({ label, value, icon: Icon, color }) => (
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
    </div>
  );
}
