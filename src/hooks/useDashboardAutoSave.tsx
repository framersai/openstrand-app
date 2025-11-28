/**
 * @module hooks/useDashboardAutoSave
 * @description Hook for managing dashboard auto-save functionality.
 * Handles periodic saving and restoration of dashboard state.
 */

'use client';

import { useCallback, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { 
  useDashboardAutoSaveStore,
  type SavedSession,
} from '@/store/dashboard-autosave-store';
import { useVisualizationStore } from '@/store/visualization-store';
import { useDatasetStore } from '@/store/dataset-store';
import type { DatasetMetadata, Visualization } from '@/types';

interface UseDashboardAutoSaveOptions {
  /** Called when a session is restored */
  onRestore?: (session: SavedSession) => void;
  /** Called when auto-save occurs */
  onAutoSave?: () => void;
}

export function useDashboardAutoSave(options: UseDashboardAutoSaveOptions = {}) {
  const { onRestore, onAutoSave } = options;
  
  const settings = useDashboardAutoSaveStore((state) => state.settings);
  const lastSession = useDashboardAutoSaveStore((state) => state.lastSession);
  const sessionHistory = useDashboardAutoSaveStore((state) => state.sessionHistory);
  const isRestoring = useDashboardAutoSaveStore((state) => state.isRestoring);
  const saveSession = useDashboardAutoSaveStore((state) => state.saveSession);
  const restoreSession = useDashboardAutoSaveStore((state) => state.restoreSession);
  const deleteSession = useDashboardAutoSaveStore((state) => state.deleteSession);
  const clearHistory = useDashboardAutoSaveStore((state) => state.clearHistory);
  const updateSettings = useDashboardAutoSaveStore((state) => state.updateSettings);
  const setIsRestoring = useDashboardAutoSaveStore((state) => state.setIsRestoring);
  const markAutoSaved = useDashboardAutoSaveStore((state) => state.markAutoSaved);

  const visualizations = useVisualizationStore((state) => state.visualizations);
  const dataset = useDatasetStore((state) => state.dataset);
  const metadata = useDatasetStore((state) => state.metadata);
  const setDataset = useDatasetStore((state) => state.setDataset);

  const autoSaveIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasRestoredRef = useRef(false);

  // Manual save function
  const saveCurrentSession = useCallback((name?: string) => {
    const sessionName = name || (metadata?.filename 
      ? `Session: ${metadata.filename}` 
      : `Session ${new Date().toLocaleTimeString()}`);

    saveSession({
      name: sessionName,
      dataset: dataset ? {
        id: dataset.id,
        filename: metadata?.filename || 'Unknown',
        rowCount: metadata?.rowCount || 0,
        columns: metadata?.columns || [],
      } : null,
      visualizationIds: visualizations.map((v) => v.id),
      visualizationCount: visualizations.length,
    });

    if (settings.showNotifications) {
      toast.success('Session saved', {
        icon: '💾',
        duration: 2000,
      });
    }

    onAutoSave?.();
  }, [dataset, metadata, visualizations, saveSession, settings.showNotifications, onAutoSave]);

  // Auto-save effect
  useEffect(() => {
    if (!settings.enabled) {
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
        autoSaveIntervalRef.current = null;
      }
      return;
    }

    // Only auto-save if there's something to save
    const shouldAutoSave = dataset || visualizations.length > 0;
    
    if (!shouldAutoSave) {
      return;
    }

    autoSaveIntervalRef.current = setInterval(() => {
      saveSession({
        name: metadata?.filename 
          ? `Auto-save: ${metadata.filename}` 
          : 'Auto-save',
        dataset: dataset ? {
          id: dataset.id,
          filename: metadata?.filename || 'Unknown',
          rowCount: metadata?.rowCount || 0,
          columns: metadata?.columns || [],
        } : null,
        visualizationIds: visualizations.map((v) => v.id),
        visualizationCount: visualizations.length,
      });

      markAutoSaved();

      if (settings.showNotifications) {
        toast.success('Auto-saved', {
          icon: '✓',
          duration: 1500,
          style: {
            background: 'var(--background)',
            color: 'var(--foreground)',
            border: '1px solid var(--border)',
            fontSize: '0.875rem',
          },
        });
      }
    }, settings.intervalMs);

    return () => {
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
        autoSaveIntervalRef.current = null;
      }
    };
  }, [
    settings.enabled,
    settings.intervalMs,
    settings.showNotifications,
    dataset,
    metadata,
    visualizations,
    saveSession,
    markAutoSaved,
  ]);

  // Auto-restore on mount
  useEffect(() => {
    if (!settings.autoRestore || hasRestoredRef.current || !lastSession) {
      return;
    }

    // Only restore if we have a meaningful session
    if (!lastSession.dataset && lastSession.visualizationCount === 0) {
      return;
    }

    hasRestoredRef.current = true;

    // Show restore prompt
    const toastId = toast(
      (t) => (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">Restore previous session?</p>
          <p className="text-xs text-muted-foreground">
            {lastSession.dataset?.filename || 'No dataset'} · {lastSession.visualizationCount} visualizations
          </p>
          <div className="flex gap-2 mt-1">
            <button
              onClick={() => {
                toast.dismiss(t.id);
                onRestore?.(lastSession);
                if (settings.showNotifications) {
                  toast.success('Session restored', { icon: '📂', duration: 2000 });
                }
              }}
              className="px-3 py-1 text-xs font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Restore
            </button>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="px-3 py-1 text-xs font-medium bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80"
            >
              Dismiss
            </button>
          </div>
        </div>
      ),
      {
        duration: 10000,
        position: 'bottom-right',
      }
    );

    return () => {
      toast.dismiss(toastId);
    };
  }, [settings.autoRestore, settings.showNotifications, lastSession, onRestore]);

  // Restore a specific session
  const handleRestoreSession = useCallback((sessionId: string) => {
    const session = restoreSession(sessionId);
    if (session) {
      setIsRestoring(true);
      onRestore?.(session);
      setIsRestoring(false);
      
      if (settings.showNotifications) {
        toast.success(`Restored: ${session.name}`, { icon: '📂', duration: 2000 });
      }
    }
  }, [restoreSession, setIsRestoring, onRestore, settings.showNotifications]);

  // Delete a session
  const handleDeleteSession = useCallback((sessionId: string) => {
    deleteSession(sessionId);
    if (settings.showNotifications) {
      toast.success('Session deleted', { duration: 1500 });
    }
  }, [deleteSession, settings.showNotifications]);

  return {
    // State
    settings,
    lastSession,
    sessionHistory,
    isRestoring,
    
    // Actions
    saveCurrentSession,
    restoreSession: handleRestoreSession,
    deleteSession: handleDeleteSession,
    clearHistory,
    updateSettings,
  };
}

