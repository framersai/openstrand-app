'use client';

import { Trophy } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { LeaderboardEntry } from '@/types';
import { cn } from '@/lib/utils';

interface LeaderboardPanelProps {
  datasetEntries: LeaderboardEntry[];
  visualizationEntries: LeaderboardEntry[];
  isLoading?: boolean;
  onRefresh?: () => void;
}

export function LeaderboardPanel({
  datasetEntries,
  visualizationEntries,
  isLoading = false,
  onRefresh,
}: LeaderboardPanelProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">Leaderboards</span>
        </div>
        {onRefresh && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={onRefresh}
            disabled={isLoading}
          >
            Refresh
          </Button>
        )}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <LeaderboardList title="Datasets" entries={datasetEntries} emptyLabel="No feedback yet." />
        <LeaderboardList
          title="Visualizations"
          entries={visualizationEntries}
          emptyLabel="No favorites yet."
        />
      </div>
    </div>
  );
}

function LeaderboardList({
  title,
  entries,
  emptyLabel,
}: {
  title: string;
  entries: LeaderboardEntry[];
  emptyLabel: string;
}) {
  return (
    <div className="space-y-2 rounded-xl border border-border/70 bg-background/70 p-3 text-xs">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      {entries.length === 0 ? (
        <p className="text-muted-foreground">{emptyLabel}</p>
      ) : (
        <ul className="space-y-1.5">
          {entries.slice(0, 5).map((entry, index) => (
            <li
              key={`${entry.targetId}-${index}`}
              className={cn(
                'flex items-center justify-between rounded-lg border border-border/60 bg-card/70 px-2 py-1.5',
              )}
            >
              <div>
                <p className="font-medium text-foreground">{entry.label ?? entry.targetId}</p>
                {entry.datasetId && (
                  <p className="text-[11px] text-muted-foreground">Dataset: {entry.datasetId}</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-primary">Score {entry.score}</p>
                <p className="text-[11px] text-muted-foreground">
                  {entry.likes} up / {entry.dislikes} down / {entry.favorites} favorites
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
