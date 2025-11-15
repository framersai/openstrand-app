'use client';

import { useMemo, useState } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCcw, GraduationCap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { scaleLinear } from 'd3-scale';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { Strand } from '@/types/openstrand';
import { useStrandAnalytics } from '@/hooks/useAnalyticsSummaries';
import { LazyChart } from '@/components/analytics/LazyChart';
import { cn } from '@/lib/utils';

interface StrandAnalyticsPanelProps {
  /** Strand list (filtered view) used for selection + metadata fallback. */
  strands: Strand[];
  /** Currently focused strand ID (or null if none). */
  selectedStrandId: string | null;
  /** Selection callback so the dashboard can keep state in sync. */
  onSelect: (strandId: string) => void;
}

const POS_COLORS = ['#0EA5E9', '#6366F1', '#EC4899', '#F97316', '#22C55E', '#14B8A6'];

/**
 * Presents strand-level analytics (entity histogram, POS donut, keyword cloud,
 * readability gauges, sentiment/rating summary) inside the PKMS dashboard.
 * All heavy visualisations are lazy-rendered via `<LazyChart>` to avoid TTI
 * regressions, and the component is dependency-free beyond the shared chart libs.
 */
export function StrandAnalyticsPanel({
  strands,
  selectedStrandId,
  onSelect,
}: StrandAnalyticsPanelProps) {
  const { toast } = useToast();
  const [generatingStudy, setGeneratingStudy] = useState(false);

  const strandOptions = strands.map((strand) => ({
    id: strand.id,
    label: strand.title || strand.slug || strand.id,
  }));

  const selectedStrand = useMemo(
    () => strands.find((strand) => strand.id === selectedStrandId) ?? strands[0],
    [selectedStrandId, strands],
  );

  const { data, loading, error, refresh } = useStrandAnalytics(selectedStrand?.id);

  const handleGenerateStudy = async () => {
    if (!selectedStrand?.id) return;

    setGeneratingStudy(true);
    try {
      const response = await fetch('/api/v1/analytics/study/strand', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          strandId: selectedStrand.id,
          type: 'flashcards',
          count: 10,
          difficulty: 'intermediate',
          focusAreas: ['entities', 'keywords'],
        }),
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: 'Study materials created',
          description: `Generated ${result.data?.flashcards?.length || 0} flashcards from analytics`,
        });
      } else {
        throw new Error('Failed to generate study materials');
      }
    } catch (err) {
      toast({
        title: 'Generation failed',
        description: err instanceof Error ? err.message : 'Unable to create study materials',
      });
    } finally {
      setGeneratingStudy(false);
    }
  };

  const keywordScale = useMemo(() => {
    if (!data?.metrics.keywords?.length) {
      return scaleLinear().domain([0, 1]).range([0.9, 1.25]);
    }
    const maxScore = Math.max(...data.metrics.keywords.map((entry) => entry.score || 0), 1);
    return scaleLinear().domain([0, maxScore]).range([0.9, 1.4]);
  }, [data?.metrics.keywords]);

  return (
    <Card className="h-full">
      <CardHeader className="space-y-4 pb-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base">Strand Insights</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={selectedStrand?.id}
              onValueChange={(value) => onSelect(value)}
            >
              <SelectTrigger className="w-full sm:w-[200px] text-sm">
                <SelectValue placeholder="Select strand" />
              </SelectTrigger>
              <SelectContent>
                {strandOptions.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              variant="outline"
              className="gap-2"
              onClick={handleGenerateStudy}
              disabled={!data || generatingStudy}
            >
              <GraduationCap className={cn('h-4 w-4', generatingStudy && 'animate-pulse')} />
              <span className="hidden sm:inline">Study this</span>
            </Button>
            <Button
              size="icon"
              variant="ghost"
              aria-label="Refresh analytics"
              onClick={() => void refresh({ force: true })}
              disabled={loading || !selectedStrand?.id}
            >
              <RefreshCcw className={cn('h-4 w-4', loading && 'animate-spin')} />
            </Button>
          </div>
        </div>
        {selectedStrand?.noteType ? (
          <Badge variant="outline" className="w-fit text-[10px] uppercase tracking-wide">
            {selectedStrand.noteType}
          </Badge>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-4">
        {!selectedStrand ? (
          <div className="text-sm text-muted-foreground">
            Create a strand to view analytics.
          </div>
        ) : loading && !data ? (
          <Skeleton className="h-56 w-full" />
        ) : error ? (
          <div className="text-sm text-destructive">{error}</div>
        ) : data ? (
          <div className="space-y-4">
            <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
              <MetricCard label="Tokens" value={data.metrics.tokenCount.toLocaleString()} />
              <MetricCard label="Words" value={data.metrics.wordCount.toLocaleString()} />
              <MetricCard
                label="Reading Time"
                value={`${data.metrics.readingTimeMinutes.toFixed(1)} min`}
              />
              <MetricCard
                label="Embeddings"
                value={`${data.metrics.chunkCount} chunks`}
                hint={data.metadata.lastEmbeddedAt ? `Last embed ${new Date(data.metadata.lastEmbeddedAt).toLocaleDateString()}` : 'Not embedded yet'}
              />
            </div>

            <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
              <Card className="border-border/60 bg-muted/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Entity histogram</CardTitle>
                </CardHeader>
                <CardContent>
                  <LazyChart minHeight={220}>
                    {() => (
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={data.metrics.entityHistogram}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                          <XAxis dataKey="type" tick={{ fontSize: 11 }} />
                          <YAxis allowDecimals={false} />
                          <Tooltip />
                          <Bar dataKey="count" fill="#6366F1" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </LazyChart>
                </CardContent>
              </Card>

              <Card className="border-border/60 bg-muted/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">
                    POS distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <LazyChart minHeight={220}>
                    {() => (
                      <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                          <Tooltip />
                          <Pie
                            data={Object.entries(data.metrics.posDistribution).map(([type, value]) => ({
                              type,
                              value,
                            }))}
                            dataKey="value"
                            nameKey="type"
                            innerRadius={40}
                            outerRadius={80}
                            paddingAngle={2}
                          >
                            {Object.keys(data.metrics.posDistribution).map((_, index) => (
                              <Cell
                                key={`pos-${index}`}
                                fill={POS_COLORS[index % POS_COLORS.length]}
                              />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </LazyChart>
                </CardContent>
              </Card>
            </div>

            <Card className="border-border/60 bg-muted/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Keyword cloud</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {data.metrics.keywords.map((keyword) => {
                    const scale = keywordScale(keyword.score || 0);
                    return (
                      <span
                        key={keyword.term}
                        className="rounded-full bg-background px-3 py-1 text-sm font-medium text-foreground/80 shadow-sm"
                        style={{
                          fontSize: `${scale}rem`,
                        }}
                      >
                        {keyword.term}
                      </span>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-muted/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Readability</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <ReadabilityBar
                  label="Flesch–Kincaid"
                  score={data.metrics.readability.fleschKincaid}
                  target={60}
                />
                <ReadabilityBar
                  label="Coleman–Liau"
                  score={data.metrics.readability.colemanLiau}
                  target={12}
                  inverted
                />
                <div className="grid gap-2 text-xs text-muted-foreground md:grid-cols-2">
                  <div>
                    <div className="font-medium text-foreground">Sentiment</div>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge variant="outline" className="text-[11px]">
                        {`Compound ${(data.metrics.sentiment.compound * 100).toFixed(1)}%`}
                      </Badge>
                      <Badge variant="secondary" className="text-[11px]">
                        {`Positive ${(data.metrics.sentiment.positive * 100).toFixed(1)}%`}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <div className="font-medium text-foreground">Ratings</div>
                    <div className="mt-1 flex flex-wrap gap-1 text-[11px]">
                      {Object.entries(data.ratings.counts).map(([rating, count]) => (
                        <Badge key={rating} variant="outline">
                          {rating}★ · {count}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">
            Analytics will appear once this strand has been processed.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Displays a small KPI tile with optional hint line.
 */
function MetricCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-lg border border-border/40 bg-card/70 px-3 py-2 text-sm">
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold text-foreground">{value}</div>
      {hint ? <div className="text-[11px] text-muted-foreground">{hint}</div> : null}
    </div>
  );
}

/**
 * Thin wrapper around the Progress bar that visualises readability scores.
 */
function ReadabilityBar({
  label,
  score,
  target,
  inverted = false,
}: {
  label: string;
  score: number;
  target: number;
  inverted?: boolean;
}) {
  const pct = Math.max(
    0,
    Math.min(100, inverted ? (target / Math.max(score, 0.01)) * 100 : (score / target) * 100),
  );
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="font-medium text-foreground">{label}</span>
        <span className="text-muted-foreground">{score.toFixed(1)}</span>
      </div>
      <Progress value={pct} className="h-2" />
    </div>
  );
}

