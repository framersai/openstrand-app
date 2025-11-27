/**
 * Loom & Weave Schema Parser
 * 
 * Parses YAML frontmatter from Markdown files to extract Loom, Weave, and Strand definitions.
 * Supports local save and publish workflow with validation.
 * 
 * @module lib/schema/loom-weave-parser
 */

import { z } from 'zod';

// =============================================================================
// Schema Version
// =============================================================================

export const SCHEMA_VERSION = '1.0';

// =============================================================================
// Enums
// =============================================================================

export const LoomUseCaseEnum = z.enum([
  'storytelling',
  'worldbuilding',
  'research',
  'notebook',
  'documentation',
  'education',
  'custom',
]);

export const ScopeTypeEnum = z.enum([
  'PROJECT',
  'COLLECTION',
  'DATASET',
  'TEAM',
  'GLOBAL',
]);

export const StrandTypeEnum = z.enum([
  'document',
  'note',
  'dataset',
  'media',
  'code',
  'template',
]);

export const ClassificationEnum = z.enum([
  'folder',
  'chapter',
  'section',
  'leaf',
  'core',
]);

export const LinkTypeEnum = z.enum([
  'prerequisite',
  'related',
  'part-of',
  'references',
  'extends',
  'contradicts',
  'visualizes',
]);

export const WeaveLayoutEnum = z.enum([
  'force-directed',
  'hierarchical',
  'circular',
  'grid',
]);

export type LoomUseCase = z.infer<typeof LoomUseCaseEnum>;
export type ScopeType = z.infer<typeof ScopeTypeEnum>;
export type StrandType = z.infer<typeof StrandTypeEnum>;
export type Classification = z.infer<typeof ClassificationEnum>;
export type LinkType = z.infer<typeof LinkTypeEnum>;
export type WeaveLayout = z.infer<typeof WeaveLayoutEnum>;

// =============================================================================
// Shared Schemas
// =============================================================================

const AuthorSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  url: z.string().url().optional(),
}).optional();

const LocalStateSchema = z.object({
  savedAt: z.string().datetime().optional(),
  isDirty: z.boolean().default(false),
  lastPublished: z.string().datetime().nullable().optional(),
}).optional();

const StylePropertiesSchema = z.object({
  icon: z.string().optional(),
  thumbnail: z.string().optional(),
  coverImage: z.string().optional(),
  backgroundImage: z.string().optional(),
  backgroundColor: z.string().optional(),
  accentColor: z.string().optional(),
  textColor: z.string().optional(),
  borderColor: z.string().optional(),
  borderRadius: z.string().optional(),
  opacity: z.number().min(0).max(1).optional(),
  blur: z.number().min(0).optional(),
  gradient: z.string().optional(),
  customStyles: z.record(z.string()).optional(),
});

const PositionSchema = z.object({
  x: z.number(),
  y: z.number(),
  z: z.number().optional(),
});

// =============================================================================
// Loom Schema
// =============================================================================

export const LoomSchema = z.object({
  // Required
  openstrand: z.literal(SCHEMA_VERSION),
  type: z.literal('loom'),
  name: z.string().min(1).max(255),
  
  // Identity
  id: z.string().optional(),
  slug: z.string().optional(),
  
  // Classification
  useCase: LoomUseCaseEnum.default('custom'),
  scopeType: ScopeTypeEnum.default('PROJECT'),
  
  // Description
  description: z.string().optional(),
  
  // Metadata
  tags: z.array(z.string()).max(20).default([]),
  language: z.string().default('en'),
  license: z.string().optional(),
  
  // Author
  author: AuthorSchema,
  
  // Timestamps
  created: z.string().datetime().optional(),
  modified: z.string().datetime().optional(),
  
  // Local state
  _local: LocalStateSchema,
}).merge(StylePropertiesSchema);

export type Loom = z.infer<typeof LoomSchema>;

// =============================================================================
// Weave Schema
// =============================================================================

const WeaveNodeSchema = z.object({
  id: z.string(),
  strandId: z.string().optional(),
  type: z.string(),
  title: z.string(),
  importance: z.number().min(0).max(1).default(0.5),
  summary: z.string().optional(),
  position: PositionSchema.optional(),
  metadata: z.record(z.unknown()).optional(),
});

const WeaveEdgeSchema = z.object({
  source: z.string(),
  target: z.string(),
  type: z.string(),
  weight: z.number().min(0).max(1).default(1),
  note: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

const WeaveConfigSchema = z.object({
  layout: WeaveLayoutEnum.default('force-directed'),
  physics: z.object({
    enabled: z.boolean().default(true),
    repulsion: z.number().default(100),
    attraction: z.number().default(0.01),
  }).optional(),
  clustering: z.object({
    enabled: z.boolean().default(true),
    algorithm: z.enum(['louvain', 'label-propagation', 'none']).default('louvain'),
  }).optional(),
  rendering: z.object({
    nodeSize: z.enum(['auto', 'fixed', 'by-importance']).default('auto'),
    edgeWidth: z.enum(['uniform', 'by-weight']).default('by-weight'),
    labels: z.enum(['always', 'hover', 'none']).default('hover'),
  }).optional(),
}).optional();

const WeaveMetricsSchema = z.object({
  nodeCount: z.number().default(0),
  edgeCount: z.number().default(0),
  density: z.number().optional(),
  diameter: z.number().optional(),
  centrality: z.record(z.number()).optional(),
  communities: z.array(z.array(z.string())).optional(),
}).optional();

export const WeaveSchema = z.object({
  // Required
  openstrand: z.literal(SCHEMA_VERSION),
  type: z.literal('weave'),
  name: z.string().min(1).max(255),
  domain: z.string().min(1).max(255),
  
  // Identity
  id: z.string().optional(),
  slug: z.string().optional(),
  
  // Description
  description: z.string().optional(),
  
  // Graph data
  nodes: z.array(WeaveNodeSchema).default([]),
  edges: z.array(WeaveEdgeSchema).default([]),
  config: WeaveConfigSchema,
  metrics: WeaveMetricsSchema,
  
  // Metadata
  tags: z.array(z.string()).max(20).default([]),
  
  // Timestamps
  created: z.string().datetime().optional(),
  modified: z.string().datetime().optional(),
  
  // Local state
  _local: LocalStateSchema,
}).merge(StylePropertiesSchema);

export type Weave = z.infer<typeof WeaveSchema>;
export type WeaveNode = z.infer<typeof WeaveNodeSchema>;
export type WeaveEdge = z.infer<typeof WeaveEdgeSchema>;

// =============================================================================
// Strand Schema
// =============================================================================

const StrandLinkSchema = z.object({
  target: z.string(),
  type: LinkTypeEnum,
  weight: z.number().min(0).max(1).default(1),
  note: z.string().optional(),
});

export const StrandSchema = z.object({
  // Required
  openstrand: z.literal(SCHEMA_VERSION),
  type: z.literal('strand'),
  title: z.string().min(1).max(500),
  
  // Identity
  id: z.string().optional(),
  slug: z.string().optional(),
  
  // Classification
  strandType: StrandTypeEnum.default('document'),
  classification: ClassificationEnum.default('core'),
  
  // Hierarchy
  loom: z.string().optional(), // Loom slug or ID
  parent: z.string().optional(), // Parent strand ID
  
  // Content metadata
  language: z.string().default('en'),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).optional(),
  estimatedTime: z.number().min(0).optional(), // Minutes
  
  // Tags
  tags: z.array(z.string()).max(20).default([]),
  categories: z.array(z.string()).default([]),
  
  // Learning metadata
  prerequisites: z.array(z.string()).default([]),
  learningObjectives: z.array(z.string()).default([]),
  
  // Links
  links: z.array(StrandLinkSchema).default([]),
  
  // Timestamps
  created: z.string().datetime().optional(),
  modified: z.string().datetime().optional(),
  
  // Local state
  _local: LocalStateSchema,
}).merge(StylePropertiesSchema);

export type Strand = z.infer<typeof StrandSchema>;
export type StrandLink = z.infer<typeof StrandLinkSchema>;

// =============================================================================
// Parse Result Types
// =============================================================================

export interface ParseError {
  file?: string;
  line?: number;
  field?: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ParseResult<T> {
  success: boolean;
  data?: T;
  content?: string; // Markdown content after frontmatter
  errors: ParseError[];
  warnings: ParseError[];
}

export type EntityType = 'loom' | 'weave' | 'strand';

export interface ParsedEntity {
  type: EntityType;
  data: Loom | Weave | Strand;
  content?: string;
  filename?: string;
}

// =============================================================================
// Parser Functions
// =============================================================================

/**
 * Extract YAML frontmatter from a string
 */
export function extractFrontmatter(content: string): { frontmatter: string | null; body: string } {
  const frontmatterRegex = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;
  const match = content.match(frontmatterRegex);
  
  if (match) {
    return {
      frontmatter: match[1],
      body: match[2],
    };
  }
  
  return {
    frontmatter: null,
    body: content,
  };
}

/**
 * Parse YAML string to object
 * Uses a simple YAML parser that handles common cases
 */
export function parseYaml(yaml: string): Record<string, unknown> {
  // For production, use js-yaml library
  // This is a simplified parser for basic YAML
  const result: Record<string, unknown> = {};
  const lines = yaml.split('\n');
  let currentKey = '';
  let currentIndent = 0;
  let inMultiline = false;
  let multilineValue = '';
  let inArray = false;
  let arrayKey = '';
  let arrayValue: unknown[] = [];
  
  for (const line of lines) {
    // Skip empty lines and comments
    if (line.trim() === '' || line.trim().startsWith('#')) {
      if (inMultiline) {
        multilineValue += '\n';
      }
      continue;
    }
    
    const indent = line.search(/\S/);
    
    // Handle multiline strings
    if (inMultiline) {
      if (indent > currentIndent) {
        multilineValue += line.trim() + '\n';
        continue;
      } else {
        result[currentKey] = multilineValue.trim();
        inMultiline = false;
        multilineValue = '';
      }
    }
    
    // Handle array items
    if (line.trim().startsWith('- ')) {
      if (!inArray) {
        // This shouldn't happen with well-formed YAML
        continue;
      }
      const value = line.trim().substring(2).trim();
      // Check if it's a simple value or object
      if (value.includes(':')) {
        // Object in array - simplified handling
        const obj: Record<string, unknown> = {};
        const [k, v] = value.split(':').map(s => s.trim());
        obj[k] = parseYamlValue(v);
        arrayValue.push(obj);
      } else {
        arrayValue.push(parseYamlValue(value));
      }
      continue;
    }
    
    // End array if indent decreases
    if (inArray && indent <= currentIndent) {
      result[arrayKey] = arrayValue;
      inArray = false;
      arrayValue = [];
    }
    
    // Parse key: value
    const colonIndex = line.indexOf(':');
    if (colonIndex > -1) {
      const key = line.substring(0, colonIndex).trim();
      const value = line.substring(colonIndex + 1).trim();
      
      if (value === '' || value === '|' || value === '>') {
        // Multiline string or nested object
        if (value === '|' || value === '>') {
          inMultiline = true;
          currentKey = key;
          currentIndent = indent;
          multilineValue = '';
        } else {
          // Could be array or nested object - check next line
          currentKey = key;
          currentIndent = indent;
          // Peek ahead for array
          const nextLineIndex = lines.indexOf(line) + 1;
          if (nextLineIndex < lines.length) {
            const nextLine = lines[nextLineIndex];
            if (nextLine.trim().startsWith('- ')) {
              inArray = true;
              arrayKey = key;
              arrayValue = [];
            }
          }
        }
      } else {
        result[key] = parseYamlValue(value);
      }
    }
  }
  
  // Handle any remaining multiline or array
  if (inMultiline) {
    result[currentKey] = multilineValue.trim();
  }
  if (inArray) {
    result[arrayKey] = arrayValue;
  }
  
  return result;
}

/**
 * Parse a YAML value string
 */
function parseYamlValue(value: string): unknown {
  // Remove quotes
  if ((value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }
  
  // Boolean
  if (value === 'true') return true;
  if (value === 'false') return false;
  
  // Null
  if (value === 'null' || value === '~') return null;
  
  // Number
  const num = Number(value);
  if (!isNaN(num) && value !== '') return num;
  
  // String
  return value;
}

/**
 * Detect entity type from parsed data
 */
export function detectEntityType(data: Record<string, unknown>, filename?: string): EntityType {
  // Explicit type field
  if (data.type === 'loom') return 'loom';
  if (data.type === 'weave') return 'weave';
  if (data.type === 'strand') return 'strand';
  
  // File extension
  if (filename) {
    if (filename.endsWith('.loom.md') || filename.endsWith('.loom.yaml')) return 'loom';
    if (filename.endsWith('.weave.md') || filename.endsWith('.weave.yaml')) return 'weave';
  }
  
  // Field-based detection
  if ('domain' in data && 'nodes' in data) return 'weave';
  if ('domain' in data) return 'weave';
  if ('useCase' in data || 'scopeType' in data) return 'loom';
  if ('title' in data && !('name' in data)) return 'strand';
  
  // Default to strand
  return 'strand';
}

/**
 * Generate a cuid-like ID
 */
export function generateId(prefix: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 9);
  return `${prefix}-${timestamp}${random}`;
}

/**
 * Generate a slug from a name
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 100);
}

/**
 * Parse a Loom from YAML data
 */
export function parseLoom(data: Record<string, unknown>): ParseResult<Loom> {
  const errors: ParseError[] = [];
  const warnings: ParseError[] = [];
  
  // Add defaults
  const enriched = {
    openstrand: SCHEMA_VERSION,
    type: 'loom' as const,
    ...data,
    id: data.id || generateId('loom'),
    slug: data.slug || (data.name ? generateSlug(data.name as string) : undefined),
    created: data.created || new Date().toISOString(),
    modified: new Date().toISOString(),
  };
  
  try {
    const parsed = LoomSchema.parse(enriched);
    return { success: true, data: parsed, errors, warnings };
  } catch (err) {
    if (err instanceof z.ZodError) {
      for (const issue of err.issues) {
        errors.push({
          field: issue.path.join('.'),
          message: issue.message,
          severity: 'error',
        });
      }
    }
    return { success: false, errors, warnings };
  }
}

/**
 * Parse a Weave from YAML data
 */
export function parseWeave(data: Record<string, unknown>): ParseResult<Weave> {
  const errors: ParseError[] = [];
  const warnings: ParseError[] = [];
  
  const enriched = {
    openstrand: SCHEMA_VERSION,
    type: 'weave' as const,
    ...data,
    id: data.id || generateId('weave'),
    slug: data.slug || (data.name ? generateSlug(data.name as string) : undefined),
    created: data.created || new Date().toISOString(),
    modified: new Date().toISOString(),
  };
  
  try {
    const parsed = WeaveSchema.parse(enriched);
    return { success: true, data: parsed, errors, warnings };
  } catch (err) {
    if (err instanceof z.ZodError) {
      for (const issue of err.issues) {
        errors.push({
          field: issue.path.join('.'),
          message: issue.message,
          severity: 'error',
        });
      }
    }
    return { success: false, errors, warnings };
  }
}

/**
 * Parse a Strand from YAML data
 */
export function parseStrand(data: Record<string, unknown>): ParseResult<Strand> {
  const errors: ParseError[] = [];
  const warnings: ParseError[] = [];
  
  const enriched = {
    openstrand: SCHEMA_VERSION,
    type: 'strand' as const,
    ...data,
    id: data.id || generateId('strand'),
    slug: data.slug || (data.title ? generateSlug(data.title as string) : undefined),
    created: data.created || new Date().toISOString(),
    modified: new Date().toISOString(),
  };
  
  try {
    const parsed = StrandSchema.parse(enriched);
    return { success: true, data: parsed, errors, warnings };
  } catch (err) {
    if (err instanceof z.ZodError) {
      for (const issue of err.issues) {
        errors.push({
          field: issue.path.join('.'),
          message: issue.message,
          severity: 'error',
        });
      }
    }
    return { success: false, errors, warnings };
  }
}

/**
 * Parse a file content and return the appropriate entity
 */
export function parseFile(content: string, filename?: string): ParseResult<ParsedEntity> {
  const errors: ParseError[] = [];
  const warnings: ParseError[] = [];
  
  // Extract frontmatter
  const { frontmatter, body } = extractFrontmatter(content);
  
  if (!frontmatter) {
    errors.push({
      file: filename,
      message: 'No YAML frontmatter found. File must start with ---',
      severity: 'error',
    });
    return { success: false, errors, warnings };
  }
  
  // Parse YAML
  let data: Record<string, unknown>;
  try {
    data = parseYaml(frontmatter);
  } catch (err) {
    errors.push({
      file: filename,
      message: `Invalid YAML: ${err instanceof Error ? err.message : 'Unknown error'}`,
      severity: 'error',
    });
    return { success: false, errors, warnings };
  }
  
  // Detect type
  const type = detectEntityType(data, filename);
  
  // Parse based on type
  let result: ParseResult<Loom | Weave | Strand>;
  
  switch (type) {
    case 'loom':
      result = parseLoom(data);
      break;
    case 'weave':
      result = parseWeave(data);
      break;
    case 'strand':
      result = parseStrand(data);
      break;
  }
  
  if (!result.success || !result.data) {
    return {
      success: false,
      errors: [...errors, ...result.errors],
      warnings: [...warnings, ...result.warnings],
    };
  }
  
  return {
    success: true,
    data: {
      type,
      data: result.data,
      content: body,
      filename,
    },
    errors: [...errors, ...result.errors],
    warnings: [...warnings, ...result.warnings],
  };
}

/**
 * Serialize an entity back to YAML frontmatter + Markdown
 */
export function serializeToFile(entity: ParsedEntity): string {
  const { type, data, content } = entity;
  
  // Remove internal fields for serialization
  const cleanData = { ...data };
  delete (cleanData as Record<string, unknown>)._local;
  
  // Convert to YAML (simplified)
  const yaml = objectToYaml(cleanData);
  
  return `---\n${yaml}---\n\n${content || ''}`;
}

/**
 * Convert object to YAML string (simplified)
 */
function objectToYaml(obj: Record<string, unknown>, indent = 0): string {
  const spaces = '  '.repeat(indent);
  let result = '';
  
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined || value === null) continue;
    
    if (Array.isArray(value)) {
      if (value.length === 0) continue;
      result += `${spaces}${key}:\n`;
      for (const item of value) {
        if (typeof item === 'object' && item !== null) {
          result += `${spaces}  - ${objectToYaml(item as Record<string, unknown>, indent + 2).trim()}\n`;
        } else {
          result += `${spaces}  - ${formatYamlValue(item)}\n`;
        }
      }
    } else if (typeof value === 'object') {
      result += `${spaces}${key}:\n`;
      result += objectToYaml(value as Record<string, unknown>, indent + 1);
    } else {
      result += `${spaces}${key}: ${formatYamlValue(value)}\n`;
    }
  }
  
  return result;
}

/**
 * Format a value for YAML output
 */
function formatYamlValue(value: unknown): string {
  if (typeof value === 'string') {
    // Quote if contains special chars
    if (value.includes(':') || value.includes('#') || value.includes('\n')) {
      return `"${value.replace(/"/g, '\\"')}"`;
    }
    return value;
  }
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') return String(value);
  return String(value);
}

