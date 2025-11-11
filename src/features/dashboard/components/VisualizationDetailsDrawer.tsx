'use client';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Copy, Download } from 'lucide-react';
import type { Visualization } from '@/types';
import { useMemo } from 'react';

interface VisualizationDetailsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  visualization: Visualization;
}

export function VisualizationDetailsDrawer({ open, onOpenChange, visualization }: VisualizationDetailsDrawerProps) {
  const shareUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    const url = new URL(window.location.href);
    url.searchParams.set('viz', visualization.id);
    return url.toString();
  }, [visualization.id]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // ignore
    }
  };

  const downloadAsJson = () => {
    const exportData = {
      visualization,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `visualization-${visualization.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Visualization details</DialogTitle>
          <DialogDescription>Inspect metadata, copy links, and export.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">ID</span>
              <code className="rounded bg-muted px-2 py-0.5">{visualization.id}</code>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Type</span>
              <span className="font-medium">{visualization.type}</span>
            </div>
            {visualization.datasetId && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Dataset</span>
                <code className="rounded bg-muted px-2 py-0.5">{visualization.datasetId}</code>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Created</span>
              <span>{new Date(visualization.createdAt).toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Updated</span>
              <span>{new Date(visualization.updatedAt).toLocaleString()}</span>
            </div>
            {visualization.provider_used && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Provider</span>
                <span>{visualization.provider_used}</span>
              </div>
            )}
            {typeof visualization.cost?.totalCost === 'number' && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Cost</span>
                <span>${visualization.cost.totalCost.toFixed(4)}</span>
              </div>
            )}
          </div>

          <div className="rounded-lg border bg-background/60 p-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="font-medium">Share link</p>
                <p className="text-xs text-muted-foreground">Copy a link that encodes this visualization ID in the URL.</p>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="secondary" onClick={() => copyToClipboard(shareUrl)}>
                  <Copy className="mr-1 h-3.5 w-3.5" />
                  Copy
                </Button>
                <Button size="sm" variant="outline" onClick={downloadAsJson}>
                  <Download className="mr-1 h-3.5 w-3.5" />
                  Export JSON
                </Button>
              </div>
            </div>
            <p className="mt-2 truncate text-xs text-muted-foreground">{shareUrl}</p>
          </div>

          <div>
            <p className="text-xs font-medium text-muted-foreground">Metadata</p>
            <pre className="mt-1 max-h-56 overflow-auto rounded-md border bg-background/80 p-3 text-xs">
              {JSON.stringify(visualization.metadata ?? {}, null, 2)}
            </pre>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


