'use client';

import { useMemo, useState } from 'react';
import {
  Upload,
  Sparkles,
  Command,
  Database,
  Play,
  Plus,
  ArrowRight,
  BarChart3,
  Table2,
  Wand2,
  FileUp,
  Layers,
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
import { PromptInput } from '@/components/prompt-input';
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

  const [activeView, setActiveView] = useState<'data' | 'create'>('data');

  const shouldShowLocalOnboarding = environmentMode === 'offline';
  const shouldShowTeamOnboarding =
    isTeamEdition && environmentMode === 'cloud' && !teamOnboardingComplete;

  const commandActions = useMemo<CommandAction[]>(
    () => [
      {
        id: 'upload',
        label: 'Upload Dataset',
        hint: 'Import CSV, JSON, or Excel files',
        shortcut: 'Shift+U',
        onSelect: () => setActiveView('data'),
      },
      {
        id: 'auto-insights',
        label: 'Run Auto Insights',
        hint: 'AI-powered data analysis',
        shortcut: 'Shift+A',
        onSelect: runAutoInsights,
      },
      {
        id: 'new-visualization',
        label: 'Create Visualization',
        hint: 'Generate charts from prompts',
        shortcut: 'Shift+V',
        onSelect: () => setActiveView('create'),
      },
      {
        id: 'clear-visualizations',
        label: 'Clear All',
        shortcut: 'Shift+C',
        onSelect: handleClearAllVisualizations,
      },
      {
        id: 'open-settings',
        label: 'Settings',
        shortcut: 'Shift+S',
        onSelect: openSettings,
      },
    ],
    [runAutoInsights, handleClearAllVisualizations, openSettings]
  );

  useDashboardShortcuts({
    onToggleCommandPalette: () => setIsPaletteOpen((prev) => !prev),
    onOpenUpload: () => setActiveView('data'),
    onRunAutoInsights: runAutoInsights,
    onOpenVisualize: () => setActiveView('create'),
    onClearVisualizations: handleClearAllVisualizations,
    onOpenSettings: openSettings,
  });

  // Format bytes to human readable
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0f]">
      <GuidedTour />
      {shouldShowLocalOnboarding && <LocalOnboarding onOpenSettings={openSettings} />}
      {shouldShowTeamOnboarding && <TeamOnboarding onOpenSettings={openSettings} />}
      <UnifiedHeader onOpenSettings={openSettings} />

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        <div className="h-full max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          
          {/* Hero Section - Only show when no dataset */}
          {!dataset && (
            <div className="mb-8">
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600/20 via-fuchsia-600/10 to-transparent border border-white/5 p-8 md:p-12">
                {/* Background pattern */}
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMiI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
                
                <div className="relative z-10 max-w-2xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-white/60 mb-4">
                    <Sparkles className="h-3 w-3 text-violet-400" />
                    AI-Powered Data Intelligence
                  </div>
                  <h1 className="text-3xl md:text-4xl font-semibold text-white mb-3 tracking-tight">
                    Transform data into insights
                  </h1>
                  <p className="text-white/50 text-lg mb-8 leading-relaxed">
                    Upload your dataset and let AI generate visualizations, uncover patterns, and answer questions in natural language.
                  </p>
                  
                  {/* Quick Actions */}
                  <div className="flex flex-wrap gap-3">
                    <Button 
                      size="lg"
                      className="bg-white text-black hover:bg-white/90 font-medium"
                      onClick={() => setActiveView('data')}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Dataset
                    </Button>
                    <Button 
                      size="lg"
                      variant="outline"
                      className="border-white/20 text-white hover:bg-white/5"
                      onClick={() => setIsPaletteOpen(true)}
                    >
                      <Command className="mr-2 h-4 w-4" />
                      Quick Actions
                      <kbd className="ml-2 text-xs bg-white/10 px-1.5 py-0.5 rounded">⌘K</kbd>
                    </Button>
                  </div>
                </div>
                
                {/* Decorative element */}
                <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 rounded-full blur-3xl" />
              </div>
            </div>
          )}

          {/* Dataset Loaded State */}
          {dataset && (
            <div className="mb-6">
              {/* Dataset Info Bar */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/20 flex items-center justify-center">
                    <Database className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-medium text-white">
                      {metadata?.filename || 'Dataset'}
                    </h2>
                    <div className="flex items-center gap-3 text-sm text-white/40">
                      <span>{metadata?.rowCount?.toLocaleString() || 0} rows</span>
                      <span className="w-1 h-1 rounded-full bg-white/20" />
                      <span>{metadata?.columns?.length || 0} columns</span>
                      {metadata?.fileSize && (
                        <>
                          <span className="w-1 h-1 rounded-full bg-white/20" />
                          <span>{formatBytes(metadata.fileSize)}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white/60 hover:text-white hover:bg-white/5"
                    onClick={() => setActiveView('data')}
                  >
                    <FileUp className="mr-2 h-4 w-4" />
                    Change Dataset
                  </Button>
                  <Button
                    size="sm"
                    className="bg-violet-600 hover:bg-violet-700 text-white"
                    onClick={runAutoInsights}
                    disabled={isProcessing}
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    Auto Insights
                  </Button>
                </div>
              </div>

              {/* Prompt Input - Always visible when dataset loaded */}
              <Card className="bg-white/[0.02] border-white/5 p-4 mb-6">
                <div className="flex items-start gap-4">
                  <div className="h-8 w-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center flex-shrink-0">
                    <Wand2 className="h-4 w-4 text-violet-400" />
                  </div>
                  <div className="flex-1">
                    <PromptInput
                      onSubmit={handlePromptSubmit}
                      isProcessing={isProcessing}
                      placeholder="Describe the visualization you want to create..."
                      suggestions={[
                        'Show top 10 by revenue',
                        'Create a pie chart of categories',
                        'Compare trends over time',
                        'Find correlations in the data',
                      ]}
                    />
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Panel - Data/Upload */}
            <div className="lg:col-span-4 xl:col-span-3">
              <Card className="bg-white/[0.02] border-white/5 overflow-hidden">
                {/* Panel Tabs */}
                <div className="flex border-b border-white/5">
                  <button
                    onClick={() => setActiveView('data')}
                    className={cn(
                      "flex-1 px-4 py-3 text-sm font-medium transition-colors",
                      activeView === 'data'
                        ? "text-white bg-white/5 border-b-2 border-violet-500"
                        : "text-white/40 hover:text-white/60"
                    )}
                  >
                    <Database className="inline-block mr-2 h-4 w-4" />
                    Data
                  </button>
                  <button
                    onClick={() => setActiveView('create')}
                    className={cn(
                      "flex-1 px-4 py-3 text-sm font-medium transition-colors",
                      activeView === 'create'
                        ? "text-white bg-white/5 border-b-2 border-violet-500"
                        : "text-white/40 hover:text-white/60"
                    )}
                  >
                    <BarChart3 className="inline-block mr-2 h-4 w-4" />
                    Create
                  </button>
                </div>

                {/* Panel Content */}
                <div className="p-4 max-h-[calc(100vh-300px)] overflow-y-auto">
                  {activeView === 'data' ? (
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
                  ) : (
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
                  )}
                </div>
              </Card>
            </div>

            {/* Right Panel - Visualizations */}
            <div className="lg:col-span-8 xl:col-span-9">
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
                <Card className="bg-white/[0.02] border-white/5 h-full min-h-[500px] flex items-center justify-center">
                  <div className="text-center max-w-md px-8">
                    {!dataset ? (
                      <>
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 border border-violet-500/20 mb-6">
                          <Layers className="h-8 w-8 text-violet-400" />
                        </div>
                        <h3 className="text-xl font-medium text-white mb-2">
                          No dataset loaded
                        </h3>
                        <p className="text-white/40 mb-6 leading-relaxed">
                          Upload a CSV, JSON, or Excel file to start creating visualizations with AI assistance.
                        </p>
                        <Button
                          onClick={() => setActiveView('data')}
                          className="bg-violet-600 hover:bg-violet-700 text-white"
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          Upload Dataset
                        </Button>
                      </>
                    ) : (
                      <>
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 mb-6">
                          <BarChart3 className="h-8 w-8 text-emerald-400" />
                        </div>
                        <h3 className="text-xl font-medium text-white mb-2">
                          Ready to visualize
                        </h3>
                        <p className="text-white/40 mb-6 leading-relaxed">
                          Your dataset is loaded. Describe what you want to see or run Auto Insights to get AI-recommended visualizations.
                        </p>
                        <div className="flex items-center justify-center gap-3">
                          <Button
                            onClick={runAutoInsights}
                            disabled={isProcessing}
                            className="bg-violet-600 hover:bg-violet-700 text-white"
                          >
                            <Sparkles className="mr-2 h-4 w-4" />
                            Auto Insights
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setActiveView('create')}
                            className="border-white/10 text-white hover:bg-white/5"
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Create Manually
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>

      {showSettings && <SettingsDialog isOpen={showSettings} onClose={closeSettings} />}

      <CommandPalette
        open={isPaletteOpen}
        onClose={() => setIsPaletteOpen(false)}
        actions={commandActions}
      />
    </div>
  );
}
