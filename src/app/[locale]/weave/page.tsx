'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { RefreshCw, Plus, FileText, Database, BarChart3, Brain, Cloud, Loader2 } from 'lucide-react';
import { useOpenStrandStore, useWeave, useLoading, useError, useCapabilities, useTopVisualizations, useTopDatasets } from '@/store/openstrand.store';
import type { Weave as StrandWeave } from '@/types/openstrand';
import type { WeaveData as ViewerWeaveData, WeaveNode as ViewerWeaveNode, WeaveEdge as ViewerWeaveEdge } from '@/components/weave/WeaveViewer';
import { logger } from '@/lib/logger';

// cSpell:ignore openstrand

// Dynamically import WeaveViewer to avoid SSR issues with D3
const WeaveViewer = dynamic(
  () => import('@/components/weave/WeaveViewer'),
  { ssr: false }
);

// Generate demo data for the knowledge graph
function generateDemoData(): ViewerWeaveData {
  const nodes: ViewerWeaveNode[] = [
    // Core concepts
    { id: 'c1', type: 'concept' as const, title: 'Machine Learning', importance: 1.0, summary: 'Core ML concepts and algorithms' },
    { id: 'c2', type: 'concept' as const, title: 'Data Science', importance: 0.9, summary: 'Data analysis and insights' },
    { id: 'c3', type: 'concept' as const, title: 'Programming', importance: 1.0, summary: 'Software development fundamentals' },
    { id: 'c4', type: 'concept' as const, title: 'Mathematics', importance: 0.8, summary: 'Mathematical foundations' },

    // Documents
    { id: 'd1', type: 'document' as const, title: 'Introduction to ML', importance: 0.7, summary: 'Beginner guide to machine learning' },
    { id: 'd2', type: 'document' as const, title: 'Python Basics', importance: 0.6, summary: 'Python programming fundamentals' },
    { id: 'd3', type: 'document' as const, title: 'Linear Algebra Guide', importance: 0.5, summary: 'Essential linear algebra concepts' },
    { id: 'd4', type: 'document' as const, title: 'Neural Networks', importance: 0.8, summary: 'Deep learning architectures' },
    { id: 'd5', type: 'document' as const, title: 'Data Preprocessing', importance: 0.6, summary: 'Cleaning and preparing data' },

    // Datasets
    { id: 'ds1', type: 'dataset' as const, title: 'Iris Dataset', importance: 0.4, summary: 'Classic classification dataset' },
    { id: 'ds2', type: 'dataset' as const, title: 'Sales Data 2024', importance: 0.5, summary: 'Company sales records' },
    { id: 'ds3', type: 'dataset' as const, title: 'Customer Reviews', importance: 0.6, summary: 'Product review sentiment data' },
    { id: 'ds4', type: 'dataset' as const, title: 'Stock Prices', importance: 0.7, summary: 'Historical stock market data' },

    // Visualizations
    { id: 'v1', type: 'visualization' as const, title: 'Sales Dashboard', importance: 0.6, summary: 'Interactive sales metrics' },
    { id: 'v2', type: 'visualization' as const, title: 'Model Performance', importance: 0.7, summary: 'ML model evaluation charts' },
    { id: 'v3', type: 'visualization' as const, title: 'Data Distribution', importance: 0.5, summary: 'Statistical distributions' },
    { id: 'v4', type: 'visualization' as const, title: 'Customer Segments', importance: 0.6, summary: 'Clustering visualization' },

    // Exercises
    { id: 'e1', type: 'exercise' as const, title: 'ML Quiz 1', importance: 0.3, summary: 'Test your ML knowledge' },
    { id: 'e2', type: 'exercise' as const, title: 'Python Exercises', importance: 0.4, summary: 'Practice Python coding' },
    { id: 'e3', type: 'exercise' as const, title: 'Data Analysis Task', importance: 0.5, summary: 'Hands-on data analysis' },

    // Notes
    { id: 'n1', type: 'note' as const, title: 'Meeting Notes', importance: 0.2, summary: 'Team discussion on ML project' },
    { id: 'n2', type: 'note' as const, title: 'Research Ideas', importance: 0.3, summary: 'Potential research directions' },

    // Media
    { id: 'm1', type: 'media' as const, title: 'ML Lecture Video', importance: 0.5, summary: 'Recorded lecture on ML basics' },
    { id: 'm2', type: 'media' as const, title: 'Architecture Diagram', importance: 0.4, summary: 'System architecture overview' }
  ];

  const edges: ViewerWeaveEdge[] = [
    // Concept relationships
    { source: 'c1', target: 'c2', type: 'related' as const, weight: 0.9 },
    { source: 'c1', target: 'c3', type: 'prerequisite' as const, weight: 0.8 },
    { source: 'c4', target: 'c1', type: 'prerequisite' as const, weight: 0.7 },
    { source: 'c3', target: 'c2', type: 'prerequisite' as const, weight: 0.6 },

    // Document relationships
    { source: 'd1', target: 'c1', type: 'part-of' as const, weight: 0.8 },
    { source: 'd2', target: 'c3', type: 'part-of' as const, weight: 0.9 },
    { source: 'd3', target: 'c4', type: 'part-of' as const, weight: 0.8 },
    { source: 'd4', target: 'd1', type: 'extends' as const, weight: 0.7 },
    { source: 'd5', target: 'c2', type: 'part-of' as const, weight: 0.6 },

    // Dataset relationships
    { source: 'ds1', target: 'd1', type: 'references' as const, weight: 0.7 },
    { source: 'ds2', target: 'v1', type: 'visualizes' as const, weight: 0.9 },
    { source: 'ds3', target: 'v4', type: 'visualizes' as const, weight: 0.8 },
    { source: 'ds4', target: 'c2', type: 'related' as const, weight: 0.5 },

    // Visualization relationships
    { source: 'v1', target: 'ds2', type: 'visualizes' as const, weight: 0.9 },
    { source: 'v2', target: 'd4', type: 'references' as const, weight: 0.7 },
    { source: 'v3', target: 'ds1', type: 'visualizes' as const, weight: 0.6 },
    { source: 'v4', target: 'ds3', type: 'visualizes' as const, weight: 0.8 },

    // Exercise relationships
    { source: 'e1', target: 'd1', type: 'references' as const, weight: 0.8 },
    { source: 'e2', target: 'd2', type: 'references' as const, weight: 0.9 },
    { source: 'e3', target: 'd5', type: 'references' as const, weight: 0.7 },

    // Note relationships
    { source: 'n1', target: 'c1', type: 'references' as const, weight: 0.4 },
    { source: 'n2', target: 'd4', type: 'related' as const, weight: 0.5 },

    // Media relationships
    { source: 'm1', target: 'd1', type: 'references' as const, weight: 0.7 },
    { source: 'm2', target: 'c1', type: 'visualizes' as const, weight: 0.6 },

    // Cross-type relationships
    { source: 'd1', target: 'e1', type: 'prerequisite' as const, weight: 0.8 },
    { source: 'd2', target: 'e2', type: 'prerequisite' as const, weight: 0.9 },
    { source: 'c3', target: 'd2', type: 'prerequisite' as const, weight: 0.7 },
    { source: 'c4', target: 'd3', type: 'prerequisite' as const, weight: 0.8 }
  ];

  // Detect communities (simplified - in real app this would use proper algorithms)
  const communities = [
    ['c1', 'd1', 'd4', 'e1', 'm1', 'v2'], // ML community
    ['c2', 'd5', 'ds2', 'ds3', 'v1', 'v4'], // Data Science community
    ['c3', 'd2', 'e2'], // Programming community
    ['c4', 'd3'], // Math community
    ['n1', 'n2'], // Notes community
    ['ds1', 'v3'], // Classic datasets community
    ['ds4'], // Financial data community
    ['m2'] // Architecture community
  ];

  // Calculate centrality (simplified)
  const centrality: Record<string, number> = {};
  nodes.forEach(node => {
    const connections = edges.filter(e => e.source === node.id || e.target === node.id).length;
    centrality[node.id] = connections / edges.length;
  });

  const nodeCount = nodes.length;
  const density = nodeCount > 1 ? edges.length / (nodeCount * (nodeCount - 1)) : 0;

  return {
    nodes,
    edges,
    metrics: {
      centrality,
      communities,
      density
    }
  };
}

function toViewerNodeType(type: string): ViewerWeaveNode['type'] {
  const allowed: ViewerWeaveNode['type'][] = [
    'dataset',
    'document',
    'visualization',
    'note',
    'media',
    'exercise',
    'concept'
  ];
  return (allowed.includes(type as ViewerWeaveNode['type']) ? type : 'concept') as ViewerWeaveNode['type'];
}

function toViewerEdgeType(type: string): ViewerWeaveEdge['type'] {
  const allowed: ViewerWeaveEdge['type'][] = [
    'prerequisite',
    'related',
    'part-of',
    'references',
    'visualizes',
    'extends'
  ];
  return (allowed.includes(type as ViewerWeaveEdge['type']) ? type : 'related') as ViewerWeaveEdge['type'];
}

function getMetadataString(metadata: Record<string, unknown> | undefined, key: string): string | undefined {
  if (!metadata) return undefined;
  const value = metadata[key];
  return typeof value === 'string' ? value : undefined;
}

function getMetadataNumber(metadata: Record<string, unknown> | undefined, key: string): number | undefined {
  if (!metadata) return undefined;
  const value = metadata[key];
  return typeof value === 'number' ? value : undefined;
}

function convertWeaveToViewerData(weave: StrandWeave): ViewerWeaveData {
  const nodes: ViewerWeaveNode[] = weave.nodes.map(node => ({
    id: node.id,
    type: toViewerNodeType(node.type),
    title: node.title,
    summary: getMetadataString(node.metadata, 'summary')
      ?? getMetadataString(node.metadata, 'description')
      ?? '',
    importance: typeof node.importance === 'number'
      ? node.importance
      : getMetadataNumber(node.metadata, 'importance') ?? 0.5,
    group: getMetadataString(node.metadata, 'group'),
    metadata: node.metadata
  }));

  const edges: ViewerWeaveEdge[] = weave.edges.map(edge => ({
    source: edge.source,
    target: edge.target,
    type: toViewerEdgeType(edge.type),
    weight: edge.weight ?? 1,
    description: getMetadataString(edge.metadata, 'description')
      ?? getMetadataString(edge.metadata, 'label')
  }));

  const centrality = (weave.metrics?.centrality as Record<string, number> | undefined) ?? {};
  const communities = weave.metrics?.communities ?? [];
  const density = typeof weave.metrics?.density === 'number' ? weave.metrics.density : 0;

  return {
    nodes,
    edges,
    metrics: {
      centrality,
      communities,
      density
    }
  };
}

export default function WeavePage() {
  // State management
  const [useRealData, setUseRealData] = useState<boolean>(false);
  const [demoData, setDemoData] = useState<ViewerWeaveData>(generateDemoData);
  const [selectedNode, setSelectedNode] = useState<ViewerWeaveNode | null>(null);
  const [highlightedNodes, setHighlightedNodes] = useState<string[]>([]);

  // Store hooks
  const { loadWeave, getRecommendations, loadCapabilities, loadTopVisualizations, loadTopDatasets } = useOpenStrandStore();
  const weave = useWeave();
  const loading = useLoading();
  const error = useError();
  const capabilities = useCapabilities();
  const topVisualizations = useTopVisualizations();
  const topDatasets = useTopDatasets();

  // Get weave data based on mode
  const canUseRealData = capabilities ? capabilities.dynamicVisualizations : true;
  const weaveData: ViewerWeaveData = useRealData && weave
    ? convertWeaveToViewerData(weave)
    : demoData;
  const communityCount = weaveData.metrics ? weaveData.metrics.communities.length : 0;
  const graphDensity = weaveData.metrics ? weaveData.metrics.density : 0;

  // Load real data when toggled
  useEffect(() => {
    void loadCapabilities();
  }, [loadCapabilities]);

  useEffect(() => {
    if (capabilities?.topContent) {
      if (topVisualizations.length === 0) {
        void loadTopVisualizations();
      }
      if (topDatasets.length === 0) {
        void loadTopDatasets();
      }
    }
  }, [capabilities, loadTopVisualizations, loadTopDatasets, topVisualizations.length, topDatasets.length]);

  useEffect(() => {
    if (!canUseRealData && useRealData) {
      setUseRealData(false);
    }
  }, [canUseRealData, useRealData]);

  useEffect(() => {
    if (useRealData && canUseRealData && !weave) {
      loadWeave();
    }
  }, [useRealData, canUseRealData, weave, loadWeave]);

  const handleNodeClick = (node: ViewerWeaveNode) => {
    logger.debug('Node clicked:', node);
    setSelectedNode(node);

    // Highlight connected nodes
    const connected = weaveData.edges
      .filter(edge => {
        const sourceId = typeof edge.source === 'string' ? edge.source : edge.source.id;
        const targetId = typeof edge.target === 'string' ? edge.target : edge.target.id;
        return sourceId === node.id || targetId === node.id;
      })
      .map(edge => {
        const sourceId = typeof edge.source === 'string' ? edge.source : edge.source.id;
        const targetId = typeof edge.target === 'string' ? edge.target : edge.target.id;
        return sourceId === node.id ? targetId : sourceId;
      });
    setHighlightedNodes(connected);
  };

  const handleEdgeClick = (edge: ViewerWeaveEdge) => {
    logger.debug('Edge clicked:', edge);
  };

  const handleRefresh = async () => {
    if (useRealData) {
      await loadWeave();
    } else {
      setDemoData(generateDemoData());
    }
    setSelectedNode(null);
    setHighlightedNodes([]);
  };

  const addRandomNode = () => {
    if (useRealData) {
      // In real mode, this would create a new strand
      alert('Creating new strands in real mode coming soon!');
      return;
    }

    const types: ViewerWeaveNode['type'][] = ['document', 'dataset', 'visualization', 'note', 'media', 'exercise'];
    const randomType = types[Math.floor(Math.random() * types.length)];
    const newNode: ViewerWeaveNode = {
      id: `new-${Date.now()}`,
      type: randomType,
      title: `New ${randomType}`,
      importance: Math.random(),
      summary: 'Newly added content'
    };

    // Add random edges
    const existingNodes = demoData.nodes;
    const newEdges: ViewerWeaveEdge[] = [];
    for (let i = 0; i < Math.min(3, existingNodes.length); i++) {
      const targetNode = existingNodes[Math.floor(Math.random() * existingNodes.length)];
      newEdges.push({
        source: newNode.id,
        target: targetNode.id,
        type: 'related' as const,
        weight: Math.random()
      });
    }

    setDemoData({
      ...demoData,
      nodes: [...demoData.nodes, newNode],
      edges: [...demoData.edges, ...newEdges]
    });
  };

  const handleGetRecommendations = async () => {
    if (!capabilities?.analysisPipeline) {
      return;
    }
    if (useRealData) {
      await getRecommendations();
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">Knowledge Graph Explorer</h1>
            <p className="text-gray-600">
              Interactive visualization of your OpenStrand knowledge weave.
              Explore relationships between documents, datasets, visualizations, and concepts.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {canUseRealData ? (
              <>
                <Label htmlFor="data-mode">Use Real Data</Label>
                <Switch
                  id="data-mode"
                  checked={useRealData}
                  onCheckedChange={setUseRealData}
                  disabled={!canUseRealData}
                />
                {useRealData && <Cloud className="w-4 h-4 text-blue-500" />}
              </>
            ) : (
              <span className="text-sm text-gray-500">Dynamic visualization is disabled on this plan.</span>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <p className="font-semibold">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-12 gap-6">
        {/* Main Graph */}
        <div className="col-span-9">
          {loading ? (
            <div className="flex items-center justify-center h-[600px] border rounded-lg bg-gray-50">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
                <p className="text-gray-600">Loading knowledge graph...</p>
              </div>
            </div>
          ) : (
            <WeaveViewer
              data={weaveData}
              width={900}
              height={600}
              onNodeClick={handleNodeClick}
              onEdgeClick={handleEdgeClick}
              selectedNodeId={selectedNode?.id}
              highlightedNodes={highlightedNodes}
              showLabels={true}
            />
          )}

          {/* Actions */}
          <div className="mt-4 flex gap-2">
            <Button onClick={handleRefresh} variant="outline" disabled={loading || (useRealData && !canUseRealData)}>
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              {useRealData ? 'Reload Graph' : 'Regenerate Graph'}
            </Button>
            <Button onClick={addRandomNode} variant="outline" disabled={loading}>
              <Plus className="w-4 h-4 mr-2" />
              Add Random Node
            </Button>
            {useRealData && capabilities?.analysisPipeline && (
              <Button onClick={handleGetRecommendations} variant="outline" disabled={loading}>
                <Brain className="w-4 h-4 mr-2" />
                Get Recommendations
              </Button>
            )}
          </div>
        </div>

        {/* Side Panel */}
        <div className="col-span-3 space-y-4">
          {/* Selected Node Details */}
          {selectedNode && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Selected Node</CardTitle>
              </CardHeader>
              <div className="p-4 space-y-2">
                <div className="flex items-center gap-2">
                  {selectedNode.type === 'document' && <FileText className="w-4 h-4" />}
                  {selectedNode.type === 'dataset' && <Database className="w-4 h-4" />}
                  {selectedNode.type === 'visualization' && <BarChart3 className="w-4 h-4" />}
                  {selectedNode.type === 'concept' && <Brain className="w-4 h-4" />}
                  <span className="font-medium">{selectedNode.title}</span>
                </div>
                <p className="text-sm text-gray-600">{selectedNode.summary}</p>
                <div className="pt-2 border-t">
                  <p className="text-xs text-gray-500">
                    Type: <span className="font-medium">{selectedNode.type}</span>
                  </p>
                  <p className="text-xs text-gray-500">
                    Importance: <span className="font-medium">{(selectedNode.importance * 100).toFixed(0)}%</span>
                  </p>
                  <p className="text-xs text-gray-500">
                    Connections: <span className="font-medium">{highlightedNodes.length}</span>
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Graph Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Graph Statistics</CardTitle>
            </CardHeader>
            <div className="p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Nodes:</span>
                <span className="font-medium">{weaveData.nodes.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Edges:</span>
                <span className="font-medium">{weaveData.edges.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Communities:</span>
                <span className="font-medium">{communityCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Graph Density:</span>
                <span className="font-medium">
                  {(graphDensity * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </Card>

          {/* Top Content */}
          {capabilities?.topContent && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Top Content</CardTitle>
              </CardHeader>
              <div className="p-4 space-y-4 text-sm">
                <div>
                  <p className="font-medium mb-2">Visualizations</p>
                  {topVisualizations.length === 0 ? (
                    <p className="text-gray-500">No visualizations ranked yet.</p>
                  ) : (
                    <ul className="space-y-1">
                      {topVisualizations.slice(0, 5).map(item => (
                        <li key={item.id} className="flex justify-between">
                          <span className="text-gray-700 truncate pr-2">{item.title}</span>
                          <span className="text-gray-500 text-xs">{(item.quality?.composite_score ?? 0).toFixed(1)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div>
                  <p className="font-medium mb-2">Datasets</p>
                  {topDatasets.length === 0 ? (
                    <p className="text-gray-500">No datasets ranked yet.</p>
                  ) : (
                    <ul className="space-y-1">
                      {topDatasets.slice(0, 5).map(item => (
                        <li key={item.id} className="flex justify-between">
                          <span className="text-gray-700 truncate pr-2">{item.title}</span>
                          <span className="text-gray-500 text-xs">{item.metadata?.concepts?.length ?? 0} concepts</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* Content Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Content Distribution</CardTitle>
            </CardHeader>
            <div className="p-4 space-y-2 text-sm">
              {(['document', 'dataset', 'visualization', 'exercise', 'note', 'media', 'concept'] as ViewerWeaveNode['type'][]).map(type => {
                const count = weaveData.nodes.filter(n => n.type === type).length;
                return (
                  <div key={type} className="flex justify-between">
                    <span className="text-gray-600 capitalize">{type}s:</span>
                    <span className="font-medium">{count}</span>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">How to Use</CardTitle>
            </CardHeader>
            <div className="p-4 space-y-2 text-sm text-gray-600">
              <p>• Click and drag nodes to reposition</p>
              <p>• Hold Shift while dragging to fix position</p>
              <p>• Click nodes to see connections</p>
              <p>• Use edge filters to focus on specific relationships</p>
              <p>• Zoom and pan to explore large graphs</p>
              <p>• Export as SVG for presentations</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
