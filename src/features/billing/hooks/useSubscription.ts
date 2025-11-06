"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';

import { useSupabase } from '@/features/auth';
import { api } from '@/services/api';
import type { PlanTier } from '@/lib/plan-info';
import type { InvoiceSummary, SubscriptionSummary } from '../types';

interface UseSubscriptionOptions {
  /** Whether the hook should fetch subscription data. Defaults to true. */
  enabled?: boolean;
  /** Maximum number of invoices to load on each refresh. Defaults to 10. */
  invoiceLimit?: number;
}

interface UseSubscriptionResult {
  subscription: SubscriptionSummary | null;
  invoices: InvoiceSummary[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  cancelSubscription: (immediate?: boolean) => Promise<void>;
  changePlan: (plan: PlanTier) => Promise<SubscriptionSummary>;
  openBillingPortal: (returnUrl?: string) => Promise<string>;
  isCloudAccount: boolean;
}

const DEFAULT_OPTIONS: Required<Pick<UseSubscriptionOptions, 'enabled' | 'invoiceLimit'>> = {
  enabled: true,
  invoiceLimit: 10,
};

/**
 * Subscribe to billing data for the authenticated user.
 * Provides helpers for refreshing the subscription snapshot, cancelling plans,
 * upgrading/downgrading tiers, and opening the external billing portal.
 */
export function useSubscription(
  { enabled = DEFAULT_OPTIONS.enabled, invoiceLimit = DEFAULT_OPTIONS.invoiceLimit }: UseSubscriptionOptions = {},
): UseSubscriptionResult {
  const { isAuthenticated, isLocalAuth } = useSupabase();
  const [subscription, setSubscription] = useState<SubscriptionSummary | null>(null);
  const [invoices, setInvoices] = useState<InvoiceSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shouldLoad = enabled && isAuthenticated && !isLocalAuth;

  const fetchData = useCallback(async () => {
    if (!shouldLoad) {
      setSubscription(null);
      setInvoices([]);
      return;
    }

    setLoading(true);
    try {
      const [subscriptionResponse, invoicesResponse] = await Promise.all([
        api.getSubscription(),
        api.listInvoices(invoiceLimit),
      ]);

      setSubscription(subscriptionResponse);
      setInvoices(invoicesResponse);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load subscription details.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [invoiceLimit, shouldLoad]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const cancelSubscription = useCallback(
    async (immediate = false) => {
      if (!shouldLoad) return;
      await api.cancelSubscription(immediate);
      await fetchData();
    },
    [fetchData, shouldLoad],
  );

  const changePlan = useCallback(
    async (plan: PlanTier) => {
      if (!shouldLoad) {
        throw new Error('Billing is not enabled for this account.');
      }
      const updated = await api.changeSubscriptionPlan(plan);
      setSubscription(updated);
      await fetchData();
      return updated;
    },
    [fetchData, shouldLoad],
  );

  const openBillingPortal = useCallback(async (returnUrl?: string) => {
    if (!shouldLoad) {
      throw new Error('Billing portal is unavailable in local mode.');
    }
    const { portalUrl } = await api.getBillingPortal(returnUrl);
    return portalUrl;
  }, [shouldLoad]);

  return useMemo(() => ({
    subscription,
    invoices,
    loading,
    error,
    refresh: fetchData,
    cancelSubscription,
    changePlan,
    openBillingPortal,
    isCloudAccount: shouldLoad,
  }), [cancelSubscription, changePlan, error, fetchData, invoices, loading, openBillingPortal, shouldLoad, subscription]);
}
