'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Upload,
  LineChart,
  Sparkles,
  Command,
  ChevronLeft,
  ChevronRight,
  Database,
  BarChart3,
  Layers,
  Plus,
  Trash2,
  Settings,
  Info,
  Zap,
  Activity,
  TrendingUp,
} from 'lucide-react';

import { CommandPalette, type CommandAction } from '@/components/command-palette';
import { GuidedTour } from '@/components/guided-tour';
import { SettingsDialog } from '@/components/settings-dialog';
import { UnifiedHeader } from '@/components/navigation/UnifiedHeader';
import { LocalOnboarding } from '@/components/onboarding/LocalOnboarding';
import { TeamOnboarding } from '@/components/onboarding/TeamOnboarding';
import {
  UploadTabContent,
  VisualizeTabContent,
  DatasetInspectorPanel,
} from '@/features/dashboard';

import { VisualizationWorkspace } from './VisualizationWorkspace';
import { useDashboardShortcuts } from './useDashboardShortcuts';
import { useDashboardController } from './useDashboardController';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useFeatureFlags } from '@/lib/feature-flags';
import { useAppMode } from '@/hooks/useAppMode';
import { useOpenStrandStore } from '@/store/openstrand.store';
import { useTranslations } from 'next-intl';

export default function DashboardPage() {
  const {
    dataset,
    metadata,
    planTier,
    planLimitMb,
    visualizations,
    autoInsightsSnapshot,
    isGuest,
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
  const t = useTranslations('dashboard');

  const [activeTab, setActiveTab] = useState<'upload' | 'visualize'>('upload');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const shouldShowLocalOnboarding = environmentMode === 'offline';
  const shouldShowTeamOnboarding =
    isTeamEdition && environmentMode === 'cloud' && !teamOnboardingComplete;

  const commandActions = useMemo<CommandAction[]>(
    () => [
      {
        id: 'upload',
        label: t('actions.uploadDataset'),
        hint: 'Switch to the Data tab',
        shortcut: 'Shift+U',
        onSelect: () => setActiveTab('upload'),
      },
      {
        id: 'auto-insights',
        label: t('actions.runAutoInsights'),
        hint: 'Analyze the active dataset',
        shortcut: 'Shift+A',
        onSelect: runAutoInsights,
      },
      {
        id: 'new-visualization',
        label: t('actions.newVisualization'),
        hint: 'Jump to the Visualize tab',
        shortcut: 'Shift+V',
        onSelect: () => setActiveTab('visualize'),
      },
      {
        id: 'clear-visualizations',
        label: t('actions.clearVisualizations'),
        shortcut: 'Shift+C',
        onSelect: handleClearAllVisualizations,
      },
      {
        id: 'open-settings',
        label: t('actions.openSettings'),
        shortcut: 'Shift+S',
        onSelect: openSettings,
      },
    ],
    [t, runAutoInsights, handleClearAllVisualizations, openSettings]
  );

  useDashboardShortcuts({
    onToggleCommandPalette: () => setIsPaletteOpen((prev) => !prev),
    onOpenUpload: () => setActiveTab('upload'),
    onRunAutoInsights: runAutoInsights,
    onOpenVisualize: () => setActiveTab('visualize'),
    onClearVisualizations: handleClearAllVisualizations,
    onOpenSettings: openSettings,
  });

  return (
    <TooltipProvider>
      <div className="min-h-screen flex flex-col bg-background">
        <GuidedTour />
        {shouldShowLocalOnboarding && <LocalOnboarding onOpenSettings={openSettings} />}
        {shouldShowTeamOnboarding && <TeamOnboarding onOpenSettings={openSettings} />}
        <UnifiedHeader onOpenSettings={openSettings} />

        {/* Main Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar */}
          <aside
            className={cn(
              "flex flex-col border-r border-border/50 bg-card/50 transition-all duration-300",
              sidebarCollapsed ? "w-16" : "w-80 lg:w-96"
            )}
          >
            {/* Sidebar Header */}
            <div className="flex items-center justify-between p-3 border-b border-border/50">
              {!sidebarCollapsed && (
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Workspace
                </span>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                    className="h-8 w-8 rounded-lg"
                  >
                    {sidebarCollapsed ? (
                      <ChevronRight className="h-4 w-4" />
                    ) : (
                      <ChevronLeft className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  {sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Sidebar Content */}
            {!sidebarCollapsed ? (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Tabs */}
                <Tabs
                  value={activeTab}
                  onValueChange={(v) => setActiveTab(v as 'upload' | 'visualize')}
                  className="flex-1 flex flex-col"
                >
                  <TabsList className="mx-3 mt-3 grid grid-cols-2">
                    <TabsTrigger value="upload" className="text-xs">
                      <Upload className="mr-1.5 h-3.5 w-3.5" />
                      Data
                    </TabsTrigger>
                    <TabsTrigger value="visualize" className="text-xs">
                      <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                      Create
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="upload" className="flex-1 overflow-y-auto p-3 mt-0">
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

                  <TabsContent value="visualize" className="flex-1 overflow-y-auto p-3 mt-0">
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
                </Tabs>

                {/* Sidebar Footer - Stats */}
                <div className="border-t border-border/50 p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Activity className="h-3 w-3" />
                      AI Calls
                    </span>
                    <span className="font-medium">{providerUsage?.totalRequests || 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Zap className="h-3 w-3" />
                      Tokens
                    </span>
                    <span className="font-medium">{(providerUsage?.totalTokens || 0).toLocaleString()}</span>
                  </div>
                  {dataset && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <Database className="h-3 w-3" />
                        Dataset
                      </span>
                      <span className="font-medium">{(metadata?.rowCount || 0).toLocaleString()} rows</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Collapsed Sidebar Icons */
              <div className="flex-1 flex flex-col items-center py-3 gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={activeTab === 'upload' ? 'secondary' : 'ghost'}
                      size="icon"
                      onClick={() => {
                        setSidebarCollapsed(false);
                        setActiveTab('upload');
                      }}
                      className="h-10 w-10"
                    >
                      <Upload className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">Data & Upload</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={activeTab === 'visualize' ? 'secondary' : 'ghost'}
                      size="icon"
                      onClick={() => {
                        setSidebarCollapsed(false);
                        setActiveTab('visualize');
                      }}
                      className="h-10 w-10"
                    >
                      <Sparkles className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">Create Visualizations</TooltipContent>
                </Tooltip>
                <div className="flex-1" />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={openSettings}
                      className="h-10 w-10"
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">Settings</TooltipContent>
                </Tooltip>
              </div>
            )}
          </aside>

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto">
            <div className="container max-w-7xl mx-auto p-6">
              {/* Quick Actions Bar */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  {dataset ? (
                    <>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Database className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h1 className="text-lg font-semibold">{metadata?.filename || 'Dataset'}</h1>
                          <p className="text-sm text-muted-foreground">
                            {(metadata?.rowCount || 0).toLocaleString()} rows · {metadata?.columns?.length || 0} columns
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="ml-2">
                        {planTier}
                      </Badge>
                    </>
                  ) : (
                    <h1 className="text-lg font-semibold">Dashboard</h1>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsPaletteOpen(true)}
                      >
                        <Command className="mr-2 h-4 w-4" />
                        <span className="hidden sm:inline">Commands</span>
                        <kbd className="ml-2 hidden sm:inline text-xs bg-muted px-1.5 py-0.5 rounded">⌘K</kbd>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Open command palette (⌘K)</TooltipContent>
                  </Tooltip>

                  {dataset && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={runAutoInsights}
                        disabled={isProcessing}
                      >
                        <Sparkles className="mr-2 h-4 w-4" />
                        <span className="hidden sm:inline">Auto Insights</span>
                      </Button>
                      {visualizations.length > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleClearAllVisualizations}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          <span className="hidden sm:inline">Clear</span>
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Dataset Inspector (when dataset loaded) */}
              {dataset && (
                <DatasetInspectorPanel
                  datasetName={metadata?.filename ?? null}
                  datasetId={dataset.id}
                  metadata={metadata ?? null}
                  summary={datasetSummary}
                  isSummaryLoading={isSummaryLoading}
                  autoInsights={autoInsightsSnapshot}
                  onRefreshSummary={handleRefreshSummary}
                  onRunAutoInsights={runAutoInsights}
                  onViewRecommendations={focusVisualizations}
                  hasDataset={true}
                />
              )}

              {/* Visualizations Area */}
              {visualizations.length > 0 ? (
                <VisualizationWorkspace
                  ref={visualizationPanelRef as any}
                  visualizations={visualizations}
                  onClearAll={handleClearAllVisualizations}
                  onExport={handleExportVisualization}
                  onRemove={handleRemoveVisualization}
                  onModify={(_id, prompt) => handleGenerateVisualization(prompt)}
                  isProcessing={isProcessing}
                  feedbackMap={visualizationFeedback}
                  canSubmitFeedback={canSubmitFeedback}
                  onVote={handleVisualizationVote}
                  onFavoriteToggle={(id, fav) => handleVisualizationFavorite(id, fav)}
                  highlightNew={highlightVisualizations}
                  autoInsights={autoInsightsSnapshot.recommendations}
                  autoInsightsLoading={autoInsightsSnapshot.isLoading}
                  autoInsightsError={autoInsightsSnapshot.error}
                  autoInsightsStatus={autoInsightsSnapshot.status}
                  onRunRecommendation={handleRunRecommendation}
                  savedVisualizationIds={savedVisualizationIds}
                  usedRecommendationKeys={usedRecommendationKeys}
                />
              ) : (
                /* Empty State */
                <Card className="mt-6 p-12 text-center">
                  {!dataset ? (
                    <div className="max-w-md mx-auto">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6">
                        <Layers className="h-8 w-8 text-primary" />
                      </div>
                      <h2 className="text-xl font-semibold mb-2">No Dataset Loaded</h2>
                      <p className="text-muted-foreground mb-6">
                        Upload a CSV, JSON, or Excel file to start creating visualizations with AI assistance.
                      </p>
                      <div className="flex items-center justify-center gap-3">
                        <Button onClick={() => setActiveTab('upload')}>
                          <Upload className="mr-2 h-4 w-4" />
                          Upload Dataset
                        </Button>
                        <Button variant="outline" onClick={() => setIsPaletteOpen(true)}>
                          <Command className="mr-2 h-4 w-4" />
                          Quick Actions
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="max-w-md mx-auto">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/10 mb-6">
                        <BarChart3 className="h-8 w-8 text-emerald-500" />
                      </div>
                      <h2 className="text-xl font-semibold mb-2">Ready to Visualize</h2>
                      <p className="text-muted-foreground mb-6">
                        Your dataset is loaded. Create visualizations using natural language or run Auto Insights for AI-recommended charts.
                      </p>
                      <div className="flex items-center justify-center gap-3">
                        <Button onClick={runAutoInsights} disabled={isProcessing}>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Auto Insights
                        </Button>
                        <Button variant="outline" onClick={() => setActiveTab('visualize')}>
                          <Plus className="mr-2 h-4 w-4" />
                          Create Manually
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              )}
            </div>
          </main>
        </div>

        {showSettings && <SettingsDialog isOpen={showSettings} onClose={closeSettings} />}

        <CommandPalette
          open={isPaletteOpen}
          onClose={() => setIsPaletteOpen(false)}
          actions={commandActions}
        />
      </div>
    </TooltipProvider>
  );
}
