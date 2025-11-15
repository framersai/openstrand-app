'use client';

/**
 * @module IllustrationOnboardingCard
 * @description
 * Compact helper card that explains the illustration workflow:
 * Settings → Preview → Batch.
 *
 * Designed to be embedded next to illustration entry points (e.g. PDF reader
 * "Generate illustrations" button) without being intrusive. On mobile, it
 * stacks into a full-width card so the text remains legible.
 */

import { Sparkles, Image as ImageIcon, ShieldCheck, Wallet } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function IllustrationOnboardingCard() {
  return (
    <Card className="mt-4 border-border/60 bg-card/80 text-xs sm:text-sm">
      <CardContent className="flex flex-col gap-3 p-3 sm:p-4">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
            <Sparkles className="h-3 w-3 text-primary" />
          </span>
          <div className="flex-1">
            <div className="text-xs font-semibold text-foreground sm:text-sm">
              Illustration workflow
            </div>
            <p className="text-[11px] text-muted-foreground sm:text-xs">
              Pick a style, preview a few pages, then generate the full batch once you’re happy.
            </p>
          </div>
          <Badge variant="outline" className="hidden sm:inline-flex items-center gap-1 text-[10px]">
            <ImageIcon className="h-3 w-3" />
            Visual
          </Badge>
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          <div className="space-y-1">
            <div className="text-[11px] font-medium text-foreground sm:text-xs">
              1. Choose style
            </div>
            <p className="text-[11px] text-muted-foreground sm:text-xs">
              Use presets like flat pastel, chalkboard, or blueprint. Defaults come from your team’s visual language.
            </p>
          </div>
          <div className="space-y-1">
            <div className="text-[11px] font-medium text-foreground sm:text-xs">
              2. Preview pages
            </div>
            <p className="text-[11px] text-muted-foreground sm:text-xs">
              Generate 1–5 sample pages to confirm composition and contrast before committing to all pages.
            </p>
          </div>
          <div className="space-y-1">
            <div className="text-[11px] font-medium text-foreground sm:text-xs">
              3. Batch with guardrails
            </div>
            <p className="text-[11px] text-muted-foreground sm:text-xs">
              We show cost estimates up front and track spend over time so you can stay within budget.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground sm:text-xs">
          <span className="inline-flex items-center gap-1">
            <ShieldCheck className="h-3 w-3" />
            Safety levels (strict → uncensored) keep visuals appropriate for your audience.
          </span>
          <span className="inline-flex items-center gap-1">
            <Wallet className="h-3 w-3" />
            Batch jobs stream progress and cost, so you can stop early if needed.
          </span>
        </div>
      </CardContent>
    </Card>
  );
}


