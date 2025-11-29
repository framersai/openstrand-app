/**
 * Dashboard Auto-Save Store
 * Manages automatic saving of dashboard state to localStorage
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ============================================================================
// Types
// ============================================================================

export interface DashboardSession {
  id: string;
  timestamp: number;
  datasetId?: string;
  datasetName?: string;
  visualizationCount: number;
}

export interface AutoSaveSettings {
  enabled: boolean;
  intervalMs: number;
  showNotifications: boolean;
  autoRestore: boolean;
  maxSessionHistory: number;
}

export interface DashboardAutoSaveState {
  // Current session data
  currentDatasetId: string | null;
  currentDatasetName: string | null;
  visualizationIds: string[];
  lastSavedAt: number | null;
  
  // Settings
  settings: AutoSaveSettings;
  
  // Session history
  sessionHistory: DashboardSession[];
  
  // Actions
  saveSession: (datasetId: string | null, datasetName: string | null, visualizationIds: string[]) => void;
  restoreSession: () => { datasetId: string | null; visualizationIds: string[] } | null;
  clearSession: () => void;
  updateSettings: (settings: Partial<AutoSaveSettings>) => void;
  addToHistory: (session: DashboardSession) => void;
  clearHistory: () => void;
}

// ============================================================================
// Default Settings
// ============================================================================

const DEFAULT_SETTINGS: AutoSaveSettings = {
  enabled: true,
  intervalMs: 30000, // 30 seconds
  showNotifications: true,
  autoRestore: true,
  maxSessionHistory: 10,
};

// ============================================================================
// Store
// ============================================================================

export const useDashboardAutoSaveStore = create<DashboardAutoSaveState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentDatasetId: null,
      currentDatasetName: null,
      visualizationIds: [],
      lastSavedAt: null,
      settings: DEFAULT_SETTINGS,
      sessionHistory: [],

      // Save current session
      saveSession: (datasetId, datasetName, visualizationIds) => {
        const now = Date.now();
        set({
          currentDatasetId: datasetId,
          currentDatasetName: datasetName,
          visualizationIds,
          lastSavedAt: now,
        });

        // Add to history if we have data
        if (datasetId || visualizationIds.length > 0) {
          const session: DashboardSession = {
            id: `session-${now}`,
            timestamp: now,
            datasetId: datasetId || undefined,
            datasetName: datasetName || undefined,
            visualizationCount: visualizationIds.length,
          };
          get().addToHistory(session);
        }
      },

      // Restore last session
      restoreSession: () => {
        const state = get();
        if (!state.currentDatasetId && state.visualizationIds.length === 0) {
          return null;
        }
        return {
          datasetId: state.currentDatasetId,
          visualizationIds: state.visualizationIds,
        };
      },

      // Clear current session
      clearSession: () => {
        set({
          currentDatasetId: null,
          currentDatasetName: null,
          visualizationIds: [],
          lastSavedAt: null,
        });
      },

      // Update settings
      updateSettings: (newSettings) => {
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        }));
      },

      // Add session to history
      addToHistory: (session) => {
        set((state) => {
          const history = [session, ...state.sessionHistory];
          // Keep only the max number of sessions
          return {
            sessionHistory: history.slice(0, state.settings.maxSessionHistory),
          };
        });
      },

      // Clear session history
      clearHistory: () => {
        set({ sessionHistory: [] });
      },
    }),
    {
      name: 'openstrand-dashboard-autosave',
      partialize: (state) => ({
        currentDatasetId: state.currentDatasetId,
        currentDatasetName: state.currentDatasetName,
        visualizationIds: state.visualizationIds,
        lastSavedAt: state.lastSavedAt,
        settings: state.settings,
        sessionHistory: state.sessionHistory,
      }),
    }
  )
);

// ============================================================================
// Selectors
// ============================================================================

export const selectAutoSaveSettings = (state: DashboardAutoSaveState) => state.settings;
export const selectSessionHistory = (state: DashboardAutoSaveState) => state.sessionHistory;
export const selectLastSavedAt = (state: DashboardAutoSaveState) => state.lastSavedAt;
export const selectHasSavedSession = (state: DashboardAutoSaveState) => 
  state.currentDatasetId !== null || state.visualizationIds.length > 0;

