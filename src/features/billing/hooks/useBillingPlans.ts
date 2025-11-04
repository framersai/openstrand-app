'use client';

import { useEffect, useState } from 'react';

import { api } from '@/services/api';
import type { BillingPlan } from '../types';

interface BillingState {
  plans: BillingPlan[];
  loading: boolean;
  error: string | null;
}

export function useBillingPlans(): BillingState {
  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        setLoading(true);
        const data = await api.listBillingPlans();
        if (active) {
          setPlans(data);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Failed to load plans');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, []);

  return { plans, loading, error };
}
