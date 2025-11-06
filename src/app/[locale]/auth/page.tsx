'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSupabase } from '@/features/auth';
import { useLocalizedPath } from '@/hooks/useLocalizedPath';

export default function AuthPage() {
  const { supabase, session, loading, authEnabled } = useSupabase();
  const router = useRouter();
  const localizePath = useLocalizedPath();
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '');
  const authRedirectPath = localizePath('/auth');

  useEffect(() => {
    if (!authEnabled || loading) {
      return;
    }
    if (session) {
      router.replace(localizePath('/'));
    }
  }, [authEnabled, loading, session, router, localizePath]);

  if (!authEnabled) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/10 flex items-center justify-center px-4 py-16">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-center">Authentication Disabled</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Supabase credentials are not configured for this environment.</p>
            <p>
              Set <code className="font-mono">NEXT_PUBLIC_SUPABASE_URL</code> and{' '}
              <code className="font-mono">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in{' '}
              <code className="font-mono">frontend/.env.local</code>, then restart the dev server to enable sign-in.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/10 flex items-center justify-center px-4 py-16">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-center">Authenticating…</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Initialising Supabase client. This usually completes instantly; refresh if it persists.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/10 flex items-center justify-center px-4 py-16">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-center">Sign in to OpenStrand</CardTitle>
        </CardHeader>
        <CardContent>
          <Auth
            supabaseClient={supabase}
            view="sign_in"
            providers={['github', 'google']}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: 'hsl(var(--primary))',
                    brandAccent: 'hsl(var(--primary))',
                  },
                },
              },
            }}
            redirectTo={`${siteUrl}${authRedirectPath}`}
          />
        </CardContent>
      </Card>
    </div>
  );
}
