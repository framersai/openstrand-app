/**
 * @module store/dataset-store
 * @description Zustand store for managing dataset state.
 * Handles dataset upload, metadata, and data operations.
 * Persists last used dataset info to localStorage.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { DatasetMetadata, DataRow } from '@/types';

interface DatasetInfo {
  /** Unique dataset identifier */
  id: string;
  /** Original file - not persisted */
  file: File | null;
  /** Dataset metadata */
  metadata: DatasetMetadata;
}

/** Serializable version for persistence */
interface PersistedDatasetInfo {
  id: string;
  metadata: DatasetMetadata;
}

interface DatasetStore {
  /** Current active dataset */
  dataset: DatasetInfo | null;
  
  /** Dataset metadata */
  metadata: DatasetMetadata | null;
  
  /** Cached data rows - not persisted */
  dataCache: DataRow[] | null;
  
  /** Last used dataset info for restoration */
  lastDatasetInfo: PersistedDatasetInfo | null;
  
  /** Set the active dataset */
  setDataset: (dataset: DatasetInfo) => void;
  
  /** Clear dataset */
  clearDataset: () => void;
  
  /** Update metadata */
  updateMetadata: (metadata: Partial<DatasetMetadata>) => void;
  
  /** Cache data rows */
  setCacheData: (data: DataRow[]) => void;
  
  /** Get column names */
  getColumns: () => string[];
  
  /** Get column type */
  getColumnType: (column: string) => string | undefined;
  
  /** Restore last dataset (call on mount) */
  restoreLastDataset: () => PersistedDatasetInfo | null;
}

/**
 * Create the dataset store with persistence
 */
export const useDatasetStore = create<DatasetStore>()(
  persist(
    (set, get) => ({
      dataset: null,
      metadata: null,
      dataCache: null,
      lastDatasetInfo: null,
      
      setDataset: (dataset) => {
        const persistedInfo: PersistedDatasetInfo = {
          id: dataset.id,
          metadata: dataset.metadata,
        };
        set({
          dataset,
          metadata: dataset.metadata,
          dataCache: null, // Clear cache when new dataset is loaded
          lastDatasetInfo: persistedInfo,
        });
      },
      
      clearDataset: () => {
        set({
          dataset: null,
          metadata: null,
          dataCache: null,
          // Keep lastDatasetInfo so user can restore
        });
      },
      
      updateMetadata: (updates) => {
        set((state) => {
          const newMetadata = state.metadata
            ? { ...state.metadata, ...updates }
            : null;
          
          // Also update lastDatasetInfo if we have one
          const newLastInfo = state.lastDatasetInfo && newMetadata
            ? { ...state.lastDatasetInfo, metadata: newMetadata }
            : state.lastDatasetInfo;
            
          return {
            metadata: newMetadata,
            lastDatasetInfo: newLastInfo,
          };
        });
      },
      
      setCacheData: (data) => {
        set({ dataCache: data });
      },
      
      getColumns: () => {
        const { metadata } = get();
        return metadata?.columns || [];
      },
      
      getColumnType: (column) => {
        const { metadata } = get();
        return metadata?.columnTypes[column];
      },
      
      restoreLastDataset: () => {
        const { lastDatasetInfo } = get();
        return lastDatasetInfo;
      },
    }),
    {
      name: 'openstrand-dataset-store',
      storage: createJSONStorage(() => localStorage),
      // Only persist these fields
      partialize: (state) => ({
        lastDatasetInfo: state.lastDatasetInfo,
      }),
    }
  )
);
