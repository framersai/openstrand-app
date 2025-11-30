/**
 * Hybrid Embedding Engine
 *
 * Client-side embedding engine with graceful fallbacks.
 * Tries backends in order of performance until one succeeds.
 *
 * Fallback chain:
 * 1. ONNX Runtime Web + WebGPU (fastest, ~10ms)
 * 2. ONNX Runtime Web + WASM-SIMD (~50ms)
 * 3. ONNX Runtime Web + WASM (~100ms)
 * 4. Transformers.js (~200-500ms)
 * 5. Backend API (network dependent)
 * 6. Lexical search only (no embeddings)
 *
 * @module lib/oracle/embedding-engine
 * @author OpenStrand <team@frame.dev>
 * @since 2.0.0
 */

import type {
  EmbeddingBackend,
  BackendStatus,
  EmbeddingEngineConfig,
} from '@/types/oracle';
import { logger } from '@/lib/logger';

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_CONFIG: EmbeddingEngineConfig = {
  model: 'all-MiniLM-L6-v2',
  dimensions: 384,
  maxSeqLength: 512,
  modelPath: '/models/minilm-l6-v2/',
  wasmPath: '/onnx-wasm/',
  enableWebGPU: true,
  enableSIMD: true,
  transformersCDN: 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.0.0/+esm',
  backendApiUrl: '/api/v1/oracle/embed',
  queryCacheSize: 100,
};

// ============================================================================
// Types for dynamic imports
// ============================================================================

type OrtModule = typeof import('onnxruntime-web');
type InferenceSession = import('onnxruntime-web').InferenceSession;
type TransformersPipeline = any; // Dynamic import

// ============================================================================
// LRU Cache for Query Embeddings
// ============================================================================

class LRUCache<K, V> {
  private cache = new Map<K, V>();
  private maxSize: number;

  constructor(maxSize: number) {
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      // Move to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Delete oldest (first) entry
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, value);
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }
}

// ============================================================================
// Hybrid Embedding Engine
// ============================================================================

export class HybridEmbeddingEngine {
  private config: EmbeddingEngineConfig;
  private status: BackendStatus;
  private ortSession: InferenceSession | null = null;
  private ortModule: OrtModule | null = null;
  private transformersPipeline: TransformersPipeline | null = null;
  private queryCache: LRUCache<string, Float32Array>;
  private initialized = false;
  private initializing = false;

  constructor(config: Partial<EmbeddingEngineConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.queryCache = new LRUCache(this.config.queryCacheSize);
    this.status = {
      available: [],
      active: null,
      fallbackChain: [],
      performance: [],
      errors: [],
    };
  }

  // ==========================================================================
  // Public API
  // ==========================================================================

  /**
   * Initialize the embedding engine
   * Tries backends in order and sets up the first available one
   */
  async initialize(): Promise<BackendStatus> {
    if (this.initialized) {
      return this.status;
    }

    if (this.initializing) {
      // Wait for ongoing initialization
      while (this.initializing) {
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      return this.status;
    }

    this.initializing = true;
    logger.info('[EmbedEngine] Starting initialization...');

    try {
      // Build fallback chain based on config
      const fallbackChain: EmbeddingBackend[] = [];

      if (this.config.enableWebGPU) {
        fallbackChain.push('ort-webgpu');
      }
      if (this.config.enableSIMD) {
        fallbackChain.push('ort-wasm-simd');
      }
      fallbackChain.push('ort-wasm', 'transformers-js', 'backend-api', 'lexical-only');

      this.status.fallbackChain = fallbackChain;

      // Try each backend in order
      for (const backend of fallbackChain) {
        try {
          const success = await this.tryInitBackend(backend);
          if (success) {
            this.status.available.push(backend);
            if (!this.status.active) {
              this.status.active = backend;
              logger.info(`[EmbedEngine] ✓ Active backend: ${backend}`);
            }
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          this.status.errors.push({
            backend,
            error: errorMsg,
            timestamp: new Date().toISOString(),
          });
          logger.warn(`[EmbedEngine] ✗ Backend ${backend} failed: ${errorMsg}`);
        }
      }

      // Always have lexical-only as fallback
      if (!this.status.available.includes('lexical-only')) {
        this.status.available.push('lexical-only');
      }

      if (!this.status.active) {
        this.status.active = 'lexical-only';
        logger.warn('[EmbedEngine] ⚠ No embedding backend available, using lexical search only');
      }

      this.initialized = true;
      return this.status;
    } finally {
      this.initializing = false;
    }
  }

  /**
   * Generate embedding for a single text
   */
  async embed(text: string): Promise<Float32Array> {
    if (!this.initialized) {
      await this.initialize();
    }

    // Check cache first
    const cached = this.queryCache.get(text);
    if (cached) {
      return cached;
    }

    const startTime = performance.now();
    let embedding: Float32Array;

    try {
      switch (this.status.active) {
        case 'ort-webgpu':
        case 'ort-wasm-simd':
        case 'ort-wasm':
          embedding = await this.embedWithORT(text);
          break;
        case 'transformers-js':
          embedding = await this.embedWithTransformers(text);
          break;
        case 'backend-api':
          embedding = await this.embedWithBackendAPI(text);
          break;
        case 'lexical-only':
        default:
          // Return zero vector for lexical-only mode
          embedding = new Float32Array(this.config.dimensions);
          break;
      }

      // Update performance metrics
      const latency = performance.now() - startTime;
      this.updatePerformanceMetrics(this.status.active!, latency);

      // Cache the result
      this.queryCache.set(text, embedding);

      return embedding;
    } catch (error) {
      logger.error(`[EmbedEngine] Embedding failed with ${this.status.active}:`, error);

      // Try fallback
      const currentIndex = this.status.fallbackChain.indexOf(this.status.active!);
      const nextBackend = this.status.fallbackChain[currentIndex + 1];

      if (nextBackend && nextBackend !== 'lexical-only') {
        logger.info(`[EmbedEngine] Falling back to ${nextBackend}`);
        this.status.active = nextBackend;
        return this.embed(text); // Retry with next backend
      }

      // Final fallback: zero vector
      return new Float32Array(this.config.dimensions);
    }
  }

  /**
   * Generate embeddings for multiple texts (batch)
   */
  async embedBatch(texts: string[]): Promise<Float32Array[]> {
    // For now, process sequentially
    // TODO: Implement true batching for ORT
    const embeddings: Float32Array[] = [];
    for (const text of texts) {
      embeddings.push(await this.embed(text));
    }
    return embeddings;
  }

  /**
   * Get current status
   */
  getStatus(): BackendStatus {
    return { ...this.status };
  }

  /**
   * Check if semantic search is available
   */
  isSemanticAvailable(): boolean {
    return this.status.active !== 'lexical-only';
  }

  /**
   * Get embedding dimensions
   */
  getDimensions(): number {
    return this.config.dimensions;
  }

  /**
   * Clear query cache
   */
  clearCache(): void {
    this.queryCache.clear();
  }

  /**
   * Dispose resources
   */
  async dispose(): Promise<void> {
    if (this.ortSession) {
      await this.ortSession.release();
      this.ortSession = null;
    }
    this.transformersPipeline = null;
    this.queryCache.clear();
    this.initialized = false;
  }

  // ==========================================================================
  // Backend Initialization
  // ==========================================================================

  private async tryInitBackend(backend: EmbeddingBackend): Promise<boolean> {
    switch (backend) {
      case 'ort-webgpu':
        return this.initORTWebGPU();
      case 'ort-wasm-simd':
        return this.initORTWasmSIMD();
      case 'ort-wasm':
        return this.initORTWasm();
      case 'transformers-js':
        return this.initTransformersJS();
      case 'backend-api':
        return this.checkBackendAPI();
      case 'lexical-only':
        return true;
      default:
        return false;
    }
  }

  private async initORTWebGPU(): Promise<boolean> {
    // Check WebGPU availability
    if (typeof navigator === 'undefined' || !('gpu' in navigator)) {
      throw new Error('WebGPU not available');
    }

    const gpu = (navigator as any).gpu;
    const adapter = await gpu.requestAdapter();
    if (!adapter) {
      throw new Error('No WebGPU adapter found');
    }

    // Load ONNX Runtime
    if (!this.ortModule) {
      this.ortModule = await this.loadONNXRuntime();
    }

    // Configure for WebGPU
    this.ortModule.env.wasm.wasmPaths = this.config.wasmPath;

    // Create session with WebGPU EP
    const modelUrl = `${this.config.modelPath}model.onnx`;
    this.ortSession = await this.ortModule.InferenceSession.create(modelUrl, {
      executionProviders: ['webgpu', 'wasm'],
    });

    return true;
  }

  private async initORTWasmSIMD(): Promise<boolean> {
    // Check SIMD support
    const hasSIMD = await this.checkSIMDSupport();
    if (!hasSIMD) {
      throw new Error('SIMD not supported');
    }

    if (!this.ortModule) {
      this.ortModule = await this.loadONNXRuntime();
    }

    this.ortModule.env.wasm.wasmPaths = this.config.wasmPath;
    this.ortModule.env.wasm.numThreads = Math.min(navigator.hardwareConcurrency || 4, 4);
    this.ortModule.env.wasm.simd = true;

    const modelUrl = `${this.config.modelPath}model.onnx`;
    this.ortSession = await this.ortModule.InferenceSession.create(modelUrl, {
      executionProviders: ['wasm'],
    });

    return true;
  }

  private async initORTWasm(): Promise<boolean> {
    if (!this.ortModule) {
      this.ortModule = await this.loadONNXRuntime();
    }

    this.ortModule.env.wasm.wasmPaths = this.config.wasmPath;
    this.ortModule.env.wasm.numThreads = 1;
    this.ortModule.env.wasm.simd = false;

    const modelUrl = `${this.config.modelPath}model.onnx`;
    this.ortSession = await this.ortModule.InferenceSession.create(modelUrl, {
      executionProviders: ['wasm'],
    });

    return true;
  }

  private async initTransformersJS(): Promise<boolean> {
    try {
      // Try bundled import first
      const transformers = await import('@huggingface/transformers');
      const pipeline = transformers.pipeline || (transformers as any).default?.pipeline;

      if (pipeline) {
        this.transformersPipeline = await pipeline(
          'feature-extraction',
          'Xenova/all-MiniLM-L6-v2',
          { quantized: true }
        );
        return true;
      }
    } catch {
      logger.debug('[EmbedEngine] Bundled transformers.js import failed, trying CDN...');
    }

    // Try CDN fallback
    try {
      const transformers = await import(/* @vite-ignore */ this.config.transformersCDN);
      const pipeline = transformers.pipeline || (transformers as any).default?.pipeline;

      if (pipeline) {
        this.transformersPipeline = await pipeline(
          'feature-extraction',
          'Xenova/all-MiniLM-L6-v2',
          { quantized: true }
        );
        return true;
      }
    } catch (error) {
      throw new Error(`Transformers.js CDN fallback failed: ${error}`);
    }

    throw new Error('Could not initialize Transformers.js pipeline');
  }

  private async checkBackendAPI(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.backendApiUrl}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  // ==========================================================================
  // Embedding Methods
  // ==========================================================================

  private async embedWithORT(text: string): Promise<Float32Array> {
    if (!this.ortSession || !this.ortModule) {
      throw new Error('ORT session not initialized');
    }

    // Tokenize (simple whitespace tokenization for now)
    // TODO: Use proper tokenizer
    const tokens = this.simpleTokenize(text);

    // Create input tensors
    const inputIds = new BigInt64Array(tokens.map((t) => BigInt(t)));
    const attentionMask = new BigInt64Array(tokens.map(() => BigInt(1)));
    const tokenTypeIds = new BigInt64Array(tokens.length).fill(BigInt(0));

    const feeds = {
      input_ids: new this.ortModule.Tensor('int64', inputIds, [1, tokens.length]),
      attention_mask: new this.ortModule.Tensor('int64', attentionMask, [1, tokens.length]),
      token_type_ids: new this.ortModule.Tensor('int64', tokenTypeIds, [1, tokens.length]),
    };

    const results = await this.ortSession.run(feeds);
    const output = results['last_hidden_state'] || results[Object.keys(results)[0]];

    // Mean pooling
    const embedding = this.meanPooling(output.data as Float32Array, tokens.length);
    return this.normalize(embedding);
  }

  private async embedWithTransformers(text: string): Promise<Float32Array> {
    if (!this.transformersPipeline) {
      throw new Error('Transformers pipeline not initialized');
    }

    const output = await this.transformersPipeline(text, {
      pooling: 'mean',
      normalize: true,
    });

    return new Float32Array(output.data);
  }

  private async embedWithBackendAPI(text: string): Promise<Float32Array> {
    const response = await fetch(this.config.backendApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.statusText}`);
    }

    const data = await response.json();
    return new Float32Array(data.embedding);
  }

  // ==========================================================================
  // Helper Methods
  // ==========================================================================

  private async loadONNXRuntime(): Promise<OrtModule> {
    try {
      return await import('onnxruntime-web');
    } catch {
      throw new Error('Failed to load ONNX Runtime Web');
    }
  }

  private async checkSIMDSupport(): Promise<boolean> {
    try {
      // Test SIMD support with a minimal WASM module
      const simdTest = new Uint8Array([
        0, 97, 115, 109, 1, 0, 0, 0, 1, 5, 1, 96, 0, 1, 123, 3, 2, 1, 0, 10, 10, 1, 8, 0, 65, 0,
        253, 15, 253, 98, 11,
      ]);
      return WebAssembly.validate(simdTest);
    } catch {
      return false;
    }
  }

  private simpleTokenize(text: string): number[] {
    // Simplified tokenization for MiniLM
    // In production, use a proper tokenizer (e.g., from transformers.js)
    const words = text.toLowerCase().split(/\s+/).filter(Boolean);
    const tokens: number[] = [101]; // [CLS]

    for (const word of words) {
      // Simple hash-based token ID (placeholder)
      let hash = 0;
      for (let i = 0; i < word.length; i++) {
        hash = (hash << 5) - hash + word.charCodeAt(i);
        hash = hash & hash;
      }
      tokens.push(Math.abs(hash % 30000) + 1000);
    }

    tokens.push(102); // [SEP]

    // Truncate to max length
    if (tokens.length > this.config.maxSeqLength) {
      tokens.length = this.config.maxSeqLength - 1;
      tokens.push(102);
    }

    return tokens;
  }

  private meanPooling(embeddings: Float32Array, seqLen: number): Float32Array {
    const dims = this.config.dimensions;
    const result = new Float32Array(dims);

    for (let i = 0; i < seqLen; i++) {
      for (let j = 0; j < dims; j++) {
        result[j] += embeddings[i * dims + j];
      }
    }

    for (let j = 0; j < dims; j++) {
      result[j] /= seqLen;
    }

    return result;
  }

  private normalize(vector: Float32Array): Float32Array {
    let norm = 0;
    for (let i = 0; i < vector.length; i++) {
      norm += vector[i] * vector[i];
    }
    norm = Math.sqrt(norm);

    if (norm > 0) {
      for (let i = 0; i < vector.length; i++) {
        vector[i] /= norm;
      }
    }

    return vector;
  }

  private updatePerformanceMetrics(backend: EmbeddingBackend, latency: number): void {
    const existing = this.status.performance.find((p) => p.backend === backend);
    if (existing) {
      // Exponential moving average
      existing.avgLatencyMs = existing.avgLatencyMs * 0.9 + latency * 0.1;
      existing.lastUsed = new Date().toISOString();
    } else {
      this.status.performance.push({
        backend,
        avgLatencyMs: latency,
        lastUsed: new Date().toISOString(),
      });
    }
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let embeddingEngineInstance: HybridEmbeddingEngine | null = null;

export function getEmbeddingEngine(
  config?: Partial<EmbeddingEngineConfig>
): HybridEmbeddingEngine {
  if (!embeddingEngineInstance) {
    embeddingEngineInstance = new HybridEmbeddingEngine(config);
  }
  return embeddingEngineInstance;
}

export function resetEmbeddingEngine(): void {
  if (embeddingEngineInstance) {
    embeddingEngineInstance.dispose();
    embeddingEngineInstance = null;
  }
}

