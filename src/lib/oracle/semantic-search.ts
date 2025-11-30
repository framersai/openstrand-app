/**
 * Semantic Search Engine
 *
 * Orchestrates semantic and lexical search over pre-computed embeddings.
 * Supports hybrid search combining both methods.
 *
 * @module lib/oracle/semantic-search
 * @author OpenStrand <team@frame.dev>
 * @since 2.0.0
 */

import type {
  SearchMethod,
  SearchOptions,
  ScoredResult,
  PrecomputedEmbeddings,
  DocumentChunk,
  BackendStatus,
} from '@/types/oracle';
import { HybridEmbeddingEngine, getEmbeddingEngine } from './embedding-engine';
import { logger } from '@/lib/logger';

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_SEARCH_OPTIONS: Required<SearchOptions> = {
  topK: 10,
  minScore: 0.3,
  method: 'hybrid',
  hybridWeights: {
    semantic: 0.7,
    lexical: 0.3,
  },
  strandIds: [],
  loomIds: [],
  weaveIds: [],
  tags: [],
  types: [],
  includeMetadata: true,
};

const EMBEDDINGS_URL = '/oracle-embeddings.json';

// ============================================================================
// Lexical Search Utilities
// ============================================================================

/**
 * Simple TF-IDF implementation for lexical search
 */
class TFIDFIndex {
  private documents: Map<string, { terms: Map<string, number>; totalTerms: number }> = new Map();
  private documentFrequency: Map<string, number> = new Map();
  private totalDocuments = 0;

  addDocument(id: string, text: string): void {
    const terms = this.tokenize(text);
    const termCounts = new Map<string, number>();

    for (const term of terms) {
      termCounts.set(term, (termCounts.get(term) || 0) + 1);
    }

    // Update document frequency
    for (const term of termCounts.keys()) {
      this.documentFrequency.set(term, (this.documentFrequency.get(term) || 0) + 1);
    }

    this.documents.set(id, { terms: termCounts, totalTerms: terms.length });
    this.totalDocuments++;
  }

  search(query: string, topK: number): Array<{ id: string; score: number }> {
    const queryTerms = this.tokenize(query);
    const queryVector = new Map<string, number>();

    // Calculate query TF-IDF
    for (const term of queryTerms) {
      queryVector.set(term, (queryVector.get(term) || 0) + 1);
    }

    const scores: Array<{ id: string; score: number }> = [];

    for (const [docId, doc] of this.documents) {
      let score = 0;
      let queryNorm = 0;
      let docNorm = 0;

      for (const [term, queryTf] of queryVector) {
        const docTf = doc.terms.get(term) || 0;
        const df = this.documentFrequency.get(term) || 0;
        const idf = df > 0 ? Math.log(this.totalDocuments / df) : 0;

        const queryTfIdf = (queryTf / queryTerms.length) * idf;
        const docTfIdf = (docTf / doc.totalTerms) * idf;

        score += queryTfIdf * docTfIdf;
        queryNorm += queryTfIdf * queryTfIdf;
        docNorm += docTfIdf * docTfIdf;
      }

      // Cosine similarity
      const denom = Math.sqrt(queryNorm) * Math.sqrt(docNorm);
      const finalScore = denom > 0 ? score / denom : 0;

      if (finalScore > 0) {
        scores.push({ id: docId, score: finalScore });
      }
    }

    return scores.sort((a, b) => b.score - a.score).slice(0, topK);
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length > 2);
  }

  clear(): void {
    this.documents.clear();
    this.documentFrequency.clear();
    this.totalDocuments = 0;
  }

  get size(): number {
    return this.totalDocuments;
  }
}

// ============================================================================
// Semantic Search Engine
// ============================================================================

export class SemanticSearchEngine {
  private embeddingEngine: HybridEmbeddingEngine;
  private precomputedEmbeddings: PrecomputedEmbeddings | null = null;
  private chunkIndex: Map<string, DocumentChunk> = new Map();
  private strandIndex: Map<string, string[]> = new Map(); // strandId -> chunkIds
  private lexicalIndex: TFIDFIndex = new TFIDFIndex();
  private initialized = false;
  private initializing = false;

  constructor(embeddingEngine?: HybridEmbeddingEngine) {
    this.embeddingEngine = embeddingEngine || getEmbeddingEngine();
  }

  // ==========================================================================
  // Initialization
  // ==========================================================================

  /**
   * Initialize the search engine
   * Loads pre-computed embeddings and initializes the embedding engine
   */
  async initialize(): Promise<{ embeddingsLoaded: boolean; backendStatus: BackendStatus }> {
    if (this.initialized) {
      return {
        embeddingsLoaded: this.precomputedEmbeddings !== null,
        backendStatus: this.embeddingEngine.getStatus(),
      };
    }

    if (this.initializing) {
      while (this.initializing) {
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      return {
        embeddingsLoaded: this.precomputedEmbeddings !== null,
        backendStatus: this.embeddingEngine.getStatus(),
      };
    }

    this.initializing = true;

    try {
      // Initialize embedding engine for runtime queries
      const backendStatus = await this.embeddingEngine.initialize();
      logger.info('[SemanticSearch] Embedding engine initialized');

      // Load pre-computed embeddings
      try {
        await this.loadPrecomputedEmbeddings();
        logger.info(
          `[SemanticSearch] Loaded ${this.chunkIndex.size} chunks from pre-computed embeddings`
        );
      } catch (error) {
        logger.warn('[SemanticSearch] Failed to load pre-computed embeddings:', error);
        // Continue without pre-computed embeddings (can still do runtime embedding)
      }

      this.initialized = true;
      return {
        embeddingsLoaded: this.precomputedEmbeddings !== null,
        backendStatus,
      };
    } finally {
      this.initializing = false;
    }
  }

  /**
   * Load pre-computed embeddings from static JSON file
   */
  private async loadPrecomputedEmbeddings(): Promise<void> {
    const response = await fetch(EMBEDDINGS_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch embeddings: ${response.statusText}`);
    }

    const data: PrecomputedEmbeddings = await response.json();
    this.precomputedEmbeddings = data;

    // Build indices
    this.chunkIndex.clear();
    this.strandIndex.clear();
    this.lexicalIndex.clear();

    for (const [docPath, doc] of Object.entries(data.documents)) {
      const chunkIds: string[] = [];

      for (const chunk of doc.chunks) {
        this.chunkIndex.set(chunk.id, {
          ...chunk,
          metadata: {
            ...chunk.metadata,
            title: doc.title,
            summary: doc.summary,
            type: doc.type,
            tags: doc.tags,
          },
        });
        chunkIds.push(chunk.id);

        // Add to lexical index
        this.lexicalIndex.addDocument(chunk.id, chunk.text);
      }

      this.strandIndex.set(doc.strandId, chunkIds);
    }
  }

  // ==========================================================================
  // Search Methods
  // ==========================================================================

  /**
   * Perform search with the configured method
   */
  async search(query: string, options: SearchOptions = {}): Promise<ScoredResult[]> {
    if (!this.initialized) {
      await this.initialize();
    }

    const opts = { ...DEFAULT_SEARCH_OPTIONS, ...options };
    const method = this.determineSearchMethod(opts.method);

    logger.debug(`[SemanticSearch] Searching with method: ${method}, query: "${query}"`);

    let results: ScoredResult[];

    switch (method) {
      case 'semantic':
        results = await this.semanticSearch(query, opts);
        break;
      case 'lexical':
        results = this.lexicalSearch(query, opts);
        break;
      case 'hybrid':
      default:
        results = await this.hybridSearch(query, opts);
        break;
    }

    // Apply filters
    results = this.applyFilters(results, opts);

    // Apply score threshold
    results = results.filter((r) => r.score >= opts.minScore);

    // Limit results
    results = results.slice(0, opts.topK);

    logger.debug(`[SemanticSearch] Found ${results.length} results`);
    return results;
  }

  /**
   * Semantic search using embeddings
   */
  private async semanticSearch(
    query: string,
    options: Required<SearchOptions>
  ): Promise<ScoredResult[]> {
    if (!this.embeddingEngine.isSemanticAvailable() || this.chunkIndex.size === 0) {
      logger.warn('[SemanticSearch] Semantic search unavailable, falling back to lexical');
      return this.lexicalSearch(query, options);
    }

    // Generate query embedding
    const queryEmbedding = await this.embeddingEngine.embed(query);

    // Compute cosine similarity with all chunks
    const scores: Array<{ id: string; score: number }> = [];

    for (const [chunkId, chunk] of this.chunkIndex) {
      if (!chunk.embedding || chunk.embedding.length === 0) continue;

      const chunkEmbedding = new Float32Array(chunk.embedding);
      const similarity = this.cosineSimilarity(queryEmbedding, chunkEmbedding);
      scores.push({ id: chunkId, score: similarity });
    }

    // Sort by similarity and convert to results
    return scores
      .sort((a, b) => b.score - a.score)
      .slice(0, options.topK * 2) // Get extra for filtering
      .map(({ id, score }) => this.chunkToResult(id, score, 'semantic'));
  }

  /**
   * Lexical search using TF-IDF
   */
  private lexicalSearch(
    query: string,
    options: Required<SearchOptions>
  ): ScoredResult[] {
    const results = this.lexicalIndex.search(query, options.topK * 2);
    return results.map(({ id, score }) => this.chunkToResult(id, score, 'lexical'));
  }

  /**
   * Hybrid search combining semantic and lexical
   */
  private async hybridSearch(
    query: string,
    options: Required<SearchOptions>
  ): Promise<ScoredResult[]> {
    const [semanticResults, lexicalResults] = await Promise.all([
      this.semanticSearch(query, options),
      Promise.resolve(this.lexicalSearch(query, options)),
    ]);

    // Combine results with weighted scores
    const scoreMap = new Map<string, { semantic: number; lexical: number }>();

    for (const result of semanticResults) {
      scoreMap.set(result.id, {
        semantic: result.score,
        lexical: 0,
      });
    }

    for (const result of lexicalResults) {
      const existing = scoreMap.get(result.id);
      if (existing) {
        existing.lexical = result.score;
      } else {
        scoreMap.set(result.id, {
          semantic: 0,
          lexical: result.score,
        });
      }
    }

    // Calculate hybrid scores
    const hybridResults: ScoredResult[] = [];
    const { semantic: semanticWeight, lexical: lexicalWeight } = options.hybridWeights;

    for (const [id, scores] of scoreMap) {
      const hybridScore = scores.semantic * semanticWeight + scores.lexical * lexicalWeight;
      hybridResults.push(this.chunkToResult(id, hybridScore, 'hybrid'));
    }

    return hybridResults.sort((a, b) => b.score - a.score);
  }

  // ==========================================================================
  // Helper Methods
  // ==========================================================================

  private determineSearchMethod(preferred: SearchMethod): SearchMethod {
    if (preferred === 'semantic' && !this.embeddingEngine.isSemanticAvailable()) {
      return 'lexical';
    }
    if (preferred === 'hybrid' && !this.embeddingEngine.isSemanticAvailable()) {
      return 'lexical';
    }
    return preferred;
  }

  private chunkToResult(chunkId: string, score: number, method: SearchMethod): ScoredResult {
    const chunk = this.chunkIndex.get(chunkId);
    if (!chunk) {
      return {
        id: chunkId,
        strandId: '',
        score,
        method,
        text: '',
      };
    }

    return {
      id: chunkId,
      strandId: chunk.strandId,
      score,
      method,
      text: chunk.text,
      snippet: chunk.text.slice(0, 200) + (chunk.text.length > 200 ? '...' : ''),
      title: chunk.metadata?.title as string | undefined,
      tags: chunk.metadata?.tags as string[] | undefined,
      position: chunk.position,
    };
  }

  private applyFilters(results: ScoredResult[], options: Required<SearchOptions>): ScoredResult[] {
    return results.filter((result) => {
      // Filter by strand IDs
      if (options.strandIds.length > 0 && !options.strandIds.includes(result.strandId)) {
        return false;
      }

      // Filter by tags
      if (options.tags.length > 0) {
        const resultTags = result.tags || [];
        if (!options.tags.some((tag) => resultTags.includes(tag))) {
          return false;
        }
      }

      // Filter by types
      const chunk = this.chunkIndex.get(result.id);
      if (options.types.length > 0 && chunk?.metadata?.type) {
        if (!options.types.includes(chunk.metadata.type as string)) {
          return false;
        }
      }

      return true;
    });
  }

  private cosineSimilarity(a: Float32Array, b: Float32Array): number {
    if (a.length !== b.length) return 0;

    let dot = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    return denom === 0 ? 0 : dot / denom;
  }

  // ==========================================================================
  // State Accessors
  // ==========================================================================

  isReady(): boolean {
    return this.initialized;
  }

  getChunkCount(): number {
    return this.chunkIndex.size;
  }

  getStrandCount(): number {
    return this.strandIndex.size;
  }

  getBackendStatus(): BackendStatus {
    return this.embeddingEngine.getStatus();
  }

  hasPrecomputedEmbeddings(): boolean {
    return this.precomputedEmbeddings !== null;
  }

  getEmbeddingsMetadata(): Partial<PrecomputedEmbeddings> | null {
    if (!this.precomputedEmbeddings) return null;
    return {
      version: this.precomputedEmbeddings.version,
      model: this.precomputedEmbeddings.model,
      dimensions: this.precomputedEmbeddings.dimensions,
      generatedAt: this.precomputedEmbeddings.generatedAt,
      buildId: this.precomputedEmbeddings.buildId,
      documentCount: this.precomputedEmbeddings.documentCount,
      chunkCount: this.precomputedEmbeddings.chunkCount,
    };
  }

  /**
   * Get chunk by ID
   */
  getChunk(chunkId: string): DocumentChunk | undefined {
    return this.chunkIndex.get(chunkId);
  }

  /**
   * Get all chunks for a strand
   */
  getStrandChunks(strandId: string): DocumentChunk[] {
    const chunkIds = this.strandIndex.get(strandId) || [];
    return chunkIds
      .map((id) => this.chunkIndex.get(id))
      .filter((chunk): chunk is DocumentChunk => chunk !== undefined);
  }

  /**
   * Dispose resources
   */
  async dispose(): Promise<void> {
    this.chunkIndex.clear();
    this.strandIndex.clear();
    this.lexicalIndex.clear();
    this.precomputedEmbeddings = null;
    this.initialized = false;
    await this.embeddingEngine.dispose();
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let searchEngineInstance: SemanticSearchEngine | null = null;

export function getSearchEngine(): SemanticSearchEngine {
  if (!searchEngineInstance) {
    searchEngineInstance = new SemanticSearchEngine();
  }
  return searchEngineInstance;
}

export function resetSearchEngine(): void {
  if (searchEngineInstance) {
    searchEngineInstance.dispose();
    searchEngineInstance = null;
  }
}

