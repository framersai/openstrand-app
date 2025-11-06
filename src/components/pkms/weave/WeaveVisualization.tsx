'use client';

import { useEffect, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, RefreshCw, Info, AlertCircle } from 'lucide-react';

import { useKnowledgeGraphStore } from '@/store/knowledge-graph.store';
import { useOpenStrandStore, useCapabilities } from '@/store/openstrand.store';
import { useSupabase } from '@/features/auth';
import { KnowledgeGraphPanel } from '@/features/knowledge-graph';

export function WeaveVisualization() {
  const { isAuthenticated, authEnabled } = useSupabase();
  const capabilities = useCapabilities();
  const loadCapabilities = useOpenStrandStore((state) => state.loadCapabilities);

  const {
    weave,
    loading,
    error,
    refresh,
    readOnly,
  } = useKnowledgeGraphStore((state) => ({
    weave: state.weave,
    loading: state.loading,
    error: state.error,
    refresh: state.refresh,
    readOnly: state.readOnly,
  }));

  useEffect(() => {
    if (!capabilities) {
      void loadCapabilities().catch((err) => {
        console.error('Failed to load capabilities', err);
      });
    }
  }, [capabilities, loadCapabilities]);

  const stats = useMemo(() => {
    const nodeCount = weave?.nodes.length ?? 0;
    const edgeCount = weave?.edges.length ?? 0;
    const densityBase = nodeCount > 1 ? nodeCount * (nodeCount - 1) : 1;
    const density = edgeCount / densityBase;
    const communities = weave?.communities?.length ?? 0;

    return {
      nodeCount,
      edgeCount,
      density: Number.isFinite(density) ? Math.min(1, density) : 0,
      communities,
    };
  }, [weave]);

  const infoMessage = useMemo(() => {
    if (loading && !weave) {
      return 'Loading live knowledge graph…';
    }
    if (!isAuthenticated && authEnabled) {
      return 'Sign in to explore the live knowledge graph for your workspace.';
    }
    if (capabilities && capabilities.knowledgeGraph === false) {
      return 'Knowledge graph capability is disabled for this deployment. Enable it in the backend configuration to stream live edges.';
    }
    if (weave && weave.nodes.length === 0) {
      return 'No strands have been linked yet. Add content or approve structure requests to populate the graph.';
    }
    return null;
  }, [loading, weave, isAuthenticated, authEnabled, capabilities]);

  const handleRefresh = () => {
    void refresh().catch((err) => {
      console.error('Failed to refresh knowledge graph', err);
    });
  };

  return (
    <section className="relative min-h-[720px] py-6">
      <div className="container mx-auto h-full px-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant={readOnly ? 'secondary' : 'outline'}>
              {readOnly ? 'Aggregated graph (read-only)' : 'Editable workspace weave'}
            </Badge>
            {loading && (
              <span className="flex items-center text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…
              </span>
            )}
            {infoMessage && (
              <div className="flex items-center gap-2 rounded-full bg-popover/80 px-3 py-1.5 text-xs text-muted-foreground shadow-sm">
                <Info className="h-3.5 w-3.5" /> {infoMessage}
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex flex-col text-right">
              <span className="font-semibold text-foreground">{stats.nodeCount}</span>
              <span>nodes</span>
            </div>
            <div className="flex flex-col text-right">
              <span className="font-semibold text-foreground">{stats.edgeCount}</span>
              <span>relations</span>
            </div>
            <div className="flex flex-col text-right">
              <span className="font-semibold text-foreground">{stats.density.toFixed(2)}</span>
              <span>density</span>
            </div>
            <div className="flex flex-col text-right">
              <span className="font-semibold text-foreground">{stats.communities}</span>
              <span>communities</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={loading}
            >
              <RefreshCw className="mr-2 h-4 w-4" /> Refresh
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Knowledge graph error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="mt-6 overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-background via-primary/5 to-background p-6 shadow-2xl">
          <KnowledgeGraphPanel
            className="h-full"
            autoLoad={capabilities ? capabilities.knowledgeGraph !== false : false}
          />
        </div>
      </div>
    </section>
  );
}
