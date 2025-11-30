'use client';

/**
 * Dashboard Page - Visualization-First Design
 * Professional, responsive, and intuitive layout
 */

import { useEffect, useMemo, useState } from 'react';
import {
  Upload,
  Sparkles,
  Command,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Database,
  BarChart3,
  Layers,
  Plus,
  Trash2,
  Settings,
  Loader2,
  PanelLeftClose,
  PanelLeft,
  Zap,
  RefreshCw,
  Menu,
  X,
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
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
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
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [datasetInfoExpanded, setDatasetInfoExpanded] = useState(true);

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

  // Sidebar content - memoized to prevent unnecessary re-renders
  const sidebarContent = useMemo(() => (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => {
          setActiveTab(v as 'upload' | 'visualize');
          setMobileSheetOpen(false);
        }}
        className="flex-1 flex flex-col"
      >
        <TabsList className="mx-3 mt-3 grid grid-cols-2 h-9 bg-muted/50">
          <TabsTrigger 
            value="upload" 
            className="text-xs font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm"
            data-tour-id="upload-tab"
          >
            <Database className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
            Data
          </TabsTrigger>
          <TabsTrigger 
            value="visualize" 
            className="text-xs font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm"
            data-tour-id="visualize-tab"
          >
            <Sparkles className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
            Create
          </TabsTrigger>
        </TabsList>

        <TabsContent 
          value="upload" 
          className="flex-1 overflow-y-auto p-3 mt-0 focus-visible:outline-none"
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
          className="flex-1 overflow-y-auto p-3 mt-0 focus-visible:outline-none data-[state=inactive]:hidden" 
          tabIndex={-1}
          forceMount
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
  ), [
    activeTab,
    metadata,
    isProcessing,
    isLoadingSamples,
    sampleDatasets,
    dataset?.id,
    handleFileUpload,
    handleClearDataset,
    handleLoadSampleDataset,
    planTier,
    planLimitMb,
    datasetSummary,
    isSummaryLoading,
    handleRefreshSummary,
    useHeuristics,
    handlePromptSubmit,
    handleGenerateVisualization,
    datasetFeedback,
    canSubmitFeedback,
    handleDatasetVote,
    handleDatasetFavorite,
    datasetLeaderboard,
    visualizationLeaderboard,
    leaderboardLoading,
    refreshLeaderboards,
    focusVisualizations,
    handleAutoInsightsUpdate,
  ]);

  return (
    <TooltipProvider>
      <div className="min-h-screen min-h-[100dvh] flex flex-col bg-background">
        <GuidedTour />
        {shouldShowLocalOnboarding && <LocalOnboarding onOpenSettings={openSettings} />}
        {shouldShowTeamOnboarding && <TeamOnboarding onOpenSettings={openSettings} />}
        <UnifiedHeader onOpenSettings={openSettings} />

        {/* Main Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Desktop Sidebar - Hidden on mobile */}
          <aside
            className={cn(
              "hidden md:flex flex-col border-r border-border/40 bg-card/50 transition-all duration-300",
              sidebarCollapsed ? "w-14" : "w-72 lg:w-80 xl:w-[340px]"
            )}
            role="complementary"
            aria-label="Workspace sidebar"
          >
            {/* Sidebar Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-border/40">
              {!sidebarCollapsed && (
                <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Workspace
                </span>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                    className="h-7 w-7 rounded-md hover:bg-accent ml-auto"
                    aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                  >
                    {sidebarCollapsed ? (
                      <PanelLeft className="h-3.5 w-3.5" aria-hidden="true" />
                    ) : (
                      <PanelLeftClose className="h-3.5 w-3.5" aria-hidden="true" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" className="text-xs">
                  {sidebarCollapsed ? 'Expand' : 'Collapse'}
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Sidebar Content */}
            {!sidebarCollapsed ? (
              sidebarContent
            ) : (
              /* Collapsed Sidebar Icons */
              <nav className="flex-1 flex flex-col items-center py-3 gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={activeTab === 'upload' ? 'secondary' : 'ghost'}
                      size="icon"
                      onClick={() => {
                        setSidebarCollapsed(false);
                        setActiveTab('upload');
                      }}
                      className="h-9 w-9"
                    >
                      <Database className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="text-xs">Data</TooltipContent>
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
                      className="h-9 w-9"
                    >
                      <Sparkles className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="text-xs">Create</TooltipContent>
                </Tooltip>
                <div className="flex-1" />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={openSettings}
                      className="h-9 w-9"
                    >
                      <Settings className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="text-xs">Settings</TooltipContent>
                </Tooltip>
              </nav>
            )}
          </aside>

          {/* Main Content */}
          <main 
            className="flex-1 flex flex-col overflow-hidden bg-muted/20"
            role="main"
            aria-label="Visualization workspace"
            data-tour-id="dashboard-main"
          >
            {/* Compact Header Bar */}
            <header className="flex-shrink-0 flex items-center gap-2 px-3 sm:px-4 lg:px-6 py-2 border-b border-border/40 bg-background/80 backdrop-blur-sm">
              {/* Mobile Menu Button */}
              <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden h-8 w-8"
                    aria-label="Open menu"
                  >
                    <Menu className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px] sm:w-[340px] p-0">
                  <SheetHeader className="px-4 py-3 border-b">
                    <SheetTitle className="text-sm font-semibold">Workspace</SheetTitle>
                  </SheetHeader>
                  {sidebarContent}
                </SheetContent>
              </Sheet>

              {/* Dataset Info - Collapsible on mobile */}
              {dataset ? (
                <Collapsible 
                  open={datasetInfoExpanded} 
                  onOpenChange={setDatasetInfoExpanded}
                  className="flex-1 min-w-0"
                >
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Database className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h1 className="text-sm font-semibold truncate">
                          {metadata?.filename || 'Dataset'}
                        </h1>
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-5 w-5 sm:hidden">
                            {datasetInfoExpanded ? (
                              <ChevronUp className="h-3 w-3" />
                            ) : (
                              <ChevronDown className="h-3 w-3" />
                            )}
                          </Button>
                        </CollapsibleTrigger>
                      </div>
                      <p className="text-[10px] text-muted-foreground hidden sm:block">
                        {(metadata?.rowCount || 0).toLocaleString()} rows · {metadata?.columns?.length || 0} cols
                      </p>
                    </div>
                  </div>
                  <CollapsibleContent className="sm:hidden">
                    <p className="text-[10px] text-muted-foreground mt-1 ml-10">
                      {(metadata?.rowCount || 0).toLocaleString()} rows · {metadata?.columns?.length || 0} columns
                    </p>
                  </CollapsibleContent>
                </Collapsible>
              ) : (
                <h1 className="flex-1 text-sm font-semibold">Dashboard</h1>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                {/* Command Palette - Hidden label on mobile */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsPaletteOpen(true)}
                      className="h-8 px-2 sm:px-3"
                      data-tour-id="command-palette"
                    >
                      <Command className="h-3.5 w-3.5" aria-hidden="true" />
                      <kbd className="ml-1.5 hidden sm:inline text-[10px] bg-muted px-1 py-0.5 rounded font-mono">
                        ⌘K
                      </kbd>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="text-xs">Command palette (⌘K)</TooltipContent>
                </Tooltip>

                {dataset && (
                  <>
                    {/* Auto Insights Button - Prominent */}
                    <Button
                      onClick={runAutoInsights}
                      disabled={isProcessing || autoInsightsSnapshot.isLoading}
                      size="sm"
                      data-tour-id="auto-insights"
                      className={cn(
                        "h-8 px-2 sm:px-3 gap-1.5",
                        autoInsightsSnapshot.isLoading 
                          ? "bg-primary/80" 
                          : "bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80"
                      )}
                    >
                      {autoInsightsSnapshot.isLoading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                      ) : (
                        <Zap className="h-3.5 w-3.5" aria-hidden="true" />
                      )}
                      <span className="hidden sm:inline text-xs">
                        {autoInsightsSnapshot.isLoading ? 'Analyzing' : 'Insights'}
                      </span>
                    </Button>

                    {/* Clear Button */}
                    {visualizations.length > 0 && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleClearAllVisualizations}
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="text-xs">Clear all</TooltipContent>
                      </Tooltip>
                    )}
                  </>
                )}
              </div>
            </header>

            {/* Visualizations Area - Takes up remaining space */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6" data-tour-id="visualization-area">
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
                /* Empty State - Compact and centered */
                <div className="h-full flex items-center justify-center">
                  <Card 
                    className="w-full max-w-lg p-6 sm:p-8 text-center border-dashed bg-card/50"
                    role="region"
                    aria-label={dataset ? "Ready to create visualizations" : "No dataset loaded"}
                  >
                    {!dataset ? (
                      <>
                        <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 mb-4">
                          <Layers className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
                        </div>
                        <h2 className="text-lg sm:text-xl font-semibold mb-2">
                          No Dataset Loaded
                        </h2>
                        <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
                          Upload a CSV, JSON, or Excel file to start creating visualizations.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
                          <Button 
                            onClick={() => {
                              setActiveTab('upload');
                              setMobileSheetOpen(true);
                            }} 
                            size="default"
                            className="w-full sm:w-auto"
                          >
                            <Upload className="mr-2 h-4 w-4" />
                            Upload Dataset
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={() => setIsPaletteOpen(true)}
                            size="default"
                            className="w-full sm:w-auto"
                          >
                            <Command className="mr-2 h-4 w-4" />
                            Quick Actions
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className={cn(
                          "inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl mb-4",
                          "bg-gradient-to-br from-emerald-500/20 to-emerald-500/5",
                          autoInsightsSnapshot.isLoading && "animate-pulse"
                        )}>
                          <BarChart3 className="h-7 w-7 sm:h-8 sm:w-8 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <h2 className="text-lg sm:text-xl font-semibold mb-2">
                          Ready to Visualize
                        </h2>
                        <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
                          Create visualizations with natural language or run AI-powered insights.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
                          <Button 
                            onClick={runAutoInsights} 
                            disabled={isProcessing || autoInsightsSnapshot.isLoading}
                            size="default"
                            className={cn(
                              "w-full sm:w-auto gap-2",
                              "bg-primary hover:bg-primary/90 text-primary-foreground border-primary/20"
                            )}
                          >
                            {autoInsightsSnapshot.isLoading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Zap className="h-4 w-4" />
                            )}
                            {autoInsightsSnapshot.isLoading ? 'Analyzing...' : 'Auto Insights'}
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={() => {
                              setActiveTab('visualize');
                              setMobileSheetOpen(true);
                            }}
                            size="default"
                            className="w-full sm:w-auto"
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Create Manually
                          </Button>
                        </div>
                      </>
                    )}
                  </Card>
                </div>
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
