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
  BarChart3,
  PieChart,
  LineChart,
  ScatterChart,
  Table2,
  Layers,
  Info,
  HelpCircle,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { PromptInput } from '@/components/prompt-input';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
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
  /** Hide Auto Insights section (when it's shown in main content instead) */
  hideAutoInsights?: boolean;
}

// Categorized visualization presets with icons and descriptions
const VISUALIZATION_PRESETS = {
  distribution: {
    label: 'Distribution',
    icon: BarChart3,
    description: 'See how values are spread across categories',
    presets: [
      { prompt: 'Show a bar chart of top 10 values', label: 'Top 10 Values' },
      { prompt: 'Create a histogram showing distribution', label: 'Histogram' },
      { prompt: 'Show frequency distribution as a bar chart', label: 'Frequency' },
    ],
  },
  composition: {
    label: 'Composition',
    icon: PieChart,
    description: 'Understand parts of a whole',
    presets: [
      { prompt: 'Create a pie chart breakdown by category', label: 'Pie Chart' },
      { prompt: 'Show percentage breakdown as a donut chart', label: 'Donut Chart' },
      { prompt: 'Create a stacked bar chart showing composition', label: 'Stacked Bar' },
    ],
  },
  trends: {
    label: 'Trends',
    icon: LineChart,
    description: 'Track changes over time',
    presets: [
      { prompt: 'Display trends over time as a line chart', label: 'Line Chart' },
      { prompt: 'Show monthly trends with area chart', label: 'Area Chart' },
      { prompt: 'Create a timeline visualization', label: 'Timeline' },
    ],
  },
  comparison: {
    label: 'Comparison',
    icon: Layers,
    description: 'Compare values across groups',
    presets: [
      { prompt: 'Compare categories side by side', label: 'Side by Side' },
      { prompt: 'Create a grouped bar chart comparison', label: 'Grouped Bars' },
      { prompt: 'Show comparison with horizontal bars', label: 'Horizontal Bars' },
    ],
  },
  correlation: {
    label: 'Correlation',
    icon: ScatterChart,
    description: 'Find relationships between variables',
    presets: [
      { prompt: 'Create a scatter plot to show correlation', label: 'Scatter Plot' },
      { prompt: 'Show relationship between two numeric columns', label: 'Relationship' },
      { prompt: 'Create a bubble chart with size encoding', label: 'Bubble Chart' },
    ],
  },
  summary: {
    label: 'Summary',
    icon: Table2,
    description: 'Get statistical overview',
    presets: [
      { prompt: 'Show summary statistics table', label: 'Statistics' },
      { prompt: 'Create a data summary with key metrics', label: 'Key Metrics' },
      { prompt: 'Generate a comprehensive data overview', label: 'Overview' },
    ],
  },
};

// Quick prompt suggestions for the input
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
  hideAutoInsights = false,
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

  const hasCachedInsights = cachedInsightsEntry && cachedInsightsEntry.recommendations.length > 0;

  // State for preset sections
  const [expandedPresets, setExpandedPresets] = useState<string[]>(['distribution']);
  
  const togglePresetSection = (key: string) => {
    setExpandedPresets(prev => 
      prev.includes(key) 
        ? prev.filter(k => k !== key) 
        : [...prev, key]
    );
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-4" role="region" aria-label="Visualization creation panel">
        {/* Custom Prompt Section */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium text-foreground">Custom Prompt</h3>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="text-muted-foreground hover:text-foreground transition-colors">
                    <HelpCircle className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-[250px]">
                  <p className="text-xs">
                    Describe the visualization you want in natural language. Be specific about chart type, columns, and any filters.
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
            {useHeuristics && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="text-xs gap-1 cursor-help">
                    <Zap className="h-3 w-3 text-amber-500" aria-hidden="true" />
                    Fast Mode
                  </Badge>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-[200px]">
                  <p className="text-xs">
                    Using local heuristics for faster visualization generation without API calls.
                  </p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          <PromptInput
            onSubmit={onSubmitPrompt}
            isProcessing={isProcessing}
            suggestions={PROMPT_SUGGESTIONS}
            placeholder="e.g., Show a bar chart of sales by region..."
          />
        </section>

        {/* Quick Presets Section */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Quick Presets</h3>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="text-muted-foreground/60 hover:text-muted-foreground transition-colors">
                    <Info className="h-3 w-3" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-[220px]">
                  <p className="text-xs">
                    Click any preset to instantly generate that visualization type for your data.
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
          
          <div className="space-y-1">
            {Object.entries(VISUALIZATION_PRESETS).map(([key, category]) => {
              const Icon = category.icon;
              const isExpanded = expandedPresets.includes(key);
              
              return (
                <Collapsible 
                  key={key} 
                  open={isExpanded}
                  onOpenChange={() => togglePresetSection(key)}
                >
                  <CollapsibleTrigger asChild>
                    <button 
                      className={cn(
                        "w-full flex items-center gap-2 p-2 rounded-lg text-left transition-colors",
                        "hover:bg-accent/50",
                        isExpanded && "bg-accent/30"
                      )}
                      disabled={!hasDataset}
                    >
                      <Icon className={cn(
                        "h-4 w-4 flex-shrink-0",
                        hasDataset ? "text-primary" : "text-muted-foreground/50"
                      )} />
                      <span className={cn(
                        "flex-1 text-sm font-medium",
                        !hasDataset && "text-muted-foreground/50"
                      )}>
                        {category.label}
                      </span>
                      {isExpanded ? (
                        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="pl-6 pr-2 pb-2 space-y-1">
                      <p className="text-[11px] text-muted-foreground mb-2">
                        {category.description}
                      </p>
                      {category.presets.map((preset, idx) => (
                        <Tooltip key={idx}>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => hasDataset && onQuickAction(preset.prompt)}
                              disabled={!hasDataset || isProcessing}
                              className={cn(
                                "w-full text-left px-2.5 py-1.5 rounded-md text-xs transition-all",
                                "hover:bg-primary/10 hover:text-primary",
                                "disabled:opacity-50 disabled:cursor-not-allowed",
                                "border border-transparent hover:border-primary/20"
                              )}
                            >
                              {preset.label}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="max-w-[200px]">
                            <p className="text-xs font-mono">{preset.prompt}</p>
                          </TooltipContent>
                        </Tooltip>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>
          
          {!hasDataset && (
            <p className="text-[11px] text-muted-foreground text-center py-2">
              Upload data to use presets
            </p>
          )}
        </section>

        {/* Divider - Only show if Auto Insights is visible in sidebar */}
        {!hideAutoInsights && (
          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-border/50" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-card px-3 text-xs text-muted-foreground uppercase tracking-wider">
                or use AI analysis
              </span>
            </div>
          </div>
        )}

      {/* Auto Insights Section - Hidden when shown in main content */}
      {!hideAutoInsights && (
      <section 
        id="auto-insights-section"
        data-tour-id="auto-insights-section"
        className="space-y-3 scroll-mt-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
              Auto Insights
            </h3>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="text-muted-foreground hover:text-foreground transition-colors">
                  <HelpCircle className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-[280px]">
                <div className="space-y-2">
                  <p className="text-xs font-medium">How Auto Insights Works</p>
                  <p className="text-xs text-muted-foreground">
                    Our AI analyzes your dataset's structure, data types, and patterns to automatically suggest the most meaningful visualizations.
                  </p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Detects numeric, categorical, and temporal columns</li>
                    <li>• Identifies relationships and correlations</li>
                    <li>• Suggests optimal chart types for your data</li>
                    <li>• Generates contextual prompts with column names</li>
                  </ul>
                </div>
              </TooltipContent>
            </Tooltip>
          </div>
          {lastFetchTime && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-xs text-muted-foreground flex items-center gap-1 cursor-help">
                  <Clock className="h-3 w-3" aria-hidden="true" />
                  {lastFetchTime.toLocaleTimeString()}
                </span>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p className="text-xs">Last analysis time. Results are cached for faster access.</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={handleAutoInsights}
                disabled={!hasDataset || isProcessing || autoInsightsLoading}
                className={cn(
                  "flex-1 h-10 text-sm font-medium",
                  hasCachedInsights 
                    ? "bg-secondary text-secondary-foreground hover:bg-secondary/80" 
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
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
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-[220px]">
              <p className="text-xs">
                {hasCachedInsights 
                  ? "View previously generated AI recommendations for your data"
                  : "Run AI analysis to get smart visualization suggestions based on your data structure"
                }
              </p>
            </TooltipContent>
          </Tooltip>
          
          {hasCachedInsights && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={handleRefreshInsights}
                  disabled={!hasDataset || isProcessing || autoInsightsLoading}
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 flex-shrink-0"
                  aria-label="Refresh insights"
                >
                  <RefreshCw className={cn("h-4 w-4", autoInsightsLoading && "animate-spin")} aria-hidden="true" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="text-xs">Re-analyze data to get fresh recommendations</p>
              </TooltipContent>
            </Tooltip>
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
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-foreground">
                      AI Suggestions
                    </span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="text-muted-foreground/60 hover:text-muted-foreground transition-colors">
                          <Info className="h-3 w-3" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-[250px]">
                        <div className="space-y-1">
                          <p className="text-xs font-medium">Smart Visualization Suggestions</p>
                          <p className="text-xs text-muted-foreground">
                            Click any suggestion to instantly create that visualization. Each suggestion is tailored to your data's columns and types.
                          </p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="secondary" className="text-xs h-5 cursor-help">
                        {recommendations.length}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent side="left">
                      <p className="text-xs">{recommendations.length} visualization suggestions available</p>
                    </TooltipContent>
                  </Tooltip>
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

      {/* Empty State - Only show when Auto Insights is visible and no data */}
      {!hideAutoInsights && !hasDataset && !autoInsightsLoading && recommendations.length === 0 && (
        <div className="text-center py-6" role="status">
          <Wand2 className="h-8 w-8 text-muted-foreground/50 mx-auto mb-3" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">
            Upload data to unlock AI-powered insights
          </p>
        </div>
      )}
      </div>
    </TooltipProvider>
  );
}
