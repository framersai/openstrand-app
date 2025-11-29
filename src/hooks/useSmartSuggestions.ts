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

// ============================================================================
// Types
// ============================================================================

export interface TagSuggestion {
  tag: string;
  confidence: number;
  source: 'parent' | 'sibling' | 'content';
}

export interface PrerequisiteSuggestion {
  strandId: string;
  title: string;
  confidence: number;
}

export interface DifficultySuggestion {
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  confidence: number;
  reason: string;
}

export interface StrandSuggestions {
  tags: TagSuggestion[];
  categories: Array<{ category: string; confidence: number }>;
  prerequisites: PrerequisiteSuggestion[];
  difficulty: DifficultySuggestion;
  estimatedTime: number;
}

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

  const fetchSuggestions = useCallback(async () => {
    if (!debouncedTitle.trim()) {
      setSuggestions(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const response = await fetch(`${apiUrl}/api/v1/spiral-path/suggestions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          parentId: parentId || null,
          title: debouncedTitle,
          content: content || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch suggestions: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        setSuggestions(data.data);
      } else {
        setSuggestions(DEFAULT_SUGGESTIONS);
      }
    } catch (err) {
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

  useEffect(() => {
    const fetchTags = async () => {
      setLoading(true);
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
        const url = scopeId 
          ? `${apiUrl}/api/v1/spiral-path/tags?scopeId=${scopeId}`
          : `${apiUrl}/api/v1/spiral-path/tags`;
        
        const response = await fetch(url);
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && Array.isArray(data.data)) {
            setTags(data.data);
          }
        }
      } catch (err) {
        console.error('Failed to fetch tags:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTags();
  }, [scopeId]);

  return { tags, loading };
}

export default useSmartSuggestions;

