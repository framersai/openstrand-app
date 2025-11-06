/**
 * WeaveViewer Component
 * Interactive knowledge graph visualization for OpenStrand
 * Shows relationships between all content types as a force-directed graph
 */

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ExportWizard } from '@/features/export/ExportWizard';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Download,
  Play,
  Pause,
  RefreshCw
} from 'lucide-react';

// Types
export interface WeaveNode {
  id: string;
  type: 'dataset' | 'document' | 'visualization' | 'note' | 'media' | 'exercise' | 'concept';
  title: string;
  summary?: string;
  importance: number;
  x?: number;
  y?: number;
  fx?: number;
  fy?: number;
  group?: string;
}

export interface WeaveEdge {
  source: string | WeaveNode;
  target: string | WeaveNode;
  type: 'prerequisite' | 'related' | 'part-of' | 'references' | 'visualizes' | 'extends';
  weight: number;
  description?: string;
}

export interface WeaveData {
  nodes: WeaveNode[];
  edges: WeaveEdge[];
  metrics?: {
    centrality: Record<string, number>;
    communities: string[][];
    density: number;
  };
}

interface WeaveViewerProps {
  data: WeaveData;
  width?: number;
  height?: number;
  onNodeClick?: (node: WeaveNode) => void;
  onEdgeClick?: (edge: WeaveEdge) => void;
  onNodeHover?: (node: WeaveNode | null) => void;
  selectedNodeId?: string;
  highlightedNodes?: string[];
  showLabels?: boolean;
}

// Color schemes for different content types
const NODE_COLORS: Record<string, string> = {
  dataset: '#3B82F6',      // Blue
  document: '#10B981',     // Green
  visualization: '#8B5CF6', // Purple
  note: '#F59E0B',         // Amber
  media: '#EC4899',        // Pink
  exercise: '#EF4444',     // Red
  concept: '#6B7280'       // Gray
};

// Icons for different content types
const NODE_ICONS: Record<string, string> = {
  dataset: '📊',
  document: '📄',
  visualization: '📈',
  note: '📝',
  media: '🖼️',
  exercise: '✏️',
  concept: '💡'
};

// Edge colors by relationship type
const EDGE_COLORS: Record<string, string> = {
  prerequisite: '#DC2626',  // Red - important
  related: '#3B82F6',       // Blue - connection
  'part-of': '#10B981',     // Green - hierarchy
  references: '#8B5CF6',    // Purple - citation
  visualizes: '#F59E0B',    // Amber - data viz
  extends: '#6B7280'        // Gray - extension
};

export const WeaveViewer: React.FC<WeaveViewerProps> = ({
  data,
  width = 1200,
  height = 800,
  onNodeClick,
  onEdgeClick,
  onNodeHover,
  selectedNodeId,
  highlightedNodes = [],
  showLabels = true
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const [simulation, setSimulation] = useState<d3.Simulation<WeaveNode, WeaveEdge> | null>(null);
  const [transform, setTransform] = useState<d3.ZoomTransform>(d3.zoomIdentity);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showEdgeTypes, setShowEdgeTypes] = useState<Record<string, boolean>>({
    prerequisite: true,
    related: true,
    'part-of': true,
    references: true,
    visualizes: true,
    extends: true
  });
  const [selectedCommunity, setSelectedCommunity] = useState<number>(-1);
  const [hoveredNode, setHoveredNode] = useState<WeaveNode | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const [showExport, setShowExport] = useState(false);

  // Initialize D3 force simulation
  useEffect(() => {
    if (!svgRef.current || !data.nodes.length) return;

    const svg = d3.select(svgRef.current);
    const g = svg.select('.graph-container');

    // Clear previous render
    g.selectAll('*').remove();
    svg.on('click', () => hideTooltip());
    svg.on('mouseleave', () => hideTooltip());

    // Create force simulation
    const sim = d3.forceSimulation<WeaveNode>(data.nodes)
      .force('link', d3.forceLink<WeaveNode, WeaveEdge>(data.edges)
        .id((d: any) => d.id)
        .distance(d => 150 / (d.weight || 1))
        .strength(d => d.weight || 0.5))
      .force('charge', d3.forceManyBody<WeaveNode>()
        .strength(d => -300 * (d.importance || 1))
        .distanceMax(500))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide<WeaveNode>()
        .radius(d => getNodeSize(d) + 5))
      .force('x', d3.forceX(width / 2).strength(0.05))
      .force('y', d3.forceY(height / 2).strength(0.05));

    setSimulation(sim);

    // Create edge lines
    const linkGroup = g.append('g')
      .attr('class', 'links')
      .attr('stroke-opacity', 0.4);

    const links = linkGroup.selectAll('line')
      .data(data.edges.filter(e => showEdgeTypes[e.type]))
      .enter().append('line')
      .attr('stroke-width', d => Math.sqrt(d.weight || 1) * 2)
      .attr('stroke', d => EDGE_COLORS[d.type] || '#9CA3AF')
      .attr('cursor', 'pointer')
      .on('click', (event, d) => {
        event.stopPropagation();
        hideTooltip();
        onEdgeClick?.(d);
      })
      .on('mouseenter', function(event, d) {
        d3.select(this)
          .attr('stroke-opacity', 1)
          .attr('stroke-width', Math.sqrt(d.weight || 1) * 4);

        // Show tooltip
        showTooltip(event, `${d.type}: ${d.description || ''}`);
      })
      .on('mouseleave', function(event, d) {
        d3.select(this)
          .attr('stroke-opacity', 0.4)
          .attr('stroke-width', Math.sqrt(d.weight || 1) * 2);

        hideTooltip();
      });

    // Create node groups
    const nodeGroup = g.append('g')
      .attr('class', 'nodes');

    const nodes = nodeGroup.selectAll('g')
      .data(data.nodes)
      .enter().append('g')
      .attr('cursor', 'pointer')
      .call(d3.drag<SVGGElement, WeaveNode>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended));

    // Add circles for nodes
    nodes.append('circle')
      .attr('r', d => getNodeSize(d))
      .attr('fill', d => {
        // Highlight selected node
        if (d.id === selectedNodeId) {
          return d3.color(NODE_COLORS[d.type])?.brighter(0.5)?.toString() || NODE_COLORS[d.type];
        }
        // Highlight nodes in selected community
        if (selectedCommunity >= 0 && data.metrics?.communities[selectedCommunity]?.includes(d.id)) {
          return d3.color(NODE_COLORS[d.type])?.brighter(0.3)?.toString() || NODE_COLORS[d.type];
        }
        // Highlight specified nodes
        if (highlightedNodes.includes(d.id)) {
          return d3.color(NODE_COLORS[d.type])?.brighter(0.2)?.toString() || NODE_COLORS[d.type];
        }
        return NODE_COLORS[d.type] || '#6B7280';
      })
      .attr('stroke', '#fff')
      .attr('stroke-width', d => d.id === selectedNodeId ? 4 : 2)
      .attr('opacity', d => {
        if (hoveredNode && hoveredNode.id !== d.id) {
          // Check if connected to hovered node
          const connected = data.edges.some(e =>
            (e.source === hoveredNode.id && e.target === d.id) ||
            (e.target === hoveredNode.id && e.source === d.id) ||
            ((e.source as WeaveNode).id === hoveredNode.id && (e.target as WeaveNode).id === d.id) ||
            ((e.target as WeaveNode).id === hoveredNode.id && (e.source as WeaveNode).id === d.id)
          );
          return connected ? 1 : 0.3;
        }
        return 1;
      })
      .on('click', (event, d) => {
        event.stopPropagation();
        hideTooltip();
        onNodeClick?.(d);
      })
      .on('mouseenter', (event, d) => {
        setHoveredNode(d);
        onNodeHover?.(d);
        showTooltip(event, `${d.title}\n${d.summary || ''}`);
      })
      .on('mouseleave', () => {
        setHoveredNode(null);
        onNodeHover?.(null);
        hideTooltip();
      });

    // Add icons
    nodes.append('text')
      .attr('class', 'node-icon')
      .attr('text-anchor', 'middle')
      .attr('dy', '.35em')
      .attr('font-size', d => getNodeSize(d) * 0.8)
      .attr('pointer-events', 'none')
      .attr('user-select', 'none')
      .text(d => NODE_ICONS[d.type] || '📌');

    // Add labels
    if (showLabels) {
      nodes.append('text')
        .attr('class', 'node-label')
        .attr('dy', d => getNodeSize(d) + 15)
        .attr('text-anchor', 'middle')
        .attr('font-size', '12px')
        .attr('font-weight', 'bold')
        .attr('fill', '#374151')
        .attr('pointer-events', 'none')
        .attr('user-select', 'none')
        .text(d => d.title)
        .each(function(d) {
          // Truncate long labels
          const text = d3.select(this);
          const maxLength = 20;
          if (d.title.length > maxLength) {
            text.text(d.title.substring(0, maxLength) + '...');
          }
        });
    }

    // Update positions on tick
    sim.on('tick', () => {
      links
        .attr('x1', d => (d.source as WeaveNode).x!)
        .attr('y1', d => (d.source as WeaveNode).y!)
        .attr('x2', d => (d.target as WeaveNode).x!)
        .attr('y2', d => (d.target as WeaveNode).y!);

      nodes.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    // Drag functions
    function dragstarted(event: d3.D3DragEvent<SVGGElement, WeaveNode, WeaveNode>, d: WeaveNode) {
      if (!event.active && sim) sim.alphaTarget(0.3).restart();
      hideTooltip();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: d3.D3DragEvent<SVGGElement, WeaveNode, WeaveNode>, d: WeaveNode) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: d3.D3DragEvent<SVGGElement, WeaveNode, WeaveNode>, d: WeaveNode) {
      if (!event.active && sim) sim.alphaTarget(0);
      // Keep node fixed if shift key is held
      if (!event.sourceEvent.shiftKey) {
        d.fx = null;
        d.fy = null;
      }
    }

    return () => {
      sim.stop();
      svg.on('click', null);
      svg.on('mouseleave', null);
    };
  }, [data, width, height, showEdgeTypes, showLabels, selectedNodeId, highlightedNodes, hoveredNode, onNodeClick, onEdgeClick, onNodeHover, selectedCommunity]);

  // Zoom setup
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const g = svg.select('.graph-container');

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 10])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
        setTransform(event.transform);
      });

    zoomRef.current = zoom;
    svg.call(zoom);

    return () => {
      svg.on('.zoom', null);
    };
  }, []);

  useEffect(() => {
    return () => {
      hideTooltip(true);
    };
  }, []);

  useEffect(() => {
    if (!svgRef.current || !zoomRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.call(zoomRef.current.transform, transform);
  }, [transform]);

  // Helper functions
  const ensureTooltip = () => {
    if (tooltipRef.current) {
      return tooltipRef.current;
    }

    const tooltip = document.createElement('div');
    tooltip.className = 'weave-tooltip';
    Object.assign(tooltip.style, {
      position: 'fixed',
      zIndex: '1000',
      pointerEvents: 'none',
      padding: '10px 12px',
      background: 'rgba(15, 23, 42, 0.88)',
      color: '#F8FAFC',
      borderRadius: '8px',
      boxShadow: '0 16px 40px rgba(15, 23, 42, 0.35)',
      fontSize: '12px',
      lineHeight: '1.45',
      maxWidth: '260px',
      whiteSpace: 'pre-wrap' as const,
      opacity: '0',
      transition: 'opacity 120ms ease-out',
      display: 'none',
    });

    document.body.appendChild(tooltip);
    tooltipRef.current = tooltip;
    return tooltip;
  };

  const getNodeSize = (node: WeaveNode): number => {
    const baseSize = 20;
    const importanceScale = node.importance || 1;
    return baseSize * Math.sqrt(importanceScale);
  };

  const showTooltip = (event: MouseEvent, text: string) => {
    const tooltip = ensureTooltip();
    const pageX = event.pageX ?? 0;
    const pageY = event.pageY ?? 0;
    const offsetX = 18;
    const offsetY = 14;
    const padding = 24;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const left = Math.min(viewportWidth - padding, pageX + offsetX);
    const top = Math.min(viewportHeight - padding, pageY + offsetY);

    tooltip.textContent = text;
    tooltip.style.display = 'block';
    tooltip.style.opacity = '1';
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
  };

  const hideTooltip = (remove: boolean = false) => {
    if (!tooltipRef.current) {
      return;
    }

    tooltipRef.current.style.opacity = '0';
    tooltipRef.current.style.display = 'none';

    if (remove) {
      tooltipRef.current.remove();
      tooltipRef.current = null;
    }
  };

  // Control functions
  const handleZoom = (direction: 'in' | 'out') => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    const zoom = d3.zoom<SVGSVGElement, unknown>();

    if (direction === 'in') {
      svg.transition().duration(300).call(zoom.scaleBy, 1.3);
    } else {
      svg.transition().duration(300).call(zoom.scaleBy, 0.7);
    }
  };

  const handleReset = () => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    const zoom = d3.zoom<SVGSVGElement, unknown>();

    svg.transition().duration(750)
      .call(zoom.transform, d3.zoomIdentity);
  };

  const handlePlayPause = () => {
    if (!simulation) return;

    if (isPlaying) {
      simulation.stop();
    } else {
      simulation.alpha(0.3).restart();
    }
    setIsPlaying(!isPlaying);
  };

  const handleReheat = () => {
    if (!simulation) return;
    simulation.alpha(1).restart();
  };

  const handleExport = () => {
    if (!svgRef.current) return;

    // Clone SVG and convert to blob
    const svgData = svgRef.current.outerHTML;
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);

    // Download
    const a = document.createElement('a');
    a.href = url;
    a.download = 'knowledge-graph.svg';
    a.click();

    URL.revokeObjectURL(url);
  };

  // Calculate statistics
  const stats = {
    nodeCount: data.nodes.length,
    edgeCount: data.edges.length,
    density: data.metrics?.density || (data.edges.length / (data.nodes.length * (data.nodes.length - 1))),
    communities: data.metrics?.communities?.length || 0
  };

  return (
    <div className="weave-viewer-container" ref={containerRef}>
      <Card className="p-4">
        {/* Controls */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleZoom('in')}
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleZoom('out')}
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleReset}
              title="Reset View"
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handlePlayPause}
              title={isPlaying ? 'Pause Simulation' : 'Play Simulation'}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleReheat}
              title="Reheat Simulation"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline" title="Export options">
                  <Download className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setShowExport(true); }}>Export…</DropdownMenuItem>
                <DropdownMenuItem onSelect={(e) => { e.preventDefault(); handleExport(); }}>Download SVG</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Statistics */}
          <div className="flex gap-4 text-sm text-gray-600">
            <span>Nodes: {stats.nodeCount}</span>
            <span>Edges: {stats.edgeCount}</span>
            <span>Density: {(stats.density * 100).toFixed(1)}%</span>
            <span>Communities: {stats.communities}</span>
          </div>
        </div>

        {/* Edge Type Filters */}
        <div className="flex gap-2 mb-4">
          <span className="text-sm font-medium mr-2">Show:</span>
          {Object.entries(EDGE_COLORS).map(([type, color]) => (
            <label key={type} className="flex items-center gap-1 cursor-pointer">
              <input
                type="checkbox"
                checked={showEdgeTypes[type]}
                onChange={(e) => setShowEdgeTypes({
                  ...showEdgeTypes,
                  [type]: e.target.checked
                })}
                className="w-3 h-3"
              />
              <span
                className="text-xs font-medium px-2 py-1 rounded"
                style={{ backgroundColor: color + '20', color }}
              >
                {type}
              </span>
            </label>
          ))}
        </div>

        {/* SVG Canvas */}
        <svg
          ref={svgRef}
          width={width}
          height={height}
          className="border border-gray-200 rounded-lg bg-gray-50"
          style={{ cursor: 'move' }}
        >
          <defs>
            {/* Arrow markers for directed edges */}
            {Object.entries(EDGE_COLORS).map(([type, color]) => (
              <marker
                key={type}
                id={`arrow-${type}`}
                viewBox="0 -5 10 10"
                refX="20"
                refY="0"
                markerWidth="6"
                markerHeight="6"
                orient="auto"
              >
                <path d="M0,-5L10,0L0,5" fill={color} />
              </marker>
            ))}
          </defs>
          <g className="graph-container" />
        </svg>

        {/* Legend */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-semibold mb-2">Legend</h4>
          <div className="grid grid-cols-4 gap-2">
            {Object.entries(NODE_COLORS).map(([type, color]) => (
              <div key={type} className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="text-xs capitalize">{type}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Community Selector */}
        {data.metrics?.communities && data.metrics.communities.length > 0 && (
          <div className="mt-4">
            <label className="text-sm font-medium">
              Highlight Community:
              <select
                className="ml-2 px-2 py-1 border rounded text-sm"
                value={selectedCommunity}
                onChange={(e) => setSelectedCommunity(Number(e.target.value))}
              >
                <option value={-1}>None</option>
                {data.metrics.communities.map((_, idx) => (
                  <option key={idx} value={idx}>
                    Community {idx + 1} ({data.metrics!.communities[idx].length} nodes)
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}
        {showExport && (
          <ExportWizard
            open={showExport}
            onClose={() => setShowExport(false)}
            svgElement={svgRef.current as unknown as SVGElement}
            defaultFilename={'knowledge-graph'}
          />
        )}
      </Card>
    </div>
  );
};

export default WeaveViewer;
