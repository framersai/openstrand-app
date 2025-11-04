/**
 * @module store/dataset-store
 * @description Zustand store for managing dataset state.
 * Handles dataset upload, metadata, and data operations.
 */

import { create } from 'zustand';
import type { DatasetMetadata, DataRow } from '@/types';

interface DatasetInfo {
  /** Unique dataset identifier */
  id: string;
  /** Original file */
  file: File | null;
  /** Dataset metadata */
  metadata: DatasetMetadata;
}

interface DatasetStore {
  /** Current active dataset */
  dataset: DatasetInfo | null;
  
  /** Dataset metadata */
  metadata: DatasetMetadata | null;
  
  /** Cached data rows */
  dataCache: DataRow[] | null;
  
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
}

/**
 * Create the dataset store
 */
export const useDatasetStore = create<DatasetStore>((set, get) => ({
  dataset: null,
  metadata: null,
  dataCache: null,
  
  setDataset: (dataset) => {
    set({
      dataset,
      metadata: dataset.metadata,
      dataCache: null, // Clear cache when new dataset is loaded
    });
  },
  
  clearDataset: () => {
    set({
      dataset: null,
      metadata: null,
      dataCache: null,
    });
  },
  
  updateMetadata: (updates) => {
    set((state) => ({
      metadata: state.metadata
        ? { ...state.metadata, ...updates }
        : null,
    }));
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
}));
