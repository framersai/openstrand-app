'use client';

import { useMemo } from 'react';
import * as d3 from 'd3';
import { D3Wrapper } from './D3Wrapper';

interface Node {
  id: string;
  group?: number;
  value?: number;
}

interface Link {
  source: string;
  target: string;
  value?: number;
}

interface ForceGraphProps {
  nodes: Node[];
  links: Link[];
  width?: number;
  height?: number;
  className?: string;
}

export default function D3ForceGraph({
  nodes,
  links,
  width = 800,
  height = 600,
  className = ''
}: ForceGraphProps) {
  const render = useMemo(() => {
    return (svg: d3.Selection<SVGSVGElement, unknown, null, undefined>) => {
      const color = d3.scaleOrdinal(d3.schemeCategory10);

      // Create simulation
      const simulation = d3.forceSimulation(nodes as any)
        .force('link', d3.forceLink(links).id((d: any) => d.id).distance(50))
        .force('charge', d3.forceManyBody().strength(-300))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide().radius((d: any) => Math.sqrt(d.value || 5) * 3 + 2));

      // Create container groups
      const g = svg.append('g');

      // Add zoom behavior
      const zoom = d3.zoom()
        .scaleExtent([0.1, 10])
        .on('zoom', (event) => {
          g.attr('transform', event.transform);
        });

      svg.call(zoom as any);

      // Add links
      const link = g.append('g')
        .attr('class', 'links')
        .selectAll('line')
        .data(links)
        .join('line')
        .attr('stroke', '#999')
        .attr('stroke-opacity', 0.6)
        .attr('stroke-width', (d: any) => Math.sqrt(d.value || 1));

      // Add nodes
      const node = g.append('g')
        .attr('class', 'nodes')
        .selectAll('g')
        .data(nodes)
        .join('g')
        .call(drag(simulation) as any);

      // Add circles to nodes
      node.append('circle')
        .attr('r', (d: any) => Math.sqrt(d.value || 5) * 3)
        .attr('fill', (d: any) => color(d.group || 0))
        .attr('stroke', '#fff')
        .attr('stroke-width', 1.5);

      // Add labels
      node.append('text')
        .text((d: any) => d.id)
        .attr('x', 0)
        .attr('y', 0)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('font-size', 10)
        .attr('fill', '#000')
        .attr('pointer-events', 'none');

      // Add tooltip
      const tooltip = d3.select('body').append('div')
        .attr('class', 'tooltip')
        .style('opacity', 0)
        .style('position', 'absolute')
        .style('padding', '10px')
        .style('background', 'rgba(0, 0, 0, 0.8)')
        .style('color', 'white')
        .style('border-radius', '5px')
        .style('pointer-events', 'none')
        .style('font-size', '12px');

      node
        .on('mouseover', function(event, d: any) {
          tooltip.transition()
            .duration(200)
            .style('opacity', .9);
          tooltip.html(`
            <strong>${d.id}</strong><br/>
            Group: ${d.group || 'N/A'}<br/>
            Value: ${d.value || 'N/A'}
          `)
            .style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY - 28) + 'px');
        })
        .on('mouseout', function() {
          tooltip.transition()
            .duration(500)
            .style('opacity', 0);
        });

      // Update positions on tick
      simulation.on('tick', () => {
        link
          .attr('x1', (d: any) => d.source.x)
          .attr('y1', (d: any) => d.source.y)
          .attr('x2', (d: any) => d.target.x)
          .attr('y2', (d: any) => d.target.y);

        node
          .attr('transform', (d: any) => `translate(${d.x},${d.y})`);
      });

      // Drag functionality
      function drag(simulation: any) {
        function dragstarted(event: any, d: any) {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        }

        function dragged(event: any, d: any) {
          d.fx = event.x;
          d.fy = event.y;
        }

        function dragended(event: any, d: any) {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        }

        return d3.drag()
          .on('start', dragstarted)
          .on('drag', dragged)
          .on('end', dragended);
      }

      // Cleanup tooltip on unmount
      return () => {
        d3.select('body').selectAll('.tooltip').remove();
      };
    };
  }, [nodes, links, width, height]);

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-lg p-4 ${className}`}>
      <h3 className="text-lg font-semibold mb-4">Force-Directed Graph</h3>
      <D3Wrapper
        data={{ nodes, links }}
        render={render}
        width={width}
        height={height}
        className="border border-gray-200 dark:border-gray-700 rounded"
      />
    </div>
  );
}