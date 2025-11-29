/**
 * OpenStrand API Service
 * Handles all communication with the backend API
 */

import {
  Strand,
  Thread,
  Pattern,
  Weave,
  WeaveNode,
  WeaveEdge,
  Relationship,
  StrandPermission,
  StrandLinkSummary,
  StrandHierarchyNode,
  StrandVisibilitySnapshot,
  StrandStructureRequest,
  StructureRequestStatus,
  StructureRequestType,
  AccessRole,
  QualityMatrix,
  CapabilityMatrix,
  GrantPermissionPayload,
  ShareLinkResponse,
  QualityVotePayload,
  AIArtisanQuota,
  ContentEnhancement,
  PlaceholderPreferences,
  StrandAnalyticsSummary,
  LoomAnalyticsSummary,
  WeaveAnalyticsSummary,
} from '@/types/openstrand';

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
const API_TIMEOUT = 30000; // 30 seconds
const OFFLINE_MODE = process.env.NEXT_PUBLIC_OFFLINE_MODE === 'true';

export interface TeamApiToken {
  id: string;
  teamId: string;
  name: string;
  description?: string | null;
  lastFour: string;
  scopes: string[];
  createdAt: string;
  createdById?: string | null;
  expiresAt?: string | null;
  lastUsedAt?: string | null;
  revokedAt?: string | null;
  revokedById?: string | null;
  status: 'active' | 'expired' | 'revoked';
  teamPlan: string;
}

export interface CreateTeamApiTokenPayload {
  teamId: string;
  name: string;
  description?: string;
  scopes?: string[];
  expiresAt?: string;
}

export interface CreateTeamApiTokenResponse {
  token: TeamApiToken;
  plaintext: string;
}

export interface TeamAdminSummary {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  plan: string;
}

export interface OcrResult {
  text: string;
  confidence: number;
  language: string;
  wordCount: number;
  lineCount: number;
  processingTime: number;
}

export interface FlashcardIllustrationOptions {
  flashcardIds?: string[];
  side?: 'front' | 'back' | 'both';
  stylePreset?:
    | 'minimal_vector'
    | 'flat_pastel'
    | 'watercolor_soft'
    | 'pencil_sketch'
    | 'comic_lineart'
    | 'realistic_soft'
    | 'chalkboard'
    | 'blueprint'
    | 'retro_comic'
    | 'noir_mono'
    | 'digital_paint'
    | 'pixel_8bit'
    | 'pixel_16bit'
    | 'ps1_lowpoly'
    | 'vaporwave'
    | 'anime_cel'
    | 'anime_soft'
    | 'manga_ink'
    | 'render_3d'
    | 'photorealistic'
    | 'clay_render'
    | 'isometric'
    | 'paper_cutout'
    | 'stained_glass'
    | 'neon_sign'
    | 'custom';
  customStylePrompt?: string;
  safetyLevel?: 'default' | 'censored' | 'uncensored' | 'strict';
  imageOptions?: {
    size?: '256x256' | '512x512' | '1024x1024' | '1792x1024' | '1024x1792';
    quality?: 'standard' | 'hd';
    style?: 'natural' | 'vivid';
    n?: number;
    responseFormat?: 'url' | 'b64_json';
    seed?: number;
  };
  overwrite?: boolean;
  includeAnswerContext?: boolean;
}

export interface QuizIllustrationOptions
  extends Omit<FlashcardIllustrationOptions, 'flashcardIds' | 'side' | 'includeAnswerContext'> {
  questionIds?: string[];
  includeExplanation?: boolean;
}

/**
 * API Error class for better error handling
 */
export class APIError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public data?: unknown
  ) {
    super(`API Error ${status}: ${statusText}`);
    this.name = 'APIError';
  }
}

/**
 * Base fetch wrapper with error handling
 */
async function apiFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const { headers: customHeaders, ...rest } = options;
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(customHeaders as Record<string, string> | undefined),
    };

    const isFormDataBody =
      typeof FormData !== 'undefined' && rest.body instanceof FormData;

    if (isFormDataBody) {
      delete requestHeaders['Content-Type'];
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...rest,
      signal: controller.signal,
      headers: requestHeaders,
      credentials: 'include', // Include cookies for auth
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new APIError(response.status, response.statusText, errorData);
    }

    return response;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof APIError) {
      throw error;
    }

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    }

    throw new Error('Unknown error occurred');
  }
}

async function parseData<T>(response: Response): Promise<T> {
  try {
    const json = await response.json();
    if (json && typeof json === 'object' && 'data' in json) {
      return (json as { data: T }).data;
    }
    return json as T;
  } catch {
    return undefined as T;
  }
}

const ensureArray = <T>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

const coerceString = (value: unknown, fallback = ''): string => {
  if (typeof value === 'string') return value;
  if (value === null || value === undefined) return fallback;
  return String(value);
};

const coerceNumber = (value: unknown, fallback?: number): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

function deserializeRelationship(raw: any): Relationship | null {
  if (!raw) return null;
  const targetId = raw.targetId ?? raw.target_id;
  if (!targetId) return null;
  return {
    targetId: targetId,
    target_id: raw.target_id,
    type: raw.type ?? 'related',
    weight: coerceNumber(raw.weight ?? raw.strength ?? 1),
    scopeId: raw.scopeId ?? raw.scope_id ?? undefined,
    scope_id: raw.scope_id ?? undefined,
    provenance: raw.provenance ?? undefined,
    justification: raw.justification ?? raw.note ?? undefined,
    description: raw.description ?? undefined,
    metadata: raw.metadata ?? undefined,
  };
}

function deserializeStructuralEdges(raw: any): StrandLinkSummary['structural'] {
  const parents = ensureArray<any>(raw?.parents ?? raw?.incoming ?? []).map((edge) => ({
    strandId: edge?.strandId ?? edge?.strand_id ?? edge?.sourceId ?? edge?.source_id ?? '',
    scopeId: edge?.scopeId ?? edge?.scope_id ?? undefined,
    provenance: edge?.provenance ?? undefined,
    weight: coerceNumber(edge?.weight, 1) ?? 1,
    title: edge?.summary?.title ?? edge?.source?.title ?? undefined,
    slug: edge?.summary?.slug ?? edge?.source?.slug ?? undefined,
    strandType: edge?.summary?.strandType ?? edge?.source?.strandType ?? undefined,
  }));

  const children = ensureArray<any>(raw?.children ?? raw?.outgoing ?? []).map((edge) => ({
    strandId: edge?.strandId ?? edge?.strand_id ?? edge?.targetId ?? edge?.target_id ?? '',
    scopeId: edge?.scopeId ?? edge?.scope_id ?? undefined,
    provenance: edge?.provenance ?? undefined,
    weight: coerceNumber(edge?.weight, 1) ?? 1,
    title: edge?.summary?.title ?? edge?.target?.title ?? undefined,
    slug: edge?.summary?.slug ?? edge?.target?.slug ?? undefined,
    strandType: edge?.summary?.strandType ?? edge?.target?.strandType ?? undefined,
  }));

  return {
    parents,
    children,
  };
}

function deserializeLinkSummary(raw: any): StrandLinkSummary | undefined {
  if (!raw) return undefined;
  const outgoing = ensureArray<any>(raw.outgoing)
    .map(deserializeRelationship)
    .filter((rel): rel is Relationship => Boolean(rel));
  const incoming = ensureArray<any>(raw.incoming)
    .map(deserializeRelationship)
    .filter((rel): rel is Relationship => Boolean(rel));
  const structural = deserializeStructuralEdges(raw.structural ?? raw);

  return {
    outgoing,
    incoming,
    structural,
  };
}

function deserializeHierarchy(raw: any): StrandHierarchyNode[] | undefined {
  const nodes = ensureArray<any>(raw ?? []);
  if (nodes.length === 0) return undefined;
  return nodes.map((node) => ({
    scopeId: node.scopeId ?? node.scope_id ?? '',
    parentId: node.parentId ?? node.parent_id ?? undefined,
    depth: node.depth ?? 0,
    position: node.position ?? 0,
    path: node.path ?? '',
    isPrimary: node.isPrimary ?? node.is_primary ?? false,
    scope: node.scope
      ? {
          id: node.scope.id,
          name: node.scope.name,
          scopeType: node.scope.scopeType ?? node.scope.scope_type ?? '',
        }
      : undefined,
  }));
}

function deserializeVisibility(raw: any): StrandVisibilitySnapshot[] | undefined {
  const snapshots = ensureArray<any>(raw ?? []);
  if (snapshots.length === 0) return undefined;
  return snapshots.map((snapshot) => ({
    scopeId: snapshot.scopeId ?? snapshot.scope_id ?? '',
    audience: snapshot.audience ?? 'default',
    isVisible: Boolean(snapshot.isVisible ?? snapshot.is_visible ?? false),
    isPlaceholder: Boolean(snapshot.isPlaceholder ?? snapshot.is_placeholder ?? false),
    inheritedFrom: snapshot.inheritedFrom ?? snapshot.inherited_from ?? undefined,
    metadata: snapshot.metadata ?? undefined,
  }));
}

function deserializeStructureRequests(raw: any): StrandStructureRequest[] | undefined {
  const normalise = (value: any): any[] => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (Array.isArray(value.requests)) return value.requests;
    if (Array.isArray(value.items)) return value.items;
    if (value.request) return [value.request];
    if (value.item) return [value.item];
    if (value.data && value !== value.data) {
      const nested = normalise(value.data);
      if (nested.length > 0) {
        return nested;
      }
    }
    return typeof value === 'object' ? [value] : [];
  };

  const requests = normalise(raw);
  if (requests.length === 0) return undefined;

  return requests
    .map<StrandStructureRequest | null>((request) => {
      if (!request) return null;

      const payload =
        request.payload && typeof request.payload === 'object' && !Array.isArray(request.payload)
          ? { ...(request.payload as Record<string, unknown>) }
          : {};

      const resolutionNote =
        (typeof request.resolutionNote === 'string' && request.resolutionNote.trim().length > 0
          ? request.resolutionNote.trim()
          : undefined) ??
        (typeof request.resolution_note === 'string' && request.resolution_note.trim().length > 0
          ? request.resolution_note.trim()
          : undefined) ??
        (typeof payload.resolutionNote === 'string' && payload.resolutionNote.trim().length > 0
          ? (payload.resolutionNote as string).trim()
          : undefined) ??
        (typeof payload.resolution_note === 'string' && (payload.resolution_note as string).trim().length > 0
          ? (payload.resolution_note as string).trim()
          : undefined);

      if ('resolutionNote' in payload) {
        delete payload.resolutionNote;
      }

      if ('resolution_note' in payload) {
        delete payload.resolution_note;
      }

      const scope = request.scope
        ? {
            id: coerceString(request.scope.id ?? request.scope_id),
            name: request.scope.name ?? undefined,
            scopeType: request.scope.scopeType ?? request.scope.scope_type ?? undefined,
          }
        : undefined;

      const parent = request.parent
        ? {
            id: coerceString(request.parent.id ?? request.parent_id),
            title: request.parent.title ?? undefined,
            slug: request.parent.slug ?? undefined,
          }
        : undefined;

      const requester = request.requester
        ? {
            id: coerceString(request.requester.id ?? request.requester_id),
            username: request.requester.username ?? undefined,
            displayName: request.requester.displayName ?? undefined,
          }
        : undefined;

      const reviewer = request.reviewer
        ? {
            id: coerceString(request.reviewer.id ?? request.reviewer_id),
            username: request.reviewer.username ?? undefined,
            displayName: request.reviewer.displayName ?? undefined,
          }
        : undefined;

      return {
        id: coerceString(request.id),
        scopeId: coerceString(request.scopeId ?? request.scope_id),
        strandId: coerceString(request.strandId ?? request.strand_id),
        parentId: request.parentId ?? request.parent_id ?? undefined,
        requestedBy: coerceString(request.requestedBy ?? request.requested_by),
        reviewedBy: request.reviewedBy ?? request.reviewed_by ?? undefined,
        type: (request.type ?? request.request_type ?? 'ADD_CHILD') as StructureRequestType,
        status: (request.status ?? request.request_status ?? 'PENDING') as StructureRequestStatus,
        payload,
        justification: request.justification ?? request.note ?? undefined,
        resolutionNote,
        createdAt: request.createdAt ?? request.created_at ?? new Date().toISOString(),
        updatedAt: request.updatedAt ?? request.updated_at ?? request.createdAt ?? new Date().toISOString(),
        resolvedAt: request.resolvedAt ?? request.resolved_at ?? undefined,
        scope,
        parent,
        requester,
        reviewer,
      };
    })
    .filter((request): request is StrandStructureRequest => Boolean(request))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

function deserializeStrand(raw: any): Strand {
  if (!raw) {
    throw new Error('Invalid strand payload');
  }

  const relationships = ensureArray<any>(raw.relationships ?? raw.links?.outgoing ?? [])
    .map(deserializeRelationship)
    .filter((rel): rel is Relationship => Boolean(rel));

  const linkSummary = deserializeLinkSummary(raw.links);
  const hierarchy = deserializeHierarchy(
    raw.hierarchy ?? raw.hierarchyPositions ?? raw.hierarchy_positions
  );
  const visibilityState = deserializeVisibility(
    raw.visibilityState ?? raw.visibilitySnapshots ?? raw.visibility_snapshots
  );
  const structureRequests = deserializeStructureRequests(
    raw.structureRequests ?? raw.structure_requests
  );

  const createdAt = raw.created ?? raw.created_at ?? new Date().toISOString();
  const updatedAt =
    raw.updated ?? raw.updated_at ?? raw.modified ?? raw.modified_at ?? createdAt;

  const quality =
    raw.quality ??
    raw.quality_metrics ?? {
      llm_rating: raw.llmRating ?? undefined,
      human_ratings: raw.humanRatings ?? {},
      composite_score: raw.qualityScore ?? undefined,
      confidence: raw.qualityConfidence ?? undefined,
      last_updated: raw.qualityLastUpdated ?? raw.quality_last_updated ?? undefined,
    };

  return {
    id: coerceString(raw.id),
    strandType: (raw.strandType ?? raw.strand_type ?? raw.type ?? 'document') as Strand['strandType'],
    type: (raw.strandType ?? raw.type ?? raw.strand_type) as Strand['type'],
    classification: raw.classification ?? undefined,
    title: coerceString(raw.title),
    slug: coerceString(raw.slug ?? raw.id),
    summary: raw.summary ?? undefined,
    contentType: raw.contentType ?? raw.content_type ?? undefined,
    placeholderBehavior: raw.placeholderBehavior ?? raw.placeholder_behavior ?? undefined,
    created: createdAt,
    modified: updatedAt,
    updated: updatedAt,
    noteType: raw.noteType ?? raw.note_type ?? undefined,
    coAuthorIds: raw.coAuthorIds ?? raw.co_author_ids ?? undefined,
    difficulty: raw.difficulty ?? undefined,
    learningObjectives: raw.learningObjectives ?? raw.learning_objectives ?? undefined,
    learning_objectives: raw.learning_objectives ?? raw.learningObjectives ?? undefined,
    prerequisites: raw.prerequisites ?? [],
    spiralMetadata: raw.spiralMetadata ?? raw.spiral_metadata ?? undefined,
    spiral_metadata: raw.spiral_metadata ?? raw.spiralMetadata ?? undefined,
    scaffoldVariants: raw.scaffoldVariants ?? raw.scaffold_variants ?? undefined,
    scaffold_variants: raw.scaffold_variants ?? raw.scaffoldVariants ?? undefined,
    representationalVariants:
      raw.representationalVariants ?? raw.representational_variants ?? undefined,
    representational_variants:
      raw.representational_variants ?? raw.representationalVariants ?? undefined,
    vizConfig: raw.vizConfig ?? raw.viz_config ?? undefined,
    viz_config: raw.viz_config ?? raw.vizConfig ?? undefined,
    assessmentData: raw.assessmentData ?? raw.assessment_data ?? undefined,
    assessment_data: raw.assessment_data ?? raw.assessmentData ?? undefined,
    content: raw.content ?? {},
    metadata: raw.metadata ?? {},
    relationships,
    links: linkSummary,
    hierarchy,
    visibilityState,
    analysisStatus: raw.analysisStatus ?? raw.analysis_status ?? undefined,
    analysis_status: raw.analysis_status ?? raw.analysisStatus ?? undefined,
    analysisProvider: raw.analysisProvider ?? raw.analysis_provider ?? undefined,
    analysis_provider: raw.analysis_provider ?? raw.analysisProvider ?? undefined,
    document_analysis: raw.document_analysis ?? raw.documentAnalysis ?? undefined,
    documentAnalysis: raw.documentAnalysis ?? raw.document_analysis ?? undefined,
    media_analysis: raw.media_analysis ?? raw.mediaAnalysis ?? undefined,
    mediaAnalysis: raw.mediaAnalysis ?? raw.media_analysis ?? undefined,
    analysis_notes: raw.analysis_notes ?? raw.analysisNotes ?? [],
    analysisNotes: raw.analysisNotes ?? raw.analysis_notes ?? [],
    derivatives: raw.derivatives ?? [],
    visibility: raw.visibility ?? 'private',
    owner_id: raw.owner_id ?? raw.ownerId ?? undefined,
    ownerId: raw.ownerId ?? raw.owner_id ?? undefined,
    createdBy: raw.createdBy ?? raw.created_by ?? undefined,
    updatedBy: raw.updatedBy ?? raw.updated_by ?? undefined,
    teamId: raw.teamId ?? raw.team_id ?? undefined,
    primaryScopeId: raw.primaryScopeId ?? raw.primary_scope_id ?? undefined,
    permissions: raw.permissions ?? [],
    shared_with: raw.shared_with ?? raw.sharedWith ?? undefined,
    sharedWith: raw.sharedWith ?? raw.shared_with ?? undefined,
    structureRequests,
    quality,
    qualityScore: raw.qualityScore ?? quality?.composite_score ?? undefined,
    qualityConfidence: raw.qualityConfidence ?? quality?.confidence ?? undefined,
    llmRating: raw.llmRating ?? quality?.llm_rating ?? undefined,
    humanRatings: raw.humanRatings ?? quality?.human_ratings ?? undefined,
    contentHash: raw.contentHash ?? raw.content_hash ?? undefined,
    perceptualHash: raw.perceptualHash ?? raw.perceptual_hash ?? undefined,
    fileSize: raw.fileSize ?? raw.file_size ?? undefined,
    views: raw.views ?? undefined,
    likes: raw.likes ?? undefined,
    completion_rate: raw.completion_rate ?? raw.completionRate ?? undefined,
    completionRate: raw.completionRate ?? raw.completion_rate ?? undefined,
  };
}

function normalizeWeaveNodes(rawNodes: any): WeaveNode[] {
  const nodes = ensureArray<any>(rawNodes);

  return nodes.map((node) => {
    const metadata = { ...(node.metadata ?? {}) } as Record<string, unknown>;
    const strandIdentifier = coerceString(
      node.strandId ?? metadata.strandId ?? metadata.strand_id ?? '',
    );
    delete metadata.strandId;
    delete metadata.strand_id;

    const title = coerceString(
      node.title ?? metadata.title ?? node.name ?? metadata.name ?? 'Untitled node',
    );
    if (metadata.title === undefined) {
      metadata.title = title;
    }

    const type = coerceString(node.type ?? metadata.type ?? 'strand');
    if (metadata.type === undefined) {
      metadata.type = type;
    }

    const importance = coerceNumber(node.importance ?? metadata.importance, 1) ?? 1;
    if (metadata.importance === undefined) {
      metadata.importance = importance;
    }

    const summary = node.summary ?? metadata.summary ?? undefined;

    const positionSource = node.position ?? metadata.position;
    let position: { x: number; y: number; z?: number } | undefined;
    if (positionSource && typeof positionSource === 'object') {
      const x = coerceNumber((positionSource as any).x, 0) ?? 0;
      const y = coerceNumber((positionSource as any).y, 0) ?? 0;
      const z = coerceNumber((positionSource as any).z, undefined);
      position = { x, y, z };
    }
    if (position) {
      metadata.position = position;
    } else if (metadata.position === undefined) {
      delete metadata.position;
    }

    const idCandidate = coerceString(
      node.id ?? node.strandId ?? metadata.id ?? strandIdentifier,
    );
    if (metadata.id !== undefined) {
      delete metadata.id;
    }
    const id = idCandidate || `node-${Math.random().toString(36).slice(2, 10)}`;

    const normalizedMetadata = Object.fromEntries(
      Object.entries(metadata).filter(([, value]) => value !== undefined),
    );

    return {
      id,
      type,
      title,
      importance,
      summary,
      strandId: strandIdentifier || undefined,
      position,
      metadata: Object.keys(normalizedMetadata).length ? normalizedMetadata : undefined,
    };
  });
}

function normalizeWeaveNode(raw: any): WeaveNode {
  const node = normalizeWeaveNodes([raw])[0];
  if (!node) {
    throw new Error('Invalid weave node payload');
  }
  return node;
}

function normalizeWeaveEdges(rawEdges: any): WeaveEdge[] {
  const edges = ensureArray<any>(rawEdges);

  return edges.map((edge) => {
    const metadata = { ...(edge.metadata ?? {}) } as Record<string, unknown>;
    const source = coerceString(edge.source ?? edge.sourceId ?? edge.source_id ?? '');
    const target = coerceString(edge.target ?? edge.targetId ?? edge.target_id ?? '');
    const type = coerceString(edge.type ?? edge.relationshipType ?? metadata.type ?? 'related');
    const weight = coerceNumber(edge.weight ?? metadata.weight, 1) ?? 1;

    const note = edge.note ?? edge.justification ?? metadata.note ?? undefined;
    if (metadata.note !== undefined) {
      delete metadata.note;
    }

    const createdBy = edge.createdBy ?? edge.created_by ?? metadata.createdBy ?? metadata.created_by ?? undefined;
    delete metadata.createdBy;
    delete metadata.created_by;

    const idCandidate = edge.id ?? edge.edgeId ?? edge.edge_id ?? metadata.id ?? undefined;
    if (metadata.id !== undefined) {
      delete metadata.id;
    }

    const normalizedMetadata = Object.fromEntries(
      Object.entries(metadata).filter(([, value]) => value !== undefined),
    );

    return {
      id: idCandidate ? coerceString(idCandidate) : undefined,
      source,
      target,
      type,
      weight,
      note: note !== undefined ? coerceString(note) : undefined,
      createdBy: createdBy !== undefined ? coerceString(createdBy) : undefined,
      metadata: Object.keys(normalizedMetadata).length ? normalizedMetadata : undefined,
    };
  });
}

function normalizeWeaveEdge(raw: any): WeaveEdge {
  const edge = normalizeWeaveEdges([raw])[0];
  if (!edge) {
    throw new Error('Invalid weave edge payload');
  }
  return edge;
}

function deserializeWeave(raw: any): Weave {
  if (!raw) {
    throw new Error('Invalid weave payload');
  }

  const config = raw.config ?? {};
  const nodes = normalizeWeaveNodes(raw.nodes ?? config.nodes ?? []);
  const edges = normalizeWeaveEdges(raw.edges ?? config.edges ?? []);

  return {
    id: coerceString(raw.id),
    name: coerceString(raw.name ?? 'Knowledge Graph'),
    domain: coerceString(raw.domain ?? config.domain ?? 'default'),
    nodes,
    edges,
    metadata: raw.metadata ?? config.metadata ?? undefined,
    metrics: raw.metrics ?? config.metrics ?? undefined,
    communities: raw.communities ?? config.communities ?? undefined,
    created: raw.created ?? raw.created_at ?? new Date().toISOString(),
    modified: raw.updated ?? raw.updated_at ?? raw.modified ?? new Date().toISOString(),
  };
}

/**
 * Strand Operations
 */
export const strandAPI = {
  /**
   * Create a new strand
   */
  async create(strand: Partial<Strand>): Promise<Strand> {
    const response = await apiFetch('/strands', {
      method: 'POST',
      body: JSON.stringify(strand),
    });
    return deserializeStrand(await parseData(response));
  },

  /**
   * Upload content and create strand
   */
  async upload(file: File, metadata?: Record<string, unknown>): Promise<Strand> {
    const formData = new FormData();
    formData.append('file', file);
    if (metadata) {
      formData.append('metadata', JSON.stringify(metadata));
    }

    const response = await apiFetch('/strands/upload', {
      method: 'POST',
      body: formData,
    });
    return deserializeStrand(await parseData(response));
  },

  /**
   * Get strand by ID
   */
  async get(id: string): Promise<Strand> {
    const response = await apiFetch(`/strands/${id}`);
    return deserializeStrand(await parseData(response));
  },

  /**
   * Update strand
   */
  async update(id: string, updates: Partial<Strand>): Promise<Strand> {
    const response = await apiFetch(`/strands/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    return deserializeStrand(await parseData(response));
  },

  /**
   * Delete strand
   */
  async delete(id: string): Promise<void> {
    await apiFetch(`/strands/${id}`, { method: 'DELETE' });
  },

  /**
   * List strands with filters
   */
  async list(filters?: {
    type?: string;
    noteType?: string;
    visibility?: string;
    scopeId?: string;
    teamId?: string;
    difficulty?: string;
    tags?: string[];
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ strands: Strand[]; total: number }> {
    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        if (Array.isArray(value)) {
          value.forEach((v) => params.append(key, String(v)));
        } else {
          params.append(key, String(value));
        }
      });
    }

    const query = params.toString();
    const response = await apiFetch(query ? `/strands?${query}` : '/strands');
    const data = await parseData<any>(response);

    const items: any[] = Array.isArray(data?.items)
      ? data.items
      : Array.isArray(data?.strands)
        ? data.strands
        : Array.isArray(data)
          ? data
          : [];

    return {
      strands: items.map(deserializeStrand),
      total: data?.total ?? items.length,
    };
  },

  /**
   * Create or update a conceptual relationship from the source strand
   */
  async createRelationship(id: string, relationship: Relationship): Promise<Relationship> {
    const response = await apiFetch(`/strands/${id}/relationships`, {
      method: 'POST',
      body: JSON.stringify(relationship),
    });
    const payload = await parseData<any>(response);
    return deserializeRelationship(payload) ?? {
      targetId: relationship.targetId,
      type: relationship.type,
      weight: relationship.weight,
      scopeId: relationship.scopeId,
      metadata: relationship.metadata,
    };
  },

  /**
   * Remove a conceptual relationship
   */
  async removeRelationship(
    id: string,
    targetId: string,
    options?: { type?: string; scopeId?: string },
  ): Promise<void> {
    await apiFetch(`/strands/${id}/relationships`, {
      method: 'DELETE',
      body: JSON.stringify({
        targetId,
        type: options?.type,
        scopeId: options?.scopeId,
      }),
    });
  },

  /**
   * Get related strands
   */
  async getRelated(id: string, limit: number = 5): Promise<Strand[]> {
    const response = await apiFetch(`/strands/${id}/related?limit=${limit}`);
    const payload = await parseData<any>(response);
    const items: any[] = Array.isArray(payload) ? payload : payload?.items ?? [];
    return items.map(deserializeStrand);
  },

  /**
   * Get strand prerequisites
   */
  async getPrerequisites(id: string): Promise<Strand[]> {
    const response = await apiFetch(`/strands/${id}/prerequisites`);
    const payload = await parseData<any>(response);
    const items: any[] = Array.isArray(payload) ? payload : payload?.items ?? [];
    return items.map(deserializeStrand);
  },

  /**
   * Access control helpers
   */
  async listPermissions(id: string): Promise<StrandPermission[]> {
    const response = await apiFetch(`/strands/${id}/permissions`);
    return await parseData<StrandPermission[]>(response);
  },

  async grantPermission(
    id: string,
    payload: GrantPermissionPayload,
  ): Promise<StrandPermission> {
    const response = await apiFetch(`/strands/${id}/permissions`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return await parseData<StrandPermission>(response);
  },

  async revokePermission(id: string, permissionId: string): Promise<void> {
    await apiFetch(`/strands/${id}/permissions/${permissionId}`, {
      method: 'DELETE',
    });
  },

  async createShareLink(
    id: string,
    payload: { role: AccessRole; expires_at?: string },
  ): Promise<ShareLinkResponse> {
    const response = await apiFetch(`/strands/${id}/shares`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return await parseData<ShareLinkResponse>(response);
  },

  async redeemShareLink(token: string): Promise<Strand> {
    const response = await apiFetch(`/strands/shares/redeem`, {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
    return deserializeStrand(await parseData(response));
  },

  /**
   * Structure requests & approvals
   */
  async requestStructureChange(
    strandId: string,
    payload: {
      scopeId: string;
      type: StructureRequestType;
      parentId?: string;
      targetId?: string;
      position?: number;
      metadata?: Record<string, unknown>;
      justification?: string;
    },
  ): Promise<StrandStructureRequest | null> {
    const response = await apiFetch(`/strands/${strandId}/structure/requests`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const requests = deserializeStructureRequests(await parseData<any>(response));
    return requests?.[0] ?? null;
  },

  async listStructureRequests(
    strandId: string,
    options?: { scopeId?: string; status?: StructureRequestStatus | 'ALL'; limit?: number },
  ): Promise<StrandStructureRequest[]> {
    const params = new URLSearchParams();
    if (options?.scopeId) params.set('scopeId', options.scopeId);
    if (options?.status && options.status !== 'ALL') {
      params.set('status', options.status);
    }
    if (options?.limit) {
      params.set('limit', String(options.limit));
    }

    const query = params.toString();
    const response = await apiFetch(
      query
        ? `/strands/${strandId}/structure/requests?${query}`
        : `/strands/${strandId}/structure/requests`,
    );
    return deserializeStructureRequests(await parseData<any>(response)) ?? [];
  },

  async resolveStructureRequest(
    requestId: string,
    action: 'approve' | 'reject' | 'cancel',
    note?: string,
  ): Promise<StrandStructureRequest | null> {
    const response = await apiFetch(`/strands/structure/requests/${requestId}/${action}`, {
      method: 'POST',
      body: JSON.stringify({ note }),
    });
    const requests = deserializeStructureRequests(await parseData<any>(response));
    if (requests?.length) {
      return requests[0];
    }
    if (action === 'cancel') {
      return null;
    }
    return null;
  },

  /**
   * Quality signals
   */
  async getQuality(id: string): Promise<QualityMatrix> {
    const response = await apiFetch(`/strands/${id}/quality`);
    return await parseData<QualityMatrix>(response);
  },

  async submitQualityVote(
    id: string,
    payload: QualityVotePayload,
  ): Promise<QualityMatrix> {
    const response = await apiFetch(`/strands/${id}/quality/votes`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return await parseData<QualityMatrix>(response);
  },

  async refreshQuality(id: string): Promise<{ status: string }> {
    const response = await apiFetch(`/strands/${id}/quality/refresh`, { method: 'POST' });
    return await parseData<{ status: string }>(response);
  },
};



/**
 * Visualization Operations
 */
export const visualizationAPI = {
  async list(options?: { page?: number; pageSize?: number; tier?: number }): Promise<{ items: any[]; total: number; page: number; pageSize: number; totalPages: number }> {
    const params = new URLSearchParams();
    if (options?.page) params.set('page', String(options.page));
    if (options?.pageSize) params.set('pageSize', String(options.pageSize));
    if (options?.tier) params.set('tier', String(options.tier));
    const response = await apiFetch(`/visualizations${params.toString() ? `?${params.toString()}` : ''}`);
    return await parseData(response);
  },

  async getTop(limit: number = 10): Promise<Strand[]> {
    const response = await apiFetch(`/visualizations/top?limit=${limit}`);
    return response.json();
  },

  async get(id: string): Promise<any> {
    const response = await apiFetch(`/visualizations/${id}`);
    return await parseData(response);
  },

  async update(id: string, data: Record<string, unknown>): Promise<any> {
    const response = await apiFetch(`/visualizations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    return await parseData(response);
  },

  async remove(id: string): Promise<void> {
    await apiFetch(`/visualizations/${id}`, { method: 'DELETE' });
  },

  async export(id: string, format: 'png' | 'svg' | 'json' = 'json'): Promise<Blob> {
    const response = await apiFetch(`/visualizations/${id}/export`, {
      method: 'POST',
      body: JSON.stringify({ format })
    });
    if (format === 'json') {
      const data = await response.json();
      return new Blob([JSON.stringify(data)], { type: 'application/json' });
    }
    return response.blob();
  },
};

/**
 * Dataset Operations
 */
export const datasetAPI = {
  async getTop(limit: number = 10): Promise<Strand[]> {
    const response = await apiFetch(`/datasets/top?limit=${limit}`);
    return response.json();
  },
};

/**
 * Analysis Operations
 */
export const analysisAPI = {
  async queueDocument(strandId: string): Promise<{ job_id: string; status: string }> {
    const response = await apiFetch(`/analysis/${strandId}/document`, {
      method: 'POST',
    });
    return response.json();
  },

  async queueMedia(strandId: string): Promise<{ job_id: string; status: string }> {
    const response = await apiFetch(`/analysis/${strandId}/media`, {
      method: 'POST',
    });
    return response.json();
  },

  async listJobs(): Promise<Record<string, string>> {
    const response = await apiFetch('/analysis/jobs');
    return response.json();
  },
};

/**
 * Meta Operations
 */
export const metaAPI = {
  async capabilities(): Promise<CapabilityMatrix> {
    // In offline mode or when API is unavailable, return default capabilities
    if (OFFLINE_MODE || API_BASE_URL === 'http://localhost:8000/api/v1') {
      console.debug('[api] offline mode or local API not available, returning default capabilities');
      return {
        analysisPipeline: false,
        documentAnalysis: false,
        mediaAnalysis: false,
        dynamicVisualizations: false,
        generativeVisualizations: false,
        topContent: false,
        aiArtisan: false,
        knowledgeGraph: false,
        analytics: {
          googleAnalytics: false,
        },
        environment: {
          mode: 'offline',
        },
        api: {
          teamsAuthEnabled: false,
          swaggerEnabled: false,
          openRouter: false,
          openAI: false,
          anthropic: false,
        },
      };
    }
    
    try {
      const response = await apiFetch('/meta/capabilities');
      return await parseData<CapabilityMatrix>(response);
    } catch (error) {
      console.debug('[api] failed to fetch capabilities, returning default', error);
      return {
        analysisPipeline: false,
        documentAnalysis: false,
        mediaAnalysis: false,
        dynamicVisualizations: false,
        generativeVisualizations: false,
        topContent: false,
        aiArtisan: false,
        knowledgeGraph: false,
        analytics: {
          googleAnalytics: false,
        },
        environment: {
          mode: 'offline',
        },
        api: {
          teamsAuthEnabled: false,
          swaggerEnabled: false,
          openRouter: false,
          openAI: false,
          anthropic: false,
        },
      };
    }
  },

  async developer(): Promise<{
    swaggerUrl: string;
    apiBaseUrl: string;
    sdkDocsUrl: string;
    frameSiteUrl: string;
    teamPortalUrl: string;
  }> {
    const response = await apiFetch('/meta/developer');
    return await parseData(response);
  },

  async getPlaceholderPreferences(): Promise<PlaceholderPreferences> {
    const response = await apiFetch('/meta/placeholders');
    return (
      (await parseData<PlaceholderPreferences>(response)) ?? {
        default: { text: 'Hidden strand', icon: 'ph:lock' },
      }
    );
  },

  async updatePlaceholderPreferences(
    preferences: PlaceholderPreferences,
  ): Promise<PlaceholderPreferences> {
    const response = await apiFetch('/meta/placeholders', {
      method: 'PUT',
      body: JSON.stringify(preferences),
    });
    return await parseData<PlaceholderPreferences>(response);
  },
};

/**
 * Weave (Knowledge Graph) Operations
 */
export interface WeaveGraphQueryOptions {
  types?: string[];
  cluster?: boolean;
  limit?: number;
  depth?: number;
  bounds?: {
    center: { x: number; y: number; z?: number };
    radius: number;
  };
}

export interface WeaveNodeInput {
  id?: string;
  strandId?: string;
  label?: string;
  type?: string;
  position?: { x: number; y: number; z?: number };
  metadata?: Record<string, unknown>;
}

export interface WeaveNodeUpdateInput {
  strandId?: string | null;
  label?: string;
  type?: string;
  position?: { x?: number; y?: number; z?: number };
  metadata?: Record<string, unknown>;
}

export interface WeaveEdgeInput {
  source: string;
  target: string;
  type?: string;
  weight?: number;
  metadata?: Record<string, unknown>;
  note?: string;
}

export interface WeaveEdgeUpdateInput {
  type?: string;
  weight?: number;
  metadata?: Record<string, unknown>;
  note?: string | null;
}

export interface WeaveGraphSegment {
  nodes: WeaveNode[];
  edges: WeaveEdge[];
  metadata: Record<string, unknown>;
  clusters?: string[][];
}

export const weaveAPI = {
  async list(): Promise<Weave[]> {
    const response = await apiFetch('/weaves');
    const payload = await parseData<{ success?: boolean; data?: any[] } | any[]>(response);

    const items = (() => {
      if (!payload) return [];
      if (Array.isArray(payload)) return payload;
      if (typeof payload === 'object' && 'data' in payload && Array.isArray(payload.data)) {
        return payload.data;
      }
      return [];
    })();
    return items.map((item: any) => deserializeWeave(item));
  },

  /**
   * Get the full knowledge graph
   */
  async get(filters?: {
    domain?: string;
    nodeTypes?: string[];
    edgeTypes?: string[];
    maxNodes?: number;
  }): Promise<Weave> {
    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value === undefined || value === null) {
          return;
        }
        if (Array.isArray(value)) {
          value.forEach((entry) => params.append(key, String(entry)));
        } else {
          params.append(key, String(value));
        }
      });
    }

    const query = params.toString();
    const response = await apiFetch(query ? `/weaves?${query}` : '/weaves');
    return deserializeWeave(await parseData(response));
  },

  /**
   * Get subgraph around specific nodes
   */
  async getSubgraph(nodeIds: string[], depth: number = 1): Promise<Weave> {
    const response = await apiFetch('/weaves/subgraph', {
      method: 'POST',
      body: JSON.stringify({ nodeIds, node_ids: nodeIds, depth }),
    });
    return deserializeWeave(await parseData(response));
  },

  /**
   * Find shortest path between nodes
   */
  async findPath(
    source: string,
    target: string,
  ): Promise<{ path: string[]; edges: WeaveEdge[] }> {
    const response = await apiFetch(`/weaves/path?source=${source}&target=${target}`);
    const payload = await parseData<{ path?: string[]; edges?: any[] }>(response);
    return {
      path: Array.isArray(payload?.path) ? payload!.path! : [],
      edges: ensureArray<any>(payload?.edges).map((edge) => {
        const baseMetadata: Record<string, unknown> = {
          ...(edge.metadata ?? {}),
        };
        const note = edge.note ?? edge.justification ?? undefined;
        const createdBy = edge.createdBy ?? edge.created_by ?? undefined;
        if (note !== undefined) {
          baseMetadata.note = note;
        }
        if (createdBy !== undefined) {
          baseMetadata.createdBy = createdBy;
        }

        return {
          source: coerceString(edge.source ?? edge.sourceId ?? edge.source_id ?? ''),
          target: coerceString(edge.target ?? edge.targetId ?? edge.target_id ?? ''),
          type: edge.type ?? edge.relationshipType ?? 'related',
          weight: coerceNumber(edge.weight, 1) ?? 1,
          metadata: Object.keys(baseMetadata).length ? baseMetadata : undefined,
        };
      }),
    };
  },

  /**
   * Find learning path to target
   */
  async findLearningPath(target: string): Promise<string[]> {
    const response = await apiFetch(`/weaves/learning-path/${target}`);
    const payload = await parseData<{ path?: string[] }>(response);
    if (Array.isArray(payload)) {
      return payload as unknown as string[];
    }
    return payload?.path ?? [];
  },

  /**
   * Get graph metrics
   */
  async getMetrics(): Promise<{
    nodes: number;
    edges: number;
    density: number;
    communities: number;
    diameter: number;
  }> {
    const response = await apiFetch('/weaves/metrics');
    return await parseData(response);
  },

  /**
   * Get node centrality scores
   */
  async getCentrality(): Promise<
    Record<
      string,
      {
        degree: number;
        betweenness: number;
        closeness: number;
        pagerank: number;
      }
    >
  > {
    const response = await apiFetch('/weaves/centrality');
    return await parseData(response);
  },

  /**
   * Get content recommendations
   */
  async getRecommendations(
    completedIds: string[],
    interests?: string[],
  ): Promise<Array<{ strandId: string; score: number; reason: string }>> {
    const response = await apiFetch('/weaves/recommendations', {
      method: 'POST',
      body: JSON.stringify({
        completed: completedIds,
        interests: interests ?? [],
      }),
    });

    const payload = await parseData<
      Array<{ strand_id?: string; score: number; reason: string }>
    >(response);
    const items = Array.isArray(payload) ? payload : [];
    return items.map((item) => ({
      strandId: item.strand_id ?? '',
      score: item.score,
      reason: item.reason,
    }));
  },

  async getById(id: string): Promise<Weave> {
    const response = await apiFetch(`/weaves/${id}`);
    return deserializeWeave(await parseData(response));
  },

  async getGraphSegment(
    weaveId: string,
    options: WeaveGraphQueryOptions = {},
  ): Promise<WeaveGraphSegment> {
    const params = new URLSearchParams();

    if (options.types?.length) {
      params.set('types', options.types.join(','));
    }
    if (options.cluster) {
      params.set('cluster', 'true');
    }
    if (typeof options.limit === 'number') {
      params.set('limit', String(options.limit));
    }
    if (typeof options.depth === 'number') {
      params.set('depth', String(options.depth));
    }
    if (options.bounds) {
      params.set('radius', String(options.bounds.radius));
      params.set('cx', String(options.bounds.center.x));
      params.set('cy', String(options.bounds.center.y));
      if (typeof options.bounds.center.z === 'number') {
        params.set('cz', String(options.bounds.center.z));
      }
    }

    const query = params.toString();
    const response = await apiFetch(
      query ? `/weaves/${weaveId}/graph?${query}` : `/weaves/${weaveId}/graph`,
    );
    const payload = await parseData<{
      nodes?: any[];
      edges?: any[];
      metadata?: Record<string, unknown>;
      clusters?: string[][];
    }>(response);

    return {
      nodes: normalizeWeaveNodes(payload?.nodes ?? []),
      edges: normalizeWeaveEdges(payload?.edges ?? []),
      metadata: payload?.metadata ?? {},
      clusters: payload?.clusters,
    };
  },

  async createNode(
    weaveId: string,
    payload: WeaveNodeInput,
  ): Promise<{ weave: Weave; node: WeaveNode }> {
    const response = await apiFetch(`/weaves/${weaveId}/nodes`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const data = await parseData<{ weave: any; node: any }>(response);

    return {
      weave: deserializeWeave(data.weave),
      node: normalizeWeaveNode(data.node),
    };
  },

  async updateNode(
    weaveId: string,
    nodeId: string,
    payload: WeaveNodeUpdateInput,
  ): Promise<{ weave: Weave; node: WeaveNode }> {
    const response = await apiFetch(`/weaves/${weaveId}/nodes/${nodeId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    const data = await parseData<{ weave: any; node: any }>(response);

    return {
      weave: deserializeWeave(data.weave),
      node: normalizeWeaveNode(data.node),
    };
  },

  async deleteNode(
    weaveId: string,
    nodeId: string,
  ): Promise<{ weave: Weave; nodeId: string; removedEdgeIds: string[] }> {
    const response = await apiFetch(`/weaves/${weaveId}/nodes/${nodeId}`, {
      method: 'DELETE',
    });
    const data = await parseData<{
      weave: any;
      nodeId: string;
      removedEdgeIds?: string[];
    }>(response);

    return {
      weave: deserializeWeave(data.weave),
      nodeId: data.nodeId,
      removedEdgeIds: ensureArray<string>(data.removedEdgeIds ?? []),
    };
  },

  async createEdge(
    weaveId: string,
    payload: WeaveEdgeInput,
  ): Promise<{ weave: Weave; edge: WeaveEdge }> {
    const response = await apiFetch(`/weaves/${weaveId}/edges`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const data = await parseData<{ weave: any; edge: any }>(response);

    return {
      weave: deserializeWeave(data.weave),
      edge: normalizeWeaveEdge(data.edge),
    };
  },

  async updateEdge(
    weaveId: string,
    edgeId: string,
    payload: WeaveEdgeUpdateInput,
  ): Promise<{ weave: Weave; edge: WeaveEdge }> {
    const response = await apiFetch(`/weaves/${weaveId}/edges/${edgeId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    const data = await parseData<{ weave: any; edge: any }>(response);

    return {
      weave: deserializeWeave(data.weave),
      edge: normalizeWeaveEdge(data.edge),
    };
  },

  async deleteEdge(
    weaveId: string,
    edgeId: string,
  ): Promise<{ weave: Weave; edgeId: string }> {
    const response = await apiFetch(`/weaves/${weaveId}/edges/${edgeId}`, {
      method: 'DELETE',
    });
    const data = await parseData<{ weave: any; edgeId: string }>(response);

    return {
      weave: deserializeWeave(data.weave),
      edgeId: data.edgeId,
    };
  },

  async applyLayout(
    weaveId: string,
    algorithm: 'force' | 'circular' | 'hierarchical',
    options?: Record<string, unknown>,
  ): Promise<Weave> {
    const response = await apiFetch(`/weaves/${weaveId}/layout`, {
      method: 'POST',
      body: JSON.stringify({ algorithm, options }),
    });
    return deserializeWeave(await parseData(response));
  },
};

/**
 * Analytics endpoints (strand, loom, weave dashboards)
 */
export const analyticsAPI = {
  /**
   * Fetch analytics summary for a single strand.
   *
   * @param strandId - Strand identifier
   * @param options - Optional flags (fresh to bypass cache)
   */
  async getStrandSummary(
    strandId: string,
    options?: { fresh?: boolean },
  ): Promise<StrandAnalyticsSummary> {
    const params = new URLSearchParams();
    if (options?.fresh) {
      params.set('fresh', 'true');
    }
    const query = params.toString();
    const response = await apiFetch(
      `/analytics/strands/${strandId}${query ? `?${query}` : ''}`,
    );
    return await parseData(response);
  },

  /**
   * Fetch analytics summary for a Loom/project scope.
   *
   * @param scopeId - Strand scope identifier
   * @param options - Optional flags (fresh to bypass cache)
   */
  async getLoomSummary(
    scopeId: string,
    options?: { fresh?: boolean },
  ): Promise<LoomAnalyticsSummary> {
    const params = new URLSearchParams();
    if (options?.fresh) {
      params.set('fresh', 'true');
    }
    const query = params.toString();
    const response = await apiFetch(
      `/analytics/looms/${scopeId}${query ? `?${query}` : ''}`,
    );
    return await parseData(response);
  },

  /**
   * Fetch analytics summary for a Weave/workspace.
   *
   * @param workspaceKey - 'community' or `team:ID`
   * @param options - Optional flags (fresh to bypass cache)
   */
  async getWeaveSummary(
    workspaceKey: string,
    options?: { fresh?: boolean },
  ): Promise<WeaveAnalyticsSummary> {
    const params = new URLSearchParams();
    if (options?.fresh) {
      params.set('fresh', 'true');
    }
    const query = params.toString();
    const response = await apiFetch(
      `/analytics/weaves/${workspaceKey}${query ? `?${query}` : ''}`,
    );
    return await parseData(response);
  },
};

/**
 * Learning & Schedule Operations
 */
export const learningAPI = {
  /**
   * Get daily schedule
   */
  async getDailySchedule(date?: string): Promise<{
    date?: string;
    user_id?: string;
    items: Array<{
      id: string;
      strand_id: string;
      user_id?: string;
      scheduled_for: string;
      duration: number;
      estimated_duration?: number;
      status?: 'scheduled' | 'in_progress' | 'completed' | 'skipped' | 'overdue';
      type: 'review' | 'new' | 'practice';
      phase: string;
      actual_duration?: number;
      quality?: number;
      notes?: string;
      completed_at?: string;
      sm2_data?: Record<string, unknown>;
    }>;
    total_duration: number;
  }> {
    const params = date ? `?date=${date}` : '';
    const response = await apiFetch(`/learning/schedule${params}`);
    return response.json();
  },

  /**
   * Record learning progress
   */
  async recordProgress(
    strandId: string,
    quality: number,
    timeSpent: number
  ): Promise<{
    mastery_level: number;
    next_review: string;
    phase: string;
  }> {
    const response = await apiFetch(`/learning/progress/${strandId}`, {
      method: 'POST',
      body: JSON.stringify({ quality, time_spent: timeSpent }),
    });
    return response.json();
  },

  /**
   * Get learning statistics
   */
  async getStatistics(): Promise<{
    total_items: number;
    items_mastered: number;
    average_mastery: number;
    total_time: number;
    streak: number;
  }> {
    const response = await apiFetch('/learning/statistics');
    return response.json();
  },

  /**
   * Get overdue items
   */
  async getOverdue(): Promise<Array<{
    strand_id: string;
    days_overdue: number;
    last_review: string;
  }>> {
    const response = await apiFetch('/learning/overdue');
    return response.json();
  },

  /**
   * Generate spiral curriculum path
   */
  async generateSpiralPath(
    strandIds: string[],
    iterations: number = 3
  ): Promise<Array<Array<{
    strand_id: string;
    phase: string;
    iteration: number;
    focus: string;
  }>>> {
    const response = await apiFetch('/learning/spiral-path', {
      method: 'POST',
      body: JSON.stringify({ strand_ids: strandIds, iterations }),
    });
    return response.json();
  },
};

/**
 * AI Operations
 */
export const aiAPI = {
  /**
   * Fetch AI Artisan quota
   */
  async getArtisanQuota(): Promise<AIArtisanQuota | null> {
    try {
      const response = await apiFetch('/ai/artisan/remaining');
      return response.json();
    } catch (error) {
      if (error instanceof APIError && (error.status === 401 || error.status === 404)) {
        return null;
      }
      throw error;
    }
  },

  /**
   * Enhance strand content
   */
  async enhanceContent(
    strandId: string,
    level: 'minimal' | 'moderate' | 'comprehensive' = 'moderate'
  ): Promise<ContentEnhancement> {
    const response = await apiFetch(`/ai/enhance/${strandId}`, {
      method: 'POST',
      body: JSON.stringify({ enhancement_level: level }),
    });
    return response.json();
  },

  /**
   * Generate scaffold variants
   */
  async generateScaffolds(strandId: string): Promise<{
    variants: Array<{
      level: string;
      content: Record<string, unknown>;
      hints: string[];
      examples: Array<Record<string, unknown>>;
    }>;
  }> {
    const response = await apiFetch(`/ai/scaffolds/${strandId}`, {
      method: 'POST',
    });
    return response.json();
  },

  /**
   * Generate learning objectives
   */
  async generateObjectives(content: string): Promise<string[]> {
    const response = await apiFetch('/ai/objectives', {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
    return response.json();
  },

  /**
   * Extract concepts from content
   */
  async extractConcepts(content: string): Promise<string[]> {
    const response = await apiFetch('/ai/concepts', {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
    return response.json();
  },

  /**
   * List available AI providers
   */
  async getProviders(): Promise<Array<{
    name: string;
    type: 'system' | 'user';
    models: string[];
  }>> {
    const response = await apiFetch('/ai/providers');
    return response.json();
  },

  /**
   * Add user API key (BYOK)
   */
  async addApiKey(provider: string, apiKey: string): Promise<void> {
    await apiFetch('/ai/keys', {
      method: 'POST',
      body: JSON.stringify({ provider, apiKey }),
    });
  },

  /**
   * Remove user API key
   */
  async removeApiKey(provider: string): Promise<void> {
    await apiFetch(`/ai/keys/${provider}`, {
      method: 'DELETE',
    });
  },

  /**
   * Get AI usage statistics
   */
  async getUsage(startDate?: string, endDate?: string): Promise<{
    totalCost: number;
    byProvider: Record<string, number>;
    byOperation: Record<string, number>;
    dailyUsage: Array<{ date: string; cost: number; count: number }>;
  }> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const response = await apiFetch(`/ai/usage?${params}`);
    return response.json();
  },
};

/**
 * Flashcard Operations (v1.3)
 */
export const flashcardAPI = {
  /**
   * Create a flashcard
   */
  async create(data: {
    strandId?: string;
    front: { text: string; images?: string[]; latex?: string; audio?: string };
    back: { text: string; images?: string[]; latex?: string; audio?: string };
    hints?: Array<{ text: string }>;
    deck?: string;
    tags?: string[];
    category?: string;
    visibility?: 'private' | 'team' | 'public';
  }): Promise<any> {
    const response = await apiFetch('/flashcards', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.json();
  },

  /**
   * Get flashcard by ID
   */
  async get(id: string): Promise<any> {
    const response = await apiFetch(`/flashcards/${id}`);
    return response.json();
  },

  /**
   * List flashcards with filters
   */
  async list(filters?: {
    deck?: string;
    tags?: string[];
    visibility?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ data: any[]; total: number }> {
    const params = new URLSearchParams();
    if (filters?.deck) params.append('deck', filters.deck);
    if (filters?.tags) filters.tags.forEach((t) => params.append('tags', t));
    if (filters?.visibility) params.append('visibility', filters.visibility);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());
    const response = await apiFetch(`/flashcards?${params}`);
    return response.json();
  },

  /**
   * Get due flashcards for study
   */
  async getDue(options?: { deck?: string; limit?: number }): Promise<any[]> {
    const params = new URLSearchParams();
    if (options?.deck) params.append('deck', options.deck);
    if (options?.limit) params.append('limit', options.limit.toString());
    const response = await apiFetch(`/flashcards/due/study?${params}`);
    return response.json();
  },

  /**
   * Record study session (spaced repetition)
   */
  async recordStudy(data: {
    flashcardId: string;
    rating: 'again' | 'hard' | 'good' | 'easy';
    timeSpentMs: number;
  }): Promise<any> {
    const response = await apiFetch('/flashcards/study', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.json();
  },

  /**
   * Get user's decks
   */
  async getDecks(): Promise<Array<{
    name: string;
    total: number;
    due: number;
    new: number;
  }>> {
    const response = await apiFetch('/flashcards/decks/list');
    return response.json();
  },

  /**
   * Generate flashcards from strand (with templates)
   */
  async generate(strandId: string, options?: {
    count?: number;
    difficulty?: string;
    includeHints?: boolean;
    deck?: string;
    template?: 'definition' | 'cloze' | 'qa' | 'image_recall' | 'dataset_numeric' | 'minimal' | 'auto';
    complexity?: 1 | 2 | 3 | 4 | 5;
    allowImages?: boolean;
  }): Promise<any[]> {
    const response = await apiFetch(`/flashcards/generate/${strandId}`, {
      method: 'POST',
      body: JSON.stringify(options || {}),
    });
    return response.json();
  },

  /**
   * Update flashcard
   */
  async update(id: string, data: Partial<{
    front: any;
    back: any;
    hints: any;
    deck: string;
    tags: string[];
  }>): Promise<any> {
    const response = await apiFetch(`/flashcards/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return response.json();
  },

  /**
   * Delete flashcard
   */
  async delete(id: string): Promise<void> {
    await apiFetch(`/flashcards/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Generate illustration for a flashcard
   */
  async generateIllustration(
    id: string,
    options?: FlashcardIllustrationOptions
  ): Promise<any> {
    const response = await apiFetch(`/flashcards/${id}/illustrations`, {
      method: 'POST',
      body: JSON.stringify(options || {}),
    });
    return response.json();
  },

  /**
   * Batch-generate illustrations for multiple flashcards
   */
  async generateIllustrationsBatch(
    payload: FlashcardIllustrationOptions & { flashcardIds: string[] }
  ): Promise<any> {
    const response = await apiFetch('/flashcards/illustrations/generate', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return response.json();
  },
};

/**
 * Quiz Operations (v1.3)
 */
export const quizAPI = {
  /**
   * Create a quiz
   */
  async create(data: {
    title: string;
    description?: string;
    questions: any[];
    strandIds?: string[];
    difficulty?: string;
    category?: string;
    visibility?: 'private' | 'team' | 'public';
    timeLimit?: number;
    passingScore?: number;
  }): Promise<any> {
    const response = await apiFetch('/quizzes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.json();
  },

  /**
   * Get quiz by ID
   */
  async get(id: string): Promise<any> {
    const response = await apiFetch(`/quizzes/${id}`);
    return response.json();
  },

  /**
   * List quizzes
   */
  async list(filters?: {
    difficulty?: string;
    category?: string;
    visibility?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ data: any[]; total: number }> {
    const params = new URLSearchParams();
    if (filters?.difficulty) params.append('difficulty', filters.difficulty);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.visibility) params.append('visibility', filters.visibility);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());
    const response = await apiFetch(`/quizzes?${params}`);
    return response.json();
  },

  /**
   * Generate quiz from strands (with templates)
   */
  async generate(strandIds: string[], options?: {
    questionCount?: number;
    types?: string[];
    difficulty?: string;
    timeLimit?: number;
    template?: 'mcq_overview' | 'mixed_depth' | 'concept_check' | 'practical_code' | 'dataset_analysis' | 'minimal' | 'auto';
    complexity?: 1 | 2 | 3 | 4 | 5;
    allowImages?: boolean;
  }): Promise<any> {
    const response = await apiFetch('/quizzes/generate', {
      method: 'POST',
      body: JSON.stringify({ strandIds, ...options }),
    });
    return response.json();
  },

  /**
   * Start quiz attempt
   */
  async start(quizId: string): Promise<{
    attemptId: string;
    questionsToAnswer: any[];
  }> {
    const response = await apiFetch(`/quizzes/${quizId}/start`, {
      method: 'POST',
    });
    return response.json();
  },

  /**
   * Submit quiz answers
   */
  async submit(attemptId: string, answers: Array<{
    questionId: string;
    answer: string | string[];
    timeSpentMs: number;
  }>): Promise<{
    score: number;
    passed: boolean;
    results: any[];
  }> {
    const response = await apiFetch(`/quizzes/attempts/${attemptId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ answers }),
    });
    return response.json();
  },

  /**
   * Get user's quiz attempts
   */
  async getAttempts(): Promise<any[]> {
    const response = await apiFetch('/quizzes/attempts/me');
    return response.json();
  },

  /**
   * Update quiz
   */
  async update(id: string, data: Partial<{
    title: string;
    description: string;
    questions: any[];
  }>): Promise<any> {
    const response = await apiFetch(`/quizzes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return response.json();
  },

  /**
   * Delete quiz
   */
  async delete(id: string): Promise<void> {
    await apiFetch(`/quizzes/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Generate illustrations for quiz questions
   */
  async generateIllustrations(
    id: string,
    options?: QuizIllustrationOptions
  ): Promise<any> {
    const response = await apiFetch(`/quizzes/${id}/illustrations`, {
      method: 'POST',
      body: JSON.stringify(options || {}),
    });
    return response.json();
  },
};

/**
 * Gallery Operations (v1.3)
 */
export const galleryAPI = {
  /**
   * Browse public gallery
   */
  async browse(filters?: {
    type?: 'flashcard' | 'quiz';
    sortBy?: 'top' | 'trending' | 'newest';
    difficulty?: string;
    category?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ data: any[]; total: number }> {
    const params = new URLSearchParams();
    if (filters?.type) params.append('type', filters.type);
    if (filters?.sortBy) params.append('sortBy', filters.sortBy);
    if (filters?.difficulty) params.append('difficulty', filters.difficulty);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());
    const response = await apiFetch(`/gallery?${params}`);
    return response.json();
  },

  /**
   * Get trending content
   */
  async getTrending(type?: 'flashcard' | 'quiz', limit = 20): Promise<any[]> {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (type) params.append('type', type);
    const response = await apiFetch(`/gallery/trending?${params}`);
    return response.json();
  },

  /**
   * Vote on content (±1)
   */
  async vote(data: {
    contentType: 'flashcard' | 'quiz';
    contentId: string;
    value: 1 | -1;
  }): Promise<any> {
    const response = await apiFetch('/gallery/vote', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.json();
  },

  /**
   * Remove vote
   */
  async removeVote(contentType: 'flashcard' | 'quiz', contentId: string): Promise<void> {
    await apiFetch('/gallery/vote', {
      method: 'DELETE',
      body: JSON.stringify({ contentType, contentId }),
    });
  },

  /**
   * Get user's votes
   */
  async getMyVotes(): Promise<any[]> {
    const response = await apiFetch('/gallery/votes/me');
    return response.json();
  },
};

/**
 * Pomodoro Operations (v1.3)
 */
export const pomodoroAPI = {
  /**
   * Start Pomodoro session
   */
  async start(data: {
    preset?: 'classic' | 'short' | 'long' | 'custom';
    durationSec?: number;
    label?: string;
    strandId?: string;
    category?: string;
    soundEnabled?: boolean;
    volume?: number;
  }): Promise<any> {
    const response = await apiFetch('/pomodoro/start', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.json();
  },

  /**
   * Get active Pomodoro session
   */
  async getActive(): Promise<any | null> {
    try {
      const response = await apiFetch('/pomodoro/active');
      return response.json();
    } catch (error) {
      if (error instanceof APIError && error.status === 404) return null;
      throw error;
    }
  },

  /**
   * Pause session
   */
  async pause(sessionId: string): Promise<any> {
    const response = await apiFetch(`/pomodoro/${sessionId}/pause`, {
      method: 'PATCH',
    });
    return response.json();
  },

  /**
   * Resume session
   */
  async resume(sessionId: string): Promise<any> {
    const response = await apiFetch(`/pomodoro/${sessionId}/resume`, {
      method: 'PATCH',
    });
    return response.json();
  },

  /**
   * Complete session
   */
  async complete(sessionId: string): Promise<any> {
    const response = await apiFetch(`/pomodoro/${sessionId}/complete`, {
      method: 'PATCH',
    });
    return response.json();
  },

  /**
   * Cancel session
   */
  async cancel(sessionId: string): Promise<any> {
    const response = await apiFetch(`/pomodoro/${sessionId}/cancel`, {
      method: 'PATCH',
    });
    return response.json();
  },

  /**
   * Get user's Pomodoro statistics
   */
  async getStats(days = 30): Promise<{
    totalSessions: number;
    completedSessions: number;
    totalMinutes: number;
    avgSessionLength: number;
  }> {
    const response = await apiFetch(`/pomodoro/stats?days=${days}`);
    return response.json();
  },
};

/**
 * Illustration Operations (v1.3)
 */
export const illustrationAPI = {
  /**
   * Generate single illustration
   */
  async generateForStrand(data: {
    strandId: string;
    title?: string;
    summary: string;
    stylePreset?: 'minimal_vector' | 'flat_pastel' | 'watercolor_soft' | 'pencil_sketch' | 'comic_lineart' | 'realistic_soft' | 'custom';
    customStylePrompt?: string;
    safetyLevel?: 'default' | 'censored' | 'uncensored' | 'strict';
    imageOptions?: {
      size?: '1024x1024' | '1792x1024' | '1024x1792';
      quality?: 'standard' | 'hd';
      seed?: number;
    };
  }): Promise<{
    images: Array<{ url: string; revisedPrompt?: string }>;
    prompt: string;
  }> {
    const response = await apiFetch('/illustrations/strand', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.json();
  },

  /**
   * Estimate batch illustration cost
   */
  async estimateBatch(data: {
    strandId: string;
    pages: Array<{
      pageNumber: number;
      title?: string;
      summary: string;
    }>;
    stylePreset?: string;
    imageOptions?: any;
  }): Promise<{
    pageCount: number;
    totalCost: number;
    costPerPage: number;
    breakdown: { images: number; textGeneration: number };
  }> {
    const response = await apiFetch('/illustrations/estimate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.json();
  },

  /**
   * Generate preview illustrations (1-5 samples)
   */
  async generatePreview(data: {
    strandId: string;
    pages: Array<{ pageNumber: number; summary: string }>;
    previewCount?: number;
    stylePreset?: string;
    safetyLevel?: string;
    imageOptions?: any;
  }): Promise<{
    previews: Array<{
      pageNumber: number;
      image: { url: string };
      cost: number;
    }>;
    totalCost: number;
  }> {
    const response = await apiFetch('/illustrations/preview', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.json();
  },

  /**
   * Start batch illustration job
   */
  async startBatch(data: {
    strandId: string;
    pages: Array<{ pageNumber: number; summary: string }>;
    stylePreset?: string;
    imageOptions?: any;
  }): Promise<{
    jobId: string;
    status: string;
  }> {
    const response = await apiFetch('/illustrations/batch', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.json();
  },

  /**
   * Get batch job progress
   */
  async getBatchProgress(jobId: string): Promise<{
    jobId: string;
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
    progress: { completed: number; total: number };
    results: Array<{ pageNumber: number; imageUrl?: string; error?: string }>;
    totalCost: number;
  } | null> {
    try {
      const response = await apiFetch(`/illustrations/batch/${jobId}`);
      return response.json();
    } catch (error) {
      if (error instanceof APIError && error.status === 404) return null;
      throw error;
    }
  },

  /**
   * Cancel batch job
   */
  async cancelBatch(jobId: string): Promise<void> {
    await apiFetch(`/illustrations/batch/${jobId}`, {
      method: 'DELETE',
    });
  },
};

/**
 * Productivity Analytics (v1.3)
 */
export const productivityAPI = {
  /**
   * Get dashboard metrics
   */
  async getDashboard(): Promise<{
    streaks: {
      current: number;
      longest: number;
      lastActive: string | null;
    };
    today: {
      pomodoroCount: number;
      studyMinutes: number;
      flashcardsReviewed: number;
      quizzesTaken: number;
    };
    allTime: {
      totalPomodoros: number;
      totalStudyMinutes: number;
      totalFlashcards: number;
      totalQuizzes: number;
    };
  }> {
    const response = await apiFetch('/analytics/dashboard');
    return response.json();
  },

  /**
   * Get streak history (for heatmap)
   */
  async getStreakHistory(days = 365): Promise<Array<{
    date: string;
    pomodoroCount: number;
    studyMinutes: number;
    active: boolean;
  }>> {
    const response = await apiFetch(`/analytics/streaks/history?days=${days}`);
    return response.json();
  },

  /**
   * Get current streak
   */
  async getCurrentStreak(): Promise<{
    currentStreak: number;
    longestStreak: number;
    lastActive: string | null;
  }> {
    const response = await apiFetch('/analytics/streaks/current');
    return response.json();
  },

  /**
   * Get productivity insights
   */
  async getInsights(): Promise<{
    insights: Array<{
      type: 'streak' | 'milestone' | 'suggestion';
      message: string;
      data?: any;
    }>;
  }> {
    const response = await apiFetch('/analytics/insights');
    return response.json();
  },

  /**
   * Record activity
   */
  async recordActivity(activityType: string): Promise<void> {
    await apiFetch('/analytics/activity', {
      method: 'POST',
      body: JSON.stringify({ activityType }),
    });
  },
};

/**
 * Thread Operations
 */
export const threadAPI = {
  /**
   * Create thread
   */
  async create(thread: Partial<Thread>): Promise<Thread> {
    const response = await apiFetch('/threads', {
      method: 'POST',
      body: JSON.stringify(thread),
    });
    return response.json();
  },

  /**
   * Get thread
   */
  async get(id: string): Promise<Thread> {
    const response = await apiFetch(`/threads/${id}`);
    return response.json();
  },

  /**
   * Update thread
   */
  async update(id: string, updates: Partial<Thread>): Promise<Thread> {
    const response = await apiFetch(`/threads/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    return response.json();
  },

  /**
   * List threads
   */
  async list(): Promise<Thread[]> {
    const response = await apiFetch('/threads');
    return response.json();
  },

  /**
   * Reorder strands in thread
   */
  async reorder(id: string, strandIds: string[]): Promise<Thread> {
    const response = await apiFetch(`/threads/${id}/reorder`, {
      method: 'POST',
      body: JSON.stringify({ strand_order: strandIds }),
    });
    return response.json();
  },
};

/**
 * Pattern Operations
 */
export const patternAPI = {
  /**
   * Create pattern
   */
  async create(pattern: Partial<Pattern>): Promise<Pattern> {
    const response = await apiFetch('/patterns', {
      method: 'POST',
      body: JSON.stringify(pattern),
    });
    return response.json();
  },

  /**
   * Get pattern
   */
  async get(id: string): Promise<Pattern> {
    const response = await apiFetch(`/patterns/${id}`);
    return response.json();
  },

  /**
   * Generate export from pattern
   */
  async generateExport(
    id: string,
    edition: 'web' | 'pdf' | 'epub' = 'web'
  ): Promise<{
    id: string;
    url: string;
    format: string;
    size: number;
  }> {
    const response = await apiFetch(`/patterns/${id}/export`, {
      method: 'POST',
      body: JSON.stringify({ edition }),
    });
    return response.json();
  },

  /**
   * Preview pattern output
   */
  async preview(id: string): Promise<{
    strands: Strand[];
    toc: unknown;
    metadata: Record<string, unknown>;
  }> {
    const response = await apiFetch(`/patterns/${id}/preview`);
    return response.json();
  },
};

/**
 * Export Operations
 */
export const exportAPI = {
  /**
   * Export strands
   */
  async exportStrands(
    strandIds: string[],
    format: 'json' | 'markdown' | 'pdf' = 'json'
  ): Promise<Blob> {
    const response = await apiFetch('/export/strands', {
      method: 'POST',
      body: JSON.stringify({ strand_ids: strandIds, format }),
    });
    return response.blob();
  },

  /**
   * Export weave graph
   */
  async exportWeave(
    format: 'svg' | 'png' | 'json' = 'svg'
  ): Promise<Blob> {
    const response = await apiFetch(`/export/weave?format=${format}`);
    return response.blob();
  },

  /**
   * Export learning progress
   */
  async exportProgress(format: 'csv' | 'json' = 'json'): Promise<Blob> {
    const response = await apiFetch(`/export/progress?format=${format}`);
    return response.blob();
  },
};

/**
 * System & environment operations
 */
export const systemAPI = {
  async completeLocalOnboarding(completed: boolean = true): Promise<{ completed: boolean }> {
    const response = await apiFetch('/system/onboarding', {
      method: 'POST',
      body: JSON.stringify({ completed }),
    });
    return response.json();
  },
  async completeTeamOnboarding(completed: boolean = true): Promise<{ completed: boolean }> {
    try {
      const response = await apiFetch('/system/team-onboarding', {
        method: 'POST',
        body: JSON.stringify({ completed }),
      });
      return response.json();
    } catch (error) {
      if (error instanceof APIError && (error.status === 400 || error.status === 404)) {
        return { completed };
      }
      throw error;
    }
  },
};

const normalizeTeamAdminResponse = (
  payload: unknown,
): { tokens: TeamApiToken[]; teams: TeamAdminSummary[] } => {
  let tokens: TeamApiToken[] = [];
  let teams: TeamAdminSummary[] = [];

  if (Array.isArray(payload)) {
    tokens = payload as TeamApiToken[];
  } else if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    if (Array.isArray(record.tokens)) {
      tokens = record.tokens as TeamApiToken[];
    }
    if (Array.isArray(record.teams)) {
      teams = record.teams as TeamAdminSummary[];
    }
  }

  return { tokens, teams };
};

// ============================================================================
// Spiral Path API (v1.8)
// Learning path discovery and smart suggestions
// ============================================================================

export interface PathNode {
  id: string;
  type: 'strand' | 'topic' | 'weave';
  title: string;
  description?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  estimatedTime?: number;
  weaveId?: string;
  weaveName?: string;
  tags: string[];
  depth: number;
  position?: { x: number; y: number };
  discoveryType: 'implicit' | 'explicit' | 'sibling' | 'tag';
  status?: 'completed' | 'in_progress' | 'not_started';
}

export interface PathEdge {
  id: string;
  source: string;
  target: string;
  type: 'prerequisite' | 'corequisite' | 'postrequisite' | 'related';
  weight: number;
  reason?: string;
}

export interface UserPathProgress {
  completed: string[];
  inProgress: string[];
  nextRecommended: string[];
  estimatedTimeToTarget: number;
  completionPercentage: number;
}

export interface PathMetrics {
  totalNodes: number;
  totalEdges: number;
  criticalPath: string[];
  estimatedTotalTime: number;
  difficultyProgression: string[];
  averageDifficulty: string;
}

export interface SpiralPathResponse {
  target: PathNode;
  prerequisites: PathNode[];
  corequisites: PathNode[];
  postrequisites: PathNode[];
  related: PathNode[];
  edges: PathEdge[];
  userProgress?: UserPathProgress;
  metrics: PathMetrics;
}

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

export interface TooltipData {
  title: string;
  text: string;
  tip?: string;
  spiral?: string;
  learnMore?: string;
  warning?: string;
}

export const spiralPathAPI = {
  /**
   * Build a complete learning path for a target
   */
  async buildPath(request: {
    targetId: string;
    targetType: 'strand' | 'topic' | 'tag' | 'weave';
    scope?: 'weave' | 'fabric' | 'all';
    weaveIds?: string[];
    tagFilter?: string[];
    maxDepth?: number;
    includeRelated?: boolean;
  }): Promise<SpiralPathResponse> {
    const response = await apiFetch('/spiral-path/build', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    const data = await parseData<{ success: boolean; data: SpiralPathResponse }>(response);
    return data.data;
  },

  /**
   * Quick path lookup for a strand
   */
  async getPath(targetId: string, options?: {
    depth?: number;
    includeRelated?: boolean;
  }): Promise<SpiralPathResponse> {
    const params = new URLSearchParams();
    if (options?.depth) params.set('depth', String(options.depth));
    if (options?.includeRelated) params.set('includeRelated', 'true');
    
    const url = `/spiral-path/${targetId}${params.toString() ? `?${params}` : ''}`;
    const response = await apiFetch(url);
    const data = await parseData<{ success: boolean; data: SpiralPathResponse }>(response);
    return data.data;
  },

  /**
   * Get smart suggestions for strand creation
   */
  async getSuggestions(request: {
    parentId?: string | null;
    title: string;
    content?: string;
  }): Promise<StrandSuggestions> {
    const response = await apiFetch('/spiral-path/suggestions', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    const data = await parseData<{ success: boolean; data: StrandSuggestions }>(response);
    return data.data;
  },

  /**
   * Get available tags for autocomplete
   */
  async getAvailableTags(scopeId?: string): Promise<Array<{ tag: string; count: number }>> {
    const url = scopeId ? `/spiral-path/tags?scopeId=${scopeId}` : '/spiral-path/tags';
    const response = await apiFetch(url);
    const data = await parseData<{ success: boolean; data: Array<{ tag: string; count: number }> }>(response);
    return data.data;
  },

  /**
   * Get tooltip content for UI elements
   */
  async getTooltip(key: string): Promise<TooltipData> {
    const response = await apiFetch(`/spiral-path/tooltips/${key}`);
    const data = await parseData<{ success: boolean; data: TooltipData }>(response);
    return data.data;
  },
};

export const teamAdminAPI = {
  async list(): Promise<{ tokens: TeamApiToken[]; teams: TeamAdminSummary[] }> {
    const response = await apiFetch('/team-tokens');
    const payload = await parseData<unknown>(response);
    return normalizeTeamAdminResponse(payload);
  },

  async create(payload: CreateTeamApiTokenPayload): Promise<CreateTeamApiTokenResponse> {
    const response = await apiFetch('/team-tokens', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return await parseData<CreateTeamApiTokenResponse>(response);
  },

  async revoke(tokenId: string): Promise<TeamApiToken> {
    const response = await apiFetch(`/team-tokens/${tokenId}`, {
      method: 'DELETE',
    });
    return await parseData<TeamApiToken>(response);
  },
};

/**
 * Combined OpenStrand API
 */
export const openstrandAPI = {
  strands: strandAPI,
  weave: weaveAPI,
  analytics: analyticsAPI,
  learning: learningAPI,
  ai: aiAPI,
  meta: metaAPI,
  visualizations: visualizationAPI,
  datasets: datasetAPI,
  analysis: analysisAPI,
  threads: threadAPI,
  patterns: patternAPI,
  export: exportAPI,
  system: systemAPI,
  team: teamAdminAPI,
  spiralPath: spiralPathAPI,
  // v1.3 Learning & Productivity APIs
  flashcards: flashcardAPI,
  quizzes: quizAPI,
  gallery: galleryAPI,
  pomodoro: pomodoroAPI,
  illustrations: illustrationAPI,
  productivity: productivityAPI,
  ocr: {
    /**
     * Extract text from an image (PNG, JPEG, etc.) using the OCR service.
     * Intended for whiteboard exports, screenshots, and scanned notes.
     */
    async extractFromBlob(
      blob: Blob,
      options?: { language?: string; minConfidence?: number }
    ): Promise<OcrResult> {
      const formData = new FormData();
      formData.append('file', blob, 'image.png');
      if (options?.language) {
        formData.append('language', options.language);
      }
      if (typeof options?.minConfidence === 'number') {
        formData.append('minConfidence', String(options.minConfidence));
      }

      const response = await apiFetch('/ocr/image', {
        method: 'POST',
        body: formData,
      });
      return await parseData<OcrResult>(response);
    },
  },
  scraper: {
    async scrapeUrl(payload: {
      url: string;
      method?: 'auto' | 'readability' | 'llm';
      llmProvider?: 'openai' | 'anthropic';
      options?: {
        createStrand?: boolean;
        downloadImages?: boolean;
        extractMetadata?: boolean;
        findRelated?: boolean;
        autoSync?: boolean;
        syncInterval?: number;
      };
    }): Promise<{
      id: string;
      title?: string;
      content?: unknown;
      extractedBy?: string;
      strandId?: string;
    }> {
      const response = await apiFetch('/scraper/url', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      return await parseData(response);
    },

    async check(url: string): Promise<{ allowed: boolean; reason?: string }> {
      const response = await apiFetch('/scraper/check', {
        method: 'POST',
        body: JSON.stringify({ url }),
      });
      return await parseData(response);
    },

    async bulk(payload: { urls: string[]; method?: 'auto' | 'readability' | 'llm'; createStrands?: boolean }): Promise<{ jobId: string }> {
      const response = await apiFetch('/scraper/bulk', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const data = await parseData<any>(response);
      return { jobId: data?.jobId ?? '' };
    },
  },

  /**
   * Health check
   */
  async health(): Promise<{ status: string; version: string }> {
    const response = await apiFetch('/health');
    return response.json();
  },
};

// Re-export editor API for convenience
export { editorAPI } from './editor.api';
