/**
 * OpenStrand Cross-Platform Storage Service
 * Provides unified storage API for web, iOS, Android, and desktop
 */

import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';

export interface Strand {
  id: string;
  type: 'dataset' | 'document' | 'visualization' | 'note' | 'media' | 'exercise';
  title: string;
  slug: string;
  summary: string;
  contentType: string;
  created: Date;
  modified: Date;

  // Educational metadata (optional)
  learningObjectives?: string[];
  difficulty?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  prerequisites?: { id: string; level: string }[];
  spiralStage?: number;
  scaffoldVariants?: any[];

  // Visualization metadata
  vizConfig?: {
    type: 'chart' | 'd3' | 'three' | 'ai_artisan';
    spec: any;
    dataSource?: string;
  };

  // Content storage
  content?: {
    markdown?: string;
    data?: any;
    html?: string;
    media?: any;
  };

  // Relationships
  relationships: {
    targetId: string;
    type: 'prerequisite' | 'related' | 'part-of' | 'references' | 'visualizes';
    weight?: number;
  }[];
}

export interface WeaveGraph {
  nodes: Strand[];
  edges: {
    source: string;
    target: string;
    type: string;
    weight: number;
  }[];
  metrics?: {
    centrality: Record<string, number>;
    betweenness: Record<string, number>;
    communities: string[][];
  };
}

class PlatformStorageService {
  private readonly isCapacitor: boolean;
  private indexedDB?: IDBDatabase;

  constructor() {
    this.isCapacitor = Capacitor.isNativePlatform();
    this.initializeStorage();
  }

  private async initializeStorage() {
    if (!this.isCapacitor) {
      // Initialize IndexedDB for web
      await this.initIndexedDB();
    } else {
      // Create necessary directories for native platforms
      await this.createDirectories();
    }
  }

  private async initIndexedDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('OpenStrandDB', 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.indexedDB = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores
        if (!db.objectStoreNames.contains('strands')) {
          const strandStore = db.createObjectStore('strands', { keyPath: 'id' });
          strandStore.createIndex('type', 'type', { unique: false });
          strandStore.createIndex('created', 'created', { unique: false });
        }

        if (!db.objectStoreNames.contains('weaves')) {
          db.createObjectStore('weaves', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('progress')) {
          db.createObjectStore('progress', { keyPath: 'userId' });
        }
      };
    });
  }

  private async createDirectories() {
    const directories = ['strands', 'media', 'exports', 'cache'];

    for (const dir of directories) {
      try {
        await Filesystem.mkdir({
          path: dir,
          directory: Directory.Data,
          recursive: true
        });
      } catch (e) {
        // Directory might already exist - this is OK
      }
    }
  }

  // ============= STRAND OPERATIONS =============

  async saveStrand(strand: Strand): Promise<void> {
    if (this.isCapacitor) {
      // Native: Save to filesystem
      const path = `strands/${strand.id}.json`;
      await Filesystem.writeFile({
        path,
        data: JSON.stringify(strand),
        directory: Directory.Data,
        encoding: Encoding.UTF8
      });
    } else {
      // Web: Save to IndexedDB
      return new Promise((resolve, reject) => {
        if (!this.indexedDB) {
          reject(new Error('IndexedDB not initialized'));
          return;
        }

        const transaction = this.indexedDB.transaction(['strands'], 'readwrite');
        const store = transaction.objectStore('strands');
        const request = store.put(strand);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }

    // Update index for quick access
    await this.updateIndex(strand);
  }

  async loadStrand(id: string): Promise<Strand | null> {
    if (this.isCapacitor) {
      // Native: Load from filesystem
      try {
        const result = await Filesystem.readFile({
          path: `strands/${id}.json`,
          directory: Directory.Data,
          encoding: Encoding.UTF8
        });
        return JSON.parse(result.data as string);
      } catch (e) {
        return null;
      }
    } else {
      // Web: Load from IndexedDB
      return new Promise((resolve, reject) => {
        if (!this.indexedDB) {
          reject(new Error('IndexedDB not initialized'));
          return;
        }

        const transaction = this.indexedDB.transaction(['strands'], 'readonly');
        const store = transaction.objectStore('strands');
        const request = store.get(id);

        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });
    }
  }

  async listStrands(filter?: { type?: string; limit?: number }): Promise<Strand[]> {
    if (this.isCapacitor) {
      // Native: List from filesystem
      const files = await Filesystem.readdir({
        path: 'strands',
        directory: Directory.Data
      });

      const strands: Strand[] = [];
      for (const file of files.files) {
        if (file.name.endsWith('.json')) {
          const content = await Filesystem.readFile({
            path: `strands/${file.name}`,
            directory: Directory.Data,
            encoding: Encoding.UTF8
          });
          const strand = JSON.parse(content.data as string);

          if (!filter?.type || strand.type === filter.type) {
            strands.push(strand);
          }

          if (filter?.limit && strands.length >= filter.limit) {
            break;
          }
        }
      }

      return strands;
    } else {
      // Web: Query from IndexedDB
      return new Promise((resolve, reject) => {
        if (!this.indexedDB) {
          reject(new Error('IndexedDB not initialized'));
          return;
        }

        const transaction = this.indexedDB.transaction(['strands'], 'readonly');
        const store = transaction.objectStore('strands');

        let request: IDBRequest;
        if (filter?.type) {
          const index = store.index('type');
          request = index.getAll(filter.type);
        } else {
          request = store.getAll();
        }

        request.onsuccess = () => {
          let results = request.result || [];
          if (filter?.limit) {
            results = results.slice(0, filter.limit);
          }
          resolve(results);
        };
        request.onerror = () => reject(request.error);
      });
    }
  }

  async deleteStrand(id: string): Promise<void> {
    if (this.isCapacitor) {
      // Native: Delete from filesystem
      await Filesystem.deleteFile({
        path: `strands/${id}.json`,
        directory: Directory.Data
      });
    } else {
      // Web: Delete from IndexedDB
      return new Promise((resolve, reject) => {
        if (!this.indexedDB) {
          reject(new Error('IndexedDB not initialized'));
          return;
        }

        const transaction = this.indexedDB.transaction(['strands'], 'readwrite');
        const store = transaction.objectStore('strands');
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }
  }

  // ============= WEAVE OPERATIONS =============

  async saveWeave(weave: WeaveGraph): Promise<void> {
    const key = 'current_weave';
    const data = JSON.stringify(weave);

    if (this.isCapacitor) {
      await Preferences.set({ key, value: data });
    } else {
      localStorage.setItem(key, data);
    }
  }

  async loadWeave(): Promise<WeaveGraph | null> {
    const key = 'current_weave';

    if (this.isCapacitor) {
      const { value } = await Preferences.get({ key });
      return value ? JSON.parse(value) : null;
    } else {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    }
  }

  // ============= MEDIA OPERATIONS =============

  async saveMedia(id: string, blob: Blob, type: 'image' | 'audio' | 'video'): Promise<string> {
    if (this.isCapacitor) {
      // Native: Save to filesystem
      const base64 = await this.blobToBase64(blob);
      const extension = this.getExtensionFromMimeType(blob.type);
      const path = `media/${type}/${id}.${extension}`;

      await Filesystem.writeFile({
        path,
        data: base64,
        directory: Directory.Data
      });

      return path;
    } else {
      // Web: Store in IndexedDB or localStorage
      const base64 = await this.blobToBase64(blob);
      localStorage.setItem(`media_${id}`, base64);
      return `media_${id}`;
    }
  }

  async loadMedia(path: string): Promise<Blob | null> {
    if (this.isCapacitor) {
      // Native: Load from filesystem
      try {
        const result = await Filesystem.readFile({
          path,
          directory: Directory.Data
        });
        return this.base64ToBlob(result.data as string);
      } catch (e) {
        return null;
      }
    } else {
      // Web: Load from localStorage
      const base64 = localStorage.getItem(path);
      return base64 ? this.base64ToBlob(base64) : null;
    }
  }

  // ============= INDEX OPERATIONS =============

  private async updateIndex(strand: Strand): Promise<void> {
    const index = await this.loadIndex();
    index[strand.id] = {
      id: strand.id,
      type: strand.type,
      title: strand.title,
      created: strand.created,
      modified: strand.modified
    };
    await this.saveIndex(index);
  }

  private async loadIndex(): Promise<Record<string, any>> {
    const key = 'strand_index';

    if (this.isCapacitor) {
      const { value } = await Preferences.get({ key });
      return value ? JSON.parse(value) : {};
    } else {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : {};
    }
  }

  private async saveIndex(index: Record<string, any>): Promise<void> {
    const key = 'strand_index';
    const data = JSON.stringify(index);

    if (this.isCapacitor) {
      await Preferences.set({ key, value: data });
    } else {
      localStorage.setItem(key, data);
    }
  }

  // ============= SYNC OPERATIONS =============

  async getSyncStatus(): Promise<{
    lastSync: Date | null;
    pendingChanges: number;
    conflicts: string[];
  }> {
    const key = 'sync_status';

    if (this.isCapacitor) {
      const { value } = await Preferences.get({ key });
      return value ? JSON.parse(value) : { lastSync: null, pendingChanges: 0, conflicts: [] };
    } else {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : { lastSync: null, pendingChanges: 0, conflicts: [] };
    }
  }

  async markForSync(_strandId: string): Promise<void> {
    const status = await this.getSyncStatus();
    status.pendingChanges++;

    const key = 'sync_status';
    const data = JSON.stringify(status);

    if (this.isCapacitor) {
      await Preferences.set({ key, value: data });
    } else {
      localStorage.setItem(key, data);
    }
  }

  // ============= UTILITY METHODS =============

  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  private base64ToBlob(base64: string): Blob {
    const byteString = atob(base64.split(',')[1]);
    const mimeString = base64.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);

    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }

    return new Blob([ab], { type: mimeString });
  }

  private getExtensionFromMimeType(mimeType: string): string {
    const mimeToExt: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
      'audio/mpeg': 'mp3',
      'audio/wav': 'wav',
      'video/mp4': 'mp4',
      'video/webm': 'webm'
    };
    return mimeToExt[mimeType] || 'bin';
  }

  async getStorageInfo(): Promise<{
    used: number;
    available: number;
    platform: string;
  }> {
    if (this.isCapacitor) {
      // Native platform storage info
      return {
        used: 0, // Would need native implementation
        available: 0, // Would need native implementation
        platform: Capacitor.getPlatform()
      };
    } else {
      // Web storage estimate
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        return {
          used: estimate.usage || 0,
          available: estimate.quota || 0,
          platform: 'web'
        };
      } else {
        return {
          used: 0,
          available: 0,
          platform: 'web'
        };
      }
    }
  }
}

// Export singleton instance
export const platformStorage = new PlatformStorageService();
