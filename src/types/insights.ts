export interface InsightRecommendation {
  type?: string;
  x?: string | null;
  y?: string | null;
  groupBy?: string | null;
  aggregation?: string | null;
  confidence?: number;
  reason?: string;
  title_suggestion?: string;
  prompt?: string;
}
