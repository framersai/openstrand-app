/**
 * Schema Validator
 * 
 * Validates OpenStrand schemas against their type definitions.
 * Provides detailed error messages for invalid configurations.
 * 
 * @module lib/schema/validator
 */

import type {
  OpenStrandSchema,
  LoomSchema,
  WeaveSchema,
  StrandSchema,
  ParseResult,
  SchemaValidationError,
  LoomUseCase,
  ScopeType,
  Visibility,
  GraphLayout,
  ClusteringAlgorithm,
  EdgeCurveStyle,
  StrandType,
  StrandClassification,
  LearningPhase,
} from './types';
import { getPresetIcon } from '@/lib/icons/preset-icons';

// =============================================================================
// Allowed Values
// =============================================================================

const LOOM_USE_CASES: LoomUseCase[] = [
  'storytelling', 'worldbuilding', 'research', 'notebook', 'documentation', 'education', 'custom'
];

const SCOPE_TYPES: ScopeType[] = [
  'COLLECTION', 'DATASET', 'PROJECT', 'TEAM', 'GLOBAL'
];

const VISIBILITY_LEVELS: Visibility[] = ['private', 'team', 'public'];

const GRAPH_LAYOUTS: GraphLayout[] = ['force-directed', 'hierarchical', 'radial', 'grid'];

const CLUSTERING_ALGORITHMS: ClusteringAlgorithm[] = ['louvain', 'label-propagation', 'spectral'];

const EDGE_CURVE_STYLES: EdgeCurveStyle[] = ['bezier', 'straight', 'step'];

const STRAND_TYPES: StrandType[] = ['note', 'document', 'dataset', 'media', 'code', 'visualization'];

const STRAND_CLASSIFICATIONS: StrandClassification[] = ['folder', 'chapter', 'section', 'lesson', 'card'];

const LEARNING_PHASES: LearningPhase[] = ['introduction', 'core', 'practice', 'mastery'];

// =============================================================================
// CSS Color Validation
// =============================================================================

/**
 * Check if a string is a valid CSS color
 */
function isValidCssColor(value: string): boolean {
  // Hex colors
  if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(value)) {
    return true;
  }
  
  // RGB/RGBA
  if (/^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(,\s*[\d.]+\s*)?\)$/.test(value)) {
    return true;
  }
  
  // HSL/HSLA
  if (/^hsla?\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*(,\s*[\d.]+\s*)?\)$/.test(value)) {
    return true;
  }
  
  // Named colors (basic check)
  const namedColors = [
    'transparent', 'currentColor', 'inherit',
    'black', 'white', 'red', 'green', 'blue', 'yellow', 'orange', 'purple',
    'gray', 'grey', 'pink', 'brown', 'cyan', 'magenta'
  ];
  if (namedColors.includes(value.toLowerCase())) {
    return true;
  }
  
  return false;
}

/**
 * Check if a string is a valid URL
 */
function isValidUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    // Allow relative paths
    return value.startsWith('/') || value.startsWith('./') || value.startsWith('../');
  }
}

// =============================================================================
// Validation Helpers
// =============================================================================

type ValidationContext = {
  errors: SchemaValidationError[];
  warnings: SchemaValidationError[];
};

function addError(ctx: ValidationContext, path: string, message: string, value?: unknown) {
  ctx.errors.push({ path, message, value });
}

function addWarning(ctx: ValidationContext, path: string, message: string, value?: unknown) {
  ctx.warnings.push({ path, message, value });
}

function validateRequired(
  ctx: ValidationContext,
  data: Record<string, unknown>,
  field: string,
  path: string
): boolean {
  if (data[field] === undefined || data[field] === null) {
    addError(ctx, path, `Required field "${field}" is missing`);
    return false;
  }
  return true;
}

function validateString(
  ctx: ValidationContext,
  value: unknown,
  path: string,
  options?: { minLength?: number; maxLength?: number }
): boolean {
  if (typeof value !== 'string') {
    addError(ctx, path, `Expected string, got ${typeof value}`, value);
    return false;
  }
  
  if (options?.minLength && value.length < options.minLength) {
    addError(ctx, path, `String must be at least ${options.minLength} characters`, value);
    return false;
  }
  
  if (options?.maxLength && value.length > options.maxLength) {
    addError(ctx, path, `String must be at most ${options.maxLength} characters`, value);
    return false;
  }
  
  return true;
}

function validateEnum<T extends string>(
  ctx: ValidationContext,
  value: unknown,
  path: string,
  allowed: T[],
  fieldName: string
): boolean {
  if (typeof value !== 'string' || !allowed.includes(value as T)) {
    addError(
      ctx,
      path,
      `Invalid ${fieldName}: "${value}". Allowed values: ${allowed.join(', ')}`,
      value
    );
    return false;
  }
  return true;
}

function validateColor(ctx: ValidationContext, value: unknown, path: string): boolean {
  if (typeof value !== 'string') {
    addError(ctx, path, `Expected color string, got ${typeof value}`, value);
    return false;
  }
  
  if (!isValidCssColor(value)) {
    addError(ctx, path, `"${value}" is not a valid CSS color value`, value);
    return false;
  }
  
  return true;
}

function validateUrl(ctx: ValidationContext, value: unknown, path: string): boolean {
  if (typeof value !== 'string') {
    addError(ctx, path, `Expected URL string, got ${typeof value}`, value);
    return false;
  }
  
  if (!isValidUrl(value)) {
    addError(ctx, path, `"${value}" is not a valid URL`, value);
    return false;
  }
  
  return true;
}

function validateIcon(ctx: ValidationContext, value: unknown, path: string): boolean {
  if (typeof value !== 'string') {
    addError(ctx, path, `Expected icon ID string, got ${typeof value}`, value);
    return false;
  }
  
  const icon = getPresetIcon(value);
  if (!icon) {
    addWarning(ctx, path, `Icon "${value}" not found in preset registry. Will use default.`, value);
  }
  
  return true;
}

function validateNumber(
  ctx: ValidationContext,
  value: unknown,
  path: string,
  options?: { min?: number; max?: number }
): boolean {
  if (typeof value !== 'number' || isNaN(value)) {
    addError(ctx, path, `Expected number, got ${typeof value}`, value);
    return false;
  }
  
  if (options?.min !== undefined && value < options.min) {
    addError(ctx, path, `Number must be at least ${options.min}`, value);
    return false;
  }
  
  if (options?.max !== undefined && value > options.max) {
    addError(ctx, path, `Number must be at most ${options.max}`, value);
    return false;
  }
  
  return true;
}

function validateBoolean(ctx: ValidationContext, value: unknown, path: string): boolean {
  if (typeof value !== 'boolean') {
    addError(ctx, path, `Expected boolean, got ${typeof value}`, value);
    return false;
  }
  return true;
}

function validateArray(
  ctx: ValidationContext,
  value: unknown,
  path: string,
  itemValidator?: (item: unknown, index: number) => boolean
): boolean {
  if (!Array.isArray(value)) {
    addError(ctx, path, `Expected array, got ${typeof value}`, value);
    return false;
  }
  
  if (itemValidator) {
    value.forEach((item, index) => {
      itemValidator(item, index);
    });
  }
  
  return true;
}

// =============================================================================
// Style Validation
// =============================================================================

function validateStyleProperties(
  ctx: ValidationContext,
  style: Record<string, unknown>,
  path: string
): void {
  const colorFields = [
    'backgroundColor', 'accentColor', 'textColor', 'borderColor', 'nodeColor', 'edgeColor'
  ];
  
  const urlFields = ['thumbnail', 'coverImage', 'backgroundImage'];
  
  for (const field of colorFields) {
    if (style[field] !== undefined) {
      validateColor(ctx, style[field], `${path}.${field}`);
    }
  }
  
  for (const field of urlFields) {
    if (style[field] !== undefined) {
      validateUrl(ctx, style[field], `${path}.${field}`);
    }
  }
  
  if (style.borderRadius !== undefined) {
    validateString(ctx, style.borderRadius, `${path}.borderRadius`);
  }
  
  if (style.opacity !== undefined) {
    validateNumber(ctx, style.opacity, `${path}.opacity`, { min: 0, max: 1 });
  }
  
  if (style.blur !== undefined) {
    validateNumber(ctx, style.blur, `${path}.blur`, { min: 0 });
  }
  
  if (style.gradient !== undefined) {
    validateString(ctx, style.gradient, `${path}.gradient`);
  }
}

// =============================================================================
// Schema-Specific Validation
// =============================================================================

function validateLoomSchema(
  ctx: ValidationContext,
  data: Record<string, unknown>
): LoomSchema | null {
  // Validate metadata
  if (!validateRequired(ctx, data, 'metadata', 'metadata')) {
    return null;
  }
  
  const metadata = data.metadata as Record<string, unknown>;
  if (typeof metadata !== 'object' || metadata === null) {
    addError(ctx, 'metadata', 'metadata must be an object');
    return null;
  }
  
  if (!validateRequired(ctx, metadata, 'name', 'metadata.name')) {
    return null;
  }
  validateString(ctx, metadata.name, 'metadata.name', { minLength: 1, maxLength: 255 });
  
  if (metadata.slug !== undefined) {
    validateString(ctx, metadata.slug, 'metadata.slug', { maxLength: 255 });
  }
  
  if (metadata.description !== undefined) {
    validateString(ctx, metadata.description, 'metadata.description');
  }
  
  if (metadata.icon !== undefined) {
    validateIcon(ctx, metadata.icon, 'metadata.icon');
  }
  
  if (metadata.useCase !== undefined) {
    validateEnum(ctx, metadata.useCase, 'metadata.useCase', LOOM_USE_CASES, 'use case');
  }
  
  // Validate style
  if (data.style !== undefined) {
    if (typeof data.style === 'object' && data.style !== null) {
      validateStyleProperties(ctx, data.style as Record<string, unknown>, 'style');
    } else {
      addError(ctx, 'style', 'style must be an object');
    }
  }
  
  // Validate scope
  if (data.scope !== undefined) {
    const scope = data.scope as Record<string, unknown>;
    if (typeof scope !== 'object' || scope === null) {
      addError(ctx, 'scope', 'scope must be an object');
    } else {
      if (scope.type !== undefined) {
        validateEnum(ctx, scope.type, 'scope.type', SCOPE_TYPES, 'scope type');
      }
      if (scope.visibility !== undefined) {
        validateEnum(ctx, scope.visibility, 'scope.visibility', VISIBILITY_LEVELS, 'visibility');
      }
      if (scope.autoApprove !== undefined) {
        validateBoolean(ctx, scope.autoApprove, 'scope.autoApprove');
      }
    }
  }
  
  // Validate tags
  if (data.tags !== undefined) {
    validateArray(ctx, data.tags, 'tags', (item, index) => {
      return validateString(ctx, item, `tags[${index}]`);
    });
  }
  
  if (ctx.errors.length > 0) {
    return null;
  }
  
  return data as unknown as LoomSchema;
}

function validateWeaveSchema(
  ctx: ValidationContext,
  data: Record<string, unknown>
): WeaveSchema | null {
  // Validate metadata
  if (!validateRequired(ctx, data, 'metadata', 'metadata')) {
    return null;
  }
  
  const metadata = data.metadata as Record<string, unknown>;
  if (typeof metadata !== 'object' || metadata === null) {
    addError(ctx, 'metadata', 'metadata must be an object');
    return null;
  }
  
  if (!validateRequired(ctx, metadata, 'name', 'metadata.name')) {
    return null;
  }
  validateString(ctx, metadata.name, 'metadata.name', { minLength: 1, maxLength: 255 });
  
  if (metadata.domain !== undefined) {
    validateString(ctx, metadata.domain, 'metadata.domain', { maxLength: 255 });
  }
  
  if (metadata.description !== undefined) {
    validateString(ctx, metadata.description, 'metadata.description');
  }
  
  if (metadata.icon !== undefined) {
    validateIcon(ctx, metadata.icon, 'metadata.icon');
  }
  
  // Validate style
  if (data.style !== undefined) {
    if (typeof data.style === 'object' && data.style !== null) {
      validateStyleProperties(ctx, data.style as Record<string, unknown>, 'style');
    } else {
      addError(ctx, 'style', 'style must be an object');
    }
  }
  
  // Validate graph config
  if (data.graph !== undefined) {
    const graph = data.graph as Record<string, unknown>;
    if (typeof graph !== 'object' || graph === null) {
      addError(ctx, 'graph', 'graph must be an object');
    } else {
      if (graph.layout !== undefined) {
        validateEnum(ctx, graph.layout, 'graph.layout', GRAPH_LAYOUTS, 'layout');
      }
      
      if (graph.clustering !== undefined) {
        const clustering = graph.clustering as Record<string, unknown>;
        if (typeof clustering === 'object' && clustering !== null) {
          if (clustering.enabled !== undefined) {
            validateBoolean(ctx, clustering.enabled, 'graph.clustering.enabled');
          }
          if (clustering.algorithm !== undefined) {
            validateEnum(
              ctx,
              clustering.algorithm,
              'graph.clustering.algorithm',
              CLUSTERING_ALGORITHMS,
              'clustering algorithm'
            );
          }
        }
      }
    }
  }
  
  // Validate edges config
  if (data.edges !== undefined) {
    const edges = data.edges as Record<string, unknown>;
    if (typeof edges === 'object' && edges !== null) {
      if (edges.curveStyle !== undefined) {
        validateEnum(ctx, edges.curveStyle, 'edges.curveStyle', EDGE_CURVE_STYLES, 'curve style');
      }
    }
  }
  
  if (ctx.errors.length > 0) {
    return null;
  }
  
  return data as unknown as WeaveSchema;
}

function validateStrandSchema(
  ctx: ValidationContext,
  data: Record<string, unknown>
): StrandSchema | null {
  // Strand schemas have fewer required fields
  
  if (data.title !== undefined) {
    validateString(ctx, data.title, 'title', { maxLength: 500 });
  }
  
  if (data.type !== undefined) {
    validateEnum(ctx, data.type, 'type', STRAND_TYPES, 'strand type');
  }
  
  if (data.classification !== undefined) {
    validateEnum(ctx, data.classification, 'classification', STRAND_CLASSIFICATIONS, 'classification');
  }
  
  if (data.parent !== undefined) {
    validateString(ctx, data.parent, 'parent');
  }
  
  if (data.order !== undefined) {
    validateNumber(ctx, data.order, 'order', { min: 0 });
  }
  
  if (data.tags !== undefined) {
    validateArray(ctx, data.tags, 'tags', (item, index) => {
      return validateString(ctx, item, `tags[${index}]`);
    });
  }
  
  if (data.difficulty !== undefined) {
    validateNumber(ctx, data.difficulty, 'difficulty', { min: 1, max: 5 });
  }
  
  if (data.estimatedDuration !== undefined) {
    validateNumber(ctx, data.estimatedDuration, 'estimatedDuration', { min: 0 });
  }
  
  // Validate learning settings
  if (data.learning !== undefined) {
    const learning = data.learning as Record<string, unknown>;
    if (typeof learning === 'object' && learning !== null) {
      if (learning.phase !== undefined) {
        validateEnum(ctx, learning.phase, 'learning.phase', LEARNING_PHASES, 'learning phase');
      }
      if (learning.prerequisites !== undefined) {
        validateArray(ctx, learning.prerequisites, 'learning.prerequisites', (item, index) => {
          return validateString(ctx, item, `learning.prerequisites[${index}]`);
        });
      }
    }
  }
  
  // Validate style
  if (data.style !== undefined) {
    const style = data.style as Record<string, unknown>;
    if (typeof style === 'object' && style !== null) {
      if (style.icon !== undefined) {
        validateIcon(ctx, style.icon, 'style.icon');
      }
      if (style.accentColor !== undefined) {
        validateColor(ctx, style.accentColor, 'style.accentColor');
      }
    }
  }
  
  if (ctx.errors.length > 0) {
    return null;
  }
  
  return data as unknown as StrandSchema;
}

// =============================================================================
// Main Validation Function
// =============================================================================

/**
 * Validate parsed data as an OpenStrand schema
 * 
 * @param data - Parsed YAML data
 * @returns Validation result with typed schema or errors
 */
export function validateSchema(data: Record<string, unknown>): ParseResult<OpenStrandSchema> {
  const ctx: ValidationContext = { errors: [], warnings: [] };
  
  // Check for kind field
  if (!validateRequired(ctx, data, 'kind', 'kind')) {
    return { success: false, errors: ctx.errors };
  }
  
  const kind = data.kind;
  
  if (kind !== 'Loom' && kind !== 'Weave' && kind !== 'Strand') {
    addError(ctx, 'kind', `Invalid kind: "${kind}". Must be Loom, Weave, or Strand`, kind);
    return { success: false, errors: ctx.errors };
  }
  
  // Validate based on kind
  let schema: OpenStrandSchema | null = null;
  
  switch (kind) {
    case 'Loom':
      schema = validateLoomSchema(ctx, data);
      break;
    case 'Weave':
      schema = validateWeaveSchema(ctx, data);
      break;
    case 'Strand':
      schema = validateStrandSchema(ctx, data);
      break;
  }
  
  if (!schema) {
    return {
      success: false,
      errors: ctx.errors,
      warnings: ctx.warnings.length > 0 ? ctx.warnings : undefined,
    };
  }
  
  return {
    success: true,
    data: schema,
    warnings: ctx.warnings.length > 0 ? ctx.warnings : undefined,
  };
}

