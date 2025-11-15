'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCcw } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts';
import { useWeaveAnalytics } from '@/hooks/useAnalyticsSummaries';
import type { Strand } from '@/types/openstrand';
import { LazyChart } from '@/components/analytics/LazyChart';
import { Badge } from '@/components/ui/badge';

interface WeaveAnalyticsPanelProps {
  /** Workspace identifier: `community` or `team:{id}`. */
  workspaceKey?: string | null;
  /** Strands in the current dashboard view (used for the similarity preview). */
  strands: Strand[];
}

/**
 * Workspace-level analytics module (Weave dashboard). Highlights usage, spend,
 * embedding coverage, and a deterministic similarity preview so users get a
 * sense of structure even before embeddings stream in. Designed for both
 * Community (single weave) and Teams (multi-weave) editions.
 */
export function WeaveAnalyticsPanel({
  workspaceKey,
  strands,
}: WeaveAnalyticsPanelProps) {
  const { data, loading, error, refresh } = useWeaveAnalytics(workspaceKey ?? null);
  const similarityPreview = buildSimilarityPreview(strands);

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle className="text-base">Weave Activity</CardTitle>
          <p className="text-xs text-muted-foreground">
            Workspace-wide metrics (Community vs Team)
          </p>
        </div>
        <Button
          size="icon"
          variant="ghost"
          aria-label="Refresh weave analytics"
          disabled={!workspaceKey || loading}
          onClick={() => void refresh({ force: true })}
        >
          <RefreshCcw className={loading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {!workspaceKey ? (
          <div className="text-sm text-muted-foreground">
            Select a workspace to view weave analytics.
          </div>
        ) : loading && !data ? (
          <Skeleton className="h-48 w-full" />
        ) : error ? (
          <div className="text-sm text-destructive">{error}</div>
        ) : data ? (
          <div className="space-y-4">
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
              <WeaveMetric label="Looms" value={data.metrics.totalLooms} />
              <WeaveMetric label="Strands" value={data.metrics.totalStrands} />
              <WeaveMetric
                label="Storage"
                value={`${(data.metrics.storageFootprintBytes / (1024 * 1024)).toFixed(1)} MB`}
              />
            </div>

            <Card className="border-border/60 bg-muted/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Usage / hour</CardTitle>
              </CardHeader>
              <CardContent>
                <LazyChart minHeight={200}>
                  {() => (
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={data.metrics.usageByHour}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                        <XAxis dataKey="hour" tickFormatter={(hour) => `${hour}h`} />
                        <YAxis />
                        <Tooltip formatter={(value) => [`${value} jobs`, 'Requests']} />
                        <Bar dataKey="count" fill="#0EA5E9" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </LazyChart>
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-muted/20">
              <CardHeader className="pb-2 flex flex-col gap-1">
                <CardTitle className="text-sm font-semibold">Provider spend</CardTitle>
                <div className="text-xs text-muted-foreground">
                  Total ${data.metrics.cost.totalUsd.toFixed(2)} in the past window
                </div>
              </CardHeader>
              <CardContent>
                <LazyChart minHeight={200}>
                  {() => (
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={data.metrics.cost.byProvider}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                        <XAxis dataKey="provider" />
                        <YAxis />
                        <Tooltip formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Spend']} />
                        <Bar dataKey="amount" fill="#F97316" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </LazyChart>
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-muted/20">
              <CardHeader className="pb-2 flex flex-col gap-1">
                <CardTitle className="text-sm font-semibold">
                  Similarity preview (deterministic hash)
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Quick map of recent strands — upgraded to real embeddings when the stream loads.
                </p>
              </CardHeader>
              <CardContent>
                <LazyChart minHeight={220}>
                  {() => (
                    <ResponsiveContainer width="100%" height={220}>
                      <ScatterChart>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                        <XAxis type="number" dataKey="x" hide domain={[0, 1]} />
                        <YAxis type="number" dataKey="y" hide domain={[0, 1]} />
                        <ZAxis type="number" dataKey="size" range={[60, 200]} />
                        <Tooltip
                          cursor={{ strokeDasharray: '3 3' }}
                          content={({ payload }) => {
                            if (!payload?.[0]) return null;
                            return (
                              <div className="rounded-lg border bg-background p-2 shadow-md">
                                <div className="text-xs font-medium text-foreground">
                                  {payload[0].payload?.label || 'Strand'}
                                </div>
                              </div>
                            );
                          }}
                        />
                        <Scatter
                          name="Strands"
                          data={similarityPreview}
                          fill="#8B5CF6"
                          shape="circle"
                        />
                      </ScatterChart>
                    </ResponsiveContainer>
                  )}
                </LazyChart>
              </CardContent>
            </Card>

            <div className="rounded-lg border border-border/50 bg-card/70 p-3 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-foreground">Embedding coverage</span>
                <Badge variant="outline" className="text-[10px]">
                  {data.metrics.embeddingCoverage.percent}% ready
                </Badge>
              </div>
              <div className="mt-2 text-muted-foreground">
                {data.metrics.embeddingCoverage.embedded} strands embedded /{' '}
                {data.metrics.embeddingCoverage.pending} pending
              </div>

              <div className="mt-2 flex flex-wrap gap-2">
                {Object.entries(data.metrics.ratings.counts).map(([rating, count]) => (
                  <Badge key={rating} variant="secondary" className="text-[10px]">
                    {rating}★ · {count}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">
            Workspace analytics will render when metrics are available.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/** KPI tile for weave totals (loom count, strands, storage). */
function WeaveMetric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border border-border/50 bg-card/70 px-3 py-2 text-sm">
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold text-foreground">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
    </div>
  );
}

/**
 * Derives deterministic pseudo coordinates so we can draw a cheap similarity
 * scatterplot before real UMAP/embedding data streams in. This keeps the UI
 * feeling alive even for offline/Community builds.
 */
function buildSimilarityPreview(strands: Strand[]) {
  return strands.slice(0, 24).map((strand, index) => {
    const coords = pseudoCoordinates(strand.id, index);
    const size = Math.min(200, Math.max(40, (strand.summary?.length ?? 80) / 2));
    return {
      x: coords.x,
      y: coords.y,
      size,
      label: strand.title || strand.id,
    };
  });
}

/**
 * Hashes a strand ID into a 0-1 coordinate pair. The extra `index` mixing
 * reduces collisions when multiple strands share similar IDs.
 */
function pseudoCoordinates(seed: string, index: number) {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const normalized = Math.abs(hash) % 1000;
  return {
    x: ((normalized + index * 31) % 1000) / 1000,
    y: ((normalized * 7 + index * 13) % 1000) / 1000,
  };
}

