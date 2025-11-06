'use client';

/**
 * @module store/visualization-store
 * @description Zustand store for managing visualization state across the application.
 * Tracks active visualizations, recent history, and saved items for the profile gallery.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Visualization, VisualizationType } from '@/types';

const MAX_RECENT_VISUALIZATIONS = 12;
const MAX_SAVED_VISUALIZATIONS = 24;

const resolveStorage = (): Storage => {
  if (typeof window === 'undefined') {
    return {
      getItem: () => null,
      setItem: () => undefined,
      removeItem: () => undefined,
      clear: () => undefined,
      key: () => null,
      length: 0,
    } as Storage;
  }
  return window.localStorage;
};

const dedupeById = (items: Visualization[]): Visualization[] => {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) {
      return false;
    }
    seen.add(item.id);
    return true;
  });
};

interface VisualizationStore {
  /** Visualizations currently on the workspace */
  visualizations: Visualization[];
  /** Recently generated visualizations (trimmed) */
  recentVisualizations: Visualization[];
  /** Saved visualizations surfaced on the profile page */
  savedVisualizations: Visualization[];

  addVisualization: (visualization: Visualization) => void;
  updateVisualization: (id: string, updates: Partial<Visualization>) => void;
  removeVisualization: (id: string) => void;
  clearVisualizations: () => void;

  getVisualization: (id: string) => Visualization | undefined;
  getVisualizationsByType: (type: VisualizationType) => Visualization[];
  reorderVisualizations: (startIndex: number, endIndex: number) => void;
  duplicateVisualization: (id: string) => void;

  saveVisualization: (visualizationId: string, visualizationOverride?: Visualization) => void;
  unsaveVisualization: (visualizationId: string) => void;
  setSavedVisualizations: (visualizations: Visualization[]) => void;
}

const withTimestamp = (visualization: Visualization): Visualization => ({
  ...visualization,
  createdAt: visualization.createdAt ?? new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

const ensureInCollection = (
  visualization: Visualization,
  collection: Visualization[],
  limit: number
): Visualization[] => {
  return dedupeById([visualization, ...collection]).slice(0, limit);
};

export const useVisualizationStore = create<VisualizationStore>()(
  persist(
    (set, get) => ({
      visualizations: [],
      recentVisualizations: [],
      savedVisualizations: [],

      addVisualization: (visualization) => {
        const normalized = withTimestamp(visualization);
        set((state) => {
          const visualizations = ensureInCollection(normalized, state.visualizations, Infinity);
          const recentVisualizations = ensureInCollection(
            normalized,
            state.recentVisualizations,
            MAX_RECENT_VISUALIZATIONS
          );
          const savedVisualizations = state.savedVisualizations.map((viz) =>
            viz.id === normalized.id ? normalized : viz
          );
          return {
            visualizations,
            recentVisualizations,
            savedVisualizations,
          };
        });
      },

      updateVisualization: (id, updates) => {
        const existing = get().visualizations.find((viz) => viz.id === id);
        if (!existing) {
          return;
        }
        const merged = withTimestamp({ ...existing, ...updates });
        set((state) => {
          const visualizations = ensureInCollection(merged, state.visualizations, Infinity);
          const recentVisualizations = ensureInCollection(
            merged,
            state.recentVisualizations,
            MAX_RECENT_VISUALIZATIONS
          );
          const savedVisualizations = state.savedVisualizations.map((viz) =>
            viz.id === id ? merged : viz
          );
          return {
            visualizations,
            recentVisualizations,
            savedVisualizations,
          };
        });
      },

      removeVisualization: (id) => {
        set((state) => ({
          visualizations: state.visualizations.filter((viz) => viz.id !== id),
          recentVisualizations: state.recentVisualizations.filter((viz) => viz.id !== id),
          savedVisualizations: state.savedVisualizations.filter((viz) => viz.id !== id),
        }));
      },

      clearVisualizations: () => {
        set((state) => ({
          visualizations: [],
          recentVisualizations: state.recentVisualizations.slice(0, MAX_RECENT_VISUALIZATIONS),
          savedVisualizations: state.savedVisualizations,
        }));
      },

      getVisualization: (id) => get().visualizations.find((viz) => viz.id === id),

      getVisualizationsByType: (type) => get().visualizations.filter((viz) => viz.type === type),

      reorderVisualizations: (startIndex, endIndex) => {
        set((state) => {
          const result = Array.from(state.visualizations);
          const [removed] = result.splice(startIndex, 1);
          result.splice(endIndex, 0, removed);
          return { visualizations: result };
        });
      },

      duplicateVisualization: (id) => {
        const viz = get().getVisualization(id);
        if (!viz) return;

        const duplicated: Visualization = {
          ...viz,
          id: `${viz.id}-copy-${Date.now()}`,
          title: `${viz.title} (Copy)`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        get().addVisualization(duplicated);
      },

      saveVisualization: (visualizationId, visualizationOverride) => {
        const source =
          visualizationOverride ??
          get().visualizations.find((viz) => viz.id === visualizationId) ??
          get().recentVisualizations.find((viz) => viz.id === visualizationId);

        if (!source) {
          return;
        }

        const normalized = withTimestamp(source);
        set((state) => ({
          savedVisualizations: ensureInCollection(
            normalized,
            state.savedVisualizations,
            MAX_SAVED_VISUALIZATIONS
          ),
        }));
      },

      unsaveVisualization: (visualizationId) => {
        set((state) => ({
          savedVisualizations: state.savedVisualizations.filter((viz) => viz.id !== visualizationId),
        }));
      },

      setSavedVisualizations: (visualizations) => {
        set(() => ({
          savedVisualizations: dedupeById(
            visualizations
              .map(withTimestamp)
              .slice(0, MAX_SAVED_VISUALIZATIONS)
          ),
        }));
      },
    }),
    {
      name: 'visualization-storage',
      storage: createJSONStorage(resolveStorage),
      partialize: (state) => ({
        visualizations: state.visualizations,
        recentVisualizations: state.recentVisualizations,
        savedVisualizations: state.savedVisualizations,
      }),
    }
  )
);

export const useRecentVisualizations = () =>
  useVisualizationStore((state) => state.recentVisualizations);

export const useSavedVisualizations = () =>
  useVisualizationStore((state) => state.savedVisualizations);
