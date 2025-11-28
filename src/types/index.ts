/**
 * @module types/index
 * @description Core type definitions for the AI-powered data visualization platform.
 * This file serves as the single source of truth for all TypeScript types used
 * across the application, ensuring type safety and consistency.
 */

// ============================================================================
// Data Types
// ============================================================================

/**
 * Represents the structure of SaaS company data from our dataset.
 * All fields are carefully typed to ensure data integrity.
 */
export interface SaaSCompany {
  /** Unique identifier for the company */
  id: number;
  /** Official company name */
  company: string;
  /** Primary industry or sector */
  industry: string;
  /** Year the company was established */
  founded: number;
  /** Company headquarters location */
  headquarters: string;
  /** Current company valuation in billions USD */
  valuation: number;
  /** Annual Recurring Revenue in millions USD */
  arr: number;
  /** Total number of employees */
  employees: number;
  /** Primary product or service offered */
  product: string;
  /** Comma-separated list of major investors */
  investors: string;
  /** Current Chief Executive Officer */
  ceo: string;
}

/**
 * Generic data row type for handling arbitrary CSV data
 */
export type DataRow = Record<string, string | number | boolean | null>;

export type PlanTier = 'free' | 'cloud' | 'pro' | 'team' | 'enterprise' | 'basic' | 'org';

/**
 * Dataset metadata for understanding data structure
 */
export interface DatasetMetadata {
  /** Dataset identifier assigned by the backend */
  datasetId?: string;
  /** Total number of rows in the dataset */
  rowCount: number;
  /** List of column names */
  columns: string[];
  /** Data type for each column */
  columnTypes: Record<string, DataType>;
  /** Sample of first 5 rows for preview */
  preview: DataRow[];
  /** Upload timestamp */
  uploadedAt: string;
  /** Original filename, if available */
  filename?: string;
  /** Current status of schema intelligence analysis */
  intelligenceStatus?: string | null;
  /** Whether schema intelligence analysis has completed */
  intelligenceReady?: boolean;
  /** ISO language code detected for the dataset */
  language?: string;
  /** Locales that have translated metadata */
  availableLanguages?: string[];
  /** Raw translation payload keyed by locale */
  translations?: Record<string, any>;
}

export interface ColumnSummary {
  name: string;
  type: string;
  sampleValues: any[];
  stats: Record<string, number | string | null>;
  semanticTags: string[];
}

export interface DatasetSummary {
  datasetId: string;
  generatedAt: string;
  rowCount: number;
  columnCount: number;
  columns: ColumnSummary[];
  notes?: string | null;
}

export interface DatasetInsights {
  debug?: Record<string, any> | null;
  datasetId: string;
  generatedAt: string;
  summary: DatasetSummary | null;
  insights: {
    semantic_types?: Record<string, any>;
    relationships?: Record<string, any>;
    quality_insights?: Record<string, any>;
    visualization_recommendations?: Record<string, any>;
    metadata?: Record<string, any>;
    created_at?: string;
    [key: string]: any;
  };
}

export interface FeedbackSummary {
  targetId: string;
  datasetId?: string;
  likes: number;
  dislikes: number;
  favorites: number;
  score: number;
  userVote?: number | null;
  userFavorite: boolean;
}

export interface LeaderboardEntry {
  targetId: string;
  datasetId?: string;
  label?: string;
  likes: number;
  dislikes: number;
  favorites: number;
  score: number;
}

export type CatalogVisibility = 'public' | 'private' | 'premium';
export type CatalogStatus = 'pending' | 'approved' | 'rejected' | 'archived';

export interface CatalogEntry {
  id: string;
  name: string;
  description?: string | null;
  visibility: CatalogVisibility;
  plan_required: PlanTier;
  status: CatalogStatus;
  storage_path: string;
  schema_summary?: DatasetSummary | null;
  submitted_by?: string | null;
  approved_by?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

/**
 * Supported data types for column inference
 */
export type DataType = 'string' | 'number' | 'date' | 'boolean' | 'category';

/**
 * Metadata describing bundled sample datasets available on the backend
 */
export interface SampleDatasetSummary {
  id: string;
  filename: string;
  sizeBytes: number;
  lastModified: string;
  isDefault: boolean;
  isLoaded: boolean;
}

// ============================================================================
// Visualization Types
// ============================================================================

/**
 * Supported visualization types in the platform
 */
export type VisualizationType = 
  | 'bar' 
  | 'line' 
  | 'pie' 
  | 'scatter' 
  | 'doughnut' 
  | 'radar' 
  | 'table' 
  | 'heatmap' 
  | 'bubble'
  | 'ai_artisan'
  | 'force-graph'
  | 'd3-force'
  | '3d-scatter'
  | 'three-scatter'
  | 'chart'; // Generic chart type from backend

/**
 * Base interface for all visualizations
 */
export interface Visualization {
  /** Unique identifier for the visualization */
  id: string;
  /** Dataset that produced this visualization */
  datasetId?: string;
  /** Type of visualization */
  type: VisualizationType;
  /** Human-readable title */
  title: string;
  /** Optional description */
  description?: string;
  /** Whether this visualization is featured/highlighted */
  featured?: boolean;
  /** Size of the visualization in grid layout */
  size?: 'small' | 'medium' | 'large';
  /** Configuration specific to the visualization type */
  config: VisualizationConfig;
  /** Data to be visualized */
  data: ProcessedData;
  /** Creation timestamp */
  createdAt: string;
  /** Last modification timestamp */
  updatedAt: string;
  /** Original prompt that generated this visualization */
  prompt: string;
  /** Cost of LLM calls for this visualization */
  cost?: CostBreakdown;
  /** Provider that generated the visualization */
  provider_used?: string;
  /** Additional metadata such as tier classification */
  metadata?: Record<string, any>;
  /** Debugging information about how the visualization was generated */
  debug?: VisualizationDebug;
}

/**
 * Configuration for different visualization types
 */
export interface VisualizationConfig {
  /** Chart.js specific configuration */
  chartOptions?: Record<string, any>;
  /** Custom color scheme */
  colors?: string[];
  /** Display settings */
  display?: {
    width?: number;
    height?: number;
    responsive?: boolean;
    maintainAspectRatio?: boolean;
  };
  /** Table-specific configuration */
  tableConfig?: {
    sortable?: boolean;
    filterable?: boolean;
    pageSize?: number;
    highlightRows?: boolean;
  };
}

/**
 * Debug information returned alongside visualization responses
 */
export interface VisualizationDebug {
  sanitizedPrompt: string;
  heuristic?: {
    attempted: boolean;
    status?: 'matched' | 'no_match' | 'unknown';
    reason?: string;
    matchedPattern?: string;
    confidence?: number;
    selectedColumns?: string[];
    visualizationType?: string;
    tokens?: string[];
    patternsEvaluated?: {
      pattern: string;
      keywords: string[];
      matched: boolean;
    }[];
  };
  llm?: {
    attempted?: boolean;
    providerOrder?: string[];
    usedProvider?: string | null;
    attempts?: {
      provider: string;
      status?: 'success' | 'error';
      model?: string;
      cost?: CostBreakdown | null;
      error?: string;
    }[];
    systemPromptSample?: string;
    userPromptSample?: string;
    reason?: string;
    error?: string;
  };
  visualization?: {
    type?: string;
    title?: string;
    columns?: string[];
    aggregation?: string | null;
  };
}

/**
 * Processed data ready for visualization
 */
export interface ProcessedData {
  /** Labels for axes or categories */
  labels?: string[];
  /** Datasets for multi-series charts */
  datasets?: Dataset[];
  /** Raw rows for table display */
  rows?: DataRow[];
  /** Column definitions for tables */
  columns?: ColumnDefinition[];
  /** Graph nodes for force/3D renderers */
  nodes?: Array<Record<string, unknown>>;
  /** Graph links for force/3D renderers */
  links?: Array<Record<string, unknown>>;
  /** Scatter/point clouds */
  points?: Array<{ x: number; y: number; z?: number }>;
}

/**
 * Dataset for chart visualizations
 */
export interface Dataset {
  /** Dataset label */
  label: string;
  /** Data points */
  data: (number | { x: number; y: number })[];
  /** Visual properties */
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
  /** Additional Chart.js properties */
  [key: string]: any;
}

/**
 * Column definition for table visualizations
 */
export interface ColumnDefinition {
  /** Column key in the data */
  key: string;
  /** Display header */
  header: string;
  /** Data type */
  type: DataType;
  /** Formatting function */
  format?: (value: any) => string;
  /** Column width */
  width?: number;
  /** Alignment */
  align?: 'left' | 'center' | 'right';
}

// ============================================================================
// LLM Integration Types
// ============================================================================

/**
 * Supported LLM providers
 */
export type LLMProvider = 'openrouter' | 'openai' | 'anthropic';

/**
 * LLM configuration for each provider
 */
export interface LLMConfig {
  /** Active provider */
  provider: LLMProvider;
  /** API key (stored securely) */
  apiKey?: string;
  /** Model selection */
  model?: string;
  /** Provider-specific settings */
  settings?: {
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
  };
}

/**
 * Request to process a natural language prompt
 */
export interface PromptRequest {
  /** Natural language prompt */
  prompt: string;
  /** Dataset to operate on */
  datasetId?: string;
  /** Context from previous visualizations */
  context?: VisualizationContext;
  /** Selected LLM provider */
  provider?: LLMProvider;
  /** Target tier suggested by classifier */
  targetTier?: number;
  /** Target visualization type */
  targetType?: string;
  /** Whether to use heuristic parsing first */
  useHeuristics?: boolean;
}

/**
 * Response from prompt processing
 */
export interface PromptResponse {
  /** Generated visualization */
  visualization?: Visualization;
  /** Suggested follow-up actions */
  suggestions?: string[];
  /** Insights derived from the data */
  insights?: Insight[];
  /** Cost breakdown */
  cost?: CostBreakdown;
  /** Error information if failed */
  error?: ErrorResponse;
}

/**
 * Context for maintaining conversation state
 */
export interface VisualizationContext {
  /** Previous visualizations in session */
  previousVisualizations: Visualization[];
  /** Current dataset metadata */
  datasetMetadata: DatasetMetadata;
  /** User preferences */
  preferences?: UserPreferences;
}

/**
 * Data insights generated by AI
 */
export interface Insight {
  /** Insight type */
  type: 'trend' | 'outlier' | 'correlation' | 'summary';
  /** Insight description */
  description: string;
  /** Confidence score (0-1) */
  confidence: number;
  /** Supporting data points */
  evidence?: any[];
}

// ============================================================================
// Cost Tracking Types
// ============================================================================

/**
 * Breakdown of LLM costs
 */
export interface CostBreakdown {
  /** Provider used */
  provider: LLMProvider;
  /** Model used */
  model: string;
  /** Input tokens */
  inputTokens: number;
  /** Output tokens */
  outputTokens: number;
  /** Total cost in USD */
  totalCost: number;
  /** Cost per token rates */
  rates: {
    input: number;
    output: number;
  };
}

/**
 * Aggregated cost statistics
 */
export interface CostStatistics {
  /** Total cost for session */
  sessionTotal: number;
  /** Cost by provider */
  byProvider: Record<LLMProvider, number>;
  /** Cost by visualization */
  byVisualization: Record<string, number>;
  /** Number of requests */
  requestCount: number;
  /** Average cost per request */
  averageCost: number;
}

// ============================================================================
// User & Session Types
// ============================================================================

/**
 * User preferences for the application
 */
export interface UserPreferences {
  /** UI theme */
  theme: 'light' | 'dark' | 'system';
  /** Default LLM provider */
  defaultProvider: LLMProvider;
  /** Default visualization colors */
  colorScheme?: string[];
  /** Accessibility settings */
  accessibility?: {
    highContrast?: boolean;
    reduceMotion?: boolean;
    fontSize?: 'small' | 'medium' | 'large';
  };
}

/**
 * Application session state
 */
export interface SessionState {
  /** Session ID */
  id: string;
  /** Active dataset */
  dataset?: DatasetMetadata;
  /** Current visualizations */
  visualizations: Visualization[];
  /** Cost tracking */
  costs: CostStatistics;
  /** User preferences */
  preferences: UserPreferences;
  /** Session start time */
  startedAt: string;
}

// ============================================================================
// API Types
// ============================================================================

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T> {
  /** Response data */
  data?: T;
  /** Error information */
  error?: ErrorResponse;
  /** Response metadata */
  meta?: {
    timestamp: string;
    requestId: string;
    duration: number;
  };
}

/**
 * Error response structure
 */
export interface ErrorResponse {
  /** Error code */
  code: string;
  /** Human-readable message */
  message: string;
  /** Additional details */
  details?: Record<string, any>;
  /** Stack trace (dev mode only) */
  stack?: string;
}

/**
 * File upload response
 */
export interface UploadResponse {
  /** Dataset ID */
  datasetId: string;
  /** Dataset metadata */
  metadata: DatasetMetadata;
  /** Processing time */
  processingTime: number;
}

// ============================================================================
// Pattern Matching Types (for Heuristic Parser)
// ============================================================================

/**
 * Pattern for heuristic matching
 */
export interface HeuristicPattern {
  /** Pattern name */
  name: string;
  /** Regex or keyword patterns to match */
  patterns: (RegExp | string)[];
  /** Extracted parameters */
  extract: (prompt: string) => PatternMatch | null;
  /** Visualization type to generate */
  visualizationType: VisualizationType;
  /** Default configuration */
  defaultConfig?: Partial<VisualizationConfig>;
}

/**
 * Result of pattern matching
 */
export interface PatternMatch {
  /** Matched pattern name */
  pattern: string;
  /** Confidence score (0-1) */
  confidence: number;
  /** Extracted parameters */
  parameters: {
    columns?: string[];
    aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max';
    groupBy?: string;
    filterBy?: Record<string, any>;
    sortBy?: { column: string; direction: 'asc' | 'desc' };
  };
}


/**
 * Billing plan metadata returned from backend
 */
export interface BillingPlan {
  id: string;
  tier: PlanTier;
  name: string;
  price: string;
  priceMonthly: number | null;
  interval: 'month' | 'year' | 'custom' | null;
  currency: string;
  description: string;
  features: Record<string, string>;
  requiresCheckout: boolean;
}

export interface CheckoutSession {
  checkoutUrl: string;
  provider?: string;
}
// ============================================================================
// Utility Types
// ============================================================================

/**
 * Make all properties of T optional recursively
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Extract keys of T that have string values
 */
export type StringKeys<T> = {
  [K in keyof T]: T[K] extends string ? K : never;
}[keyof T];

/**
 * Extract keys of T that have number values
 */
export type NumberKeys<T> = {
  [K in keyof T]: T[K] extends number ? K : never;
}[keyof T];

/**
 * Type guard for SaaS company data
 */
export function isSaaSCompany(data: any): data is SaaSCompany {
  return (
    typeof data === 'object' &&
    data !== null &&
    'company' in data &&
    'industry' in data &&
    'valuation' in data &&
    'arr' in data
  );
}

/**
 * Type guard for visualization
 */
export function isVisualization(data: any): data is Visualization {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'type' in data &&
    'config' in data &&
    'data' in data
  );
}

// ============================================================================
// Re-export OpenStrand types
// ============================================================================

export type { 
  Weave, 
  WeaveNode, 
  WeaveEdge,
  Strand,
  StrandType,
  StrandMetadata,
  StrandContent,
  Relationship,
  RelationshipType,
  CapabilityMatrix
} from './openstrand';