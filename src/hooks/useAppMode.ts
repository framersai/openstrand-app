'use client';

import { useMemo } from 'react';

import { useOpenStrandStore } from '@/store/openstrand.store';

type AppMode = 'offline' | 'cloud';

const OFFLINE_ENV_FLAG =
  typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_OFFLINE_MODE === 'true' : false;

const DEFAULT_ENV_MODE =
  typeof process !== 'undefined' && process.env.NEXT_PUBLIC_APP_MODE
    ? (process.env.NEXT_PUBLIC_APP_MODE.toLowerCase() === 'offline' ? 'offline' : 'cloud')
    : undefined;

const CLOUD_HOST_SUFFIXES = ['openstrand.ai', 'openstrand.app', 'openstrand.com'];

const inferModeFromHostname = (): AppMode | undefined => {
  if (typeof window === 'undefined') {
    return undefined;
  }

  const host = window.location.hostname.toLowerCase();
  if (!host) {
    return undefined;
  }

  if (host === 'localhost' || host === '127.0.0.1' || host.endsWith('.local')) {
    return 'offline';
  }

  if (CLOUD_HOST_SUFFIXES.some((suffix) => host === suffix || host.endsWith(`.${suffix}`))) {
    return 'cloud';
  }

  return 'offline';
};

/**
 * Determine whether the application is running in offline/local mode or cloud mode.
 * Prefers capability signals from the store and falls back to environment heuristics.
 */
export function useAppMode(): { mode: AppMode } {
  const capabilities = useOpenStrandStore((state) => state.capabilities);

  return useMemo(() => {
    if (capabilities?.environment?.mode === 'offline') {
      return { mode: 'offline' };
    }
    if (capabilities?.environment?.mode === 'cloud') {
      return { mode: 'cloud' };
    }

    if (DEFAULT_ENV_MODE) {
      return { mode: DEFAULT_ENV_MODE };
    }

    if (OFFLINE_ENV_FLAG) {
      return { mode: 'offline' };
    }

    const inferred = inferModeFromHostname();
    return { mode: inferred ?? 'cloud' };
  }, [capabilities]);
}
