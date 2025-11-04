'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Visualization } from '@/types';
import { fetchSavedVisualizations } from '@/services/saved-visualizations.service';

interface UseSavedVisualizationsSyncOptions {
  enabled: boolean;
  userId?: string | null;
  onSynced: (visualizations: Visualization[]) => void;
  getLocalVisualizations: () => Visualization[];
}

interface UseSavedVisualizationsSyncResult {
  isSyncing: boolean;
  syncNow: () => Promise<void>;
}

const dedupeById = (visualizations: Visualization[]): Visualization[] => {
  const map = new Map<string, Visualization>();
  visualizations.forEach((viz) => {
    if (!map.has(viz.id)) {
      map.set(viz.id, viz);
    }
  });
  return Array.from(map.values());
};

const mergeRemoteWithLocal = (
  remote: Visualization[],
  local: Visualization[]
): Visualization[] => {
  if (remote.length === 0) {
    return dedupeById(local);
  }

  const ordered = [...remote];
  const seen = new Set(remote.map((viz) => viz.id));

  local.forEach((viz) => {
    if (!seen.has(viz.id)) {
      ordered.push(viz);
    }
  });

  return dedupeById(ordered);
};

export function useSavedVisualizationsSync({
  enabled,
  userId,
  onSynced,
  getLocalVisualizations,
}: UseSavedVisualizationsSyncOptions): UseSavedVisualizationsSyncResult {
  const [isSyncing, setIsSyncing] = useState(false);
  const lastUserIdRef = useRef<string | null>(null);
  const pendingRef = useRef<Promise<void> | null>(null);
  const getLocalRef = useRef(getLocalVisualizations);

  getLocalRef.current = getLocalVisualizations;

  const syncNow = useCallback(async () => {
    if (!enabled || !userId) {
      return;
    }
    if (pendingRef.current) {
      await pendingRef.current;
      return;
    }
    const work = (async () => {
      setIsSyncing(true);
      try {
        const remote = await fetchSavedVisualizations(userId);
        const merged = mergeRemoteWithLocal(remote, getLocalRef.current());
        onSynced(merged);
      } catch (error) {
        console.error('[dashboard] saved visualization sync failed', error);
      } finally {
        setIsSyncing(false);
        pendingRef.current = null;
      }
    })();

    pendingRef.current = work;
    await work;
  }, [enabled, userId, onSynced]);

  useEffect(() => {
    if (!enabled) {
      lastUserIdRef.current = null;
      return;
    }

    if (!userId) {
      return;
    }

    if (lastUserIdRef.current === userId) {
      return;
    }

    lastUserIdRef.current = userId;
    void syncNow();
  }, [enabled, userId, syncNow]);

  useEffect(() => {
    return () => {
      pendingRef.current = null;
    };
  }, []);

  return useMemo(
    () => ({
      isSyncing,
      syncNow,
    }),
    [isSyncing, syncNow]
  );
}
