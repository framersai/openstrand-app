/**
 * Strand Editor Hook
 *
 * React hook for managing strand editor state including:
 * - Draft management with auto-save
 * - Publishing to database or GitHub
 * - Template loading
 *
 * @module hooks/use-strand-editor
 * @author OpenStrand <team@frame.dev>
 * @since 2.1.0
 */

'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { openStrandAPI } from '@/services/openstrand.api';
import { githubService, StrandTemplate } from '@/services/github.service';
import { toast } from 'sonner';

// ============================================================================
// TYPES
// ============================================================================

export interface StrandMetadata {
  title: string;
  slug?: string;
  summary?: string;
  tags: string[];
  strandType: string;
  classification?: string;
  difficulty?: string;
  prerequisites?: string[];
  visibility?: 'private' | 'team' | 'public';
  author?: string;
  created?: string;
  updated?: string;
  [key: string]: unknown;
}

export interface EditorDraft {
  id: string;
  strandId?: string;
  metadata: StrandMetadata;
  content: string;
  lastSaved: string;
  isDirty: boolean;
  version: number;
}

export interface PublishTarget {
  type: 'database' | 'github';
  repo?: string;
  branch?: string;
  path?: string;
}

export type SaveStatus = 'saved' | 'saving' | 'dirty' | 'error';

export interface UseStrandEditorOptions {
  /** Existing strand ID for editing */
  strandId?: string;
  /** Initial metadata */
  initialMetadata?: Partial<StrandMetadata>;
  /** Initial content */
  initialContent?: string;
  /** Auto-save interval in ms */
  autoSaveInterval?: number;
  /** GitHub token for publishing */
  githubToken?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DRAFT_STORAGE_KEY = 'openstrand-editor-drafts';
const DEFAULT_AUTOSAVE_INTERVAL = 2000;

const DEFAULT_METADATA: StrandMetadata = {
  title: 'Untitled Strand',
  tags: [],
  strandType: 'document',
  classification: 'core',
  visibility: 'private',
};

// ============================================================================
// DRAFT STORAGE HELPERS
// ============================================================================

function loadDrafts(): Map<string, EditorDraft> {
  try {
    const stored = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return new Map(Object.entries(parsed));
    }
  } catch (error) {
    console.error('Failed to load drafts:', error);
  }
  return new Map();
}

function saveDrafts(drafts: Map<string, EditorDraft>) {
  try {
    const obj = Object.fromEntries(drafts);
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(obj));
  } catch (error) {
    console.error('Failed to save drafts:', error);
  }
}

function getDraft(id: string): EditorDraft | undefined {
  return loadDrafts().get(id);
}

function saveDraft(draft: EditorDraft) {
  const drafts = loadDrafts();
  draft.lastSaved = new Date().toISOString();
  draft.isDirty = false;
  draft.version++;
  drafts.set(draft.id, draft);
  saveDrafts(drafts);
}

function deleteDraft(id: string) {
  const drafts = loadDrafts();
  drafts.delete(id);
  saveDrafts(drafts);
}

function getAllDrafts(): EditorDraft[] {
  return Array.from(loadDrafts().values());
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook for managing strand editor state
 *
 * @example
 * ```tsx
 * const {
 *   metadata,
 *   content,
 *   setMetadata,
 *   setContent,
 *   saveStatus,
 *   saveToDraft,
 *   saveToDatabase,
 *   publishToGitHub,
 *   templates,
 *   loadTemplate,
 * } = useStrandEditor({
 *   strandId: 'existing-strand-id',
 *   autoSaveInterval: 2000,
 * });
 * ```
 */
export function useStrandEditor(options: UseStrandEditorOptions = {}) {
  const {
    strandId,
    initialMetadata,
    initialContent = '',
    autoSaveInterval = DEFAULT_AUTOSAVE_INTERVAL,
    githubToken,
  } = options;

  const queryClient = useQueryClient();
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Generate draft ID
  const draftId = strandId || `draft-${Date.now()}`;

  // State
  const [metadata, setMetadata] = useState<StrandMetadata>({
    ...DEFAULT_METADATA,
    ...initialMetadata,
  });
  const [content, setContent] = useState(initialContent);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [isPublishing, setIsPublishing] = useState(false);

  // Set GitHub token if provided
  useEffect(() => {
    if (githubToken) {
      githubService.setToken(githubToken);
    }
  }, [githubToken]);

  // Load existing strand if editing
  const strandQuery = useQuery({
    queryKey: ['strand', strandId],
    queryFn: async () => {
      if (!strandId) return null;
      const response = await openStrandAPI.apiFetch(`/api/v1/strands/${strandId}`);
      return response.json();
    },
    enabled: !!strandId,
  });

  // Load existing strand data
  useEffect(() => {
    if (strandQuery.data) {
      const strand = strandQuery.data;
      setMetadata({
        title: strand.title,
        slug: strand.slug,
        summary: strand.summary,
        tags: strand.metadata?.tags || [],
        strandType: strand.strandType,
        classification: strand.classification,
        difficulty: strand.difficulty,
        visibility: strand.visibility,
        author: strand.author,
        created: strand.created,
        updated: strand.updated,
      });
      setContent(strand.content?.markdown || strand.plainText || '');
    }
  }, [strandQuery.data]);

  // Load draft on mount
  useEffect(() => {
    const existingDraft = getDraft(draftId);
    if (existingDraft && !strandQuery.data) {
      setMetadata(existingDraft.metadata);
      setContent(existingDraft.content);
    }
  }, [draftId, strandQuery.data]);

  // Auto-save to draft
  useEffect(() => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    setSaveStatus('dirty');

    autoSaveTimerRef.current = setTimeout(() => {
      const draft: EditorDraft = {
        id: draftId,
        strandId,
        metadata,
        content,
        lastSaved: new Date().toISOString(),
        isDirty: false,
        version: 1,
      };
      saveDraft(draft);
      setSaveStatus('saved');
    }, autoSaveInterval);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [metadata, content, autoSaveInterval, draftId, strandId]);

  // ========================================================================
  // TEMPLATES
  // ========================================================================

  const templatesQuery = useQuery({
    queryKey: ['codex-templates'],
    queryFn: () => githubService.getCodexTemplates(),
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  const loadTemplate = useCallback((template: StrandTemplate) => {
    setMetadata((prev) => ({
      ...prev,
      ...template.metadata,
    }));
    setContent(template.content);
    toast.success(`Loaded template: ${template.name}`);
  }, []);

  // ========================================================================
  // SAVE/PUBLISH MUTATIONS
  // ========================================================================

  // Save to database
  const saveMutation = useMutation({
    mutationFn: async () => {
      const body = {
        title: metadata.title,
        slug: metadata.slug || generateSlug(metadata.title),
        summary: metadata.summary,
        strandType: metadata.strandType,
        classification: metadata.classification,
        difficulty: metadata.difficulty,
        visibility: metadata.visibility,
        content: { markdown: content },
        metadata: { tags: metadata.tags },
      };

      const endpoint = strandId
        ? `/api/v1/strands/${strandId}`
        : '/api/v1/strands';

      const response = await openStrandAPI.apiFetch(endpoint, {
        method: strandId ? 'PUT' : 'POST',
        body: JSON.stringify(body),
      });

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['strands'] });
      queryClient.invalidateQueries({ queryKey: ['strand', strandId] });
      deleteDraft(draftId);
      toast.success('Saved successfully');
      return data;
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to save');
    },
  });

  // Publish to GitHub
  const publishGitHubMutation = useMutation({
    mutationFn: async (options: { commitMessage: string }) => {
      if (!githubService.isAuthenticated()) {
        throw new Error('GitHub authentication required');
      }

      return githubService.publishToCodex({
        title: metadata.title,
        slug: metadata.slug || generateSlug(metadata.title),
        content,
        metadata: {
          title: metadata.title,
          summary: metadata.summary,
          tags: metadata.tags,
          strandType: metadata.strandType,
          difficulty: metadata.difficulty,
          author: metadata.author,
          created: new Date().toISOString(),
        },
        commitMessage: options.commitMessage,
      });
    },
    onSuccess: (data) => {
      deleteDraft(draftId);
      toast.success('Pull request created!');
      // Open PR in new tab
      window.open(data.prUrl, '_blank');
      return data;
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to publish');
    },
  });

  // ========================================================================
  // HANDLERS
  // ========================================================================

  const saveToDraft = useCallback(() => {
    const draft: EditorDraft = {
      id: draftId,
      strandId,
      metadata,
      content,
      lastSaved: new Date().toISOString(),
      isDirty: false,
      version: 1,
    };
    saveDraft(draft);
    setSaveStatus('saved');
    toast.success('Draft saved');
  }, [draftId, strandId, metadata, content]);

  const saveToDatabase = useCallback(async () => {
    setSaveStatus('saving');
    try {
      await saveMutation.mutateAsync();
      setSaveStatus('saved');
    } catch (error) {
      setSaveStatus('error');
    }
  }, [saveMutation]);

  const publishToGitHub = useCallback(
    async (commitMessage: string) => {
      setIsPublishing(true);
      try {
        const result = await publishGitHubMutation.mutateAsync({ commitMessage });
        return result;
      } finally {
        setIsPublishing(false);
      }
    },
    [publishGitHubMutation]
  );

  const discardDraft = useCallback(() => {
    deleteDraft(draftId);
    setMetadata({ ...DEFAULT_METADATA, ...initialMetadata });
    setContent(initialContent);
    setSaveStatus('saved');
    toast.success('Draft discarded');
  }, [draftId, initialMetadata, initialContent]);

  const resetToSaved = useCallback(() => {
    if (strandQuery.data) {
      const strand = strandQuery.data;
      setMetadata({
        title: strand.title,
        slug: strand.slug,
        summary: strand.summary,
        tags: strand.metadata?.tags || [],
        strandType: strand.strandType,
        classification: strand.classification,
        difficulty: strand.difficulty,
        visibility: strand.visibility,
        author: strand.author,
        created: strand.created,
        updated: strand.updated,
      });
      setContent(strand.content?.markdown || strand.plainText || '');
      deleteDraft(draftId);
      setSaveStatus('saved');
      toast.success('Reset to saved version');
    }
  }, [strandQuery.data, draftId]);

  // ========================================================================
  // RETURN
  // ========================================================================

  return {
    // State
    metadata,
    content,
    saveStatus,
    isPublishing,
    isLoading: strandQuery.isLoading,
    isDirty: saveStatus === 'dirty',

    // Setters
    setMetadata,
    setContent,

    // Actions
    saveToDraft,
    saveToDatabase,
    publishToGitHub,
    discardDraft,
    resetToSaved,

    // Templates
    templates: templatesQuery.data || [],
    templatesLoading: templatesQuery.isLoading,
    loadTemplate,

    // Drafts
    allDrafts: getAllDrafts,
    loadDraft: (id: string) => {
      const draft = getDraft(id);
      if (draft) {
        setMetadata(draft.metadata);
        setContent(draft.content);
      }
    },

    // GitHub links
    getCodexPRLink: githubService.getCodexPRLink.bind(githubService),
    getCodexFileLink: githubService.getCodexFileLink.bind(githubService),
    getCodexEditLink: githubService.getCodexEditLink.bind(githubService),
    getCodexNewFileLink: githubService.getCodexNewFileLink.bind(githubService),
    isGitHubAuthenticated: githubService.isAuthenticated(),
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export default useStrandEditor;

