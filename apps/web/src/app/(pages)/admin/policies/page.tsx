'use client';
import { useEffect, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

const CATEGORY_LABELS: Record<string, string> = {
  graphic_violence: 'Graphic Violence',
  hate_symbols: 'Hate Symbols',
  self_harm: 'Self-Harm',
  extremist_propaganda: 'Extremist Propaganda',
  weapons_contraband: 'Weapons & Contraband',
  harassment_humiliation: 'Harassment & Humiliation',
};

interface Policy {
  _id: string;
  category: string;
  enabled: boolean;
  confidenceThreshold: number;
  enforcement: 'auto_block' | 'flag_for_review';
}

interface RowState {
  enabled: boolean;
  confidenceThreshold: number;
  enforcement: 'auto_block' | 'flag_for_review';
}

export default function PoliciesPage() {
  const { data, isLoading, isError } = useQuery<{ data: Policy[] }>({
    queryKey: ['policies'],
    queryFn: () => api.get('/policies').then((r) => r.data),
  });

  const policies = data?.data ?? [];

  // Per-row local state
  const [rows, setRows] = useState<Record<string, RowState>>({});

  useEffect(() => {
    if (!policies.length) return;
    const init: Record<string, RowState> = {};
    for (const p of policies) {
      init[p.category] = {
        enabled: p.enabled,
        confidenceThreshold: p.confidenceThreshold,
        enforcement: p.enforcement,
      };
    }
    setRows(init);
  }, [data]);

  const updateRow = (category: string, patch: Partial<RowState>) => {
    setRows((prev) => ({ ...prev, [category]: { ...prev[category], ...patch } }));
  };

  const isDirty = (p: Policy) => {
    const r = rows[p.category];
    if (!r) return false;
    return (
      r.enabled !== p.enabled ||
      r.confidenceThreshold !== p.confidenceThreshold ||
      r.enforcement !== p.enforcement
    );
  };

  const saveMutation = useMutation({
    mutationFn: ({ category, state }: { category: string; state: RowState }) =>
      api.patch(`/policies/${category}`, state).then((r) => r.data),
    onSuccess: () => toast.success('Policy saved'),
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Save failed';
      toast.error(msg);
    },
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Content Policies</h1>
        <p className="text-muted-foreground mt-1">
          Configure moderation thresholds and enforcement for each category.
        </p>
      </div>

      {isError && <p className="text-destructive text-sm mb-4">Failed to load policies.</p>}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded" />
          ))}
        </div>
      ) : (
        <>
          <div className="rounded-md border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Category</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Enabled</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground w-56">
                    Confidence Threshold
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Enforcement</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Action</th>
                </tr>
              </thead>
              <tbody>
                {policies.map((p) => {
                  const row = rows[p.category];
                  if (!row) return null;
                  return (
                    <tr key={p.category} className="border-b border-border/50">
                      <td className="px-4 py-4 font-medium text-foreground">
                        {CATEGORY_LABELS[p.category] ?? p.category}
                      </td>
                      <td className="px-4 py-4">
                        <Switch
                          checked={row.enabled}
                          onCheckedChange={(v) => updateRow(p.category, { enabled: v })}
                        />
                      </td>
                      <td className="px-4 py-4 w-56">
                        <div className="flex items-center gap-3">
                          <Slider
                            value={[row.confidenceThreshold]}
                            onValueChange={([v]) =>
                              updateRow(p.category, { confidenceThreshold: v })
                            }
                            min={0}
                            max={100}
                            step={1}
                            className="flex-1"
                          />
                          <Badge variant="outline" className="w-12 justify-center shrink-0">
                            {row.confidenceThreshold}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <Select
                          value={row.enforcement}
                          onValueChange={(v) =>
                            updateRow(p.category, { enforcement: v as RowState['enforcement'] })
                          }
                        >
                          <SelectTrigger className="w-44">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="flag_for_review">Flag for Review</SelectItem>
                            <SelectItem value="auto_block">Auto-Block</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <Button
                          size="sm"
                          disabled={!isDirty(p) || saveMutation.isPending}
                          onClick={() => saveMutation.mutate({ category: p.category, state: row })}
                        >
                          Save
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-muted-foreground mt-4">
            * Policy changes only apply to new submissions.
          </p>
        </>
      )}
    </div>
  );
}
