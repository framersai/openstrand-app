'use client';

import type { DatasetMetadata, DatasetSummary } from '@/types';

interface DatasetSchemaPanelProps {
  metadata?: DatasetMetadata | null;
  summary?: DatasetSummary | null;
}

export function DatasetSchemaPanel({ metadata, summary }: DatasetSchemaPanelProps) {
  const columnsFromSummary = summary?.columns ?? [];
  const columnsFromMetadata = (metadata?.columns ?? []).map((name) => ({
    name,
    type: metadata?.columnTypes?.[name] ?? 'unknown',
    sampleValues: [],
    stats: {},
    semanticTags: [],
  }));

  const columns = columnsFromSummary.length > 0 ? columnsFromSummary : columnsFromMetadata;

  if (columns.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/60 bg-muted/10 p-4 text-sm text-muted-foreground">
        Schema preview will appear here when a dataset is loaded.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
      <div className="mb-2">
        <h4 className="text-sm font-semibold">Schema preview</h4>
        <p className="text-xs text-muted-foreground">
          Top columns with data types and semantic tags.
        </p>
      </div>
      <div className="grid gap-2">
        {columns.slice(0, 8).map((col) => (
          <div
            key={col.name}
            className="rounded-xl border border-border/60 bg-background/80 px-3 py-2 text-xs leading-relaxed"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-foreground">{col.name}</span>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                {col.type}
              </span>
            </div>
            {Array.isArray(col.semanticTags) && col.semanticTags.length > 0 ? (
              <div className="mt-1 flex flex-wrap gap-2 text-muted-foreground">
                {col.semanticTags.slice(0, 3).map((tag) => (
                  <span key={tag} className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">
                    #{tag}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        ))}
        {columns.length > 8 && (
          <p className="text-xs text-muted-foreground">
            + {columns.length - 8} more columns
          </p>
        )}
      </div>
    </div>
  );
}


