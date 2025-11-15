'use client';

/**
 * @module CostBadge
 * @description Reusable component for displaying AI operation costs
 * 
 * Features:
 * - Shows estimated cost
 * - Color-coded by amount (green=cheap, yellow=moderate, red=expensive)
 * - Optional breakdown tooltip
 * - Consistent styling across app
 */

import React from 'react';
import { DollarSign, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface CostBadgeProps {
  amount: number; // in USD
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  breakdown?: {
    label: string;
    amount: number;
  }[];
  className?: string;
}

export function CostBadge({
  amount,
  label = 'Cost',
  size = 'md',
  showIcon = true,
  breakdown,
  className,
}: CostBadgeProps) {
  const formatCost = (value: number): string => {
    if (value < 0.01) return `<$0.01`;
    if (value < 1) return `$${value.toFixed(3)}`;
    return `$${value.toFixed(2)}`;
  };

  const getColorClass = (value: number): string => {
    if (value < 0.1) return 'bg-green-100 text-green-900 dark:bg-green-900 dark:text-green-100';
    if (value < 1.0) return 'bg-yellow-100 text-yellow-900 dark:bg-yellow-900 dark:text-yellow-100';
    return 'bg-red-100 text-red-900 dark:bg-red-900 dark:text-red-100';
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  };

  const badge = (
    <Badge
      variant="outline"
      className={cn(
        'gap-1 font-mono',
        getColorClass(amount),
        sizeClasses[size],
        className
      )}
    >
      {showIcon && <DollarSign className={cn(
        size === 'sm' && 'h-3 w-3',
        size === 'md' && 'h-4 w-4',
        size === 'lg' && 'h-5 w-5'
      )} />}
      {formatCost(amount)}
    </Badge>
  );

  if (breakdown && breakdown.length > 0) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="inline-flex items-center gap-1 cursor-help">
              {badge}
              <Info className="h-3 w-3 text-muted-foreground" />
            </div>
          </TooltipTrigger>
          <TooltipContent className="space-y-2">
            <div className="font-semibold text-xs">{label} Breakdown:</div>
            {breakdown.map((item, i) => (
              <div key={i} className="flex justify-between gap-6 text-xs">
                <span className="text-muted-foreground">{item.label}:</span>
                <span className="font-mono">{formatCost(item.amount)}</span>
              </div>
            ))}
            <div className="flex justify-between gap-6 text-xs font-semibold border-t pt-2">
              <span>Total:</span>
              <span className="font-mono">{formatCost(amount)}</span>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return badge;
}

