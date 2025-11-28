/**
 * Loom & Weave Schema Types
 * 
 * TypeScript definitions for the YAML/Markdown schema format.
 * These types are used for parsing, validation, and serialization.
 * 
 * @module lib/schema/types
 */

import type { EntityStyleProperties } from '@/types/openstrand';

// =============================================================================
// Core Schema Types
// =============================================================================

/**
 * Schema version identifier
 */
export type SchemaVersion = '1.0';

/**
 * Schema kind discriminator
 */
export type SchemaKind = 'Loom' | 'Weave' | 'Strand';

/**
 * Base schema interface with version and kind
 */
export interface BaseSchema {
  version?: SchemaVersion;
  kind: SchemaKind;
}

// =============================================================================
// Loom Schema
// =============================================================================

/**
 * Loom use case categories
 */
export type LoomUseCase =
  | 'storytelling'
  | 'worldbuilding'
  | 'research'
  | 'notebook'
  | 'documentation'
  | 'education'
  | 'custom';

/**
 * Scope type for organizational boundaries
 */
export type ScopeType = 'COLLECTION' | 'DATASET' | 'PROJECT' | 'TEAM' | 'GLOBAL';

/**
 * Visibility levels
 */
export type Visibility = 'private' | 'team' | 'public';

/**
 * Loom metadata section
 */
export interface LoomMetadata {
  name: string;
  slug?: string;
  description?: string;
  icon?: string;
  useCase?: LoomUseCase;
}

/**
 * Loom scope settings
 */
export interface LoomScope {
  type?: ScopeType;
  visibility?: Visibility;
  autoApprove?: boolean;
}

/**
 * Loom content organization
 */
export interface LoomContent {
  rootPath?: string;
  includes?: string[];
  excludes?: string[];
}

/**
 * Loom team settings
 */
export interface LoomTeam {
  id?: string;
  collaborators?: string[];
}

/**
 * Complete Loom schema
 */
export interface LoomSchema extends BaseSchema {
  kind: 'Loom';
  metadata: LoomMetadata;
  style?: EntityStyleProperties;
  scope?: LoomScope;
  content?: LoomContent;
  tags?: string[];
  team?: LoomTeam;
}

// =============================================================================
// Weave Schema
// =============================================================================

/**
 * Graph layout algorithms
 */
export type GraphLayout = 'force-directed' | 'hierarchical' | 'radial' | 'grid';

/**
 * Clustering algorithms
 */
export type ClusteringAlgorithm = 'louvain' | 'label-propagation' | 'spectral';

/**
 * Edge curve styles
 */
export type EdgeCurveStyle = 'bezier' | 'straight' | 'step';

/**
 * Weave metadata section
 */
export interface WeaveMetadata {
  name: string;
  domain?: string;
  description?: string;
  icon?: string;
}

/**
 * Weave-specific style properties
 */
export interface WeaveStyleProperties extends EntityStyleProperties {
  nodeColor?: string;
  edgeColor?: string;
}

/**
 * Physics simulation settings
 */
export interface GraphPhysics {
  enabled?: boolean;
  gravity?: number;
  springLength?: number;
  springConstant?: number;
}

/**
 * Clustering settings
 */
export interface GraphClustering {
  enabled?: boolean;
  algorithm?: ClusteringAlgorithm;
}

/**
 * Graph configuration
 */
export interface GraphConfig {
  layout?: GraphLayout;
  physics?: GraphPhysics;
  clustering?: GraphClustering;
}

/**
 * Node display settings
 */
export interface NodeConfig {
  defaultSize?: number;
  sizeByImportance?: boolean;
  colorByCluster?: boolean;
  showLabels?: boolean;
  labelTruncate?: number;
}

/**
 * Edge display settings
 */
export interface EdgeConfig {
  defaultWidth?: number;
  widthByWeight?: boolean;
  showArrows?: boolean;
  curveStyle?: EdgeCurveStyle;
}

/**
 * Weave visibility settings
 */
export interface WeaveVisibility {
  isPublic?: boolean;
  contributors?: string[];
}

/**
 * Complete Weave schema
 */
export interface WeaveSchema extends BaseSchema {
  kind: 'Weave';
  metadata: WeaveMetadata;
  style?: WeaveStyleProperties;
  graph?: GraphConfig;
  nodes?: NodeConfig;
  edges?: EdgeConfig;
  visibility?: WeaveVisibility;
}

// =============================================================================
// Strand Schema (Frontmatter)
// =============================================================================

/**
 * Strand type categories
 */
export type StrandType = 'note' | 'document' | 'dataset' | 'media' | 'code' | 'visualization';

/**
 * Strand classification for hierarchy
 */
export type StrandClassification = 'folder' | 'chapter' | 'section' | 'lesson' | 'card';

/**
 * Learning phase
 */
export type LearningPhase = 'introduction' | 'core' | 'practice' | 'mastery';

/**
 * Strand learning settings
 */
export interface StrandLearning {
  phase?: LearningPhase;
  prerequisites?: string[];
}

/**
 * Strand style properties
 */
export interface StrandStyleProperties {
  icon?: string;
  accentColor?: string;
}

/**
 * Complete Strand schema (frontmatter)
 */
export interface StrandSchema extends BaseSchema {
  kind: 'Strand';
  title?: string;
  type?: StrandType;
  classification?: StrandClassification;
  parent?: string;
  order?: number;
  tags?: string[];
  difficulty?: number;
  estimatedDuration?: number;
  learning?: StrandLearning;
  style?: StrandStyleProperties;
}

// =============================================================================
// Union Types
// =============================================================================

/**
 * Any valid OpenStrand schema
 */
export type OpenStrandSchema = LoomSchema | WeaveSchema | StrandSchema;

/**
 * Frontmatter wrapper for Markdown files
 */
export interface OpenStrandFrontmatter {
  openstrand: OpenStrandSchema;
}

// =============================================================================
// Parsing Result Types
// =============================================================================

/**
 * Validation error
 */
export interface SchemaValidationError {
  path: string;
  message: string;
  value?: unknown;
}

/**
 * Parse result with validation
 */
export interface ParseResult<T extends OpenStrandSchema> {
  success: boolean;
  data?: T;
  errors?: SchemaValidationError[];
  warnings?: SchemaValidationError[];
}

// =============================================================================
// Local Storage Types
// =============================================================================

/**
 * Local save state
 */
export type SaveState = 'draft' | 'saved' | 'pending' | 'published' | 'conflict';

/**
 * Local save metadata
 */
export interface LocalSaveMetadata {
  id: string;
  kind: SchemaKind;
  state: SaveState;
  savedAt: string;
  publishedAt?: string;
  checksum?: string;
}

/**
 * Locally saved schema with metadata
 */
export interface LocalSavedSchema<T extends OpenStrandSchema = OpenStrandSchema> {
  schema: T;
  meta: LocalSaveMetadata;
  original?: T; // For diff comparison
}



 * Loom & Weave Schema Types
 * 
 * TypeScript definitions for the YAML/Markdown schema format.
 * These types are used for parsing, validation, and serialization.
 * 
 * @module lib/schema/types
 */

import type { EntityStyleProperties } from '@/types/openstrand';

// =============================================================================
// Core Schema Types
// =============================================================================

/**
 * Schema version identifier
 */
export type SchemaVersion = '1.0';

/**
 * Schema kind discriminator
 */
export type SchemaKind = 'Loom' | 'Weave' | 'Strand';

/**
 * Base schema interface with version and kind
 */
export interface BaseSchema {
  version?: SchemaVersion;
  kind: SchemaKind;
}

// =============================================================================
// Loom Schema
// =============================================================================

/**
 * Loom use case categories
 */
export type LoomUseCase =
  | 'storytelling'
  | 'worldbuilding'
  | 'research'
  | 'notebook'
  | 'documentation'
  | 'education'
  | 'custom';

/**
 * Scope type for organizational boundaries
 */
export type ScopeType = 'COLLECTION' | 'DATASET' | 'PROJECT' | 'TEAM' | 'GLOBAL';

/**
 * Visibility levels
 */
export type Visibility = 'private' | 'team' | 'public';

/**
 * Loom metadata section
 */
export interface LoomMetadata {
  name: string;
  slug?: string;
  description?: string;
  icon?: string;
  useCase?: LoomUseCase;
}

/**
 * Loom scope settings
 */
export interface LoomScope {
  type?: ScopeType;
  visibility?: Visibility;
  autoApprove?: boolean;
}

/**
 * Loom content organization
 */
export interface LoomContent {
  rootPath?: string;
  includes?: string[];
  excludes?: string[];
}

/**
 * Loom team settings
 */
export interface LoomTeam {
  id?: string;
  collaborators?: string[];
}

/**
 * Complete Loom schema
 */
export interface LoomSchema extends BaseSchema {
  kind: 'Loom';
  metadata: LoomMetadata;
  style?: EntityStyleProperties;
  scope?: LoomScope;
  content?: LoomContent;
  tags?: string[];
  team?: LoomTeam;
}

// =============================================================================
// Weave Schema
// =============================================================================

/**
 * Graph layout algorithms
 */
export type GraphLayout = 'force-directed' | 'hierarchical' | 'radial' | 'grid';

/**
 * Clustering algorithms
 */
export type ClusteringAlgorithm = 'louvain' | 'label-propagation' | 'spectral';

/**
 * Edge curve styles
 */
export type EdgeCurveStyle = 'bezier' | 'straight' | 'step';

/**
 * Weave metadata section
 */
export interface WeaveMetadata {
  name: string;
  domain?: string;
  description?: string;
  icon?: string;
}

/**
 * Weave-specific style properties
 */
export interface WeaveStyleProperties extends EntityStyleProperties {
  nodeColor?: string;
  edgeColor?: string;
}

/**
 * Physics simulation settings
 */
export interface GraphPhysics {
  enabled?: boolean;
  gravity?: number;
  springLength?: number;
  springConstant?: number;
}

/**
 * Clustering settings
 */
export interface GraphClustering {
  enabled?: boolean;
  algorithm?: ClusteringAlgorithm;
}

/**
 * Graph configuration
 */
export interface GraphConfig {
  layout?: GraphLayout;
  physics?: GraphPhysics;
  clustering?: GraphClustering;
}

/**
 * Node display settings
 */
export interface NodeConfig {
  defaultSize?: number;
  sizeByImportance?: boolean;
  colorByCluster?: boolean;
  showLabels?: boolean;
  labelTruncate?: number;
}

/**
 * Edge display settings
 */
export interface EdgeConfig {
  defaultWidth?: number;
  widthByWeight?: boolean;
  showArrows?: boolean;
  curveStyle?: EdgeCurveStyle;
}

/**
 * Weave visibility settings
 */
export interface WeaveVisibility {
  isPublic?: boolean;
  contributors?: string[];
}

/**
 * Complete Weave schema
 */
export interface WeaveSchema extends BaseSchema {
  kind: 'Weave';
  metadata: WeaveMetadata;
  style?: WeaveStyleProperties;
  graph?: GraphConfig;
  nodes?: NodeConfig;
  edges?: EdgeConfig;
  visibility?: WeaveVisibility;
}

// =============================================================================
// Strand Schema (Frontmatter)
// =============================================================================

/**
 * Strand type categories
 */
export type StrandType = 'note' | 'document' | 'dataset' | 'media' | 'code' | 'visualization';

/**
 * Strand classification for hierarchy
 */
export type StrandClassification = 'folder' | 'chapter' | 'section' | 'lesson' | 'card';

/**
 * Learning phase
 */
export type LearningPhase = 'introduction' | 'core' | 'practice' | 'mastery';

/**
 * Strand learning settings
 */
export interface StrandLearning {
  phase?: LearningPhase;
  prerequisites?: string[];
}

/**
 * Strand style properties
 */
export interface StrandStyleProperties {
  icon?: string;
  accentColor?: string;
}

/**
 * Complete Strand schema (frontmatter)
 */
export interface StrandSchema extends BaseSchema {
  kind: 'Strand';
  title?: string;
  type?: StrandType;
  classification?: StrandClassification;
  parent?: string;
  order?: number;
  tags?: string[];
  difficulty?: number;
  estimatedDuration?: number;
  learning?: StrandLearning;
  style?: StrandStyleProperties;
}

// =============================================================================
// Union Types
// =============================================================================

/**
 * Any valid OpenStrand schema
 */
export type OpenStrandSchema = LoomSchema | WeaveSchema | StrandSchema;

/**
 * Frontmatter wrapper for Markdown files
 */
export interface OpenStrandFrontmatter {
  openstrand: OpenStrandSchema;
}

// =============================================================================
// Parsing Result Types
// =============================================================================

/**
 * Validation error
 */
export interface SchemaValidationError {
  path: string;
  message: string;
  value?: unknown;
}

/**
 * Parse result with validation
 */
export interface ParseResult<T extends OpenStrandSchema> {
  success: boolean;
  data?: T;
  errors?: SchemaValidationError[];
  warnings?: SchemaValidationError[];
}

// =============================================================================
// Local Storage Types
// =============================================================================

/**
 * Local save state
 */
export type SaveState = 'draft' | 'saved' | 'pending' | 'published' | 'conflict';

/**
 * Local save metadata
 */
export interface LocalSaveMetadata {
  id: string;
  kind: SchemaKind;
  state: SaveState;
  savedAt: string;
  publishedAt?: string;
  checksum?: string;
}

/**
 * Locally saved schema with metadata
 */
export interface LocalSavedSchema<T extends OpenStrandSchema = OpenStrandSchema> {
  schema: T;
  meta: LocalSaveMetadata;
  original?: T; // For diff comparison
}



