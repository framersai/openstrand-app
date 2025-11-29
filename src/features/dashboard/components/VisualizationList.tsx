'use client';

/**
 * Visualization List Component
 * Displays generated visualizations and AI recommendations
 * with clean, professional styling
 */

import { Sparkles, Info, Zap, BarChart3, LineChart, PieChart, Table2, TrendingUp, ArrowRight } from 'lucide-react';
import { EmptyVisualization } from '@/components/icons/EmptyVisualization';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { VisualizationDisplay } from '@/components/visualization-display';
import { cn } from '@/lib/utils';
import { formatColumnName, formatChartType, formatAggregation, formatPercent } from '@/lib/utils/format';
import type { Visualization, FeedbackSummary } from '@/types';
import type { InsightRecommendation } from '@/types/insights';
import { recommendationKey } from '../page/recommendation-utils';

// Chart type icons
const CHART_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  bar: BarChart3,
  line: LineChart,
  pie: PieChart,
  table: Table2,
  scatter: TrendingUp,
};

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
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background">
          <CardContent className="p-4">
            {/* Header */}
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Zap className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">AI Insights</h3>
                  <p className="text-xs text-muted-foreground">
                    {autoInsightsLoading 
                      ? 'Analyzing your data...' 
                      : hasRecommendations 
                        ? `${autoInsights.length} suggestions found`
                        : 'Ready to analyze'}
                  </p>
                </div>
              </div>
              {autoInsightsLoading && (
                <Badge variant="secondary" className="gap-1.5 text-[10px] font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                  Processing
                </Badge>
              )}
            </div>

            {/* Error State */}
            {autoInsightsError && (
              <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive mb-4">
                <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                <span>{autoInsightsError}</span>
              </div>
            )}

            {/* Empty State */}
            {!hasRecommendations && !autoInsightsLoading && !autoInsightsError && autoInsightsStatus && (
              <p className="text-xs text-muted-foreground text-center py-4">
                No recommendations available yet.
              </p>
            )}

            {/* Recommendations Grid */}
            {hasRecommendations && (
              <div className="grid gap-2 sm:grid-cols-2">
                {autoInsights.slice(0, 6).map((rec, index) => {
                  const key = recommendationKey(rec);
                  const alreadyGenerated = usedRecommendationKeys?.has(key) ?? false;
                  const ChartIcon = CHART_ICONS[rec.type?.toLowerCase() || 'bar'] || BarChart3;
                  
                  // Format the title nicely
                  const title = rec.title_suggestion 
                    ? rec.title_suggestion
                    : rec.y && rec.x
                      ? `${formatColumnName(rec.y)} by ${formatColumnName(rec.x)}`
                      : rec.x
                        ? `Distribution of ${formatColumnName(rec.x)}`
                        : `Insight ${index + 1}`;

                  return (
                    <button
                      key={`${key}-${index}`}
                      onClick={() => !alreadyGenerated && onRunRecommendation?.(rec)}
                      disabled={alreadyGenerated || !onRunRecommendation}
                      className={cn(
                        "group relative text-left p-3 rounded-lg border transition-all duration-200",
                        "hover:border-primary/40 hover:bg-primary/5",
                        alreadyGenerated 
                          ? "border-primary/30 bg-primary/5 opacity-60 cursor-default"
                          : "border-border/60 bg-card/50 cursor-pointer"
                      )}
                    >
                      {/* Chart Type Badge */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <Badge 
                          variant="secondary" 
                          className="h-5 gap-1 text-[10px] font-medium uppercase tracking-wide"
                        >
                          <ChartIcon className="h-3 w-3" />
                          {formatChartType(rec.type || 'bar')}
                        </Badge>
                        {typeof rec.confidence === 'number' && rec.confidence > 0.7 && (
                          <Badge variant="outline" className="h-5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800">
                            {formatPercent(rec.confidence)}
                          </Badge>
                        )}
                      </div>

                      {/* Title */}
                      <h4 className="text-sm font-medium text-foreground mb-1 line-clamp-2">
                        {title}
                      </h4>

                      {/* Axis Info */}
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                        {rec.x && (
                          <span>
                            <span className="font-medium text-foreground/70">X:</span> {formatColumnName(rec.x)}
                          </span>
                        )}
                        {rec.y && (
                          <span>
                            <span className="font-medium text-foreground/70">Y:</span> {formatColumnName(rec.y)}
                          </span>
                        )}
                        {rec.aggregation && rec.aggregation !== 'none' && (
                          <span>
                            <span className="font-medium text-foreground/70">Agg:</span> {formatAggregation(rec.aggregation)}
                          </span>
                        )}
                      </div>

                      {/* Generate indicator */}
                      {!alreadyGenerated && (
                        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <ArrowRight className="h-4 w-4 text-primary" />
                        </div>
                      )}
                      {alreadyGenerated && (
                        <Badge className="absolute bottom-2 right-2 h-5 text-[10px] bg-primary/20 text-primary border-0">
                          Added
                        </Badge>
                      )}

                      {/* Reason tooltip */}
                      {rec.reason && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              className="absolute top-2 right-2 h-5 w-5 rounded-full bg-muted/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Info className="h-3 w-3 text-muted-foreground" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="left" className="max-w-xs text-xs">
                            {rec.reason}
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </TooltipProvider>
    );
  };

  const renderGeneratingBanner = () => {
    if (!isProcessing) return null;
    return (
      <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-primary flex items-center gap-3">
        <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <span className="font-medium">Generating visualization...</span>
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
        <Card className="min-h-[360px] flex items-center justify-center border-dashed bg-card/50">
          <CardContent className="text-center py-12">
            {isProcessing ? (
              <div className="space-y-4 flex flex-col items-center">
                <div className="h-12 w-12 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                <div>
                  <h3 className="text-lg font-semibold">Generating Visualization</h3>
                  <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                    Processing your request and creating the chart...
                  </p>
                </div>
              </div>
            ) : (
              <>
                <EmptyVisualization className="mx-auto mb-6" size="lg" />
                <h3 className="text-lg font-semibold mb-2">No Visualizations Yet</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  Upload a dataset and use AI Insights or describe what you want to visualize.
                </p>
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
        'space-y-4 transition-shadow',
        highlightNew && 'ring-2 ring-primary/40 ring-offset-2 rounded-xl'
      )}
    >
      {renderRecommendationsPanel()}
      {renderGeneratingBanner()}
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold">Visualizations</h2>
          <Badge variant="secondary" className="text-xs">
            {visualizations.length}
          </Badge>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onClearAll} 
          disabled={isProcessing}
          className="text-xs text-muted-foreground hover:text-destructive"
        >
          Clear All
        </Button>
      </div>

      {/* Visualization Grid */}
      <div className="grid gap-4">
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
