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
  ChevronDown,
  ChevronRight,
  Wand2,
  Zap,
  Info,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PromptInput } from '@/components/prompt-input';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
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
  type: 'auto' | 'prompt';
  label: string;
  description?: string;
  prompt?: string;
  icon: React.ComponentType<{ className?: string }>;
};

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'auto-insights',
    type: 'auto',
    label: 'Auto Insights',
    description: 'AI-powered analysis',
    icon: Sparkles,
  },
  {
    id: 'bar-chart',
    type: 'prompt',
    label: 'Bar Chart',
    description: 'Compare values',
    prompt: 'Create a bar chart showing the top values by the most relevant metric',
    icon: BarChart3,
  },
  {
    id: 'line-chart',
    type: 'prompt',
    label: 'Trend Line',
    description: 'Show trends',
    prompt: 'Create a line chart showing trends over time',
    icon: LineChart,
  },
  {
    id: 'pie-chart',
    type: 'prompt',
    label: 'Pie Chart',
    description: 'Show distribution',
    prompt: 'Create a pie chart showing the distribution of categories',
    icon: PieChart,
  },
  {
    id: 'table',
    type: 'prompt',
    label: 'Data Table',
    description: 'View raw data',
    prompt: 'Show the top 10 rows sorted by the most important metric',
    icon: Table,
  },
  {
    id: 'top-performers',
    type: 'prompt',
    label: 'Top Performers',
    description: 'Ranking view',
    prompt: 'Rank the top 10 items by the primary metric and show growth percentage',
    icon: TrendingUp,
  },
];

const PROMPT_SUGGESTIONS = [
  'Create a pie chart of industry breakdown',
  'Show correlation between key metrics',
  'Compare values across categories',
  'Top 10 by primary metric',
  'Show trends over time',
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
  const autoInsightsToastRef = useRef<string | null>(null);

  const [expandedSections, setExpandedSections] = useState({
    prompt: true,
    quickActions: true,
    insights: true,
  });

  const cachedInsightsEntry = useAutoInsightsStore((state) =>
    datasetId ? state.entries[datasetId] : undefined
  );
  const setCachedInsights = useAutoInsightsStore((state) => state.setInsights);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

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
      setExpandedSections((prev) => ({ ...prev, insights: true }));
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
      setExpandedSections((prev) => ({ ...prev, insights: true }));
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
    (recommendation: InsightRecommendation) => {
      const prompt = buildPromptFromRecommendation(recommendation);
      appendLog(`Running recommendation: ${recommendation.title || 'Chart'}`);
      const toastId = toast.loading('Creating visualization...');
      onNavigateToVisualizations?.();

      return Promise.resolve(onQuickAction(prompt))
        .then(() => {
          toast.success('Visualization created', { id: toastId });
          appendLog('Visualization created');
        })
        .catch((err) => {
          console.error('Failed:', err);
          toast.error('Failed to create visualization', { id: toastId });
          throw err;
        });
    },
    [appendLog, onNavigateToVisualizations, onQuickAction]
  );

  const handleQuickActionRun = useCallback(
    (action: QuickAction) => {
      if (action.type === 'auto') {
        handleAutoInsights();
        return;
      }
      if (!action.prompt) return;

      appendLog(`Quick action: ${action.label}`);
      const toastId = toast.loading(`Running "${action.label}"...`);
      onNavigateToVisualizations?.();

      Promise.resolve(onQuickAction(action.prompt))
        .then(() => toast.success(`"${action.label}" ready`, { id: toastId }))
        .catch(() => toast.error(`Failed to run "${action.label}"`, { id: toastId }));
    },
    [appendLog, handleAutoInsights, onNavigateToVisualizations, onQuickAction]
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
    <div className="space-y-3">
      {/* Prompt Input Section */}
      <Card>
        <CardHeader
          className="cursor-pointer hover:bg-muted/50 transition-colors py-3 px-4"
          onClick={() => toggleSection('prompt')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wand2 className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-medium">Create Visualization</CardTitle>
              {useHeuristics && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  <Zap className="mr-0.5 h-2.5 w-2.5" />
                  Fast
                </Badge>
              )}
            </div>
            {expandedSections.prompt ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </CardHeader>
        {expandedSections.prompt && (
          <CardContent className="pt-0 pb-3 px-4">
            <PromptInput
              onSubmit={onSubmitPrompt}
              isProcessing={isProcessing}
              suggestions={PROMPT_SUGGESTIONS}
              placeholder="Describe the visualization you want..."
            />
          </CardContent>
        )}
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader
          className="cursor-pointer hover:bg-muted/50 transition-colors py-3 px-4"
          onClick={() => toggleSection('quickActions')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
            </div>
            {expandedSections.quickActions ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </CardHeader>
        {expandedSections.quickActions && (
          <CardContent className="pt-0 pb-3 px-4 grid grid-cols-2 gap-2">
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;
              const disabled = !hasDataset || isProcessing || (action.type === 'auto' && autoInsightsLoading);
              return (
                <Tooltip key={action.id}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={disabled}
                      onClick={() => handleQuickActionRun(action)}
                      className={cn(
                        "h-auto py-2 px-3 justify-start flex-col items-start gap-0.5",
                        action.type === 'auto' && "col-span-2 flex-row items-center gap-2 bg-primary/5 border-primary/20 hover:bg-primary/10"
                      )}
                    >
                      <Icon className={cn("h-4 w-4", action.type === 'auto' && "text-primary")} />
                      <span className="text-xs font-medium">{action.label}</span>
                      {action.description && action.type !== 'auto' && (
                        <span className="text-[10px] text-muted-foreground">{action.description}</span>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{action.description}</TooltipContent>
                </Tooltip>
              );
            })}
          </CardContent>
        )}
      </Card>

      {/* AI Insights Status & Recommendations */}
      {(autoInsightsLoading || autoInsightsError || recommendations.length > 0) && (
        <Card>
          <CardHeader
            className="cursor-pointer hover:bg-muted/50 transition-colors py-3 px-4"
            onClick={() => toggleSection('insights')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {autoInsightsLoading ? (
                  <Loader2 className="h-4 w-4 text-primary animate-spin" />
                ) : autoInsightsError ? (
                  <AlertCircle className="h-4 w-4 text-destructive" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                )}
                <CardTitle className="text-sm font-medium">AI Suggestions</CardTitle>
                {recommendations.length > 0 && (
                  <Badge variant="secondary" className="text-[10px]">
                    {recommendations.length}
                  </Badge>
                )}
              </div>
              {expandedSections.insights ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </CardHeader>
          {expandedSections.insights && (
            <CardContent className="pt-0 pb-3 px-4 space-y-2">
              {/* Status */}
              {(autoInsightsLoading || autoInsightsError || autoInsightsStatus) && (
                <p className={cn(
                  "text-xs",
                  autoInsightsLoading && "text-muted-foreground",
                  autoInsightsError && "text-destructive",
                  !autoInsightsLoading && !autoInsightsError && "text-emerald-600 dark:text-emerald-400"
                )}>
                  {autoInsightsLoading ? 'Analyzing...' : autoInsightsError || autoInsightsStatus}
                </p>
              )}

              {/* Recommendations */}
              {recommendations.length > 0 && (
                <div className="space-y-1.5">
                  {recommendations.slice(0, 5).map((rec, i) => (
                    <button
                      key={rec.key || i}
                      onClick={() => handleRecommendationRun(rec)}
                      disabled={isProcessing}
                      className={cn(
                        "w-full text-left p-2.5 rounded-lg transition-all text-xs",
                        "bg-muted/50 hover:bg-muted border border-transparent hover:border-border",
                        "disabled:opacity-50 disabled:cursor-not-allowed"
                      )}
                    >
                      <div className="flex items-center gap-2 mb-0.5">
                        <Sparkles className="h-3 w-3 text-primary" />
                        <span className="font-medium">
                          {rec.title || `${rec.type || 'Chart'}: ${rec.y || 'metric'}`}
                        </span>
                      </div>
                      {rec.description && (
                        <p className="text-muted-foreground line-clamp-2 pl-5">{rec.description}</p>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          )}
        </Card>
      )}

      {/* No Dataset State */}
      {!hasDataset && (
        <div className="text-center py-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-muted mb-3">
            <TrendingUp className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            Upload a dataset to create visualizations
          </p>
        </div>
      )}
    </div>
  );
}
