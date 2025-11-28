/**
 * Local Schema Storage Service
 * 
 * Manages local persistence of Loom and Weave schemas using IndexedDB.
 * Supports offline editing with a save-then-publish workflow.
 * 
 * @module lib/schema/local-storage
 */

import type {
  OpenStrandSchema,
  LoomSchema,
  WeaveSchema,
  LocalSavedSchema,
  LocalSaveMetadata,
  SaveState,
  SchemaKind,
} from './types';

// =============================================================================
// IndexedDB Setup
// =============================================================================

const DB_NAME = 'openstrand-schemas';
const DB_VERSION = 1;
const STORE_NAME = 'schemas';

let dbPromise: Promise<IDBDatabase> | null = null;

/**
 * Open IndexedDB connection
 */
function openDatabase(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => {
      reject(new Error('Failed to open IndexedDB'));
    };
    
    request.onsuccess = () => {
      resolve(request.result);
    };
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'meta.id' });
        store.createIndex('kind', 'meta.kind', { unique: false });
        store.createIndex('state', 'meta.state', { unique: false });
        store.createIndex('savedAt', 'meta.savedAt', { unique: false });
      }
    };
  });
  
  return dbPromise;
}

/**
 * Get object store for transactions
 */
async function getStore(mode: IDBTransactionMode): Promise<IDBObjectStore> {
  const db = await openDatabase();
  const transaction = db.transaction(STORE_NAME, mode);
  return transaction.objectStore(STORE_NAME);
}

// =============================================================================
// Checksum Calculation
// =============================================================================

/**
 * Calculate a simple checksum for change detection
 */
function calculateChecksum(schema: OpenStrandSchema): string {
  const json = JSON.stringify(schema);
  let hash = 0;
  for (let i = 0; i < json.length; i++) {
    const char = json.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString(16);
}

// =============================================================================
// Save Operations
// =============================================================================

/**
 * Save a schema locally
 * 
 * @param id - Unique identifier for the schema
 * @param schema - The schema to save
 * @param options - Save options
 * @returns The saved schema with metadata
 */
export async function saveSchemaLocally<T extends OpenStrandSchema>(
  id: string,
  schema: T,
  options?: {
    /** Mark as pending publication */
    markPending?: boolean;
    /** Original schema for diff comparison */
    original?: T;
  }
): Promise<LocalSavedSchema<T>> {
  const store = await getStore('readwrite');
  
  const now = new Date().toISOString();
  const checksum = calculateChecksum(schema);
  
  // Check if this is an update to existing
  const existing = await getSchemaById<T>(id);
  
  const meta: LocalSaveMetadata = {
    id,
    kind: schema.kind,
    state: options?.markPending ? 'pending' : 'saved',
    savedAt: now,
    publishedAt: existing?.meta.publishedAt,
    checksum,
  };
  
  const savedSchema: LocalSavedSchema<T> = {
    schema,
    meta,
    original: options?.original ?? existing?.original,
  };
  
  return new Promise((resolve, reject) => {
    const request = store.put(savedSchema);
    
    request.onsuccess = () => {
      resolve(savedSchema);
    };
    
    request.onerror = () => {
      reject(new Error('Failed to save schema'));
    };
  });
}

/**
 * Save a Loom schema locally
 */
export async function saveLoomLocally(
  id: string,
  schema: LoomSchema,
  options?: { markPending?: boolean; original?: LoomSchema }
): Promise<LocalSavedSchema<LoomSchema>> {
  return saveSchemaLocally(id, schema, options);
}

/**
 * Save a Weave schema locally
 */
export async function saveWeaveLocally(
  id: string,
  schema: WeaveSchema,
  options?: { markPending?: boolean; original?: WeaveSchema }
): Promise<LocalSavedSchema<WeaveSchema>> {
  return saveSchemaLocally(id, schema, options);
}

// =============================================================================
// Read Operations
// =============================================================================

/**
 * Get a schema by ID
 */
export async function getSchemaById<T extends OpenStrandSchema>(
  id: string
): Promise<LocalSavedSchema<T> | null> {
  const store = await getStore('readonly');
  
  return new Promise((resolve, reject) => {
    const request = store.get(id);
    
    request.onsuccess = () => {
      resolve(request.result ?? null);
    };
    
    request.onerror = () => {
      reject(new Error('Failed to get schema'));
    };
  });
}

/**
 * Get all schemas of a specific kind
 */
export async function getSchemasByKind<T extends OpenStrandSchema>(
  kind: SchemaKind
): Promise<LocalSavedSchema<T>[]> {
  const store = await getStore('readonly');
  const index = store.index('kind');
  
  return new Promise((resolve, reject) => {
    const request = index.getAll(kind);
    
    request.onsuccess = () => {
      resolve(request.result ?? []);
    };
    
    request.onerror = () => {
      reject(new Error('Failed to get schemas'));
    };
  });
}

/**
 * Get all Loom schemas
 */
export async function getAllLooms(): Promise<LocalSavedSchema<LoomSchema>[]> {
  return getSchemasByKind<LoomSchema>('Loom');
}

/**
 * Get all Weave schemas
 */
export async function getAllWeaves(): Promise<LocalSavedSchema<WeaveSchema>[]> {
  return getSchemasByKind<WeaveSchema>('Weave');
}

/**
 * Get all schemas with pending changes
 */
export async function getPendingSchemas(): Promise<LocalSavedSchema[]> {
  const store = await getStore('readonly');
  const index = store.index('state');
  
  return new Promise((resolve, reject) => {
    const request = index.getAll('pending');
    
    request.onsuccess = () => {
      resolve(request.result ?? []);
    };
    
    request.onerror = () => {
      reject(new Error('Failed to get pending schemas'));
    };
  });
}

// =============================================================================
// State Management
// =============================================================================

/**
 * Mark a schema as published
 */
export async function markAsPublished(id: string): Promise<void> {
  const existing = await getSchemaById(id);
  if (!existing) {
    throw new Error(`Schema ${id} not found`);
  }
  
  const store = await getStore('readwrite');
  const now = new Date().toISOString();
  
  const updated: LocalSavedSchema = {
    ...existing,
    meta: {
      ...existing.meta,
      state: 'published',
      publishedAt: now,
    },
    original: existing.schema, // Update original to current
  };
  
  return new Promise((resolve, reject) => {
    const request = store.put(updated);
    
    request.onsuccess = () => {
      resolve();
    };
    
    request.onerror = () => {
      reject(new Error('Failed to update schema state'));
    };
  });
}

/**
 * Mark a schema as having conflicts
 */
export async function markAsConflict(id: string): Promise<void> {
  const existing = await getSchemaById(id);
  if (!existing) {
    throw new Error(`Schema ${id} not found`);
  }
  
  const store = await getStore('readwrite');
  
  const updated: LocalSavedSchema = {
    ...existing,
    meta: {
      ...existing.meta,
      state: 'conflict',
    },
  };
  
  return new Promise((resolve, reject) => {
    const request = store.put(updated);
    
    request.onsuccess = () => {
      resolve();
    };
    
    request.onerror = () => {
      reject(new Error('Failed to update schema state'));
    };
  });
}

// =============================================================================
// Delete Operations
// =============================================================================

/**
 * Delete a schema by ID
 */
export async function deleteSchema(id: string): Promise<void> {
  const store = await getStore('readwrite');
  
  return new Promise((resolve, reject) => {
    const request = store.delete(id);
    
    request.onsuccess = () => {
      resolve();
    };
    
    request.onerror = () => {
      reject(new Error('Failed to delete schema'));
    };
  });
}

/**
 * Clear all local schemas
 */
export async function clearAllSchemas(): Promise<void> {
  const store = await getStore('readwrite');
  
  return new Promise((resolve, reject) => {
    const request = store.clear();
    
    request.onsuccess = () => {
      resolve();
    };
    
    request.onerror = () => {
      reject(new Error('Failed to clear schemas'));
    };
  });
}

// =============================================================================
// Change Detection
// =============================================================================

/**
 * Check if a schema has unsaved changes
 */
export async function hasUnsavedChanges(id: string): Promise<boolean> {
  const saved = await getSchemaById(id);
  if (!saved) return false;
  
  return saved.meta.state === 'pending' || saved.meta.state === 'draft';
}

/**
 * Check if a schema has unpublished changes
 */
export async function hasUnpublishedChanges(id: string): Promise<boolean> {
  const saved = await getSchemaById(id);
  if (!saved) return false;
  
  if (!saved.original) return true; // Never published
  
  const currentChecksum = calculateChecksum(saved.schema);
  const originalChecksum = calculateChecksum(saved.original);
  
  return currentChecksum !== originalChecksum;
}

/**
 * Get the diff between current and original schema
 */
export async function getSchemaDiff(id: string): Promise<{
  current: OpenStrandSchema;
  original: OpenStrandSchema | null;
  hasChanges: boolean;
} | null> {
  const saved = await getSchemaById(id);
  if (!saved) return null;
  
  const hasChanges = saved.original
    ? calculateChecksum(saved.schema) !== calculateChecksum(saved.original)
    : true;
  
  return {
    current: saved.schema,
    original: saved.original ?? null,
    hasChanges,
  };
}

// =============================================================================
// Export/Import
// =============================================================================

/**
 * Export all local schemas as JSON
 */
export async function exportAllSchemas(): Promise<string> {
  const store = await getStore('readonly');
  
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    
    request.onsuccess = () => {
      const data = {
        exportedAt: new Date().toISOString(),
        version: '1.0',
        schemas: request.result ?? [],
      };
      resolve(JSON.stringify(data, null, 2));
    };
    
    request.onerror = () => {
      reject(new Error('Failed to export schemas'));
    };
  });
}

/**
 * Import schemas from JSON export
 */
export async function importSchemas(json: string): Promise<number> {
  const data = JSON.parse(json);
  
  if (!data.schemas || !Array.isArray(data.schemas)) {
    throw new Error('Invalid import format');
  }
  
  const store = await getStore('readwrite');
  let imported = 0;
  
  for (const schema of data.schemas) {
    await new Promise<void>((resolve, reject) => {
      const request = store.put(schema);
      request.onsuccess = () => {
        imported++;
        resolve();
      };
      request.onerror = () => reject(new Error('Failed to import schema'));
    });
  }
  
  return imported;
}

 * 
 * Manages local persistence of Loom and Weave schemas using IndexedDB.
 * Supports offline editing with a save-then-publish workflow.
 * 
 * @module lib/schema/local-storage
 */

import type {
  OpenStrandSchema,
  LoomSchema,
  WeaveSchema,
  LocalSavedSchema,
  LocalSaveMetadata,
  SaveState,
  SchemaKind,
} from './types';

// =============================================================================
// IndexedDB Setup
// =============================================================================

const DB_NAME = 'openstrand-schemas';
const DB_VERSION = 1;
const STORE_NAME = 'schemas';

let dbPromise: Promise<IDBDatabase> | null = null;

/**
 * Open IndexedDB connection
 */
function openDatabase(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => {
      reject(new Error('Failed to open IndexedDB'));
    };
    
    request.onsuccess = () => {
      resolve(request.result);
    };
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'meta.id' });
        store.createIndex('kind', 'meta.kind', { unique: false });
        store.createIndex('state', 'meta.state', { unique: false });
        store.createIndex('savedAt', 'meta.savedAt', { unique: false });
      }
    };
  });
  
  return dbPromise;
}

/**
 * Get object store for transactions
 */
async function getStore(mode: IDBTransactionMode): Promise<IDBObjectStore> {
  const db = await openDatabase();
  const transaction = db.transaction(STORE_NAME, mode);
  return transaction.objectStore(STORE_NAME);
}

// =============================================================================
// Checksum Calculation
// =============================================================================

/**
 * Calculate a simple checksum for change detection
 */
function calculateChecksum(schema: OpenStrandSchema): string {
  const json = JSON.stringify(schema);
  let hash = 0;
  for (let i = 0; i < json.length; i++) {
    const char = json.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString(16);
}

// =============================================================================
// Save Operations
// =============================================================================

/**
 * Save a schema locally
 * 
 * @param id - Unique identifier for the schema
 * @param schema - The schema to save
 * @param options - Save options
 * @returns The saved schema with metadata
 */
export async function saveSchemaLocally<T extends OpenStrandSchema>(
  id: string,
  schema: T,
  options?: {
    /** Mark as pending publication */
    markPending?: boolean;
    /** Original schema for diff comparison */
    original?: T;
  }
): Promise<LocalSavedSchema<T>> {
  const store = await getStore('readwrite');
  
  const now = new Date().toISOString();
  const checksum = calculateChecksum(schema);
  
  // Check if this is an update to existing
  const existing = await getSchemaById<T>(id);
  
  const meta: LocalSaveMetadata = {
    id,
    kind: schema.kind,
    state: options?.markPending ? 'pending' : 'saved',
    savedAt: now,
    publishedAt: existing?.meta.publishedAt,
    checksum,
  };
  
  const savedSchema: LocalSavedSchema<T> = {
    schema,
    meta,
    original: options?.original ?? existing?.original,
  };
  
  return new Promise((resolve, reject) => {
    const request = store.put(savedSchema);
    
    request.onsuccess = () => {
      resolve(savedSchema);
    };
    
    request.onerror = () => {
      reject(new Error('Failed to save schema'));
    };
  });
}

/**
 * Save a Loom schema locally
 */
export async function saveLoomLocally(
  id: string,
  schema: LoomSchema,
  options?: { markPending?: boolean; original?: LoomSchema }
): Promise<LocalSavedSchema<LoomSchema>> {
  return saveSchemaLocally(id, schema, options);
}

/**
 * Save a Weave schema locally
 */
export async function saveWeaveLocally(
  id: string,
  schema: WeaveSchema,
  options?: { markPending?: boolean; original?: WeaveSchema }
): Promise<LocalSavedSchema<WeaveSchema>> {
  return saveSchemaLocally(id, schema, options);
}

// =============================================================================
// Read Operations
// =============================================================================

/**
 * Get a schema by ID
 */
export async function getSchemaById<T extends OpenStrandSchema>(
  id: string
): Promise<LocalSavedSchema<T> | null> {
  const store = await getStore('readonly');
  
  return new Promise((resolve, reject) => {
    const request = store.get(id);
    
    request.onsuccess = () => {
      resolve(request.result ?? null);
    };
    
    request.onerror = () => {
      reject(new Error('Failed to get schema'));
    };
  });
}

/**
 * Get all schemas of a specific kind
 */
export async function getSchemasByKind<T extends OpenStrandSchema>(
  kind: SchemaKind
): Promise<LocalSavedSchema<T>[]> {
  const store = await getStore('readonly');
  const index = store.index('kind');
  
  return new Promise((resolve, reject) => {
    const request = index.getAll(kind);
    
    request.onsuccess = () => {
      resolve(request.result ?? []);
    };
    
    request.onerror = () => {
      reject(new Error('Failed to get schemas'));
    };
  });
}

/**
 * Get all Loom schemas
 */
export async function getAllLooms(): Promise<LocalSavedSchema<LoomSchema>[]> {
  return getSchemasByKind<LoomSchema>('Loom');
}

/**
 * Get all Weave schemas
 */
export async function getAllWeaves(): Promise<LocalSavedSchema<WeaveSchema>[]> {
  return getSchemasByKind<WeaveSchema>('Weave');
}

/**
 * Get all schemas with pending changes
 */
export async function getPendingSchemas(): Promise<LocalSavedSchema[]> {
  const store = await getStore('readonly');
  const index = store.index('state');
  
  return new Promise((resolve, reject) => {
    const request = index.getAll('pending');
    
    request.onsuccess = () => {
      resolve(request.result ?? []);
    };
    
    request.onerror = () => {
      reject(new Error('Failed to get pending schemas'));
    };
  });
}

// =============================================================================
// State Management
// =============================================================================

/**
 * Mark a schema as published
 */
export async function markAsPublished(id: string): Promise<void> {
  const existing = await getSchemaById(id);
  if (!existing) {
    throw new Error(`Schema ${id} not found`);
  }
  
  const store = await getStore('readwrite');
  const now = new Date().toISOString();
  
  const updated: LocalSavedSchema = {
    ...existing,
    meta: {
      ...existing.meta,
      state: 'published',
      publishedAt: now,
    },
    original: existing.schema, // Update original to current
  };
  
  return new Promise((resolve, reject) => {
    const request = store.put(updated);
    
    request.onsuccess = () => {
      resolve();
    };
    
    request.onerror = () => {
      reject(new Error('Failed to update schema state'));
    };
  });
}

/**
 * Mark a schema as having conflicts
 */
export async function markAsConflict(id: string): Promise<void> {
  const existing = await getSchemaById(id);
  if (!existing) {
    throw new Error(`Schema ${id} not found`);
  }
  
  const store = await getStore('readwrite');
  
  const updated: LocalSavedSchema = {
    ...existing,
    meta: {
      ...existing.meta,
      state: 'conflict',
    },
  };
  
  return new Promise((resolve, reject) => {
    const request = store.put(updated);
    
    request.onsuccess = () => {
      resolve();
    };
    
    request.onerror = () => {
      reject(new Error('Failed to update schema state'));
    };
  });
}

// =============================================================================
// Delete Operations
// =============================================================================

/**
 * Delete a schema by ID
 */
export async function deleteSchema(id: string): Promise<void> {
  const store = await getStore('readwrite');
  
  return new Promise((resolve, reject) => {
    const request = store.delete(id);
    
    request.onsuccess = () => {
      resolve();
    };
    
    request.onerror = () => {
      reject(new Error('Failed to delete schema'));
    };
  });
}

/**
 * Clear all local schemas
 */
export async function clearAllSchemas(): Promise<void> {
  const store = await getStore('readwrite');
  
  return new Promise((resolve, reject) => {
    const request = store.clear();
    
    request.onsuccess = () => {
      resolve();
    };
    
    request.onerror = () => {
      reject(new Error('Failed to clear schemas'));
    };
  });
}

// =============================================================================
// Change Detection
// =============================================================================

/**
 * Check if a schema has unsaved changes
 */
export async function hasUnsavedChanges(id: string): Promise<boolean> {
  const saved = await getSchemaById(id);
  if (!saved) return false;
  
  return saved.meta.state === 'pending' || saved.meta.state === 'draft';
}

/**
 * Check if a schema has unpublished changes
 */
export async function hasUnpublishedChanges(id: string): Promise<boolean> {
  const saved = await getSchemaById(id);
  if (!saved) return false;
  
  if (!saved.original) return true; // Never published
  
  const currentChecksum = calculateChecksum(saved.schema);
  const originalChecksum = calculateChecksum(saved.original);
  
  return currentChecksum !== originalChecksum;
}

/**
 * Get the diff between current and original schema
 */
export async function getSchemaDiff(id: string): Promise<{
  current: OpenStrandSchema;
  original: OpenStrandSchema | null;
  hasChanges: boolean;
} | null> {
  const saved = await getSchemaById(id);
  if (!saved) return null;
  
  const hasChanges = saved.original
    ? calculateChecksum(saved.schema) !== calculateChecksum(saved.original)
    : true;
  
  return {
    current: saved.schema,
    original: saved.original ?? null,
    hasChanges,
  };
}

// =============================================================================
// Export/Import
// =============================================================================

/**
 * Export all local schemas as JSON
 */
export async function exportAllSchemas(): Promise<string> {
  const store = await getStore('readonly');
  
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    
    request.onsuccess = () => {
      const data = {
        exportedAt: new Date().toISOString(),
        version: '1.0',
        schemas: request.result ?? [],
      };
      resolve(JSON.stringify(data, null, 2));
    };
    
    request.onerror = () => {
      reject(new Error('Failed to export schemas'));
    };
  });
}

/**
 * Import schemas from JSON export
 */
export async function importSchemas(json: string): Promise<number> {
  const data = JSON.parse(json);
  
  if (!data.schemas || !Array.isArray(data.schemas)) {
    throw new Error('Invalid import format');
  }
  
  const store = await getStore('readwrite');
  let imported = 0;
  
  for (const schema of data.schemas) {
    await new Promise<void>((resolve, reject) => {
      const request = store.put(schema);
      request.onsuccess = () => {
        imported++;
        resolve();
      };
      request.onerror = () => reject(new Error('Failed to import schema'));
    });
  }
  
  return imported;
}
