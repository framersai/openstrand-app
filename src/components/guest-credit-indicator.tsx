'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, BarChart3, Database, AlertCircle, User } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { useGuestSession } from '@/hooks/useGuestSession';
import { useSupabase } from '@/features/auth';

interface CreditType {
  type: 'openai' | 'visualizations' | 'datasets';
  icon: React.ReactNode;
  label: string;
  color: string;
}

const CREDIT_TYPES: CreditType[] = [
  {
    type: 'openai',
    icon: <Sparkles className="h-3 w-3" />,
    label: 'AI',
    color: 'text-purple-600 dark:text-purple-400',
  },
  {
    type: 'visualizations',
    icon: <BarChart3 className="h-3 w-3" />,
    label: 'Charts',
    color: 'text-blue-600 dark:text-blue-400',
  },
  {
    type: 'datasets',
    icon: <Database className="h-3 w-3" />,
    label: 'Data',
    color: 'text-green-600 dark:text-green-400',
  },
];

interface GuestCreditIndicatorProps {
  variant?: 'compact' | 'full' | 'minimal';
  showUpgrade?: boolean;
  className?: string;
}

export function GuestCreditIndicator({
  variant = 'compact',
  showUpgrade = true,
  className = '',
}: GuestCreditIndicatorProps) {
  const { isAuthenticated } = useSupabase();
  const { credits, isGuest, getRemainingCredits } = useGuestSession();

  // Don't show for authenticated users
  if (isAuthenticated || !isGuest) {
    return null;
  }

  if (variant === 'minimal') {
    // Minimal variant for header
    const totalRemaining = CREDIT_TYPES.reduce(
      (sum, credit) => sum + getRemainingCredits(credit.type),
      0
    );
    const totalLimit = credits
      ? credits.openai.daily + credits.visualizations.daily + credits.datasets.daily
      : 0;

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              asChild
              variant="outline"
              size="sm"
              className={`h-8 px-2 border-amber-200 dark:border-amber-800 ${className}`}
            >
              <Link href="/profile">
                <span className="inline-flex items-center gap-1">
                  <User className="h-3 w-3" />
                  <span className="text-xs font-medium">Guest</span>
                  <Badge variant="secondary" className="ml-2 px-1 text-xs">
                    {totalRemaining}/{totalLimit}
                  </Badge>
                </span>
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="w-64">
            <div className="space-y-2">
              <p className="text-xs font-medium">Guest Session Credits</p>
              {CREDIT_TYPES.map((credit) => {
                const remaining = getRemainingCredits(credit.type);
                const limit = credits?.[credit.type].daily || 0;
                const percentage = limit > 0 ? (remaining / limit) * 100 : 0;

                return (
                  <div key={credit.type} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1">
                        {credit.icon}
                        <span>{credit.label}</span>
                      </div>
                      <span>
                        {remaining}/{limit}
                      </span>
                    </div>
                    <Progress value={percentage} className="h-1" />
                  </div>
                );
              })}
              <p className="text-xs text-muted-foreground pt-1">
                Create a free account to get more credits!
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (variant === 'compact') {
    // Compact variant for sidebar
    return (
      <Card className={`border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 ${className}`}>
        <CardContent className="p-3 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <span className="text-sm font-medium">Guest Session</span>
            </div>
            {showUpgrade && (
              <Link href="/auth?mode=register">
                <Button size="sm" variant="secondary" className="h-7 text-xs">
                  Register
                </Button>
              </Link>
            )}
          </div>

          <div className="space-y-2">
            {CREDIT_TYPES.map((credit) => {
              const remaining = getRemainingCredits(credit.type);
              const limit = credits?.[credit.type].daily || 0;
              const percentage = limit > 0 ? ((limit - remaining) / limit) * 100 : 100;

              return (
                <div key={credit.type} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className={`flex items-center gap-1 ${credit.color}`}>
                      {credit.icon}
                      <span>{credit.label}</span>
                    </div>
                    <span className="text-muted-foreground">
                      {remaining} left
                    </span>
                  </div>
                  <Progress value={100 - percentage} className="h-1.5" />
                </div>
              );
            })}
          </div>

          {credits && (
            <p className="text-xs text-muted-foreground">
              Resets in {getTimeUntilReset(credits.openai.resetAt)}
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  // Full variant for dedicated credit display
  return (
    <Card className={`${className}`}>
      <CardContent className="p-4 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-base font-semibold">Guest Credits</h3>
            <p className="text-xs text-muted-foreground">
              Limited daily credits for guest users
            </p>
          </div>
          <Badge variant="outline" className="text-xs">
            <AlertCircle className="h-3 w-3 mr-1" />
            Guest
          </Badge>
        </div>

        <div className="space-y-3">
          {CREDIT_TYPES.map((credit) => {
            const remaining = getRemainingCredits(credit.type);
            const limit = credits?.[credit.type].daily || 0;
            const used = limit - remaining;
            const percentage = limit > 0 ? (used / limit) * 100 : 0;

            return (
              <div key={credit.type} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className={`flex items-center gap-2 ${credit.color}`}>
                    {credit.icon}
                    <span className="text-sm font-medium">{credit.label} Credits</span>
                  </div>
                  <span className="text-sm font-medium">
                    {remaining}/{limit}
                  </span>
                </div>
                <Progress value={100 - percentage} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{used} used today</span>
                  <span>{remaining} remaining</span>
                </div>
              </div>
            );
          })}
        </div>

        {showUpgrade && (
          <div className="pt-2 border-t">
            <Link href="/auth?mode=register" className="block">
              <Button className="w-full" size="sm">
                <Sparkles className="mr-2 h-4 w-4" />
                Create Free Account for More Credits
              </Button>
            </Link>
            <p className="text-xs text-center text-muted-foreground mt-2">
              Keep all your data and get 2x more daily credits
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function getTimeUntilReset(resetAt: string): string {
  const now = new Date();
  const reset = new Date(resetAt);
  const diff = reset.getTime() - now.getTime();

  if (diff <= 0) return 'now';

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}