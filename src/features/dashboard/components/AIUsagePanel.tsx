'use client';

import { Brain, Coins, Cpu } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { ProviderUsageSummary } from '../dashboard.types';

interface AIUsagePanelProps {
  usage: ProviderUsageSummary;
}

const formatCurrency = (value: number) => `$${value.toFixed(2)}`;

const formatTokens = (value: number) => `${value.toLocaleString()} tokens`;

export function AIUsagePanel({ usage }: AIUsagePanelProps) {
  const { providers, totalCost, totalRequests, totalTokens } = usage;

  return (
    <Card className="border-primary/10 bg-background/80">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">AI Usage</CardTitle>
            <p className="text-xs text-muted-foreground">Cost and token spend across providers</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1"><Coins className="h-3 w-3" />{formatCurrency(totalCost)}</span>
            <span className="inline-flex items-center gap-1"><Brain className="h-3 w-3" />{totalRequests} req</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {providers.length === 0 ? (
          <div className="rounded-md border border-dashed border-muted-foreground/30 p-4 text-center text-xs text-muted-foreground">
            Generate a visualization to see provider usage analytics.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border border-border/60 bg-background/60 p-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1"><Cpu className="h-3 w-3" />Total tokens</span>
                <span>{formatTokens(totalTokens)}</span>
              </div>
              <Progress value={Math.min(100, totalTokens ? 100 : 0)} className="mt-2 h-1.5" />
            </div>

            <div className="space-y-3">
              {providers.map((provider) => {
                const providerTokens = provider.inputTokens + provider.outputTokens;
                const costShare = totalCost > 0 ? (provider.totalCost / totalCost) * 100 : 0;
                return (
                  <div key={provider.provider} className="rounded-lg border border-border/60 bg-background/60 p-3">
                    <div className="flex items-center justify-between text-sm font-medium">
                      <span className="capitalize">{provider.provider}</span>
                      <span className="text-muted-foreground">{formatCurrency(provider.totalCost)}</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{provider.count} requests • {formatTokens(providerTokens)}</span>
                      <span>{costShare.toFixed(0)}%</span>
                    </div>
                    <Progress value={Math.min(100, costShare)} className="mt-2 h-1.5" />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
