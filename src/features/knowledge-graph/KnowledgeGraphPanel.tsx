'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { KnowledgeGraphCanvas } from './components/KnowledgeGraphCanvas';
import { KnowledgeGraphInspector } from './components/KnowledgeGraphInspector';
import { KnowledgeGraphToolbar } from './components/KnowledgeGraphToolbar';
import { KnowledgeGraphComposerDialog } from './components/KnowledgeGraphComposerDialog';
import { useKnowledgeGraphStore } from '@/store/knowledge-graph.store';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface KnowledgeGraphPanelProps {
  className?: string;
  weaveId?: string | null;
  autoLoad?: boolean;
}

export function KnowledgeGraphPanel({ className, weaveId = null, autoLoad = true }: KnowledgeGraphPanelProps) {
  const {
    weave,
    loading,
    error,
    initialize,
    selectNodes,
    clearError,
  } = useKnowledgeGraphStore((state) => ({
    weave: state.weave,
    loading: state.loading,
    error: state.error,
    initialize: state.initialize,
    selectNodes: state.selectNodes,
    clearError: state.clearError,
  }));

  const initializedRef = useRef(false);
  const [canvasSize, setCanvasSize] = useState({ width: 960, height: 640 });
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!autoLoad || initializedRef.current) {
      return;
    }
    initializedRef.current = true;
    void initialize(weaveId).catch((err) => {
      console.error('Failed to initialise knowledge graph', err);
    });
  }, [autoLoad, initialize, weaveId]);

  useEffect(() => {
    const updateSize = () => {
      if (!containerRef.current) return;
      const { clientWidth, clientHeight } = containerRef.current;
      setCanvasSize({
        width: Math.max(720, clientWidth - 420),
        height: Math.max(480, clientHeight - 48),
      });
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const handleNodeSelected = useCallback(
    (nodeId: string) => {
      selectNodes([nodeId]);
    },
    [selectNodes],
  );

  const handleEdgeSelected = useCallback(() => {
    // Edge selection is handled internally by the store via KnowledgeGraphCanvas
  }, []);

  const graphLoaded = useMemo(() => !!weave && weave.nodes.length > 0, [weave]);

  return (
    <div ref={containerRef} className={className}>
      <div className="space-y-6">
        <KnowledgeGraphToolbar />

        {error && (
          <Alert variant="destructive" className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-4 w-4" />
            <div>
              <AlertTitle>Knowledge graph error</AlertTitle>
              <AlertDescription className="text-sm text-muted-foreground">{error}</AlertDescription>
            </div>
            <button
              type="button"
              className="ml-auto text-xs font-medium text-muted-foreground underline-offset-4 hover:underline"
              onClick={clearError}
            >
              dismiss
            </button>
          </Alert>
        )}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,_2fr)_minmax(320px,_1fr)]">
          <div className="relative min-h-[520px] overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-background via-primary/5 to-background p-4 shadow-2xl">
            {loading && !graphLoaded ? (
              <div className="flex h-full items-center justify-center">
                <Skeleton className="h-96 w-full" />
              </div>
            ) : weave ? (
              <KnowledgeGraphCanvas
                width={canvasSize.width}
                height={canvasSize.height}
                onNodeSelected={handleNodeSelected}
                onEdgeSelected={handleEdgeSelected}
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center space-y-2 text-sm text-muted-foreground">
                <p>No graph data available yet.</p>
                <p>Add strands and relationships to populate the knowledge graph.</p>
              </div>
            )}
          </div>

          <KnowledgeGraphInspector className="space-y-6" />
        </div>
      </div>

      <KnowledgeGraphComposerDialog />
    </div>
  );
}

export default KnowledgeGraphPanel;


