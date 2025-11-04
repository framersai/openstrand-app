import { useMemo, useEffect, useRef, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Line, Html } from '@react-three/drei';
import * as THREE from 'three';
import { OrbitControls as OrbitControlsImpl } from 'three/examples/jsm/controls/OrbitControls';

import { useKnowledgeGraphStore } from '@/store/knowledge-graph.store';

const NODE_TYPE_COLORS: Record<string, string> = {
  dataset: '#3B82F6',
  document: '#10B981',
  visualization: '#8B5CF6',
  note: '#F59E0B',
  media: '#EC4899',
  exercise: '#EF4444',
  concept: '#22D3EE',
};

const EDGE_TYPE_COLORS: Record<string, string> = {
  prerequisite: '#F97316',
  related: '#60A5FA',
  'part-of': '#34D399',
  references: '#A78BFA',
  visualizes: '#FBBF24',
  extends: '#9CA3AF',
};

const DEFAULT_NODE_COLOR = '#38BDF8';
const DEFAULT_EDGE_COLOR = '#9CA3AF';

interface KnowledgeGraphSceneProps {
  width: number;
  height: number;
  showLabels?: boolean;
  onNodeSelected?: (nodeId: string) => void;
  onEdgeSelected?: (edgeId: string) => void;
}

type Vector3Tuple = [number, number, number];

const buildFallbackLayout = (ids: string[]): Record<string, Vector3Tuple> => {
  const radius = Math.max(20, ids.length * 1.5);
  return ids.reduce<Record<string, Vector3Tuple>>((acc, id, index) => {
    const angle = (index / Math.max(1, ids.length)) * Math.PI * 2;
    const y = (index % 5) * 4 - 8;
    acc[id] = [Math.cos(angle) * radius, y, Math.sin(angle) * radius];
    return acc;
  }, {});
};

const normalizePosition = (value?: { x: number; y: number; z?: number }): Vector3Tuple | undefined => {
  if (!value) return undefined;
  return [value.x ?? 0, value.y ?? 0, value.z ?? 0];
};

const useGraphGeometry = () => {
  const { nodes, edges, selection } = useKnowledgeGraphStore((state) => ({
    nodes: state.nodes,
    edges: state.edges,
    selection: state.selection,
  }));

  const { nodePositions, edgeSegments, clusterLookup, nodeMap } = useMemo(() => {
    const nodeEntries = Object.values(nodes);
    const edgeEntries = Object.values(edges);

    const nodeMap = new Map(nodeEntries.map((node) => [node.id, node] as const));
    const fallbackPositions = buildFallbackLayout(nodeEntries.map((node) => node.id));
    const positions: Record<string, Vector3Tuple> = {};

    nodeEntries.forEach((node) => {
      const position = normalizePosition(node.position)
        ?? normalizePosition(node.metadata?.position as { x: number; y: number; z?: number })
        ?? fallbackPositions[node.id];
      positions[node.id] = position ?? [0, 0, 0];
    });

    const edgeSegments = edgeEntries.map((edge) => {
      const source = positions[edge.source];
      const target = positions[edge.target];
      return {
        id: edge.id ?? `${edge.source}::${edge.target}::${edge.type}`,
        edge,
        source,
        target,
      };
    }).filter((segment) => segment.source && segment.target);

    const clusterLookup = new Map<string, string>();
    nodeEntries.forEach((node) => {
      if (node.clusterId) {
        clusterLookup.set(node.id, node.clusterId);
      }
    });

    return { nodePositions: positions, edgeSegments, clusterLookup, nodeMap };
  }, [nodes, edges]);

  return { nodePositions, edgeSegments, clusterLookup, selection, nodeMap };
};

const NodeMesh = ({
  id,
  position,
  type,
  title,
  summary,
  importance,
  clusterId,
  isSelected,
  isHighlighted,
  showLabels,
  onSelect,
}: {
  id: string;
  position: Vector3Tuple;
  type: string;
  title: string;
  summary?: string;
  importance: number;
  clusterId?: string;
  isSelected: boolean;
  isHighlighted: boolean;
  showLabels: boolean;
  onSelect: (id: string) => void;
}) => {
  const size = Math.max(1.6, Math.sqrt(Math.max(importance, 0.5)) * 1.8);
  const color = NODE_TYPE_COLORS[type] ?? DEFAULT_NODE_COLOR;
  const highlightColor = new THREE.Color(color).offsetHSL(0, 0, 0.2).getStyle();
  const baseColor = isSelected || isHighlighted ? highlightColor : color;
  const outlineWidth = isSelected ? 0.38 : 0.22;

  return (
    <group position={position}>
      <mesh
        onPointerDown={(event) => {
          event.stopPropagation();
          onSelect(id);
        }}
      >
        <sphereGeometry args={[size, 32, 32]} />
        <meshStandardMaterial
          color={baseColor}
          emissive={isSelected ? '#FACC15' : '#0F172A'}
          emissiveIntensity={isSelected ? 0.45 : 0.08}
          roughness={0.45}
          metalness={0.15}
        />
      </mesh>
      <mesh scale={1 + outlineWidth}>
        <sphereGeometry args={[size, 32, 32]} />
        <meshBasicMaterial
          color={clusterId ? new THREE.Color(baseColor).offsetHSL(0, 0, 0.1) : '#1E293B'}
          wireframe
          transparent
          opacity={isSelected ? 0.6 : 0.35}
        />
      </mesh>
      {showLabels && (
        <Html distanceFactor={12} position={[0, size * 1.6, 0]} center>
          <div className="rounded-full border border-border/60 bg-background/95 px-3 py-1 text-xs shadow-lg">
            <p className="font-medium text-foreground">{title}</p>
            {summary && <p className="mt-0.5 text-[11px] text-muted-foreground line-clamp-2">{summary}</p>}
          </div>
        </Html>
      )}
    </group>
  );
};

const EdgeSegment = ({
  id,
  source,
  target,
  type,
  weight,
  selected,
  onSelect,
}: {
  id: string;
  source: Vector3Tuple;
  target: Vector3Tuple;
  type: string;
  weight: number;
  selected: boolean;
  onSelect: (edgeId: string) => void;
}) => {
  const points = useMemo(() => [source, target], [source, target]);
  const color = EDGE_TYPE_COLORS[type] ?? DEFAULT_EDGE_COLOR;
  const thickness = Math.max(0.05, Math.min(0.4, weight / 4));

  return (
    <Line
      points={points}
      color={selected ? '#FACC15' : color}
      lineWidth={selected ? thickness * 4 : thickness * 2}
      transparent
      opacity={selected ? 1 : 0.65}
      onPointerDown={(event) => {
        event.stopPropagation();
        onSelect(id);
      }}
    />
  );
};

export function KnowledgeGraphScene({
  width,
  height,
  showLabels = true,
  onNodeSelected,
  onEdgeSelected,
}: KnowledgeGraphSceneProps) {
  const { nodePositions, edgeSegments, clusterLookup, selection, nodeMap } = useGraphGeometry();
  const {
    selectNodes,
    selectEdges,
    loadGraphSegment,
    readOnly,
    clusteringEnabled,
    updateViewportSample,
    focusTarget,
    acknowledgeFocus,
  } = useKnowledgeGraphStore((state) => ({
    selectNodes: state.selectNodes,
    selectEdges: state.selectEdges,
    loadGraphSegment: state.loadGraphSegment,
    readOnly: state.readOnly,
    clusteringEnabled: state.clusteringEnabled,
    updateViewportSample: state.updateViewportSample,
    focusTarget: state.focusTarget,
    acknowledgeFocus: state.acknowledgeFocus,
  }));
  const hasRequestedSegmentRef = useRef(false);
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const pendingSegmentRef = useRef(false);
  const lastBoundsRef = useRef<{ center: THREE.Vector3; radius: number } | null>(null);
  const lastRequestAtRef = useRef(0);
  const lastViewportUpdateRef = useRef(0);
  const lastClusteringStateRef = useRef(clusteringEnabled);

  /**
   * Reset incremental loading caches whenever clustering toggles so the next frame fetches a fresh segment.
   */
  useEffect(() => {
    if (lastClusteringStateRef.current === clusteringEnabled) {
      return;
    }
    lastClusteringStateRef.current = clusteringEnabled;
    lastBoundsRef.current = null;
    lastRequestAtRef.current = Number.NEGATIVE_INFINITY;
  }, [clusteringEnabled]);

  useEffect(() => {
    if (!hasRequestedSegmentRef.current) {
      hasRequestedSegmentRef.current = true;
      void loadGraphSegment({ limit: 600, cluster: true }).catch((err) => {
        console.error('Failed to load graph segment', err);
      });
    }
  }, [loadGraphSegment]);

  const handleNodeSelect = useCallback(
    (nodeId: string) => {
      selectNodes([nodeId]);
      selectEdges([]);
      onNodeSelected?.(nodeId);
    },
    [selectNodes, selectEdges, onNodeSelected],
  );

  const handleEdgeSelect = useCallback(
    (edgeId: string) => {
      selectEdges([edgeId]);
      onEdgeSelected?.(edgeId);
    },
    [selectEdges, onEdgeSelected],
  );

  const selectionSet = useMemo(() => new Set(selection.nodes), [selection.nodes]);
  const edgeSelectionSet = useMemo(() => new Set(selection.edges), [selection.edges]);
  const highlightedNodeSet = useMemo(() => {
    if (!selection.edges.length) {
      return new Set<string>();
    }
    const related = new Set<string>();
    selection.edges.forEach((edgeId) => {
      const segment = edgeSegments.find((entry) => entry.id === edgeId);
      if (segment) {
        related.add(segment.edge.source);
        related.add(segment.edge.target);
      }
    });
    return related;
  }, [selection.edges, edgeSegments]);

  const showLabelsComputed = showLabels && !readOnly;

  useFrame((state, delta) => {
    if (readOnly || !controlsRef.current) {
      return;
    }

    const now = state.clock.elapsedTime;
    if (pendingSegmentRef.current || now - lastRequestAtRef.current < 0.45) {
      return;
    }

    const { target } = controlsRef.current;
    const camera = state.camera;
    const distance = camera.position.distanceTo(target);
    const radius = Math.min(320, Math.max(40, distance * 1.45));
    const center = new THREE.Vector3(target.x, target.y, target.z);

    const elapsedSinceViewportUpdate = now - lastViewportUpdateRef.current;
    if (elapsedSinceViewportUpdate > 0.18) {
      lastViewportUpdateRef.current = now;
      updateViewportSample({
        center: { x: center.x, y: center.y, z: center.z },
        radius,
        distance,
        updatedAt: Date.now(),
      });
    }

    const last = lastBoundsRef.current;
    const shouldRequest = !last
      || center.distanceTo(last.center) > radius * 0.35
      || Math.abs(radius - last.radius) > radius * 0.25;

    if (!shouldRequest) {
      return;
    }

    pendingSegmentRef.current = true;
    lastRequestAtRef.current = now;
    lastBoundsRef.current = { center, radius };

    void loadGraphSegment({
      bounds: {
        center: { x: center.x, y: center.y, z: center.z },
        radius,
      },
      cluster: clusteringEnabled,
      limit: 480,
    })
      .catch((error) => {
        console.error('Incremental graph load failed', error);
        lastBoundsRef.current = null;
        lastRequestAtRef.current = Number.NEGATIVE_INFINITY;
      })
      .finally(() => {
        pendingSegmentRef.current = false;
      });
  }, 1);

  useEffect(() => {
    if (!focusTarget || !controlsRef.current) {
      return;
    }

    const controls = controlsRef.current;
    const camera = controls.object as THREE.PerspectiveCamera;
    const startTarget = controls.target.clone();
    const startPosition = camera.position.clone();
    const direction = new THREE.Vector3().subVectors(startPosition, startTarget);
    if (direction.lengthSq() < 1e-6) {
      direction.set(0, 0, 1);
    }
    const endTarget = new THREE.Vector3(
      focusTarget.center.x,
      focusTarget.center.y,
      focusTarget.center.z,
    );
    const desiredDistance = Math.max(focusTarget.radius, 20) * 2.1;
    const endPosition = endTarget.clone().add(direction.normalize().multiplyScalar(desiredDistance));

    const targetDelta = endTarget.clone().sub(startTarget);
    const positionDelta = endPosition.clone().sub(startPosition);

    const duration = 700;
    const startTime = performance.now();
    let cancelled = false;
    const tempTarget = new THREE.Vector3();
    const tempPosition = new THREE.Vector3();

    const ease = (value: number) => value * value * (3 - 2 * value);

    const animate = (time: number) => {
      if (cancelled) {
        return;
      }
      const progress = Math.min(1, (time - startTime) / duration);
      const eased = ease(progress);

      tempTarget.copy(targetDelta).multiplyScalar(eased).add(startTarget);
      tempPosition.copy(positionDelta).multiplyScalar(eased).add(startPosition);

      controls.target.copy(tempTarget);
      camera.position.copy(tempPosition);
      controls.update();

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        acknowledgeFocus?.(focusTarget.nonce);
      }
    };

    requestAnimationFrame(animate);

    return () => {
      cancelled = true;
    };
  }, [focusTarget, acknowledgeFocus]);

  return (
    <div style={{ width: `${width}px`, height: `${height}px` }}>
      <Canvas
        shadows
        camera={{ position: [0, 40, 110], fov: 45, near: 0.1, far: 1000 }}
        style={{ background: 'linear-gradient(180deg, #0f172a 0%, #020617 100%)', borderRadius: '24px' }}
      >
        <color attach="background" args={[0.05, 0.08, 0.12]} />
        <fog attach="fog" args={[0x020617, 120, 420]} />

        <ambientLight intensity={0.6} />
        <directionalLight
          position={[80, 120, 120]}
          intensity={0.85}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <directionalLight position={[-90, -60, -40]} intensity={0.25} />

        <group>
          {edgeSegments.map(({ id, edge, source, target }) => (
            <EdgeSegment
              key={id}
              id={id}
              source={source}
              target={target}
              type={edge.type}
              weight={edge.weight ?? 1}
              selected={edgeSelectionSet.has(id)}
              onSelect={handleEdgeSelect}
            />
          ))}
        </group>

        <group>
          {Object.entries(nodePositions).map(([id, position]) => {
            const node = nodeMap.get(id);
            if (!node) return null;
            const isSelected = selectionSet.has(id);
            const isHighlighted = !isSelected && highlightedNodeSet.has(id);

            return (
              <NodeMesh
                key={id}
                id={id}
                position={position}
                type={node.type}
                title={node.title}
                summary={
                  typeof node.summary === 'string'
                    ? node.summary
                    : typeof node.metadata?.summary === 'string'
                      ? (node.metadata.summary as string)
                      : undefined
                }
                importance={Number.isFinite(node.importance) ? Number(node.importance) : 1}
                clusterId={clusterLookup.get(id)}
                isSelected={!!isSelected}
                isHighlighted={!!isHighlighted}
                showLabels={showLabelsComputed}
                onSelect={handleNodeSelect}
              />
            );
          })}
        </group>

        <gridHelper args={[600, 32, '#334155', '#1e293b']} position={[0, -40, 0]} />

        <OrbitControls
          ref={controlsRef}
          enablePan
          enableRotate
          enableZoom
          maxDistance={360}
          minDistance={20}
          dampingFactor={0.08}
          maxPolarAngle={Math.PI * 0.92}
          minPolarAngle={Math.PI * 0.1}
          makeDefault
        />
      </Canvas>
    </div>
  );
}
