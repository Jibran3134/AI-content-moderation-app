'use client';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api, { getImageUrl } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

const outcomeColors: Record<string, string> = {
  approved: 'bg-green-500/20 text-green-400 border-green-500/30',
  flagged:  'bg-amber-500/20 text-amber-400 border-amber-500/30',
  blocked:  'bg-red-500/20 text-red-400 border-red-500/30',
};

interface CategoryResult {
  category: string;
  detected: boolean;
  confidence: number;
  reasoning: string;
}

interface Submission {
  _id: string;
  imageUrl: string;
  createdAt: string;
  appealId?: string;
  verdict?: {
    outcome: 'approved' | 'flagged' | 'blocked';
    categoryResults: CategoryResult[];
  };
}

function humanCategory(cat: string) {
  const map: Record<string, string> = {
    graphic_violence: 'Graphic Violence',
    hate_symbols: 'Hate Symbols',
    self_harm: 'Self-Harm',
    extremist_propaganda: 'Extremist Propaganda',
    weapons_contraband: 'Weapons & Contraband',
    harassment_humiliation: 'Harassment & Humiliation',
  };
  return map[cat] ?? cat;
}

export default function SubmissionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [justification, setJustification] = useState('');

  const { data, isLoading, isError } = useQuery<{ data: Submission }>({
    queryKey: ['submission', id],
    queryFn: () => api.get(`/submissions/${id}`).then((r) => r.data),
  });

  const sub = data?.data;

  const appealMutation = useMutation({
    mutationFn: () =>
      api.post('/appeals', { submissionId: id, justification }).then((r) => r.data),
    onSuccess: () => {
      toast.success('Appeal filed successfully');
      setDialogOpen(false);
      setJustification('');
      qc.invalidateQueries({ queryKey: ['submission', id] });
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Failed to file appeal';
      toast.error(msg);
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-72 w-full rounded-lg" />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  if (isError || !sub) {
    return (
      <div className="max-w-4xl mx-auto">
        <p className="text-destructive">Failed to load submission.</p>
      </div>
    );
  }

  const outcome = sub.verdict?.outcome;
  const canAppeal = (outcome === 'flagged' || outcome === 'blocked') && !sub.appealId;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-1">Submission Detail</h1>
        <p className="text-xs text-muted-foreground font-mono">{sub._id}</p>
      </div>

      {/* Image */}
      <div className="rounded-lg overflow-hidden border border-border bg-muted max-h-96">
        <img
          src={getImageUrl(sub.imageUrl)}
          alt="Submission"
          className="w-full h-full object-contain"
          onError={(e) => {
            (e.target as HTMLImageElement).alt = 'Image unavailable';
          }}
        />
      </div>

      {/* Outcome + date */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          {outcome && (
            <Badge variant="outline" className={outcomeColors[outcome]}>
              {outcome.toUpperCase()}
            </Badge>
          )}
          {sub.appealId && (
            <Badge variant="outline" className="text-muted-foreground">
              Appeal Filed
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {new Date(sub.createdAt).toLocaleString()}
        </p>
      </div>

      {/* Category results */}
      {sub.verdict?.categoryResults && sub.verdict.categoryResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Category Analysis</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left py-2 pr-4 font-medium">Category</th>
                  <th className="text-left py-2 pr-4 font-medium">Detected</th>
                  <th className="text-left py-2 pr-4 font-medium w-36">Confidence</th>
                  <th className="text-left py-2 font-medium">Reasoning</th>
                </tr>
              </thead>
              <tbody>
                {sub.verdict.categoryResults.map((r) => (
                  <tr key={r.category} className="border-b border-border/50">
                    <td className="py-3 pr-4 font-medium text-foreground">
                      {humanCategory(r.category)}
                    </td>
                    <td className="py-3 pr-4">
                      <Badge
                        variant="outline"
                        className={
                          r.detected
                            ? 'text-red-400 border-red-500/30'
                            : 'text-green-400 border-green-500/30'
                        }
                      >
                        {r.detected ? 'Yes' : 'No'}
                      </Badge>
                    </td>
                    <td className="py-3 pr-4 w-36">
                      <div className="flex items-center gap-2">
                        <Progress value={r.confidence} className="h-2 flex-1" />
                        <span className="text-xs text-muted-foreground w-8">{r.confidence}%</span>
                      </div>
                    </td>
                    <td className="py-3 text-muted-foreground text-xs max-w-xs">
                      {r.reasoning}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Appeal button */}
      {canAppeal && (
        <div>
          <Button onClick={() => setDialogOpen(true)}>File an Appeal</Button>
        </div>
      )}

      {/* Appeal dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>File an Appeal</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Explain why you believe this content should not be {outcome}.
          </p>
          <Textarea
            placeholder="Provide your justification (min 10 characters)…"
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            rows={5}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => appealMutation.mutate()}
              disabled={justification.trim().length < 10 || appealMutation.isPending}
            >
              {appealMutation.isPending ? 'Submitting…' : 'Submit Appeal'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
