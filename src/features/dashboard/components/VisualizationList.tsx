'use client';

import { Sparkles, Info } from 'lucide-react';
import { EmptyVisualization } from '@/components/icons/EmptyVisualization';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { VisualizationDisplay } from '@/components/visualization-display';
import { cn } from '@/lib/utils';
import type { Visualization, FeedbackSummary } from '@/types';
import type { InsightRecommendation } from '@/types/insights';
import { recommendationKey } from '../page/recommendation-utils';

const PREVIEW_BAR_COUNT = 8;

function createPreviewBars(seed: string): number[] {
  const source = seed && seed.length > 0 ? seed : 'insight';
  const values: number[] = [];
  let accumulator = 0;
  for (let i = 0; i < PREVIEW_BAR_COUNT; i++) {
    const char = source.charCodeAt(i % source.length);
    accumulator = (accumulator + char * (i + 3)) % 101;
    values.push(20 + (accumulator % 60));
  }
  return values;
}

interface VisualizationListProps {
  visualizations: Visualization[];
  onClearAll: () => void;
  onExport: (visualization: Visualization) => void;
  onRemove: (visualizationId: string) => void;
  onModify: (visualizationId: string, prompt: string) => void;
  isProcessing?: boolean;
  feedbackMap?: Record<string, FeedbackSummary | undefined>;
  canSubmitFeedback?: boolean;
  onVote?: (visualizationId: string, vote: 'up' | 'down' | null) => void;
  onFavoriteToggle?: (visualizationId: string, favorite: boolean) => void;
  highlightNew?: boolean;
  autoInsights?: InsightRecommendation[];
  autoInsightsLoading?: boolean;
  autoInsightsError?: string | null;
  autoInsightsStatus?: string | null;
  onRunRecommendation?: (recommendation: InsightRecommendation) => void;
  savedVisualizationIds?: Set<string>;
  usedRecommendationKeys?: Set<string>;
}

export function VisualizationList({
  visualizations,
  onClearAll,
  onExport,
  onRemove,
  onModify,
  isProcessing = false,
  feedbackMap = {},
  canSubmitFeedback = false,
  onVote,
  onFavoriteToggle,
  highlightNew = false,
  autoInsights = [],
  autoInsightsLoading = false,
  autoInsightsError = null,
  autoInsightsStatus = null,
  onRunRecommendation,
  savedVisualizationIds,
  usedRecommendationKeys,
}: VisualizationListProps) {
  const hasRecommendations = autoInsights.length > 0;
  const showRecommendationsPanel = autoInsightsLoading || Boolean(autoInsightsError) || hasRecommendations || Boolean(autoInsightsStatus);

  const buildFeedbackSummary = (viz: Visualization): FeedbackSummary => {
    const existing = feedbackMap[viz.id];
    const isSaved = savedVisualizationIds?.has(viz.id) ?? false;

    if (existing) {
      return {
        ...existing,
        userFavorite: isSaved || existing.userFavorite,
      };
    }

    return {
      targetId: viz.id,
      datasetId: viz.datasetId,
      likes: 0,
      dislikes: 0,
      favorites: isSaved ? 1 : 0,
      score: 0,
      userVote: null,
      userFavorite: isSaved,
    };
  };

  const renderRecommendationsPanel = () => {
    if (!showRecommendationsPanel) {
      return null;
    }

    return (
      <TooltipProvider>
        <div className="glass-card rounded-xl p-4 space-y-3 animate-in">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Sparkles className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-semibold">AI Suggestions</p>
              <p className="text-xs text-muted-foreground">
                {autoInsightsStatus || 'Discover ready-made charts tailored to this dataset.'}
              </p>
            </div>
          </div>
          {autoInsightsLoading && (
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 px-3 py-1 text-[11px] text-muted-foreground">
              <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
              Processing
            </div>
          )}
        </div>

        {autoInsightsError && (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            <Info className="mt-0.5 h-3.5 w-3.5" />
            <span>{autoInsightsError}</span>
          </div>
        )}

        {!hasRecommendations && !autoInsightsLoading && !autoInsightsError && autoInsightsStatus && (
          <p className="text-xs text-muted-foreground">No recommended visuals returned yet.</p>
        )}

        {hasRecommendations && (
          <ul className="grid gap-2">
            {autoInsights.slice(0, 5).map((rec, index) => {
              const key = recommendationKey(rec);
              const label = rec.title_suggestion || rec.type || `Suggestion ${index + 1}`;
              const bars = createPreviewBars(key);
              const alreadyGenerated = usedRecommendationKeys?.has(key) ?? false;
              return (
                <li
                  key={`${label}-${index}`}
                  className="rounded-lg border border-border/60 bg-background/70 px-3 py-2 text-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold text-foreground">{label}</p>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              className="inline-flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide text-primary"
                            >
                              Why?
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="max-w-xs">
                            <p>{rec.reason || 'Suggested insight based on Auto Insights analysis.'}</p>
                          </TooltipContent>
                        </Tooltip>
                        {rec.aggregation && rec.aggregation !== 'none' && (
                          <span className="text-[11px] text-muted-foreground">
                            Uses {rec.aggregation} aggregation
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {typeof rec.confidence === 'number' && (
                        <span className="rounded-full border border-border/40 px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                          {(rec.confidence * 100).toFixed(0)}% confident
                        </span>
                      )}
                      {alreadyGenerated && (
                        <span className="rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-primary">
                          Generated
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-2 grid gap-1 text-[11px] text-muted-foreground sm:grid-cols-2">
                    {rec.x && <span><strong>X:</strong> {rec.x}</span>}
                    {rec.y && <span><strong>Y:</strong> {rec.y}</span>}
                    {rec.groupBy && <span><strong>Group:</strong> {rec.groupBy}</span>}
                    {rec.aggregation && rec.aggregation !== 'none' && (
                      <span><strong>Aggregation:</strong> {rec.aggregation}</span>
                    )}
                  </div>

                  <div className="mt-3 flex h-12 items-end gap-1 rounded-md bg-primary/5 px-2 py-2">
                    {bars.map((height, barIndex) => (
                      <span
                        key={`${label}-bar-${barIndex}`}
                        style={{ height: `${height}%` }}
                        className="flex-1 rounded-full bg-gradient-to-t from-primary/30 via-primary/60 to-primary/80"
                      />
                    ))}
                  </div>

                  {onRunRecommendation && (
                    <div className="mt-2 flex justify-end">
                      <Button
                        size="sm"
                        variant={alreadyGenerated ? 'secondary' : 'outline'}
                        className="text-xs"
                        disabled={alreadyGenerated}
                        onClick={() => { void onRunRecommendation(rec); }}
                      >
                        {alreadyGenerated ? 'Added' : 'Generate'}
                      </Button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        </div>
      </TooltipProvider>
    );
  };

  const renderGeneratingBanner = () => {
    if (!isProcessing) return null;
    return (
      <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 px-4 py-3 text-sm text-primary flex items-center gap-2">
        <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <span>Generating visualization...</span>
      </div>
    );
  };

  if (visualizations.length === 0) {
    return (
      <div
        className={cn(
          'space-y-4 transition-shadow',
          highlightNew && 'ring-2 ring-primary/40 ring-offset-2 rounded-xl'
        )}
      >
        {renderRecommendationsPanel()}
        <Card className="glass-card h-full min-h-[420px] flex items-center justify-center overflow-hidden">
          <CardContent className="text-center relative knowledge-particles pt-10 sm:pt-14 pb-8">
            {isProcessing ? (
              <div className="space-y-3 flex flex-col items-center">
                <div className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin pulse-glow" />
                <h3 className="text-lg font-semibold gradient-text">Generating visualization...</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Hang tight while we process your request and render the chart. Results will appear here.
                </p>
              </div>
            ) : (
              <>
                <EmptyVisualization className="mx-auto mb-6 float" size="xl" />
                <h3 className="text-lg font-semibold mb-2 gradient-text">No Visualizations Yet</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  Upload a dataset and describe what you want to visualize using natural language.
                </p>
                <Button className="mt-6 btn-neon" size="sm">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Get Started
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'space-y-6 transition-shadow',
        highlightNew && 'ring-2 ring-primary/40 ring-offset-2 rounded-xl'
      )}
    >
      {renderRecommendationsPanel()}
      {renderGeneratingBanner()}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Visualizations ({visualizations.length})</h2>
        <Button variant="outline" size="sm" onClick={onClearAll} disabled={isProcessing}>
          Clear All
        </Button>
      </div>

      <div className="grid gap-6">
        {visualizations.map((viz) => (
          <VisualizationDisplay
            key={viz.id}
            visualization={viz}
            onExport={() => onExport(viz)}
            onRemove={() => onRemove(viz.id)}
            onModify={(prompt) => onModify(viz.id, prompt)}
            disabled={isProcessing}
            feedback={buildFeedbackSummary(viz)}
            feedbackDisabled={!canSubmitFeedback && !onFavoriteToggle}
            onFeedbackVote={(vote) => onVote?.(viz.id, vote)}
            onFavoriteChange={(favorite) => onFavoriteToggle?.(viz.id, favorite)}
          />
        ))}
      </div>
    </div>
  );
}
