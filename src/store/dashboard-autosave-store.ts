/**
 * @module store/dashboard-autosave-store
 * @description Zustand store for auto-saving dashboard state including
 * active dataset and visualizations. Persists to localStorage.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { DatasetMetadata, Visualization } from '@/types';

export interface AutoSaveSettings {
  /** Whether auto-save is enabled */
  enabled: boolean;
  /** Auto-save interval in milliseconds */
  intervalMs: number;
  /** Show toast notifications on save/load */
  showNotifications: boolean;
  /** Auto-restore last session on load */
  autoRestore: boolean;
  /** Maximum number of sessions to keep in history */
  maxSessionHistory: number;
}

export interface SavedSession {
  /** Session ID */
  id: string;
  /** Session name/label */
  name: string;
  /** Timestamp when saved */
  savedAt: string;
  /** Dataset info */
  dataset: {
    id: string;
    filename: string;
    rowCount: number;
    columns: string[];
  } | null;
  /** Visualization IDs */
  visualizationIds: string[];
  /** Number of visualizations */
  visualizationCount: number;
}

interface DashboardAutoSaveState {
  /** Auto-save settings */
  settings: AutoSaveSettings;
  /** Last saved session data */
  lastSession: SavedSession | null;
  /** Session history */
  sessionHistory: SavedSession[];
  /** Last auto-save timestamp */
  lastAutoSaveAt: string | null;
  /** Whether currently restoring */
  isRestoring: boolean;

  // Actions
  updateSettings: (updates: Partial<AutoSaveSettings>) => void;
  saveSession: (session: Omit<SavedSession, 'id' | 'savedAt'>) => void;
  restoreSession: (sessionId: string) => SavedSession | null;
  deleteSession: (sessionId: string) => void;
  clearHistory: () => void;
  setIsRestoring: (isRestoring: boolean) => void;
  markAutoSaved: () => void;
}

const DEFAULT_SETTINGS: AutoSaveSettings = {
  enabled: true,
  intervalMs: 30000, // 30 seconds
  showNotifications: true,
  autoRestore: true,
  maxSessionHistory: 10,
};

const generateSessionId = () => `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const useDashboardAutoSaveStore = create<DashboardAutoSaveState>()(
  persist(
    (set, get) => ({
      settings: DEFAULT_SETTINGS,
      lastSession: null,
      sessionHistory: [],
      lastAutoSaveAt: null,
      isRestoring: false,

      updateSettings: (updates) => {
        set((state) => ({
          settings: { ...state.settings, ...updates },
        }));
      },

      saveSession: (sessionData) => {
        const session: SavedSession = {
          ...sessionData,
          id: generateSessionId(),
          savedAt: new Date().toISOString(),
        };

        set((state) => {
          const { maxSessionHistory } = state.settings;
          const newHistory = [session, ...state.sessionHistory]
            .slice(0, maxSessionHistory);

          return {
            lastSession: session,
            sessionHistory: newHistory,
            lastAutoSaveAt: session.savedAt,
          };
        });
      },

      restoreSession: (sessionId) => {
        const { sessionHistory } = get();
        return sessionHistory.find((s) => s.id === sessionId) ?? null;
      },

      deleteSession: (sessionId) => {
        set((state) => ({
          sessionHistory: state.sessionHistory.filter((s) => s.id !== sessionId),
          lastSession: state.lastSession?.id === sessionId ? null : state.lastSession,
        }));
      },

      clearHistory: () => {
        set({
          sessionHistory: [],
          lastSession: null,
        });
      },

      setIsRestoring: (isRestoring) => {
        set({ isRestoring });
      },

      markAutoSaved: () => {
        set({ lastAutoSaveAt: new Date().toISOString() });
      },
    }),
    {
      name: 'dashboard-autosave-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        settings: state.settings,
        lastSession: state.lastSession,
        sessionHistory: state.sessionHistory,
        lastAutoSaveAt: state.lastAutoSaveAt,
      }),
    }
  )
);

// Selector hooks for convenience
export const useAutoSaveSettings = () => 
  useDashboardAutoSaveStore((state) => state.settings);

export const useLastSession = () => 
  useDashboardAutoSaveStore((state) => state.lastSession);

export const useSessionHistory = () => 
  useDashboardAutoSaveStore((state) => state.sessionHistory);

