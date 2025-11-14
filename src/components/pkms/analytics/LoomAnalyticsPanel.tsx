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
import { Badge } from '@/components/ui/badge';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useLoomAnalytics } from '@/hooks/useAnalyticsSummaries';
import { LazyChart } from '@/components/analytics/LazyChart';

interface LoomAnalyticsPanelProps {
  /** Optional scope ID (StrandScope). When absent we show a gentle helper. */
  scopeId?: string | null;
  /** Optional label override (e.g., Loom name from metadata). */
  title?: string;
}

const TOPIC_COLORS = ['#0EA5E9', '#6366F1', '#F472B6', '#F97316', '#22C55E', '#14B8A6'];

/**
 * Aggregated dashboard tile for Loom/project scopes. Summarises strand totals,
 * vocabulary growth, topic mix, embedding coverage, and rating averages. Used
 * directly inside PKMS dashboard alongside the strand + weave panels.
 */
export function LoomAnalyticsPanel({ scopeId, title }: LoomAnalyticsPanelProps) {
  const { data, loading, error, refresh } = useLoomAnalytics(scopeId ?? null);

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <div>
          <CardTitle className="text-base">
            {title ?? data?.name ?? 'Loom Overview'}
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Aggregated KPIs for the active project scope
          </p>
        </div>
        <Button
          size="icon"
          variant="ghost"
          aria-label="Refresh loom analytics"
          disabled={!scopeId || loading}
          onClick={() => void refresh({ force: true })}
        >
          <RefreshCcw className={loading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {!scopeId ? (
          <div className="text-sm text-muted-foreground">
            Select a strand with a primary scope to load Loom analytics.
          </div>
        ) : loading && !data ? (
          <Skeleton className="h-48 w-full" />
        ) : error ? (
          <div className="text-sm text-destructive">{error}</div>
        ) : data ? (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <LoomMetric label="Strands" value={data.metrics.totalStrands} />
              <LoomMetric
                label="Tokens"
                value={data.metrics.totalTokens}
                hint="Total tokens across strands"
              />
              <LoomMetric
                label="Avg / Strand"
                value={data.metrics.averageTokensPerStrand.toFixed(1)}
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="border-border/60 bg-muted/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">
                    Topic distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <LazyChart minHeight={200}>
                    {() => (
                      <ResponsiveContainer height={200}>
                        <PieChart>
                          <Tooltip />
                          <Pie
                            data={data.metrics.topicDistribution}
                            dataKey="value"
                            nameKey="label"
                            innerRadius={40}
                            outerRadius={70}
                            paddingAngle={3}
                          >
                            {data.metrics.topicDistribution.map((_, index) => (
                              <Cell
                                key={`topic-${index}`}
                                fill={TOPIC_COLORS[index % TOPIC_COLORS.length]}
                              />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </LazyChart>
                </CardContent>
              </Card>

              <Card className="border-border/60 bg-muted/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Vocabulary growth</CardTitle>
                </CardHeader>
                <CardContent>
                  <LazyChart minHeight={200}>
                    {() => (
                      <ResponsiveContainer height={200}>
                        <AreaChart data={data.metrics.vocabularyGrowth}>
                          <defs>
                            <linearGradient id="tokenArea" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#6366F1" stopOpacity={0.8} />
                              <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                          <YAxis />
                          <Tooltip />
                          <Area
                            type="monotone"
                            dataKey="tokens"
                            stroke="#6366F1"
                            fillOpacity={1}
                            fill="url(#tokenArea)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                  </LazyChart>
                </CardContent>
              </Card>
            </div>

            <div className="rounded-lg border border-border/50 bg-card/60 p-3 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-foreground">Embedding coverage</span>
                <Badge variant="outline" className="text-[10px]">
                  {data.metrics.embeddingCoverage.percent}% ready
                </Badge>
              </div>
              <div className="mt-2 flex items-center gap-4">
                <div className="text-muted-foreground">
                  {data.metrics.embeddingCoverage.embedded} embedded /{' '}
                  {data.metrics.embeddingCoverage.pending} pending
                </div>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <RatingBadge
                  title="Human average"
                  value={data.metrics.ratings.humanAverage}
                  variant="default"
                />
                <RatingBadge
                  title="LLM average"
                  value={data.metrics.ratings.llmAverage}
                  variant="secondary"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">
            Loom analytics will render once data is available.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Small helper to render KPI tiles with consistent styling.
 */
function LoomMetric({
  label,
  value,
  hint,
}: {
  label: string;
  value: number | string;
  hint?: string;
}) {
  return (
    <div className="rounded-lg border border-border/50 bg-card/70 px-3 py-2 text-sm">
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold text-foreground">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      {hint ? <div className="text-[11px] text-muted-foreground">{hint}</div> : null}
    </div>
  );
}

/**
 * Shared badge component for human/LLM rating averages.
 */
function RatingBadge({
  title,
  value,
  variant,
}: {
  title: string;
  value: number;
  variant: 'default' | 'secondary';
}) {
  return (
    <div className="flex items-center justify-between rounded-md border border-border/40 bg-background/70 px-3 py-2">
      <span className="text-xs text-muted-foreground">{title}</span>
      <Badge variant={variant} className="text-xs">
        {value.toFixed(2)}
      </Badge>
    </div>
  );
}

