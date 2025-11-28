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

const buildPromptFromRecommendation = (recommendation: InsightRecommendation): string => {
  if (recommendation.prompt) return recommendation.prompt;

  const type = recommendation.type ?? 'chart';
  const parts: string[] = [`Create a ${type}`];

  if (recommendation.y) parts.push(`showing ${recommendation.y}`);
  if (recommendation.x) parts.push(`by ${recommendation.x}`);
  if (recommendation.groupBy) parts.push(`grouped by ${recommendation.groupBy}`);
  if (recommendation.aggregation && recommendation.aggregation !== 'none') {
    parts.push(`using ${recommendation.aggregation} aggregation`);
  }

  return `${parts.join(' ')}. Include a brief insight.`;
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
  const autoInsightsToastRef = useRef<string | null>(null);

  const cachedInsightsEntry = useAutoInsightsStore((state) =>
    datasetId ? state.entries[datasetId] : undefined
  );
  const setCachedInsights = useAutoInsightsStore((state) => state.setInsights);

  const appendLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setAutoInsightsLogs((prev) => [...prev, `${timestamp} - ${message}`]);
  }, []);

  useEffect(() => {
    setAutoInsights(null);
    setAutoInsightsError(null);
    setAutoInsightsStatus(null);
    setAutoInsightsLogs([]);
    autoInsightsToastRef.current = null;
  }, [datasetId]);

  useEffect(() => {
    if (!datasetId || !cachedInsightsEntry) return;
    setAutoInsights(cachedInsightsEntry.insights);
    setAutoInsightsError(null);
    setAutoInsightsStatus((prev) => prev ?? 'Insights ready (cached)');
  }, [datasetId, cachedInsightsEntry]);

  const handleAutoInsights = useCallback(async () => {
    if (!datasetId) {
      toast.error('Upload a dataset first');
      return;
    }
    if (cachedInsightsEntry && cachedInsightsEntry.recommendations.length > 0) {
      setAutoInsights(cachedInsightsEntry.insights);
      setAutoInsightsStatus('Using cached insights');
      toast.success('Insights ready');
      return;
    }

    setAutoInsightsError(null);
    setAutoInsightsLoading(true);
    onProcessingChange?.(true);
    setAutoInsightsStatus('Analyzing dataset...');
    appendLog('Auto Insights started');
    autoInsightsToastRef.current = toast.loading('Generating insights... this may take up to 2 minutes');

    try {
      const result = await api.getDatasetInsights(datasetId, true);
      setAutoInsights(result);
      const derivedRecommendations = getRecommendationsFromInsights(result);
      setCachedInsights(datasetId, result, derivedRecommendations);
      setAutoInsightsStatus('Analysis complete');
      appendLog('Analysis complete');

      if (autoInsightsToastRef.current) {
        toast.success('Insights ready', { id: autoInsightsToastRef.current });
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
  }, [appendLog, cachedInsightsEntry, datasetId, onProcessingChange, onNavigateToVisualizations, setCachedInsights]);

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

  return (
    <div className="flex flex-col gap-6" role="region" aria-label="Visualization creation panel">
      {/* Header */}
      <header className="space-y-1">
        <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
          <Wand2 className="h-4 w-4 text-primary" aria-hidden="true" />
          Create Visualization
        </h2>
        <p className="text-sm text-muted-foreground">
          Describe what you want to see or use AI to analyze your data
        </p>
      </header>

      {/* Prompt Input */}
      <section aria-label="Visualization prompt input">
        <PromptInput
          onSubmit={onSubmitPrompt}
          isProcessing={isProcessing}
          suggestions={PROMPT_SUGGESTIONS}
          placeholder="Describe the visualization you want..."
        />
        {useHeuristics && (
          <p className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
            <Zap className="h-3 w-3 text-amber-500" aria-hidden="true" />
            <span>Fast mode enabled - using heuristics for quick results</span>
          </p>
        )}
      </section>

      {/* Auto Insights Button */}
      <section aria-label="AI analysis actions">
        <Button
          onClick={handleAutoInsights}
          disabled={!hasDataset || isProcessing || autoInsightsLoading}
          className={cn(
            "w-full h-12 text-sm font-medium transition-all duration-300",
            "bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70",
            "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
            autoInsightsLoading && "animate-pulse"
          )}
          aria-busy={autoInsightsLoading}
          aria-describedby="auto-insights-status"
        >
          {autoInsightsLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              <span>Analyzing your data...</span>
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" aria-hidden="true" />
              <span>Run Auto Insights</span>
            </>
          )}
        </Button>
        
        {!hasDataset && (
          <p className="mt-2 text-xs text-muted-foreground text-center" role="status">
            Upload a dataset first to enable AI analysis
          </p>
        )}
      </section>

      {/* Status & Recommendations */}
      {(autoInsightsLoading || autoInsightsError || autoInsightsStatus || recommendations.length > 0) && (
        <section 
          aria-label="AI analysis results"
          className="space-y-4"
        >
          {/* Status indicator */}
          <div 
            id="auto-insights-status"
            className={cn(
              "flex items-center gap-2 p-3 rounded-lg text-sm",
              autoInsightsLoading && "bg-primary/5 text-primary border border-primary/20",
              autoInsightsError && "bg-destructive/10 text-destructive border border-destructive/20",
              !autoInsightsLoading && !autoInsightsError && autoInsightsStatus && "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
            )}
            role="status"
            aria-live="polite"
          >
            {autoInsightsLoading ? (
              <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" aria-hidden="true" />
            ) : autoInsightsError ? (
              <AlertCircle className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
            ) : (
              <CheckCircle2 className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
            )}
            <span className="font-medium">
              {autoInsightsLoading ? 'Analyzing...' : autoInsightsError || autoInsightsStatus}
            </span>
            {recommendations.length > 0 && !autoInsightsLoading && (
              <Badge 
                variant="secondary" 
                className="ml-auto text-xs font-medium"
                aria-label={`${recommendations.length} recommendations available`}
              >
                {recommendations.length} suggestions
              </Badge>
            )}
          </div>

          {/* Recommendations List */}
          {recommendations.length > 0 && (
            <div className="space-y-2" role="list" aria-label="AI-generated visualization suggestions">
              <h3 className="text-sm font-medium text-foreground sr-only">
                Suggested Visualizations
              </h3>
              {recommendations.slice(0, 5).map((rec, i) => {
                const key = rec.key || rec.title || `rec-${i}`;
                const isClicked = clickedRecommendationKey === key;
                const title = rec.title || `${rec.type || 'Chart'}: ${rec.y || 'metric'}`;
                
                return (
                  <button
                    key={key}
                    onClick={() => handleRecommendationRun(rec)}
                    disabled={isProcessing || isClicked}
                    className={cn(
                      "w-full text-left p-4 rounded-xl transition-all duration-200",
                      "bg-card hover:bg-accent/50 border border-border/50 hover:border-primary/30",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                      "disabled:opacity-60 disabled:cursor-not-allowed",
                      "group relative overflow-hidden",
                      isClicked && "border-primary/50 bg-primary/5"
                    )}
                    role="listitem"
                    aria-busy={isClicked}
                    aria-label={`Create ${title}${rec.description ? `: ${rec.description}` : ''}`}
                  >
                    {/* Loading overlay */}
                    {isClicked && (
                      <div 
                        className="absolute inset-0 bg-primary/10 flex items-center justify-center backdrop-blur-[1px]"
                        aria-hidden="true"
                      >
                        <div className="flex items-center gap-2 text-primary font-medium text-sm">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Generating...</span>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-start gap-3">
                      <div 
                        className={cn(
                          "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center",
                          "bg-primary/10 text-primary transition-colors",
                          "group-hover:bg-primary group-hover:text-primary-foreground"
                        )}
                        aria-hidden="true"
                      >
                        <TrendingUp className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm text-foreground truncate">
                            {title}
                          </span>
                          <ArrowRight 
                            className="h-3 w-3 text-muted-foreground opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0" 
                            aria-hidden="true"
                          />
                        </div>
                        {rec.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                            {rec.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Empty State */}
      {!hasDataset && !autoInsightsLoading && recommendations.length === 0 && (
        <div 
          className="text-center py-8 px-4"
          role="status"
          aria-label="No dataset loaded"
        >
          <div 
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-muted/50 mb-4"
            aria-hidden="true"
          >
            <TrendingUp className="h-7 w-7 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground max-w-[200px] mx-auto">
            Upload a dataset to start creating AI-powered visualizations
          </p>
        </div>
      )}
    </div>
  );
}
