'use client';

import type { DatasetMetadata, DatasetSummary } from '@/types';

interface DatasetQualityPanelProps {
  metadata?: DatasetMetadata | null;
  summary?: DatasetSummary | null;
}

export function DatasetQualityPanel({ metadata, summary }: DatasetQualityPanelProps) {
  const rowCount = metadata?.rowCount ?? summary?.rowCount ?? 0;
  const columnCount = metadata?.columns?.length ?? summary?.columnCount ?? 0;

  // Heuristic quality metrics from column stats if present
  let nullsTotal = 0;
  let uniqueTotal = 0;
  let columnsWithStats = 0;

  if (summary?.columns?.length) {
    for (const col of summary.columns) {
      const nullCount = Number(col.stats?.nullCount ?? col.stats?.nulls ?? 0);
      const uniqueCount = Number(col.stats?.uniqueCount ?? col.stats?.distinct ?? 0);
      if (!Number.isNaN(nullCount) || !Number.isNaN(uniqueCount)) {
        columnsWithStats += 1;
      }
      nullsTotal += Number.isFinite(nullCount) ? nullCount : 0;
      uniqueTotal += Number.isFinite(uniqueCount) ? uniqueCount : 0;
    }
  }

  const avgNullsPerColumn = columnsWithStats > 0 ? nullsTotal / columnsWithStats : 0;
  const avgUniquePerColumn = columnsWithStats > 0 ? uniqueTotal / columnsWithStats : 0;
  const approxNullPct =
    rowCount > 0 && columnsWithStats > 0
      ? Math.min(100, Math.max(0, (avgNullsPerColumn / rowCount) * 100))
      : 0;

  return (
    <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
      <div className="mb-2">
        <h4 className="text-sm font-semibold">Data quality</h4>
        <p className="text-xs text-muted-foreground">
          Quick quality indicators calculated from available stats.
        </p>
      </div>
      <div className="grid gap-3 text-xs">
        <div className="flex items-center justify-between rounded-lg border bg-muted/20 px-3 py-2">
          <span className="text-muted-foreground">Rows</span>
          <span className="font-medium">{rowCount.toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between rounded-lg border bg-muted/20 px-3 py-2">
          <span className="text-muted-foreground">Columns</span>
          <span className="font-medium">{columnCount}</span>
        </div>
        <div className="flex items-center justify-between rounded-lg border bg-muted/20 px-3 py-2">
          <span className="text-muted-foreground">Avg nulls per column</span>
          <span className="font-medium">{Math.round(avgNullsPerColumn).toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between rounded-lg border bg-muted/20 px-3 py-2">
          <span className="text-muted-foreground">Approx null %</span>
          <span className="font-medium">{approxNullPct.toFixed(1)}%</span>
        </div>
        <div className="flex items-center justify-between rounded-lg border bg-muted/20 px-3 py-2">
          <span className="text-muted-foreground">Avg unique per column</span>
          <span className="font-medium">{Math.round(avgUniquePerColumn).toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}


