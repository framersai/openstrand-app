/**
 * OpenStrand Cross-Platform Storage Service
 * Provides unified storage API backed by the SQL storage adapter across web,
 * desktop, and native runtimes.
 */

import type { StorageAdapter, SyncMode } from '@framers/sql-storage-adapter';
import {
  getSqlStorage,
  type SqlStorageContext,
  type SqlStorageInitOptions,
  type SqlSyncOptions,
  type SqlSyncResult,
} from '@openstrand/sdk/storage/sql-adapter';

export interface Strand {
  id: string;
  type: 'dataset' | 'document' | 'visualization' | 'note' | 'media' | 'exercise';
  title: string;
  slug: string;
  summary: string;
  contentType: string;
  created: Date | string;
  modified: Date | string;
  learningObjectives?: string[];
  difficulty?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  prerequisites?: { id: string; level: string }[];
  spiralStage?: number;
  scaffoldVariants?: any[];
  vizConfig?: {
    type: 'chart' | 'd3' | 'three' | 'ai_artisan';
    spec: any;
    dataSource?: string;
  };
  content?: {
    markdown?: string;
    data?: any;
    html?: string;
    media?: any;
  };
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

export interface LocalSyncStatus {
  lastSync: Date | null;
  pendingChanges: number;
  conflicts: string[];
}

const SYNC_STATUS_KEY = 'sync_status';
const WEAVE_KEY = 'current_weave';

const defaultSyncStatus: LocalSyncStatus = {
  lastSync: null,
  pendingChanges: 0,
  conflicts: [],
};

const isBrowser = (): boolean =>
  typeof window !== 'undefined' && typeof window.document !== 'undefined';

const hasProcess = (): boolean => typeof process !== 'undefined' && !!process.versions?.node;

class PlatformStorageService {
  private sqlContextPromise?: Promise<SqlStorageContext>;
  private schemaReady = false;

  async sync(): Promise<SqlSyncResult | null> {
    const context = await this.getContext();
    return context.sync();
  }

  async getSyncStatus(): Promise<LocalSyncStatus> {
    const db = await this.getAdapter();
    const row = await db.get<{ value: string }>(
      'SELECT value FROM sync_state WHERE key = ?',
      [SYNC_STATUS_KEY],
    );

    if (!row || !row.value) {
      return { ...defaultSyncStatus };
    }

    try {
      const parsed = JSON.parse(row.value) as {
        lastSync?: string | null;
        pendingChanges?: number;
        conflicts?: string[];
      };
      return {
        lastSync: parsed.lastSync ? this.reviveDate(parsed.lastSync) : null,
        pendingChanges: parsed.pendingChanges ?? 0,
        conflicts: parsed.conflicts ?? [],
      };
    } catch (error) {
      console.warn('[storage] Failed to parse sync status', { error });
      return { ...defaultSyncStatus };
    }
  }

  async markForSync(_strandId: string): Promise<void> {
    const status = await this.getSyncStatus();
    const updatedStatus: LocalSyncStatus = {
      ...status,
      pendingChanges: status.pendingChanges + 1,
    };

    await this.writeSyncStatus(updatedStatus);

    try {
      await this.sync();
    } catch (error) {
      console.warn('[storage] Failed to trigger sync', error);
    }
  }

  private async getContext(): Promise<SqlStorageContext> {
    if (!this.sqlContextPromise) {
      this.sqlContextPromise = (async () => {
        const context = await getSqlStorage(this.resolveInitOptions());
        await this.ensureSchema(context);
        return context;
      })();
    }
    return this.sqlContextPromise;
  }

  private resolveInitOptions(): SqlStorageInitOptions {
    const sync = this.resolveSyncOptions();

    const database: SqlStorageInitOptions['database'] = {};
    const localPath = process.env.NEXT_PUBLIC_OPENSTRAND_LOCAL_DB_PATH ?? process.env.OPENSTRAND_LOCAL_DB_PATH;
    if (localPath && localPath.trim().length > 0) {
      database.file = localPath;
    }

    return {
      name: 'openstrand-app',
      database,
      sync,
    };
  }

  private resolveSyncOptions(): SqlSyncOptions | false {
    const remoteUrl = process.env.NEXT_PUBLIC_OPENSTRAND_SYNC_REMOTE_URL ?? process.env.OPENSTRAND_SYNC_REMOTE_URL;
    if (!remoteUrl || remoteUrl.trim().length === 0) {
      return false;
    }

    const tables: NonNullable<SqlSyncOptions['tables']> = {
      local_strands: { priority: 'critical', conflictStrategy: 'merge' },
      local_metadata: { priority: 'high', conflictStrategy: 'remote-wins' },
      media_store: { priority: 'medium', conflictStrategy: 'merge', maxRecords: 10000 },
      sync_state: { skip: true },
    };

    const syncMode = (process.env.NEXT_PUBLIC_OPENSTRAND_SYNC_MODE as SyncMode) ?? 'auto';
    const interval = Number(process.env.NEXT_PUBLIC_OPENSTRAND_SYNC_INTERVAL ?? 60000);
    const debounce = Number(process.env.NEXT_PUBLIC_OPENSTRAND_SYNC_DEBOUNCE ?? 750);
    const batchSize = Number(process.env.NEXT_PUBLIC_OPENSTRAND_SYNC_BATCH ?? 200);
    const retryDelay = Number(process.env.NEXT_PUBLIC_OPENSTRAND_SYNC_RETRY_DELAY ?? 1500);
    const maxRetries = Number(process.env.NEXT_PUBLIC_OPENSTRAND_SYNC_MAX_RETRIES ?? 3);

    const canInitialiseSync =
      !isBrowser() ||
      (typeof window !== 'undefined' && Boolean((window as any).Capacitor)) ||
      (typeof process !== 'undefined' && !!process.versions?.electron) ||
      (typeof window !== 'undefined' && Boolean((window as any).process?.versions?.electron));

    const baseOptions: SqlSyncOptions = {
      remote: { url: remoteUrl },
      mode: canInitialiseSync ? syncMode : 'manual',
      direction: canInitialiseSync ? 'bidirectional' : 'push-only',
      conflictStrategy: 'merge',
      interval,
      debounce,
      batchSize,
      retryOnError: true,
      maxRetries,
      retryDelay,
      tables,
      onSync: async (result) => {
        await this.writeSyncStatus({
          lastSync: this.reviveDate(result.timestamp) ?? new Date(),
          pendingChanges: 0,
          conflicts: result.conflicts > 0 ? [`${result.conflicts} conflict(s) detected`] : [],
        });
      },
      onError: async (error) => {
        console.warn('[storage] Sync failure', error);
      },
      onOffline: () => {
        console.info('[storage] Sync offline');
      },
      onOnline: () => {
        console.info('[storage] Sync online');
      },
    };

    if (!canInitialiseSync) {
      return {
        ...baseOptions,
        ignoreInitError: true,
      };
    }

    return baseOptions;
  }

  private async ensureSchema(context: SqlStorageContext): Promise<void> {
    if (!this.schemaReady) {
      await this.initialiseSchema(context.adapter);
      this.schemaReady = true;
    }

    if (context.syncManager) {
      const remote = (context.syncManager as unknown as { remoteDb?: StorageAdapter }).remoteDb;
      if (remote) {
        try {
          await this.initialiseSchema(remote);
        } catch (error) {
          console.warn('[storage] Failed to initialise remote schema', error);
        }
      }
    }
  }

  private async getAdapter(): Promise<StorageAdapter> {
    const context = await this.getContext();
    return context.adapter;
  }

  private async initialiseSchema(adapter: StorageAdapter): Promise<void> {
    await adapter.exec(`
      CREATE TABLE IF NOT EXISTS local_strands (
        id TEXT PRIMARY KEY,
        type TEXT,
        title TEXT,
        slug TEXT,
        summary TEXT,
        content_type TEXT,
        data TEXT NOT NULL,
        created_at TEXT,
        updated_at TEXT
      );

      CREATE TABLE IF NOT EXISTS local_metadata (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS media_store (
        id TEXT PRIMARY KEY,
        kind TEXT,
        mime_type TEXT,
        data TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS sync_state (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_local_strands_type ON local_strands(type);
      CREATE INDEX IF NOT EXISTS idx_local_strands_updated ON local_strands(updated_at);
    `);
  }

  // ============= STRAND OPERATIONS =============

  async saveStrand(strand: Strand): Promise<void> {
    const db = await this.getAdapter();
    const now = new Date();
    const createdAt = this.reviveDate(strand.created) ?? now;
    const updatedAt = this.reviveDate(strand.modified) ?? now;

    await db.run(
      `INSERT INTO local_strands (
         id, type, title, slug, summary, content_type, data, created_at, updated_at
       ) VALUES (
         @id, @type, @title, @slug, @summary, @contentType, @data, @createdAt, @updatedAt
       )
       ON CONFLICT(id) DO UPDATE SET
         type = excluded.type,
         title = excluded.title,
         slug = excluded.slug,
         summary = excluded.summary,
         content_type = excluded.content_type,
         data = excluded.data,
         updated_at = excluded.updated_at`,
      {
        id: strand.id,
        type: strand.type,
        title: strand.title,
        slug: strand.slug,
        summary: strand.summary,
        contentType: strand.contentType,
        data: JSON.stringify(strand),
        createdAt: createdAt.toISOString(),
        updatedAt: updatedAt.toISOString(),
      },
    );
  }

  async loadStrand(id: string): Promise<Strand | null> {
    const db = await this.getAdapter();
    const row = await db.get<{ data: string }>(
      'SELECT data FROM local_strands WHERE id = ?',
      [id],
    );
    if (!row || !row.data) {
      return null;
    }
    try {
      return JSON.parse(row.data) as Strand;
    } catch (error) {
      console.warn('[storage] Failed to parse strand payload', { id, error });
      return null;
    }
  }

  async listStrands(filter?: { type?: string; limit?: number }): Promise<Strand[]> {
    const db = await this.getAdapter();
    const params: Array<string | number> = [];
    let sql = 'SELECT data FROM local_strands';

    if (filter?.type) {
      sql += ' WHERE type = ?';
      params.push(filter.type);
    }

    sql += ' ORDER BY updated_at DESC';

    if (filter?.limit) {
      sql += ' LIMIT ?';
      params.push(filter.limit);
    }

    const rows = await db.all<{ data: string }>(sql, params);
    return rows
      .map((row) => {
        try {
          return JSON.parse(row.data) as Strand;
        } catch (error) {
          console.warn('[storage] Failed to parse strand in list', { error });
          return null;
        }
      })
      .filter((item): item is Strand => Boolean(item));
  }

  async deleteStrand(id: string): Promise<void> {
    const db = await this.getAdapter();
    await db.run('DELETE FROM local_strands WHERE id = ?', [id]);
  }

  // ============= WEAVE OPERATIONS =============

  async saveWeave(weave: WeaveGraph): Promise<void> {
    const db = await this.getAdapter();
    await db.run(
      `INSERT INTO local_metadata (key, value, updated_at)
       VALUES (@key, @value, @updated)
       ON CONFLICT(key) DO UPDATE SET
         value = excluded.value,
         updated_at = excluded.updated_at`,
      {
        key: WEAVE_KEY,
        value: JSON.stringify(weave),
        updated: new Date().toISOString(),
      },
    );
  }

  async loadWeave(): Promise<WeaveGraph | null> {
    const db = await this.getAdapter();
    const row = await db.get<{ value: string }>(
      'SELECT value FROM local_metadata WHERE key = ?',
      [WEAVE_KEY],
    );

    if (!row || !row.value) {
      return null;
    }

    try {
      return JSON.parse(row.value) as WeaveGraph;
    } catch (error) {
      console.warn('[storage] Failed to parse weave payload', { error });
      return null;
    }
  }

  // ============= MEDIA OPERATIONS =============

  async saveMedia(id: string, blob: Blob, type: 'image' | 'audio' | 'video'): Promise<string> {
    const db = await this.getAdapter();
    const base64 = await this.blobToBase64(blob);
    const key = `media:${type}:${id}`;

    await db.run(
      `INSERT INTO media_store (id, kind, mime_type, data, updated_at)
       VALUES (@id, @kind, @mime, @data, @updated)
       ON CONFLICT(id) DO UPDATE SET
         kind = excluded.kind,
         mime_type = excluded.mime_type,
         data = excluded.data,
         updated_at = excluded.updated_at`,
      {
        id: key,
        kind: type,
        mime: blob.type,
        data: base64,
        updated: new Date().toISOString(),
      },
    );

    return key;
  }

  async loadMedia(key: string): Promise<Blob | null> {
    const db = await this.getAdapter();
    const row = await db.get<{ data: string; mime_type: string | null }>(
      'SELECT data, mime_type FROM media_store WHERE id = ?',
      [key],
    );

    if (!row || !row.data) {
      return null;
    }

    try {
      return this.base64ToBlob(row.data, row.mime_type ?? undefined);
    } catch (error) {
      console.warn('[storage] Failed to decode media payload', { key, error });
      return null;
    }
  }

  // ============= UTILITY METHODS =============

  private reviveDate(value: unknown): Date | null {
    if (value instanceof Date) {
      return value;
    }
    if (typeof value === 'string' || typeof value === 'number') {
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? null : date;
    }
    return null;
  }

  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  private base64ToBlob(base64: string, mimeType?: string): Blob {
    const [header, data] = base64.split(',');
    const mime = mimeType ?? header.split(':')[1]?.split(';')[0] ?? 'application/octet-stream';
    let byteString: string;
    if (typeof atob === 'function') {
      byteString = atob(data);
    } else if (typeof globalThis !== 'undefined' && (globalThis as any).Buffer) {
      byteString = (globalThis as any).Buffer.from(data, 'base64').toString('binary');
    } else {
      throw new Error('Base64 decoding is not supported in this environment');
    }
    const arrayBuffer = new ArrayBuffer(byteString.length);
    const view = new Uint8Array(arrayBuffer);
    for (let i = 0; i < byteString.length; i += 1) {
      view[i] = byteString.charCodeAt(i);
    }
    return new Blob([arrayBuffer], { type: mime });
  }

  private async writeSyncStatus(status: LocalSyncStatus): Promise<void> {
    const db = await this.getAdapter();
    await db.run(
      `INSERT INTO sync_state (key, value, updated_at)
       VALUES (@key, @value, @updated)
       ON CONFLICT(key) DO UPDATE SET
         value = excluded.value,
         updated_at = excluded.updated_at`,
      {
        key: SYNC_STATUS_KEY,
        value: JSON.stringify({
          ...status,
          lastSync: status.lastSync ? status.lastSync.toISOString() : null,
        }),
        updated: new Date().toISOString(),
      },
    );
  }
}

export const platformStorage = new PlatformStorageService();
