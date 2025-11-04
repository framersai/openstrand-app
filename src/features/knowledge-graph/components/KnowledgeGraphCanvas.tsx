'use client';

import { memo } from 'react';

import { KnowledgeGraphScene } from './KnowledgeGraphScene';

interface KnowledgeGraphCanvasProps {
  width: number;
  height: number;
  showLabels?: boolean;
  onNodeSelected?: (nodeId: string) => void;
  onEdgeSelected?: (edgeId: string) => void;
}

export const KnowledgeGraphCanvas = memo(function KnowledgeGraphCanvas({
  width,
  height,
  showLabels = true,
  onNodeSelected,
  onEdgeSelected,
}: KnowledgeGraphCanvasProps) {
  return (
    <KnowledgeGraphScene
      width={width}
      height={height}
      showLabels={showLabels}
      onNodeSelected={onNodeSelected}
      onEdgeSelected={onEdgeSelected}
    />
  );
});


