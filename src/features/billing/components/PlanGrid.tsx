'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useSupabase } from '@/features/auth';
import type { PlanTier } from '@/lib/plan-info';

import type { BillingPlan } from '../types';

interface PlanGridProps {
  plans: BillingPlan[];
  onCheckout: (planId: PlanTier) => Promise<void>;
  isLoading: boolean;
  currentPlan?: PlanTier | null;
  onManageCurrentPlan?: () => Promise<void> | void;
}

export function PlanGrid({ plans, onCheckout, isLoading, currentPlan, onManageCurrentPlan }: PlanGridProps) {
  const { isAuthenticated } = useSupabase();
  const [processing, setProcessing] = useState<string | null>(null);

  const handleCheckout = async (planId: PlanTier) => {
    try {
      setProcessing(planId);
      await onCheckout(planId);
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {plans.map((plan) => {
        const isCurrent = currentPlan === plan.tier;
        const isEnterprise = plan.tier === 'enterprise';

        return (
          <Card key={plan.id} className={plan.id === 'pro' ? 'border-primary shadow-lg' : ''}>
          <CardHeader>
            <CardTitle className="text-xl font-semibold">{plan.name}</CardTitle>
            <CardDescription>{plan.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-3xl font-bold">{plan.price}</p>
            <ul className="space-y-2 text-sm">
              {Object.entries(plan.features).map(([label, value]) => (
                <li key={label} className="flex justify-between gap-3">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium text-right">{value}</span>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            {isCurrent && onManageCurrentPlan ? (
              <Button
                className="w-full"
                variant="outline"
                onClick={() => onManageCurrentPlan()}
                disabled={isLoading || processing === plan.id}
              >
                Manage plan
              </Button>
            ) : isCurrent ? (
              <Button className="w-full" variant="outline" disabled>
                Current plan
              </Button>
            ) : plan.requiresCheckout ? (
              <Button
                className="w-full"
                onClick={() => handleCheckout(plan.tier)}
                disabled={!isAuthenticated || isLoading || processing === plan.id}
              >
                {processing === plan.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isAuthenticated ? 'Upgrade' : 'Sign in to upgrade'}
              </Button>
            ) : isEnterprise ? (
              <Button asChild className="w-full" variant="outline">
                <a href="mailto:team@frame.dev">Contact us</a>
              </Button>
            ) : (
              <Button className="w-full" variant="outline" disabled>
                Included
              </Button>
            )}
          </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
