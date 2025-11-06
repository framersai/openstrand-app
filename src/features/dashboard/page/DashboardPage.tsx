'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Upload,
  LineChart,
  Sparkles,
  Command,
  Layout,
  Trash2,
  Users,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

import { CommandPalette, type CommandAction } from '@/components/command-palette';
import { GuidedTour, TourControlPanel } from '@/components/guided-tour';
import { SettingsDialog } from '@/components/settings-dialog';
import { UnifiedHeader } from '@/components/navigation/UnifiedHeader';
import { LocalOnboarding } from '@/components/onboarding/LocalOnboarding';
import { TeamOnboarding } from '@/components/onboarding/TeamOnboarding';
import { CollapsiblePanel } from '@/components/dashboard/CollapsiblePanel';
import { FloatingActionToolbar } from '@/components/dashboard/FloatingActionToolbar';
import { MasonryGrid } from '@/components/dashboard/MasonryGrid';
import { StatusBar } from '@/components/dashboard/StatusBar';
import {
  EmptyDatasetIllustration,
  NoVisualizationsIllustration,
  KnowledgeGraphIllustration
} from '@/components/illustrations/DashboardIllustrations';
import {
  UploadTabContent,
  VisualizeTabContent,
  SystemStatusPanel,
  DashboardOverviewMinimal,
  AIUsagePanel,
  FeedbackPulsePanel,
  DatasetInspectorPanel,
} from '@/features/dashboard';

import { DashboardHeaderActions } from './DashboardHeaderActions';
import { VisualizationWorkspace } from './VisualizationWorkspace';
import { useDashboardShortcuts } from './useDashboardShortcuts';
import { useDashboardController } from './useDashboardController';
import { useLayoutPresets } from '@/hooks/useLayoutPresets';
import { useKeyboardNavigation, defaultKeyboardBindings } from '@/hooks/useKeyboardNavigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useFeatureFlags } from '@/lib/feature-flags';
import { useAppMode } from '@/hooks/useAppMode';
import { useOpenStrandStore } from '@/store/openstrand.store';
import { DashboardToolbar } from '@/features/dashboard/components/DashboardToolbar';
import { openstrandAPI } from '@/services/openstrand.api';
import type { Strand } from '@/types/openstrand';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { useLocalizedPath } from '@/hooks/useLocalizedPath';
import { DashboardShortcutsDialog } from '@/features/dashboard/components/DashboardShortcutsDialog';
import { BillingStatusCard } from '@/features/dashboard/components/BillingStatusCard';
import { useSearchParams } from 'next/navigation';

export default function DashboardPage() {
  const {
    dataset,
    metadata,
    planTier,
    planLimitMb,
    visualizations,
    autoInsightsSnapshot,
    isGuest,
    isAuthenticated,
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
    feedbackOverview,
  } = useDashboardController();

  const { mode } = useAppMode();
  const { isTeamEdition } = useFeatureFlags();
  const capabilities = useOpenStrandStore((state) => state.capabilities);
  const teamOnboardingComplete = useOpenStrandStore((state) => state.teamOnboardingComplete);
  const environmentMode = capabilities?.environment?.mode ?? mode;

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [toolbarSearch, setToolbarSearch] = useState('');
  const [toolbarDifficulty, setToolbarDifficulty] = useState('');
  const [toolbarTags, setToolbarTags] = useState<string[]>([]);
  const [toolbarFileType, setToolbarFileType] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Strand[] | null>(null);
  const [searchTotal, setSearchTotal] = useState<number | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const localizePath = useLocalizedPath();
  const [recentSearches, setRecentSearches] = useState<Array<{ context: 'visualize' | 'data'; query: string; difficulty?: string; tags?: string[]; fileType?: string }>>([]);
  const [pinnedStrands, setPinnedStrands] = useState<Array<{ id: string; title: string; summary?: string; difficulty?: string; tags?: string[] }>>([]);
  const searchParams = useSearchParams();

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.shiftKey && event.key === '?') {
        event.preventDefault();
        setShortcutsOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Load persisted recents and pinned
  useEffect(() => {
    try {
      const recentsRaw = localStorage.getItem('dashboard_recent_searches');
      const pinsRaw = localStorage.getItem('dashboard_pinned_strands');
      if (recentsRaw) {
        const parsed = JSON.parse(recentsRaw);
        if (Array.isArray(parsed)) setRecentSearches(parsed);
      }
      if (pinsRaw) {
        const parsedPins = JSON.parse(pinsRaw);
        if (Array.isArray(parsedPins)) setPinnedStrands(parsedPins);
      }
    } catch {}
  }, []);

  const persistRecents = (items: typeof recentSearches) => {
    setRecentSearches(items);
    try { localStorage.setItem('dashboard_recent_searches', JSON.stringify(items)); } catch {}
  };
  const persistPins = (items: typeof pinnedStrands) => {
    setPinnedStrands(items);
    try { localStorage.setItem('dashboard_pinned_strands', JSON.stringify(items)); } catch {}
  };

  // Helper to run toolbar search with current filters
  const performSearch = async () => {
    setSearching(true);
    setSearchError(null);
    try {
      const filters: any = {};
      if (toolbarSearch.trim()) filters.search = toolbarSearch.trim();
      if (toolbarDifficulty) filters.difficulty = toolbarDifficulty;
      if (toolbarTags.length) filters.tags = toolbarTags;
      if (activePanel !== 'visualize' && toolbarFileType) filters.contentType = toolbarFileType;
      if (activePanel === 'visualize') filters.type = 'note';
      if (activePanel !== 'visualize') filters.type = 'dataset';
      const { strands, total } = await openstrandAPI.strands.list(filters);
      setSearchResults(strands);
      setSearchTotal(total);
    } catch (error) {
      setSearchError(error instanceof Error ? error.message : 'Search failed');
    } finally {
      setSearching(false);
    }
  };

  // Apply header quick filters from query params
  useEffect(() => {
    const q = searchParams.get('q') || '';
    const difficulty = searchParams.get('difficulty') || '';
    const tagsParam = searchParams.get('tags') || '';
    const typeParam = searchParams.get('type') || '';
    const fileTypeParam = searchParams.get('fileType') || '';
    const tags = tagsParam
      ? tagsParam.split(',').map((t) => t.trim()).filter(Boolean)
      : [];

    if (q || difficulty || tags.length || typeParam || fileTypeParam) {
      setToolbarSearch(q);
      setToolbarDifficulty(difficulty);
      setToolbarTags(tags);
      if (typeParam === 'dataset' && fileTypeParam) {
        setToolbarFileType(fileTypeParam);
      }
      // trigger search without user interaction
      void performSearch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const shouldShowLocalOnboarding = environmentMode === 'offline';
  const shouldShowTeamOnboarding =
    isTeamEdition && environmentMode === 'cloud' && !teamOnboardingComplete;

  const {
    currentLayout,
    applyPreset,
    togglePanel,
    toggleSidebar,
    toggleStatusBar,
    cycleGridColumns
  } = useLayoutPresets();

  const [activePanel, setActivePanel] = useState<'upload' | 'visualize'>('upload');

  // Prepare visualization items for masonry grid
  const masonryItems = useMemo(() => {
    return visualizations.map(viz => ({
      id: viz.id,
      content: (
        <div className="h-full">
          <h4 className="text-sm font-semibold mb-2">{viz.type}</h4>
          <div className="h-32 bg-muted/20 rounded flex items-center justify-center">
            {viz.content || 'Visualization'}
          </div>
        </div>
      ),
      height: viz.size === 'large' ? 'large' : viz.size === 'small' ? 'small' : 'medium',
      width: viz.featured ? 2 : 1
    }));
  }, [visualizations]);

  // Floating action toolbar actions
  const fabActions = useMemo(() => {
    const actions = [
      {
        id: 'upload',
        icon: Upload,
        label: 'Upload Dataset',
        onClick: () => setActivePanel('upload'),
        shortcut: 'u',
        disabled: isProcessing,
      },
      {
        id: 'visualize',
        icon: LineChart,
        label: 'New Visualization',
        onClick: () => setActivePanel('visualize'),
        shortcut: 'v',
        disabled: !dataset,
      },
      {
        id: 'insights',
        icon: Sparkles,
        label: 'Auto Insights',
        onClick: () => autoInsightsRunnerRef.current?.(),
        shortcut: 'i',
        disabled: !dataset || isProcessing,
      },
      {
        id: 'command',
        icon: Command,
        label: 'Command Palette',
        onClick: () => setIsPaletteOpen(true),
        shortcut: 'k',
      },
      {
        id: 'layout',
        icon: Layout,
        label: 'Change Layout',
        onClick: () => cycleGridColumns(),
        shortcut: 'l',
      },
    ];

    if (visualizations.length > 0) {
      actions.push({
        id: 'clear',
        icon: Trash2,
        label: 'Clear All',
        onClick: handleClearAllVisualizations,
        shortcut: 'c',
        variant: 'danger' as const,
      });
    }

    return actions;
  }, [
    dataset,
    isProcessing,
    visualizations.length,
    cycleGridColumns,
    handleClearAllVisualizations,
    autoInsightsRunnerRef,
    setIsPaletteOpen,
  ]);

  const commandActions = useMemo<CommandAction[]>(
    () => {
      const base: CommandAction[] = [
      {
        id: 'upload',
        label: 'Upload dataset',
        hint: 'Switch to the Data tab',
        shortcut: 'Shift+U',
        onSelect: openUpload,
      },
      {
        id: 'auto-insights',
        label: 'Run Auto Insights',
        hint: 'Analyse the active dataset',
        shortcut: 'Shift+A',
        onSelect: runAutoInsights,
      },
      {
        id: 'new-visualization',
        label: 'New visualization',
        hint: 'Jump to the Visualize tab',
        shortcut: 'Shift+V',
        onSelect: openVisualize,
      },
      {
        id: 'clear-visualizations',
        label: 'Clear visualizations',
        shortcut: 'Shift+C',
        onSelect: handleClearAllVisualizations,
      },
      {
        id: 'open-settings',
        label: 'Open settings',
        shortcut: 'Shift+S',
        onSelect: openSettings,
        },
      ];

      const quickCreate: CommandAction[] = [
        {
          id: 'quick-create-note',
          label: 'Quick create: Note',
          hint: 'Open composer with a fresh note',
          onSelect: () => { window.location.href = localizePath('/composer'); },
        },
        {
          id: 'quick-create-whiteboard',
          label: 'Quick create: Whiteboard sketch',
          hint: 'Open composer and show whiteboard',
          onSelect: () => { window.location.href = localizePath('/composer?whiteboard=1'); },
        },
      ];

      const recentSearchActions: CommandAction[] = recentSearches.slice(0, 8).map((r, idx) => ({
        id: `search-${idx}-${r.query}`,
        label: `Search: ${r.query || '(empty)'}${r.difficulty ? ` · ${r.difficulty}` : ''}${r.tags?.length ? ` · ${r.tags.length} tag${r.tags.length > 1 ? 's' : ''}` : ''}`,
        hint: 'Re-run saved search',
        onSelect: () => {
          setToolbarSearch(r.query);
          setToolbarDifficulty(r.difficulty || '');
          setToolbarTags(r.tags || []);
          if (r.context !== 'visualize') setToolbarFileType(r.fileType || '');
          void performSearch();
        },
      }));

      return [...quickCreate, ...base, ...recentSearchActions];
    },
    [openUpload, runAutoInsights, openVisualize, handleClearAllVisualizations, openSettings, localizePath, recentSearches]
  );

  // Keyboard navigation
  const keyBindings = useMemo(() => [
    ...defaultKeyboardBindings,
    {
      key: 'b',
      ctrl: true,
      description: 'Toggle Sidebar',
      category: 'View',
      action: toggleSidebar
    },
    {
      key: 's',
      ctrl: true,
      description: 'Toggle Status Bar',
      category: 'View',
      action: toggleStatusBar
    },
    {
      key: '1',
      alt: true,
      description: 'Focused Layout',
      category: 'Layout',
      action: () => applyPreset('focused')
    },
    {
      key: '2',
      alt: true,
      description: 'Balanced Layout',
      category: 'Layout',
      action: () => applyPreset('balanced')
    },
    {
      key: '3',
      alt: true,
      description: 'Overview Layout',
      category: 'Layout',
      action: () => applyPreset('overview')
    },
    {
      key: '0',
      alt: true,
      description: 'Zen Mode',
      category: 'Layout',
      action: () => applyPreset('zen')
    }
  ], [toggleSidebar, toggleStatusBar, applyPreset]);

  useKeyboardNavigation({ bindings: keyBindings });

  useDashboardShortcuts({
    onToggleCommandPalette: () => setIsPaletteOpen((prev) => !prev),
    onOpenUpload: openUpload,
    onRunAutoInsights: runAutoInsights,
    onOpenVisualize: openVisualize,
    onClearVisualizations: handleClearAllVisualizations,
    onOpenSettings: openSettings,
  });

  const visualizeDisabled = !dataset;

  const uploadContent = (
    <UploadTabContent
      metadata={metadata ?? null}
      isProcessing={isProcessing}
      isLoadingSamples={isLoadingSamples}
      samples={sampleDatasets}
      activeDatasetId={dataset?.id}
      onFileUpload={handleFileUpload}
      onClearDataset={handleClearDataset}
      onLoadSample={handleLoadSampleDataset}
      planTier={planTier}
      planLimitMb={planLimitMb}
      summary={datasetSummary}
      isSummaryLoading={isSummaryLoading}
      onRefreshSummary={handleRefreshSummary}
    />
  );

  const visualizeContent = (
    <VisualizeTabContent
      datasetId={dataset?.id ?? null}
      isProcessing={isProcessing}
      useHeuristics={useHeuristics}
      hasDataset={Boolean(dataset)}
      onSubmitPrompt={handlePromptSubmit}
      onQuickAction={(prompt: string) => handleGenerateVisualization(prompt)}
      onProcessingChange={setIsProcessing}
      datasetFeedback={datasetFeedback}
      canSubmitFeedback={canSubmitFeedback}
      onDatasetVote={handleDatasetVote}
      onDatasetFavorite={handleDatasetFavorite}
      leaderboardDatasets={datasetLeaderboard}
      leaderboardVisualizations={visualizationLeaderboard}
      leaderboardLoading={leaderboardLoading}
      onRefreshLeaderboards={refreshLeaderboards}
      onNavigateToVisualizations={focusVisualizations}
      onAutoInsightsUpdate={handleAutoInsightsUpdate}
      onRegisterAutoInsightsRunner={(runner) => {
        autoInsightsRunnerRef.current = runner ?? null;
      }}
      onRegisterRecommendationRunner={(runner) => {
        recommendationRunnerRef.current = runner ?? null;
      }}
    />
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <GuidedTour />
      {shouldShowLocalOnboarding && <LocalOnboarding onOpenSettings={openSettings} />}
      {shouldShowTeamOnboarding && <TeamOnboarding onOpenSettings={openSettings} />}
      <UnifiedHeader onOpenSettings={openSettings} />

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar (if enabled) - More compact design */}
        {currentLayout.showSidebar && (
          <aside className={cn(
            "border-r border-border/50 bg-background/95 backdrop-blur overflow-hidden flex flex-col transition-[width] duration-300",
            isSidebarCollapsed ? "w-20" : "w-80",
            currentLayout.sidebarPosition === 'right' && 'order-2 border-l border-r-0'
          )}>
            <div className="flex items-center justify-between border-b border-border/40 px-3 py-2">
              <span
                className={cn(
                  "text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground",
                  isSidebarCollapsed && "sr-only"
                )}
              >
                Workspace
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSidebarCollapsed((prev) => !prev)}
                className="h-7 w-7 rounded-full border border-border/50 bg-background/70 text-muted-foreground hover:border-primary/40 hover:text-primary"
                aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {isSidebarCollapsed ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronLeft className="h-4 w-4" />
                )}
              </Button>
            </div>
            {/* Sidebar tabs for better organization */}
            <div className="flex-1 overflow-hidden">
              <Tabs defaultValue="data" className="h-full flex flex-col">
                <TabsList
                  className={cn(
                    "m-2 grid grid-cols-2 gap-2 transition-all",
                    isSidebarCollapsed && "grid-cols-1 justify-items-center"
                  )}
                >
                  <TabsTrigger
                    value="data"
                    className={cn(
                      "text-xs w-full",
                      isSidebarCollapsed && "justify-center px-2 py-2"
                    )}
                  >
                    <Upload
                      className={cn(
                        "h-3 w-3",
                        !isSidebarCollapsed && "mr-1",
                        isSidebarCollapsed && "h-4 w-4"
                      )}
                    />
                    <span className={cn(isSidebarCollapsed && "sr-only")}>Data</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="generate"
                    className={cn(
                      "text-xs w-full",
                      isSidebarCollapsed && "justify-center px-2 py-2"
                    )}
                  >
                    <Sparkles
                      className={cn(
                        "h-3 w-3",
                        !isSidebarCollapsed && "mr-1",
                        isSidebarCollapsed && "h-4 w-4"
                      )}
                    />
                    <span className={cn(isSidebarCollapsed && "sr-only")}>Generate</span>
                  </TabsTrigger>
                </TabsList>

                {!isSidebarCollapsed && (
                  <>
                    <TabsContent value="data" className="flex-1 overflow-y-auto p-3">
                      <UploadTabContent
                        metadata={metadata ?? null}
                        isProcessing={isProcessing}
                        isLoadingSamples={isLoadingSamples}
                        samples={sampleDatasets}
                        activeDatasetId={dataset?.id}
                        onFileUpload={handleFileUpload}
                        onClearDataset={handleClearDataset}
                        onLoadSample={handleLoadSampleDataset}
                        planTier={planTier}
                        planLimitMb={planLimitMb}
                        summary={datasetSummary}
                        isSummaryLoading={isSummaryLoading}
                        onRefreshSummary={handleRefreshSummary}
                      />
                    </TabsContent>

                    <TabsContent value="generate" className="flex-1 overflow-y-auto p-3">
                      <VisualizeTabContent
                        datasetId={dataset?.id ?? null}
                        isProcessing={isProcessing}
                        useHeuristics={useHeuristics}
                        hasDataset={Boolean(dataset)}
                        onSubmitPrompt={handlePromptSubmit}
                        onQuickAction={handleGenerateVisualization}
                        onProcessingChange={setIsProcessing}
                        datasetFeedback={datasetFeedback}
                        canSubmitFeedback={canSubmitFeedback}
                        onDatasetVote={handleDatasetVote}
                        onDatasetFavorite={handleDatasetFavorite}
                        leaderboardDatasets={datasetLeaderboard}
                        leaderboardVisualizations={visualizationLeaderboard}
                        leaderboardLoading={leaderboardLoading}
                        onRefreshLeaderboards={refreshLeaderboards}
                        onNavigateToVisualizations={focusVisualizations}
                        onAutoInsightsUpdate={handleAutoInsightsUpdate}
                        onRegisterAutoInsightsRunner={(runner) => {
                          autoInsightsRunnerRef.current = runner ?? null;
                        }}
                        onRegisterRecommendationRunner={(runner) => {
                          recommendationRunnerRef.current = runner ?? null;
                        }}
                      />
                    </TabsContent>
                  </>
                )}
              </Tabs>
            </div>

            {/* Compact metrics panel at bottom */}
            {!isSidebarCollapsed && (
              <div className="p-3 border-t border-border/50 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">AI Calls</span>
                  <span>{providerUsage?.totalCalls || 0}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Tokens</span>
                  <span>{providerUsage?.tokensUsed || 0}</span>
                </div>
                {dataset && (
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Dataset</span>
                    <span>{dataset.rows} rows</span>
                  </div>
                )}
              </div>
            )}
          </aside>
        )}

        {/* Main content */}
        <main className={cn(
          "flex-1 overflow-y-auto",
          currentLayout.showStatusBar && "pb-8"
        )}>
          <div className="container mx-auto p-6">
            <DashboardToolbar
              context={activePanel === 'visualize' ? 'visualize' : 'data'}
              searchValue={toolbarSearch}
              onSearchValueChange={setToolbarSearch}
              onSubmitSearch={async () => {
                try {
                  setSearching(true);
                  setSearchError(null);
                  const filters: any = {};
                  if (toolbarSearch.trim()) filters.search = toolbarSearch.trim();
                  if (toolbarDifficulty) filters.difficulty = toolbarDifficulty;
                  if (toolbarTags.length) filters.tags = toolbarTags;
                  if (activePanel !== 'visualize' && toolbarFileType) filters.contentType = toolbarFileType;
                  // Narrow by type based on context
                  if (activePanel === 'visualize') filters.type = 'note';
                  if (activePanel !== 'visualize') filters.type = 'dataset';

                  const { strands, total } = await openstrandAPI.strands.list(filters);
                  setSearchResults(strands);
                  setSearchTotal(total);

                  // Save recents
                  const signature = JSON.stringify({
                    context: activePanel,
                    query: toolbarSearch.trim(),
                    difficulty: toolbarDifficulty,
                    tags: toolbarTags,
                    fileType: activePanel !== 'visualize' ? toolbarFileType : undefined,
                  });
                  const existing = recentSearches.filter((r) => JSON.stringify(r) !== signature);
                  const next = [
                    {
                      context: (activePanel as 'visualize' | 'data'),
                      query: toolbarSearch.trim(),
                      difficulty: toolbarDifficulty || undefined,
                      tags: toolbarTags.length ? toolbarTags : undefined,
                      fileType: activePanel !== 'visualize' ? (toolbarFileType || undefined) : undefined,
                    },
                    ...existing,
                  ].slice(0, 8);
                  persistRecents(next);
                } catch (error) {
                  setSearchError(error instanceof Error ? error.message : 'Search failed');
                } finally {
                  setSearching(false);
                }
              }}
              tags={toolbarTags}
              onTagsChange={setToolbarTags}
              difficulty={toolbarDifficulty}
              onDifficultyChange={setToolbarDifficulty}
              fileType={toolbarFileType}
              onFileTypeChange={setToolbarFileType}
            />

            <BillingStatusCard />

            {(searching || searchResults) && (
              <Card className="mb-6 border-primary/20 bg-background/90">
                <CardContent className="px-4 py-3">
                  {searching ? (
                    <p className="text-sm text-muted-foreground">Searching…</p>
                  ) : searchError ? (
                    <p className="text-sm text-destructive">{searchError}</p>
                  ) : searchResults && searchResults.length > 0 ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          {searchTotal ?? searchResults.length} result{(searchTotal ?? searchResults.length) === 1 ? '' : 's'} for "{toolbarSearch}"{toolbarDifficulty ? ` · ${toolbarDifficulty}` : ''}{toolbarTags.length ? ` · tags:${toolbarTags.join(',')}` : ''}
                        </span>
                        <Button variant="ghost" size="sm" onClick={() => { setSearchResults(null); setSearchTotal(null); }}>Clear</Button>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {searchResults.map((s) => (
                          <div key={s.id} className="rounded-lg border border-border/60 bg-card/80 p-3 transition-colors hover:border-primary/40">
                            <div className="flex items-center justify-between gap-2">
                              <h4 className="truncate text-sm font-semibold" title={s.title}>{s.title}</h4>
                              {s.difficulty ? (
                                <Badge variant="secondary" className="text-[10px] capitalize">{String(s.difficulty)}</Badge>
                              ) : null}
                            </div>
                            {s.summary ? (
                              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{s.summary}</p>
                            ) : null}
                            {Array.isArray((s as any).metadata?.tags) && (s as any).metadata.tags.length > 0 ? (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {(s as any).metadata.tags.slice(0, 4).map((t: string) => (
                                  <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>
                                ))}
                              </div>
                            ) : null}
                            <div className="mt-3 flex items-center justify-end gap-2">
                              <Button asChild variant="outline" size="xs">
                                <Link href={localizePath(`/composer?strandId=${s.id}`)}>Open</Link>
                              </Button>
                              <Button asChild variant="ghost" size="xs">
                                <Link href={localizePath(`/weave?focus=${s.id}`)}>Open in Graph</Link>
                              </Button>
                              <Button
                                variant="ghost"
                                size="xs"
                                onClick={() => {
                                  const isPinned = pinnedStrands.some((p) => p.id === s.id);
                                  if (isPinned) {
                                    const next = pinnedStrands.filter((p) => p.id !== s.id);
                                    persistPins(next);
                                  } else {
                                    const next = [
                                      { id: s.id, title: s.title, summary: s.summary, difficulty: (s as any).difficulty, tags: (s as any).metadata?.tags },
                                      ...pinnedStrands,
                                    ].slice(0, 12);
                                    persistPins(next);
                                  }
                                }}
                              >
                                {pinnedStrands.some((p) => p.id === s.id) ? 'Unpin' : 'Pin'}
                              </Button>
                              <Button
                                variant="ghost"
                                size="xs"
                                onClick={() => {
                                  navigator.clipboard?.writeText(s.id).catch(() => {});
                                }}
                              >
                                Copy ID
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No results</p>
                  )}
                </CardContent>
              </Card>
            )}

            {pinnedStrands.length > 0 && (
              <Card className="mb-6 border-border/60">
                <CardContent className="px-4 py-3">
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-sm font-semibold">Pinned Strands</h3>
                    <Button variant="ghost" size="sm" onClick={() => persistPins([])}>Clear all</Button>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {pinnedStrands.map((p) => (
                      <div key={p.id} className="rounded-lg border border-border/60 bg-card/80 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="truncate text-sm font-semibold" title={p.title}>{p.title}</h4>
                          {p.difficulty ? (
                            <Badge variant="secondary" className="text-[10px] capitalize">{String(p.difficulty)}</Badge>
                          ) : null}
                        </div>
                        {p.summary ? (
                          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{p.summary}</p>
                        ) : null}
                        <div className="mt-3 flex items-center justify-end gap-2">
                          <Button asChild variant="outline" size="xs">
                            <Link href={localizePath(`/composer?strandId=${p.id}`)}>Open</Link>
                          </Button>
                          <Button variant="ghost" size="xs" onClick={() => persistPins(pinnedStrands.filter((x) => x.id !== p.id))}>Unpin</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {recentSearches.length > 0 && (
              <Card className="mb-6 border-border/60">
                <CardContent className="px-4 py-3">
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-sm font-semibold">Recent searches</h3>
                    <Button variant="ghost" size="sm" onClick={() => persistRecents([])}>Clear</Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((r, idx) => (
                      <Button
                        key={`${r.context}-${idx}-${r.query}`}
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setToolbarSearch(r.query);
                          setToolbarDifficulty(r.difficulty || '');
                          setToolbarTags(r.tags || []);
                          if (r.context !== 'visualize') setToolbarFileType(r.fileType || '');
                        }}
                      >
                        {r.query || '(empty)'}{r.difficulty ? ` · ${r.difficulty}` : ''}{r.tags?.length ? ` · ${r.tags.length} tag${r.tags.length > 1 ? 's' : ''}` : ''}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            <div className="mb-4 flex items-center justify-end">
              <Button variant="ghost" size="sm" onClick={() => setShortcutsOpen(true)}>Shortcuts</Button>
            </div>
            {/* Layout preset selector */}
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant={currentLayout.preset === 'focused' ? 'default' : 'outline'}
                  onClick={() => applyPreset('focused')}
                >
                  Focused
                </Button>
                <Button
                  size="sm"
                  variant={currentLayout.preset === 'balanced' ? 'default' : 'outline'}
                  onClick={() => applyPreset('balanced')}
                >
                  Balanced
                </Button>
                <Button
                  size="sm"
                  variant={currentLayout.preset === 'overview' ? 'default' : 'outline'}
                  onClick={() => applyPreset('overview')}
                >
                  Overview
                </Button>
                <Button
                  size="sm"
                  variant={currentLayout.preset === 'zen' ? 'default' : 'outline'}
                  onClick={() => applyPreset('zen')}
                >
                  Zen
                </Button>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <TourControlPanel />
                <div className="h-4 w-px bg-border" />
                <span>Columns: {currentLayout.gridColumns}</span>
                <Button size="sm" variant="ghost" onClick={cycleGridColumns}>
                  Change
                </Button>
              </div>
            </div>

            {(dataset || datasetSummary || autoInsightsSnapshot.insights) && (
              <DatasetInspectorPanel
                datasetName={
                  metadata?.filename ??
                  metadata?.datasetId ??
                  datasetSummary?.datasetId ??
                  null
                }
                datasetId={dataset?.id ?? metadata?.datasetId ?? datasetSummary?.datasetId ?? null}
                metadata={metadata ?? null}
                summary={datasetSummary}
                isSummaryLoading={isSummaryLoading}
                autoInsights={autoInsightsSnapshot}
                onRefreshSummary={handleRefreshSummary}
                onRunAutoInsights={runAutoInsights}
                onViewRecommendations={focusVisualizations}
                hasDataset={Boolean(dataset)}
              />
            )}

            {/* Visualizations Grid or Empty State */}
            {visualizations.length > 0 ? (
              <MasonryGrid
                items={masonryItems}
                columns={currentLayout.gridColumns}
                onReorder={(items) => console.log('Reordered', items)}
                onRemove={handleRemoveVisualization}
                onEdit={(id) => console.log('Edit', id)}
                onMaximize={(id) => console.log('Maximize', id)}
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-20">
                {!dataset ? (
                  <>
                    <EmptyDatasetIllustration className="mb-8" />
                    <h3 className="text-xl font-semibold mb-2">No Dataset Loaded</h3>
                    <p className="text-muted-foreground mb-6 max-w-md text-center">
                      Upload a dataset to start creating visualizations and exploring your data
                    </p>
                    <Button onClick={() => setActivePanel('upload')}>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Dataset
                    </Button>
                  </>
                ) : (
                  <>
                    <NoVisualizationsIllustration className="mb-8" />
                    <h3 className="text-xl font-semibold mb-2">Ready to Visualize</h3>
                    <p className="text-muted-foreground mb-6 max-w-md text-center">
                      Your dataset is loaded. Create your first visualization to explore the data
                    </p>
                    <Button onClick={() => setActivePanel('visualize')}>
                      <LineChart className="mr-2 h-4 w-4" />
                      Create Visualization
                    </Button>
                  </>
                )}
              </div>
            )}

            {/* Collapsible insight panels (if in overview mode) */}
            {currentLayout.preset === 'overview' && (
              <div className="mt-8 grid gap-4 lg:grid-cols-3">
                <CollapsiblePanel
                  title="AI Usage"
                  defaultCollapsed={currentLayout.panelsCollapsed.insights}
                  preview={`${providerUsage?.totalCalls || 0} API calls`}
                >
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Total Calls:</span>
                      <span>{providerUsage?.totalCalls || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tokens Used:</span>
                      <span>{providerUsage?.tokensUsed || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cost:</span>
                      <span>${providerUsage?.totalCost || 0}</span>
                    </div>
                  </div>
                </CollapsiblePanel>

                <CollapsiblePanel
                  title="Feedback"
                  icon={<MessageSquare className="h-4 w-4" />}
                  defaultCollapsed={currentLayout.panelsCollapsed.feedback}
                  preview={`${feedbackOverview?.total || 0} responses`}
                >
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Positive:</span>
                      <span>{feedbackOverview?.positive || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Negative:</span>
                      <span>{feedbackOverview?.negative || 0}</span>
                    </div>
                  </div>
                </CollapsiblePanel>

                <CollapsiblePanel
                  title="Community"
                  icon={<Users className="h-4 w-4" />}
                  defaultCollapsed={currentLayout.panelsCollapsed.community}
                  preview="Connect with others"
                >
                  <KnowledgeGraphIllustration className="mx-auto" />
                </CollapsiblePanel>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Floating Action Toolbar (if enabled) */}
      {currentLayout.showActionBar && (
        <FloatingActionToolbar
          actions={fabActions}
          position="top-right"
          style="radial"
        />
      )}

      {/* Status Bar (if enabled) */}
      {currentLayout.showStatusBar && (
        <StatusBar
          dataset={dataset ? {
            name: dataset.name || 'Dataset',
            rows: dataset.rows || 0,
            columns: dataset.columns || 0,
            size: dataset.size || '0 MB'
          } : undefined}
          visualizations={visualizations.length}
          user={{
            name: isGuest ? 'Guest' : 'User',
            plan: planTier
          }}
          connection="online"
          lastSync={new Date()}
        />
      )}

      {showSettings && <SettingsDialog isOpen={showSettings} onClose={closeSettings} />}

      <DashboardShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} />

      <CommandPalette
        open={isPaletteOpen}
        onClose={() => setIsPaletteOpen(false)}
        actions={commandActions}
      />
    </div>
  );
}
