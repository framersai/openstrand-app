/**
 * @module useSmartSuggestions
 * @description Hook for fetching smart suggestions for strand creation
 * 
 * Integrates with the Spiral Path backend API to provide:
 * - Tag suggestions based on parent and siblings
 * - Difficulty recommendations
 * - Prerequisite detection
 * - Estimated time calculation
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { 
  spiralPathAPI, 
  type StrandSuggestions, 
  type TagSuggestion, 
  type PrerequisiteSuggestion, 
  type DifficultySuggestion 
} from '@/services/openstrand.api';

// ============================================================================
// Types (re-export from API for convenience)
// ============================================================================

export type { TagSuggestion, PrerequisiteSuggestion, DifficultySuggestion, StrandSuggestions };

export interface UseSmartSuggestionsOptions {
  /** Parent strand/folder ID */
  parentId?: string | null;
  /** Current title */
  title: string;
  /** Current content (optional) */
  content?: string;
  /** Debounce delay in ms */
  debounceMs?: number;
  /** Whether to auto-fetch on mount */
  autoFetch?: boolean;
}

export interface UseSmartSuggestionsReturn {
  suggestions: StrandSuggestions | null;
  loading: boolean;
  error: string | null;
  fetchSuggestions: () => Promise<void>;
  clearSuggestions: () => void;
}

// ============================================================================
// Default Values
// ============================================================================

const DEFAULT_SUGGESTIONS: StrandSuggestions = {
  tags: [],
  categories: [],
  prerequisites: [],
  difficulty: {
    level: 'beginner',
    confidence: 0.5,
    reason: 'Default difficulty',
  },
  estimatedTime: 15,
};

// ============================================================================
// Hook
// ============================================================================

export function useSmartSuggestions({
  parentId,
  title,
  content,
  debounceMs = 500,
  autoFetch = true,
}: UseSmartSuggestionsOptions): UseSmartSuggestionsReturn {
  const [suggestions, setSuggestions] = useState<StrandSuggestions | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const debouncedTitle = useDebounce(title, debounceMs);
  const fetchedRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchSuggestions = useCallback(async () => {
    if (!debouncedTitle.trim()) {
      setSuggestions(null);
      return;
    }

    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError(null);

    try {
      const data = await spiralPathAPI.getSuggestions({
        parentId: parentId || null,
        title: debouncedTitle,
        content: content || undefined,
      });
      
      setSuggestions(data);
    } catch (err) {
      // Don't set error if request was aborted
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      
      console.error('Failed to fetch suggestions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch suggestions');
      // Use fallback suggestions on error
      setSuggestions(DEFAULT_SUGGESTIONS);
    } finally {
      setLoading(false);
    }
  }, [debouncedTitle, parentId, content]);

  const clearSuggestions = useCallback(() => {
    setSuggestions(null);
    setError(null);
  }, []);

  // Auto-fetch when title changes (debounced)
  useEffect(() => {
    if (autoFetch && debouncedTitle.trim() && !fetchedRef.current) {
      fetchedRef.current = true;
      fetchSuggestions();
    }
  }, [autoFetch, debouncedTitle, fetchSuggestions]);

  // Reset fetched flag when title changes
  useEffect(() => {
    fetchedRef.current = false;
  }, [title]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    suggestions,
    loading,
    error,
    fetchSuggestions,
    clearSuggestions,
  };
}

/**
 * Hook for fetching available tags for autocomplete
 */
export function useAvailableTags(scopeId?: string) {
  const [tags, setTags] = useState<Array<{ tag: string; count: number }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTags = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const data = await spiralPathAPI.getAvailableTags(scopeId);
        setTags(data);
      } catch (err) {
        console.error('Failed to fetch tags:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch tags');
        setTags([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTags();
  }, [scopeId]);

  return { tags, loading, error };
}

/**
 * Hook for fetching a spiral learning path
 */
export function useSpiralPath(targetId: string | null, options?: {
  targetType?: 'strand' | 'topic' | 'tag' | 'weave';
  scope?: 'weave' | 'fabric' | 'all';
  maxDepth?: number;
  includeRelated?: boolean;
  enabled?: boolean;
}) {
  const [path, setPath] = useState<Awaited<ReturnType<typeof spiralPathAPI.buildPath>> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPath = useCallback(async () => {
    if (!targetId) {
      setPath(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await spiralPathAPI.buildPath({
        targetId,
        targetType: options?.targetType || 'strand',
        scope: options?.scope || 'all',
        maxDepth: options?.maxDepth || 5,
        includeRelated: options?.includeRelated || false,
      });
      setPath(data);
    } catch (err) {
      console.error('Failed to fetch spiral path:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch spiral path');
      setPath(null);
    } finally {
      setLoading(false);
    }
  }, [targetId, options?.targetType, options?.scope, options?.maxDepth, options?.includeRelated]);

  useEffect(() => {
    if (options?.enabled !== false && targetId) {
      fetchPath();
    }
  }, [fetchPath, options?.enabled, targetId]);

  return { path, loading, error, refetch: fetchPath };
}

/**
 * Hook for fetching tooltip data
 */
export function useTooltip(key: string) {
  const [tooltip, setTooltip] = useState<Awaited<ReturnType<typeof spiralPathAPI.getTooltip>> | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchTooltip = async () => {
      setLoading(true);
      try {
        const data = await spiralPathAPI.getTooltip(key);
        setTooltip(data);
      } catch (err) {
        console.error('Failed to fetch tooltip:', err);
        // Silently fail for tooltips
      } finally {
        setLoading(false);
      }
    };

    if (key) {
      fetchTooltip();
    }
  }, [key]);

  return { tooltip, loading };
}

export default useSmartSuggestions;
