// cSpell:ignore OpenStrand Pydantic remixable
/**
 * OpenStrand TypeScript Type Definitions
 * Matches the backend Pydantic models
 */

// Enums
export enum StrandType {
  DATASET = 'dataset',
  DOCUMENT = 'document',
  VISUALIZATION = 'visualization',
  NOTE = 'note',
  MEDIA = 'media',
  EXERCISE = 'exercise',
  COLLECTION = 'collection'
}

export enum Difficulty {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  EXPERT = 'expert'
}

export enum RelationshipType {
  PREREQUISITE = 'prerequisite',
  RELATED = 'related',
  PART_OF = 'part-of',
  REFERENCES = 'references',
  VISUALIZES = 'visualizes',
  EXTENDS = 'extends',
  CONTRADICTS = 'contradicts',
  SUPPORTS = 'supports',
  DERIVED_FROM = 'derived-from',
  REVISION_OF = 'revision-of'
}

export enum VisualizationKind {
  DATASET = 'dataset',
  DOCUMENT = 'document',
  MEDIA = 'media',
  GENERATIVE = 'generative'
}

export enum RepresentationMode {
  ENACTIVE = 'enactive',
  ICONIC = 'iconic',
  SYMBOLIC = 'symbolic'
}

export type NoteType = 'main' | 'reference' | 'structure' | 'project' | 'index';

export enum PrerequisiteLevel {
  AWARENESS = 'awareness',
  UNDERSTANDING = 'understanding',
  PROFICIENCY = 'proficiency',
  MASTERY = 'mastery'
}

export enum ScaffoldLevel {
  GUIDED = 'guided',
  ASSISTED = 'assisted',
  INDEPENDENT = 'independent',
  CHALLENGE = 'challenge'
}

export enum LearningPhase {
  INTRODUCTION = 'introduction',
  EXPLORATION = 'exploration',
  APPLICATION = 'application',
  MASTERY = 'mastery'
}

// Interfaces
export interface Prerequisite {
  id: string;
  level: PrerequisiteLevel;
  title?: string;
  reason?: string;
}

export interface Relationship {
  targetId: string;
  target_id?: string;
  type: RelationshipType | string;
  weight?: number;
  scopeId?: string;
  scope_id?: string;
  provenance?: string;
  justification?: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

export interface LearningObjective {
  id: string;
  objective: string;
  bloom_level: 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create';
  measurable: boolean;
}

export interface ScaffoldVariant {
  level: ScaffoldLevel;
  content: Record<string, unknown>;
  hints: string[];
  examples: Array<Record<string, unknown>>;
}

export interface RepresentationalVariant {
  mode: RepresentationMode;
  content: Record<string, unknown>;
  media_type?: string;
}

export type AccessRole = 'owner' | 'editor' | 'commenter' | 'viewer';

export type PrincipalType = 'user' | 'team' | 'link';

export type AnalysisStatus =
  | 'not_started'
  | 'queued'
  | 'in_progress'
  | 'completed'
  | 'failed';

export interface StrandPermission {
  id: string;
  principal_id: string;
  principal_type: PrincipalType;
  role: AccessRole;
  granted_by?: string;
  granted_at: string;
  expires_at?: string;
  share_token?: string;
}

export interface GrantPermissionPayload {
  principal_id: string;
  principal_type: PrincipalType;
  role: AccessRole;
  expires_at?: string;
}

export interface ShareLinkResponse {
  token: string;
  role: AccessRole;
  expires_at?: string;
}

export interface StrandLinkEdge {
  strandId: string;
  scopeId?: string;
  provenance?: string;
  weight: number;
  title?: string;
  slug?: string;
  strandType?: StrandType;
}

export interface StrandLinkSummary {
  outgoing: Array<Relationship & { target?: { id: string; title: string; slug: string; strandType: StrandType } }>;
  incoming: Array<Relationship & { target?: { id: string; title: string; slug: string; strandType: StrandType } }>;
  structural: {
    parents: StrandLinkEdge[];
    children: StrandLinkEdge[];
  };
}

export interface StrandHierarchyNode {
  scopeId: string;
  parentId?: string;
  depth: number;
  position: number;
  path: string;
  isPrimary: boolean;
  scope?: { id: string; name: string; scopeType: string };
}

export interface StrandVisibilitySnapshot {
  scopeId: string;
  audience: string;
  isVisible: boolean;
  isPlaceholder: boolean;
  inheritedFrom?: string;
  metadata?: Record<string, unknown>;
}

export type StructureRequestType = 'ADD_CHILD' | 'REORDER' | 'REATTACH' | 'REPLACE_PLACEHOLDER' | 'REMOVE_LINK';
export type StructureRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface StrandStructureRequest {
  id: string;
  scopeId: string;
  strandId: string;
  parentId?: string;
  requestedBy: string;
  reviewedBy?: string;
  type: StructureRequestType;
  status: StructureRequestStatus;
  payload: Record<string, unknown>;
  justification?: string;
  resolutionNote?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  scope?: {
    id: string;
    name?: string;
    scopeType?: string;
  };
  parent?: {
    id: string;
    title?: string;
    slug?: string;
  };
  requester?: {
    id: string;
    username?: string;
    displayName?: string;
  };
  reviewer?: {
    id: string;
    username?: string;
    displayName?: string;
  };
}

export interface PlaceholderPreference {
  text: string;
  icon?: string;
}

export interface PlaceholderPreferences {
  default: PlaceholderPreference;
  scopes?: Record<string, PlaceholderPreference>;
}

export interface QualityMatrix {
  llm_rating?: number;
  human_ratings: Record<string, number>;
  composite_score?: number;
  confidence?: number;
  last_updated?: string;
}

export interface QualityVotePayload {
  rating: number;
  weight?: number;
  rationale?: string;
}

export interface CapabilityMatrix {
  analysisPipeline: boolean;
  documentAnalysis: boolean;
  mediaAnalysis: boolean;
  dynamicVisualizations: boolean;
  generativeVisualizations: boolean;
  topContent: boolean;
  aiArtisan: boolean;
  knowledgeGraph: boolean;
  analytics?: {
    googleAnalytics?: boolean;
    clarity?: boolean;
  };
  compliance?: {
    gdpr?: boolean;
    cookieConsent?: boolean;
  };
  environment?: {
    mode?: 'offline' | 'cloud';
    auth?: string;
    storagePath?: string;
  };
  storage?: {
    kind?: string;
    driver?: string;
    path?: string;
    writable?: boolean;
    capabilities?: string[];
    syncEnabled?: boolean;
    policy?: {
      enforced?: boolean;
      teamId?: string;
      reason?: string;
      remote?: {
        provider?: string;
        endpoint?: string;
        region?: string;
        bucket?: string;
        prefix?: string;
      };
      localPaths?: string;
    };
  };
  notes?: string[];
  local?: {
    onboardingComplete?: boolean;
  };
}

export interface DocumentPageSummary {
  page_number: number;
  summary?: string;
  keywords: string[];
  thumbnail_url?: string;
}

export interface DocumentAnalysis {
  status: AnalysisStatus;
  provider?: string;
  pages: DocumentPageSummary[];
  outline: string[];
  detected_languages: string[];
  entities: Array<Record<string, unknown>>;
  embeddings_generated: boolean;
  last_analyzed_at?: string;
}

export interface MediaKeyframe {
  timestamp: number;
  description?: string;
  thumbnail_url?: string;
}

export interface MediaScene {
  start_time: number;
  end_time: number;
  summary?: string;
  tags: string[];
}

export interface MediaAnalysis {
  status: AnalysisStatus;
  provider?: string;
  transcript_text?: string;
  transcript_url?: string;
  scenes: MediaScene[];
  keyframes: MediaKeyframe[];
  audio_waveform_url?: string;
  detected_objects: string[];
  last_analyzed_at?: string;
}

export interface VisualizationConfig {
  type: string;
  spec: Record<string, unknown>;
  data_source?: string;
  interactive: boolean;
  remixable: boolean;
  kind?: VisualizationKind;
  prompt?: string;
  style_preset?: string;
  provider?: string;
  source_strand_id?: string;
}

export interface MediaContent {
  url: string;
  type: string;
  size?: number;
  duration?: number;
  dimensions?: { width: number; height: number };
  thumbnail?: string;
  transcript?: string;
  alt_text?: string;
}

export interface StrandContent {
  markdown?: string;
  html?: string;
  data?: unknown;
  media?: MediaContent;
  code?: Record<string, string>;
  metadata: Record<string, unknown>;
}

export interface StrandMetadata {
  author?: string;
  source?: string;
  license?: string;
  language: string;
  tags: string[];
  keywords: string[];
  concepts: string[];
  version: string;
  citations: string[];
}

export interface SpiralMetadata {
  stage: number;
  revisit_windows: number[];
  interleave_with: string[];
  mastery_threshold: number;
  estimated_time: number;
}

export interface AssessmentData {
  questions: Array<Record<string, unknown>>;
  answer_key?: Record<string, unknown>;
  rubric?: Record<string, unknown>;
  auto_grade: boolean;
  attempts_allowed: number;
}

export interface Strand {
  id: string;
  strandType: StrandType;
  type?: StrandType;
  classification?: string;
  title: string;
  slug: string;
  summary?: string;
  contentType?: string;
  placeholderBehavior?: string;
  created: string;
  modified: string;
  updated?: string;
  noteType?: NoteType;
  coAuthorIds?: string[];
  difficulty?: Difficulty;
  learningObjectives?: Array<string | LearningObjective>;
  learning_objectives?: Array<string | LearningObjective>;
  prerequisites?: Prerequisite[];
  spiralMetadata?: SpiralMetadata;
  spiral_metadata?: SpiralMetadata;
  scaffoldVariants?: ScaffoldVariant[];
  scaffold_variants?: ScaffoldVariant[];
  representationalVariants?: RepresentationalVariant[];
  representational_variants?: RepresentationalVariant[];
  vizConfig?: VisualizationConfig;
  viz_config?: VisualizationConfig;
  assessmentData?: AssessmentData;
  assessment_data?: AssessmentData;
  content: StrandContent;
  metadata: StrandMetadata;
  relationships?: Relationship[];
  links?: StrandLinkSummary;
  hierarchy?: StrandHierarchyNode[];
  visibilityState?: StrandVisibilitySnapshot[];
  analysisStatus?: AnalysisStatus;
  analysis_status?: AnalysisStatus;
  analysisProvider?: string;
  analysis_provider?: string;
  document_analysis?: DocumentAnalysis;
  documentAnalysis?: DocumentAnalysis;
  media_analysis?: MediaAnalysis;
  mediaAnalysis?: MediaAnalysis;
  analysis_notes?: string[];
  analysisNotes?: string[];
  derivatives?: string[];
  visibility: 'public' | 'private' | 'unlisted' | 'premium';
  owner_id?: string;
  ownerId?: string;
  createdBy?: string;
  updatedBy?: string;
  teamId?: string;
  primaryScopeId?: string;
  permissions: StrandPermission[];
  shared_with?: string[];
  sharedWith?: string[];
  structureRequests?: StrandStructureRequest[];
  quality: QualityMatrix;
  qualityScore?: number;
  qualityConfidence?: number;
  llmRating?: number;
  humanRatings?: Record<string, number>;
  contentHash?: string;
  perceptualHash?: string;
  fileSize?: number;
  views?: number;
  likes?: number;
  completion_rate?: number;
  completionRate?: number;
}

export interface Thread {
  id: string;
  title: string;
  slug: string;
  description: string;
  strand_order: string[];
  intro?: string;
  outro?: string;
  metadata: StrandMetadata;
  created: string;
  modified: string;
  nav_level: 'part' | 'chapter' | 'section' | 'lesson';
  include_in_toc: boolean;
}

export interface Pattern {
  id: string;
  name: string;
  description: string;
  selection: Record<string, unknown>;
  ordering: 'topological' | 'difficulty' | 'explicit' | 'chronological';
  decoration: Record<string, unknown>;
  editions: string[];
  validation: Record<string, unknown>;
  created: string;
  modified: string;
}

export interface WeaveNode {
  id: string;
  type: string;
  title: string;
  importance: number;
  summary?: string;
  strandId?: string;
  clusterId?: string;
  position?: {
    x: number;
    y: number;
    z?: number;
  };
  metadata?: Record<string, unknown>;
}

export interface WeaveEdge {
  id?: string;
  source: string;
  target: string;
  type: string;
  weight: number;
  note?: string;
  createdBy?: string;
  metadata?: Record<string, unknown>;
}

export interface Weave {
  id: string;
  name: string;
  domain: string;
  nodes: WeaveNode[];
  edges: WeaveEdge[];
  metadata?: Record<string, unknown>;
  metrics?: {
    centrality?: Record<string, number>;
    communities?: string[][];
    density?: number;
    diameter?: number;
  };
  communities?: string[][];
  created: string;
  modified: string;
}

// UI-specific types
export interface WeaveViewerData {
  nodes: Array<{
    id: string;
    type: string;
    title: string;
    importance: number;
    summary?: string;
    strandId?: string;
    position?: {
      x: number;
      y: number;
      z?: number;
    };
  }>;
  edges: Array<{
    id?: string;
    source: string;
    target: string;
    type: string;
    weight: number;
    note?: string;
  }>;
  metrics?: {
    centrality: Record<string, number>;
    communities: string[][];
    density: number;
  };
}

export interface ScheduleItem {
  id: string;
  strand_id: string;
  user_id: string;
  scheduled_for: string;
  type: 'review' | 'new' | 'practice';
  status: 'scheduled' | 'in_progress' | 'completed' | 'skipped' | 'overdue';
  phase: LearningPhase;
  estimated_duration: number;
  actual_duration?: number;
  quality?: number;
  notes?: string;
  completed_at?: string;
  sm2_data?: Record<string, unknown>;
}

export interface DailySchedule {
  date: string;
  user_id: string;
  items: ScheduleItem[];
  total_duration: number;
  review_items: ScheduleItem[];
  new_items: ScheduleItem[];
  practice_items: ScheduleItem[];
}

export interface LearningProgress {
  user_id: string;
  strand_id: string;
  phase: LearningPhase;
  mastery_level: number;
  total_time_spent: number;
  review_count: number;
  last_accessed: string;
  sm2_item?: Record<string, unknown>;
  scaffold_level: string;
}

export interface AIArtisanResult {
  code: {
    html?: string;
    css?: string;
    js: string;
  };
  sandboxConfig: {
    libraries: string[];
    sandbox: string[];
    csp: string;
  };
  cost: number;
  generationTime: number;
  modelUsed: string;
}

export interface AIArtisanQuota {
  remaining: number;
  limit: number;
  plan: string;
  resets_at?: string;
}

export interface ContentEnhancement {
  strand_id: string;
  suggestions: string[];
  learning_objectives: LearningObjective[];
  prerequisites: string[];
  related_concepts: string[];
  difficulty_analysis: Record<string, unknown>;
  estimated_reading_time: number;
  key_takeaways: string[];
}

// Store types
export interface OpenStrandStore {
  // State
  strands: Strand[];
  currentStrand: Strand | null;
  weave: Weave | null;
  schedule: DailySchedule | null;
  progress: Record<string, LearningProgress>;
  permissions: Record<string, StrandPermission[]>;
  qualitySnapshots: Record<string, QualityMatrix>;
  structureRequests: Record<string, StrandStructureRequest[]>;
  capabilities: CapabilityMatrix | null;
  placeholderPreferences: PlaceholderPreferences | null;
  topVisualizations: Strand[];
  topDatasets: Strand[];
  artisanQuota: AIArtisanQuota | null;
  loading: boolean;
  error: string | null;
  localOnboardingComplete: boolean;
  teamOnboardingComplete: boolean;

  // Actions
  loadStrands: (filters?: Record<string, unknown>) => Promise<void>;
  loadStrand: (id: string) => Promise<void>;
  createStrand: (strand: Partial<Strand>) => Promise<void>;
  updateStrand: (id: string, updates: Partial<Strand>) => Promise<void>;
  deleteStrand: (id: string) => Promise<void>;
  uploadContent: (file: File, metadata?: Record<string, unknown>) => Promise<void>;

  createRelationship: (strandId: string, relationship: Relationship) => Promise<void>;
  removeRelationship: (
    strandId: string,
    targetId: string,
    options?: { type?: string; scopeId?: string },
  ) => Promise<void>;

  submitStructureRequest: (
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
  ) => Promise<StrandStructureRequest | null>;
  loadStructureRequests: (
    strandId: string,
    options?: { scopeId?: string; status?: StructureRequestStatus | 'ALL'; limit?: number },
  ) => Promise<StrandStructureRequest[]>;
  resolveStructureRequest: (
    requestId: string,
    action: 'approve' | 'reject' | 'cancel',
    note?: string,
  ) => Promise<StrandStructureRequest | null>;

  loadWeave: (filters?: Record<string, unknown>) => Promise<void>;
  findPath: (source: string, target: string) => Promise<void>;
  getRecommendations: () => Promise<void>;

  loadSchedule: (date?: string) => Promise<void>;
  recordProgress: (strandId: string, quality: number, timeSpent: number) => Promise<void>;

  enhanceContent: (strandId: string) => Promise<ContentEnhancement>;

  loadPermissions: (strandId: string) => Promise<StrandPermission[]>;
  grantPermission: (strandId: string, payload: GrantPermissionPayload) => Promise<void>;
  revokePermission: (strandId: string, permissionId: string) => Promise<void>;
  createShareLink: (
    strandId: string,
    role: AccessRole,
    expires_at?: string
  ) => Promise<ShareLinkResponse>;

  loadQuality: (strandId: string) => Promise<QualityMatrix>;
  submitQualityVote: (
    strandId: string,
    payload: QualityVotePayload
  ) => Promise<QualityMatrix>;
  refreshQuality: (strandId: string) => Promise<void>;
  loadCapabilities: () => Promise<CapabilityMatrix | null>;
  loadArtisanQuota: () => Promise<AIArtisanQuota | null>;
  loadTopVisualizations: (limit?: number) => Promise<Strand[]>;
  loadTopDatasets: (limit?: number) => Promise<Strand[]>;
  completeLocalOnboarding: (completed?: boolean) => Promise<void>;
  completeTeamOnboarding: (completed?: boolean) => Promise<void>;
  loadPlaceholderPreferences: () => Promise<PlaceholderPreferences | null>;
  updatePlaceholderPreferences: (
    preferences: PlaceholderPreferences,
  ) => Promise<PlaceholderPreferences | null>;

  setError: (error: string | null) => void;
  clearError: () => void;
}

