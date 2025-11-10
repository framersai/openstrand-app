/**
 * OpenStrand API Service
 * Handles all communication with the backend API
 */

import {
  Strand,
  Thread,
  Pattern,
  Weave,
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
  async getTop(limit: number = 10): Promise<Strand[]> {
    const response = await apiFetch(`/visualizations/top?limit=${limit}`);
    return response.json();
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

    const items = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [];
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
    const response = await apiFetch(query ? `/weave?${query}` : '/weave');
    return deserializeWeave(await parseData(response));
  },

  /**
   * Get subgraph around specific nodes
   */
  async getSubgraph(nodeIds: string[], depth: number = 1): Promise<Weave> {
    const response = await apiFetch('/weave/subgraph', {
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
    const response = await apiFetch(`/weave/path?source=${source}&target=${target}`);
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
    const response = await apiFetch(`/weave/learning-path/${target}`);
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
    const response = await apiFetch('/weave/metrics');
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
    const response = await apiFetch('/weave/centrality');
    return await parseData(response);
  },

  /**
   * Get content recommendations
   */
  async getRecommendations(
    completedIds: string[],
    interests?: string[],
  ): Promise<Array<{ strandId: string; score: number; reason: string }>> {
    const response = await apiFetch('/weave/recommendations', {
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

  /**
   * Health check
   */
  async health(): Promise<{ status: string; version: string }> {
    const response = await apiFetch('/health');
    return response.json();
  },
};
