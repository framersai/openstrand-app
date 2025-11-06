'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';

import { BrowserSupabaseClient, getSupabaseBrowserClient } from '@/lib/supabase-client';
import { api } from '@/services/api';

interface SupabaseContextValue {
  supabase: BrowserSupabaseClient | null;
  session: Session | null;
  loading: boolean;
  authEnabled: boolean;
}

const SupabaseContext = createContext<SupabaseContextValue | undefined>(undefined);

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [supabase] = useState<BrowserSupabaseClient | null>(() => getSupabaseBrowserClient());
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const authEnabled = Boolean(supabase);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      api.setAuthToken();
      return;
    }

    let isMounted = true;

    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (isMounted) {
        setSession(data.session);
        setLoading(false);
        api.setAuthToken(data.session?.access_token);
      }
    };

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      api.setAuthToken(newSession?.access_token);
    });

    void init();

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
      api.setAuthToken();
    };
  }, [supabase]);

  const value = useMemo(
    () => ({ supabase, session, loading, authEnabled }),
    [supabase, session, loading, authEnabled]
  );

  return <SupabaseContext.Provider value={value}>{children}</SupabaseContext.Provider>;
}

export function useSupabaseContext(): SupabaseContextValue {
  const context = useContext(SupabaseContext);
  if (!context) {
    throw new Error('useSupabaseContext must be used within SupabaseProvider');
  }
  return context;
}
