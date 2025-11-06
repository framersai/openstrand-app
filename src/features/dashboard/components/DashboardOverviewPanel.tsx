'use client';

import type { ReactNode } from 'react';
import { CalendarClock, Layers, Sparkles, Table } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { DashboardOverviewData } from '../dashboard.types';

interface DashboardOverviewPanelProps {
  data: DashboardOverviewData;
}

const formatNumber = (value: number | null | undefined) => {
  if (value === null || value === undefined) return '—';
  return value.toLocaleString();
};

const formatDate = (value: string | null | undefined) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleString();
};

export function DashboardOverviewPanel({ data }: DashboardOverviewPanelProps) {
  return (
    <Card className="border-primary/10 bg-gradient-to-br from-background via-background to-primary/5">
      <CardContent className="pt-6">
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Workspace Overview</p>
              <h2 className="text-xl font-semibold">{data.datasetReady ? (data.datasetName ?? 'Active dataset') : 'No dataset loaded'}</h2>
              <p className="text-sm text-muted-foreground">
                {data.datasetReady
                  ? `Rows: ${formatNumber(data.datasetRows)} • Columns: ${formatNumber(data.datasetColumns)}${
                      data.datasetLanguage ? ` • Language: ${data.datasetLanguage}` : ''
                    }`
                  : 'Upload a dataset to unlock AI analysis, feedback, and visualizations.'}
              </p>
            </div>
            <Badge variant="secondary" className="px-3 py-1 text-xs font-medium uppercase">
              {data.planTier} plan{typeof data.planLimitMb === 'number' ? ` • ${data.planLimitMb} MB uploads` : ''}
            </Badge>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <OverviewCard
              icon={<Layers className="h-4 w-4 text-primary" />}
              label="Visualizations"
              value={formatNumber(data.totalVisualizations)}
              helper={
                data.savedVisualizations > 0
                  ? `${data.savedVisualizations.toLocaleString()} saved`
                  : 'Generate insights to populate your workspace'
              }
            />
            <OverviewCard
              icon={<Sparkles className="h-4 w-4 text-primary" />}
              label="Auto Insights"
              value={data.autoInsightsReady ? 'Ready' : 'Idle'}
              helper={data.autoInsightsStatus ?? 'Run Auto Insights to unlock recommendations'}
            />
            <OverviewCard
              icon={<CalendarClock className="h-4 w-4 text-primary" />}
              label="Last Update"
              value={data.lastVisualizationAt ? formatDate(data.lastVisualizationAt) : 'No activity yet'}
              helper={
                data.datasetUploadedAt
                  ? `Dataset uploaded ${formatDate(data.datasetUploadedAt)}`
                  : 'Upload a dataset to get started'
              }
            />
            <OverviewCard
              icon={<Table className="h-4 w-4 text-primary" />}
              label="Dataset Coverage"
              value={`${formatNumber(data.datasetRows)} × ${formatNumber(data.datasetColumns)}`}
              helper={
                data.datasetReady
                  ? 'Perfect for charts, AI decisions, and schema intelligence.'
                  : 'Awaiting dataset upload.'
              }
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface OverviewCardProps {
  icon: ReactNode;
  label: string;
  value: string;
  helper?: string;
}

function OverviewCard({ icon, label, value, helper }: OverviewCardProps) {
  return (
    <div className="rounded-lg border border-border/60 bg-background/80 p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">{icon}</div>
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight">{value}</p>
      {helper ? <p className="mt-1 text-sm text-muted-foreground">{helper}</p> : null}
    </div>
  );
}
