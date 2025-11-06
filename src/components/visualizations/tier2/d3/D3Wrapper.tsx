'use client';

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

interface D3WrapperProps {
  data: any;
  render: (svg: d3.Selection<SVGSVGElement, unknown, null, undefined>, data: any) => void;
  width?: number;
  height?: number;
  className?: string;
}

export function D3Wrapper({
  data,
  render,
  width = 800,
  height = 600,
  className = ''
}: D3WrapperProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width, height });

  // Update dimensions on container size change
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width: containerWidth } = containerRef.current.getBoundingClientRect();
        setDimensions({
          width: containerWidth || width,
          height: height
        });
      }
    };

    updateDimensions();
    const resizeObserver = new ResizeObserver(updateDimensions);
    const containerEl = containerRef.current;

    if (containerEl) {
      resizeObserver.observe(containerEl);
    }

    return () => {
      if (containerEl) {
        resizeObserver.unobserve(containerEl);
      }
    };
  }, [width, height]);

  // Render D3 visualization
  useEffect(() => {
    const svgElement = svgRef.current;
    if (!svgElement || !data) return;

    // Clear previous content
    d3.select(svgElement).selectAll('*').remove();

    // Create SVG selection
    const svg = d3.select(svgElement)
      .attr('width', dimensions.width)
      .attr('height', dimensions.height)
      .attr('viewBox', `0 0 ${dimensions.width} ${dimensions.height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');

    // Render visualization
    try {
      render(svg, data);
    } catch (error) {
      console.error('D3 rendering error:', error);
    }

    // Cleanup
    return () => {
      d3.select(svgElement).selectAll('*').remove();
    };
  }, [data, render, dimensions]);

  return (
    <div ref={containerRef} className={`w-full ${className}`}>
      <svg
        ref={svgRef}
        className="w-full h-full"
        style={{ maxHeight: `${height}px` }}
      />
    </div>
  );
}
