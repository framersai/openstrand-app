'use client';

/**
 * AutoInsightsProvider - Invisible component that manages auto-insights state
 * This component is always mounted to ensure the auto-insights runner is available
 * even when the "Create" tab is not active.
 */

import { useEffect, useCallback, useRef, useState, useMemo } from 'react';
import { toast } from 'sonner';

import { api, ApiError } from '@/services/api';
import { useAutoInsightsStore } from '@/store/auto-insights-store';
import type { DatasetInsights, InsightRecommendation } from '@/types/insights';

interface AutoInsightsProviderProps {
  datasetId: string | null;
  onRegisterRunner: (runner: (() => void) | undefined) => void;
  onRegisterRecommendationRunner: (
    runner: ((recommendation: InsightRecommendation) => Promise<void>) | undefined
  ) => void;
  onUpdate: (snapshot: {
    insights: DatasetInsights | null;
    isLoading: boolean;
    error: string | null;
    status: string | null;
    logs: string[];
    recommendations: InsightRecommendation[];
  }) => void;
  onQuickAction: (prompt: string) => Promise<void>;
  onNavigateToVisualizations?: () => void;
  onProcessingChange?: (processing: boolean) => void;
}

function getRecommendationsFromInsights(insights: DatasetInsights | null): InsightRecommendation[] {
  if (!insights) return [];
  return insights.recommendations || [];
}

function buildPromptFromRecommendation(rec: InsightRecommendation): string {
  if (rec.prompt) return rec.prompt;
  
  const chartType = rec.chartType || rec.chart_type || 'chart';
  const xCol = rec.xColumn || rec.x_column || rec.columns?.[0];
  const yCol = rec.yColumn || rec.y_column || rec.columns?.[1];
  
  if (xCol && yCol) {
    return `Create a ${chartType} showing ${yCol} by ${xCol}. Include a brief insight.`;
  } else if (xCol) {
    return `Create a ${chartType} of ${xCol}. Include a brief insight.`;
  }
  
  return `Create a ${chartType} visualization. Include a brief insight.`;
}

export function AutoInsightsProvider({
  datasetId,
  onRegisterRunner,
  onRegisterRecommendationRunner,
  onUpdate,
  onQuickAction,
  onNavigateToVisualizations,
  onProcessingChange,
}: AutoInsightsProviderProps) {
  const [insights, setInsights] = useState<DatasetInsights | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const toastRef = useRef<string | null>(null);

  const cachedEntry = useAutoInsightsStore((state) =>
    datasetId ? state.entries[datasetId] : undefined
  );
  const setCachedInsights = useAutoInsightsStore((state) => state.setInsights);
  const clearCachedInsights = useAutoInsightsStore((state) => state.clearInsights);

  const appendLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, `${timestamp} - ${message}`]);
  }, []);

  // Reset state when dataset changes
  useEffect(() => {
    setInsights(null);
    setError(null);
    setStatus(null);
    setLogs([]);
    toastRef.current = null;
  }, [datasetId]);

  // Load from cache
  useEffect(() => {
    if (!datasetId || !cachedEntry) return;
    setInsights(cachedEntry.insights);
    setError(null);
    setStatus((prev) => prev ?? 'Insights ready (cached)');
  }, [datasetId, cachedEntry]);

  const fetchInsights = useCallback(async (forceRefresh: boolean = false) => {
    if (!datasetId) {
      toast.error('Upload a dataset first');
      return;
    }

    if (!forceRefresh && cachedEntry && cachedEntry.recommendations.length > 0) {
      setInsights(cachedEntry.insights);
      setStatus('Using cached insights');
      toast.success('Insights ready (cached)');
      return;
    }

    if (forceRefresh && datasetId) {
      clearCachedInsights(datasetId);
    }

    setError(null);
    setIsLoading(true);
    onProcessingChange?.(true);
    setStatus(forceRefresh ? 'Fetching fresh insights...' : 'Analyzing dataset...');
    appendLog(forceRefresh ? 'Forcing fresh insights...' : 'Auto Insights started');
    toastRef.current = toast.loading('Generating insights... this may take up to 2 minutes');

    try {
      const result = await api.getDatasetInsights(datasetId, true);
      setInsights(result);
      const derivedRecommendations = getRecommendationsFromInsights(result);
      setCachedInsights(datasetId, result, derivedRecommendations);
      setStatus('Analysis complete');
      appendLog('Analysis complete');

      if (toastRef.current) {
        toast.success(`${derivedRecommendations.length} insights ready`, { id: toastRef.current });
      }
      onNavigateToVisualizations?.();
    } catch (err) {
      const message = err instanceof ApiError
        ? err.details?.message || err.message
        : 'Analysis failed';
      setError(message);
      setStatus(`Failed: ${message}`);
      appendLog(`Error: ${message}`);
      if (toastRef.current) {
        toast.error(message, { id: toastRef.current });
      }
    } finally {
      setIsLoading(false);
      onProcessingChange?.(false);
    }
  }, [appendLog, cachedEntry, clearCachedInsights, datasetId, onProcessingChange, onNavigateToVisualizations, setCachedInsights]);

  const handleAutoInsights = useCallback(() => fetchInsights(false), [fetchInsights]);

  const handleRecommendationRun = useCallback(
    async (recommendation: InsightRecommendation) => {
      const prompt = buildPromptFromRecommendation(recommendation);
      appendLog(`Running recommendation: ${recommendation.title || 'Chart'}`);
      const toastId = toast.loading('Creating visualization...');
      onNavigateToVisualizations?.();

      try {
        await onQuickAction(prompt);
        toast.success('Visualization created', { id: toastId });
        appendLog('Visualization created');
      } catch (err) {
        console.error('Failed:', err);
        toast.error('Failed to create visualization', { id: toastId });
        throw err;
      }
    },
    [appendLog, onNavigateToVisualizations, onQuickAction]
  );

  const recommendations = useMemo<InsightRecommendation[]>(() => {
    return getRecommendationsFromInsights(insights);
  }, [insights]);

  // Update parent with current state
  useEffect(() => {
    onUpdate({
      insights,
      isLoading,
      error,
      status,
      logs,
      recommendations,
    });
  }, [insights, isLoading, error, status, logs, recommendations, onUpdate]);

  // Register runners
  useEffect(() => {
    onRegisterRunner(() => void handleAutoInsights());
    return () => onRegisterRunner(undefined);
  }, [handleAutoInsights, onRegisterRunner]);

  useEffect(() => {
    onRegisterRecommendationRunner((rec) => handleRecommendationRun(rec));
    return () => onRegisterRecommendationRunner(undefined);
  }, [handleRecommendationRun, onRegisterRecommendationRunner]);

  // This component renders nothing - it's just for state management
  return null;
}

