'use client';
import { useQuery } from '@tanstack/react-query';
import api, { getImageUrl } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageSquare } from 'lucide-react';

interface Appeal {
  _id: string;
  justification: string;
  status: 'pending' | 'accepted' | 'rejected';
  adminResponse?: string;
  createdAt: string;
  submissionId?: { imageUrl?: string; verdict?: { outcome: string } };
}

const statusColors: Record<string, string> = {
  pending:  'bg-gray-500/20 text-gray-400 border-gray-500/30',
  accepted: 'bg-green-500/20 text-green-400 border-green-500/30',
  rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
};

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold text-foreground">No appeals yet</h3>
      <p className="text-muted-foreground mt-1">
        Appeals appear here when you contest a flagged submission.
      </p>
    </div>
  );
}

export default function MyAppealsPage() {
  const { data, isLoading, isError } = useQuery<{ data: Appeal[] }>({
    queryKey: ['my-appeals'],
    queryFn: () => api.get('/appeals').then((r) => r.data),
  });

  const appeals = data?.data ?? [];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">My Appeals</h1>
        <p className="text-muted-foreground mt-1">Track the status of your submitted appeals.</p>
      </div>

      {isError && <p className="text-destructive text-sm mb-4">Failed to load appeals.</p>}

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-lg" />
          ))}
        </div>
      ) : appeals.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-4">
          {appeals.map((a) => (
            <Card key={a._id} className="border border-border">
              <CardContent className="p-5 flex gap-4">
                {/* Thumbnail */}
                <div className="w-20 h-20 shrink-0 rounded-md overflow-hidden bg-muted border border-border">
                  {a.submissionId?.imageUrl ? (
                    <img
                      src={getImageUrl(a.submissionId.imageUrl)}
                      alt="submission"
                      className="w-full h-full object-cover"
                    />
                  ) : null}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <Badge variant="outline" className={statusColors[a.status]}>
                      {a.status.toUpperCase()}
                    </Badge>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {new Date(a.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-foreground line-clamp-2">{a.justification}</p>
                  {a.status !== 'pending' && a.adminResponse && (
                    <div className="mt-2 text-xs text-muted-foreground bg-muted/50 rounded p-2">
                      <span className="font-medium">Admin response: </span>
                      {a.adminResponse}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
