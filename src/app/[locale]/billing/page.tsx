'use client';

import { useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { PlanGrid, useBillingPlans, useSubscription } from '@/features/billing';
import { useSupabase } from '@/features/auth';
import { api } from '@/services/api';
import { formatPlanLabel, type PlanTier } from '@/lib/plan-info';

export default function BillingPage() {
  const { plans, loading, error } = useBillingPlans();
  const router = useRouter();
  const { isAuthenticated, isLocalAuth, planTier } = useSupabase();
  const {
    subscription,
    loading: subscriptionLoading,
    error: subscriptionError,
    openBillingPortal,
  } = useSubscription({ enabled: isAuthenticated && !isLocalAuth });

  const currentPlan = useMemo<PlanTier>(() => subscription?.plan ?? planTier ?? 'free', [planTier, subscription?.plan]);
  const subscriptionStatus = subscription?.status ?? 'active';
  const statusLabel = useMemo(() => {
    return subscriptionStatus
      .replace(/_/g, ' ')
      .split(' ')
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(' ');
  }, [subscriptionStatus]);
  const renewalDate = subscription?.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd).toLocaleDateString()
    : null;
  const trialEnds = subscription?.trialEnd
    ? new Date(subscription.trialEnd).toLocaleDateString()
    : null;
  const showPortalActions = isAuthenticated && !isLocalAuth;

  const handleManageSubscription = useCallback(async () => {
    if (!showPortalActions) {
      router.push('/auth?view=sign-in');
      return;
    }

    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
      const portal = await openBillingPortal(`${origin}/billing`);
      const url = (portal as any)?.portalUrl ?? String(portal ?? '');
      if (url) {
        window.location.href = url;
      } else {
        toast.error('Unable to open the billing portal.');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to open the billing portal.';
      toast.error(message);
    }
  }, [openBillingPortal, router, showPortalActions]);

  const handleCheckout = useCallback(
    async (planId: PlanTier) => {
      if (isLocalAuth) {
        toast.error('Billing upgrades are disabled in offline mode.');
        return;
      }

      if (!isAuthenticated) {
        router.push('/auth?view=sign-in');
        return;
      }

      if (planId === currentPlan) {
        await handleManageSubscription();
        return;
      }

      try {
        const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
        const session = await api.createCheckoutSession(planId, `${origin}/billing`);
        if (session.checkoutUrl) {
          window.location.href = session.checkoutUrl;
        } else {
          toast.error('Unable to start checkout.');
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unable to start checkout.';
        toast.error(message);
      }
    },
    [currentPlan, handleManageSubscription, isAuthenticated, isLocalAuth, router],
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 px-4 py-12">
      <div className="mx-auto max-w-6xl space-y-10">
        <div className="text-center space-y-3">
          <h1 className="text-3xl font-bold">Choose the plan that grows with you</h1>
          <p className="text-muted-foreground mx-auto max-w-2xl">
            Pricing reflects real compute, LLM, and support costs with healthy margins so the product stays sustainable.
          </p>
          {!isAuthenticated && (
            <Button variant="secondary" onClick={() => router.push('/auth?view=sign-in')} className="mt-2">
              Sign in to upgrade
            </Button>
          )}
        </div>

        <div className="space-y-4">
          {subscriptionError && (
            <Alert variant="destructive">
              <AlertTitle>Unable to load subscription</AlertTitle>
              <AlertDescription>{subscriptionError}</AlertDescription>
            </Alert>
          )}

          {isLocalAuth && (
            <Alert>
              <AlertTitle>Local mode detected</AlertTitle>
              <AlertDescription>
                Billing upgrades are disabled while running locally. Deploy the cloud edition to manage subscriptions.
              </AlertDescription>
            </Alert>
          )}

          <div className="mx-auto max-w-4xl rounded-2xl border border-border/60 bg-background/80 p-6 shadow-sm backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Current plan</p>
                <h2 className="text-2xl font-semibold text-foreground">{formatPlanLabel(currentPlan)}</h2>
              </div>
              <Badge variant="secondary" className="capitalize">
                {statusLabel}
              </Badge>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              {renewalDate ? <span>Renews on {renewalDate}</span> : <span>Free tier — upgrade to unlock automation</span>}
              {trialEnds && <span>Trial ends {trialEnds}</span>}
              {subscription?.cancelAtPeriodEnd && (
                <span className="text-amber-500">Scheduled to cancel at period end</span>
              )}
            </div>

            {showPortalActions && (
              <div className="mt-5 flex flex-wrap gap-3">
                <Button onClick={handleManageSubscription} disabled={subscriptionLoading}>
                  Manage subscription
                </Button>
                <Button variant="ghost" onClick={() => router.push('/profile')}>
                  View account profile
                </Button>
              </div>
            )}
          </div>
        </div>

        {error ? (
          <Alert variant="destructive">
            <AlertTitle>Unable to load plans</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          <PlanGrid
            plans={plans}
            onCheckout={handleCheckout}
            isLoading={loading || subscriptionLoading}
            currentPlan={currentPlan}
            onManageCurrentPlan={showPortalActions ? handleManageSubscription : undefined}
          />
        )}
      </div>
    </div>
  );
}
