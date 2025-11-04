import type { PlanTier, FeedbackSummary } from '@/types';

export interface DashboardOverviewData {
  datasetName?: string | null;
  datasetRows?: number | null;
  datasetColumns?: number | null;
  datasetUploadedAt?: string | null;
  datasetLanguage?: string | null;
  totalVisualizations: number;
  savedVisualizations: number;
  lastVisualizationAt?: string | null;
  autoInsightsStatus?: string | null;
  autoInsightsReady: boolean;
  planTier: PlanTier;
  planLimitMb: number | null;
  datasetReady: boolean;
}

export interface ProviderUsageEntry {
  provider: string;
  count: number;
  totalCost: number;
  inputTokens: number;
  outputTokens: number;
  lastUsedAt?: string | null;
}

export interface ProviderUsageSummary {
  totalCost: number;
  totalRequests: number;
  totalTokens: number;
  providers: ProviderUsageEntry[];
}

export type ActivityEventType = 'dataset' | 'visualization' | 'insight';

export interface ActivityEvent {
  id: string;
  type: ActivityEventType;
  timestamp: string;
  title: string;
  description?: string;
  meta?: Record<string, unknown>;
}

export interface FeedbackOverview {
  dataset?: FeedbackSummary | null;
  visualizations?: {
    count: number;
    totalLikes: number;
    totalDislikes: number;
    totalFavorites: number;
    averageScore: number;
    topVisualization?: FeedbackSummary | null;
  } | null;
}
