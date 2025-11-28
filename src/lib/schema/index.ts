/**
 * OpenStrand Schema Module
 * 
 * Provides YAML/Markdown schema parsing, validation, and local storage
 * for Loom and Weave configurations.
 * 
 * @module lib/schema
 * 
 * @example
 * ```typescript
 * import { 
 *   parseSchema, 
 *   parseLoomSchema, 
 *   saveSchemaLocally,
 *   getAllLooms 
 * } from '@/lib/schema';
 * 
 * // Parse a YAML schema
 * const result = parseLoomSchema(yamlContent);
 * if (result.success) {
 *   // Save locally
 *   await saveSchemaLocally('loom-123', result.data);
 * }
 * 
 * // Get all saved Looms
 * const looms = await getAllLooms();
 * ```
 */

// Types
export type {
  // Core types
  SchemaVersion,
  SchemaKind,
  BaseSchema,
  OpenStrandSchema,
  OpenStrandFrontmatter,
  
  // Loom types
  LoomSchema,
  LoomMetadata,
  LoomScope,
  LoomContent,
  LoomTeam,
  LoomUseCase,
  ScopeType,
  Visibility,
  
  // Weave types
  WeaveSchema,
  WeaveMetadata,
  WeaveStyleProperties,
  GraphConfig,
  GraphPhysics,
  GraphClustering,
  NodeConfig,
  EdgeConfig,
  WeaveVisibility,
  GraphLayout,
  ClusteringAlgorithm,
  EdgeCurveStyle,
  
  // Strand types
  StrandSchema,
  StrandLearning,
  StrandStyleProperties,
  StrandType,
  StrandClassification,
  LearningPhase,
  
  // Result types
  ParseResult,
  SchemaValidationError,
  
  // Storage types
  SaveState,
  LocalSaveMetadata,
  LocalSavedSchema,
} from './types';

// Parser functions
export {
  // Frontmatter
  extractFrontmatter,
  hasFrontmatter,
  
  // YAML parsing
  parseYaml,
  toYaml,
  
  // Schema parsing
  parseSchema,
  parseLoomSchema,
  parseWeaveSchema,
  parseStrandFrontmatter,
  
  // Type guards
  isLoomSchema,
  isWeaveSchema,
  isStrandSchema,
  
  // Serialization
  serializeSchema,
  generateMarkdownWithFrontmatter,
  
  // Detection
  detectSchemaKind,
  
  // Migration
  migrateSchema,
} from './parser';

// Validator
export { validateSchema } from './validator';

// Local storage
export {
  // Save operations
  saveSchemaLocally,
  saveLoomLocally,
  saveWeaveLocally,
  
  // Read operations
  getSchemaById,
  getSchemasByKind,
  getAllLooms,
  getAllWeaves,
  getPendingSchemas,
  
  // State management
  markAsPublished,
  markAsConflict,
  
  // Delete operations
  deleteSchema,
  clearAllSchemas,
  
  // Change detection
  hasUnsavedChanges,
  hasUnpublishedChanges,
  getSchemaDiff,
  
  // Export/Import
  exportAllSchemas,
  importSchemas,
} from './local-storage';

 * 
 * Provides YAML/Markdown schema parsing, validation, and local storage
 * for Loom and Weave configurations.
 * 
 * @module lib/schema
 * 
 * @example
 * ```typescript
 * import { 
 *   parseSchema, 
 *   parseLoomSchema, 
 *   saveSchemaLocally,
 *   getAllLooms 
 * } from '@/lib/schema';
 * 
 * // Parse a YAML schema
 * const result = parseLoomSchema(yamlContent);
 * if (result.success) {
 *   // Save locally
 *   await saveSchemaLocally('loom-123', result.data);
 * }
 * 
 * // Get all saved Looms
 * const looms = await getAllLooms();
 * ```
 */

// Types
export type {
  // Core types
  SchemaVersion,
  SchemaKind,
  BaseSchema,
  OpenStrandSchema,
  OpenStrandFrontmatter,
  
  // Loom types
  LoomSchema,
  LoomMetadata,
  LoomScope,
  LoomContent,
  LoomTeam,
  LoomUseCase,
  ScopeType,
  Visibility,
  
  // Weave types
  WeaveSchema,
  WeaveMetadata,
  WeaveStyleProperties,
  GraphConfig,
  GraphPhysics,
  GraphClustering,
  NodeConfig,
  EdgeConfig,
  WeaveVisibility,
  GraphLayout,
  ClusteringAlgorithm,
  EdgeCurveStyle,
  
  // Strand types
  StrandSchema,
  StrandLearning,
  StrandStyleProperties,
  StrandType,
  StrandClassification,
  LearningPhase,
  
  // Result types
  ParseResult,
  SchemaValidationError,
  
  // Storage types
  SaveState,
  LocalSaveMetadata,
  LocalSavedSchema,
} from './types';

// Parser functions
export {
  // Frontmatter
  extractFrontmatter,
  hasFrontmatter,
  
  // YAML parsing
  parseYaml,
  toYaml,
  
  // Schema parsing
  parseSchema,
  parseLoomSchema,
  parseWeaveSchema,
  parseStrandFrontmatter,
  
  // Type guards
  isLoomSchema,
  isWeaveSchema,
  isStrandSchema,
  
  // Serialization
  serializeSchema,
  generateMarkdownWithFrontmatter,
  
  // Detection
  detectSchemaKind,
  
  // Migration
  migrateSchema,
} from './parser';

// Validator
export { validateSchema } from './validator';

// Local storage
export {
  // Save operations
  saveSchemaLocally,
  saveLoomLocally,
  saveWeaveLocally,
  
  // Read operations
  getSchemaById,
  getSchemasByKind,
  getAllLooms,
  getAllWeaves,
  getPendingSchemas,
  
  // State management
  markAsPublished,
  markAsConflict,
  
  // Delete operations
  deleteSchema,
  clearAllSchemas,
  
  // Change detection
  hasUnsavedChanges,
  hasUnpublishedChanges,
  getSchemaDiff,
  
  // Export/Import
  exportAllSchemas,
  importSchemas,
} from './local-storage';
