'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { DatasetInsights } from '@/types';
import type { InsightRecommendation } from '@/types/insights';

const dedupeRecommendations = (
  recommendations: InsightRecommendation[]
): InsightRecommendation[] => {
  const map = new Map<string, InsightRecommendation>();
  recommendations.forEach((rec) => {
    const key = JSON.stringify({
      type: rec.type ?? '',
      x: rec.x ?? '',
      y: rec.y ?? '',
      groupBy: rec.groupBy ?? '',
      aggregation: rec.aggregation ?? '',
      prompt: rec.prompt ?? '',
      reason: rec.reason ?? '',
      title: rec.title_suggestion ?? '',
    });
    if (!map.has(key)) {
      map.set(key, rec);
    }
  });
  return Array.from(map.values());
};

interface AutoInsightsEntry {
  datasetId: string;
  insights: DatasetInsights;
  recommendations: InsightRecommendation[];
  storedAt: string;
}

interface AutoInsightsStoreState {
  entries: Record<string, AutoInsightsEntry>;
  setInsights: (
    datasetId: string,
    insights: DatasetInsights,
    recommendations: InsightRecommendation[]
  ) => void;
  clearInsights: (datasetId: string) => void;
  clearAll: () => void;
}

export const useAutoInsightsStore = create<AutoInsightsStoreState>()(
  persist(
    (set) => ({
      entries: {},
      setInsights: (datasetId, insights, recommendations) => {
        const dedupedRecommendations = dedupeRecommendations(recommendations);
        set((state) => ({
          entries: {
            ...state.entries,
            [datasetId]: {
              datasetId,
              insights,
              recommendations: dedupedRecommendations,
              storedAt: new Date().toISOString(),
            },
          },
        }));
      },
      clearInsights: (datasetId) => {
        set((state) => {
          if (!(datasetId in state.entries)) {
            return state;
          }
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { [datasetId]: _removed, ...rest } = state.entries;
          return { entries: rest };
        });
      },
      clearAll: () => set({ entries: {} }),
    }),
    {
      name: 'auto-insights-storage',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ entries: state.entries }),
    }
  )
);
