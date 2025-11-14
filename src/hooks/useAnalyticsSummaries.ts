'use client';

import { useCallback, useEffect, useState } from 'react';
import { openstrandAPI } from '@/services/openstrand.api';
import type {
  LoomAnalyticsSummary,
  StrandAnalyticsSummary,
  WeaveAnalyticsSummary,
} from '@/types/openstrand';

/**
 * Shape returned by each analytics hook. Mirrors the React Query mental model
 * while staying dependency-light (plain useState) for environments that avoid
 * additional runtime weight.
 */
interface AnalyticsState<T> {
  /** Last successful payload (null before the first load). */
  data: T | null;
  /** True while the current request is in-flight. */
  loading: boolean;
  /** Human-readable error string (null when healthy). */
  error: string | null;
  /** Manual refetch helper; `force` bypasses Redis/DB caches via `?fresh=true`. */
  refresh: (options?: { force?: boolean }) => Promise<void>;
}

/**
 * Coerces unknown errors (network, AbortError, APIError) into a friendly string.
 */
function createErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'Unable to load analytics';
}

/**
 * Fetches strand-level analytics (entity histogram, keyword cloud, readability,
 * ratings, embedding coverage). Intended for PKMS dashboards and strand detail
 * drawers where we want a minimal dependency footprint without React Query.
 */
export function useStrandAnalytics(
  strandId: string | null | undefined,
): AnalyticsState<StrandAnalyticsSummary> {
  const [data, setData] = useState<StrandAnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(
    async (options?: { force?: boolean }) => {
      if (!strandId) {
        setData(null);
        setError(null);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const summary = await openstrandAPI.analytics.getStrandSummary(strandId, {
          fresh: options?.force,
        });
        setData(summary);
      } catch (err) {
        setError(createErrorMessage(err));
      } finally {
        setLoading(false);
      }
    },
    [strandId],
  );

  useEffect(() => {
    let cancelled = false;
    if (!strandId) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    openstrandAPI.analytics
      .getStrandSummary(strandId)
      .then((summary) => {
        if (!cancelled) {
          setData(summary);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(createErrorMessage(err));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [strandId]);

  return { data, loading, error, refresh };
}

/**
 * Fetches loom-level analytics (aggregated KPIs per StrandScope). Down-level
 * scopes still return deterministic data, so this hook works for both Community
 * (global loom) and Teams (multi-loom) editions.
 */
export function useLoomAnalytics(
  scopeId: string | null | undefined,
): AnalyticsState<LoomAnalyticsSummary> {
  const [data, setData] = useState<LoomAnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(
    async (options?: { force?: boolean }) => {
      if (!scopeId) {
        setData(null);
        setError(null);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const summary = await openstrandAPI.analytics.getLoomSummary(scopeId, {
          fresh: options?.force,
        });
        setData(summary);
      } catch (err) {
        setError(createErrorMessage(err));
      } finally {
        setLoading(false);
      }
    },
    [scopeId],
  );

  useEffect(() => {
    let cancelled = false;
    if (!scopeId) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    openstrandAPI.analytics
      .getLoomSummary(scopeId)
      .then((summary) => {
        if (!cancelled) {
          setData(summary);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(createErrorMessage(err));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [scopeId]);

  return { data, loading, error, refresh };
}

/**
 * Fetches weave-level analytics (workspace rollups). The `workspaceKey`
 * should be `community` for local/Community builds or `team:{id}` for Teams.
 */
export function useWeaveAnalytics(
  workspaceKey: string | null | undefined,
): AnalyticsState<WeaveAnalyticsSummary> {
  const [data, setData] = useState<WeaveAnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(
    async (options?: { force?: boolean }) => {
      if (!workspaceKey) {
        setData(null);
        setError(null);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const summary = await openstrandAPI.analytics.getWeaveSummary(workspaceKey, {
          fresh: options?.force,
        });
        setData(summary);
      } catch (err) {
        setError(createErrorMessage(err));
      } finally {
        setLoading(false);
      }
    },
    [workspaceKey],
  );

  useEffect(() => {
    let cancelled = false;
    if (!workspaceKey) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    openstrandAPI.analytics
      .getWeaveSummary(workspaceKey)
      .then((summary) => {
        if (!cancelled) {
          setData(summary);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(createErrorMessage(err));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [workspaceKey]);

  return { data, loading, error, refresh };
}

