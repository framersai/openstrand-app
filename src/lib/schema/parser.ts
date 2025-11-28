/**
 * YAML/Markdown Schema Parser
 * 
 * Parses YAML frontmatter and standalone YAML files into typed OpenStrand schemas.
 * Supports Loom, Weave, and Strand configurations.
 * 
 * @module lib/schema/parser
 */

import * as yaml from 'yaml';
import type {
  OpenStrandSchema,
  OpenStrandFrontmatter,
  LoomSchema,
  WeaveSchema,
  StrandSchema,
  ParseResult,
  SchemaValidationError,
  SchemaKind,
} from './types';
import { validateSchema } from './validator';

// =============================================================================
// Frontmatter Extraction
// =============================================================================

/**
 * Regex to match YAML frontmatter in Markdown
 * Matches content between --- delimiters at the start of a file
 */
const FRONTMATTER_REGEX = /^---\s*\n([\s\S]*?)\n---\s*\n?/;

/**
 * Extract YAML frontmatter from Markdown content
 * 
 * @param content - Markdown content with potential frontmatter
 * @returns Extracted frontmatter string and remaining content, or null if no frontmatter
 */
export function extractFrontmatter(content: string): {
  frontmatter: string;
  body: string;
} | null {
  const match = content.match(FRONTMATTER_REGEX);
  if (!match) return null;
  
  return {
    frontmatter: match[1],
    body: content.slice(match[0].length),
  };
}

/**
 * Check if content has YAML frontmatter
 */
export function hasFrontmatter(content: string): boolean {
  return FRONTMATTER_REGEX.test(content);
}

// =============================================================================
// YAML Parsing
// =============================================================================

/**
 * Parse YAML string to JavaScript object
 * 
 * @param yamlString - YAML content to parse
 * @returns Parsed object or null on error
 */
export function parseYaml<T = unknown>(yamlString: string): {
  data: T | null;
  error?: string;
} {
  try {
    const data = yaml.parse(yamlString) as T;
    return { data };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to parse YAML',
    };
  }
}

/**
 * Serialize object to YAML string
 * 
 * @param data - Object to serialize
 * @returns YAML string
 */
export function toYaml(data: unknown): string {
  return yaml.stringify(data, {
    indent: 2,
    lineWidth: 0, // Disable line wrapping
  });
}

// =============================================================================
// Schema Parsing
// =============================================================================

/**
 * Parse OpenStrand schema from YAML string
 * 
 * @param yamlString - YAML content
 * @returns Parse result with typed schema or errors
 */
export function parseSchema(yamlString: string): ParseResult<OpenStrandSchema> {
  const { data, error } = parseYaml<unknown>(yamlString);
  
  if (error || !data) {
    return {
      success: false,
      errors: [{ path: '', message: error || 'Failed to parse YAML' }],
    };
  }
  
  // Check if this is frontmatter format (has openstrand wrapper)
  const schemaData = isOpenStrandFrontmatter(data)
    ? (data as OpenStrandFrontmatter).openstrand
    : data;
  
  // Validate and type the schema
  return validateSchema(schemaData as Record<string, unknown>);
}

/**
 * Parse Loom schema from YAML
 */
export function parseLoomSchema(yamlString: string): ParseResult<LoomSchema> {
  const result = parseSchema(yamlString);
  
  if (!result.success || !result.data) {
    return result as ParseResult<LoomSchema>;
  }
  
  if (result.data.kind !== 'Loom') {
    return {
      success: false,
      errors: [{ path: 'kind', message: `Expected Loom schema, got ${result.data.kind}` }],
    };
  }
  
  return result as ParseResult<LoomSchema>;
}

/**
 * Parse Weave schema from YAML
 */
export function parseWeaveSchema(yamlString: string): ParseResult<WeaveSchema> {
  const result = parseSchema(yamlString);
  
  if (!result.success || !result.data) {
    return result as ParseResult<WeaveSchema>;
  }
  
  if (result.data.kind !== 'Weave') {
    return {
      success: false,
      errors: [{ path: 'kind', message: `Expected Weave schema, got ${result.data.kind}` }],
    };
  }
  
  return result as ParseResult<WeaveSchema>;
}

/**
 * Parse Strand frontmatter from Markdown
 */
export function parseStrandFrontmatter(markdown: string): ParseResult<StrandSchema> & {
  body?: string;
} {
  const extracted = extractFrontmatter(markdown);
  
  if (!extracted) {
    return {
      success: false,
      errors: [{ path: '', message: 'No frontmatter found in Markdown' }],
    };
  }
  
  const result = parseSchema(extracted.frontmatter);
  
  if (!result.success || !result.data) {
    return { ...result, body: extracted.body } as ParseResult<StrandSchema> & { body?: string };
  }
  
  if (result.data.kind !== 'Strand') {
    return {
      success: false,
      errors: [{ path: 'kind', message: `Expected Strand schema, got ${result.data.kind}` }],
      body: extracted.body,
    };
  }
  
  return { ...(result as ParseResult<StrandSchema>), body: extracted.body };
}

// =============================================================================
// Type Guards
// =============================================================================

/**
 * Check if data is OpenStrand frontmatter format
 */
function isOpenStrandFrontmatter(data: unknown): data is OpenStrandFrontmatter {
  return (
    typeof data === 'object' &&
    data !== null &&
    'openstrand' in data &&
    typeof (data as Record<string, unknown>).openstrand === 'object'
  );
}

/**
 * Type guard for Loom schema
 */
export function isLoomSchema(schema: OpenStrandSchema): schema is LoomSchema {
  return schema.kind === 'Loom';
}

/**
 * Type guard for Weave schema
 */
export function isWeaveSchema(schema: OpenStrandSchema): schema is WeaveSchema {
  return schema.kind === 'Weave';
}

/**
 * Type guard for Strand schema
 */
export function isStrandSchema(schema: OpenStrandSchema): schema is StrandSchema {
  return schema.kind === 'Strand';
}

// =============================================================================
// Serialization
// =============================================================================

/**
 * Serialize schema to YAML string
 * 
 * @param schema - OpenStrand schema to serialize
 * @param options - Serialization options
 * @returns YAML string
 */
export function serializeSchema(
  schema: OpenStrandSchema,
  options?: {
    /** Wrap in openstrand frontmatter format */
    asFrontmatter?: boolean;
    /** Include version field */
    includeVersion?: boolean;
  }
): string {
  const { asFrontmatter = false, includeVersion = true } = options ?? {};
  
  const data = includeVersion
    ? { version: '1.0', ...schema }
    : schema;
  
  if (asFrontmatter) {
    return toYaml({ openstrand: data });
  }
  
  return toYaml(data);
}

/**
 * Generate Markdown with frontmatter
 * 
 * @param schema - Strand schema for frontmatter
 * @param body - Markdown body content
 * @returns Complete Markdown with frontmatter
 */
export function generateMarkdownWithFrontmatter(
  schema: StrandSchema,
  body: string
): string {
  const frontmatter = serializeSchema(schema, { asFrontmatter: true });
  return `---\n${frontmatter}---\n\n${body}`;
}

// =============================================================================
// File Detection
// =============================================================================

/**
 * Detect schema kind from file path or content
 */
export function detectSchemaKind(
  filePath: string,
  content?: string
): SchemaKind | null {
  // Check file name
  const fileName = filePath.split('/').pop()?.toLowerCase() ?? '';
  
  if (fileName === 'loom.yaml' || fileName === 'loom.yml') {
    return 'Loom';
  }
  if (fileName === 'weave.yaml' || fileName === 'weave.yml') {
    return 'Weave';
  }
  
  // Check content if provided
  if (content) {
    const { data } = parseYaml<Record<string, unknown>>(content);
    if (data) {
      const kind = isOpenStrandFrontmatter(data)
        ? (data as OpenStrandFrontmatter).openstrand.kind
        : (data as Record<string, unknown>).kind;
      
      if (kind === 'Loom' || kind === 'Weave' || kind === 'Strand') {
        return kind;
      }
    }
  }
  
  // Default for .md files
  if (fileName.endsWith('.md') || fileName.endsWith('.mdx')) {
    return 'Strand';
  }
  
  return null;
}

// =============================================================================
// Migration
// =============================================================================

/**
 * Migrate old schema format to current version
 * 
 * @param data - Raw parsed data
 * @returns Migrated schema
 */
export function migrateSchema(data: Record<string, unknown>): Record<string, unknown> {
  // Handle legacy format without version
  if (!data.version) {
    // Old format: { name: '...', type: 'loom' }
    if (data.type === 'loom' || data.type === 'Loom') {
      return {
        version: '1.0',
        kind: 'Loom',
        metadata: {
          name: data.name,
          description: data.description,
          icon: data.icon,
          useCase: data.useCase,
        },
        style: data.style,
        tags: data.tags,
      };
    }
    
    if (data.type === 'weave' || data.type === 'Weave') {
      return {
        version: '1.0',
        kind: 'Weave',
        metadata: {
          name: data.name,
          domain: data.domain,
          description: data.description,
          icon: data.icon,
        },
        style: data.style,
        graph: data.graph,
      };
    }
  }
  
  return data;
}



 * YAML/Markdown Schema Parser
 * 
 * Parses YAML frontmatter and standalone YAML files into typed OpenStrand schemas.
 * Supports Loom, Weave, and Strand configurations.
 * 
 * @module lib/schema/parser
 */

import * as yaml from 'yaml';
import type {
  OpenStrandSchema,
  OpenStrandFrontmatter,
  LoomSchema,
  WeaveSchema,
  StrandSchema,
  ParseResult,
  SchemaValidationError,
  SchemaKind,
} from './types';
import { validateSchema } from './validator';

// =============================================================================
// Frontmatter Extraction
// =============================================================================

/**
 * Regex to match YAML frontmatter in Markdown
 * Matches content between --- delimiters at the start of a file
 */
const FRONTMATTER_REGEX = /^---\s*\n([\s\S]*?)\n---\s*\n?/;

/**
 * Extract YAML frontmatter from Markdown content
 * 
 * @param content - Markdown content with potential frontmatter
 * @returns Extracted frontmatter string and remaining content, or null if no frontmatter
 */
export function extractFrontmatter(content: string): {
  frontmatter: string;
  body: string;
} | null {
  const match = content.match(FRONTMATTER_REGEX);
  if (!match) return null;
  
  return {
    frontmatter: match[1],
    body: content.slice(match[0].length),
  };
}

/**
 * Check if content has YAML frontmatter
 */
export function hasFrontmatter(content: string): boolean {
  return FRONTMATTER_REGEX.test(content);
}

// =============================================================================
// YAML Parsing
// =============================================================================

/**
 * Parse YAML string to JavaScript object
 * 
 * @param yamlString - YAML content to parse
 * @returns Parsed object or null on error
 */
export function parseYaml<T = unknown>(yamlString: string): {
  data: T | null;
  error?: string;
} {
  try {
    const data = yaml.parse(yamlString) as T;
    return { data };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to parse YAML',
    };
  }
}

/**
 * Serialize object to YAML string
 * 
 * @param data - Object to serialize
 * @returns YAML string
 */
export function toYaml(data: unknown): string {
  return yaml.stringify(data, {
    indent: 2,
    lineWidth: 0, // Disable line wrapping
  });
}

// =============================================================================
// Schema Parsing
// =============================================================================

/**
 * Parse OpenStrand schema from YAML string
 * 
 * @param yamlString - YAML content
 * @returns Parse result with typed schema or errors
 */
export function parseSchema(yamlString: string): ParseResult<OpenStrandSchema> {
  const { data, error } = parseYaml<unknown>(yamlString);
  
  if (error || !data) {
    return {
      success: false,
      errors: [{ path: '', message: error || 'Failed to parse YAML' }],
    };
  }
  
  // Check if this is frontmatter format (has openstrand wrapper)
  const schemaData = isOpenStrandFrontmatter(data)
    ? (data as OpenStrandFrontmatter).openstrand
    : data;
  
  // Validate and type the schema
  return validateSchema(schemaData as Record<string, unknown>);
}

/**
 * Parse Loom schema from YAML
 */
export function parseLoomSchema(yamlString: string): ParseResult<LoomSchema> {
  const result = parseSchema(yamlString);
  
  if (!result.success || !result.data) {
    return result as ParseResult<LoomSchema>;
  }
  
  if (result.data.kind !== 'Loom') {
    return {
      success: false,
      errors: [{ path: 'kind', message: `Expected Loom schema, got ${result.data.kind}` }],
    };
  }
  
  return result as ParseResult<LoomSchema>;
}

/**
 * Parse Weave schema from YAML
 */
export function parseWeaveSchema(yamlString: string): ParseResult<WeaveSchema> {
  const result = parseSchema(yamlString);
  
  if (!result.success || !result.data) {
    return result as ParseResult<WeaveSchema>;
  }
  
  if (result.data.kind !== 'Weave') {
    return {
      success: false,
      errors: [{ path: 'kind', message: `Expected Weave schema, got ${result.data.kind}` }],
    };
  }
  
  return result as ParseResult<WeaveSchema>;
}

/**
 * Parse Strand frontmatter from Markdown
 */
export function parseStrandFrontmatter(markdown: string): ParseResult<StrandSchema> & {
  body?: string;
} {
  const extracted = extractFrontmatter(markdown);
  
  if (!extracted) {
    return {
      success: false,
      errors: [{ path: '', message: 'No frontmatter found in Markdown' }],
    };
  }
  
  const result = parseSchema(extracted.frontmatter);
  
  if (!result.success || !result.data) {
    return { ...result, body: extracted.body } as ParseResult<StrandSchema> & { body?: string };
  }
  
  if (result.data.kind !== 'Strand') {
    return {
      success: false,
      errors: [{ path: 'kind', message: `Expected Strand schema, got ${result.data.kind}` }],
      body: extracted.body,
    };
  }
  
  return { ...(result as ParseResult<StrandSchema>), body: extracted.body };
}

// =============================================================================
// Type Guards
// =============================================================================

/**
 * Check if data is OpenStrand frontmatter format
 */
function isOpenStrandFrontmatter(data: unknown): data is OpenStrandFrontmatter {
  return (
    typeof data === 'object' &&
    data !== null &&
    'openstrand' in data &&
    typeof (data as Record<string, unknown>).openstrand === 'object'
  );
}

/**
 * Type guard for Loom schema
 */
export function isLoomSchema(schema: OpenStrandSchema): schema is LoomSchema {
  return schema.kind === 'Loom';
}

/**
 * Type guard for Weave schema
 */
export function isWeaveSchema(schema: OpenStrandSchema): schema is WeaveSchema {
  return schema.kind === 'Weave';
}

/**
 * Type guard for Strand schema
 */
export function isStrandSchema(schema: OpenStrandSchema): schema is StrandSchema {
  return schema.kind === 'Strand';
}

// =============================================================================
// Serialization
// =============================================================================

/**
 * Serialize schema to YAML string
 * 
 * @param schema - OpenStrand schema to serialize
 * @param options - Serialization options
 * @returns YAML string
 */
export function serializeSchema(
  schema: OpenStrandSchema,
  options?: {
    /** Wrap in openstrand frontmatter format */
    asFrontmatter?: boolean;
    /** Include version field */
    includeVersion?: boolean;
  }
): string {
  const { asFrontmatter = false, includeVersion = true } = options ?? {};
  
  const data = includeVersion
    ? { version: '1.0', ...schema }
    : schema;
  
  if (asFrontmatter) {
    return toYaml({ openstrand: data });
  }
  
  return toYaml(data);
}

/**
 * Generate Markdown with frontmatter
 * 
 * @param schema - Strand schema for frontmatter
 * @param body - Markdown body content
 * @returns Complete Markdown with frontmatter
 */
export function generateMarkdownWithFrontmatter(
  schema: StrandSchema,
  body: string
): string {
  const frontmatter = serializeSchema(schema, { asFrontmatter: true });
  return `---\n${frontmatter}---\n\n${body}`;
}

// =============================================================================
// File Detection
// =============================================================================

/**
 * Detect schema kind from file path or content
 */
export function detectSchemaKind(
  filePath: string,
  content?: string
): SchemaKind | null {
  // Check file name
  const fileName = filePath.split('/').pop()?.toLowerCase() ?? '';
  
  if (fileName === 'loom.yaml' || fileName === 'loom.yml') {
    return 'Loom';
  }
  if (fileName === 'weave.yaml' || fileName === 'weave.yml') {
    return 'Weave';
  }
  
  // Check content if provided
  if (content) {
    const { data } = parseYaml<Record<string, unknown>>(content);
    if (data) {
      const kind = isOpenStrandFrontmatter(data)
        ? (data as OpenStrandFrontmatter).openstrand.kind
        : (data as Record<string, unknown>).kind;
      
      if (kind === 'Loom' || kind === 'Weave' || kind === 'Strand') {
        return kind;
      }
    }
  }
  
  // Default for .md files
  if (fileName.endsWith('.md') || fileName.endsWith('.mdx')) {
    return 'Strand';
  }
  
  return null;
}

// =============================================================================
// Migration
// =============================================================================

/**
 * Migrate old schema format to current version
 * 
 * @param data - Raw parsed data
 * @returns Migrated schema
 */
export function migrateSchema(data: Record<string, unknown>): Record<string, unknown> {
  // Handle legacy format without version
  if (!data.version) {
    // Old format: { name: '...', type: 'loom' }
    if (data.type === 'loom' || data.type === 'Loom') {
      return {
        version: '1.0',
        kind: 'Loom',
        metadata: {
          name: data.name,
          description: data.description,
          icon: data.icon,
          useCase: data.useCase,
        },
        style: data.style,
        tags: data.tags,
      };
    }
    
    if (data.type === 'weave' || data.type === 'Weave') {
      return {
        version: '1.0',
        kind: 'Weave',
        metadata: {
          name: data.name,
          domain: data.domain,
          description: data.description,
          icon: data.icon,
        },
        style: data.style,
        graph: data.graph,
      };
    }
  }
  
  return data;
}



