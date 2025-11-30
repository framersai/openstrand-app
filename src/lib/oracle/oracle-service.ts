/**
 * Oracle Q&A Service
 *
 * Main service for question answering with graceful fallbacks.
 * Combines semantic search, answer generation, and Socratic insights.
 *
 * @module lib/oracle/oracle-service
 * @author OpenStrand <team@frame.dev>
 * @since 2.0.0
 */

import type {
  OracleQueryRequest,
  OracleQueryResponse,
  OracleStreamChunk,
  OracleState,
  OracleStatus,
  OracleCostEstimate,
  Citation,
  SocraticQuestion,
  ScoredResult,
  BackendStatus,
} from '@/types/oracle';
import { SemanticSearchEngine, getSearchEngine } from './semantic-search';
import { logger } from '@/lib/logger';

// ============================================================================
// Constants
// ============================================================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
const OFFLINE_MODE = process.env.NEXT_PUBLIC_OFFLINE_MODE === 'true';

const DEFAULT_ANSWER_OPTIONS: Required<NonNullable<OracleQueryRequest['answerOptions']>> = {
  mode: 'hybrid',
  maxTokens: 1024,
  temperature: 0.7,
  model: 'gpt-4o-mini',
  stream: true,
  includeCitations: true,
  includeSocratic: true,
  language: 'en',
};

// ============================================================================
// Oracle Service
// ============================================================================

export class OracleService {
  private searchEngine: SemanticSearchEngine;
  private state: OracleState;
  private backendAvailable = false;

  constructor(searchEngine?: SemanticSearchEngine) {
    this.searchEngine = searchEngine || getSearchEngine();
    this.state = {
      status: 'uninitialized',
      statusMessage: 'Not initialized',
      backendStatus: null,
      embeddingsLoaded: false,
      embeddingCount: 0,
      error: null,
      isQuerying: false,
      queryHistory: [],
    };
  }

  // ==========================================================================
  // Initialization
  // ==========================================================================

  /**
   * Initialize the Oracle service
   */
  async initialize(): Promise<OracleState> {
    if (this.state.status === 'ready') {
      return this.state;
    }

    this.updateState({ status: 'initializing', statusMessage: 'Starting initialization...' });

    try {
      // Check backend availability
      this.backendAvailable = await this.checkBackendHealth();
      logger.info(`[Oracle] Backend available: ${this.backendAvailable}`);

      // Initialize search engine (loads embeddings and embedding engine)
      this.updateState({ status: 'loading-embeddings', statusMessage: 'Loading embeddings...' });
      const { embeddingsLoaded, backendStatus } = await this.searchEngine.initialize();

      this.updateState({
        status: 'ready',
        statusMessage: 'Ready',
        backendStatus,
        embeddingsLoaded,
        embeddingCount: this.searchEngine.getChunkCount(),
        error: null,
      });

      logger.info('[Oracle] Initialization complete');
      return this.state;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.updateState({
        status: 'error',
        statusMessage: `Initialization failed: ${errorMsg}`,
        error: errorMsg,
      });
      throw error;
    }
  }

  /**
   * Check if backend API is available
   */
  private async checkBackendHealth(): Promise<boolean> {
    if (OFFLINE_MODE) return false;

    try {
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  // ==========================================================================
  // Query Methods
  // ==========================================================================

  /**
   * Execute a Q&A query
   */
  async query(request: OracleQueryRequest): Promise<OracleQueryResponse> {
    if (this.state.status !== 'ready') {
      await this.initialize();
    }

    const queryId = this.generateQueryId();
    const startTime = performance.now();

    this.updateState({ isQuerying: true });

    try {
      // Merge options with defaults
      const answerOpts = { ...DEFAULT_ANSWER_OPTIONS, ...request.answerOptions };

      // If dry run, just estimate costs
      if (request.dryRun) {
        return this.estimateCost(request);
      }

      // Try backend first if available and not in extractive-only mode
      if (this.backendAvailable && answerOpts.mode !== 'extractive') {
        try {
          return await this.queryBackend(request, queryId);
        } catch (error) {
          logger.warn('[Oracle] Backend query failed, using local fallback:', error);
        }
      }

      // Local search and answer generation
      return await this.queryLocal(request, queryId, startTime);
    } finally {
      this.updateState({ isQuerying: false });
      this.addToHistory(queryId, request.question, true);
    }
  }

  /**
   * Execute a streaming Q&A query
   */
  async *queryStream(
    request: OracleQueryRequest
  ): AsyncGenerator<OracleStreamChunk, void, unknown> {
    if (this.state.status !== 'ready') {
      await this.initialize();
    }

    const queryId = this.generateQueryId();
    const startTime = performance.now();

    this.updateState({ isQuerying: true });

    try {
      const answerOpts = { ...DEFAULT_ANSWER_OPTIONS, ...request.answerOptions, stream: true };

      // Try backend streaming first
      if (this.backendAvailable && answerOpts.mode !== 'extractive') {
        try {
          yield* this.streamFromBackend(request, queryId);
          return;
        } catch (error) {
          logger.warn('[Oracle] Backend streaming failed, using local fallback:', error);
          yield {
            type: 'metadata',
            metadata: { embeddingBackend: 'lexical-only' },
          };
        }
      }

      // Local streaming fallback
      yield* this.streamLocal(request, queryId, startTime);
    } finally {
      this.updateState({ isQuerying: false });
      this.addToHistory(queryId, request.question, true);
    }
  }

  /**
   * Query using backend API
   */
  private async queryBackend(
    request: OracleQueryRequest,
    queryId: string
  ): Promise<OracleQueryResponse> {
    const response = await fetch(`${API_BASE_URL}/oracle/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...request, queryId }),
    });

    if (!response.ok) {
      throw new Error(`Backend query failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Stream from backend API
   */
  private async *streamFromBackend(
    request: OracleQueryRequest,
    queryId: string
  ): AsyncGenerator<OracleStreamChunk, void, unknown> {
    const response = await fetch(`${API_BASE_URL}/oracle/query/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...request, queryId }),
    });

    if (!response.ok) {
      throw new Error(`Backend streaming failed: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              yield { type: 'done', done: true };
              return;
            }
            try {
              yield JSON.parse(data) as OracleStreamChunk;
            } catch {
              // Ignore parse errors
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Query locally with search + extractive answer
   */
  private async queryLocal(
    request: OracleQueryRequest,
    queryId: string,
    startTime: number
  ): Promise<OracleQueryResponse> {
    const answerOpts = { ...DEFAULT_ANSWER_OPTIONS, ...request.answerOptions };

    // Perform search
    const searchResults = await this.searchEngine.search(request.question, {
      ...request.searchOptions,
      topK: answerOpts.includeCitations ? 10 : 5,
    });

    if (searchResults.length === 0) {
      return this.noResultsResponse(request, queryId, startTime);
    }

    // Generate extractive answer
    const { answer, citations } = this.generateExtractiveAnswer(
      request.question,
      searchResults,
      answerOpts
    );

    // Generate Socratic questions (simple heuristic-based)
    const socraticQuestions = answerOpts.includeSocratic
      ? this.generateSocraticQuestions(request.question, searchResults)
      : [];

    const durationMs = performance.now() - startTime;
    const backendStatus = this.searchEngine.getBackendStatus();

    return {
      queryId,
      question: request.question,
      answer,
      confidence: this.calculateConfidence(searchResults),
      mode: 'extractive',
      citations,
      relatedResults: searchResults.slice(citations.length, citations.length + 5),
      socraticQuestions,
      suggestedStrands: this.extractSuggestedStrands(searchResults),
      metadata: {
        durationMs,
        embeddingBackend: backendStatus.active || 'lexical-only',
        searchMethod: searchResults[0]?.method || 'lexical',
        chunksSearched: this.searchEngine.getChunkCount(),
        resultsRetrieved: searchResults.length,
      },
      offline: !this.backendAvailable,
      degraded: backendStatus.active === 'lexical-only',
      degradedReason: backendStatus.active === 'lexical-only'
        ? 'Using lexical search only (no embedding backend available)'
        : undefined,
    };
  }

  /**
   * Stream locally with search + extractive answer
   */
  private async *streamLocal(
    request: OracleQueryRequest,
    queryId: string,
    startTime: number
  ): AsyncGenerator<OracleStreamChunk, void, unknown> {
    const answerOpts = { ...DEFAULT_ANSWER_OPTIONS, ...request.answerOptions };

    // Perform search
    const searchResults = await this.searchEngine.search(request.question, {
      ...request.searchOptions,
      topK: answerOpts.includeCitations ? 10 : 5,
    });

    if (searchResults.length === 0) {
      yield {
        type: 'text',
        content: "I couldn't find relevant information to answer your question.",
      };
      yield { type: 'done', done: true };
      return;
    }

    // Generate extractive answer with streaming simulation
    const { answer, citations } = this.generateExtractiveAnswer(
      request.question,
      searchResults,
      answerOpts
    );

    // Stream the answer in chunks (simulating streaming for extractive mode)
    const words = answer.split(' ');
    for (let i = 0; i < words.length; i++) {
      yield {
        type: 'text',
        content: words[i] + (i < words.length - 1 ? ' ' : ''),
      };
      // Small delay for streaming effect
      await new Promise((resolve) => setTimeout(resolve, 10));
    }

    // Stream citations
    for (const citation of citations) {
      yield { type: 'citation', citation };
    }

    // Stream Socratic questions
    if (answerOpts.includeSocratic) {
      const socraticQuestions = this.generateSocraticQuestions(request.question, searchResults);
      for (const question of socraticQuestions) {
        yield { type: 'socratic', socraticQuestion: question };
      }
    }

    // Final metadata
    yield {
      type: 'metadata',
      metadata: {
        durationMs: performance.now() - startTime,
        embeddingBackend: this.searchEngine.getBackendStatus().active || 'lexical-only',
        searchMethod: searchResults[0]?.method || 'lexical',
        chunksSearched: this.searchEngine.getChunkCount(),
        resultsRetrieved: searchResults.length,
      },
    };

    yield { type: 'done', done: true };
  }

  // ==========================================================================
  // Answer Generation
  // ==========================================================================

  /**
   * Generate extractive answer from search results
   */
  private generateExtractiveAnswer(
    question: string,
    results: ScoredResult[],
    _options: typeof DEFAULT_ANSWER_OPTIONS
  ): { answer: string; citations: Citation[] } {
    if (results.length === 0) {
      return {
        answer: "I couldn't find relevant information to answer your question.",
        citations: [],
      };
    }

    // Use top results for answer
    const topResults = results.slice(0, 5);
    const citations: Citation[] = topResults.map((result, index) => ({
      index: index + 1,
      strandId: result.strandId,
      chunkId: result.id,
      title: result.title || 'Untitled',
      text: result.snippet || result.text.slice(0, 200),
      score: result.score,
    }));

    // Build extractive answer
    const contextParts = topResults
      .map((r, i) => `[${i + 1}] ${r.text}`)
      .join('\n\n');

    // Simple extractive approach: combine relevant passages
    const answer = this.buildExtractiveAnswer(question, topResults);

    return { answer, citations };
  }

  /**
   * Build extractive answer from passages
   */
  private buildExtractiveAnswer(question: string, results: ScoredResult[]): string {
    // Find the most relevant passage
    const topResult = results[0];
    if (!topResult) {
      return "I couldn't find relevant information.";
    }

    // If the question is asking "what is", provide a definition-style answer
    const questionLower = question.toLowerCase();

    if (questionLower.startsWith('what is') || questionLower.startsWith('what are')) {
      const firstSentence = topResult.text.split(/[.!?]/)[0]?.trim() || topResult.text;
      return `Based on the knowledge base: ${firstSentence}. [1]\n\nFor more details, see the related strands below.`;
    }

    // For "how to" questions, try to find steps or instructions
    if (questionLower.startsWith('how to') || questionLower.startsWith('how do')) {
      return `Here's what I found about "${question}":\n\n${topResult.text.slice(0, 500)}${topResult.text.length > 500 ? '...' : ''} [1]\n\nSee the citations for more complete instructions.`;
    }

    // Default: summarize top passages
    const summary = results
      .slice(0, 3)
      .map((r, i) => `${r.text.slice(0, 200)}${r.text.length > 200 ? '...' : ''} [${i + 1}]`)
      .join('\n\n');

    return `Based on the knowledge base:\n\n${summary}\n\nRefer to the citations for more details.`;
  }

  /**
   * Generate Socratic follow-up questions
   */
  private generateSocraticQuestions(
    question: string,
    results: ScoredResult[]
  ): SocraticQuestion[] {
    const questions: SocraticQuestion[] = [];

    // Extract topics from results
    const topics = new Set<string>();
    for (const result of results.slice(0, 5)) {
      if (result.tags) {
        result.tags.forEach((tag) => topics.add(tag));
      }
    }

    const topicList = Array.from(topics).slice(0, 3);

    // Generate clarifying question
    questions.push({
      question: `What specific aspect of "${question.slice(0, 50)}" would you like to explore further?`,
      type: 'clarifying',
    });

    // Generate deepening questions based on topics
    if (topicList.length > 0) {
      questions.push({
        question: `How does this relate to ${topicList[0]}?`,
        type: 'connecting',
        relatedTopic: topicList[0],
      });
    }

    // Add a challenging question
    questions.push({
      question: 'What assumptions might we be making here that we should question?',
      type: 'challenging',
    });

    return questions.slice(0, 3);
  }

  /**
   * Extract suggested related strands
   */
  private extractSuggestedStrands(
    results: ScoredResult[]
  ): OracleQueryResponse['suggestedStrands'] {
    const seen = new Set<string>();
    const suggestions: OracleQueryResponse['suggestedStrands'] = [];

    for (const result of results.slice(5, 10)) {
      if (result.strandId && !seen.has(result.strandId)) {
        seen.add(result.strandId);
        suggestions.push({
          strandId: result.strandId,
          title: result.title || 'Untitled',
          reason: `Related content (${Math.round(result.score * 100)}% match)`,
        });
      }
    }

    return suggestions.slice(0, 5);
  }

  /**
   * Calculate answer confidence from search scores
   */
  private calculateConfidence(results: ScoredResult[]): number {
    if (results.length === 0) return 0;

    // Use average of top 3 scores
    const topScores = results.slice(0, 3).map((r) => r.score);
    return topScores.reduce((a, b) => a + b, 0) / topScores.length;
  }

  /**
   * Generate response for no results
   */
  private noResultsResponse(
    request: OracleQueryRequest,
    queryId: string,
    startTime: number
  ): OracleQueryResponse {
    return {
      queryId,
      question: request.question,
      answer: "I couldn't find relevant information to answer your question. Try rephrasing or asking about a different topic.",
      confidence: 0,
      mode: 'fallback',
      citations: [],
      socraticQuestions: [
        {
          question: 'Could you rephrase your question or provide more context?',
          type: 'clarifying',
        },
      ],
      metadata: {
        durationMs: performance.now() - startTime,
        embeddingBackend: this.searchEngine.getBackendStatus().active || 'lexical-only',
        searchMethod: 'hybrid',
        chunksSearched: this.searchEngine.getChunkCount(),
        resultsRetrieved: 0,
      },
      offline: !this.backendAvailable,
      degraded: true,
      degradedReason: 'No relevant results found',
    };
  }

  // ==========================================================================
  // Cost Estimation
  // ==========================================================================

  /**
   * Estimate cost for a query (dry run)
   */
  private async estimateCost(request: OracleQueryRequest): Promise<OracleQueryResponse> {
    const answerOpts = { ...DEFAULT_ANSWER_OPTIONS, ...request.answerOptions };

    // Estimate embedding cost (for query)
    const queryTokens = Math.ceil(request.question.length / 4);

    // Estimate generation cost if generative mode
    let generationCost = 0;
    if (answerOpts.mode === 'generative' || answerOpts.mode === 'hybrid') {
      const promptTokens = queryTokens + 2000; // Context + system prompt
      const completionTokens = answerOpts.maxTokens;
      generationCost = (promptTokens * 0.00001 + completionTokens * 0.00003); // GPT-4o-mini pricing
    }

    const estimate: OracleCostEstimate = {
      embedding: {
        tokens: queryTokens,
        cost: queryTokens * 0.0000001, // text-embedding-3-small pricing
        model: 'text-embedding-3-small',
      },
      generation: answerOpts.mode !== 'extractive' ? {
        promptTokens: 2000,
        completionTokens: answerOpts.maxTokens,
        cost: generationCost,
        model: answerOpts.model,
      } : undefined,
      total: queryTokens * 0.0000001 + generationCost,
      currency: 'USD',
      notes: [
        answerOpts.mode === 'extractive' ? 'Extractive mode: no LLM cost' : 'Includes LLM generation',
        'Estimate based on text-embedding-3-small + GPT-4o-mini pricing',
      ],
    };

    return {
      queryId: this.generateQueryId(),
      question: request.question,
      answer: '',
      confidence: 0,
      mode: 'extractive',
      citations: [],
      metadata: {
        durationMs: 0,
        embeddingBackend: this.searchEngine.getBackendStatus().active || 'lexical-only',
        searchMethod: 'hybrid',
        chunksSearched: this.searchEngine.getChunkCount(),
        resultsRetrieved: 0,
        estimatedCost: estimate.total,
      },
      offline: !this.backendAvailable,
      degraded: false,
    };
  }

  // ==========================================================================
  // State Management
  // ==========================================================================

  private updateState(updates: Partial<OracleState>): void {
    this.state = { ...this.state, ...updates };
  }

  private addToHistory(queryId: string, question: string, success: boolean): void {
    this.state.queryHistory = [
      { id: queryId, question, timestamp: new Date().toISOString(), success },
      ...this.state.queryHistory.slice(0, 99),
    ];
  }

  private generateQueryId(): string {
    return `q_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  // ==========================================================================
  // Public State Accessors
  // ==========================================================================

  getState(): OracleState {
    return { ...this.state };
  }

  getStatus(): OracleStatus {
    return this.state.status;
  }

  isReady(): boolean {
    return this.state.status === 'ready';
  }

  isBackendAvailable(): boolean {
    return this.backendAvailable;
  }

  getBackendStatus(): BackendStatus | null {
    return this.state.backendStatus;
  }

  getQueryHistory(): OracleState['queryHistory'] {
    return [...this.state.queryHistory];
  }

  /**
   * Dispose resources
   */
  async dispose(): Promise<void> {
    await this.searchEngine.dispose();
    this.state = {
      status: 'uninitialized',
      statusMessage: 'Disposed',
      backendStatus: null,
      embeddingsLoaded: false,
      embeddingCount: 0,
      error: null,
      isQuerying: false,
      queryHistory: [],
    };
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let oracleServiceInstance: OracleService | null = null;

export function getOracleService(): OracleService {
  if (!oracleServiceInstance) {
    oracleServiceInstance = new OracleService();
  }
  return oracleServiceInstance;
}

export function resetOracleService(): void {
  if (oracleServiceInstance) {
    oracleServiceInstance.dispose();
    oracleServiceInstance = null;
  }
}

