'use client';

import type { ReactNode } from 'react';
import { CalendarClock, LineChart, Sparkles } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ActivityEvent } from '../dashboard.types';

interface ActivityTimelinePanelProps {
  events: ActivityEvent[];
}

const ICONS: Record<ActivityEvent['type'], ReactNode> = {
  dataset: <CalendarClock className="h-4 w-4" />,
  visualization: <LineChart className="h-4 w-4" />,
  insight: <Sparkles className="h-4 w-4" />,
};

const formatRelativeTime = (timestamp: string) => {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return 'unknown';
  }
  const diff = Date.now() - date.getTime();
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
};

export function ActivityTimelinePanel({ events }: ActivityTimelinePanelProps) {
  return (
    <Card className="border-primary/10 bg-background/80">
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
        <p className="text-xs text-muted-foreground">Track dataset uploads, visualizations, and AI insights</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {events.length === 0 ? (
          <div className="rounded-md border border-dashed border-muted-foreground/30 p-4 text-center text-xs text-muted-foreground">
            Once you upload a dataset or generate visualizations, your activity will appear here.
          </div>
        ) : (
          <ol className="relative space-y-4 border-l border-border/60 pl-4">
            {events.slice(0, 8).map((event) => (
              <li key={event.id} className="relative">
                <span className="absolute -left-8 flex h-6 w-6 items-center justify-center rounded-full border border-border/80 bg-background text-primary">
                  {ICONS[event.type]}
                </span>
                <div className="rounded-md border border-border/50 bg-background/70 p-3">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="font-medium capitalize text-foreground">{event.type}</span>
                    <span>{formatRelativeTime(event.timestamp)}</span>
                  </div>
                  <p className="mt-1 text-sm font-medium text-foreground">{event.title}</p>
                  {event.description ? (
                    <p className="mt-1 text-xs text-muted-foreground">{event.description}</p>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
