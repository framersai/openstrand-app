'use client';

import { useCallback, useEffect, useState } from 'react';

export interface ComposerPreferences {
  autosave: boolean;
  autoTag: boolean;
  autoBacklinks: boolean;
  reviewBeforeApply: boolean;
  maxBacklinks: number;
}

const STORAGE_KEY = 'pkms:composer:preferences';

/**
 * useComposerPreferences
 *
 * Persists strand composer preferences in localStorage per user/device.
 * Safe in SSR and degrades gracefully when storage is unavailable.
 */
export function useComposerPreferences(): [ComposerPreferences, (next: Partial<ComposerPreferences>) => void] {
  const [prefs, setPrefs] = useState<ComposerPreferences>({
    autosave: true,
    autoTag: true,
    autoBacklinks: false,
    reviewBeforeApply: true,
    maxBacklinks: 3,
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setPrefs((prev) => ({
          ...prev,
          ...parsed,
        }));
      }
    } catch {
      // ignore
    }
  }, []);

  const update = useCallback((next: Partial<ComposerPreferences>) => {
    setPrefs((prev) => {
      const merged = { ...prev, ...next };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      } catch {
        // ignore
      }
      return merged;
    });
  }, []);

  return [prefs, update];
}


