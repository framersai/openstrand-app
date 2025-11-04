'use client';

import { Heart, MessageCircle, ThumbsDown, ThumbsUp } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { FeedbackOverview } from '../dashboard.types';

interface FeedbackPulsePanelProps {
  feedback: FeedbackOverview;
}

const formatCount = (value: number | undefined) => (typeof value === 'number' ? value.toLocaleString() : '0');

export function FeedbackPulsePanel({ feedback }: FeedbackPulsePanelProps) {
  const dataset = feedback.dataset;
  const visualizations = feedback.visualizations;

  return (
    <Card className="border-primary/10 bg-background/80">
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-semibold">Feedback Pulse</CardTitle>
        <p className="text-xs text-muted-foreground">Monitor how your data and visualizations resonate with the team</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {dataset ? (
          <div className="rounded-lg border border-border/60 bg-background/70 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Dataset feedback</span>
              </div>
              <Badge variant="secondary" className="text-xs">Score {dataset.score.toFixed(1)}</Badge>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1 text-foreground"><ThumbsUp className="h-3 w-3" />{formatCount(dataset.likes)}</div>
              <div className="flex items-center gap-1"><ThumbsDown className="h-3 w-3" />{formatCount(dataset.dislikes)}</div>
              <div className="flex items-center gap-1"><Heart className="h-3 w-3" />{formatCount(dataset.favorites)}</div>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-muted-foreground/30 p-3 text-xs text-muted-foreground">
            Once teammates leave feedback on the dataset, you'll see sentiment summaries here.
          </div>
        )}

        {visualizations ? (
          <div className="rounded-lg border border-border/60 bg-background/70 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Visualization sentiment</span>
              </div>
              <Badge variant="outline" className="text-xs">
                {visualizations.count} tracked
              </Badge>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1 text-foreground"><ThumbsUp className="h-3 w-3" />{formatCount(visualizations.totalLikes)}</div>
              <div className="flex items-center gap-1"><ThumbsDown className="h-3 w-3" />{formatCount(visualizations.totalDislikes)}</div>
              <div className="flex items-center gap-1"><Heart className="h-3 w-3" />{formatCount(visualizations.totalFavorites)}</div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Average score {visualizations.averageScore.toFixed(2)}</p>
            {visualizations.topVisualization ? (
              <div className="mt-2 rounded-md border border-border/60 bg-background/80 p-2">
                <p className="text-xs font-medium text-foreground">Top performer</p>
                <p className="text-xs text-muted-foreground">
                  {visualizations.topVisualization.targetId}
                  {typeof visualizations.topVisualization.score === 'number'
                    ? ` • Score ${visualizations.topVisualization.score.toFixed(2)}`
                    : null}
                </p>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-muted-foreground/30 p-3 text-xs text-muted-foreground">
            Generate visualizations and gather reactions to build your sentiment pulse.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
