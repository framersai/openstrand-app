import type { PlanTier } from '@/types';
export type { PlanTier };

const PLAN_FALLBACK: PlanTier =
  (process.env.NEXT_PUBLIC_DEFAULT_PLAN_TIER as PlanTier) || 'free';

export const PLAN_UPLOAD_LIMITS_MB: Record<PlanTier, number | null> = {
  free: 5,
  basic: 10,
  cloud: 50,
  pro: null,
  team: null,
  org: null,
  enterprise: null,
};

export function normalizePlanTier(value?: string | null): PlanTier {
  if (!value) return PLAN_FALLBACK;
  const normalized = value.toLowerCase();
  switch (normalized) {
    case 'free':
    case 'cloud':
    case 'pro':
    case 'team':
    case 'enterprise':
      return normalized as PlanTier;
    case 'basic':
      return 'cloud';
    default:
      return PLAN_FALLBACK;
  }
}

export function getPlanUploadLimitMb(plan: PlanTier): number | null {
  return PLAN_UPLOAD_LIMITS_MB[plan] ?? null;
}

export function formatPlanLabel(plan: PlanTier): string {
  switch (plan) {
    case 'cloud':
      return 'Cloud';
    case 'pro':
      return 'Pro';
    case 'team':
      return 'Team';
    case 'enterprise':
      return 'Enterprise';
    default:
      return 'Free';
  }
}
