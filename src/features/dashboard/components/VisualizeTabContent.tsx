'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import {
  Sparkles,
  TrendingUp,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Wand2,
  Zap,
  ArrowRight,
  RefreshCw,
  Clock,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { PromptInput } from '@/components/prompt-input';
import { Badge } from '@/components/ui/badge';
import { api, ApiError } from '@/services/api';
import type { DatasetInsights, FeedbackSummary, LeaderboardEntry } from '@/types';
import { useAutoInsightsStore } from '@/store/auto-insights-store';
import { cn } from '@/lib/utils';

export interface AutoInsightsSnapshot {
  insights: DatasetInsights | null;
  isLoading: boolean;
  error: string | null;
  status: string | null;
  logs: string[];
  recommendations: InsightRecommendation[];
}

export interface InsightRecommendation {
  type?: string;
  x?: string;
  y?: string;
  groupBy?: string;
  aggregation?: string;
  prompt?: string;
  title?: string;
  description?: string;
  key?: string;
}

interface VisualizeTabContentProps {
  datasetId: string | null;
  isProcessing: boolean;
  useHeuristics: boolean;
  hasDataset: boolean;
  onSubmitPrompt: (prompt: string) => Promise<void> | void;
  onQuickAction: (prompt: string) => Promise<void> | void;
  onProcessingChange?: (processing: boolean) => void;
  datasetFeedback?: FeedbackSummary | null;
  canSubmitFeedback?: boolean;
  onDatasetVote?: (vote: 'up' | 'down' | null) => void;
  onDatasetFavorite?: (favorite: boolean) => void;
  leaderboardDatasets?: LeaderboardEntry[];
  leaderboardVisualizations?: LeaderboardEntry[];
  leaderboardLoading?: boolean;
  onRefreshLeaderboards?: () => void;
  onNavigateToVisualizations?: () => void;
  onAutoInsightsUpdate?: (snapshot: AutoInsightsSnapshot) => void;
  onRegisterAutoInsightsRunner?: (runner: (() => void) | undefined) => void;
  onRegisterRecommendationRunner?: (
    runner: ((recommendation: InsightRecommendation) => Promise<void>) | undefined
  ) => void;
}

const PROMPT_SUGGESTIONS = [
  'Show a bar chart of top values',
  'Create a pie chart breakdown',
  'Display trends over time',
  'Compare categories side by side',
];

/**
 * Build an intelligent, contextual prompt from a recommendation.
 * 
 * Priority:
 * 1. Use the backend-generated prompt if available (contains full context)
 * 2. Fall back to client-side generation for legacy recommendations
 */
const buildPromptFromRecommendation = (recommendation: InsightRecommendation): string => {
  // Backend now generates rich, contextual prompts - use them if available
  if (recommendation.prompt && recommendation.prompt.length > 50) {
    return recommendation.prompt;
  }

  // Fallback for legacy or simple recommendations
  const type = recommendation.type ?? 'chart';
  const x = recommendation.x;
  const y = recommendation.y;
  const groupBy = recommendation.groupBy;
  const aggregation = recommendation.aggregation;

  // Helper to format column names more naturally
  const formatColumn = (col: string | undefined): string => {
    if (!col) return '';
    return col
      .replace(/_/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .toLowerCase()
      .replace(/\b\w/g, c => c.toUpperCase());
  };

  // Build a reasonable fallback prompt
  const parts: string[] = [];
  
  switch (type.toLowerCase()) {
    case 'line':
      if (x && y) {
        parts.push(`Analyze the trend of ${formatColumn(y)} over ${formatColumn(x)}.`);
        parts.push('Identify patterns, peaks, and anomalies.');
      } else {
        parts.push('Create a line chart showing trends over time.');
      }
      break;

    case 'bar':
      if (x && y) {
        parts.push(`Compare ${formatColumn(y)} across ${formatColumn(x)} categories.`);
        parts.push('Highlight top and bottom performers.');
      } else {
        parts.push('Create a bar chart comparing categories.');
      }
      break;

    case 'pie':
    case 'doughnut':
      if (x) {
        parts.push(`Show the distribution breakdown by ${formatColumn(x)}.`);
        parts.push('Identify dominant segments.');
      } else {
        parts.push('Create a pie chart showing proportional breakdown.');
      }
      break;

    case 'scatter':
      if (x && y) {
        parts.push(`Explore the relationship between ${formatColumn(x)} and ${formatColumn(y)}.`);
        parts.push('Look for correlations and outliers.');
      } else {
        parts.push('Create a scatter plot for correlation analysis.');
      }
      break;

    case 'table':
      parts.push('Display the data in an interactive, sortable table.');
      break;

    default:
      if (y && x) {
        parts.push(`Visualize ${formatColumn(y)} by ${formatColumn(x)}.`);
      } else if (x) {
        parts.push(`Analyze the distribution of ${formatColumn(x)}.`);
      } else {
        parts.push('Create an insightful visualization of this data.');
      }
  }

  if (groupBy) {
    parts.push(`Group by ${formatColumn(groupBy)}.`);
  }

  if (aggregation && aggregation !== 'none') {
    parts.push(`Use ${aggregation} aggregation.`);
  }

  return parts.join(' ');
};

const getRecommendationsFromInsights = (
  insights: DatasetInsights | null
): InsightRecommendation[] => {
  if (!insights) return [];
  return (
    insights.insights?.visualization_recommendations?.natural_visualizations ??
    insights.insights?.recommended_visualizations ??
    []
  );
};

export function VisualizeTabContent({
  datasetId,
  isProcessing,
  useHeuristics,
  hasDataset,
  onSubmitPrompt,
  onQuickAction,
  onProcessingChange,
  onNavigateToVisualizations,
  onAutoInsightsUpdate,
  onRegisterAutoInsightsRunner,
  onRegisterRecommendationRunner,
}: VisualizeTabContentProps) {
  const [autoInsights, setAutoInsights] = useState<DatasetInsights | null>(null);
  const [autoInsightsLoading, setAutoInsightsLoading] = useState(false);
  const [autoInsightsError, setAutoInsightsError] = useState<string | null>(null);
  const [autoInsightsStatus, setAutoInsightsStatus] = useState<string | null>(null);
  const [autoInsightsLogs, setAutoInsightsLogs] = useState<string[]>([]);
  const [clickedRecommendationKey, setClickedRecommendationKey] = useState<string | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null);
  const autoInsightsToastRef = useRef<string | null>(null);

  const cachedInsightsEntry = useAutoInsightsStore((state) =>
    datasetId ? state.entries[datasetId] : undefined
  );
  const setCachedInsights = useAutoInsightsStore((state) => state.setInsights);
  const clearCachedInsights = useAutoInsightsStore((state) => state.clearInsights);

  const appendLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setAutoInsightsLogs((prev) => [...prev, `${timestamp} - ${message}`]);
  }, []);

  useEffect(() => {
    setAutoInsights(null);
    setAutoInsightsError(null);
    setAutoInsightsStatus(null);
    setAutoInsightsLogs([]);
    setLastFetchTime(null);
    autoInsightsToastRef.current = null;
  }, [datasetId]);

  useEffect(() => {
    if (!datasetId || !cachedInsightsEntry) return;
    setAutoInsights(cachedInsightsEntry.insights);
    setAutoInsightsError(null);
    setAutoInsightsStatus((prev) => prev ?? 'Insights ready (cached)');
  }, [datasetId, cachedInsightsEntry]);

  const fetchInsights = useCallback(async (forceRefresh: boolean = false) => {
    if (!datasetId) {
      toast.error('Upload a dataset first');
      return;
    }

    // Use cache only if not forcing refresh
    if (!forceRefresh && cachedInsightsEntry && cachedInsightsEntry.recommendations.length > 0) {
      setAutoInsights(cachedInsightsEntry.insights);
      setAutoInsightsStatus('Using cached insights');
      toast.success('Insights ready (cached)');
      return;
    }

    // Clear cache if forcing refresh
    if (forceRefresh && datasetId) {
      clearCachedInsights(datasetId);
    }

    setAutoInsightsError(null);
    setAutoInsightsLoading(true);
    onProcessingChange?.(true);
    setAutoInsightsStatus(forceRefresh ? 'Fetching fresh insights...' : 'Analyzing dataset...');
    appendLog(forceRefresh ? 'Forcing fresh insights...' : 'Auto Insights started');
    autoInsightsToastRef.current = toast.loading('Generating insights... this may take up to 2 minutes');

    try {
      // Always pass force=true to the API to get fresh results
      const result = await api.getDatasetInsights(datasetId, true);
      setAutoInsights(result);
      const derivedRecommendations = getRecommendationsFromInsights(result);
      setCachedInsights(datasetId, result, derivedRecommendations);
      setAutoInsightsStatus('Analysis complete');
      setLastFetchTime(new Date());
      appendLog('Analysis complete');

      if (autoInsightsToastRef.current) {
        toast.success(`${derivedRecommendations.length} insights ready`, { id: autoInsightsToastRef.current });
      }
      onNavigateToVisualizations?.();
    } catch (error) {
      const message = error instanceof ApiError
        ? error.details?.message || error.message
        : 'Analysis failed';
      setAutoInsightsError(message);
      setAutoInsightsStatus(`Failed: ${message}`);
      appendLog(`Error: ${message}`);
      if (autoInsightsToastRef.current) {
        toast.error(message, { id: autoInsightsToastRef.current });
      }
    } finally {
      setAutoInsightsLoading(false);
      onProcessingChange?.(false);
    }
  }, [appendLog, cachedInsightsEntry, clearCachedInsights, datasetId, onProcessingChange, onNavigateToVisualizations, setCachedInsights]);

  const handleAutoInsights = useCallback(() => fetchInsights(false), [fetchInsights]);
  const handleRefreshInsights = useCallback(() => fetchInsights(true), [fetchInsights]);

  const handleRecommendationRun = useCallback(
    async (recommendation: InsightRecommendation) => {
      const key = recommendation.key || recommendation.title || 'rec';
      setClickedRecommendationKey(key);
      
      const prompt = buildPromptFromRecommendation(recommendation);
      appendLog(`Running recommendation: ${recommendation.title || 'Chart'}`);
      const toastId = toast.loading('Creating visualization...');
      onNavigateToVisualizations?.();

      try {
        await Promise.resolve(onQuickAction(prompt));
        toast.success('Visualization created', { id: toastId });
        appendLog('Visualization created');
      } catch (err) {
        console.error('Failed:', err);
        toast.error('Failed to create visualization', { id: toastId });
        throw err;
      } finally {
        setClickedRecommendationKey(null);
      }
    },
    [appendLog, onNavigateToVisualizations, onQuickAction]
  );

  const recommendations = useMemo<InsightRecommendation[]>(() => {
    return getRecommendationsFromInsights(autoInsights);
  }, [autoInsights]);

  useEffect(() => {
    onAutoInsightsUpdate?.({
      insights: autoInsights,
      isLoading: autoInsightsLoading,
      error: autoInsightsError,
      status: autoInsightsStatus,
      logs: autoInsightsLogs,
      recommendations,
    });
  }, [autoInsights, autoInsightsLoading, autoInsightsError, autoInsightsStatus, autoInsightsLogs, recommendations, onAutoInsightsUpdate]);

  useEffect(() => {
    if (!onRegisterAutoInsightsRunner) return;
    onRegisterAutoInsightsRunner(() => void handleAutoInsights());
    return () => onRegisterAutoInsightsRunner(undefined);
  }, [handleAutoInsights, onRegisterAutoInsightsRunner]);

  useEffect(() => {
    if (!onRegisterRecommendationRunner) return;
    onRegisterRecommendationRunner((rec) => handleRecommendationRun(rec));
    return () => onRegisterRecommendationRunner(undefined);
  }, [handleRecommendationRun, onRegisterRecommendationRunner]);

  const hasCachedInsights = cachedInsightsEntry && cachedInsightsEntry.recommendations.length > 0;

  return (
    <div className="flex flex-col gap-4" role="region" aria-label="Visualization creation panel">
      {/* Prompt Input Section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-foreground">Custom Prompt</h3>
          {useHeuristics && (
            <Badge variant="outline" className="text-xs gap-1">
              <Zap className="h-3 w-3 text-amber-500" aria-hidden="true" />
              Fast Mode
            </Badge>
          )}
        </div>
        <PromptInput
          onSubmit={onSubmitPrompt}
          isProcessing={isProcessing}
          suggestions={PROMPT_SUGGESTIONS}
          placeholder="Describe the visualization you want..."
        />
      </section>

      {/* Divider */}
      <div className="relative py-2">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-border/50" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-card px-3 text-xs text-muted-foreground uppercase tracking-wider">
            or use AI
          </span>
        </div>
      </div>

      {/* Auto Insights Section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
            Auto Insights
          </h3>
          {lastFetchTime && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" aria-hidden="true" />
              {lastFetchTime.toLocaleTimeString()}
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={handleAutoInsights}
            disabled={!hasDataset || isProcessing || autoInsightsLoading}
            className={cn(
              "flex-1 h-10 text-sm font-medium",
              hasCachedInsights ? "bg-secondary text-secondary-foreground hover:bg-secondary/80" : ""
            )}
            variant={hasCachedInsights ? "secondary" : "default"}
            aria-busy={autoInsightsLoading}
          >
            {autoInsightsLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                Analyzing...
              </>
            ) : hasCachedInsights ? (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" aria-hidden="true" />
                View Insights
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" aria-hidden="true" />
                Analyze Data
              </>
            )}
          </Button>
          
          {hasCachedInsights && (
            <Button
              onClick={handleRefreshInsights}
              disabled={!hasDataset || isProcessing || autoInsightsLoading}
              variant="outline"
              size="icon"
              className="h-10 w-10 flex-shrink-0"
              aria-label="Refresh insights"
              title="Get fresh insights"
            >
              <RefreshCw className={cn("h-4 w-4", autoInsightsLoading && "animate-spin")} aria-hidden="true" />
            </Button>
          )}
        </div>
        
        {!hasDataset && (
          <p className="text-xs text-muted-foreground">
            Upload a dataset to enable AI analysis
          </p>
        )}
      </section>

      {/* Status & Recommendations */}
      {(autoInsightsLoading || autoInsightsError || recommendations.length > 0) && (
        <section className="space-y-3 pt-2">
          {/* Status Bar */}
          {(autoInsightsLoading || autoInsightsError) && (
            <div 
              className={cn(
                "flex items-center gap-2 p-2.5 rounded-lg text-xs font-medium",
                autoInsightsLoading && "bg-primary/5 text-primary",
                autoInsightsError && "bg-destructive/10 text-destructive"
              )}
              role="status"
              aria-live="polite"
            >
              {autoInsightsLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              <span>{autoInsightsLoading ? 'Analyzing your data...' : autoInsightsError}</span>
            </div>
          )}

          {/* Recommendations Table */}
          {recommendations.length > 0 && !autoInsightsLoading && (
            <div className="border border-border/50 rounded-lg overflow-hidden">
              <div className="bg-muted/30 px-3 py-2 border-b border-border/50">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-foreground">
                    AI Suggestions
                  </span>
                  <Badge variant="secondary" className="text-xs h-5">
                    {recommendations.length}
                  </Badge>
                </div>
              </div>
              <div className="divide-y divide-border/30" role="list">
                {recommendations.slice(0, 6).map((rec, i) => {
                  const key = rec.key || rec.title || `rec-${i}`;
                  const isClicked = clickedRecommendationKey === key;
                  const chartType = rec.type || 'chart';
                  const title = rec.title || `${chartType}: ${rec.y || 'metric'}`;
                  
                  return (
                    <button
                      key={key}
                      onClick={() => handleRecommendationRun(rec)}
                      disabled={isProcessing || isClicked}
                      className={cn(
                        "w-full text-left px-3 py-2.5 transition-colors",
                        "hover:bg-accent/50 focus-visible:bg-accent/50",
                        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-primary",
                        "disabled:opacity-50 disabled:cursor-not-allowed",
                        isClicked && "bg-primary/5"
                      )}
                      role="listitem"
                      aria-busy={isClicked}
                    >
                      <div className="flex items-center gap-3">
                        <div 
                          className={cn(
                            "flex-shrink-0 w-7 h-7 rounded-md flex items-center justify-center text-xs font-medium",
                            "bg-primary/10 text-primary"
                          )}
                          aria-hidden="true"
                        >
                          {isClicked ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <TrendingUp className="h-3.5 w-3.5" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-foreground truncate">
                              {title}
                            </span>
                            <Badge variant="outline" className="text-[10px] h-4 px-1.5 flex-shrink-0">
                              {chartType}
                            </Badge>
                          </div>
                          {rec.description && (
                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                              {rec.description}
                            </p>
                          )}
                        </div>
                        <ArrowRight 
                          className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" 
                          aria-hidden="true"
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Empty State */}
      {!hasDataset && !autoInsightsLoading && recommendations.length === 0 && (
        <div className="text-center py-6" role="status">
          <Wand2 className="h-8 w-8 text-muted-foreground/50 mx-auto mb-3" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">
            Upload data to unlock AI-powered insights
          </p>
        </div>
      )}
    </div>
  );
}
