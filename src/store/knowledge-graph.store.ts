import { create } from 'zustand';

import type { Weave, WeaveNode, WeaveEdge } from '@/types';
import {
  weaveAPI,
  type WeaveGraphQueryOptions,
  type WeaveNodeInput,
  type WeaveNodeUpdateInput,
  type WeaveEdgeInput,
  type WeaveEdgeUpdateInput,
} from '@/services/openstrand.api';

export interface KnowledgeGraphNode extends WeaveNode {
  clusterId?: string;
}

export interface KnowledgeGraphEdge extends WeaveEdge {
  id: string;
}

interface ClusterRecord {
  id: string;
  nodeIds: string[];
}

interface SelectionState {
  nodes: string[];
  edges: string[];
}

interface ViewportSample {
  center: { x: number; y: number; z: number };
  radius: number;
  distance: number;
  updatedAt: number;
}

interface FocusTarget {
  center: { x: number; y: number; z: number };
  radius: number;
  nonce: number;
  requestedAt: number;
}

interface KnowledgeGraphState {
  weaveId: string | null;
  weave: Weave | null;
  nodes: Record<string, KnowledgeGraphNode>;
  edges: Record<string, KnowledgeGraphEdge>;
  clusters: ClusterRecord[];
  selection: SelectionState;
  loading: boolean;
  error?: string;
  clusteringEnabled: boolean;
  availableWeaves: Weave[];
  readOnly: boolean;
  lastSegmentAt?: number;
  viewportSample?: ViewportSample;
  focusTarget?: FocusTarget | null;
  composerNodeId?: string | null;
  initialize: (weaveId?: string | null) => Promise<void>;
  refresh: () => Promise<void>;
  loadGraphSegment: (options?: WeaveGraphQueryOptions) => Promise<void>;
  setActiveWeave: (weaveId: string | null) => Promise<void>;
  selectNodes: (nodeIds: string[]) => void;
  selectEdges: (edgeIds: string[]) => void;
  clearSelection: () => void;
  focusOnSelection: () => void;
  requestFocus: (target: { center: { x: number; y: number; z: number }; radius?: number }) => void;
  acknowledgeFocus: (nonce: number) => void;
  openComposerForNode: (nodeId: string) => void;
  closeComposer: () => void;
  createNode: (input: WeaveNodeInput) => Promise<KnowledgeGraphNode>;
  updateNode: (nodeId: string, input: WeaveNodeUpdateInput) => Promise<KnowledgeGraphNode>;
  deleteNode: (nodeId: string) => Promise<void>;
  createEdge: (input: WeaveEdgeInput) => Promise<KnowledgeGraphEdge>;
  updateEdge: (edgeId: string, input: WeaveEdgeUpdateInput) => Promise<KnowledgeGraphEdge>;
  deleteEdge: (edgeId: string) => Promise<void>;
  setClusteringEnabled: (enabled: boolean) => void;
  updateViewportSample: (sample: ViewportSample) => void;
  clearError: () => void;
}

type StoreSet = (
  partial:
    | Partial<KnowledgeGraphState>
    | ((state: KnowledgeGraphState) => Partial<KnowledgeGraphState> | KnowledgeGraphState),
) => void;
type StoreGet = () => KnowledgeGraphState;

const buildClusterRecords = (communities: string[][] = []): ClusterRecord[] =>
  communities.map((nodeIds, index) => ({
    id: `cluster-${index + 1}`,
    nodeIds: Array.from(new Set(nodeIds)),
  }));

const createClusterLookup = (clusters: ClusterRecord[]): Map<string, string> => {
  const lookup = new Map<string, string>();
  clusters.forEach((cluster) => {
    cluster.nodeIds.forEach((nodeId) => lookup.set(nodeId, cluster.id));
  });
  return lookup;
};

const extractPosition = (
  node: WeaveNode,
  fallback?: { x: number; y: number; z?: number },
): { x: number; y: number; z?: number } | undefined => {
  if (node.position) {
    return { ...node.position };
  }

  const metadataPosition = node.metadata?.position as
    | { x?: number; y?: number; z?: number }
    | undefined;

  if (metadataPosition && typeof metadataPosition === 'object') {
    return {
      x: typeof metadataPosition.x === 'number' ? metadataPosition.x : fallback?.x ?? 0,
      y: typeof metadataPosition.y === 'number' ? metadataPosition.y : fallback?.y ?? 0,
      z: typeof metadataPosition.z === 'number' ? metadataPosition.z : fallback?.z,
    };
  }

  return fallback;
};

const transformNode = (
  node: WeaveNode,
  clusterLookup: Map<string, string>,
  previous?: KnowledgeGraphNode,
): KnowledgeGraphNode => {
  const position = extractPosition(node, previous?.position);
  const clusterId = clusterLookup.get(node.id) ?? previous?.clusterId;

  return {
    ...previous,
    ...node,
    position,
    clusterId,
    metadata: node.metadata ?? previous?.metadata ?? {},
  };
};

const transformEdge = (
  edge: WeaveEdge,
  previous?: KnowledgeGraphEdge,
): KnowledgeGraphEdge => {
  const edgeId = edge.id ?? previous?.id ?? `${edge.source}->${edge.target}:${edge.type}`;

  return {
    ...previous,
    ...edge,
    id: edgeId,
    weight: typeof edge.weight === 'number' ? edge.weight : previous?.weight ?? 1,
    metadata: edge.metadata ?? previous?.metadata ?? {},
  } as KnowledgeGraphEdge;
};

const applyWeaveSnapshot = (
  set: StoreSet,
  get: StoreGet,
  weave: Weave,
  options: { readOnly?: boolean; weaveId?: string | null } = {},
) => {
  const { clusteringEnabled } = get();
  const readOnly = options.readOnly ?? get().readOnly;
  const targetWeaveId = options.weaveId ?? (readOnly ? null : weave.id);

  const clusterRecords = clusteringEnabled
    ? buildClusterRecords(weave.communities ?? [])
    : [];
  const clusterLookup = createClusterLookup(clusterRecords);

  const nodes: Record<string, KnowledgeGraphNode> = {};
  weave.nodes.forEach((node) => {
    nodes[node.id] = transformNode(node, clusterLookup);
  });

  const edges: Record<string, KnowledgeGraphEdge> = {};
  weave.edges.forEach((edge) => {
    const normalized = transformEdge(edge);
    edges[normalized.id] = normalized;
  });

  set({
    weaveId: targetWeaveId,
    weave,
    nodes,
    edges,
    clusters: clusterRecords,
    selection: { nodes: [], edges: [] },
    loading: false,
    error: undefined,
    readOnly,
    lastSegmentAt: Date.now(),
  });
};

const fetchWeaveSnapshot = async (
  set: StoreSet,
  get: StoreGet,
  requestedId?: string | null,
) => {
  set({ loading: true, error: undefined });

  try {
    let available = get().availableWeaves;
    const needsRefresh =
      !available.length || (requestedId ? !available.some((weave) => weave.id === requestedId) : false);

    if (needsRefresh) {
      try {
        available = await weaveAPI.list();
      } catch (listError) {
        if (!available.length) {
          throw listError;
        }
      }
    }

    let targetId: string | null = requestedId ?? available[0]?.id ?? null;
    let readOnly = false;
    let weave: Weave;

    if (targetId) {
      weave = await weaveAPI.getById(targetId);
    } else {
      weave = await weaveAPI.get();
      readOnly = true;
      targetId = null;
    }

    set({ availableWeaves: available, readOnly });
    applyWeaveSnapshot(set, get, weave, { readOnly, weaveId: targetId });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load knowledge graph';
    set({ loading: false, error: message });
    throw error instanceof Error ? error : new Error(message);
  }
};

/**
 * Global knowledge graph store containing weave snapshot state, selection, and editing helpers.
 */
export const useKnowledgeGraphStore = create<KnowledgeGraphState>((set, get) => ({
  weaveId: null,
  weave: null,
  nodes: {},
  edges: {},
  clusters: [],
  selection: { nodes: [], edges: [] },
  loading: false,
  error: undefined,
  clusteringEnabled: true,
  availableWeaves: [],
  readOnly: true,
  lastSegmentAt: undefined,
  viewportSample: undefined,
  focusTarget: null,
  composerNodeId: null,

  initialize: async (weaveId?: string | null) => {
    await fetchWeaveSnapshot(set, get, weaveId ?? null);
  },

  refresh: async () => {
    const { weaveId, readOnly } = get();
    await fetchWeaveSnapshot(set, get, readOnly ? null : weaveId);
  },

  /**
   * Incrementally fetch a graph segment and merge it into the current snapshot.
   */
  loadGraphSegment: async (options?: WeaveGraphQueryOptions) => {
    const { weaveId, clusteringEnabled, readOnly } = get();
    if (readOnly || !weaveId) {
      await fetchWeaveSnapshot(set, get, null);
      return;
    }

    set({ loading: true, error: undefined });

    try {
      const segment = await weaveAPI.getGraphSegment(weaveId, options ?? {});

      set((state) => {
        const nextNodes = { ...state.nodes };
        const nextEdges = { ...state.edges };

        const updatedClusters = segment.clusters && clusteringEnabled
          ? buildClusterRecords(segment.clusters)
          : state.clusters;
        const clusterLookup = createClusterLookup(updatedClusters);

        segment.nodes.forEach((node) => {
          nextNodes[node.id] = transformNode(node, clusterLookup, nextNodes[node.id]);
        });

        segment.edges.forEach((edge) => {
          const edgeKey = edge.id ?? `${edge.source}->${edge.target}:${edge.type}`;
          nextEdges[edgeKey] = transformEdge(edge, nextEdges[edgeKey]);
        });

        const mergedWeave: Weave = state.weave
          ? {
              ...state.weave,
              nodes: Object.values(nextNodes),
              edges: Object.values(nextEdges),
              metadata: { ...(state.weave.metadata ?? {}), ...(segment.metadata ?? {}) },
            }
          : {
              id: weaveId,
              name: 'Knowledge Graph',
              domain: 'default',
              nodes: Object.values(nextNodes),
              edges: Object.values(nextEdges),
              metadata: segment.metadata ?? {},
              metrics: undefined,
              communities: segment.clusters ?? [],
              created: new Date().toISOString(),
              modified: new Date().toISOString(),
            };

        return {
          weave: mergedWeave,
          nodes: nextNodes,
          edges: nextEdges,
          clusters: updatedClusters,
          loading: false,
          error: undefined,
          lastSegmentAt: Date.now(),
        };
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load graph segment';
      set({ loading: false, error: message });
      throw error;
    }
  },

  /**
   * Update the active weave (or aggregated view when null).
   */
  setActiveWeave: async (weaveId: string | null) => {
    await fetchWeaveSnapshot(set, get, weaveId);
  },

  /**
   * Replace the currently selected nodes.
   */
  selectNodes: (nodeIds: string[]) => {
    set((state) => ({ selection: { nodes: Array.from(new Set(nodeIds)), edges: state.selection.edges } }));
  },

  /**
   * Replace the currently selected edges.
   */
  selectEdges: (edgeIds: string[]) => {
    set((state) => ({ selection: { nodes: state.selection.nodes, edges: Array.from(new Set(edgeIds)) } }));
  },

  /**
   * Clear both node and edge selections.
   */
  clearSelection: () => {
    set({ selection: { nodes: [], edges: [] } });
  },

  focusOnSelection: () => {
    const state = get();
    const nodeIds = state.selection.nodes.length
      ? state.selection.nodes
      : state.selection.edges.flatMap((edgeId) => {
          const edge = state.edges[edgeId];
          return edge ? [edge.source, edge.target] : [];
        });

    const uniqueNodeIds = Array.from(new Set(nodeIds.length ? nodeIds : Object.keys(state.nodes).slice(0, 1)));

    const positions = uniqueNodeIds
      .map((id) => state.nodes[id]?.position)
      .filter((position): position is { x: number; y: number; z?: number } => Boolean(position));

    if (!positions.length) {
      set({
        focusTarget: {
          center: { x: 0, y: 0, z: 0 },
          radius: 60,
          nonce: Date.now(),
          requestedAt: Date.now(),
        },
      });
      return;
    }

    const centerSum = positions.reduce(
      (acc, position) => ({
        x: acc.x + position.x,
        y: acc.y + position.y,
        z: acc.z + (position.z ?? 0)
      }),
      { x: 0, y: 0, z: 0 },
    );

    const center = {
      x: centerSum.x / positions.length,
      y: centerSum.y / positions.length,
      z: centerSum.z / positions.length
    };

    const radius = positions.reduce((max, position) => {
      const dx = position.x - center.x;
      const dy = position.y - center.y;
      const dz = (position.z ?? 0) - center.z;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
      return Math.max(max, distance);
    }, 20);

    set({
      focusTarget: {
        center,
        radius: Math.max(20, radius * 1.6),
        nonce: Date.now(),
        requestedAt: Date.now(),
      },
    });
  },

  requestFocus: ({ center, radius }) => {
    set({
      focusTarget: {
        center,
        radius: Math.max(20, radius ?? 80),
        nonce: Date.now(),
        requestedAt: Date.now(),
      },
    });
  },

  acknowledgeFocus: (nonce: number) => {
    set((state) => {
      if (!state.focusTarget || state.focusTarget.nonce !== nonce) {
        return {};
      }
      return { focusTarget: null };
    });
  },

  /**
   * Open the inline composer for the provided node.
   */
  openComposerForNode: (nodeId: string) => {
    const state = get();
    const node = state.nodes[nodeId];
    if (!node) {
      console.warn('Attempted to open composer for missing node', nodeId);
      return;
    }

    const update: Partial<KnowledgeGraphState> = {
      composerNodeId: nodeId,
    };

    if (node.position) {
      update.focusTarget = {
        center: {
          x: node.position.x,
          y: node.position.y,
          z: node.position.z ?? 0,
        },
        radius: Math.max(20, Math.abs(node.importance ?? 1) * 18),
        nonce: Date.now(),
        requestedAt: Date.now(),
      };
    }

    set(update);
  },

  closeComposer: () => {
    set({ composerNodeId: null });
  },

  createNode: async (input: WeaveNodeInput) => {
    const { weaveId, readOnly } = get();
    if (readOnly || !weaveId) {
      throw new Error('Knowledge graph is in read-only mode. Select or create a workspace weave to edit.');
    }

    set({ loading: true, error: undefined });

    try {
      const { weave, node } = await weaveAPI.createNode(weaveId, input);
      applyWeaveSnapshot(set, get, weave);
      set({ selection: { nodes: [node.id], edges: [] } });
      const created = get().nodes[node.id];
      if (!created) {
        throw new Error('Failed to resolve created node');
      }
      return created;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create node';
      set({ loading: false, error: message });
      throw error;
    }
  },

  updateNode: async (nodeId: string, input: WeaveNodeUpdateInput) => {
    const { weaveId, readOnly } = get();
    if (readOnly || !weaveId) {
      throw new Error('Knowledge graph is in read-only mode. Select or create a workspace weave to edit.');
    }

    set({ loading: true, error: undefined });

    try {
      const { weave, node } = await weaveAPI.updateNode(weaveId, nodeId, input);
      applyWeaveSnapshot(set, get, weave);
      const updated = get().nodes[node.id];
      if (!updated) {
        throw new Error('Failed to resolve updated node');
      }
      return updated;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update node';
      set({ loading: false, error: message });
      throw error;
    }
  },

  deleteNode: async (nodeId: string) => {
    const { weaveId, readOnly } = get();
    if (readOnly || !weaveId) {
      throw new Error('Knowledge graph is in read-only mode. Select or create a workspace weave to edit.');
    }

    set({ loading: true, error: undefined });

    try {
      const { weave } = await weaveAPI.deleteNode(weaveId, nodeId);
      applyWeaveSnapshot(set, get, weave);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete node';
      set({ loading: false, error: message });
      throw error;
    }
  },

  createEdge: async (input: WeaveEdgeInput) => {
    const { weaveId, readOnly } = get();
    if (readOnly || !weaveId) {
      throw new Error('Knowledge graph is in read-only mode. Select or create a workspace weave to edit.');
    }

    set({ loading: true, error: undefined });

    try {
      const { weave, edge } = await weaveAPI.createEdge(weaveId, input);
      applyWeaveSnapshot(set, get, weave);
      const edgeKey = edge.id ?? `${edge.source}->${edge.target}:${edge.type}`;
      const created = get().edges[edgeKey];
      if (!created) {
        throw new Error('Failed to resolve created edge');
      }
      return created;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create edge';
      set({ loading: false, error: message });
      throw error;
    }
  },

  updateEdge: async (edgeId: string, input: WeaveEdgeUpdateInput) => {
    const { weaveId, readOnly } = get();
    if (readOnly || !weaveId) {
      throw new Error('Knowledge graph is in read-only mode. Select or create a workspace weave to edit.');
    }

    set({ loading: true, error: undefined });

    try {
      const { weave, edge } = await weaveAPI.updateEdge(weaveId, edgeId, input);
      applyWeaveSnapshot(set, get, weave);
      const edgeKey = edge.id ?? `${edge.source}->${edge.target}:${edge.type}`;
      const updated = get().edges[edgeKey];
      if (!updated) {
        throw new Error('Failed to resolve updated edge');
      }
      return updated;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update edge';
      set({ loading: false, error: message });
      throw error;
    }
  },

  deleteEdge: async (edgeId: string) => {
    const { weaveId, readOnly } = get();
    if (readOnly || !weaveId) {
      throw new Error('Knowledge graph is in read-only mode. Select or create a workspace weave to edit.');
    }

    set({ loading: true, error: undefined });

    try {
      const { weave } = await weaveAPI.deleteEdge(weaveId, edgeId);
      applyWeaveSnapshot(set, get, weave);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete edge';
      set({ loading: false, error: message });
      throw error;
    }
  },

  setClusteringEnabled: (enabled: boolean) => {
    set({ clusteringEnabled: enabled });
    const { weave } = get();
    if (weave) {
      applyWeaveSnapshot(set, get, weave);
    }
  },

  /**
   * Snapshot the latest viewport sample (camera target + radius) for telemetry.
   */
  updateViewportSample: (sample: ViewportSample) => {
    set({ viewportSample: sample });
  },

  clearError: () => set({ error: undefined }),
}));


