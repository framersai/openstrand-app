/**
 * @module services/api
 * @description Typed client for the FastAPI backend.
 */

import type {
  BillingPlan,
  CatalogEntry,
  CatalogStatus,
  CatalogVisibility,
  CheckoutSession,
  DatasetMetadata,
  DatasetSummary,
  DatasetInsights,
  FeedbackSummary,
  LeaderboardEntry,
  PlanTier,
  PromptRequest,
  SampleDatasetSummary,
  Visualization,
} from '@/types';
import type { TierClassification } from '@/lib/visualization/types';
import { formatPlanLabel, normalizePlanTier } from '@/lib/plan-info';
import type {
  BillingPortalLink,
  InvoiceSummary,
  SubscriptionStatus,
  SubscriptionSummary,
} from '@/features/billing/types';

export interface UploadDatasetResult {
  datasetId: string;
  metadata: DatasetMetadata;
}

export interface DatasetVerificationPayload {
  datasetId: string;
  name: string;
  description?: string;
  tags?: string[];
  license?: string;
  visibility?: CatalogVisibility;
  forceDuplicate?: boolean;
}

export interface DatasetVerificationResult {
  status: 'ok' | 'duplicate' | 'flagged';
  warnings: string[];
  duplicates: Array<{ id: string; name: string; similarity: number }>;
  message?: string;
}

export interface StrandVerificationPayload {
  strandType: string;
  noteType: string;
  title: string;
  content: string;
  tags?: string[];
  license?: string;
}

export interface StrandVerificationResult {
  status: 'ok' | 'duplicate' | 'flagged';
  warnings: string[];
  duplicates: Array<{ id: string; title: string; similarity: number }>;
  message?: string;
  fingerprint?: string;
  isDuplicate?: boolean;
  policyViolations?: string[];
}

export interface FeedbackPayload {
  vote?: 'up' | 'down' | null;
  favorite?: boolean;
  datasetId?: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const DEFAULT_TIMEOUT = 30000;
const INSIGHTS_TIMEOUT =
  Number(process.env.NEXT_PUBLIC_INSIGHTS_TIMEOUT_MS ?? 120000) || 120000;
const OFFLINE_MODE = process.env.NEXT_PUBLIC_OFFLINE_MODE === 'true';

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout = DEFAULT_TIMEOUT
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new ApiError(error.message || response.statusText, response.status, error);
    }

    return response;
  } catch (error) {
    clearTimeout(timer);
    if (error instanceof ApiError) throw error;
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new ApiError('Request timeout', 408);
      }
      throw new ApiError(error.message);
    }
    throw new ApiError('Unknown error occurred');
  }
}

function normalizeDatasetMetadata(raw: any, datasetId?: string): DatasetMetadata {
  const columnTypes = raw.column_types ?? raw.columnTypes ?? {};
  const normalizedColumnTypes = Object.fromEntries(
    Object.entries(columnTypes as Record<string, unknown>).map(([key, value]) => [
      key,
      String(value ?? ''),
    ])
  ) as DatasetMetadata['columnTypes'];

  return {
    datasetId: datasetId ?? raw.dataset_id ?? raw.datasetId,
    rowCount: raw.row_count ?? raw.rowCount ?? 0,
    columns: Array.isArray(raw.columns) ? raw.columns : [],
    columnTypes: normalizedColumnTypes,
    preview: Array.isArray(raw.preview) ? raw.preview : [],
    uploadedAt: raw.uploaded_at ?? raw.uploadedAt ?? new Date().toISOString(),
    filename: raw.filename ?? raw.file_name ?? undefined,
    intelligenceStatus: raw.intelligence_status ?? raw.intelligenceStatus ?? null,
    intelligenceReady: Boolean(raw.intelligence_ready ?? raw.intelligenceReady ?? false),
    language: raw.language ?? raw.locale ?? 'en',
    availableLanguages: Array.isArray(raw.available_languages ?? raw.availableLanguages)
      ? (raw.available_languages ?? raw.availableLanguages)
      : [],
    translations: raw.translations ?? {},
  };
}

function normalizeDatasetSummary(raw: any): DatasetSummary {
  return {
    datasetId: raw.dataset_id ?? raw.datasetId ?? '',
    generatedAt: raw.generated_at ?? raw.generatedAt ?? new Date().toISOString(),
    rowCount: raw.row_count ?? raw.rowCount ?? 0,
    columnCount: raw.column_count ?? raw.columnCount ?? 0,
    columns: Array.isArray(raw.columns)
      ? raw.columns.map((column: any) => ({
          name: column.name ?? '',
          type: column.type ?? 'string',
          sampleValues: Array.isArray(column.sample_values ?? column.sampleValues)
            ? column.sample_values ?? column.sampleValues
            : [],
          stats: column.stats ?? {},
          semanticTags: column.semantic_tags ?? column.semanticTags ?? [],
        }))
      : [],
    notes: raw.notes ?? null,
  };
}

function normalizeDatasetInsights(raw: any): DatasetInsights {
  return {
    datasetId: raw.dataset_id ?? raw.datasetId ?? '',
    generatedAt: raw.generated_at ?? raw.generatedAt ?? new Date().toISOString(),
    summary: raw.summary ? normalizeDatasetSummary(raw.summary) : null,
    insights: raw.insights ?? {},
    debug: raw.debug ?? null,
  };
}

function normalizeFeedbackSummary(raw: any): FeedbackSummary {
  return {
    targetId: raw.target_id ?? raw.targetId ?? '',
    datasetId: raw.dataset_id ?? raw.datasetId ?? undefined,
    likes: Number(raw.likes ?? 0),
    dislikes: Number(raw.dislikes ?? 0),
    favorites: Number(raw.favorites ?? 0),
    score: Number(raw.score ?? 0),
    userVote:
      typeof raw.user_vote === 'number'
        ? raw.user_vote
        : typeof raw.userVote === 'number'
          ? raw.userVote
          : null,
    userFavorite: Boolean(raw.user_favorite ?? raw.userFavorite ?? false),
  };
}

function normalizeLeaderboardEntry(raw: any): LeaderboardEntry {
  return {
    targetId: raw.target_id ?? raw.targetId ?? '',
    datasetId: raw.dataset_id ?? raw.datasetId ?? undefined,
    label: raw.label ?? raw.target_id ?? raw.targetId ?? '',
    likes: Number(raw.likes ?? 0),
    dislikes: Number(raw.dislikes ?? 0),
    favorites: Number(raw.favorites ?? 0),
    score: Number(raw.score ?? 0),
  };
}

function normalizeVisualization(raw: any): Visualization {
  const datasetId =
    raw.datasetId ??
    raw.dataset_id ??
    raw.dataset?.datasetId ??
    raw.dataset?.dataset_id ??
    undefined;
  return {
    ...raw,
    datasetId,
  };
}

const PLAN_ORDER: PlanTier[] = ['free', 'basic', 'cloud', 'pro', 'team', 'org', 'enterprise'];

const PLAN_SUMMARIES: Record<PlanTier, string> = {
  free: 'Local-first exploration with manual structure requests and offline tooling.',
  basic: 'Basic cloud features for individuals getting started.',
  cloud: 'Managed cloud with automated syncs, approvals, and placeholder governance.',
  pro: 'Advanced automation, higher quotas, and AI-assisted structure placement.',
  team: 'Collaborative scopes, shared approvals, and real-time presence for teams.',
  org: 'Organization workspaces with centralized governance and controls.',
  enterprise: 'Enterprise controls with SSO, SLAs, dedicated support, and on-prem options.',
};

const AUTO_SYNC_NOTES: Record<PlanTier, string> = {
  free: 'Manual only',
  basic: 'Manual + monthly auto-sync',
  cloud: 'Weekly auto-sync',
  pro: 'Daily auto-sync',
  team: 'Hourly auto-sync',
  org: 'Hourly auto-sync',
  enterprise: 'Real-time or custom cadence',
};

const VERSION_HISTORY_NOTES: Record<PlanTier, string> = {
  free: 'No history',
  basic: '7-day history',
  cloud: '30-day history',
  pro: 'Unlimited history',
  team: 'Unlimited history',
  org: 'Unlimited history',
  enterprise: 'Unlimited + retention policies',
};

const PLAN_FEATURE_ORDER = [
  'strands',
  'storage',
  'aiCreditsPerMonth',
  'autoSync',
  'versionHistory',
  'llmExtraction',
  'premiumSources',
  'presence',
  'comments',
  'customDomain',
  'teamWorkspaces',
  'collaboration',
  'sso',
  'customBranding',
  'dedicatedSupport',
  'sla',
  'onPremise',
] as const;

const PLAN_FEATURE_LABELS: Record<(typeof PLAN_FEATURE_ORDER)[number], string> = {
  strands: 'Strand capacity',
  storage: 'Cloud storage',
  aiCreditsPerMonth: 'AI credits / month',
  autoSync: 'Sync cadence',
  versionHistory: 'Version history',
  llmExtraction: 'LLM extractions / month',
  premiumSources: 'Premium source ingestion',
  presence: 'Presence indicators',
  comments: 'Comments',
  customDomain: 'Custom domain',
  teamWorkspaces: 'Team workspaces',
  collaboration: 'Collaboration tools',
  sso: 'Single sign-on (SSO)',
  customBranding: 'Custom branding',
  dedicatedSupport: 'Dedicated support',
  sla: 'SLA & uptime guarantees',
  onPremise: 'On-premise deployment',
};

const SUBSCRIPTION_STATUS_VALUES: SubscriptionStatus[] = [
  'active',
  'trialing',
  'past_due',
  'canceled',
  'paused',
  'incomplete',
  'incomplete_expired',
  'unpaid',
];

function normalizeSubscriptionStatus(value: unknown): SubscriptionStatus {
  if (typeof value === 'string') {
    const normalized = value.toLowerCase() as SubscriptionStatus;
    if (SUBSCRIPTION_STATUS_VALUES.includes(normalized)) {
      return normalized;
    }
  }
  return 'active';
}

function formatPlanPrice(
  amount: unknown,
  interval: 'month' | 'year' | 'custom' | null,
  currency: string,
  perUser: boolean
): { display: string; numeric: number | null } {
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount)) {
    return { display: 'Contact us', numeric: null };
  }
  if (numericAmount === 0) {
    return { display: 'Free', numeric: 0 };
  }

  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: numericAmount % 1 === 0 ? 0 : 2,
  });
  const cadence = interval === 'month' ? '/month' : interval === 'year' ? '/year' : '';
  const seatQualifier = perUser ? ' per member' : '';
  return {
    display: `${formatter.format(numericAmount)}${cadence}${seatQualifier}`.trim(),
    numeric: numericAmount,
  };
}

function formatStorageBytes(value: unknown): string {
  if (value === null) {
    return 'Unlimited';
  }
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    return 'Not included';
  }
  const gigabyte = 1024 ** 3;
  const terabyte = 1024 ** 4;
  if (value >= terabyte) {
    const size = value / terabyte;
    return `${parseFloat(size.toFixed(size >= 10 ? 0 : 1))} TB`;
  }
  const size = value / gigabyte;
  return `${parseFloat(size.toFixed(size >= 10 ? 0 : 1))} GB`;
}

function coerceIsoDate(value: unknown): string | undefined {
  if (!value) return undefined;
  const date = new Date(value as string);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }
  return date.toISOString();
}

function mapPlanFeatures(raw: Record<string, unknown>, tier: PlanTier): Record<string, string> {
  const features: Record<string, string> = {};
  for (const key of PLAN_FEATURE_ORDER) {
    if (!(key in raw)) continue;
    const label = PLAN_FEATURE_LABELS[key];
    const value = raw[key];
    let formatted: string;
    switch (key) {
      case 'strands':
        if (value === null) {
          formatted = 'Unlimited strands';
        } else if (typeof value === 'number' && Number.isFinite(value)) {
          formatted = `${value.toLocaleString()} strands`;
        } else {
          formatted = 'Not specified';
        }
        break;
      case 'storage':
        formatted = formatStorageBytes(value);
        break;
      case 'aiCreditsPerMonth':
        if (value === null) {
          formatted = 'Unlimited credits';
        } else if (typeof value === 'number' && Number.isFinite(value)) {
          formatted = `${value.toLocaleString()} credits / month`;
        } else {
          formatted = 'Not included';
        }
        break;
      case 'autoSync':
        formatted = AUTO_SYNC_NOTES[tier];
        break;
      case 'versionHistory':
        if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
          formatted = `${value} days`;
        } else {
          formatted = VERSION_HISTORY_NOTES[tier];
        }
        break;
      case 'llmExtraction':
        if (value === null) {
          formatted = 'Unlimited extractions';
        } else if (typeof value === 'number' && Number.isFinite(value)) {
          formatted = `${value.toLocaleString()} / month`;
        } else if (value === false) {
          formatted = 'Not included';
        } else {
          formatted = 'Included';
        }
        break;
      case 'premiumSources':
        formatted = value ? 'Included' : 'Core sources only';
        break;
      case 'presence':
        formatted = value ? 'Real-time presence' : 'Not included';
        break;
      case 'comments':
        formatted = value ? 'Included' : 'Not included';
        break;
      case 'customDomain':
        formatted = value ? 'Included' : 'Not included';
        break;
      case 'teamWorkspaces':
        formatted = value ? 'Multiple workspaces' : 'Single workspace';
        break;
      case 'collaboration':
        formatted = value ? 'Co-authoring & sharing' : 'Solo only';
        break;
      case 'sso':
        formatted = value ? 'Available' : 'Not available';
        break;
      case 'customBranding':
        formatted = value ? 'Included' : 'Not included';
        break;
      case 'dedicatedSupport':
        formatted = value ? 'Dedicated support' : 'Community support';
        break;
      case 'sla':
        formatted = value ? 'Enterprise SLA' : 'Standard uptime';
        break;
      case 'onPremise':
        formatted = value ? 'Available' : 'Hosted only';
        break;
      default:
        formatted =
          typeof value === 'boolean'
            ? value
              ? 'Included'
              : 'Not included'
            : String(value ?? 'Not specified');
        break;
    }
    features[label] = formatted;
  }
  return features;
}

class ApiService {
  private baseUrl: string;
  private authToken: string | null = null;

  constructor(baseUrl = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  setAuthToken(token?: string) {
    this.authToken = token ?? null;
  }

  private withAuth(init: RequestInit = {}): RequestInit {
    const headers = new Headers(init.headers as HeadersInit | undefined);
    if (this.authToken) {
      headers.set('Authorization', `Bearer ${this.authToken}`);
    }
    return {
      ...init,
      headers,
    };
  }

  // Lightweight helpers for simple GET/POST usage sites
  async get<T = any>(path: string): Promise<T> {
    const response = await fetchWithTimeout(`${this.baseUrl}${path}`, this.withAuth());
    return response.json();
  }

  async post<T = any>(path: string, body?: any): Promise<T> {
    const response = await fetchWithTimeout(
      `${this.baseUrl}${path}`,
      this.withAuth({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body !== undefined ? JSON.stringify(body) : undefined,
      }),
    );
    return response.json();
  }

  async uploadDataset(file: File): Promise<UploadDatasetResult> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetchWithTimeout(
      `${this.baseUrl}/upload`,
      this.withAuth({
        method: 'POST',
        body: formData,
      }),
      60000,
    );

    const raw = await response.json();
    const datasetId = raw.dataset_id ?? raw.datasetId ?? Date.now().toString();
    return {
      datasetId,
      metadata: normalizeDatasetMetadata(raw, datasetId),
    };
  }

  async loadSampleDataset(filename: string): Promise<UploadDatasetResult> {
    const response = await fetchWithTimeout(
      `${this.baseUrl}/datasets/samples/load`,
      this.withAuth({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename }),
      }),
    );

    const raw = await response.json();
    const datasetId = raw.dataset_id ?? raw.datasetId ?? Date.now().toString();
    return {
      datasetId,
      metadata: normalizeDatasetMetadata(raw, datasetId),
    };
  }

  async listSampleDatasets(): Promise<SampleDatasetSummary[]> {
    // In offline mode, return empty array instead of failing
    if (OFFLINE_MODE || !this.baseUrl || this.baseUrl === 'http://localhost:8000') {
      console.debug('[api] offline mode or local API not available, returning empty sample datasets');
      return [];
    }

    try {
      const response = await fetchWithTimeout(
        `${this.baseUrl}/datasets/samples`,
        this.withAuth(),
      );

      const raw = await response.json();
      if (!Array.isArray(raw)) return [];
      return raw.map((item) => ({
        id: String(item.id ?? ''),
        filename: String(item.filename ?? ''),
        sizeBytes: Number(item.sizeBytes ?? item.size_bytes ?? 0),
        lastModified: String(item.lastModified ?? item.last_modified ?? new Date().toISOString()),
        isDefault: Boolean(item.isDefault ?? item.is_default ?? false),
        isLoaded: Boolean(item.isLoaded ?? item.is_loaded ?? false),
      }));
    } catch (error) {
      console.debug('[api] failed to fetch sample datasets, returning empty array', error);
      return [];
    }
  }

  async getDatasetSummary(datasetId: string): Promise<DatasetSummary> {
    const response = await fetchWithTimeout(
      `${this.baseUrl}/datasets/${datasetId}/summary`,
      this.withAuth(),
    );
    const raw = await response.json();
    return normalizeDatasetSummary(raw);
  }

  async getDatasetInsights(datasetId: string, force = false): Promise<DatasetInsights> {
    const response = await fetchWithTimeout(
      `${this.baseUrl}/datasets/${datasetId}/insights${force ? '?force=true' : ''}`,
      this.withAuth(),
      INSIGHTS_TIMEOUT,
    );
    const raw = await response.json();
    return normalizeDatasetInsights(raw);
  }

  async listCatalogEntries(filters?: { status?: CatalogStatus; visibility?: CatalogVisibility }): Promise<CatalogEntry[]> {
    const query = new URLSearchParams();
    if (filters?.status) {
      query.set('status', filters.status);
    }
    if (filters?.visibility) {
      query.set('visibility', filters.visibility);
    }

    const url = `${this.baseUrl}/catalog${query.toString() ? `?${query}` : ''}`;
    const response = await fetchWithTimeout(url, this.withAuth());
    return response.json();
  }

  async submitCatalogDataset(params: {
    datasetId?: string;
    file?: File;
    name: string;
    description?: string;
    visibility?: CatalogVisibility;
    planRequired?: PlanTier;
    tags?: string[];
    license?: string;
    allowStrandUsage?: boolean;
    forceDuplicate?: boolean;
  }): Promise<CatalogEntry> {
    if (params.file) {
      const formData = new FormData();
      formData.append('name', params.name);
      if (params.description) {
        formData.append('description', params.description);
      }
      formData.append('visibility', params.visibility ?? 'public');
      formData.append('plan_required', params.planRequired ?? 'free');
      if (params.tags?.length) {
        formData.append('tags', JSON.stringify(params.tags));
      }
      if (params.license) {
        formData.append('license', params.license);
      }
      if (typeof params.allowStrandUsage === 'boolean') {
        formData.append('allow_strand_usage', String(params.allowStrandUsage));
      }
      if (params.forceDuplicate) {
        formData.append('force_duplicate', 'true');
      }
      formData.append('file', params.file);

      const response = await fetchWithTimeout(
        `${this.baseUrl}/catalog`,
        this.withAuth({
          method: 'POST',
          body: formData,
        }),
        60000,
      );
      return response.json();
    }

    if (params.datasetId) {
      const response = await fetchWithTimeout(
        `${this.baseUrl}/catalog`,
        this.withAuth({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            datasetId: params.datasetId,
            name: params.name,
            description: params.description,
            visibility: params.visibility ?? 'public',
            planRequired: params.planRequired ?? 'free',
            tags: params.tags ?? [],
            license: params.license ?? null,
            allowStrandUsage: params.allowStrandUsage ?? true,
            forceDuplicate: params.forceDuplicate ?? false,
          }),
        }),
        60000,
      );
      return response.json();
    }

    throw new ApiError('A dataset file or datasetId is required to submit catalog entries', 400);
  }

  async loadCatalogDataset(entryId: string): Promise<UploadDatasetResult> {
    const response = await fetchWithTimeout(
      `${this.baseUrl}/catalog/${entryId}/load`,
      this.withAuth({
        method: 'POST',
      }),
      60000,
    );
    const raw = await response.json();
    const datasetId = raw.dataset_id ?? raw.datasetId ?? Date.now().toString();
    return {
      datasetId,
      metadata: normalizeDatasetMetadata(raw, datasetId),
    };
  }

  async verifyCatalogDatasetDraft(payload: DatasetVerificationPayload): Promise<DatasetVerificationResult> {
    try {
      const response = await fetchWithTimeout(
        `${this.baseUrl}/catalog/verify`,
        this.withAuth({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }),
      );
      const raw = await response.json();
      return {
        status: ['duplicate', 'flagged', 'ok'].includes(raw.status) ? raw.status : 'ok',
        warnings: Array.isArray(raw.warnings) ? raw.warnings.map((item: any) => String(item)) : [],
        duplicates: Array.isArray(raw.duplicates)
          ? raw.duplicates.map((dup: any) => ({
              id: String(dup.id ?? dup.dataset_id ?? dup.datasetId ?? ''),
              name: String(dup.name ?? dup.title ?? 'Untitled dataset'),
              similarity: Number(dup.similarity ?? dup.score ?? 0),
            }))
          : [],
        message: raw.message ?? undefined,
      };
    } catch (error) {
      console.warn('Catalog verification failed, allowing fallback result.', error);
      return {
        status: 'ok',
        warnings: ['Verification service unavailable. Proceed with manual review.'],
        duplicates: [],
      };
    }
  }

  async verifyStrandDraft(payload: StrandVerificationPayload): Promise<StrandVerificationResult> {
    try {
      const response = await fetchWithTimeout(
        `${this.baseUrl}/strands/verify`,
        this.withAuth({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }),
      );
      const raw = await response.json();
      return {
        status: ['duplicate', 'flagged', 'ok'].includes(raw.status) ? raw.status : 'ok',
        warnings: Array.isArray(raw.warnings) ? raw.warnings.map((item: any) => String(item)) : [],
        duplicates: Array.isArray(raw.duplicates)
          ? raw.duplicates.map((dup: any) => ({
              id: String(dup.id ?? dup.strand_id ?? dup.strandId ?? ''),
              title: String(dup.title ?? dup.name ?? 'Untitled strand'),
              similarity: Number(dup.similarity ?? dup.score ?? 0),
            }))
          : [],
        message: raw.message ?? undefined,
      };
    } catch (error) {
      console.warn('Strand verification failed, allowing fallback result.', error);
      return {
        status: 'ok',
        warnings: ['Verification service unavailable. Review duplicates manually.'],
        duplicates: [],
      };
    }
  }

  async createStrand(payload: {
    strandType: string;
    noteType: string;
    scopeId: string;
    title: string;
    summary?: string;
    content: string;
    datasetId?: string;
    tags?: string[];
    license?: string;
    references?: string;
    allowStructureRequests?: boolean;
    forceDuplicate?: boolean;
  }): Promise<any> {
    const response = await fetchWithTimeout(
      `${this.baseUrl}/strands`,
      this.withAuth({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }),
      60000,
    );
    return response.json();
  }

  async generateVisualization(request: PromptRequest): Promise<Visualization> {
    const payload = {
      prompt: request.prompt,
      dataset_id: request.datasetId ?? (request as any).dataset_id,
      provider: request.provider,
      use_heuristics: request.useHeuristics ?? (request as any).use_heuristics,
    };

    const response = await fetchWithTimeout(
      `${this.baseUrl}/visualize`,
      this.withAuth({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }),
      45000,
    );

    const raw = await response.json();
    return normalizeVisualization(raw);
  }

  async getDatasetFeedback(datasetId: string): Promise<FeedbackSummary> {
    const response = await fetchWithTimeout(
      `${this.baseUrl}/feedback/datasets/${datasetId}`,
      this.withAuth(),
    );
    const raw = await response.json();
    return normalizeFeedbackSummary(raw);
  }

  async submitDatasetFeedback(datasetId: string, payload: FeedbackPayload): Promise<FeedbackSummary> {
    const body: Record<string, any> = {};
    if (payload.vote !== undefined) {
      body.vote = payload.vote;
    }
    if (typeof payload.favorite === 'boolean') {
      body.favorite = payload.favorite;
    }

    const response = await fetchWithTimeout(
      `${this.baseUrl}/feedback/datasets/${datasetId}`,
      this.withAuth({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
    );
    const raw = await response.json();
    return normalizeFeedbackSummary(raw);
  }

  async getVisualizationFeedback(visualizationId: string): Promise<FeedbackSummary> {
    const response = await fetchWithTimeout(
      `${this.baseUrl}/feedback/visualizations/${visualizationId}`,
      this.withAuth(),
    );
    const raw = await response.json();
    return normalizeFeedbackSummary(raw);
  }

  async submitVisualizationFeedback(
    visualizationId: string,
    payload: FeedbackPayload,
  ): Promise<FeedbackSummary> {
    const body: Record<string, any> = {};
    if (payload.vote !== undefined) {
      body.vote = payload.vote;
    }
    if (typeof payload.favorite === 'boolean') {
      body.favorite = payload.favorite;
    }
    if (payload.datasetId) {
      body.dataset_id = payload.datasetId;
    }

    const response = await fetchWithTimeout(
      `${this.baseUrl}/feedback/visualizations/${visualizationId}`,
      this.withAuth({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
    );
    const raw = await response.json();
    return normalizeFeedbackSummary(raw);
  }

  async getDatasetLeaderboard(limit = 10): Promise<LeaderboardEntry[]> {
    // In offline mode, return empty array instead of failing
    if (OFFLINE_MODE || !this.baseUrl || this.baseUrl === 'http://localhost:8000') {
      console.debug('[api] offline mode or local API not available, returning empty dataset leaderboard');
      return [];
    }

    try {
      const response = await fetchWithTimeout(
        `${this.baseUrl}/leaderboard/datasets?limit=${limit}`,
        this.withAuth(),
      );
      const raw = await response.json();
      if (!Array.isArray(raw)) return [];
      return raw.map(normalizeLeaderboardEntry);
    } catch (error) {
      console.debug('[api] failed to fetch dataset leaderboard, returning empty array', error);
      return [];
    }
  }

  async getVisualizationLeaderboard(limit = 10): Promise<LeaderboardEntry[]> {
    // In offline mode, return empty array instead of failing
    if (OFFLINE_MODE || !this.baseUrl || this.baseUrl === 'http://localhost:8000') {
      console.debug('[api] offline mode or local API not available, returning empty visualization leaderboard');
      return [];
    }

    try {
      const response = await fetchWithTimeout(
        `${this.baseUrl}/leaderboard/visualizations?limit=${limit}`,
        this.withAuth(),
      );
      const raw = await response.json();
      if (!Array.isArray(raw)) return [];
      return raw.map(normalizeLeaderboardEntry);
    } catch (error) {
      console.debug('[api] failed to fetch visualization leaderboard, returning empty array', error);
      return [];
    }
  }

  async listBillingPlans(): Promise<BillingPlan[]> {
    const response = await fetchWithTimeout(
      `${this.baseUrl}/billing/plans`,
      this.withAuth(),
    );

    const payload = await response.json();
    const plansPayload = payload?.data?.plans ?? payload?.plans ?? payload;
    if (!plansPayload || typeof plansPayload !== 'object') {
      return [];
    }

    const plans: BillingPlan[] = Object.entries<any>(plansPayload).map(([tierKey, planConfig]) => {
      const tier = normalizePlanTier(tierKey);
      const interval = (planConfig?.interval ?? planConfig?.billing_interval ?? null) as BillingPlan['interval'];
      const currency =
        typeof planConfig?.currency === 'string'
          ? planConfig.currency.toUpperCase()
          : 'USD';
      const perUser = Boolean(planConfig?.perUser ?? planConfig?.per_user ?? false);
      const { display, numeric } = formatPlanPrice(planConfig?.price, interval, currency, perUser);

      const name =
        typeof planConfig?.name === 'string' && planConfig.name.trim().length > 0
          ? planConfig.name
          : formatPlanLabel(tier);

      return {
        id: tier,
        tier,
        name,
        price: display,
        priceMonthly: numeric,
        interval,
        currency,
        description: PLAN_SUMMARIES[tier],
        features: mapPlanFeatures(planConfig?.features ?? {}, tier),
        requiresCheckout: tier !== 'free' && tier !== 'enterprise',
      };
    });

    plans.sort((a, b) => PLAN_ORDER.indexOf(a.tier) - PLAN_ORDER.indexOf(b.tier));
    return plans;
  }

  async createCheckoutSession(
    plan: PlanTier | string,
    returnUrl?: string,
    options?: { trialDays?: number; couponCode?: string }
  ): Promise<CheckoutSession> {
    const normalizedPlan = normalizePlanTier(plan as string);
    const payload: Record<string, unknown> = { plan: normalizedPlan };
    const fallbackReturnUrl =
      returnUrl ?? (typeof window !== 'undefined' ? `${window.location.origin}/billing` : undefined);
    if (fallbackReturnUrl) {
      payload.returnUrl = fallbackReturnUrl;
    }
    if (options?.trialDays !== undefined) {
      payload.trialDays = options.trialDays;
    }
    if (options?.couponCode) {
      payload.couponId = options.couponCode;
    }

    const response = await fetchWithTimeout(
      `${this.baseUrl}/billing/checkout`,
      this.withAuth({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }),
    );

    const raw = await response.json();
    const data = raw?.data ?? raw;
    return {
      checkoutUrl: String(data?.checkoutUrl ?? data?.checkout_url ?? ''),
      provider: data?.provider ? String(data.provider) : undefined,
    };
  }

  async getSubscription(): Promise<SubscriptionSummary | null> {
    const response = await fetchWithTimeout(
      `${this.baseUrl}/billing/subscription`,
      this.withAuth(),
    );
    const raw = await response.json();
    const data = raw?.data ?? raw;
    if (!data) {
      return null;
    }

    return {
      id: String(data.id ?? ''),
      plan: normalizePlanTier(data.plan ?? data.planTier ?? 'free'),
      status: normalizeSubscriptionStatus(data.status),
      currentPeriodEnd: coerceIsoDate(data.currentPeriodEnd ?? data.current_period_end) ?? new Date().toISOString(),
      cancelAtPeriodEnd: Boolean(data.cancelAtPeriodEnd ?? data.cancel_at_period_end ?? false),
      trialEnd: coerceIsoDate(data.trialEnd ?? data.trial_end),
    };
  }

  async cancelSubscription(immediate = false): Promise<void> {
    await fetchWithTimeout(
      `${this.baseUrl}/billing/cancel`,
      this.withAuth({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ immediate }),
      }),
    );
  }

  async changeSubscriptionPlan(newPlan: PlanTier | string): Promise<SubscriptionSummary> {
    const normalizedPlan = normalizePlanTier(newPlan as string);
    const response = await fetchWithTimeout(
      `${this.baseUrl}/billing/upgrade`,
      this.withAuth({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPlan: normalizedPlan }),
      }),
    );
    const raw = await response.json();
    const data = raw?.data ?? raw;
    return {
      id: String(data.id ?? ''),
      plan: normalizePlanTier(data.plan ?? normalizedPlan),
      status: normalizeSubscriptionStatus(data.status),
      currentPeriodEnd: coerceIsoDate(data.currentPeriodEnd ?? data.current_period_end) ?? new Date().toISOString(),
      cancelAtPeriodEnd: Boolean(data.cancelAtPeriodEnd ?? data.cancel_at_period_end ?? false),
      trialEnd: coerceIsoDate(data.trialEnd ?? data.trial_end),
    };
  }

  async listInvoices(limit = 10): Promise<InvoiceSummary[]> {
    const response = await fetchWithTimeout(
      `${this.baseUrl}/billing/invoices?limit=${limit}`,
      this.withAuth(),
    );
    const raw = await response.json();
    const data = raw?.data ?? raw;
    if (!Array.isArray(data)) {
      return [];
    }

    return data.map((invoice: any) => ({
      id: String(invoice.id ?? ''),
      amount: Number(invoice.amount ?? 0),
      currency: String(invoice.currency ?? 'USD').toUpperCase(),
      status: String(invoice.status ?? 'open'),
      paidAt: coerceIsoDate(invoice.paidAt ?? invoice.paid_at),
      invoiceUrl: invoice.invoiceUrl ?? invoice.invoice_url ?? undefined,
      invoicePdf: invoice.invoicePdf ?? invoice.invoice_pdf ?? undefined,
    }));
  }

  async getBillingPortal(returnUrl?: string): Promise<BillingPortalLink> {
    const query = returnUrl ? `?returnUrl=${encodeURIComponent(returnUrl)}` : '';
    const response = await fetchWithTimeout(
      `${this.baseUrl}/billing/portal${query}`,
      this.withAuth(),
    );
    const raw = await response.json();
    const data = raw?.data ?? raw;
    return {
      portalUrl: String(data?.portalUrl ?? data?.portal_url ?? ''),
    };
  }

  // Three-Tier Visualization System Methods

  async classifyVisualizationTier(
    prompt: string,
    datasetId?: string,
    dataSummary?: any
  ): Promise<TierClassification> {
    const response = await fetchWithTimeout(
      `${this.baseUrl}/visualize/classify`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          dataset_id: datasetId,
          data_summary: dataSummary
        })
      }
    );

    if (!response.ok) {
      throw new ApiError('Failed to classify visualization tier', response.status);
    }

    return response.json();
  }

  async getTierInformation(): Promise<any> {
    const response = await fetchWithTimeout(`${this.baseUrl}/visualizations/tier-info`);

    if (!response.ok) {
      throw new ApiError('Failed to get tier information', response.status);
    }

    return response.json();
  }

  async generateAIArtisanVisualization(params: {
    prompt: string;
    datasetId: string;
    summary?: DatasetSummary | null;
    metadata?: DatasetMetadata | null;
    aestheticMode?: string;
    animationLevel?: string;
    model?: string;
    apiKey: string;
  }): Promise<AIArtisanResponse> {
    const {
      prompt,
      datasetId,
      summary,
      metadata,
      aestheticMode,
      animationLevel,
      model,
      apiKey,
    } = params;

    if (!apiKey) {
      throw new ApiError(
        'AI Artisan generations require a configured API key. Add one in Settings.',
        400
      );
    }

    const sampleRows = Array.isArray(metadata?.preview) ? metadata.preview.slice(0, 50) : [];
    const columnSummaries = summary?.columns ?? metadata?.columns ?? [];
    const columnTypes = metadata?.columnTypes ?? {};

    const columnsPayload = Array.isArray(columnSummaries)
      ? columnSummaries.map((column: any) => {
          if (typeof column === 'string') {
            return {
              name: column,
              type: columnTypes[column] ?? 'unknown',
              semantic_tags: [],
              stats: {},
              sample_values: [],
            };
          }
          return {
            name: column.name ?? column.column ?? 'unknown',
            type: column.type ?? columnTypes[column.name ?? column.column] ?? 'unknown',
            semantic_tags: column.semanticTags ?? column.semantic_tags ?? [],
            stats: column.stats ?? {},
            sample_values: column.sampleValues ?? column.sample_values ?? [],
          };
        })
      : [];

    const dataSummary = {
      dataset_id: datasetId,
      num_rows: summary?.rowCount ?? metadata?.rowCount ?? sampleRows.length,
      column_count: summary?.columnCount ?? columnSummaries.length,
      columns: columnsPayload,
      sample_rows: sampleRows,
    };

    const response = await fetchWithTimeout(
      `${this.baseUrl}/ai/artisan`,
      this.withAuth({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          data_summary: dataSummary,
          aesthetic_mode: aestheticMode ?? 'auto',
          animation_level: animationLevel ?? 'moderate',
          model: model ?? 'claude-opus-4.1',
          api_key: apiKey
        })
      })
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new ApiError(
        error.detail || 'Failed to generate AI Artisan visualization',
        response.status,
        error
      );
    }

    return response.json();
  }

  async getAIArtisanRemaining(): Promise<AIArtisanQuota> {
    const response = await fetchWithTimeout(
      `${this.baseUrl}/ai/artisan/remaining`,
      this.withAuth({}),
    );

    if (!response.ok) {
      throw new ApiError('Failed to get AI Artisan quota', response.status);
    }

    return response.json();
  }

  // Plugins
  async listPlugins(options?: { teamId?: string }): Promise<Array<{
    id: string;
    packageId: string;
    name: string;
    version: string;
    displayName?: string | null;
    description?: string | null;
    author?: string | null;
    source?: string | null;
    enabled: boolean;
    settings: Record<string, any>;
    scope: 'instance' | 'team' | 'user';
    locked: boolean;
    manifestUrl?: string;
    entryUrl?: string;
    permissions: string[];
  }>> {
    const params = new URLSearchParams();
    if (options?.teamId) params.set('teamId', options.teamId);
    const response = await fetchWithTimeout(
      `${this.baseUrl}/plugins${params.toString() ? `?${params}` : ''}`,
      this.withAuth(),
    );
    return response.json();
  }

  async getPluginConflicts(): Promise<{ conflicts: Array<{ selector: string; type: string; plugins: string[] }> }> {
    const response = await fetchWithTimeout(
      `${this.baseUrl}/plugins/conflicts`,
      this.withAuth(),
    );
    return response.json();
  }

  async installPlugin(payload: {
    scope: 'instance' | 'team' | 'user';
    teamId?: string;
    name: string;
    version: string;
    source: 'npm' | 'git' | 'local';
    path: string;
    displayName?: string;
    description?: string;
    author?: string;
    permissions?: string[];
  }): Promise<{ id: string; name: string; message: string }> {
    const response = await fetchWithTimeout(
      `${this.baseUrl}/plugins`,
      this.withAuth({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    );
    return response.json();
  }

  async updatePlugin(name: string, payload: Partial<{ 
    scope: 'instance' | 'team' | 'user';
    teamId?: string;
    enabled: boolean; 
    loadOrder: number; 
    settings: Record<string, unknown>;
    locked: boolean;
  }>): Promise<{ message: string }> {
    const response = await fetchWithTimeout(
      `${this.baseUrl}/plugins/${encodeURIComponent(name)}`,
      this.withAuth({
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    );
    return response.json();
  }

  async uninstallPlugin(name: string, scope: 'instance' | 'team' | 'user', teamId?: string): Promise<{ message: string }> {
    const params = new URLSearchParams();
    params.set('scope', scope);
    if (teamId) params.set('teamId', teamId);
    
    const response = await fetchWithTimeout(
      `${this.baseUrl}/plugins/${encodeURIComponent(name)}?${params}`,
      this.withAuth({ method: 'DELETE' }),
    );
    return response.json();
  }

  async getPluginLibrary(): Promise<{ plugins: Array<{
    name: string;
    version: string;
    displayName?: string;
    description?: string;
    author?: string;
    source: 'npm' | 'git' | 'local';
    path: string;
    icon?: string;
    permissions?: string[];
    isSigned?: boolean;
    signedBy?: string;
  }> }> {
    const response = await fetchWithTimeout(
      `${this.baseUrl}/plugins/library`,
      this.withAuth(),
    );
    return response.json();
  }
}

// Type definitions for the new visualization system
export interface AIArtisanResponse {
  code: {
    html?: string;
    css?: string;
    js: string;
  };
  sandbox_config: {
    libraries: string[];
    sandbox: string[];
    csp: string;
  };
  cost: number;
  generation_time_ms: number;
  model_used: string;
  can_edit: boolean;
  can_remix: boolean;
}

export interface AIArtisanQuota {
  remaining: number;
  limit: number;
  plan: string;
  resets_at?: string;
}

export const api = new ApiService();
