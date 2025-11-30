/**
 * Oracle Q&A Types
 *
 * Type definitions for the Question Answering Oracle system.
 * Supports graceful degradation across multiple embedding/search backends.
 *
 * @module types/oracle
 * @author OpenStrand <team@frame.dev>
 * @since 2.0.0
 */

// ============================================================================
// Embedding Backend Types
// ============================================================================

/**
 * Available embedding backends in order of preference
 */
export type EmbeddingBackend =
  | 'ort-webgpu'      // ONNX Runtime + WebGPU (fastest, ~10ms)
  | 'ort-wasm-simd'   // ONNX Runtime + WASM SIMD (~50ms)
  | 'ort-wasm'        // ONNX Runtime + WASM (~100ms)
  | 'transformers-js' // Hugging Face Transformers.js (~200-500ms)
  | 'backend-api'     // Server-side embedding via API
  | 'lexical-only';   // No embeddings, lexical search fallback

/**
 * Backend availability and performance status
 */
export interface BackendStatus {
  available: EmbeddingBackend[];
  active: EmbeddingBackend | null;
  fallbackChain: EmbeddingBackend[];
  performance: {
    backend: EmbeddingBackend;
    avgLatencyMs: number;
    lastUsed: string;
  }[];
  errors: {
    backend: EmbeddingBackend;
    error: string;
    timestamp: string;
  }[];
}

/**
 * Embedding engine configuration
 */
export interface EmbeddingEngineConfig {
  /** Model name (default: all-MiniLM-L6-v2) */
  model: string;
  /** Output dimensions (384 for MiniLM-L6-v2) */
  dimensions: number;
  /** Max sequence length */
  maxSeqLength: number;
  /** Path to ONNX model files */
  modelPath: string;
  /** Path to WASM runtime files */
  wasmPath: string;
  /** Enable WebGPU if available */
  enableWebGPU: boolean;
  /** Enable SIMD if available */
  enableSIMD: boolean;
  /** CDN fallback URL for Transformers.js */
  transformersCDN: string;
  /** Backend API URL for server-side embeddings */
  backendApiUrl: string;
  /** LRU cache size for query embeddings */
  queryCacheSize: number;
}

// ============================================================================
// Document & Chunk Types
// ============================================================================

/**
 * Document chunk with embedding
 */
export interface DocumentChunk {
  /** Unique chunk ID (content hash) */
  id: string;
  /** Source document/strand ID */
  strandId: string;
  /** Parent loom/scope ID */
  loomId?: string;
  /** Weave ID for graph context */
  weaveId?: string;
  /** Chunk text content */
  text: string;
  /** Position in source document */
  position: number;
  /** Token count */
  tokenCount: number;
  /** Embedding vector (Float32Array serialized) */
  embedding?: number[];
  /** Additional metadata */
  metadata?: {
    title?: string;
    summary?: string;
    tags?: string[];
    difficulty?: string;
    type?: string;
    [key: string]: unknown;
  };
}

/**
 * Pre-computed embeddings file format
 */
export interface PrecomputedEmbeddings {
  /** Schema version */
  version: string;
  /** Model used for embeddings */
  model: string;
  /** Embedding dimensions */
  dimensions: number;
  /** Generation timestamp */
  generatedAt: string;
  /** Build ID for cache invalidation */
  buildId: string;
  /** Total document count */
  documentCount: number;
  /** Total chunk count */
  chunkCount: number;
  /** Document embeddings */
  documents: Record<string, {
    strandId: string;
    title: string;
    summary?: string;
    type: string;
    tags: string[];
    chunks: DocumentChunk[];
  }>;
}

// ============================================================================
// Search Types
// ============================================================================

/**
 * Search method used
 */
export type SearchMethod = 'semantic' | 'lexical' | 'hybrid';

/**
 * Scored search result
 */
export interface ScoredResult {
  /** Chunk/document ID */
  id: string;
  /** Source strand ID */
  strandId: string;
  /** Relevance score (0-1, higher is better) */
  score: number;
  /** Search method that produced this result */
  method: SearchMethod;
  /** Result text/content */
  text: string;
  /** Preview/snippet */
  snippet?: string;
  /** Document title */
  title?: string;
  /** Document tags */
  tags?: string[];
  /** Position in original document */
  position?: number;
  /** Highlight positions for UI */
  highlights?: { start: number; end: number }[];
}

/**
 * Search options
 */
export interface SearchOptions {
  /** Number of results to return */
  topK?: number;
  /** Minimum score threshold (0-1) */
  minScore?: number;
  /** Search method preference */
  method?: SearchMethod;
  /** Hybrid search weights */
  hybridWeights?: {
    semantic: number;
    lexical: number;
  };
  /** Filter by strand IDs */
  strandIds?: string[];
  /** Filter by loom IDs */
  loomIds?: string[];
  /** Filter by weave IDs */
  weaveIds?: string[];
  /** Filter by tags */
  tags?: string[];
  /** Filter by strand types */
  types?: string[];
  /** Include metadata in results */
  includeMetadata?: boolean;
}

// ============================================================================
// Oracle Query Types
// ============================================================================

/**
 * Oracle query request
 */
export interface OracleQueryRequest {
  /** User's question */
  question: string;
  /** Context scope */
  scope?: {
    /** Current strand ID (for contextual queries) */
    strandId?: string;
    /** Current loom ID */
    loomId?: string;
    /** Current weave ID */
    weaveId?: string;
    /** Current tags for exploration */
    tags?: string[];
  };
  /** Search options */
  searchOptions?: SearchOptions;
  /** Answer generation options */
  answerOptions?: {
    /** Response mode */
    mode: 'extractive' | 'generative' | 'hybrid';
    /** Max tokens for generative response */
    maxTokens?: number;
    /** Temperature for generative response */
    temperature?: number;
    /** LLM model to use */
    model?: string;
    /** Enable streaming */
    stream?: boolean;
    /** Include citations */
    includeCitations?: boolean;
    /** Include Socratic follow-up questions */
    includeSocratic?: boolean;
    /** Language for response */
    language?: string;
  };
  /** User ID for personalization/cost tracking */
  userId?: string;
  /** Team ID for scope */
  teamId?: string;
  /** Dry run (estimate cost only) */
  dryRun?: boolean;
}

/**
 * Citation in an answer
 */
export interface Citation {
  /** Citation index [1], [2], etc. */
  index: number;
  /** Source strand ID */
  strandId: string;
  /** Source chunk ID */
  chunkId?: string;
  /** Source title */
  title: string;
  /** Cited text snippet */
  text: string;
  /** Relevance score */
  score: number;
  /** URL/path to source */
  url?: string;
}

/**
 * Socratic follow-up question
 */
export interface SocraticQuestion {
  /** Question text */
  question: string;
  /** Question type */
  type: 'clarifying' | 'deepening' | 'challenging' | 'connecting';
  /** Related topic/concept */
  relatedTopic?: string;
}

/**
 * Oracle query response
 */
export interface OracleQueryResponse {
  /** Unique query ID */
  queryId: string;
  /** Original question */
  question: string;
  /** Generated answer */
  answer: string;
  /** Answer confidence (0-1) */
  confidence: number;
  /** Response mode used */
  mode: 'extractive' | 'generative' | 'hybrid' | 'fallback';
  /** Citations */
  citations: Citation[];
  /** Related results not directly cited */
  relatedResults?: ScoredResult[];
  /** Socratic follow-up questions */
  socraticQuestions?: SocraticQuestion[];
  /** Suggested related strands */
  suggestedStrands?: {
    strandId: string;
    title: string;
    reason: string;
  }[];
  /** Processing metadata */
  metadata: {
    /** Total processing time (ms) */
    durationMs: number;
    /** Embedding backend used */
    embeddingBackend: EmbeddingBackend;
    /** Search method used */
    searchMethod: SearchMethod;
    /** Number of chunks searched */
    chunksSearched: number;
    /** Number of results retrieved */
    resultsRetrieved: number;
    /** LLM model used (if generative) */
    llmModel?: string;
    /** Token counts */
    tokens?: {
      prompt: number;
      completion: number;
      total: number;
    };
    /** Estimated cost (USD) */
    estimatedCost?: number;
  };
  /** Offline mode indicator */
  offline: boolean;
  /** Degraded mode indicator (fallback used) */
  degraded: boolean;
  /** Degradation reason if applicable */
  degradedReason?: string;
}

/**
 * Streaming chunk for generative responses
 */
export interface OracleStreamChunk {
  /** Chunk type */
  type: 'text' | 'citation' | 'socratic' | 'metadata' | 'done' | 'error';
  /** Content (for text chunks) */
  content?: string;
  /** Citation (for citation chunks) */
  citation?: Citation;
  /** Socratic question (for socratic chunks) */
  socraticQuestion?: SocraticQuestion;
  /** Metadata (for metadata chunks) */
  metadata?: Partial<OracleQueryResponse['metadata']>;
  /** Error message (for error chunks) */
  error?: string;
  /** Is final chunk */
  done?: boolean;
}

// ============================================================================
// Oracle State Types
// ============================================================================

/**
 * Oracle initialization status
 */
export type OracleStatus =
  | 'uninitialized'
  | 'initializing'
  | 'loading-model'
  | 'loading-embeddings'
  | 'ready'
  | 'error'
  | 'offline';

/**
 * Oracle state for UI
 */
export interface OracleState {
  /** Current status */
  status: OracleStatus;
  /** Status message */
  statusMessage: string;
  /** Backend status */
  backendStatus: BackendStatus | null;
  /** Whether pre-computed embeddings are loaded */
  embeddingsLoaded: boolean;
  /** Embedding count */
  embeddingCount: number;
  /** Last error */
  error: string | null;
  /** Is currently querying */
  isQuerying: boolean;
  /** Query history */
  queryHistory: {
    id: string;
    question: string;
    timestamp: string;
    success: boolean;
  }[];
}

// ============================================================================
// Cost Estimation Types
// ============================================================================

/**
 * Cost estimation for oracle query
 */
export interface OracleCostEstimate {
  /** Embedding cost */
  embedding: {
    tokens: number;
    cost: number;
    model: string;
  };
  /** LLM generation cost (if generative) */
  generation?: {
    promptTokens: number;
    completionTokens: number;
    cost: number;
    model: string;
  };
  /** Total estimated cost */
  total: number;
  /** Currency */
  currency: 'USD';
  /** Notes */
  notes: string[];
}

// ============================================================================
// Build-time vs Runtime Embedding Strategy
// ============================================================================

/**
 * Embedding strategy comparison (for documentation)
 *
 * ## Build-time Pre-computed Embeddings
 *
 * **Pros:**
 * - Zero startup latency for searches
 * - Works completely offline after initial load
 * - Consistent embeddings (same model version)
 * - No client-side compute required for documents
 * - Smaller runtime bundle (no model weights needed for docs)
 *
 * **Cons:**
 * - Requires rebuild on content changes
 * - Larger static assets (~500KB-5MB depending on corpus)
 * - Cache invalidation complexity
 * - CI/CD pipeline dependency
 *
 * ## Runtime Embeddings
 *
 * **Pros:**
 * - Always up-to-date with content
 * - No rebuild required
 * - Dynamic corpus support
 * - User-generated content embedding
 *
 * **Cons:**
 * - Cold start delay (model loading)
 * - Higher client-side compute
 * - Larger runtime bundle (model weights)
 * - Inconsistent embeddings if model updates
 *
 * ## Recommended Hybrid Approach (OpenStrand)
 *
 * 1. Pre-compute embeddings at build time for static/published content
 * 2. Generate runtime embeddings for user queries
 * 3. Lazy-embed new user content with background indexing
 * 4. Periodic re-indexing via scheduled jobs
 */
export interface EmbeddingStrategyConfig {
  /** Primary strategy */
  primary: 'build-time' | 'runtime' | 'hybrid';
  /** Build-time config */
  buildTime?: {
    /** Include in build */
    enabled: boolean;
    /** Content types to pre-embed */
    contentTypes: string[];
    /** Max documents to embed */
    maxDocuments: number;
    /** Output path */
    outputPath: string;
  };
  /** Runtime config */
  runtime?: {
    /** Enable runtime embedding */
    enabled: boolean;
    /** Background indexing */
    backgroundIndexing: boolean;
    /** Index new content automatically */
    autoIndex: boolean;
    /** Re-index interval (ms) */
    reindexInterval: number;
  };
}

