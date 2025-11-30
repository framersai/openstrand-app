/**
 * Dashboard Auto-Save Store
 * Manages automatic saving of dashboard state to localStorage
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ============================================================================
// Types
// ============================================================================

export interface DatasetSnapshot {
  id: string;
  filename: string;
  rowCount: number;
  columns: string[];
}

export interface SavedSession {
  id: string;
  name: string;
  timestamp: number;
  dataset: DatasetSnapshot | null;
  visualizationIds: string[];
  visualizationCount: number;
}

export interface AutoSaveSettings {
  enabled: boolean;
  intervalMs: number;
  showNotifications: boolean;
  autoRestore: boolean;
  maxSessionHistory: number;
}

export interface SaveSessionInput {
  name: string;
  dataset: DatasetSnapshot | null;
  visualizationIds?: string[];
  visualizationCount: number;
}

export interface DashboardAutoSaveState {
  // Current session data
  lastSession: SavedSession | null;
  lastAutoSavedAt: number | null;

  // Settings
  settings: AutoSaveSettings;

  // Session history
  sessionHistory: SavedSession[];

  // Loading state
  isRestoring: boolean;

  // Actions
  saveSession: (input: SaveSessionInput) => void;
  restoreSession: (sessionId: string) => SavedSession | null;
  deleteSession: (sessionId: string) => void;
  clearHistory: () => void;
  updateSettings: (settings: Partial<AutoSaveSettings>) => void;
  setIsRestoring: (isRestoring: boolean) => void;
  markAutoSaved: () => void;
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
      lastSession: null,
      lastAutoSavedAt: null,
      settings: DEFAULT_SETTINGS,
      sessionHistory: [],
      isRestoring: false,

      // Save current session
      saveSession: (input: SaveSessionInput) => {
        const now = Date.now();
        const session: SavedSession = {
          id: `session-${now}`,
          name: input.name,
          timestamp: now,
          dataset: input.dataset,
          visualizationIds: input.visualizationIds ?? [],
          visualizationCount: input.visualizationCount,
        };

        set((state) => {
          // Add to history, keeping max items
          const newHistory = [session, ...state.sessionHistory].slice(
            0,
            state.settings.maxSessionHistory
          );

          return {
            lastSession: session,
            sessionHistory: newHistory,
          };
        });
      },

      // Restore a session by ID
      restoreSession: (sessionId: string) => {
        const state = get();
        const session = state.sessionHistory.find((s) => s.id === sessionId);
        return session ?? null;
      },

      // Delete a session from history
      deleteSession: (sessionId: string) => {
        set((state) => ({
          sessionHistory: state.sessionHistory.filter((s) => s.id !== sessionId),
          lastSession:
            state.lastSession?.id === sessionId ? null : state.lastSession,
        }));
      },

      // Clear all session history
      clearHistory: () => {
        set({
          sessionHistory: [],
          lastSession: null,
        });
      },

      // Update settings
      updateSettings: (newSettings) => {
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        }));
      },

      // Set restoring state
      setIsRestoring: (isRestoring: boolean) => {
        set({ isRestoring });
      },

      // Mark auto-saved timestamp
      markAutoSaved: () => {
        set({ lastAutoSavedAt: Date.now() });
      },
    }),
    {
      name: 'openstrand-dashboard-autosave',
      partialize: (state) => ({
        lastSession: state.lastSession,
        lastAutoSavedAt: state.lastAutoSavedAt,
        settings: state.settings,
        sessionHistory: state.sessionHistory,
      }),
    }
  )
);

// ============================================================================
// Selectors
// ============================================================================

export const selectAutoSaveSettings = (state: DashboardAutoSaveState) =>
  state.settings;
export const selectSessionHistory = (state: DashboardAutoSaveState) =>
  state.sessionHistory;
export const selectLastAutoSavedAt = (state: DashboardAutoSaveState) =>
  state.lastAutoSavedAt;
export const selectLastSession = (state: DashboardAutoSaveState) =>
  state.lastSession;
export const selectIsRestoring = (state: DashboardAutoSaveState) =>
  state.isRestoring;
export const selectHasSavedSession = (state: DashboardAutoSaveState) =>
  state.lastSession !== null;
