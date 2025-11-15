/**
 * Editor API Client
 * 
 * Handles WYSIWYG editor state management, versioning, and content transformation.
 * Supports both TipTap (rich text) and Excalidraw (whiteboard) content types.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export type EditorContentType = 'tiptap' | 'excalidraw' | 'markdown';

export interface EditorState {
  id: string;
  strandId: string;
  content: any;
  contentType: EditorContentType;
  version: number;
  isDraft: boolean;
  isPublished: boolean;
  wordCount?: number;
  characterCount?: number;
  modified: Date;
}

export interface SaveStateOptions {
  isDraft?: boolean;
  createVersion?: boolean;
  changeNote?: string;
}

export interface EditorVersion {
  id: string;
  strandId: string;
  version: number;
  content: any;
  changeType: string;
  changeNote?: string;
  changedBy: string;
  created: Date;
  wordCount?: number;
  characterCount?: number;
}

export interface ExportOptions {
  format: 'markdown' | 'html' | 'pdf' | 'docx' | 'json';
}

/**
 * Editor API
 */
export const editorAPI = {
  /**
   * Save editor state (auto-save or manual)
   */
  async saveState(
    strandId: string,
    content: any,
    contentType: EditorContentType,
    options: SaveStateOptions = {}
  ): Promise<EditorState> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/editor/${strandId}/state`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        content,
        contentType,
        isDraft: options.isDraft ?? true,
        createVersion: options.createVersion,
        changeNote: options.changeNote,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to save editor state: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data;
  },

  /**
   * Get editor state
   */
  async getState(
    strandId: string,
    contentType?: EditorContentType
  ): Promise<EditorState | null> {
    const token = localStorage.getItem('token');
    const url = new URL(`${API_BASE_URL}/editor/${strandId}/state`);
    if (contentType) {
      url.searchParams.set('contentType', contentType);
    }

    const response = await fetch(url.toString(), {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`Failed to get editor state: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data;
  },

  /**
   * Publish draft and create version
   */
  async publish(strandId: string, changeNote?: string): Promise<EditorState> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/editor/${strandId}/publish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ changeNote }),
    });

    if (!response.ok) {
      throw new Error(`Failed to publish: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data;
  },

  /**
   * Get version history
   */
  async getVersions(
    strandId: string,
    options: { limit?: number; since?: string; until?: string } = {}
  ): Promise<EditorVersion[]> {
    const token = localStorage.getItem('token');
    const url = new URL(`${API_BASE_URL}/editor/${strandId}/versions`);
    if (options.limit) url.searchParams.set('limit', options.limit.toString());
    if (options.since) url.searchParams.set('since', options.since);
    if (options.until) url.searchParams.set('until', options.until);

    const response = await fetch(url.toString(), {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get versions: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data;
  },

  /**
   * Get specific version
   */
  async getVersion(strandId: string, version: number): Promise<EditorVersion> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/editor/${strandId}/versions/${version}`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get version: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data;
  },

  /**
   * Restore a previous version
   */
  async restoreVersion(strandId: string, version: number): Promise<EditorState> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/editor/${strandId}/versions/${version}/restore`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to restore version: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data;
  },

  /**
   * Get diff between versions
   */
  async getDiff(
    strandId: string,
    fromVersion: number,
    toVersion: number
  ): Promise<{ diff: string; changes: any }> {
    const token = localStorage.getItem('token');
    const url = new URL(`${API_BASE_URL}/editor/${strandId}/diff`);
    url.searchParams.set('from', fromVersion.toString());
    url.searchParams.set('to', toVersion.toString());

    const response = await fetch(url.toString(), {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get diff: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data;
  },

  /**
   * Export editor content
   */
  async export(strandId: string, format: ExportOptions['format']): Promise<Blob> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/editor/${strandId}/export`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ format }),
    });

    if (!response.ok) {
      throw new Error(`Failed to export: ${response.statusText}`);
    }

    return response.blob();
  },

  /**
   * Delete editor state
   */
  async deleteState(strandId: string, contentType?: EditorContentType): Promise<void> {
    const token = localStorage.getItem('token');
    const url = new URL(`${API_BASE_URL}/editor/${strandId}/state`);
    if (contentType) {
      url.searchParams.set('contentType', contentType);
    }

    const response = await fetch(url.toString(), {
      method: 'DELETE',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to delete editor state: ${response.statusText}`);
    }
  },
};

