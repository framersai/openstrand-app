'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';

import { useVisualizationStore } from '@/store/visualization-store';
import { useDatasetStore } from '@/store/dataset-store';
import { useLLMStore, LLM_PROVIDER_KEYS } from '@/store/llm-store';
import { useOpenStrandStore } from '@/store/openstrand.store';
import { useGuestSession } from '@/hooks/useGuestSession';
import { useSupabase } from '@/features/auth';
import { api, ApiError } from '@/services/api';
import {
  upsertSavedVisualization,
  removeSavedVisualization,
} from '@/services/saved-visualizations.service';
import {
  formatPlanLabel,
  getPlanUploadLimitMb,
  normalizePlanTier,
} from '@/lib/plan-info';
import type {
  Visualization,
  SampleDatasetSummary,
  DatasetSummary,
  FeedbackSummary,
  LeaderboardEntry,
  LLMProvider,
} from '@/types';
import type { AutoInsightsSnapshot } from '@/features/dashboard/components/VisualizeTabContent';
import type { InsightRecommendation } from '@/features/dashboard/components/AutoInsightsPanel';
import type { TierClassification } from '@/lib/visualization/types';
import { VisualizationTier } from '@/lib/visualization/types';
import { useFeatureFlags } from '@/lib/feature-flags';

import { useSavedVisualizationsSync } from '@/hooks/useSavedVisualizationsSync';
import {
  mergeRecommendations,
  recommendationKey,
} from './recommendation-utils';
import type {
  ActivityEvent,
  DashboardOverviewData,
  FeedbackOverview,
  ProviderUsageEntry,
  ProviderUsageSummary,
} from '../dashboard.types';

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof ApiError) {
    return error.details?.message ?? error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
};

const INITIAL_AUTO_INSIGHTS: AutoInsightsSnapshot = {
  insights: null,
  isLoading: false,
  error: null,
  status: null,
  logs: [],
  recommendations: [],
};

const PROVIDER_LABELS: Record<LLMProvider, string> = {
  openrouter: 'OpenRouter',
  openai: 'OpenAI',
  anthropic: 'Anthropic',
};

export function useDashboardController() {
  const {
    visualizations,
    savedVisualizations,
    addVisualization,
    updateVisualization,
    removeVisualization,
    clearVisualizations,
    saveVisualization,
    unsaveVisualization,
    setSavedVisualizations,
  } = useVisualizationStore();
  const { dataset, metadata, setDataset, clearDataset } = useDatasetStore();
  const {
    provider,
    useHeuristics,
    providers,
    addCost,
    setProvider,
    preferByok,
    getResolvedApiKey,
  } = useLLMStore((state) => ({
    provider: state.provider,
    useHeuristics: state.useHeuristics,
    providers: state.providers,
    addCost: state.addCost,
    setProvider: state.setProvider,
    preferByok: state.preferByok,
    getResolvedApiKey: state.getResolvedApiKey,
  }));

  useEffect(() => {
    const activeResolved = getResolvedApiKey(provider);
    if (activeResolved.source !== 'none') {
      return;
    }

    const fallback = LLM_PROVIDER_KEYS.find((candidate) => {
      if (candidate === provider) {
        return false;
      }
      return getResolvedApiKey(candidate).source !== 'none';
    });

    if (fallback) {
      setProvider(fallback);
    }
  }, [getResolvedApiKey, provider, setProvider]);
  const capabilities = useOpenStrandStore((state) => state.capabilities);
  const loadCapabilities = useOpenStrandStore((state) => state.loadCapabilities);
  const { planTier, isAuthenticated, isLocalAuth, user } = useSupabase();
  const { isTeamEdition } = useFeatureFlags();
  const isAdmin = useMemo(() => {
    const role =
      ((user as any)?.app_metadata?.role as string | undefined) ||
      ((user as any)?.user_metadata?.role as string | undefined) ||
      '';
    return role === 'admin' || role === 'owner';
  }, [user]);
  const canEditProviderKeys = !isTeamEdition || isAdmin;
  const {
    isGuest,
    hasCredits,
    spendCredits,
    getRemainingCredits,
    addFavorite,
    removeFavorite,
  } = useGuestSession();

  const planLimitMb = getPlanUploadLimitMb(planTier);
  const activeDatasetId = dataset?.id ?? null;

  const [isProcessing, setIsProcessing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const openSettings = useCallback(() => {
    setShowSettings((prev) => (prev ? prev : true));
  }, []);
  const closeSettings = useCallback(() => {
    setShowSettings(false);
  }, []);
  const [activeTab, setActiveTab] = useState<'upload' | 'visualize'>('upload');
  const [sampleDatasets, setSampleDatasets] = useState<SampleDatasetSummary[]>([]);
  const [isLoadingSamples, setIsLoadingSamples] = useState(false);
  const [datasetSummary, setDatasetSummary] = useState<DatasetSummary | null>(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [datasetFeedback, setDatasetFeedback] = useState<FeedbackSummary | null>(null);
  const [visualizationFeedback, setVisualizationFeedback] = useState<
    Record<string, FeedbackSummary>
  >({});
  const [datasetLeaderboard, setDatasetLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [visualizationLeaderboard, setVisualizationLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [autoInsightsSnapshot, setAutoInsightsSnapshot] = useState<AutoInsightsSnapshot>(
    INITIAL_AUTO_INSIGHTS
  );
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [highlightVisualizations, setHighlightVisualizations] = useState(false);
  const [usedRecommendationKeys, setUsedRecommendationKeys] = useState<Set<string>>(
    () => new Set()
  );
  const pendingRecommendationKeysRef = useRef<Set<string>>(new Set());

  const visualizationPanelRef = useRef<HTMLDivElement | null>(null);
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoInsightsRunnerRef = useRef<(() => void) | null>(null);
  const recommendationRunnerRef = useRef<
    ((recommendation: InsightRecommendation) => Promise<void>) | null
  >(null);

  const canSubmitFeedback = isAuthenticated;
  const savedVisualizationIds = useMemo(
    () => new Set(savedVisualizations.map((viz) => viz.id)),
    [savedVisualizations]
  );

  const getLocalSavedVisualizations = useCallback(
    () => savedVisualizations,
    [savedVisualizations]
  );

  const { syncNow: syncSavedVisualizations } = useSavedVisualizationsSync({
    enabled: isAuthenticated && !isLocalAuth,
    userId: user?.id ?? null,
    onSynced: setSavedVisualizations,
    getLocalVisualizations: getLocalSavedVisualizations,
  });

  useEffect(() => {
    const resolved = getResolvedApiKey(provider);
    if (resolved.apiKey) {
      return;
    }

    for (const key of LLM_PROVIDER_KEYS) {
      const candidate = getResolvedApiKey(key);
      const isEnabled = providers[key]?.enabled !== false || (!preferByok && candidate.envDetected);
      if (candidate.apiKey && isEnabled) {
        if (key !== provider) {
          setProvider(key);
        }
        return;
      }
    }
  }, [provider, providers, preferByok, getResolvedApiKey, setProvider]);

  useEffect(() => {
    setUsedRecommendationKeys(new Set());
    pendingRecommendationKeysRef.current.clear();
  }, [dataset?.id]);

  const focusVisualizations = useCallback(() => {
    setActiveTab('visualize');
    window.requestAnimationFrame(() => {
      visualizationPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    setHighlightVisualizations(true);
    if (highlightTimerRef.current) {
      clearTimeout(highlightTimerRef.current);
    }
    highlightTimerRef.current = setTimeout(() => {
      setHighlightVisualizations(false);
    }, 1600);
  }, []);

  useEffect(
    () => () => {
      if (highlightTimerRef.current) {
        clearTimeout(highlightTimerRef.current);
      }
    },
    []
  );

  useEffect(() => {
    if (!capabilities) {
      void loadCapabilities();
    }
  }, [capabilities, loadCapabilities]);

  useEffect(() => {
    let isMounted = true;

    const fetchSamples = async () => {
      try {
        setIsLoadingSamples(true);
        const samples = await api.listSampleDatasets();
        if (isMounted) {
          setSampleDatasets(samples);
        }
      } catch (error) {
        console.error('Sample dataset fetch error:', error);
        toast.error(getErrorMessage(error, 'Unable to load sample datasets'));
      } finally {
        if (isMounted) {
          setIsLoadingSamples(false);
        }
      }
    };

    void fetchSamples();

    return () => {
      isMounted = false;
    };
  }, []);

  const fetchDatasetSummary = useCallback(async (datasetId: string) => {
    setIsSummaryLoading(true);
    try {
      const summaryData = await api.getDatasetSummary(datasetId);
      setDatasetSummary(summaryData);
    } catch (error: unknown) {
      console.error('Dataset summary fetch error:', error);
    } finally {
      setIsSummaryLoading(false);
    }
  }, []);

  const hydrateVisualizationFeedback = useCallback(async (visualizationId: string) => {
    try {
      const summary = await api.getVisualizationFeedback(visualizationId);
      setVisualizationFeedback((prev) => ({
        ...prev,
        [visualizationId]: summary,
      }));
    } catch (error: unknown) {
      console.error('Visualization feedback fetch error:', error);
    }
  }, []);

  const refreshLeaderboards = useCallback(async () => {
    setLeaderboardLoading(true);
    try {
      const [datasetEntries, visualizationEntries] = await Promise.all([
        api.getDatasetLeaderboard(8),
        api.getVisualizationLeaderboard(8),
      ]);
      setDatasetLeaderboard(datasetEntries);
      setVisualizationLeaderboard(visualizationEntries);
    } catch (error: unknown) {
      console.error('Leaderboard fetch error:', error);
    } finally {
      setLeaderboardLoading(false);
    }
  }, []);

  const fetchDatasetFeedback = useCallback(async () => {
    if (!activeDatasetId) {
      setDatasetFeedback(null);
      return;
    }

    try {
      const summary = await api.getDatasetFeedback(activeDatasetId);
      setDatasetFeedback(summary);
    } catch (error: unknown) {
      console.error('Dataset feedback fetch error:', error);
      setDatasetFeedback(null);
    }
  }, [activeDatasetId]);

  useEffect(() => {
    if (!activeDatasetId) {
      setDatasetSummary(null);
      return;
    }

    setDatasetSummary(null);
    void fetchDatasetSummary(activeDatasetId);
  }, [activeDatasetId, fetchDatasetSummary]);

  useEffect(() => {
    setVisualizationFeedback({});
    setDatasetFeedback(null);

    if (!activeDatasetId) {
      return;
    }

    void fetchDatasetFeedback();
  }, [activeDatasetId, fetchDatasetFeedback, isAuthenticated]);

  useEffect(() => {
    void refreshLeaderboards();
  }, [refreshLeaderboards]);

  useEffect(() => {
    visualizations.forEach((viz: Visualization) => {
      if (!viz.id) {
        return;
      }
      void hydrateVisualizationFeedback(viz.id);
    });
  }, [visualizations, hydrateVisualizationFeedback, isAuthenticated, activeDatasetId]);

  const handleClearDataset = useCallback(() => {
    clearDataset();
    setDatasetSummary(null);
    setDatasetFeedback(null);
    setAutoInsightsSnapshot(INITIAL_AUTO_INSIGHTS);
  }, [clearDataset]);

  const handleRefreshSummary = useCallback(() => {
    if (activeDatasetId) {
      void fetchDatasetSummary(activeDatasetId);
    }
  }, [activeDatasetId, fetchDatasetSummary]);

  const handleAutoInsightsUpdate = useCallback((snapshot: AutoInsightsSnapshot) => {
    setAutoInsightsSnapshot((prev) => ({
      ...snapshot,
      logs: snapshot.logs ?? [],
      recommendations: mergeRecommendations(prev.recommendations, snapshot.recommendations),
    }));
  }, []);

  const runAutoInsights = useCallback(() => {
    if (!dataset) {
      toast.error('Upload a dataset before running Auto Insights.');
      setActiveTab('upload');
      return;
    }
    if (!autoInsightsRunnerRef.current) {
      toast.error('Auto Insights is still preparing. Try again in a moment.');
      return;
    }
    focusVisualizations();
    autoInsightsRunnerRef.current();
  }, [dataset, focusVisualizations]);

  const handleRunRecommendation = useCallback(
    async (recommendation: InsightRecommendation) => {
      const key = recommendationKey(recommendation);
      if (usedRecommendationKeys.has(key)) {
        toast('Visualization already generated from this recommendation.');
        return;
      }
      if (pendingRecommendationKeysRef.current.has(key)) {
        toast('Generation already in progress for this recommendation.');
        return;
      }
      if (!recommendationRunnerRef.current) {
        toast.error('Recommendation runner unavailable. Try again in a moment.');
        return;
      }

      pendingRecommendationKeysRef.current.add(key);
      focusVisualizations();
      try {
        await recommendationRunnerRef.current(recommendation);
        setUsedRecommendationKeys((prev) => {
          if (prev.has(key)) {
            return prev;
          }
          const next = new Set(prev);
          next.add(key);
          return next;
        });
      } catch (error) {
        // Generation failed; allow retry.
      } finally {
        pendingRecommendationKeysRef.current.delete(key);
      }
    },
    [focusVisualizations, usedRecommendationKeys]
  );

  const openUpload = useCallback(() => {
    setActiveTab('upload');
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }, []);

  const openVisualize = useCallback(() => {
    setActiveTab('visualize');
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }, []);

  const handleFileUpload = useCallback(
    async (file: File) => {
      if (isGuest && !isAuthenticated) {
        if (!hasCredits('datasets')) {
          toast.error(
            `Daily dataset upload limit reached (${getRemainingCredits('datasets')} remaining). Create a free account for more uploads!`
          );
          return;
        }
      }

      try {
        setIsProcessing(true);
        const { datasetId, metadata: datasetMetadata } = await api.uploadDataset(file);

        if (isGuest && !isAuthenticated) {
        spendCredits('datasets', 1);
        }

        setDataset({
          id: datasetId,
          file,
          metadata: datasetMetadata,
        });
        setVisualizationFeedback({});
        setDatasetFeedback(null);
        setAutoInsightsSnapshot(INITIAL_AUTO_INSIGHTS);
        void refreshLeaderboards();

        toast.success(
          `Dataset loaded: ${datasetMetadata.rowCount} rows, ${datasetMetadata.columns.length} columns`
        );
        setActiveTab('visualize');
      } catch (error: unknown) {
        console.error('Upload error:', error);
        if (error instanceof ApiError && error.statusCode === 413) {
          const limitValue = error.details?.limit_mb ?? planLimitMb;
          const limitLabel = typeof limitValue === 'number' ? `${limitValue}MB` : 'your current tier';
          const plan = normalizePlanTier((error.details?.plan as string | undefined) ?? planTier);
          toast.error(
            `${formatPlanLabel(plan)} uploads are limited to ${limitLabel}. Upgrade to push bigger files.`
          );
        } else {
          toast.error(getErrorMessage(error, 'Failed to upload dataset'));
        }
      } finally {
        setIsProcessing(false);
      }
    },
    [
      isGuest,
      isAuthenticated,
      hasCredits,
      getRemainingCredits,
      spendCredits,
      setDataset,
      refreshLeaderboards,
      planLimitMb,
      planTier,
    ]
  );

  const handleGenerateVisualization = useCallback(
    async (prompt: string, targetVisualizationId?: string) => {
      if (!dataset) {
        toast.error('Please upload a dataset first');
        return;
      }

      if (isGuest && !isAuthenticated) {
        const visualizationCreditsAvailable = hasCredits('visualizations');
        const aiCreditsAvailable = !useHeuristics ? hasCredits('openai') : true;
        if (!visualizationCreditsAvailable) {
          toast.error(
            `Daily visualization limit reached (${getRemainingCredits(
              'visualizations'
            )} remaining). Create a free account for more!`
          );
          return;
        }
        if (!aiCreditsAvailable) {
          toast.error(
            `Daily AI credit limit reached (${getRemainingCredits(
              'openai'
            )} remaining). Try enabling heuristics or create a free account!`
          );
          return;
        }
      }

      let classification: TierClassification | null = null;
      try {
        classification = await api.classifyVisualizationTier(prompt, dataset.id, datasetSummary);
      } catch (error) {
        console.warn('Tier classification failed, continuing with default tier:', error);
      }

      const normalizedPlan = normalizePlanTier(planTier) ?? 'free';
      const providerConfig = providers[provider];
      const resolvedProvider = getResolvedApiKey(provider);
      const providerDisplayName = PROVIDER_LABELS[provider as LLMProvider] ?? provider;
      const providerEnabled = (providerConfig?.enabled ?? false) || resolvedProvider.source === 'env';

      const aiArtisanEnabled = capabilities?.aiArtisan ?? false;
      const isOfflineEnvironment = capabilities?.environment?.mode === 'offline';

      const tierAllowed = (tier: number): boolean => {
        if (tier === VisualizationTier.AIArtisan && aiArtisanEnabled) {
          return true;
        }

        if (normalizedPlan === 'enterprise' || normalizedPlan === 'team' || normalizedPlan === 'pro') {
          return true;
        }

        if (normalizedPlan === 'cloud') {
          if (tier === VisualizationTier.AIArtisan) {
            return aiArtisanEnabled;
          }
          return tier <= VisualizationTier.Dynamic;
        }

        if (normalizedPlan === 'free') {
          if (aiArtisanEnabled || isOfflineEnvironment) {
            return tier <= VisualizationTier.AIArtisan;
          }
          return tier <= VisualizationTier.Static;
        }

        return tier <= VisualizationTier.Static;
      };

      if (classification && !tierAllowed(classification.tier)) {
        const tierName =
          classification.tier === VisualizationTier.AIArtisan
            ? 'Tier 3 - AI Artisan (AI)'
            : classification.tier === VisualizationTier.Dynamic
            ? 'Tier 2 - Dynamic'
            : 'Tier 1 - Static';
        toast.error(
          `${tierName} visualizations require an upgraded plan. Please visit the billing page to unlock this tier.`
        );
        return;
      }

      if (classification?.tier === VisualizationTier.AIArtisan && capabilities && !capabilities.aiArtisan) {
        toast.error('AI Artisan generations are disabled on this backend.');
        return;
      }

      if (classification) {
        let tierName: string;
        switch (classification.tier) {
          case VisualizationTier.AIArtisan:
            tierName = 'Tier 3  AI Artisan (AI)';
            break;
          case VisualizationTier.Dynamic:
            tierName = 'Tier 2  Dynamic';
            break;
          default:
            tierName = 'Tier 1  Static';
            break;
        }
        toast(`${tierName} selected (confidence ${(classification.confidence * 100).toFixed(0)}%).`);
      }

      try {
        setIsProcessing(true);

        if (classification?.tier === VisualizationTier.AIArtisan) {
          if (!providerEnabled) {
            const message = resolvedProvider.envDetected && preferByok
              ? (canEditProviderKeys
                  ? `Disable "Always use BYOK keys" to use the detected ${providerDisplayName} .env key, or add a workspace key.`
                  : `Disable "Always use BYOK keys" to use the detected ${providerDisplayName} .env key. Provider keys are managed by your workspace admin.`)
              : (canEditProviderKeys
                  ? `Enable ${providerDisplayName} in Settings or allow environment fallbacks to generate AI Artisan visualizations.`
                  : `Ask your workspace admin to enable ${providerDisplayName} keys, or rely on managed rotating keys.`);
            toast.error(message);
            return;
          }
          if (!resolvedProvider.apiKey) {
            const hint = resolvedProvider.envDetected && preferByok
              ? (canEditProviderKeys
                  ? `Disable "Always use BYOK keys" or paste a ${providerDisplayName} API key to generate AI Artisan visualizations.`
                  : `Disable "Always use BYOK keys" to fall back to the detected ${providerDisplayName} .env key. Contact your admin to update provider keys.`)
              : (canEditProviderKeys
                  ? `Add a ${providerDisplayName} API key in Settings or define it in your .env file to generate AI Artisan visualizations.`
                  : `Provider keys are managed by your workspace admin. Use managed rotating keys or contact your admin.`);
            toast.error(hint);
            return;
          }

          const artisanResponse = await api.generateAIArtisanVisualization({
            prompt,
            datasetId: dataset.id,
            summary: datasetSummary,
            metadata,
            aestheticMode: 'auto',
            animationLevel: 'moderate',
            model: providerConfig?.model,
            apiKey: resolvedProvider.apiKey,
          });

          if (isGuest && !isAuthenticated) {
            spendCredits('visualizations', 1);
            spendCredits('openai', 1);
          }

          const now = new Date().toISOString();
          const visualizationId =
            typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
              ? crypto.randomUUID()
              : `ai-artisan-${Date.now()}`;
          const previewRows = Array.isArray(metadata?.preview) ? metadata.preview : [];

          const artisanVisualization: Visualization = {
            id: visualizationId,
            datasetId: dataset.id,
            type: 'ai_artisan',
            title: classification?.suggestedApproach ?? 'AI Artisan Visualization',
            description: classification?.reasoning ?? undefined,
            config: {},
            data: { rows: previewRows },
            createdAt: now,
            updatedAt: now,
            prompt,
            cost: {
              provider,
              model: artisanResponse.model_used,
              inputTokens: 0,
              outputTokens: 0,
              totalCost: artisanResponse.cost ?? 0,
              rates: {
                input: 0,
                output: 0,
              },
            },
            provider_used: provider,
            metadata: {
              ...(classification
                ? {
                    tier: classification.tier,
                    tierConfidence: classification.confidence,
                    tierReasoning: classification.reasoning,
                    suggestedApproach: classification.suggestedApproach,
                    estimatedCost: classification.estimatedCost,
                  }
                : {}),
              aiArtisanCode: artisanResponse.code,
              aiArtisanSandbox: artisanResponse.sandbox_config,
              aiArtisanModel: artisanResponse.model_used,
              aiArtisanGenerationTime: artisanResponse.generation_time_ms,
              isAIArtisan: true,
            },
          };

          addVisualization(artisanVisualization);
          addCost({
            provider,
            model: artisanResponse.model_used,
            inputTokens: 0,
            outputTokens: 0,
            totalCost: artisanResponse.cost ?? 0,
            rates: { input: 0, output: 0 },
          });
          void hydrateVisualizationFeedback(artisanVisualization.id);
          toast.success('AI Artisan visualization created successfully');
          focusVisualizations();
          void refreshLeaderboards();
          return;
        }

        const visualization = await api.generateVisualization({
          prompt,
          datasetId: dataset.id,
          provider,
          useHeuristics,
        });

        if (isGuest && !isAuthenticated) {
          spendCredits('visualizations', 1);
          if (!useHeuristics) {
            spendCredits('openai', 1);
          }
        }

        if (classification) {
          const tier = classification.tier as number;
          const tierName =
            tier === VisualizationTier.AIArtisan
              ? 'Tier 3 - AI Artisan (AI)'
              : tier === VisualizationTier.Dynamic
                ? 'Tier 2 - Dynamic'
                : 'Tier 1 - Static';
          toast(`${tierName} selected (confidence ${(classification.confidence * 100).toFixed(0)}%).`);
        }

        if (targetVisualizationId) {
          const updates: Visualization = {
            ...visualization,
            prompt,
          };
          delete (updates as Partial<Visualization>).id;
          updateVisualization(targetVisualizationId, updates);
          void hydrateVisualizationFeedback(targetVisualizationId);
          toast.success('Visualization updated');
          focusVisualizations();
        } else {
          addVisualization(visualization);
          void hydrateVisualizationFeedback(visualization.id);
          toast.success('Visualization created successfully');
          focusVisualizations();
        }

        void refreshLeaderboards();
      } catch (error: unknown) {
        console.error('Visualization error:', error);
        toast.error(getErrorMessage(error, 'Failed to create visualization'));
      } finally {
        setIsProcessing(false);
      }
    },
    [
      dataset,
      provider,
      useHeuristics,
      addVisualization,
      updateVisualization,
      hydrateVisualizationFeedback,
      refreshLeaderboards,
      isGuest,
      isAuthenticated,
      hasCredits,
      spendCredits,
      getRemainingCredits,
      focusVisualizations,
      metadata,
      datasetSummary,
      planTier,
      providers,
      capabilities,
      addCost,
      preferByok,
      getResolvedApiKey,
    ]
  );

  const handlePromptSubmit = useCallback(
    (prompt: string) => {
      void handleGenerateVisualization(prompt);
    },
    [handleGenerateVisualization]
  );

  const handleLoadSampleDataset = useCallback(
    async (filename: string) => {
      try {
        setIsProcessing(true);
        const { datasetId, metadata: datasetMetadata } = await api.loadSampleDataset(filename);
        setDataset({
          id: datasetId,
          file: null,
          metadata: datasetMetadata,
        });
        setVisualizationFeedback({});
        setDatasetFeedback(null);
        setAutoInsightsSnapshot(INITIAL_AUTO_INSIGHTS);
        void refreshLeaderboards();
        toast.success(`Sample dataset loaded: ${datasetMetadata.rowCount} rows`);
        setActiveTab('visualize');
        setSampleDatasets((current) =>
          current.map((sample) =>
            sample.filename === filename ? { ...sample, isLoaded: true } : sample
          )
        );
      } catch (error: unknown) {
        console.error('Sample dataset load error:', error);
        toast.error(getErrorMessage(error, 'Failed to load sample dataset'));
      } finally {
        setIsProcessing(false);
      }
    },
    [setDataset, refreshLeaderboards]
  );

  const handleDatasetVote = useCallback(
    async (vote: 'up' | 'down' | null) => {
      if (!activeDatasetId || !canSubmitFeedback) {
        return;
      }
      try {
        const summary = await api.submitDatasetFeedback(activeDatasetId, { vote });
        setDatasetFeedback(summary);
        void refreshLeaderboards();
      } catch (error: unknown) {
        console.error('Dataset feedback submit error:', error);
        toast.error('Unable to submit dataset feedback');
      }
    },
    [activeDatasetId, canSubmitFeedback, refreshLeaderboards]
  );

  const handleDatasetFavorite = useCallback(
    async (favorite: boolean) => {
      if (!activeDatasetId || !canSubmitFeedback) {
        return;
      }
      try {
        const summary = await api.submitDatasetFeedback(activeDatasetId, { favorite });
        setDatasetFeedback(summary);
        void refreshLeaderboards();
      } catch (error: unknown) {
        console.error('Dataset favorite error:', error);
        toast.error('Unable to update dataset favorite');
      }
    },
    [activeDatasetId, canSubmitFeedback, refreshLeaderboards]
  );

  const handleVisualizationVote = useCallback(
    async (visualizationId: string, vote: 'up' | 'down' | null) => {
      if (!canSubmitFeedback) {
        toast.error('Sign in to vote on visualizations.');
        return;
      }
      const target = visualizations.find((item) => item.id === visualizationId);
      const datasetRef = target?.datasetId ?? activeDatasetId;
      if (!datasetRef) {
        return;
      }
      try {
        const summary = await api.submitVisualizationFeedback(visualizationId, {
          vote,
          datasetId: datasetRef,
        });
        setVisualizationFeedback((prev) => ({
          ...prev,
          [visualizationId]: summary,
        }));
        void refreshLeaderboards();
      } catch (error: unknown) {
        console.error('Visualization feedback submit error:', error);
        toast.error('Unable to submit visualization feedback');
      }
    },
    [visualizations, activeDatasetId, canSubmitFeedback, refreshLeaderboards]
  );

  const handleVisualizationFavorite = useCallback(
    async (visualizationId: string, favorite: boolean) => {
      const target = visualizations.find((item) => item.id === visualizationId);
      if (!target) {
        return;
      }

      if (favorite) {
        saveVisualization(visualizationId, target);
        if (isGuest) {
          addFavorite('visualizations', visualizationId);
        }
        toast.success('Visualization saved to your profile');
      } else {
        unsaveVisualization(visualizationId);
        if (isGuest) {
          removeFavorite('visualizations', visualizationId);
        }
        toast.success('Removed from saved visualizations');
      }

      setVisualizationFeedback((prev) => {
        const existing = prev[visualizationId];
        const base: FeedbackSummary = existing ?? {
          targetId: visualizationId,
          datasetId: target.datasetId ?? activeDatasetId ?? undefined,
          likes: 0,
          dislikes: 0,
          favorites: 0,
          score: 0,
          userVote: null,
          userFavorite: false,
        };
        const adjustedFavorites = favorite
          ? (base.favorites ?? 0) + 1
          : Math.max(0, (base.favorites ?? 0) - 1);
        return {
          ...prev,
          [visualizationId]: {
            ...base,
            favorites: adjustedFavorites,
            userFavorite: favorite,
          },
        };
      });

      if (isAuthenticated && user?.id) {
        try {
          if (favorite) {
            await upsertSavedVisualization(user.id, target);
          } else {
            await removeSavedVisualization(user.id, visualizationId);
          }
          void syncSavedVisualizations();
        } catch (error: unknown) {
          console.error('Visualization favorite sync error:', error);
        }
      }

      if (!canSubmitFeedback) {
        return;
      }

      try {
        const summary = await api.submitVisualizationFeedback(visualizationId, {
          favorite,
          datasetId: target.datasetId ?? activeDatasetId ?? undefined,
        });
        setVisualizationFeedback((prev) => ({
          ...prev,
          [visualizationId]: summary,
        }));
        void refreshLeaderboards();
      } catch (error: unknown) {
        console.error('Visualization favorite error:', error);
        toast.error('Unable to update visualization favorite');
      }
    },
    [
      visualizations,
      activeDatasetId,
      canSubmitFeedback,
      refreshLeaderboards,
      saveVisualization,
      unsaveVisualization,
      addFavorite,
      removeFavorite,
      isGuest,
      isAuthenticated,
      user?.id,
      syncSavedVisualizations,
    ]
  );

  const handleClearAllVisualizations = useCallback(() => {
    clearVisualizations();
    setVisualizationFeedback({});
  }, [clearVisualizations]);

  const handleRemoveVisualization = useCallback(
    (visualizationId: string) => {
      removeVisualization(visualizationId);
      setVisualizationFeedback((prev) => {
        if (!(visualizationId in prev)) {
          return prev;
        }
        const next = { ...prev };
        delete next[visualizationId];
        return next;
      });
    },
    [removeVisualization]
  );

  const handleExportVisualization = useCallback((visualization: Visualization) => {
    const exportData = {
      visualization,
      metadata: {
        exportedAt: new Date().toISOString(),
        platform: 'OpenStrand',
      },
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `visualization-${visualization.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Visualization exported');
  }, []);

  const providerUsage = useMemo<ProviderUsageSummary>(() => {
    if (!visualizations.length) {
      return {
        totalCost: 0,
        totalRequests: 0,
        totalTokens: 0,
        providers: [],
      };
    }

    const map = new Map<string, ProviderUsageEntry>();
    let totalCost = 0;
    let totalTokens = 0;

    for (const viz of visualizations) {
      const providerName = viz.cost?.provider ?? viz.provider_used ?? 'unknown';
      const entry: ProviderUsageEntry = map.get(providerName) ?? {
        provider: providerName,
        count: 0,
        totalCost: 0,
        inputTokens: 0,
        outputTokens: 0,
        lastUsedAt: null,
      };

      entry.count += 1;
      if (viz.cost) {
        entry.totalCost += viz.cost.totalCost ?? 0;
        entry.inputTokens += viz.cost.inputTokens ?? 0;
        entry.outputTokens += viz.cost.outputTokens ?? 0;
        totalCost += viz.cost.totalCost ?? 0;
        totalTokens += (viz.cost.inputTokens ?? 0) + (viz.cost.outputTokens ?? 0);
      }

      const updatedAt = viz.updatedAt ?? viz.createdAt;
      if (updatedAt) {
        const current = entry.lastUsedAt ? new Date(entry.lastUsedAt).getTime() : 0;
        const candidate = new Date(updatedAt).getTime();
        if (!entry.lastUsedAt || candidate > current) {
          entry.lastUsedAt = updatedAt;
        }
      }

      map.set(providerName, entry);
    }

    const providers = Array.from(map.values()).sort((a, b) => b.totalCost - a.totalCost);

    return {
      totalCost,
      totalTokens,
      totalRequests: visualizations.length,
      providers,
    };
  }, [visualizations]);

  const dashboardOverview = useMemo<DashboardOverviewData>(() => {
    const datasetRows = metadata?.rowCount ?? datasetSummary?.rowCount ?? null;
    const datasetColumns = metadata?.columns.length ?? datasetSummary?.columnCount ?? null;
    const datasetUploadedAt = metadata?.uploadedAt ?? datasetSummary?.generatedAt ?? null;
    const datasetName = metadata?.filename ?? datasetSummary?.datasetId ?? null;
    const datasetLanguage = metadata?.language ?? null;

    let lastVisualizationAt: string | null = null;
    if (visualizations.length) {
      const sorted = [...visualizations].sort((a, b) =>
        new Date(b.updatedAt ?? b.createdAt).getTime() -
        new Date(a.updatedAt ?? a.createdAt).getTime()
      );
      lastVisualizationAt = sorted[0].updatedAt ?? sorted[0].createdAt ?? null;
    }

    const autoInsightsReady = Boolean(autoInsightsSnapshot?.insights || autoInsightsSnapshot?.status === 'ready');

    return {
      datasetName,
      datasetRows,
      datasetColumns,
      datasetUploadedAt,
      datasetLanguage,
      totalVisualizations: visualizations.length,
      savedVisualizations: savedVisualizationIds.size,
      lastVisualizationAt,
      autoInsightsStatus: autoInsightsSnapshot?.status ?? null,
      autoInsightsReady,
      planTier,
      planLimitMb,
      datasetReady: Boolean(dataset),
    };
  }, [
    metadata,
    datasetSummary,
    visualizations,
    autoInsightsSnapshot,
    savedVisualizationIds,
    planTier,
    planLimitMb,
    dataset,
  ]);

  const activityTimeline = useMemo<ActivityEvent[]>(() => {
    const events: ActivityEvent[] = [];

    const datasetTimestamp = metadata?.uploadedAt ?? datasetSummary?.generatedAt ?? null;
    if (datasetTimestamp) {
      events.push({
        id: 'dataset-upload',
        type: 'dataset',
        timestamp: datasetTimestamp,
        title: metadata?.filename ? `Dataset uploaded: ${metadata.filename}` : 'Dataset uploaded',
        description: dataset
          ? `${metadata?.rowCount ?? datasetSummary?.rowCount ?? 0} rows • ${
              metadata?.columns.length ?? datasetSummary?.columnCount ?? 0
            } columns`
          : undefined,
        meta: {
          language: metadata?.language,
        },
      });
    }

    const recentVisualizations = [...visualizations]
      .sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, 6);

    for (const viz of recentVisualizations) {
      events.push({
        id: `viz-${viz.id}`,
        type: 'visualization',
        timestamp: viz.createdAt ?? new Date().toISOString(),
        title: viz.title || 'Visualization created',
        description: viz.prompt ? `Prompt: ${viz.prompt}` : undefined,
        meta: {
          provider: viz.cost?.provider ?? viz.provider_used,
          visualizationType: viz.type,
        },
      });
    }

    const insightsTimestamp = autoInsightsSnapshot?.insights?.generatedAt ?? null;
    if (insightsTimestamp) {
      events.push({
        id: 'auto-insights',
        type: 'insight',
        timestamp: insightsTimestamp,
        title: 'Auto Insights generated',
        description: autoInsightsSnapshot?.status ?? 'Analysis complete',
        meta: {
          insightCount: autoInsightsSnapshot?.insights?.insights
            ? Object.keys(autoInsightsSnapshot.insights.insights).length
            : undefined,
        },
      });
    }

    return events
      .filter((event) => Boolean(event.timestamp))
      .sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
  }, [metadata, datasetSummary, dataset, visualizations, autoInsightsSnapshot]);

  const feedbackOverview = useMemo<FeedbackOverview>(() => {
    const visualizationSummaries = Object.values(visualizationFeedback ?? {});

    let visualizationAggregate: FeedbackOverview['visualizations'] = null;
    if (visualizationSummaries.length) {
      const totals = visualizationSummaries.reduce(
        (acc, item) => {
          acc.totalLikes += item.likes ?? 0;
          acc.totalDislikes += item.dislikes ?? 0;
          acc.totalFavorites += item.favorites ?? 0;
          acc.totalScore += item.score ?? 0;
          if (!acc.top || (item.score ?? 0) > (acc.top.score ?? 0)) {
            acc.top = item;
          }
          return acc;
        },
        {
          totalLikes: 0,
          totalDislikes: 0,
          totalFavorites: 0,
          totalScore: 0,
          top: null as FeedbackSummary | null,
        }
      );

      visualizationAggregate = {
        count: visualizationSummaries.length,
        totalLikes: totals.totalLikes,
        totalDislikes: totals.totalDislikes,
        totalFavorites: totals.totalFavorites,
        averageScore:
          visualizationSummaries.length > 0
            ? totals.totalScore / visualizationSummaries.length
            : 0,
        topVisualization: totals.top,
      };
    }

    return {
      dataset: datasetFeedback ?? null,
      visualizations: visualizationAggregate,
    };
  }, [datasetFeedback, visualizationFeedback]);

  return {
    dataset,
    metadata,
    planTier,
    planLimitMb,
    visualizations,
    autoInsightsSnapshot,
    isGuest,
    isAuthenticated,
    isLocalAuth,
    activeTab,
    setActiveTab,
    isProcessing,
    setIsProcessing,
    isLoadingSamples,
    sampleDatasets,
    handleFileUpload,
    handleClearDataset,
    handleLoadSampleDataset,
    datasetSummary,
    isSummaryLoading,
    handleRefreshSummary,
    useHeuristics,
    handlePromptSubmit,
    handleGenerateVisualization,
    datasetFeedback,
    handleDatasetVote,
    handleDatasetFavorite,
    datasetLeaderboard,
    visualizationLeaderboard,
    leaderboardLoading,
    refreshLeaderboards,
    focusVisualizations,
    handleAutoInsightsUpdate,
    autoInsightsRunnerRef,
    recommendationRunnerRef,
    visualizationPanelRef,
    handleClearAllVisualizations,
    handleExportVisualization,
    handleRemoveVisualization,
    visualizationFeedback,
    handleVisualizationVote,
    handleVisualizationFavorite,
    highlightVisualizations,
    handleRunRecommendation,
    savedVisualizationIds,
    usedRecommendationKeys,
    canSubmitFeedback,
    openSettings,
    closeSettings,
    showSettings,
    isPaletteOpen,
    setIsPaletteOpen,
    openUpload,
    runAutoInsights,
    openVisualize,
    dashboardOverview,
    providerUsage,
    activityTimeline,
    feedbackOverview,
  };
}
