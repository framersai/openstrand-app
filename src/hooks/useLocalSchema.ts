'use client';

/**
 * React Hook for Local Schema Management
 * 
 * Provides a React-friendly interface for parsing, saving, and managing
 * Looms, Weaves, and Strands locally with the save-then-publish workflow.
 * 
 * @module hooks/useLocalSchema
 */

import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import {
  parseFile,
  serializeToFile,
  saveLocal,
  getLocal,
  getAllByType,
  getDirtyEntities,
  markPublished,
  deleteLocal,
  getStats,
  type Loom,
  type Weave,
  type Strand,
  type ParsedEntity,
  type LocalEntity,
  type LocalStorageStats,
  type EntityType,
  type ParseError,
} from '@/lib/schema';

// =============================================================================
// Types
// =============================================================================

export interface UseLocalSchemaReturn {
  // State
  isLoading: boolean;
  stats: LocalStorageStats | null;
  errors: ParseError[];
  
  // Looms
  looms: LocalEntity<Loom>[];
  loadLooms: () => Promise<void>;
  
  // Weaves
  weaves: LocalEntity<Weave>[];
  loadWeaves: () => Promise<void>;
  
  // Strands
  strands: LocalEntity<Strand>[];
  loadStrands: () => Promise<void>;
  
  // Dirty entities
  dirtyEntities: LocalEntity<unknown>[];
  loadDirtyEntities: () => Promise<void>;
  
  // Actions
  parseAndSave: (content: string, filename?: string) => Promise<ParsedEntity | null>;
  saveEntity: (entity: ParsedEntity) => Promise<LocalEntity<Loom | Weave | Strand> | null>;
  getEntity: <T>(id: string) => Promise<LocalEntity<T> | null>;
  deleteEntity: (id: string) => Promise<void>;
  publishEntity: (id: string, publishFn: (entity: LocalEntity<unknown>) => Promise<void>) => Promise<boolean>;
  publishAll: (publishFn: (entity: LocalEntity<unknown>) => Promise<void>) => Promise<{ success: number; failed: number }>;
  
  // File operations
  exportEntity: (id: string) => Promise<string | null>;
  importFile: (file: File) => Promise<ParsedEntity | null>;
  importFiles: (files: FileList) => Promise<{ imported: number; errors: string[] }>;
  
  // Utilities
  refreshStats: () => Promise<void>;
  clearAllLocal: () => Promise<void>;
}

// =============================================================================
// Hook Implementation
// =============================================================================

export function useLocalSchema(): UseLocalSchemaReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState<LocalStorageStats | null>(null);
  const [errors, setErrors] = useState<ParseError[]>([]);
  
  const [looms, setLooms] = useState<LocalEntity<Loom>[]>([]);
  const [weaves, setWeaves] = useState<LocalEntity<Weave>[]>([]);
  const [strands, setStrands] = useState<LocalEntity<Strand>[]>([]);
  const [dirtyEntities, setDirtyEntities] = useState<LocalEntity<unknown>[]>([]);
  
  // ---------------------------------------------------------------------------
  // Load Functions
  // ---------------------------------------------------------------------------
  
  const loadLooms = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getAllByType<Loom>('loom');
      setLooms(result);
    } catch (err) {
      console.error('Failed to load looms:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const loadWeaves = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getAllByType<Weave>('weave');
      setWeaves(result);
    } catch (err) {
      console.error('Failed to load weaves:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const loadStrands = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getAllByType<Strand>('strand');
      setStrands(result);
    } catch (err) {
      console.error('Failed to load strands:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const loadDirtyEntities = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getDirtyEntities();
      setDirtyEntities(result);
    } catch (err) {
      console.error('Failed to load dirty entities:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const refreshStats = useCallback(async () => {
    try {
      const result = await getStats();
      setStats(result);
    } catch (err) {
      console.error('Failed to get stats:', err);
    }
  }, []);
  
  // ---------------------------------------------------------------------------
  // Parse and Save
  // ---------------------------------------------------------------------------
  
  const parseAndSave = useCallback(async (content: string, filename?: string): Promise<ParsedEntity | null> => {
    setIsLoading(true);
    setErrors([]);
    
    try {
      const result = parseFile(content, filename);
      
      if (!result.success || !result.data) {
        setErrors(result.errors);
        for (const error of result.errors) {
          toast.error(error.message);
        }
        return null;
      }
      
      // Show warnings
      for (const warning of result.warnings) {
        toast.warning(warning.message);
      }
      
      // Save locally
      await saveLocal(result.data);
      
      toast.success(`${result.data.type} saved locally`);
      
      // Refresh lists
      await Promise.all([
        loadLooms(),
        loadWeaves(),
        loadStrands(),
        loadDirtyEntities(),
        refreshStats(),
      ]);
      
      return result.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to parse file';
      toast.error(message);
      setErrors([{ message, severity: 'error' }]);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [loadLooms, loadWeaves, loadStrands, loadDirtyEntities, refreshStats]);
  
  const saveEntity = useCallback(async (entity: ParsedEntity): Promise<LocalEntity<Loom | Weave | Strand> | null> => {
    setIsLoading(true);
    
    try {
      const result = await saveLocal(entity as ParsedEntity & { data: Loom | Weave | Strand });
      
      toast.success(`${entity.type} saved locally`);
      
      // Refresh
      await Promise.all([
        loadLooms(),
        loadWeaves(),
        loadStrands(),
        loadDirtyEntities(),
        refreshStats(),
      ]);
      
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save';
      toast.error(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [loadLooms, loadWeaves, loadStrands, loadDirtyEntities, refreshStats]);
  
  const getEntity = useCallback(async <T>(id: string): Promise<LocalEntity<T> | null> => {
    return getLocal<T>(id);
  }, []);
  
  const deleteEntity = useCallback(async (id: string): Promise<void> => {
    setIsLoading(true);
    
    try {
      await deleteLocal(id);
      toast.success('Deleted from local storage');
      
      // Refresh
      await Promise.all([
        loadLooms(),
        loadWeaves(),
        loadStrands(),
        loadDirtyEntities(),
        refreshStats(),
      ]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [loadLooms, loadWeaves, loadStrands, loadDirtyEntities, refreshStats]);
  
  // ---------------------------------------------------------------------------
  // Publish
  // ---------------------------------------------------------------------------
  
  const publishEntity = useCallback(async (
    id: string,
    publishFn: (entity: LocalEntity<unknown>) => Promise<void>
  ): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const entity = await getLocal(id);
      if (!entity) {
        toast.error('Entity not found');
        return false;
      }
      
      // Call the publish function (API call)
      await publishFn(entity);
      
      // Mark as published locally
      await markPublished(id);
      
      toast.success('Published successfully');
      
      // Refresh
      await loadDirtyEntities();
      await refreshStats();
      
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to publish';
      toast.error(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [loadDirtyEntities, refreshStats]);
  
  const publishAll = useCallback(async (
    publishFn: (entity: LocalEntity<unknown>) => Promise<void>
  ): Promise<{ success: number; failed: number }> => {
    setIsLoading(true);
    
    let success = 0;
    let failed = 0;
    
    try {
      const dirty = await getDirtyEntities();
      
      for (const entity of dirty) {
        try {
          await publishFn(entity);
          await markPublished(entity.id);
          success++;
        } catch {
          failed++;
        }
      }
      
      if (success > 0) {
        toast.success(`Published ${success} item${success > 1 ? 's' : ''}`);
      }
      if (failed > 0) {
        toast.error(`Failed to publish ${failed} item${failed > 1 ? 's' : ''}`);
      }
      
      // Refresh
      await loadDirtyEntities();
      await refreshStats();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to publish';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
    
    return { success, failed };
  }, [loadDirtyEntities, refreshStats]);
  
  // ---------------------------------------------------------------------------
  // File Operations
  // ---------------------------------------------------------------------------
  
  const exportEntity = useCallback(async (id: string): Promise<string | null> => {
    try {
      const entity = await getLocal(id);
      if (!entity) {
        toast.error('Entity not found');
        return null;
      }
      
      const content = serializeToFile({
        type: entity.type,
        data: entity.data as Loom | Weave | Strand,
        content: entity.content,
        filename: entity.filename,
      });
      
      return content;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to export';
      toast.error(message);
      return null;
    }
  }, []);
  
  const importFile = useCallback(async (file: File): Promise<ParsedEntity | null> => {
    try {
      const content = await file.text();
      return parseAndSave(content, file.name);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to read file';
      toast.error(message);
      return null;
    }
  }, [parseAndSave]);
  
  const importFiles = useCallback(async (files: FileList): Promise<{ imported: number; errors: string[] }> => {
    let imported = 0;
    const errors: string[] = [];
    
    for (const file of Array.from(files)) {
      try {
        const result = await importFile(file);
        if (result) {
          imported++;
        } else {
          errors.push(`Failed to import ${file.name}`);
        }
      } catch (err) {
        errors.push(`${file.name}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }
    
    return { imported, errors };
  }, [importFile]);
  
  // ---------------------------------------------------------------------------
  // Clear All
  // ---------------------------------------------------------------------------
  
  const clearAllLocal = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    
    try {
      const { clearAll } = await import('@/lib/schema');
      await clearAll();
      
      setLooms([]);
      setWeaves([]);
      setStrands([]);
      setDirtyEntities([]);
      setStats(null);
      
      toast.success('Cleared all local data');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to clear';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // ---------------------------------------------------------------------------
  // Initial Load
  // ---------------------------------------------------------------------------
  
  useEffect(() => {
    void refreshStats();
  }, [refreshStats]);
  
  // ---------------------------------------------------------------------------
  // Return
  // ---------------------------------------------------------------------------
  
  return {
    isLoading,
    stats,
    errors,
    
    looms,
    loadLooms,
    
    weaves,
    loadWeaves,
    
    strands,
    loadStrands,
    
    dirtyEntities,
    loadDirtyEntities,
    
    parseAndSave,
    saveEntity,
    getEntity,
    deleteEntity,
    publishEntity,
    publishAll,
    
    exportEntity,
    importFile,
    importFiles,
    
    refreshStats,
    clearAllLocal,
  };
}

export default useLocalSchema;




/**
 * React Hook for Local Schema Management
 * 
 * Provides a React-friendly interface for parsing, saving, and managing
 * Looms, Weaves, and Strands locally with the save-then-publish workflow.
 * 
 * @module hooks/useLocalSchema
 */

import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import {
  parseFile,
  serializeToFile,
  saveLocal,
  getLocal,
  getAllByType,
  getDirtyEntities,
  markPublished,
  deleteLocal,
  getStats,
  type Loom,
  type Weave,
  type Strand,
  type ParsedEntity,
  type LocalEntity,
  type LocalStorageStats,
  type EntityType,
  type ParseError,
} from '@/lib/schema';

// =============================================================================
// Types
// =============================================================================

export interface UseLocalSchemaReturn {
  // State
  isLoading: boolean;
  stats: LocalStorageStats | null;
  errors: ParseError[];
  
  // Looms
  looms: LocalEntity<Loom>[];
  loadLooms: () => Promise<void>;
  
  // Weaves
  weaves: LocalEntity<Weave>[];
  loadWeaves: () => Promise<void>;
  
  // Strands
  strands: LocalEntity<Strand>[];
  loadStrands: () => Promise<void>;
  
  // Dirty entities
  dirtyEntities: LocalEntity<unknown>[];
  loadDirtyEntities: () => Promise<void>;
  
  // Actions
  parseAndSave: (content: string, filename?: string) => Promise<ParsedEntity | null>;
  saveEntity: (entity: ParsedEntity) => Promise<LocalEntity<Loom | Weave | Strand> | null>;
  getEntity: <T>(id: string) => Promise<LocalEntity<T> | null>;
  deleteEntity: (id: string) => Promise<void>;
  publishEntity: (id: string, publishFn: (entity: LocalEntity<unknown>) => Promise<void>) => Promise<boolean>;
  publishAll: (publishFn: (entity: LocalEntity<unknown>) => Promise<void>) => Promise<{ success: number; failed: number }>;
  
  // File operations
  exportEntity: (id: string) => Promise<string | null>;
  importFile: (file: File) => Promise<ParsedEntity | null>;
  importFiles: (files: FileList) => Promise<{ imported: number; errors: string[] }>;
  
  // Utilities
  refreshStats: () => Promise<void>;
  clearAllLocal: () => Promise<void>;
}

// =============================================================================
// Hook Implementation
// =============================================================================

export function useLocalSchema(): UseLocalSchemaReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState<LocalStorageStats | null>(null);
  const [errors, setErrors] = useState<ParseError[]>([]);
  
  const [looms, setLooms] = useState<LocalEntity<Loom>[]>([]);
  const [weaves, setWeaves] = useState<LocalEntity<Weave>[]>([]);
  const [strands, setStrands] = useState<LocalEntity<Strand>[]>([]);
  const [dirtyEntities, setDirtyEntities] = useState<LocalEntity<unknown>[]>([]);
  
  // ---------------------------------------------------------------------------
  // Load Functions
  // ---------------------------------------------------------------------------
  
  const loadLooms = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getAllByType<Loom>('loom');
      setLooms(result);
    } catch (err) {
      console.error('Failed to load looms:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const loadWeaves = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getAllByType<Weave>('weave');
      setWeaves(result);
    } catch (err) {
      console.error('Failed to load weaves:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const loadStrands = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getAllByType<Strand>('strand');
      setStrands(result);
    } catch (err) {
      console.error('Failed to load strands:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const loadDirtyEntities = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getDirtyEntities();
      setDirtyEntities(result);
    } catch (err) {
      console.error('Failed to load dirty entities:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const refreshStats = useCallback(async () => {
    try {
      const result = await getStats();
      setStats(result);
    } catch (err) {
      console.error('Failed to get stats:', err);
    }
  }, []);
  
  // ---------------------------------------------------------------------------
  // Parse and Save
  // ---------------------------------------------------------------------------
  
  const parseAndSave = useCallback(async (content: string, filename?: string): Promise<ParsedEntity | null> => {
    setIsLoading(true);
    setErrors([]);
    
    try {
      const result = parseFile(content, filename);
      
      if (!result.success || !result.data) {
        setErrors(result.errors);
        for (const error of result.errors) {
          toast.error(error.message);
        }
        return null;
      }
      
      // Show warnings
      for (const warning of result.warnings) {
        toast.warning(warning.message);
      }
      
      // Save locally
      await saveLocal(result.data);
      
      toast.success(`${result.data.type} saved locally`);
      
      // Refresh lists
      await Promise.all([
        loadLooms(),
        loadWeaves(),
        loadStrands(),
        loadDirtyEntities(),
        refreshStats(),
      ]);
      
      return result.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to parse file';
      toast.error(message);
      setErrors([{ message, severity: 'error' }]);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [loadLooms, loadWeaves, loadStrands, loadDirtyEntities, refreshStats]);
  
  const saveEntity = useCallback(async (entity: ParsedEntity): Promise<LocalEntity<Loom | Weave | Strand> | null> => {
    setIsLoading(true);
    
    try {
      const result = await saveLocal(entity as ParsedEntity & { data: Loom | Weave | Strand });
      
      toast.success(`${entity.type} saved locally`);
      
      // Refresh
      await Promise.all([
        loadLooms(),
        loadWeaves(),
        loadStrands(),
        loadDirtyEntities(),
        refreshStats(),
      ]);
      
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save';
      toast.error(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [loadLooms, loadWeaves, loadStrands, loadDirtyEntities, refreshStats]);
  
  const getEntity = useCallback(async <T>(id: string): Promise<LocalEntity<T> | null> => {
    return getLocal<T>(id);
  }, []);
  
  const deleteEntity = useCallback(async (id: string): Promise<void> => {
    setIsLoading(true);
    
    try {
      await deleteLocal(id);
      toast.success('Deleted from local storage');
      
      // Refresh
      await Promise.all([
        loadLooms(),
        loadWeaves(),
        loadStrands(),
        loadDirtyEntities(),
        refreshStats(),
      ]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [loadLooms, loadWeaves, loadStrands, loadDirtyEntities, refreshStats]);
  
  // ---------------------------------------------------------------------------
  // Publish
  // ---------------------------------------------------------------------------
  
  const publishEntity = useCallback(async (
    id: string,
    publishFn: (entity: LocalEntity<unknown>) => Promise<void>
  ): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const entity = await getLocal(id);
      if (!entity) {
        toast.error('Entity not found');
        return false;
      }
      
      // Call the publish function (API call)
      await publishFn(entity);
      
      // Mark as published locally
      await markPublished(id);
      
      toast.success('Published successfully');
      
      // Refresh
      await loadDirtyEntities();
      await refreshStats();
      
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to publish';
      toast.error(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [loadDirtyEntities, refreshStats]);
  
  const publishAll = useCallback(async (
    publishFn: (entity: LocalEntity<unknown>) => Promise<void>
  ): Promise<{ success: number; failed: number }> => {
    setIsLoading(true);
    
    let success = 0;
    let failed = 0;
    
    try {
      const dirty = await getDirtyEntities();
      
      for (const entity of dirty) {
        try {
          await publishFn(entity);
          await markPublished(entity.id);
          success++;
        } catch {
          failed++;
        }
      }
      
      if (success > 0) {
        toast.success(`Published ${success} item${success > 1 ? 's' : ''}`);
      }
      if (failed > 0) {
        toast.error(`Failed to publish ${failed} item${failed > 1 ? 's' : ''}`);
      }
      
      // Refresh
      await loadDirtyEntities();
      await refreshStats();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to publish';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
    
    return { success, failed };
  }, [loadDirtyEntities, refreshStats]);
  
  // ---------------------------------------------------------------------------
  // File Operations
  // ---------------------------------------------------------------------------
  
  const exportEntity = useCallback(async (id: string): Promise<string | null> => {
    try {
      const entity = await getLocal(id);
      if (!entity) {
        toast.error('Entity not found');
        return null;
      }
      
      const content = serializeToFile({
        type: entity.type,
        data: entity.data as Loom | Weave | Strand,
        content: entity.content,
        filename: entity.filename,
      });
      
      return content;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to export';
      toast.error(message);
      return null;
    }
  }, []);
  
  const importFile = useCallback(async (file: File): Promise<ParsedEntity | null> => {
    try {
      const content = await file.text();
      return parseAndSave(content, file.name);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to read file';
      toast.error(message);
      return null;
    }
  }, [parseAndSave]);
  
  const importFiles = useCallback(async (files: FileList): Promise<{ imported: number; errors: string[] }> => {
    let imported = 0;
    const errors: string[] = [];
    
    for (const file of Array.from(files)) {
      try {
        const result = await importFile(file);
        if (result) {
          imported++;
        } else {
          errors.push(`Failed to import ${file.name}`);
        }
      } catch (err) {
        errors.push(`${file.name}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }
    
    return { imported, errors };
  }, [importFile]);
  
  // ---------------------------------------------------------------------------
  // Clear All
  // ---------------------------------------------------------------------------
  
  const clearAllLocal = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    
    try {
      const { clearAll } = await import('@/lib/schema');
      await clearAll();
      
      setLooms([]);
      setWeaves([]);
      setStrands([]);
      setDirtyEntities([]);
      setStats(null);
      
      toast.success('Cleared all local data');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to clear';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // ---------------------------------------------------------------------------
  // Initial Load
  // ---------------------------------------------------------------------------
  
  useEffect(() => {
    void refreshStats();
  }, [refreshStats]);
  
  // ---------------------------------------------------------------------------
  // Return
  // ---------------------------------------------------------------------------
  
  return {
    isLoading,
    stats,
    errors,
    
    looms,
    loadLooms,
    
    weaves,
    loadWeaves,
    
    strands,
    loadStrands,
    
    dirtyEntities,
    loadDirtyEntities,
    
    parseAndSave,
    saveEntity,
    getEntity,
    deleteEntity,
    publishEntity,
    publishAll,
    
    exportEntity,
    importFile,
    importFiles,
    
    refreshStats,
    clearAllLocal,
  };
}

export default useLocalSchema;



