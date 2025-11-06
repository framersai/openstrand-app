'use client';

import { useMemo, useState, useTransition } from 'react';
import { RefreshCw, GitBranch, Focus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useKnowledgeGraphStore } from '@/store/knowledge-graph.store';

interface KnowledgeGraphToolbarProps {
  className?: string;
}

export function KnowledgeGraphToolbar({ className }: KnowledgeGraphToolbarProps) {
  const [isPending, startTransition] = useTransition();
  const [localClusterToggle, setLocalClusterToggle] = useState<boolean | null>(null);

  const {
    availableWeaves,
    weaveId,
    readOnly,
    loading,
    clusteringEnabled,
    initialize,
    refresh,
    setActiveWeave,
    setClusteringEnabled,
    focusOnSelection,
    lastSegmentAt,
    viewportSample,
    selection,
  } = useKnowledgeGraphStore((state) => ({
    availableWeaves: state.availableWeaves,
    weaveId: state.weaveId,
    readOnly: state.readOnly,
    loading: state.loading,
    clusteringEnabled: state.clusteringEnabled,
    initialize: state.initialize,
    refresh: state.refresh,
    setActiveWeave: state.setActiveWeave,
    setClusteringEnabled: state.setClusteringEnabled,
    focusOnSelection: state.focusOnSelection,
    lastSegmentAt: state.lastSegmentAt,
    viewportSample: state.viewportSample,
    selection: state.selection,
  }));

  const weaveOptions = useMemo(() => availableWeaves.map((weave) => ({
    id: weave.id,
    name: weave.name,
  })), [availableWeaves]);

  const activeClusterToggle = localClusterToggle === null ? clusteringEnabled : localClusterToggle;

  const handleRefresh = () => {
    startTransition(async () => {
      try {
        if (!availableWeaves.length && readOnly) {
          await initialize(null);
          return;
        }
        await refresh();
      } catch (error) {
        console.error(error);
      }
    });
  };

  const handleWeaveChange = (value: string) => {
    startTransition(async () => {
      try {
        await setActiveWeave(value === 'aggregate' ? null : value);
      } catch (error) {
        console.error(error);
      }
    });
  };

  const handleClusterToggle = (checked: boolean) => {
    setLocalClusterToggle(checked);
    setClusteringEnabled(checked);
  };

  const isAggregate = readOnly || !weaveId;
  const hasSelection = selection.nodes.length > 0 || selection.edges.length > 0;

  const freshnessSeconds = lastSegmentAt ? Math.round((Date.now() - lastSegmentAt) / 1000) : null;
  const statusLabel = loading || isPending
    ? 'Streaming…'
    : freshnessSeconds !== null
      ? `Updated ${freshnessSeconds < 2 ? 'just now' : `${freshnessSeconds}s ago`}`
      : 'Idle';
  const statusVariant: 'secondary' | 'outline' | 'default' = loading || isPending
    ? 'secondary'
    : freshnessSeconds !== null && freshnessSeconds > 30
      ? 'outline'
      : 'default';

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border/60 bg-background/80 p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleRefresh}
            disabled={loading || isPending}
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={focusOnSelection}
            disabled={!hasSelection}
          >
            <Focus className="mr-2 h-4 w-4" /> Focus selection
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Clusters</span>
            <Switch
              checked={activeClusterToggle}
              onCheckedChange={handleClusterToggle}
              disabled={loading || isPending}
            />
          </div>
        </div>

        <Separator orientation="vertical" className="hidden h-6 md:block" />

        <div className="flex flex-1 flex-wrap items-center gap-2 md:justify-end">
          <Select
            value={isAggregate ? 'aggregate' : weaveId ?? 'aggregate'}
            onValueChange={handleWeaveChange}
            disabled={loading || isPending}
          >
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Select weave" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="aggregate">
                <div className="flex items-center gap-2 text-xs">
                  <GitBranch className="h-3.5 w-3.5" /> Aggregated workspace graph
                </div>
              </SelectItem>
              {weaveOptions.map((weave) => (
                <SelectItem key={weave.id} value={weave.id}>
                  <div className="flex flex-col gap-0.5 text-xs">
                    <span className="font-medium">{weave.name}</span>
                    <span className="text-muted-foreground">{weave.id}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Badge variant={isAggregate ? 'secondary' : 'outline'}>
            {isAggregate ? 'Read-only' : 'Editable weave'}
          </Badge>

          <Badge variant={statusVariant} className="ml-auto whitespace-nowrap">
            {statusLabel}
          </Badge>

          {viewportSample && (
            <span className="text-xs text-muted-foreground">
              View radius ≈ {Math.round(viewportSample.radius)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default KnowledgeGraphToolbar;


