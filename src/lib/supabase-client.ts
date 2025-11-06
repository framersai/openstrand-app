import { createBrowserSupabaseClient } from '@supabase/auth-helpers-nextjs';
import type { SupabaseClient } from '@supabase/supabase-js';

export type BrowserSupabaseClient = SupabaseClient<any, any, any>;

let browserClient: BrowserSupabaseClient | null = null;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const OFFLINE_MODE = typeof process !== 'undefined'
  ? process.env.NEXT_PUBLIC_OFFLINE_MODE === 'true'
  : false;

export function getSupabaseBrowserClient(): BrowserSupabaseClient | null {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    if (!OFFLINE_MODE && process.env.NODE_ENV !== 'production' && typeof window !== 'undefined') {
      console.warn(
        '[auth] NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY are not set. Supabase auth features are disabled for this session.'
      );
    }
    return null;
  }

  if (!browserClient) {
    browserClient = createBrowserSupabaseClient({
      supabaseUrl: SUPABASE_URL,
      supabaseKey: SUPABASE_ANON_KEY,
    }) as BrowserSupabaseClient;
  }

  return browserClient;
}

