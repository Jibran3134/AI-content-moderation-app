'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Inbox } from 'lucide-react';

interface Appeal {
  _id: string;
  justification: string;
  createdAt: string;
  userId?: { email?: string; name?: string };
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <Inbox className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold text-foreground">Queue is empty</h3>
      <p className="text-muted-foreground mt-1">No pending appeals to review.</p>
    </div>
  );
}

export default function AdminAppealsPage() {
  const qc = useQueryClient();
  const [reviewing, setReviewing] = useState<Appeal | null>(null);
  const [adminResponse, setAdminResponse] = useState('');
  const [decision, setDecision] = useState<'accepted' | 'rejected' | null>(null);

  const { data, isLoading, isError } = useQuery<{ data: Appeal[] }>({
    queryKey: ['appeals-queue'],
    queryFn: () => api.get('/appeals/queue').then((r) => r.data),
  });

  const appeals = data?.data ?? [];

  const reviewMutation = useMutation({
    mutationFn: ({ id, dec }: { id: string; dec: 'accepted' | 'rejected' }) =>
      api
        .patch(`/appeals/${id}/review`, { decision: dec, adminResponse: adminResponse.trim() || undefined })
        .then((r) => r.data),
    onSuccess: (_, { dec }) => {
      toast.success(`Appeal ${dec === 'accepted' ? 'accepted' : 'rejected'} successfully`);
      setReviewing(null);
      setAdminResponse('');
      setDecision(null);
      qc.invalidateQueries({ queryKey: ['appeals-queue'] });
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Review failed';
      toast.error(msg);
    },
  });

  const openReview = (appeal: Appeal) => {
    setReviewing(appeal);
    setAdminResponse('');
    setDecision(null);
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Appeals Queue</h1>
        <p className="text-muted-foreground mt-1">Review pending content appeals.</p>
      </div>

      {isError && <p className="text-destructive text-sm mb-4">Failed to load appeals queue.</p>}

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded" />
          ))}
        </div>
      ) : appeals.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="rounded-md border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">User</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date Filed</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Justification</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Action</th>
              </tr>
            </thead>
            <tbody>
              {appeals.map((a) => (
                <tr key={a._id} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="px-4 py-3 text-foreground">
                    {a.userId?.email ?? a.userId?.name ?? 'Unknown'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(a.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground max-w-xs">
                    <span className="line-clamp-1">{a.justification}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button size="sm" variant="outline" onClick={() => openReview(a)}>
                      Review
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Review dialog */}
      <Dialog open={!!reviewing} onOpenChange={(o) => !o && setReviewing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Review Appeal</DialogTitle>
          </DialogHeader>
          {reviewing && (
            <div className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-1 uppercase tracking-wide">
                  Justification
                </p>
                <p className="text-sm text-foreground bg-muted/50 rounded p-3">
                  {reviewing.justification}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-1 uppercase tracking-wide">
                  Admin Response (optional)
                </p>
                <Textarea
                  placeholder="Add a note to the user…"
                  value={adminResponse}
                  onChange={(e) => setAdminResponse(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter className="flex gap-2 sm:justify-start">
            <Button
              onClick={() => reviewing && reviewMutation.mutate({ id: reviewing._id, dec: 'accepted' })}
              disabled={reviewMutation.isPending}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Accept
            </Button>
            <Button
              variant="destructive"
              onClick={() => reviewing && reviewMutation.mutate({ id: reviewing._id, dec: 'rejected' })}
              disabled={reviewMutation.isPending}
            >
              Reject
            </Button>
            <Button variant="outline" onClick={() => setReviewing(null)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
