'use client';

import { Button } from '@/components/ui/button';
import type { DatasetInsights } from '@/types';
import type { InsightRecommendation } from '@/types/insights';

interface AutoInsightsPanelProps {
  insights: DatasetInsights | null;
  isLoading: boolean;
  error: string | null;
  statusMessage?: string | null;
  logs?: string[];
  onViewRecommendations?: () => void;
}

export function AutoInsightsPanel({
  insights,
  isLoading,
  error,
  statusMessage,
  logs = [],
  onViewRecommendations,
}: AutoInsightsPanelProps) {
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-dashed border-primary/30 bg-primary/5 px-4 py-6 text-sm text-primary">
        {statusMessage ?? 'Generating Auto Insights with the LLM...'}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-dashed border-destructive/40 bg-destructive/10 px-4 py-4 text-sm text-destructive">
        {error}
      </div>
    );
  }

  if (!insights) {
    return (
      <div className="rounded-2xl border border-dashed border-border/60 bg-card/60 px-4 py-4 text-sm text-muted-foreground">
        {statusMessage ?? 'Trigger Auto Insights to see correlations, outliers, and recommended visuals inline.'}
        {logs.length > 0 && <LogList logs={logs} />}
      </div>
    );
  }

  const recommendations: InsightRecommendation[] =
    insights.insights?.visualization_recommendations?.natural_visualizations ??
    insights.insights?.recommended_visualizations ??
    [];
  const correlations = insights.insights?.relationships?.correlations ?? [];
  const outliers = insights.insights?.quality_insights?.outliers ?? {};

  return (
    <div className="space-y-4 rounded-2xl border border-border/80 bg-card/70 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h4 className="text-sm font-semibold">Auto Insights</h4>
          <p className="text-xs text-muted-foreground">
            Generated {new Date(insights.generatedAt).toLocaleString()}
          </p>
        </div>
        <span className="rounded-full border border-primary/40 px-2 py-0.5 text-[10px] uppercase tracking-wide text-primary">
          LLM
        </span>
      </div>

      {statusMessage && (
        <p className="text-xs text-muted-foreground border border-dashed border-border/60 rounded-lg px-3 py-2 bg-background/40">
          {statusMessage}
        </p>
      )}

      <Section title="Recommended visuals">
        {recommendations.length === 0 ? (
          <p className="text-xs text-muted-foreground">No visual recommendations returned.</p>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <p className="text-muted-foreground">
              {recommendations.length} tailored suggestions are ready in the visualization panel.
            </p>
            {onViewRecommendations && (
              <Button
                size="sm"
                variant="outline"
                className="text-xs"
                onClick={onViewRecommendations}
              >
                View suggestions
              </Button>
            )}
          </div>
        )}
      </Section>

      <Section title="Correlations">
        {correlations.length === 0 ? (
          <p className="text-xs text-muted-foreground">No strong correlations detected.</p>
        ) : (
          <ul className="space-y-2 text-xs">
            {correlations.map((item: any, idx: number) => (
              <li key={`corr-${idx}`} className="rounded-lg bg-muted/40 px-3 py-2">
                <p className="font-semibold text-foreground">{item?.columns?.join(' | ')}</p>
                <p className="text-muted-foreground">{item?.interpretation}</p>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Quality flags">
        {Object.keys(outliers).length === 0 ? (
          <p className="text-xs text-muted-foreground">No outliers flagged.</p>
        ) : (
          <ul className="space-y-2 text-xs">
            {Object.entries(outliers).map(([column, details]) => (
              <li key={column} className="rounded-lg bg-muted/40 px-3 py-2">
                <p className="font-semibold text-foreground">{column}</p>
                <p className="text-muted-foreground">
                  {(details as any)?.count ?? 0} outliers - {(details as any)?.severity ?? 'medium'}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <details className="rounded-xl border border-border/60 bg-background/60 px-3 py-2 text-xs">
        <summary className="cursor-pointer font-semibold text-foreground">View raw payload</summary>
        <pre className="mt-2 max-h-64 overflow-auto rounded bg-muted/40 p-2 text-[11px]">
          {JSON.stringify(insights.insights, null, 2)}
        </pre>
      </details>

      {logs.length > 0 && (
        <div className="rounded-xl border border-border/70 bg-background/60 px-3 py-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Progress</p>
          <LogList logs={logs} />
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      {children}
    </div>
  );
}

function LogList({ logs }: { logs: string[] }) {
  return (
    <ul className="mt-2 space-y-1 text-xs">
      {logs.map((entry, index) => (
        <li key={`${entry}-${index}`} className="text-foreground">
          {entry}
        </li>
      ))}
    </ul>
  );
}

export type { InsightRecommendation } from '@/types/insights';
