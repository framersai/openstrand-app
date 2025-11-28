/**
 * @module shared/constants
 * @description Shared constants for the OpenStrand frontend.
 * This file mirrors the Python constants for frontend usage.
 */

// ============================================================================
// Visualization Types
// ============================================================================

export const VISUALIZATION_TYPES = [
  'bar',
  'line',
  'pie',
  'scatter',
  'table',
  'doughnut',
  'radar',
  'heatmap',
  'bubble',
] as const;

export type VisualizationType = typeof VISUALIZATION_TYPES[number];

// ============================================================================
// LLM Providers
// ============================================================================

export const LLM_PROVIDERS = {
  openrouter: {
    name: 'OpenRouter',
    description: 'Access to 50+ models with unified billing',
    models: [
      'openai/gpt-3.5-turbo',
      'openai/gpt-4',
      'anthropic/claude-3-opus',
      'anthropic/claude-3-sonnet',
      'google/gemini-pro',
      'meta-llama/llama-2-70b-chat',
    ],
    defaultModel: 'openai/gpt-3.5-turbo',
  },
  openai: {
    name: 'OpenAI',
    description: 'Direct access to GPT models',
    models: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo-preview'],
    defaultModel: 'gpt-3.5-turbo',
  },
  anthropic: {
    name: 'Anthropic',
    description: 'Claude models for complex reasoning',
    models: [
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229',
      'claude-3-haiku-20240307',
    ],
    defaultModel: 'claude-3-sonnet-20240229',
  },
} as const;

export type LLMProvider = keyof typeof LLM_PROVIDERS;

// ============================================================================
// Cost Pricing (per 1M tokens)
// ============================================================================

export const LLM_PRICING = {
  openrouter: {
    'openai/gpt-4': { input: 30.0, output: 60.0 },
    'openai/gpt-3.5-turbo': { input: 0.5, output: 1.5 },
    'anthropic/claude-3-opus': { input: 15.0, output: 75.0 },
    'anthropic/claude-3-sonnet': { input: 3.0, output: 15.0 },
    'google/gemini-pro': { input: 0.5, output: 1.5 },
    'meta-llama/llama-2-70b-chat': { input: 0.7, output: 0.9 },
  },
  openai: {
    'gpt-4': { input: 30.0, output: 60.0 },
    'gpt-4-turbo-preview': { input: 10.0, output: 30.0 },
    'gpt-3.5-turbo': { input: 0.5, output: 1.5 },
  },
  anthropic: {
    'claude-3-opus-20240229': { input: 15.0, output: 75.0 },
    'claude-3-sonnet-20240229': { input: 3.0, output: 15.0 },
    'claude-3-haiku-20240307': { input: 0.25, output: 1.25 },
  },
};

// ============================================================================
// Data Processing
// ============================================================================

export const MAX_FILE_SIZE_MB = 50;
export const MAX_DATASET_ROWS = 100000;
export const PREVIEW_ROWS = 5;
export const SUPPORTED_FILE_TYPES = ['.csv', '.tsv', '.txt'];

export const COLUMN_TYPE_MAP = {
  int64: 'number',
  float64: 'number',
  object: 'string',
  bool: 'boolean',
  datetime64: 'date',
  category: 'category',
} as const;

// ============================================================================
// Heuristic Patterns
// ============================================================================

export const HEURISTIC_PATTERNS = {
  pie_chart: {
    keywords: ['pie chart', 'pie', 'breakdown', 'distribution', 'percentage', 'composition'],
    confidence: 0.85,
  },
  bar_chart: {
    keywords: ['bar chart', 'bar', 'comparison', 'compare', 'top', 'bottom', 'ranking'],
    confidence: 0.8,
  },
  line_chart: {
    keywords: ['line chart', 'line', 'trend', 'over time', 'timeline', 'progression', 'evolution'],
    confidence: 0.8,
  },
  scatter_plot: {
    keywords: ['scatter', 'correlation', 'relationship', 'vs', 'versus', 'against', 'compare'],
    confidence: 0.85,
  },
  table: {
    keywords: ['table', 'list', 'show all', 'display', 'tabular', 'spreadsheet', 'grid'],
    confidence: 0.9,
  },
};

// ============================================================================
// Chart Colors
// ============================================================================

export const DEFAULT_CHART_COLORS = [
  'rgba(54, 162, 235, 0.8)', // Blue
  'rgba(255, 99, 132, 0.8)', // Red
  'rgba(75, 192, 192, 0.8)', // Teal
  'rgba(255, 206, 86, 0.8)', // Yellow
  'rgba(153, 102, 255, 0.8)', // Purple
  'rgba(255, 159, 64, 0.8)', // Orange
  'rgba(46, 204, 113, 0.8)', // Green
  'rgba(231, 76, 60, 0.8)', // Dark Red
  'rgba(52, 152, 219, 0.8)', // Light Blue
  'rgba(155, 89, 182, 0.8)', // Violet
];

// ============================================================================
// API Endpoints
// ============================================================================

export const API_ENDPOINTS = {
  health: '/',
  config: '/config',
  upload: '/upload',
  loadDefault: '/load-default',
  visualize: '/visualizations',
  costs: '/costs',
  datasets: '/datasets',
  visualizations: '/visualizations',
} as const;

// ============================================================================
// Error Codes
// ============================================================================

export const ERROR_CODES = {
  NO_DATASET: 'E001',
  INVALID_FILE: 'E002',
  FILE_TOO_LARGE: 'E003',
  NO_PROVIDERS: 'E004',
  COST_LIMIT_EXCEEDED: 'E005',
  INVALID_PROMPT: 'E006',
  VISUALIZATION_FAILED: 'E007',
  LLM_ERROR: 'E008',
  PARSING_ERROR: 'E009',
  TIMEOUT: 'E010',
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];

// ============================================================================
// Limits
// ============================================================================

export const LIMITS = {
  maxPromptLength: 1000,
  maxVisualizationsPerSession: 100,
  maxCostPerRequest: 0.1,
  maxCostPerSession: 5.0,
  maxApiTimeout: 30000, // milliseconds
  maxFileUploadTimeout: 60000, // milliseconds
  maxChartDataPoints: 10000,
  maxTableRows: 1000,
};

// ============================================================================
// Default Messages
// ============================================================================

export const MESSAGES = {
  welcome: 'Welcome to OpenStrand! Upload a strand or choose a featured dataset to get started.',
  noDataset: 'Please upload a dataset or load the default dataset first.',
  processing: 'Processing your request...',
  visualizationReady: 'Your visualization is ready!',
  errorGeneric: 'An error occurred. Please try again.',
  costWarning: 'Warning: This request may incur higher costs.',
  heuristicMatch: 'Using pattern matching (no LLM cost).',
  providerFallback: 'Primary provider failed, trying fallback...',
  sessionLimit: 'Session cost limit reached. Please start a new session.',
};

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validate visualization type
 */
export function isValidVisualizationType(type: string): type is VisualizationType {
  return VISUALIZATION_TYPES.includes(type as VisualizationType);
}

/**
 * Validate LLM provider
 */
export function isValidProvider(provider: string): provider is LLMProvider {
  return provider in LLM_PROVIDERS;
}

/**
 * Get provider pricing
 */
export function getProviderPricing(provider: LLMProvider, model: string) {
  const providerPricing = LLM_PRICING[provider] as any;
  return providerPricing?.[model] || { input: 1.0, output: 2.0 };
}

/**
 * Calculate token cost
 */
export function calculateTokenCost(
  provider: LLMProvider,
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const pricing = getProviderPricing(provider, model);
  const inputCost = (inputTokens / 1_000_000) * pricing.input;
  const outputCost = (outputTokens / 1_000_000) * pricing.output;
  return inputCost + outputCost;
}
