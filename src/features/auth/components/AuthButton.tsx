'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { LogIn, LogOut, Shield, User } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLocalizedPath } from '@/hooks/useLocalizedPath';
import { cn } from '@/lib/utils';

import { useSupabase } from '../hooks/useSupabase';

interface AuthButtonProps {
  className?: string;
  suppressLocalBadge?: boolean;
}

export function AuthButton({ className, suppressLocalBadge = false }: AuthButtonProps) {
  const {
    isAuthenticated,
    user,
    loading,
    authEnabled,
    isLocalAuth,
    signOut,
  } = useSupabase();
  const [signingOut, setSigningOut] = useState(false);
  const [mounted, setMounted] = useState(false);
  const tAuth = useTranslations('auth');
  const localizePath = useLocalizedPath();

  // Avoid hydration mismatches by deferring UI until after first client render.
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut();
    setSigningOut(false);
  };

  if (loading) {
    return (
      <Button variant="ghost" size="sm" disabled className={className}>
        {tAuth('signIn.loading')}
      </Button>
    );
  }

  if (!isAuthenticated) {
    if (!authEnabled) {
      return (
        <Button
          variant="secondary"
          size="sm"
          disabled
          title={tAuth('errors.setupRequired')}
          className={className}
        >
          <LogIn className="mr-2 h-4 w-4" />
          {tAuth('signIn.button')}
        </Button>
      );
    }

    return (
      <Button asChild variant="secondary" size="sm" className={className}>
        <Link href={localizePath('/auth')}>
          <LogIn className="mr-2 h-4 w-4" />
          {tAuth('signIn.button')}
        </Link>
      </Button>
    );
  }

  if (isLocalAuth) {
    if (suppressLocalBadge) {
      return null;
    }
    return (
      <div
        className={cn(
          'inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/60 px-3 py-1 text-xs font-semibold text-muted-foreground',
          className
        )}
      >
        <Shield className="h-3.5 w-3.5 text-primary" />
        <span>{tAuth('messages.localAccess')}</span>
      </div>
    );
  }

  const displayName = (user?.user_metadata as Record<string, any> | undefined)?.full_name || user?.email || 'Account';
  const initials = displayName
    .split(' ')
    .map((segment: string) => segment[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn('gap-3 rounded-full border border-border/60 bg-card/80 px-2 py-1.5 font-medium', className)}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
            {initials || <User className="h-4 w-4" />}
          </span>
          <span className="hidden text-sm font-medium sm:inline">{displayName}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem asChild>
          <Link href={localizePath('/profile')}>Profile &amp; preferences</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={localizePath('/billing')}>Billing &amp; subscriptions</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleSignOut}
          disabled={signingOut}
          className="flex items-center gap-2 text-destructive focus:text-destructive"
        >
          <LogOut className="h-4 w-4" />
          {signingOut ? tAuth('signOut.loading') : tAuth('signOut.button')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
