'use client';

import React, { forwardRef } from 'react';
import type { Visualization, FeedbackSummary } from '@/types';
import type { InsightRecommendation } from '@/types/insights';
import { VisualizationList } from '@/features/dashboard/components/VisualizationList';

interface VisualizationWorkspaceProps {
  visualizations: Visualization[];
  onClearAll: () => void;
  onExport: (visualization: Visualization) => void;
  onRemove: (visualizationId: string) => void;
  onModify: (visualizationId: string, prompt: string) => void;
  isProcessing?: boolean;
  feedbackMap?: Record<string, FeedbackSummary | undefined>;
  canSubmitFeedback?: boolean;
  onVote?: (visualizationId: string, vote: 'up' | 'down' | null) => void;
  onFavoriteToggle?: (visualizationId: string, favorite: boolean) => void;
  highlightNew?: boolean;
  autoInsights?: InsightRecommendation[];
  autoInsightsLoading?: boolean;
  autoInsightsError?: string | null;
  autoInsightsStatus?: string | null;
  onRunRecommendation?: (recommendation: InsightRecommendation) => void;
  savedVisualizationIds?: Set<string>;
  usedRecommendationKeys?: Set<string>;
}

export const VisualizationWorkspace = forwardRef<HTMLDivElement, VisualizationWorkspaceProps>(
  (
    {
      visualizations,
      onClearAll,
      onExport,
      onRemove,
      onModify,
      isProcessing,
      feedbackMap,
      canSubmitFeedback,
      onVote,
      onFavoriteToggle,
      highlightNew,
      autoInsights,
      autoInsightsLoading,
      autoInsightsError,
      autoInsightsStatus,
      onRunRecommendation,
      savedVisualizationIds,
      usedRecommendationKeys,
    },
    ref
  ) => {
    return (
      <div className="lg:col-span-2 pt-2 md:pt-4" ref={ref}>
        <VisualizationList
          visualizations={visualizations}
          onClearAll={onClearAll}
          onExport={onExport}
          onRemove={onRemove}
          onModify={onModify}
          isProcessing={isProcessing}
          feedbackMap={feedbackMap}
          canSubmitFeedback={canSubmitFeedback}
          onVote={onVote}
          onFavoriteToggle={onFavoriteToggle}
          highlightNew={highlightNew}
          autoInsights={autoInsights}
          autoInsightsLoading={autoInsightsLoading}
          autoInsightsError={autoInsightsError}
          autoInsightsStatus={autoInsightsStatus}
          onRunRecommendation={onRunRecommendation}
          savedVisualizationIds={savedVisualizationIds}
          usedRecommendationKeys={usedRecommendationKeys}
        />
      </div>
    );
  }
);

VisualizationWorkspace.displayName = 'VisualizationWorkspace';
