/**
 * Collections Hook
 *
 * React hook for managing strand collections and hierarchy including:
 * - CRUD operations
 * - Drag and drop move operations
 * - Copy and propagate
 * - Ancestry and path navigation
 *
 * @module hooks/use-collections
 * @author OpenStrand <team@frame.dev>
 * @since 2.1.0
 */

'use client';

import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { openStrandAPI } from '@/services/openstrand.api';
import { toast } from 'sonner';

// ============================================================================
// TYPES
// ============================================================================

export interface StrandTreeNode {
  id: string;
  title: string;
  slug: string;
  strandType: string;
  isCollection: boolean;
  depth: number;
  children: StrandTreeNode[];
  tags: string[];
}

export interface PathElement {
  id: string;
  title: string;
  slug: string;
}

export interface CollectionChild {
  id: string;
  title: string;
  slug: string;
  strandType: string;
  isCollection: boolean;
  tags: string[];
  summary: string | null;
  position: number;
  childCount?: number;
}

export interface CollectionWithChildren {
  id: string;
  title: string;
  slug: string;
  collectionType: string | null;
  childCount: number;
  aggregateTags: string[];
  children: CollectionChild[];
  metadata: Record<string, unknown>;
  created: string;
  updated: string;
}

export interface MoveStrandOptions {
  strandId: string;
  newParentId: string | null;
  position?: number;
}

export interface CopyStrandOptions {
  strandId: string;
  newParentId?: string | null;
  includeChildren?: boolean;
  newTitle?: string;
}

export interface PropagateOptions {
  strandId: string;
  property: 'tags' | 'visibility' | 'difficulty';
  value: unknown;
  mode?: 'override' | 'merge' | 'append';
  maxDepth?: number;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook for managing strand collections and hierarchy
 *
 * @param collectionId - Optional collection ID to focus on
 * @returns Collection state and mutation functions
 *
 * @example
 * ```tsx
 * const {
 *   collection,
 *   descendants,
 *   path,
 *   isLoading,
 *   moveStrand,
 *   copyStrand,
 *   propagate,
 * } = useCollections('collection-123');
 *
 * // Move a strand
 * await moveStrand({
 *   strandId: 'strand-456',
 *   newParentId: 'collection-789',
 *   position: 0,
 * });
 * ```
 */
export function useCollections(collectionId?: string | null) {
  const queryClient = useQueryClient();
  const [currentId, setCurrentId] = useState<string | null>(collectionId ?? null);

  // ========================================================================
  // QUERIES
  // ========================================================================

  /**
   * Fetch collection with children
   */
  const collectionQuery = useQuery({
    queryKey: ['collection', currentId],
    queryFn: async () => {
      if (!currentId) return null;

      const response = await openStrandAPI.apiFetch(`/api/v1/collections/${currentId}`);
      return response.json() as Promise<CollectionWithChildren>;
    },
    enabled: !!currentId,
    staleTime: 30000,
  });

  /**
   * Fetch descendants tree
   */
  const descendantsQuery = useQuery({
    queryKey: ['descendants', currentId],
    queryFn: async () => {
      if (!currentId) return null;

      const response = await openStrandAPI.apiFetch(
        `/api/v1/strands/${currentId}/descendants?maxDepth=10&includeRoot=true`
      );
      return response.json() as Promise<StrandTreeNode>;
    },
    enabled: !!currentId,
    staleTime: 30000,
  });

  /**
   * Fetch path (breadcrumb)
   */
  const pathQuery = useQuery({
    queryKey: ['path', currentId],
    queryFn: async () => {
      if (!currentId) return [];

      const response = await openStrandAPI.apiFetch(`/api/v1/strands/${currentId}/path`);
      const data = await response.json();
      return data.path as PathElement[];
    },
    enabled: !!currentId,
    staleTime: 60000,
  });

  /**
   * Fetch siblings
   */
  const siblingsQuery = useQuery({
    queryKey: ['siblings', currentId],
    queryFn: async () => {
      if (!currentId) return [];

      const response = await openStrandAPI.apiFetch(`/api/v1/strands/${currentId}/siblings`);
      const data = await response.json();
      return data.siblings as Array<{
        id: string;
        title: string;
        slug: string;
        strandType: string;
      }>;
    },
    enabled: !!currentId,
    staleTime: 30000,
  });

  // ========================================================================
  // MUTATIONS
  // ========================================================================

  /**
   * Move strand mutation
   */
  const moveMutation = useMutation({
    mutationFn: async (options: MoveStrandOptions) => {
      const response = await openStrandAPI.apiFetch('/api/v1/strands/move', {
        method: 'POST',
        body: JSON.stringify(options),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to move strand');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['collection'] });
      queryClient.invalidateQueries({ queryKey: ['descendants'] });
      queryClient.invalidateQueries({ queryKey: ['path'] });
      queryClient.invalidateQueries({ queryKey: ['siblings'] });
      queryClient.invalidateQueries({ queryKey: ['strands'] });

      toast.success('Strand moved successfully');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to move strand');
    },
  });

  /**
   * Copy strand mutation
   */
  const copyMutation = useMutation({
    mutationFn: async (options: CopyStrandOptions) => {
      const response = await openStrandAPI.apiFetch('/api/v1/strands/copy', {
        method: 'POST',
        body: JSON.stringify(options),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to copy strand');
      }

      return response.json() as Promise<{ id: string }>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['collection'] });
      queryClient.invalidateQueries({ queryKey: ['descendants'] });
      queryClient.invalidateQueries({ queryKey: ['strands'] });

      toast.success('Strand copied successfully');
      return data.id;
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to copy strand');
    },
  });

  /**
   * Propagate properties mutation
   */
  const propagateMutation = useMutation({
    mutationFn: async (options: PropagateOptions) => {
      const response = await openStrandAPI.apiFetch('/api/v1/strands/propagate', {
        method: 'POST',
        body: JSON.stringify(options),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to propagate properties');
      }

      return response.json() as Promise<{ updated: number }>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['strands'] });
      toast.success(`Updated ${data.updated} strands`);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to propagate');
    },
  });

  /**
   * Add to collection mutation
   */
  const addToCollectionMutation = useMutation({
    mutationFn: async ({
      collectionId,
      strandId,
      position,
    }: {
      collectionId: string;
      strandId: string;
      position?: number;
    }) => {
      const response = await openStrandAPI.apiFetch('/api/v1/collections/add', {
        method: 'POST',
        body: JSON.stringify({ collectionId, strandId, position }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add to collection');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collection'] });
      queryClient.invalidateQueries({ queryKey: ['descendants'] });
      toast.success('Added to collection');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to add');
    },
  });

  /**
   * Remove from collection mutation
   */
  const removeFromCollectionMutation = useMutation({
    mutationFn: async ({
      collectionId,
      strandId,
    }: {
      collectionId: string;
      strandId: string;
    }) => {
      const response = await openStrandAPI.apiFetch('/api/v1/collections/remove', {
        method: 'POST',
        body: JSON.stringify({ collectionId, strandId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to remove from collection');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collection'] });
      queryClient.invalidateQueries({ queryKey: ['descendants'] });
      toast.success('Removed from collection');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to remove');
    },
  });

  /**
   * Reorder children mutation
   */
  const reorderMutation = useMutation({
    mutationFn: async ({
      collectionId,
      order,
    }: {
      collectionId: string;
      order: string[];
    }) => {
      const response = await openStrandAPI.apiFetch('/api/v1/collections/reorder', {
        method: 'POST',
        body: JSON.stringify({ collectionId, order }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to reorder');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collection', currentId] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to reorder');
    },
  });

  /**
   * Create collection mutation
   */
  const createCollectionMutation = useMutation({
    mutationFn: async (options: {
      name: string;
      title: string;
      parentCollectionId?: string;
      collectionType?: string;
      tags?: string[];
    }) => {
      const response = await openStrandAPI.apiFetch('/api/v1/collections', {
        method: 'POST',
        body: JSON.stringify(options),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create collection');
      }

      return response.json() as Promise<{ id: string; slug: string }>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['collection'] });
      queryClient.invalidateQueries({ queryKey: ['descendants'] });
      queryClient.invalidateQueries({ queryKey: ['strands'] });
      toast.success('Collection created');
      return data;
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to create');
    },
  });

  // ========================================================================
  // COMPUTED VALUES
  // ========================================================================

  const isLoading = useMemo(
    () =>
      collectionQuery.isLoading ||
      descendantsQuery.isLoading ||
      pathQuery.isLoading,
    [collectionQuery.isLoading, descendantsQuery.isLoading, pathQuery.isLoading]
  );

  const isMutating = useMemo(
    () =>
      moveMutation.isPending ||
      copyMutation.isPending ||
      propagateMutation.isPending ||
      addToCollectionMutation.isPending ||
      removeFromCollectionMutation.isPending ||
      reorderMutation.isPending ||
      createCollectionMutation.isPending,
    [
      moveMutation.isPending,
      copyMutation.isPending,
      propagateMutation.isPending,
      addToCollectionMutation.isPending,
      removeFromCollectionMutation.isPending,
      reorderMutation.isPending,
      createCollectionMutation.isPending,
    ]
  );

  // ========================================================================
  // HELPERS
  // ========================================================================

  /**
   * Navigate to a collection
   */
  const navigateTo = useCallback((id: string | null) => {
    setCurrentId(id);
  }, []);

  /**
   * Go up one level
   */
  const goUp = useCallback(() => {
    const path = pathQuery.data;
    if (path && path.length > 1) {
      setCurrentId(path[path.length - 2].id);
    } else {
      setCurrentId(null);
    }
  }, [pathQuery.data]);

  /**
   * Flatten tree to list
   */
  const flattenTree = useCallback((node: StrandTreeNode): StrandTreeNode[] => {
    const result: StrandTreeNode[] = [node];
    for (const child of node.children) {
      result.push(...flattenTree(child));
    }
    return result;
  }, []);

  // ========================================================================
  // RETURN
  // ========================================================================

  return {
    // Current state
    currentId,
    collection: collectionQuery.data,
    descendants: descendantsQuery.data,
    path: pathQuery.data ?? [],
    siblings: siblingsQuery.data ?? [],

    // Loading states
    isLoading,
    isMutating,
    isError: collectionQuery.isError || descendantsQuery.isError,
    error: collectionQuery.error || descendantsQuery.error,

    // Navigation
    navigateTo,
    goUp,

    // Mutations
    moveStrand: moveMutation.mutateAsync,
    copyStrand: copyMutation.mutateAsync,
    propagate: propagateMutation.mutateAsync,
    addToCollection: addToCollectionMutation.mutateAsync,
    removeFromCollection: removeFromCollectionMutation.mutateAsync,
    reorderChildren: reorderMutation.mutateAsync,
    createCollection: createCollectionMutation.mutateAsync,

    // Utilities
    flattenTree,

    // Refetch
    refetch: () => {
      collectionQuery.refetch();
      descendantsQuery.refetch();
      pathQuery.refetch();
      siblingsQuery.refetch();
    },
  };
}

export default useCollections;

