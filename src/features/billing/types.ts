import type { PlanTier } from '@/lib/plan-info';
import type { BillingPlan, CheckoutSession } from '@/types';

export type { PlanTier, BillingPlan, CheckoutSession };

export type SubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'canceled'
  | 'paused'
  | 'incomplete'
  | 'incomplete_expired'
  | 'unpaid';

export interface SubscriptionSummary {
  id: string;
  plan: PlanTier;
  status: SubscriptionStatus;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  trialEnd?: string;
}

export interface InvoiceSummary {
  id: string;
  amount: number;
  currency: string;
  status: string;
  paidAt?: string;
  invoiceUrl?: string;
  invoicePdf?: string;
}

export interface BillingPortalLink {
  portalUrl: string;
}
