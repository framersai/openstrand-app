'use client';

import { CalendarClock, Layers, Sparkles, Database } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { DashboardOverviewData } from '../dashboard.types';

interface DashboardOverviewMinimalProps {
  data: DashboardOverviewData;
  className?: string;
}

const formatNumber = (value: number | null | undefined) => {
  if (value === null || value === undefined) return '0';
  return value.toLocaleString();
};

export function DashboardOverviewMinimal({ data, className }: DashboardOverviewMinimalProps) {
  if (!data.datasetReady) {
    // Show nothing or a very minimal prompt when no dataset is loaded
    return (
      <div className={cn("flex items-center justify-between px-4 py-2 text-sm", className)}>
        <span className="text-muted-foreground">No dataset loaded</span>
        <Badge variant="outline" className="text-xs">
          {data.planTier} Plan
        </Badge>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex items-center justify-between gap-4 px-4 py-2 border-b border-border/50 bg-background/50 backdrop-blur-sm",
      className
    )}>
      {/* Left side - Dataset info */}
      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <Database className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="font-medium">{data.datasetName || 'Dataset'}</span>
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>{formatNumber(data.datasetRows)} rows</span>
          <span className="opacity-50">•</span>
          <span>{formatNumber(data.datasetColumns)} cols</span>
        </div>
      </div>

      {/* Right side - Quick stats */}
      <div className="flex items-center gap-6">
        {/* Visualizations count */}
        {data.totalVisualizations > 0 && (
          <div className="flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium">{data.totalVisualizations}</span>
          </div>
        )}

        {/* Auto insights status */}
        {data.autoInsightsReady && (
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span className="text-xs font-medium text-amber-600 dark:text-amber-400">Insights</span>
          </div>
        )}

        {/* Plan badge */}
        <Badge variant="outline" className="h-5 px-2 text-[10px] font-medium">
          {data.planTier}
        </Badge>
      </div>
    </div>
  );
}