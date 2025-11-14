'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import type { Locale } from '@/i18n/config';
import { Menu, X, Github, Settings, WifiOff, Cloud, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLocalizedPath } from '@/hooks/useLocalizedPath';
import { useSupabase } from '@/features/auth';
import { OpenStrandLogo } from '@/components/icons/OpenStrandLogo';
import { GitHubStats } from '@/components/github/GitHubStats';
import { ThemeToggle } from '@/components/theme-toggle';
import { LanguageSwitcher } from '@/components/language-switcher';
import { useAppMode } from '@/hooks/useAppMode';
import { Separator } from '@/components/ui/separator';

const NAV_ITEMS = [
  { key: 'features', href: '#features', label: 'Features', badge: undefined },
  { key: 'pricing', href: '#pricing', label: 'Pricing', badge: undefined },
  { key: 'docs', href: '/docs', label: 'Documentation', badge: undefined },
  { key: 'pkms', href: '/pkms', label: 'PKMS', badge: 'New' },
  { key: 'shortcuts', href: '/tutorials/keyboard-shortcuts', label: 'Keyboard /', badge: undefined },
] as const;

interface LandingHeaderProps {
  onOpenSettings?: () => void;
}

export function LandingHeader({ onOpenSettings }: LandingHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const tCommon = useTranslations('common');
  const tAuth = useTranslations('auth');
  const localizePath = useLocalizedPath();
  const locale = useLocale() as Locale;
  const { isAuthenticated, authEnabled } = useSupabase();
  const { mode } = useAppMode();
  const tutorialLink = localizePath('/tutorials');

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const renderAuthButton = (variant: 'ghost' | 'secondary', size: 'sm' | 'lg' = 'sm') => {
    if (!authEnabled) {
      return (
        <Button
          variant={variant}
          size={size}
          disabled
          title={tAuth('errors.setupRequired')}
          className={variant === 'ghost' ? 'justify-start' : undefined}
        >
          {tAuth('signIn.button')}
        </Button>
      );
    }

    if (isAuthenticated) {
      return (
        <Button asChild variant={variant} size={size} className={variant === 'ghost' ? 'justify-start' : undefined}>
          <Link href={localizePath('/profile')} onClick={closeMobileMenu}>
            {tAuth('profile.title')}
          </Link>
        </Button>
      );
    }

    return (
      <Button asChild variant={variant} size={size} className={variant === 'ghost' ? 'justify-start' : undefined}>
        <Link href={localizePath('/auth')} onClick={closeMobileMenu}>
          {tAuth('signIn.button')}
        </Link>
      </Button>
    );
  };

  return (
    <header className="landing-header sticky top-0 z-40 border-b border-border/40 bg-background/90 backdrop-blur">
      <div className="container mx-auto flex items-center justify-between gap-3 px-4 py-4">
        <Link
          href={localizePath('/')}
          className="flex items-center gap-3 text-foreground"
          onClick={closeMobileMenu}
        >
          <OpenStrandLogo size="md" variant="default" />
          <div className="flex flex-col">
            <span className="text-lg font-semibold tracking-tight">OpenStrand</span>
            <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              Free • Open Source
            </span>
          </div>
        </Link>

        <nav className="hidden flex-1 items-center justify-center gap-6 text-sm font-medium lg:flex">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.key}
              href={item.href.startsWith('#') ? item.href : localizePath(item.href)}
              className="relative inline-flex items-center gap-2 rounded-full px-4 py-2 text-foreground/80 transition hover:bg-primary/10 hover:text-foreground"
            >
              {item.label}
              {item.badge && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 py-0 text-[10px]">
                  {item.badge}
                </Badge>
              )}
            </Link>
          ))}
          <Button asChild size="sm" className="group px-5 font-semibold">
            <Link href={tutorialLink}>
              <span className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Tutorials
              </span>
              <span className="absolute inset-0 -z-10 bg-white/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            </Link>
          </Button>
          <Separator orientation="vertical" className="mx-2 h-6" />
          <GitHubStats variant="compact" />
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          {/* Connection status */}
          <Badge variant="outline" className="gap-1.5 border-border/50 text-xs">
            {mode === 'offline' ? (
              <>
                <WifiOff className="h-3 w-3" />
                Local Mode
              </>
            ) : (
              <>
                <Cloud className="h-3 w-3 text-emerald-600" />
                Cloud Ready
              </>
            )}
          </Badge>

          <Separator orientation="vertical" className="h-6" />

            <div className="flex items-center gap-2">
            <ThemeToggle />
            <LanguageSwitcher currentLocale={locale} variant="compact" showName={false} />

            {onOpenSettings && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onOpenSettings}
                className="h-8 w-8"
              >
                <Settings className="h-4 w-4" />
              </Button>
            )}
          </div>

          <Separator orientation="vertical" className="h-6" />
          
          {isAuthenticated ? (
            <Button asChild size="sm" className="gap-2">
              <Link href={localizePath('/')}>
                Open Dashboard
              </Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <a href="https://github.com/framersai/openstrand" target="_blank" rel="noopener noreferrer">
                  <Github className="mr-2 h-4 w-4" />
                  Star on GitHub
                </a>
              </Button>
              <Button asChild size="sm" className="btn-gradient-border">
                <Link href={localizePath('/')}>
                  Start Free Forever
                </Link>
              </Button>
            </>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          aria-label={mobileMenuOpen ? tCommon('tooltips.toggleNavigation') : tCommon('tooltips.toggleNavigation')}
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-background/60 backdrop-blur-sm"
            onClick={closeMobileMenu}
            aria-hidden="true"
          />
          <div className="absolute left-3 right-3 top-16 rounded-2xl border border-border/60 bg-background/95 px-4 py-4 shadow-xl">
            <nav className="flex flex-col gap-2">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.key}
                href={item.href.startsWith('#') ? item.href : localizePath(item.href)}
                className="flex items-center justify-between rounded-xl border border-transparent px-4 py-3 text-sm font-medium text-foreground/80 transition hover:border-primary/40 hover:bg-primary/5 hover:text-foreground"
                onClick={closeMobileMenu}
              >
                {item.label}
                {item.badge && (
                  <Badge variant="secondary" className="ml-auto px-1.5 py-0 text-[10px]">
                    {item.badge}
                  </Badge>
                )}
              </Link>
            ))}
            <Button asChild size="lg" className="mt-2 w-full font-semibold">
              <Link href={tutorialLink} onClick={closeMobileMenu}>
                <span className="flex items-center justify-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Explore Tutorials
                </span>
              </Link>
            </Button>
            </nav>

            <Separator className="my-4" />
          
            <div className="space-y-3">
              <GitHubStats className="justify-center" />
            
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="gap-1.5 text-xs">
                  {mode === 'offline' ? (
                    <>
                      <WifiOff className="h-3 w-3" />
                      Local Mode
                    </>
                  ) : (
                    <>
                      <Cloud className="h-3 w-3 text-emerald-600" />
                      Cloud Ready
                    </>
                  )}
                </Badge>
              
                <div className="flex items-center gap-3">
                  <ThemeToggle />
                  <LanguageSwitcher currentLocale={locale} variant="compact" />
                </div>
              </div>
            
              <div className="flex flex-col gap-2 pt-2">
                {isAuthenticated ? (
                  <Button asChild size="lg" className="w-full">
                    <Link href={localizePath('/')} onClick={closeMobileMenu}>
                      Open Dashboard
                    </Link>
                  </Button>
                ) : (
                  <>
                    <Button asChild variant="outline" size="lg" className="w-full">
                      <a href="https://github.com/framersai/openstrand" target="_blank" rel="noopener noreferrer">
                        <Github className="mr-2 h-4 w-4" />
                        View on GitHub
                      </a>
                    </Button>
                    <Button asChild size="lg" className="btn-gradient-border w-full">
                      <Link href={localizePath('/')} onClick={closeMobileMenu}>
                        Start Free Forever
                      </Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
