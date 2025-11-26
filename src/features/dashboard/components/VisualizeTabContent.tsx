'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import {
  Sparkles,
  TrendingUp,
  PieChart,
  Table,
  BarChart3,
  LineChart,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
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
  datasetFeedback: FeedbackSummary | null;
  canSubmitFeedback: boolean;
  onDatasetVote: (vote: 'up' | 'down' | null) => void;
  onDatasetFavorite: (favorite: boolean) => void;
  leaderboardDatasets: LeaderboardEntry[];
  leaderboardVisualizations: LeaderboardEntry[];
  leaderboardLoading: boolean;
  onRefreshLeaderboards?: () => void;
  onNavigateToVisualizations?: () => void;
  onAutoInsightsUpdate?: (snapshot: AutoInsightsSnapshot) => void;
  onRegisterAutoInsightsRunner?: (runner: (() => void) | undefined) => void;
  onRegisterRecommendationRunner?: (
    runner: ((recommendation: InsightRecommendation) => Promise<void>) | undefined
  ) => void;
}

type QuickAction = {
  id: string;
  label: string;
  prompt: string;
  icon: React.ComponentType<{ className?: string }>;
};

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'bar-chart',
    label: 'Bar Chart',
    prompt: 'Create a bar chart showing the top values by the most relevant metric',
    icon: BarChart3,
  },
  {
    id: 'line-chart',
    label: 'Trend Line',
    prompt: 'Create a line chart showing trends over time',
    icon: LineChart,
  },
  {
    id: 'pie-chart',
    label: 'Pie Chart',
    prompt: 'Create a pie chart showing the distribution of categories',
    icon: PieChart,
  },
  {
    id: 'table',
    label: 'Data Table',
    prompt: 'Show the top 10 rows sorted by the most important metric',
    icon: Table,
  },
];

const buildPromptFromRecommendation = (recommendation: InsightRecommendation): string => {
  if (recommendation.prompt) return recommendation.prompt;

  const type = recommendation.type ?? 'chart';
  const parts: string[] = [`Create a ${type}`];

  if (recommendation.y) {
    parts.push(`showing ${recommendation.y}`);
  }
  if (recommendation.x) {
    parts.push(`by ${recommendation.x}`);
  }
  if (recommendation.groupBy) {
    parts.push(`grouped by ${recommendation.groupBy}`);
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
  hasDataset,
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
    setAutoInsightsStatus((prev) => prev ?? 'Insights ready');
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
    autoInsightsToastRef.current = toast.loading('Generating insights...');

    try {
      const result = await api.getDatasetInsights(datasetId, true);
      setAutoInsights(result);
      const derivedRecommendations = getRecommendationsFromInsights(result);
      setCachedInsights(datasetId, result, derivedRecommendations);
      setAutoInsightsStatus('Analysis complete');
      
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
      if (autoInsightsToastRef.current) {
        toast.error(message, { id: autoInsightsToastRef.current });
      }
    } finally {
      setAutoInsightsLoading(false);
      onProcessingChange?.(false);
    }
  }, [cachedInsightsEntry, datasetId, onProcessingChange, onNavigateToVisualizations, setCachedInsights]);

  const handleRecommendationRun = useCallback(
    (recommendation: InsightRecommendation) => {
      const prompt = buildPromptFromRecommendation(recommendation);
      const toastId = toast.loading('Creating visualization...');
      onNavigateToVisualizations?.();

      return Promise.resolve(onQuickAction(prompt))
        .then(() => {
          toast.success('Visualization created', { id: toastId });
        })
        .catch((err) => {
          console.error('Failed:', err);
          toast.error('Failed to create visualization', { id: toastId });
          throw err;
        });
    },
    [onNavigateToVisualizations, onQuickAction]
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
    <div className="space-y-4">
      {/* Auto Insights Status */}
      {(autoInsightsLoading || autoInsightsError || autoInsightsStatus) && (
        <div className={cn(
          "flex items-start gap-3 p-3 rounded-lg text-sm",
          autoInsightsLoading && "bg-violet-500/10 border border-violet-500/20",
          autoInsightsError && "bg-red-500/10 border border-red-500/20",
          !autoInsightsLoading && !autoInsightsError && autoInsightsStatus && "bg-emerald-500/10 border border-emerald-500/20"
        )}>
          {autoInsightsLoading ? (
            <Loader2 className="h-4 w-4 text-violet-400 animate-spin mt-0.5" />
          ) : autoInsightsError ? (
            <AlertCircle className="h-4 w-4 text-red-400 mt-0.5" />
          ) : (
            <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5" />
          )}
          <div className="flex-1">
            <p className={cn(
              autoInsightsLoading && "text-violet-300",
              autoInsightsError && "text-red-300",
              !autoInsightsLoading && !autoInsightsError && "text-emerald-300"
            )}>
              {autoInsightsLoading ? 'Analyzing...' : autoInsightsError || autoInsightsStatus}
            </p>
          </div>
        </div>
      )}

      {/* AI Recommendations */}
      {recommendations.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-white/40 uppercase tracking-wider">
            AI Suggestions
          </h4>
          <div className="space-y-2">
            {recommendations.slice(0, 4).map((rec, i) => (
              <button
                key={rec.key || i}
                onClick={() => handleRecommendationRun(rec)}
                disabled={isProcessing}
                className={cn(
                  "w-full text-left p-3 rounded-lg transition-all",
                  "bg-white/[0.02] border border-white/5 hover:border-violet-500/30 hover:bg-violet-500/5",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="h-3 w-3 text-violet-400" />
                  <span className="text-sm font-medium text-white">
                    {rec.title || `${rec.type || 'Chart'}: ${rec.y || 'metric'}`}
                  </span>
                </div>
                {rec.description && (
                  <p className="text-xs text-white/40 line-clamp-2">{rec.description}</p>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="space-y-2">
        <h4 className="text-xs font-medium text-white/40 uppercase tracking-wider">
          Quick Create
        </h4>
        <div className="grid grid-cols-2 gap-2">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.id}
                variant="outline"
                size="sm"
                disabled={!hasDataset || isProcessing}
                onClick={() => {
                  onNavigateToVisualizations?.();
                  onQuickAction(action.prompt);
                }}
                className={cn(
                  "justify-start h-auto py-3 px-3",
                  "bg-white/[0.02] border-white/5 hover:border-white/10 hover:bg-white/[0.04]",
                  "text-white/60 hover:text-white"
                )}
              >
                <Icon className="mr-2 h-4 w-4" />
                <span className="text-xs">{action.label}</span>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Auto Insights Button */}
      {hasDataset && recommendations.length === 0 && !autoInsightsLoading && (
        <Button
          onClick={handleAutoInsights}
          disabled={isProcessing || autoInsightsLoading}
          className="w-full bg-violet-600 hover:bg-violet-700 text-white"
        >
          <Sparkles className="mr-2 h-4 w-4" />
          Run Auto Insights
        </Button>
      )}

      {/* No Dataset State */}
      {!hasDataset && (
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/5 mb-4">
            <TrendingUp className="h-6 w-6 text-white/20" />
          </div>
          <p className="text-sm text-white/40">
            Upload a dataset to create visualizations
          </p>
        </div>
      )}
    </div>
  );
}
