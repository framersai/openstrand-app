/**
 * Oracle React Hook
 *
 * React hook for using the Q&A Oracle service.
 * Provides state management, streaming support, and context-aware querying.
 *
 * @module hooks/use-oracle
 * @author OpenStrand <team@frame.dev>
 * @since 2.0.0
 */

'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import type {
  OracleQueryRequest,
  OracleQueryResponse,
  OracleStreamChunk,
  OracleState,
  OracleStatus,
  Citation,
  SocraticQuestion,
  SearchOptions,
} from '@/types/oracle';
import { getOracleService, OracleService } from '@/lib/oracle';

// ============================================================================
// Types
// ============================================================================

export interface UseOracleOptions {
  /** Auto-initialize on mount */
  autoInit?: boolean;
  /** Default scope for queries */
  defaultScope?: OracleQueryRequest['scope'];
  /** Default search options */
  defaultSearchOptions?: SearchOptions;
  /** Enable streaming by default */
  streaming?: boolean;
  /** Include Socratic questions */
  includeSocratic?: boolean;
  /** Answer mode */
  answerMode?: 'extractive' | 'generative' | 'hybrid';
}

export interface UseOracleReturn {
  /** Current Oracle state */
  state: OracleState;
  /** Current status */
  status: OracleStatus;
  /** Is ready for queries */
  isReady: boolean;
  /** Is currently querying */
  isQuerying: boolean;
  /** Is streaming a response */
  isStreaming: boolean;
  /** Current/last answer */
  answer: string;
  /** Current citations */
  citations: Citation[];
  /** Current Socratic questions */
  socraticQuestions: SocraticQuestion[];
  /** Last response metadata */
  metadata: OracleQueryResponse['metadata'] | null;
  /** Last error */
  error: string | null;
  /** Initialize the Oracle */
  initialize: () => Promise<void>;
  /** Execute a query */
  query: (question: string, options?: Partial<OracleQueryRequest>) => Promise<OracleQueryResponse>;
  /** Execute a streaming query */
  queryStream: (
    question: string,
    options?: Partial<OracleQueryRequest>,
    callbacks?: {
      onText?: (text: string) => void;
      onCitation?: (citation: Citation) => void;
      onSocratic?: (question: SocraticQuestion) => void;
      onDone?: (response: Partial<OracleQueryResponse>) => void;
      onError?: (error: string) => void;
    }
  ) => Promise<void>;
  /** Clear current answer and citations */
  clear: () => void;
  /** Stop streaming */
  stopStream: () => void;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useOracle(options: UseOracleOptions = {}): UseOracleReturn {
  const {
    autoInit = true,
    defaultScope,
    defaultSearchOptions,
    streaming = true,
    includeSocratic = true,
    answerMode = 'hybrid',
  } = options;

  // Service instance
  const serviceRef = useRef<OracleService | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // State
  const [state, setState] = useState<OracleState>({
    status: 'uninitialized',
    statusMessage: 'Not initialized',
    backendStatus: null,
    embeddingsLoaded: false,
    embeddingCount: 0,
    error: null,
    isQuerying: false,
    queryHistory: [],
  });
  const [isStreaming, setIsStreaming] = useState(false);
  const [answer, setAnswer] = useState('');
  const [citations, setCitations] = useState<Citation[]>([]);
  const [socraticQuestions, setSocraticQuestions] = useState<SocraticQuestion[]>([]);
  const [metadata, setMetadata] = useState<OracleQueryResponse['metadata'] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Get or create service instance
  const getService = useCallback(() => {
    if (!serviceRef.current) {
      serviceRef.current = getOracleService();
    }
    return serviceRef.current;
  }, []);

  // Initialize
  const initialize = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, status: 'initializing', statusMessage: 'Initializing...' }));
      setError(null);

      const service = getService();
      const newState = await service.initialize();
      setState(newState);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setError(errorMsg);
      setState((prev) => ({
        ...prev,
        status: 'error',
        statusMessage: `Initialization failed: ${errorMsg}`,
        error: errorMsg,
      }));
    }
  }, [getService]);

  // Auto-initialize on mount
  useEffect(() => {
    if (autoInit) {
      initialize();
    }

    return () => {
      // Cleanup: abort any ongoing streams
      abortControllerRef.current?.abort();
    };
  }, [autoInit, initialize]);

  // Query (non-streaming)
  const query = useCallback(
    async (
      question: string,
      queryOptions?: Partial<OracleQueryRequest>
    ): Promise<OracleQueryResponse> => {
      const service = getService();

      if (state.status !== 'ready') {
        await initialize();
      }

      setError(null);
      setState((prev) => ({ ...prev, isQuerying: true }));

      try {
        const request: OracleQueryRequest = {
          question,
          scope: queryOptions?.scope ?? defaultScope,
          searchOptions: {
            ...defaultSearchOptions,
            ...queryOptions?.searchOptions,
          },
          answerOptions: {
            mode: answerMode,
            stream: false,
            includeSocratic,
            ...queryOptions?.answerOptions,
          },
          ...queryOptions,
        };

        const response = await service.query(request);

        setAnswer(response.answer);
        setCitations(response.citations);
        setSocraticQuestions(response.socraticQuestions || []);
        setMetadata(response.metadata);
        setState(service.getState());

        return response;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        setError(errorMsg);
        throw err;
      } finally {
        setState((prev) => ({ ...prev, isQuerying: false }));
      }
    },
    [
      getService,
      state.status,
      initialize,
      defaultScope,
      defaultSearchOptions,
      answerMode,
      includeSocratic,
    ]
  );

  // Streaming query
  const queryStream = useCallback(
    async (
      question: string,
      queryOptions?: Partial<OracleQueryRequest>,
      callbacks?: {
        onText?: (text: string) => void;
        onCitation?: (citation: Citation) => void;
        onSocratic?: (question: SocraticQuestion) => void;
        onDone?: (response: Partial<OracleQueryResponse>) => void;
        onError?: (error: string) => void;
      }
    ): Promise<void> => {
      const service = getService();

      if (state.status !== 'ready') {
        await initialize();
      }

      // Clear previous state
      setAnswer('');
      setCitations([]);
      setSocraticQuestions([]);
      setMetadata(null);
      setError(null);
      setIsStreaming(true);
      setState((prev) => ({ ...prev, isQuerying: true }));

      // Create abort controller for this stream
      abortControllerRef.current = new AbortController();

      try {
        const request: OracleQueryRequest = {
          question,
          scope: queryOptions?.scope ?? defaultScope,
          searchOptions: {
            ...defaultSearchOptions,
            ...queryOptions?.searchOptions,
          },
          answerOptions: {
            mode: answerMode,
            stream: true,
            includeSocratic,
            ...queryOptions?.answerOptions,
          },
          ...queryOptions,
        };

        let fullAnswer = '';
        const allCitations: Citation[] = [];
        const allSocratic: SocraticQuestion[] = [];
        let finalMetadata: OracleQueryResponse['metadata'] | null = null;

        for await (const chunk of service.queryStream(request)) {
          // Check if aborted
          if (abortControllerRef.current?.signal.aborted) {
            break;
          }

          switch (chunk.type) {
            case 'text':
              if (chunk.content) {
                fullAnswer += chunk.content;
                setAnswer(fullAnswer);
                callbacks?.onText?.(chunk.content);
              }
              break;

            case 'citation':
              if (chunk.citation) {
                allCitations.push(chunk.citation);
                setCitations([...allCitations]);
                callbacks?.onCitation?.(chunk.citation);
              }
              break;

            case 'socratic':
              if (chunk.socraticQuestion) {
                allSocratic.push(chunk.socraticQuestion);
                setSocraticQuestions([...allSocratic]);
                callbacks?.onSocratic?.(chunk.socraticQuestion);
              }
              break;

            case 'metadata':
              if (chunk.metadata) {
                finalMetadata = { ...finalMetadata, ...chunk.metadata } as OracleQueryResponse['metadata'];
                setMetadata(finalMetadata);
              }
              break;

            case 'error':
              if (chunk.error) {
                setError(chunk.error);
                callbacks?.onError?.(chunk.error);
              }
              break;

            case 'done':
              callbacks?.onDone?.({
                answer: fullAnswer,
                citations: allCitations,
                socraticQuestions: allSocratic,
                metadata: finalMetadata || undefined,
              });
              break;
          }
        }

        setState(service.getState());
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        setError(errorMsg);
        callbacks?.onError?.(errorMsg);
      } finally {
        setIsStreaming(false);
        setState((prev) => ({ ...prev, isQuerying: false }));
        abortControllerRef.current = null;
      }
    },
    [
      getService,
      state.status,
      initialize,
      defaultScope,
      defaultSearchOptions,
      answerMode,
      includeSocratic,
    ]
  );

  // Clear current answer
  const clear = useCallback(() => {
    setAnswer('');
    setCitations([]);
    setSocraticQuestions([]);
    setMetadata(null);
    setError(null);
  }, []);

  // Stop streaming
  const stopStream = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsStreaming(false);
    setState((prev) => ({ ...prev, isQuerying: false }));
  }, []);

  return {
    state,
    status: state.status,
    isReady: state.status === 'ready',
    isQuerying: state.isQuerying,
    isStreaming,
    answer,
    citations,
    socraticQuestions,
    metadata,
    error,
    initialize,
    query,
    queryStream,
    clear,
    stopStream,
  };
}

// ============================================================================
// Context-Aware Hook
// ============================================================================

/**
 * Hook for context-aware Oracle queries
 * Automatically scopes queries to the current strand/loom/weave
 */
export function useOracleWithContext(
  context: {
    strandId?: string;
    loomId?: string;
    weaveId?: string;
    tags?: string[];
  },
  options?: Omit<UseOracleOptions, 'defaultScope'>
): UseOracleReturn {
  return useOracle({
    ...options,
    defaultScope: {
      strandId: context.strandId,
      loomId: context.loomId,
      weaveId: context.weaveId,
      tags: context.tags,
    },
  });
}

// ============================================================================
// Simple Query Hook
// ============================================================================

/**
 * Simplified hook for one-off queries
 */
export function useOracleQuery(question: string | null, options?: UseOracleOptions) {
  const oracle = useOracle({ ...options, autoInit: !!question });

  useEffect(() => {
    if (question && oracle.isReady && !oracle.isQuerying) {
      if (options?.streaming !== false) {
        oracle.queryStream(question);
      } else {
        oracle.query(question);
      }
    }
  }, [question, oracle.isReady]);

  return oracle;
}

