'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import api, { getImageUrl } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ImageOff } from 'lucide-react';

interface Submission {
  _id: string;
  imageUrl: string;
  verdict?: { outcome: 'approved' | 'flagged' | 'blocked' };
  createdAt: string;
}

const outcomeColors: Record<string, string> = {
  approved: 'bg-green-500/20 text-green-400 border-green-500/30',
  flagged:  'bg-amber-500/20 text-amber-400 border-amber-500/30',
  blocked:  'bg-red-500/20 text-red-400 border-red-500/30',
};

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <ImageOff className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold text-foreground">No submissions yet</h3>
      <p className="text-muted-foreground mt-1 mb-4">Upload your first images to get started.</p>
      <Button asChild><Link href="/submissions/new">Upload Images</Link></Button>
    </div>
  );
}

export default function SubmissionsPage() {
  const [page, setPage] = useState(1);
  const [outcome, setOutcome] = useState('all');
  const limit = 10;

  const params: Record<string, string | number> = { page, limit };
  if (outcome !== 'all') params.outcome = outcome;

  const { data, isLoading, isError } = useQuery({
    queryKey: ['submissions', page, outcome],
    queryFn: () => api.get('/submissions', { params }).then((r) => r.data),
  });

  const submissions: Submission[] = data?.data ?? [];
  const total: number = data?.meta?.total ?? 0;
  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Submissions</h1>
          <p className="text-muted-foreground mt-1">{total} total</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={outcome} onValueChange={(v) => { setOutcome(v); setPage(1); }}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="flagged">Flagged</SelectItem>
              <SelectItem value="blocked">Blocked</SelectItem>
            </SelectContent>
          </Select>
          <Button asChild><Link href="/submissions/new">Upload</Link></Button>
        </div>
      </div>

      {isError && (
        <p className="text-destructive text-sm">Failed to load submissions</p>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-56 rounded-lg" />
          ))}
        </div>
      ) : submissions.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {submissions.map((s) => (
              <Link key={s._id} href={`/submissions/${s._id}`}>
                <Card className="overflow-hidden border border-border hover:border-primary/50 transition-colors cursor-pointer group">
                  <div className="relative h-40 bg-muted overflow-hidden">
                    {s.imageUrl ? (
                      <img
                        src={getImageUrl(s.imageUrl)}
                        alt="submission"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <ImageOff className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <CardContent className="p-3 flex items-center justify-between">
                    <Badge
                      variant="outline"
                      className={outcomeColors[s.verdict?.outcome ?? ''] ?? 'text-muted-foreground'}
                    >
                      {s.verdict?.outcome ?? 'pending'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(s.createdAt).toLocaleDateString()}
                    </span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-8">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Prev
              </Button>
              <span className="text-sm text-muted-foreground">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
