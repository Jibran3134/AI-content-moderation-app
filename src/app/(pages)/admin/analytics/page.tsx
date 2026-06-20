'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';

const PERIODS = [7, 30, 90] as const;

const OUTCOME_COLORS: Record<string, string> = {
  approved: '#22c55e',
  flagged: '#f59e0b',
  blocked: '#ef4444',
};

const CATEGORY_LABELS: Record<string, string> = {
  graphic_violence: 'Graphic Violence',
  hate_symbols: 'Hate Symbols',
  self_harm: 'Self-Harm',
  extremist_propaganda: 'Extremist Propaganda',
  weapons_contraband: 'Weapons & Contraband',
  harassment_humiliation: 'Harassment & Humiliation',
};

function NoData() {
  return (
    <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
      No data available
    </div>
  );
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<7 | 30 | 90>(30);

  const overview = useQuery<{ data: { totalSubmissions: number; pendingAppeals: number; verdictDistribution: Record<string, number> } }>({
    queryKey: ['analytics-overview'],
    queryFn: () => api.get('/analytics/overview').then((r) => r.data),
  });

  const overTime = useQuery<{ data: Array<{ date: string; count: number }> }>({
    queryKey: ['analytics-over-time', period],
    queryFn: () => api.get('/analytics/submissions-over-time', { params: { period } }).then((r) => r.data),
  });

  const categories = useQuery<{ data: Array<{ category: string; count: number; avgConfidence: number }> }>({
    queryKey: ['analytics-categories'],
    queryFn: () => api.get('/analytics/category-breakdown').then((r) => r.data),
  });

  const appealsSummary = useQuery<{ data: { total: number; pending: number; accepted: number; rejected: number } }>({
    queryKey: ['analytics-appeals'],
    queryFn: () => api.get('/analytics/appeals-summary').then((r) => r.data),
  });

  const rankings = useQuery<{ data: Array<{ email: string; submissionCount: number }> }>({
    queryKey: ['analytics-rankings'],
    queryFn: () => api.get('/analytics/user-rankings').then((r) => r.data),
  });

  const o = overview.data?.data;
  const apSummary = appealsSummary.data?.data;

  const stats = [
    { label: 'Total Submissions', value: o?.totalSubmissions },
    { label: 'Pending Appeals', value: apSummary?.pending },
    { label: 'Accepted Appeals', value: apSummary?.accepted },
    { label: 'Rejected Appeals', value: apSummary?.rejected },
  ];

  // Verdict distribution data for bar chart
  const verdictData = o?.verdictDistribution
    ? Object.entries(o.verdictDistribution).map(([key, val]) => ({ name: key, count: val }))
    : [];

  // Category data with human-readable names
  const catData = (categories.data?.data ?? []).map((r) => ({
    ...r,
    label: CATEGORY_LABELS[r.category] ?? r.category,
  }));

  const timeData = overTime.data?.data ?? [];
  const rankData = rankings.data?.data ?? [];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
        <p className="text-muted-foreground mt-1">Platform-wide moderation insights.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value }) => (
          <Card key={label} className="border border-border">
            <CardHeader className="pb-1">
              <CardTitle className="text-xs text-muted-foreground font-medium">{label}</CardTitle>
            </CardHeader>
            <CardContent>
              {overview.isLoading || appealsSummary.isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <p className="text-3xl font-bold text-foreground">{value ?? '—'}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Period selector */}
      <div className="flex items-center gap-2 mb-6">
        <span className="text-sm text-muted-foreground">Period:</span>
        {PERIODS.map((p) => (
          <Button
            key={p}
            size="sm"
            variant={period === p ? 'default' : 'outline'}
            onClick={() => setPeriod(p)}
          >
            {p}d
          </Button>
        ))}
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Submissions Over Time */}
        <Card className="border border-border">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Submissions Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            {overTime.isLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : timeData.length === 0 ? (
              <NoData />
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={timeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: '#71717a', fontSize: 11 }}
                    tickFormatter={(v) => v.slice(5)}
                  />
                  <YAxis tick={{ fill: '#71717a', fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 6 }}
                    labelStyle={{ color: '#a1a1aa' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#6366f1"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Verdict Distribution */}
        <Card className="border border-border">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Verdict Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {overview.isLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : verdictData.length === 0 ? (
              <NoData />
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={verdictData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="name" tick={{ fill: '#71717a', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#71717a', fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 6 }}
                    labelStyle={{ color: '#a1a1aa' }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {verdictData.map((entry) => (
                      <Cell key={entry.name} fill={OUTCOME_COLORS[entry.name] ?? '#6366f1'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card className="border border-border">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Category Breakdown (detected)</CardTitle>
          </CardHeader>
          <CardContent>
            {categories.isLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : catData.length === 0 ? (
              <NoData />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={catData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis type="number" tick={{ fill: '#71717a', fontSize: 11 }} allowDecimals={false} />
                  <YAxis
                    type="category"
                    dataKey="label"
                    tick={{ fill: '#71717a', fontSize: 10 }}
                    width={130}
                  />
                  <Tooltip
                    contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 6 }}
                    labelStyle={{ color: '#a1a1aa' }}
                  />
                  <Bar dataKey="count" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* User Rankings */}
        <Card className="border border-border">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Top Users by Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            {rankings.isLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : rankData.length === 0 ? (
              <NoData />
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left pb-2 font-medium">#</th>
                    <th className="text-left pb-2 font-medium">Email</th>
                    <th className="text-right pb-2 font-medium">Submissions</th>
                  </tr>
                </thead>
                <tbody>
                  {rankData.map((u, i) => (
                    <tr key={u.email ?? i} className="border-b border-border/50">
                      <td className="py-2 text-muted-foreground">{i + 1}</td>
                      <td className="py-2 text-foreground truncate max-w-[160px]">{u.email ?? '—'}</td>
                      <td className="py-2 text-right text-foreground font-medium">
                        {u.submissionCount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
