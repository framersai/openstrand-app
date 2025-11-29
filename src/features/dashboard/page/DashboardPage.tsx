'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Upload,
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
  Loader2,
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
} from '@/features/dashboard';

import { VisualizationWorkspace } from './VisualizationWorkspace';
import { useDashboardShortcuts } from './useDashboardShortcuts';
import { useDashboardController } from './useDashboardController';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
              "flex flex-col border-r border-border/40 bg-card/30 transition-all duration-300",
              sidebarCollapsed ? "w-16" : "w-80 lg:w-[360px]"
            )}
            role="complementary"
            aria-label="Workspace sidebar"
          >
            {/* Sidebar Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
              {!sidebarCollapsed && (
                <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Workspace
                </h2>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                    className="h-8 w-8 rounded-lg hover:bg-accent"
                    aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    aria-expanded={!sidebarCollapsed}
                  >
                    {sidebarCollapsed ? (
                      <ChevronRight className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <ChevronLeft className="h-4 w-4" aria-hidden="true" />
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
                  <TabsList className="mx-4 mt-4 grid grid-cols-2 h-10">
                    <TabsTrigger 
                      value="upload" 
                      className="text-sm font-medium data-[state=active]:bg-background"
                    >
                      <Upload className="mr-2 h-4 w-4" aria-hidden="true" />
                      Data
                    </TabsTrigger>
                    <TabsTrigger 
                      value="visualize" 
                      className="text-sm font-medium data-[state=active]:bg-background"
                    >
                      <Sparkles className="mr-2 h-4 w-4" aria-hidden="true" />
                      Create
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent 
                    value="upload" 
                    className="flex-1 overflow-y-auto p-4 mt-0 focus-visible:outline-none"
                    tabIndex={-1}
                  >
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

                  <TabsContent 
                    value="visualize" 
                    className="flex-1 overflow-y-auto p-4 mt-0 data-[state=inactive]:hidden focus-visible:outline-none" 
                    forceMount
                    tabIndex={-1}
                  >
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
              </div>
            ) : (
              /* Collapsed Sidebar Icons */
              <nav 
                className="flex-1 flex flex-col items-center py-4 gap-2"
                aria-label="Sidebar navigation"
              >
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
                      aria-label="Data & Upload"
                      aria-current={activeTab === 'upload' ? 'page' : undefined}
                    >
                      <Upload className="h-4 w-4" aria-hidden="true" />
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
                      aria-label="Create Visualizations"
                      aria-current={activeTab === 'visualize' ? 'page' : undefined}
                    >
                      <Sparkles className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">Create Visualizations</TooltipContent>
                </Tooltip>
                <div className="flex-1" aria-hidden="true" />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={openSettings}
                      className="h-10 w-10"
                      aria-label="Open settings"
                    >
                      <Settings className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">Settings</TooltipContent>
                </Tooltip>
              </nav>
            )}
          </aside>

          {/* Main Content */}
          <main 
            className="flex-1 overflow-y-auto bg-muted/20"
            role="main"
            aria-label="Visualization workspace"
          >
            <div className="max-w-6xl mx-auto p-6 lg:p-8">
              {/* Header Bar */}
              <header className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  {dataset ? (
                    <div className="flex items-center gap-4">
                      <div 
                        className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center"
                        aria-hidden="true"
                      >
                        <Database className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h1 className="text-xl font-semibold text-foreground">
                          {metadata?.filename || 'Dataset'}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                          {(metadata?.rowCount || 0).toLocaleString()} rows · {metadata?.columns?.length || 0} columns
                        </p>
                      </div>
                    </div>
                  ) : (
                    <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
                  )}
                </div>

                <div className="flex items-center gap-3" role="toolbar" aria-label="Quick actions">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsPaletteOpen(true)}
                        className="h-9"
                      >
                        <Command className="mr-2 h-4 w-4" aria-hidden="true" />
                        <span className="hidden sm:inline">Commands</span>
                        <kbd className="ml-2 hidden sm:inline text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
                          ⌘K
                        </kbd>
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
                        className="h-9"
                        aria-busy={autoInsightsSnapshot.isLoading}
                      >
                        {autoInsightsSnapshot.isLoading ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                        ) : (
                          <Sparkles className="mr-2 h-4 w-4" aria-hidden="true" />
                        )}
                        <span className="hidden sm:inline">
                          {autoInsightsSnapshot.isLoading ? 'Analyzing...' : 'Auto Insights'}
                        </span>
                      </Button>
                      {visualizations.length > 0 && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleClearAllVisualizations}
                              className="h-9 text-muted-foreground hover:text-destructive"
                              aria-label="Clear all visualizations"
                            >
                              <Trash2 className="h-4 w-4" aria-hidden="true" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Clear all visualizations</TooltipContent>
                        </Tooltip>
                      )}
                    </>
                  )}
                </div>
              </header>

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
                <Card 
                  className="p-12 lg:p-16 text-center border-dashed bg-card/50"
                  role="region"
                  aria-label={dataset ? "Ready to create visualizations" : "No dataset loaded"}
                >
                  {!dataset ? (
                    <div className="max-w-md mx-auto">
                      <div 
                        className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 mb-6"
                        aria-hidden="true"
                      >
                        <Layers className="h-10 w-10 text-primary" />
                      </div>
                      <h2 className="text-2xl font-semibold mb-3 text-foreground">
                        No Dataset Loaded
                      </h2>
                      <p className="text-muted-foreground mb-8 text-base leading-relaxed">
                        Upload a CSV, JSON, or Excel file to start creating visualizations with AI assistance.
                      </p>
                      <div className="flex items-center justify-center gap-4">
                        <Button 
                          onClick={() => setActiveTab('upload')} 
                          size="lg"
                          className="h-11 px-6"
                        >
                          <Upload className="mr-2 h-4 w-4" aria-hidden="true" />
                          Upload Dataset
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => setIsPaletteOpen(true)}
                          size="lg"
                          className="h-11 px-6"
                        >
                          <Command className="mr-2 h-4 w-4" aria-hidden="true" />
                          Quick Actions
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="max-w-md mx-auto">
                      <div 
                        className={cn(
                          "inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6",
                          "bg-gradient-to-br from-emerald-500/20 to-emerald-500/5",
                          autoInsightsSnapshot.isLoading && "animate-pulse"
                        )}
                        aria-hidden="true"
                      >
                        <BarChart3 className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <h2 className="text-2xl font-semibold mb-3 text-foreground">
                        Ready to Visualize
                      </h2>
                      <p className="text-muted-foreground mb-8 text-base leading-relaxed">
                        Your dataset is loaded. Create visualizations using natural language or run Auto Insights for AI-recommended charts.
                      </p>
                      <div className="flex items-center justify-center gap-4">
                        <Button 
                          onClick={runAutoInsights} 
                          disabled={isProcessing}
                          size="lg"
                          className={cn(
                            "h-11 px-6",
                            autoInsightsSnapshot.isLoading && "animate-pulse"
                          )}
                          aria-busy={autoInsightsSnapshot.isLoading}
                        >
                          {autoInsightsSnapshot.isLoading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                          ) : (
                            <Sparkles className="mr-2 h-4 w-4" aria-hidden="true" />
                          )}
                          {autoInsightsSnapshot.isLoading ? 'Analyzing...' : 'Auto Insights'}
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => setActiveTab('visualize')}
                          size="lg"
                          className="h-11 px-6 bg-transparent text-foreground hover:bg-accent"
                        >
                          <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
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
