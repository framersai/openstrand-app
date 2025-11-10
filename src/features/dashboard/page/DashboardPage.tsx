'use client';

import { useMemo, useState } from 'react';
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
  ChevronUp,
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
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useKeyboardNavigation, defaultKeyboardBindings } from '@/hooks/useKeyboardNavigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useFeatureFlags } from '@/lib/feature-flags';
import { useAppMode } from '@/hooks/useAppMode';
import { useOpenStrandStore } from '@/store/openstrand.store';
import { useTranslations } from 'next-intl';
import { Footer } from '@/components/footer/Footer';

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
  const [footerCollapsed, setFooterCollapsed] = useState(true); // Start collapsed in dashboard
  const t = useTranslations('dashboard');

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
  
  const { 
    config: deviceConfig, 
    device, 
    orientation,
    getResponsiveLayout,
    utils 
  } = useResponsiveLayout();
  
  const responsiveLayout = getResponsiveLayout(currentLayout.gridColumns);

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
    () => [
      {
        id: 'upload',
        label: t('actions.uploadDataset'),
        hint: 'Switch to the Data tab',
        shortcut: 'Shift+U',
        onSelect: openUpload,
      },
      {
        id: 'auto-insights',
        label: t('actions.runAutoInsights'),
        hint: 'Analyse the active dataset',
        shortcut: 'Shift+A',
        onSelect: runAutoInsights,
      },
      {
        id: 'new-visualization',
        label: t('actions.newVisualization'),
        hint: 'Jump to the Visualize tab',
        shortcut: 'Shift+V',
        onSelect: openVisualize,
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
    [openUpload, runAutoInsights, openVisualize, handleClearAllVisualizations, openSettings, t]
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
    <div className="dashboard-page min-h-screen flex flex-col bg-background">
      <GuidedTour />
      {shouldShowLocalOnboarding && <LocalOnboarding onOpenSettings={openSettings} />}
      {shouldShowTeamOnboarding && <TeamOnboarding onOpenSettings={openSettings} />}
      <UnifiedHeader onOpenSettings={openSettings} />

      {/* Main content area */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Sidebar - Fully responsive with device-aware behavior */}
        {currentLayout.showSidebar && (
          <aside 
            className={cn(
              "dashboard-sidebar border-border/50 bg-background/95 backdrop-blur overflow-hidden flex flex-col transition-all duration-300",
              // Responsive behavior
              device.isPhone && "w-full h-64 border-b",
              device.isTablet && orientation.isPortrait && "w-full h-72 border-b",
              device.isTablet && orientation.isLandscape && "w-80 h-full border-r",
              device.isLaptop && "w-80 h-full border-r",
              device.isDesktop && "w-96 h-full border-r",
              device.isUltrawide && "w-[28rem] h-full border-r",
              // Collapsed state
              isSidebarCollapsed && !device.isPhone && !(device.isTablet && orientation.isPortrait) && "!w-20",
              // Position
              currentLayout.sidebarPosition === 'right' && !device.isPhone && !(device.isTablet && orientation.isPortrait) && 'order-2 border-l border-r-0',
              // Overlay behavior on smaller screens
              responsiveLayout.sidebarBehavior === 'overlay' && device.isTablet && orientation.isLandscape && "fixed z-40",
              responsiveLayout.sidebarBehavior === 'overlay' && currentLayout.sidebarPosition === 'right' && "right-0",
              responsiveLayout.sidebarBehavior === 'overlay' && currentLayout.sidebarPosition === 'left' && "left-0"
            )}
            style={{
              width: responsiveLayout.sidebarBehavior === 'overlay' && !device.isPhone ? responsiveLayout.sidebarWidth : undefined
            }}>
            <div className="flex items-center justify-between border-b border-border/40 px-3 py-2">
              <span
                className={cn(
                  "text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground",
                  isSidebarCollapsed && "sr-only"
                )}
              >
                {t('sidebar.workspace')}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSidebarCollapsed((prev) => !prev)}
                className={cn(
                  "h-7 w-7 rounded-full border border-border/50 bg-background/70 text-muted-foreground hover:border-primary/40 hover:text-primary",
                  "hidden lg:flex" // Only show on desktop
                )}
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
                    <span className={cn(isSidebarCollapsed && "sr-only")}>{t('tabs.upload')}</span>
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
                    <span className={cn(isSidebarCollapsed && "sr-only")}>{t('tabs.visualize')}</span>
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

        {/* Main content - Responsive padding and spacing */}
        <main className={cn(
          "flex-1 overflow-y-auto",
          currentLayout.showStatusBar && "pb-8",
          // Add padding for overlay sidebar
          responsiveLayout.sidebarBehavior === 'overlay' && currentLayout.showSidebar && !isSidebarCollapsed && 
            currentLayout.sidebarPosition === 'left' && device.isTablet && "ml-80"
        )}>
          <div 
            className="container mx-auto"
            style={{ 
              padding: utils.containerPadding(),
              maxWidth: device.isUltrawide ? '2400px' : undefined
            }}>
            {/* Layout preset selector - responsive */}
            <div className="mb-6 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  variant={currentLayout.preset === 'focused' ? 'default' : 'outline'}
                  onClick={() => applyPreset('focused')}
                  className="text-xs sm:text-sm"
                >
                  Focused
                </Button>
                <Button
                  size="sm"
                  variant={currentLayout.preset === 'balanced' ? 'default' : 'outline'}
                  onClick={() => applyPreset('balanced')}
                  className="text-xs sm:text-sm"
                >
                  Balanced
                </Button>
                <Button
                  size="sm"
                  variant={currentLayout.preset === 'overview' ? 'default' : 'outline'}
                  onClick={() => applyPreset('overview')}
                  className="text-xs sm:text-sm"
                >
                  {t('sidebar.overview')}
                </Button>
                <Button
                  size="sm"
                  variant={currentLayout.preset === 'zen' ? 'default' : 'outline'}
                  onClick={() => applyPreset('zen')}
                  className="text-xs sm:text-sm"
                >
                  Zen
                </Button>
              </div>

              <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                <TourControlPanel />
                <div className="hidden sm:block h-4 w-px bg-border" />
                <span className="hidden sm:inline">Columns: {currentLayout.gridColumns}</span>
                <Button size="sm" variant="ghost" onClick={cycleGridColumns} className="text-xs sm:text-sm">
                  <span className="sm:hidden">Cols</span>
                  <span className="hidden sm:inline">Change</span>
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
                columns={responsiveLayout.gridColumns}
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
                  title={t('sidebar.feedback')}
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

      <CommandPalette
        open={isPaletteOpen}
        onClose={() => setIsPaletteOpen(false)}
        actions={commandActions}
      />
      
      {/* Collapsible Footer */}
      <div className={cn(
        "relative transition-all duration-300 ease-out border-t border-border/50",
        footerCollapsed ? "h-12" : "h-auto"
      )}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setFooterCollapsed(!footerCollapsed)}
          className={cn(
            "absolute -top-10 left-1/2 -translate-x-1/2 z-10",
            "flex items-center gap-2 rounded-full px-3 py-1",
            "bg-background/80 backdrop-blur-sm border border-border/50",
            "hover:bg-background/90 hover:border-border",
            "transition-all duration-300"
          )}
        >
          <span className="text-xs text-muted-foreground">
            {footerCollapsed ? 'Show' : 'Hide'} Footer
          </span>
          <ChevronUp 
            className={cn(
              "h-3 w-3 transition-transform duration-300",
              footerCollapsed ? "rotate-180" : ""
            )}
          />
        </Button>
        
        <div className={cn(
          "overflow-hidden transition-all duration-300 ease-out",
          footerCollapsed ? "opacity-0 invisible h-0" : "opacity-100 visible"
        )}>
          <Footer />
        </div>
        
        {footerCollapsed && (
          <div className="h-12 bg-background/50 backdrop-blur-sm flex items-center justify-center">
            <p className="text-xs text-muted-foreground">
              © 2024 OpenStrand. All rights reserved.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
