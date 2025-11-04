'use client';

/**
 * @module components/cost-tracker
 * @description Component for displaying and tracking LLM usage costs in real-time.
 * Shows session total, provider breakdown, and cost trends.
 */

import React, { useMemo } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { useLLMStore } from '@/store/llm-store';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface CostTrackerProps {
  /** Display mode */
  mode?: 'compact' | 'detailed';
  /** Additional className */
  className?: string;
}

/**
 * CostTracker component for monitoring LLM costs
 */
export const CostTracker: React.FC<CostTrackerProps> = ({
  mode = 'compact',
  className,
}) => {
  const { getCostStats } = useLLMStore();
  const stats = useMemo(() => getCostStats(), [getCostStats]);
  
  /**
   * Calculate trend compared to average
   */
  const trend = useMemo(() => {
    if (stats.requestCount < 2) return 0;
    const lastCost = stats.sessionTotal / stats.requestCount;
    return ((lastCost - stats.averageCost) / stats.averageCost) * 100;
  }, [stats]);
  
  if (mode === 'compact') {
    return (
      <div className={cn('flex items-center gap-2 text-xs sm:text-sm', className)}>
        <div className="flex items-center gap-1 rounded-md bg-muted/50 px-2.5 py-1">
          <DollarSign className="h-3 w-3 text-muted-foreground" />
          <span className="font-medium">{formatCurrency(stats.sessionTotal)}</span>
        </div>
        
        {stats.requestCount > 0 && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Activity className="h-3 w-3" />
            <span>{stats.requestCount} requests</span>
          </div>
        )}
      </div>
    );
  }
  
  return (
    <div className={cn('space-y-4 p-4 rounded-lg bg-card border', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Cost Tracking</h3>
        {trend !== 0 && (
          <div className={cn(
            'flex items-center gap-1 text-xs',
            trend > 0 ? 'text-destructive' : 'text-green-600'
          )}>
            {trend > 0 ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            <span>{Math.abs(trend).toFixed(1)}%</span>
          </div>
        )}
      </div>
      
      {/* Session Total */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Session Total</span>
          <span className="text-lg font-bold">{formatCurrency(stats.sessionTotal)}</span>
        </div>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{stats.requestCount} requests</span>
          <span>Avg: {formatCurrency(stats.averageCost)}</span>
        </div>
      </div>
      
      {/* Provider Breakdown */}
      {Object.keys(stats.byProvider).length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground">By Provider</h4>
          <div className="space-y-1">
            {Object.entries(stats.byProvider).map(([provider, cost]) => (
              <div key={provider} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    'h-2 w-2 rounded-full',
                    provider === 'openrouter' && 'bg-blue-500',
                    provider === 'openai' && 'bg-green-500',
                    provider === 'anthropic' && 'bg-purple-500'
                  )} />
                  <span className="text-xs capitalize">{provider}</span>
                </div>
                <span className="text-xs font-medium">{formatCurrency(cost)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Cost Breakdown */}
      <div className="pt-2 border-t">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
          <p className="text-muted-foreground">Heuristic Assist (est.)</p>
            <p className="font-medium text-green-600">
              {formatCurrency(stats.requestCount * 0.002 * 0.4)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Projected Daily</p>
            <p className="font-medium">
              {formatCurrency((stats.sessionTotal / stats.requestCount) * 100)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
