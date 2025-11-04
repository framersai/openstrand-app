'use client';

import type { InsightRecommendation } from '@/types/insights';

export const recommendationKey = (recommendation: InsightRecommendation): string => {
  return JSON.stringify({
    type: recommendation.type ?? '',
    x: recommendation.x ?? '',
    y: recommendation.y ?? '',
    groupBy: recommendation.groupBy ?? '',
    aggregation: recommendation.aggregation ?? '',
    prompt: recommendation.prompt ?? '',
    reason: recommendation.reason ?? '',
    title: recommendation.title_suggestion ?? '',
  });
};

export const uniqueRecommendations = (
  recommendations: InsightRecommendation[] | null | undefined
): InsightRecommendation[] => {
  if (!recommendations || recommendations.length === 0) {
    return [];
  }
  const map = new Map<string, InsightRecommendation>();
  recommendations.forEach((rec) => {
    const key = recommendationKey(rec);
    if (!map.has(key)) {
      map.set(key, rec);
    }
  });
  return Array.from(map.values());
};

export const mergeRecommendations = (
  existing: InsightRecommendation[] | null | undefined,
  incoming: InsightRecommendation[] | null | undefined
): InsightRecommendation[] => {
  const baseline = uniqueRecommendations(existing ?? []);
  const seen = new Set(baseline.map(recommendationKey));
  const next = [...baseline];

  uniqueRecommendations(incoming).forEach((rec) => {
    const key = recommendationKey(rec);
    if (!seen.has(key)) {
      seen.add(key);
      next.push(rec);
    }
  });

  return next;
};
