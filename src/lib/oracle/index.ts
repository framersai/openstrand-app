/**
 * Oracle Q&A Module
 *
 * Client-side question answering with graceful fallbacks.
 *
 * @module lib/oracle
 * @author OpenStrand <team@frame.dev>
 * @since 2.0.0
 */

// Types
export type {
  EmbeddingBackend,
  BackendStatus,
  EmbeddingEngineConfig,
  DocumentChunk,
  PrecomputedEmbeddings,
  SearchMethod,
  ScoredResult,
  SearchOptions,
  OracleQueryRequest,
  OracleQueryResponse,
  OracleStreamChunk,
  OracleState,
  OracleStatus,
  OracleCostEstimate,
  Citation,
  SocraticQuestion,
  EmbeddingStrategyConfig,
} from '@/types/oracle';

// Embedding Engine
export {
  HybridEmbeddingEngine,
  getEmbeddingEngine,
  resetEmbeddingEngine,
} from './embedding-engine';

// Semantic Search
export {
  SemanticSearchEngine,
  getSearchEngine,
  resetSearchEngine,
} from './semantic-search';

// Oracle Service
export {
  OracleService,
  getOracleService,
  resetOracleService,
} from './oracle-service';

