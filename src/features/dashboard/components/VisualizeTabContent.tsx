'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import {
  Info,
  PieChart,
  Sparkles,
  Table,
  ChevronDown,
  ChevronRight,
  Wand2,
  Zap,
  TrendingUp,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PromptInput } from '@/components/prompt-input';
import { FeedbackButtons } from '@/components/feedback-buttons';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { api, ApiError } from '@/services/api';
import type { DatasetInsights, FeedbackSummary, LeaderboardEntry } from '@/types';
import { AutoInsightsPanel, type InsightRecommendation } from './AutoInsightsPanel';
import { ExplorationRecipes } from './ExplorationRecipes';
import { LeaderboardPanel } from './LeaderboardPanel';
import { useAutoInsightsStore } from '@/store/auto-insights-store';

export interface AutoInsightsSnapshot {
  insights: DatasetInsights | null;
  isLoading: boolean;
  error: string | null;
  status: string | null;
  logs: string[];
  recommendations: InsightRecommendation[];
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

type IconRenderer = React.ComponentType<{ className?: string }>;

type QuickAction = {
  id: string;
  type: 'auto' | 'prompt';
  label: string;
  description?: string;
  prompt?: string;
  icon: IconRenderer;
  category?: 'analysis' | 'chart' | 'table';
};

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'auto-insights',
    type: 'auto',
    label: 'Auto Insights',
    description: 'AI-powered dataset analysis',
    icon: Sparkles,
    category: 'analysis',
  },
  {
    id: 'top-performers',
    type: 'prompt',
    label: 'Top Performers',
    description: 'Ranking by key metrics',
    prompt: 'Rank the top 10 companies by ARR and include their year-over-year growth percentage.',
    icon: TrendingUp,
    category: 'table',
  },
  {
    id: 'segment-share',
    type: 'prompt',
    label: 'Segment Analysis',
    description: 'Industry breakdown chart',
    prompt: 'Create a stacked bar chart showing industry share broken down by funding stage.',
    icon: PieChart,
    category: 'chart',
  },
  {
    id: 'data-table',
    type: 'prompt',
    label: 'Data Overview',
    description: 'Comprehensive table view',
    prompt: 'Show a table with ARR, valuation, and employees sorted by ARR descending.',
    icon: Table,
    category: 'table',
  },
];

const PROMPT_SUGGESTIONS: string[] = [
  'Create a pie chart of industry breakdown',
  'Show correlation between founded year and valuation',
  'Which investors appear most frequently?',
  'Compare ARR across different industries',
  'Top 10 companies by valuation',
] as const;

const buildPromptFromRecommendation = (recommendation: InsightRecommendation): string => {
  if (recommendation.prompt) return recommendation.prompt;

  const type = recommendation.type ?? 'chart';
  const parts: string[] = [`Create a ${type}`];

  if (recommendation.y) {
    parts.push(`showing ${recommendation.y}`);
  } else {
    parts.push('showing the most important metric');
  }

  if (recommendation.x) {
    parts.push(`by ${recommendation.x}`);
  }

  if (recommendation.groupBy) {
    parts.push(`grouped by ${recommendation.groupBy}`);
  }

  if (recommendation.aggregation && recommendation.aggregation !== 'none') {
    parts.push(`using ${recommendation.aggregation} aggregation`);
  }

  return `${parts.join(' ')}. Include a short explanation of the key insight.`;
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
  datasetFeedback,
  canSubmitFeedback,
  onDatasetVote,
  onDatasetFavorite,
  leaderboardDatasets,
  leaderboardVisualizations,
  leaderboardLoading,
  onRefreshLeaderboards,
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

  // Collapsible sections state
  const [expandedSections, setExpandedSections] = useState({
    prompt: true,
    quickActions: false,
    insights: false,
    community: false,
    recipes: false,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
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
    if (!datasetId || !cachedInsightsEntry) {
      return;
    }
    setAutoInsights(cachedInsightsEntry.insights);
    setAutoInsightsError(null);
    setAutoInsightsStatus((prev) => prev ?? 'Auto Insights ready (cached)');
  }, [datasetId, cachedInsightsEntry]);

  const handleAutoInsights = useCallback(async () => {
    if (!datasetId) {
      toast.error('Upload a dataset first to run Auto Insights.');
      return;
    }
    if (cachedInsightsEntry && cachedInsightsEntry.recommendations.length > 0) {
      setAutoInsights(cachedInsightsEntry.insights);
      setAutoInsightsError(null);
      setAutoInsightsStatus('Auto Insights already available. Showing cached recommendations.');
      appendLog('Skipped regeneration - cached Auto Insights available.');
      setExpandedSections(prev => ({ ...prev, insights: true }));
      toast.success('Auto Insights already generated. View cached suggestions in the visualization panel.');
      return;
    }
    const startedAt = Date.now();
    setAutoInsightsError(null);
    setAutoInsightsLoading(true);
    onProcessingChange?.(true);
    setAutoInsightsStatus('Running Auto Insights. This may take up to 2 minutes for large datasets.');
    appendLog('Auto Insights request started');
    autoInsightsToastRef.current = toast.loading('Generating Auto Insights... this may take up to 2 minutes');

    try {
      const result = await api.getDatasetInsights(datasetId, true);
      setAutoInsights(result);
      const derivedRecommendations = getRecommendationsFromInsights(result);
      setCachedInsights(datasetId, result, derivedRecommendations);

      const providerUsed =
        (typeof result?.debug?.provider_used === 'string' ? result.debug.provider_used : undefined) ??
        (typeof result?.debug?.llm?.usedProvider === 'string' ? result.debug.llm.usedProvider : undefined) ??
        null;

      type ProviderAttempt = {
        provider?: string;
        status?: string;
        error?: string;
      };

      const attemptsRaw = result?.debug?.llm?.attempts;
      const attempts: ProviderAttempt[] = Array.isArray(attemptsRaw)
        ? attemptsRaw.filter(
            (item): item is ProviderAttempt =>
              item !== null && typeof item === 'object'
          )
        : [];

      attempts.forEach((attempt) => {
        const provider = attempt.provider ?? 'unknown';
        if (attempt.status === 'success') {
          appendLog(`Provider ${provider} succeeded`);
        } else if (attempt.status === 'error') {
          const reason = attempt.error ?? 'unknown error';
          appendLog(`Provider ${provider} failed: ${reason}`);
        }
      });

      if (providerUsed) {
        appendLog(`Schema intelligence provider selected: ${providerUsed}`);
      }

      if (result?.debug?.llm?.error) {
        appendLog(`LLM fallback error: ${result.debug.llm.error}`);
      } else if (result?.debug?.error) {
        appendLog(`Analysis note: ${result.debug.error}`);
      }

      const durationSeconds = Math.round((Date.now() - startedAt) / 1000);
      let completionMessage = `Auto Insights completed in ${durationSeconds}s`;
      if (providerUsed) {
        completionMessage += ` (provider: ${providerUsed})`;
      }
      setAutoInsightsStatus(completionMessage);
      appendLog(completionMessage);
      if (autoInsightsToastRef.current) {
        toast.success('Auto Insights ready', { id: autoInsightsToastRef.current });
        autoInsightsToastRef.current = null;
      } else {
        toast.success('Auto Insights ready');
      }
      onNavigateToVisualizations?.();
      // Auto-expand the insights section when complete
      setExpandedSections(prev => ({ ...prev, insights: true }));
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.details?.message || error.message
          : 'Failed to generate auto insights.';
      setAutoInsightsError(message);
      setAutoInsightsStatus(`Auto Insights failed: ${message}`);
      appendLog(`Error: ${message}`);
      if (autoInsightsToastRef.current) {
        toast.error(message, { id: autoInsightsToastRef.current });
        autoInsightsToastRef.current = null;
      } else {
        toast.error(message);
      }
    } finally {
      setAutoInsightsLoading(false);
      onProcessingChange?.(false);
    }
  }, [
    appendLog,
    cachedInsightsEntry,
    datasetId,
    onProcessingChange,
    onNavigateToVisualizations,
    setCachedInsights,
  ]);

  const handleRecommendationRun = useCallback(
    (recommendation: InsightRecommendation) => {
      const prompt = buildPromptFromRecommendation(recommendation);
      appendLog(`Recommendation triggered: ${prompt}`);
      const toastId = toast.loading('Generating visualization from recommendation...');
      onNavigateToVisualizations?.();

      return Promise.resolve(onQuickAction(prompt))
        .then(() => {
          toast.success('Visualization added from recommendation', { id: toastId });
          appendLog('Visualization added from recommendation');
        })
        .catch((err) => {
          console.error('Recommendation visualization failed:', err);
          appendLog('Recommendation visualization failed');
          toast.error('Failed to generate visualization from recommendation', { id: toastId });
          throw err;
        });
    },
    [appendLog, onNavigateToVisualizations, onQuickAction]
  );

  const handleQuickActionRun = useCallback(
    (action: QuickAction) => {
      if (action.type === 'auto') {
        appendLog(`Auto Insights quick action triggered: ${action.label}`);
        handleAutoInsights();
        return;
      }

      if (!action.prompt) return;

      appendLog(`Quick action triggered: ${action.label}`);
      const toastId = toast.loading(`Running "${action.label}"...`);
      onNavigateToVisualizations?.();

      try {
        const result = onQuickAction(action.prompt);
        Promise.resolve(result)
          .then(() => {
            toast.success(`"${action.label}" visualization ready`, { id: toastId });
          })
          .catch((err) => {
            console.error('Quick action failed:', err);
            toast.error(`Failed to run "${action.label}"`, { id: toastId });
          });
      } catch (err) {
        console.error('Quick action failed:', err);
        toast.error(`Failed to run "${action.label}"`, { id: toastId });
      }
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
  }, [
    autoInsights,
    autoInsightsLoading,
    autoInsightsError,
    autoInsightsStatus,
    autoInsightsLogs,
    recommendations,
    onAutoInsightsUpdate,
  ]);

  useEffect(() => {
    if (!onRegisterAutoInsightsRunner) return;
    onRegisterAutoInsightsRunner(() => {
      void handleAutoInsights();
    });
    return () => {
      onRegisterAutoInsightsRunner(undefined);
    };
  }, [handleAutoInsights, onRegisterAutoInsightsRunner]);

  useEffect(() => {
    if (!onRegisterRecommendationRunner) return;
    onRegisterRecommendationRunner((recommendation) => {
      return handleRecommendationRun(recommendation);
    });
    return () => {
      onRegisterRecommendationRunner(undefined);
    };
  }, [handleRecommendationRun, onRegisterRecommendationRunner]);

  return (
    <TooltipProvider>
      <div className="space-y-3">
        {/* Prompt Input Section */}
        <Card className="overflow-hidden">
          <CardHeader
            className="cursor-pointer hover:bg-muted/50 transition-colors py-3"
            onClick={() => toggleSection('prompt')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wand2 className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm font-medium">
                  Create Visualization
                </CardTitle>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs">
                    <p className="text-xs">
                      Describe what you want to see in natural language.
                      The AI will create appropriate visualizations based on your data.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="flex items-center gap-2">
                {useHeuristics && (
                  <Badge variant="secondary" className="text-xs">
                    <Zap className="mr-1 h-3 w-3" />
                    Fast Mode
                  </Badge>
                )}
                {expandedSections.prompt ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </div>
          </CardHeader>

          {expandedSections.prompt && (
            <CardContent className="pt-0 pb-4">
              <PromptInput
                onSubmit={onSubmitPrompt}
                isProcessing={isProcessing}
                suggestions={PROMPT_SUGGESTIONS}
              />
              <div className="mt-3 flex items-start gap-2">
                <Info className="h-3 w-3 text-muted-foreground mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  {useHeuristics
                    ? 'Heuristic Assist is active: Common prompts are processed locally for faster results.'
                    : 'LLM-only mode: Every prompt uses your selected AI provider.'}
                </p>
              </div>
            </CardContent>
          )}
        </Card>

        <Card className="border-dashed" data-tour-id="quick-actions">
          <CardHeader className="pb-3 flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">Quick actions</CardTitle>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent align="start" className="max-w-xs text-xs">
                  Auto Insights respects your settings: it attempts quick heuristics when enabled, then falls back to the configured LLM provider. Complex datasets can take up to two minutes to process.
                </TooltipContent>
              </Tooltip>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;
              const disabled = !hasDataset || isProcessing || (action.type === 'auto' && autoInsightsLoading);
              return (
                <Button
                  key={action.label}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  disabled={disabled}
                  onClick={() => handleQuickActionRun(action)}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {action.label}
                </Button>
              );
            })}
          </CardContent>
        </Card>

        <AutoInsightsPanel
          insights={autoInsights}
          isLoading={autoInsightsLoading}
          error={autoInsightsError}
          statusMessage={autoInsightsStatus}
          logs={autoInsightsLogs}
          onViewRecommendations={onNavigateToVisualizations}
        />

        {hasDataset && (
          <Card className="border-dashed" data-tour-id="quick-actions">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Community feedback</CardTitle>
              <CardDescription>Vote once per dataset and see what the community prefers.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FeedbackButtons
                summary={datasetFeedback}
                disabled={isProcessing || !canSubmitFeedback}
                disabledReason={!canSubmitFeedback ? 'Sign in to vote on datasets.' : undefined}
                onVote={canSubmitFeedback ? onDatasetVote : undefined}
                onFavoriteChange={canSubmitFeedback ? onDatasetFavorite : undefined}
                layout="stacked"
              />
              {!canSubmitFeedback && (
                <p className="text-xs text-muted-foreground">
                  Sign in to share thumbs up/down votes or save this dataset as a favorite.
                </p>
              )}
              <LeaderboardPanel
                datasetEntries={leaderboardDatasets}
                visualizationEntries={leaderboardVisualizations}
                isLoading={leaderboardLoading}
                onRefresh={onRefreshLeaderboards}
              />
            </CardContent>
          </Card>
        )}

        <Card className="border-dashed" data-tour-id="quick-actions">
          <CardContent>
            <ExplorationRecipes
              disabled={isProcessing}
              onRunRecipe={(prompt) => onQuickAction(prompt)}
            />
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}