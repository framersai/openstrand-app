'use client';

import { RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { DatasetSummary } from '@/types';

interface DatasetSummaryPanelProps {
  summary: DatasetSummary | null;
  isLoading: boolean;
  onRefresh?: () => void;
  disableRefresh?: boolean;
}

export function DatasetSummaryPanel({ summary, isLoading, onRefresh, disableRefresh }: DatasetSummaryPanelProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground">
        Building dataset summary…
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground">
        Upload a dataset to see column stats, sample values, and semantic tags.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-dashed border-border/80 bg-card/60 p-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h4 className="text-sm font-semibold">Dataset summary</h4>
          <p className="text-xs text-muted-foreground">
            {summary.rowCount.toLocaleString()} rows · {summary.columnCount} columns
          </p>
        </div>
        {onRefresh && (
          <Button size="sm" variant="ghost" onClick={onRefresh} disabled={disableRefresh}>
            <RefreshCw className="mr-1 h-3 w-3" />
            Refresh
          </Button>
        )}
      </div>
      <div className="mt-3 space-y-2">
        {summary.columns.slice(0, 4).map((column) => (
          <div
            key={column.name}
            className="rounded-xl border border-border/60 bg-background/60 px-3 py-2 text-xs leading-relaxed"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-foreground">{column.name}</span>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                {column.type}
              </span>
            </div>
            <p className="mt-1 text-muted-foreground">
              Samples: {column.sampleValues.filter(Boolean).slice(0, 3).join(', ') || 'n/a'}
            </p>
            <div className="mt-1 flex flex-wrap gap-2 text-muted-foreground">
              {Object.entries(column.stats)
                .slice(0, 2)
                .map(([key, value]) => (
                  <span key={key} className="rounded bg-muted/50 px-2 py-0.5">
                    {key}: {value ?? 'n/a'}
                  </span>
                ))}
              {column.semanticTags.map((tag) => (
                <span key={tag} className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        ))}
        {summary.columns.length > 4 && (
          <p className="text-xs text-muted-foreground">
            + {summary.columns.length - 4} more columns summarized
          </p>
        )}
      </div>
    </div>
  );
}
