'use client';

import { useCallback, useMemo } from 'react';

import { useSupabaseContext } from '../context/supabase-provider';
import { normalizePlanTier, type PlanTier } from '@/lib/plan-info';
import { useOpenStrandStore } from '@/store/openstrand.store';
import { useAppMode } from '@/hooks/useAppMode';

type LightweightUser = {
  id: string;
  email: string;
  app_metadata?: Record<string, any>;
  user_metadata?: Record<string, any>;
  created_at?: string;
};

const OFFLINE_FLAG =
  typeof process !== 'undefined'
    ? process.env.NEXT_PUBLIC_OFFLINE_MODE === 'true'
    : false;

export function useSupabase() {
  const { supabase, session, loading, authEnabled } = useSupabaseContext();
  const capabilities = useOpenStrandStore((state) => state.capabilities);
  const { mode } = useAppMode();

  const inferredAuthMode =
    capabilities?.environment?.auth ??
    (OFFLINE_FLAG || mode === 'offline' ? 'local' : 'supabase');
  const isLocalAuth = inferredAuthMode === 'local';

  const supabaseUser = session?.user ?? null;

  const fallbackLocalUser: LightweightUser | null = useMemo(() => {
    if (!isLocalAuth) {
      return null;
    }
    return {
      id: 'local-admin',
      email: 'local@frame.dev',
      created_at: new Date(0).toISOString(),
      user_metadata: {
        full_name: 'Local Workspace',
      },
      app_metadata: {
        role: 'admin',
        plan: 'local',
      },
    };
  }, [isLocalAuth]);

  const user = (supabaseUser ?? fallbackLocalUser) as (typeof supabaseUser) | LightweightUser | null;

  const planTier: PlanTier = useMemo(() => {
    if (supabaseUser) {
      const metadata =
        (supabaseUser.app_metadata as Record<string, any> | undefined) ||
        (supabaseUser.user_metadata as Record<string, any> | undefined) ||
        {};
      const planValue = metadata?.plan_tier ?? metadata?.planTier ?? metadata?.plan;
      return normalizePlanTier(planValue);
    }
    if (isLocalAuth) {
      return 'free';
    }
    return 'free';
  }, [supabaseUser, isLocalAuth]);

  const effectiveAuthEnabled = authEnabled || isLocalAuth;
  const isAuthenticated = isLocalAuth || (authEnabled && Boolean(supabaseUser));

  const signOut = useCallback(async () => {
    if (isLocalAuth || !supabase) {
      return;
    }
    await supabase.auth.signOut();
  }, [isLocalAuth, supabase]);

  return {
    supabase: isLocalAuth ? null : supabase,
    session,
    user,
    loading,
    authEnabled: effectiveAuthEnabled,
    authMode: inferredAuthMode,
    isLocalAuth,
    planTier,
    isAuthenticated,
    signOut,
  };
}
