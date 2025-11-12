import { useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Menu, Settings, Sparkles, X, Database, User, Home, LifeBuoy, CreditCard } from 'lucide-react';

import { LanguageSwitcher } from '@/components/language-switcher';
import { CostTracker } from '@/components/cost-tracker';
import { Button } from '@/components/ui/button';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AuthButton } from '@/features/auth';
import { useLocalizedPath } from '@/hooks/useLocalizedPath';
import { TourActivationButton } from '@/components/guided-tour/GuidedTour';
import { GuestCreditIndicator } from '@/components/guest-credit-indicator';
import { useSupabase } from '@/features/auth';
import type { Locale } from '@/i18n/config';

interface DashboardHeaderProps {
  onOpenSettings: () => void;
}

type NavItem = {
  key: 'home' | 'product' | 'datasets' | 'pricing' | 'support';
  href: string;
  icon: typeof Home;
  badge?: string;
};

const NAV_ITEMS: NavItem[] = [
  { key: 'home', href: '/', icon: Home },
  { key: 'product', href: '/landing', icon: Sparkles },
  { key: 'datasets', href: '/catalogs', icon: Database, badge: 'New' },
  { key: 'pricing', href: '/billing', icon: CreditCard },
  { key: 'support', href: '/contact', icon: LifeBuoy },
];

export function DashboardHeader({ onOpenSettings }: DashboardHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const tCommon = useTranslations('common');
  const tBilling = useTranslations('billing');
  const tAuth = useTranslations('auth');
  const locale = useLocale() as Locale;
  const localizePath = useLocalizedPath();
  const { isAuthenticated, authEnabled } = useSupabase();

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <TooltipProvider>
      <header className="dashboard-header sticky top-0 z-50 border-b border-border/60 bg-background/95 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-3">
          <div className="flex w-full items-center gap-4">
            <div className="flex min-w-0 flex-1 items-center gap-4">
              <Link
                href={localizePath('/')}
                className="flex flex-shrink-0 items-center gap-3"
                onClick={closeMobileMenu}
              >
                <span className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/70 shadow-lg shadow-primary/30">
                  <Sparkles className="h-5 w-5 text-primary-foreground" />
                  <span className="absolute -top-1.5 -right-1.5 rounded-full bg-background px-1.5 py-0.5 text-[10px] font-semibold uppercase text-primary">
                    ai
                  </span>
                </span>
                <div className="flex flex-col">
                  <span className="text-xl font-semibold tracking-tight text-foreground">
                    {tCommon('app.name')}
                  </span>
                  <span className="text-xs uppercase tracking-[0.3em] text-primary/80">
                    {tCommon('app.tagline')}
                  </span>
                </div>
              </Link>

              <Separator orientation="vertical" className="hidden h-8 lg:block" />

              <nav className="hidden flex-1 items-center justify-center gap-5 text-sm font-medium lg:flex">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.key}
                      href={localizePath(item.href)}
                      className="relative inline-flex items-center gap-2 rounded-full px-4 py-2 text-foreground/80 transition-all hover:scale-105 hover:bg-primary/10 hover:text-foreground"
                    >
                      {Icon && <Icon className="h-4 w-4" />}
                      <span>{tCommon(`navigation.${item.key}` as const)}</span>
                      {item.badge && (
                        <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[10px]">
                          {item.badge}
                        </Badge>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="hidden items-center gap-2 lg:flex">
              {/* Show guest credit indicator for guests, cost tracker for users */}
              {!isAuthenticated ? (
                <GuestCreditIndicator variant="minimal" />
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="hidden shrink-0 max-w-[180px] rounded-full border border-border/70 bg-background/60 px-3 py-1 text-xs font-semibold text-foreground/80 xl:flex">
                      <CostTracker mode="compact" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" align="end">
                    {tCommon('tooltips.realTimeSpend')}
                  </TooltipContent>
                </Tooltip>
              )}

              <Separator orientation="vertical" className="h-6" />

              <ThemeSwitcher tooltip="Change theme & appearance" />
              <LanguageSwitcher currentLocale={locale} variant="compact" showName={false} />
              <TourActivationButton />

              {/* Profile link */}
              <Link href={localizePath('/profile')}>
                <Button variant="ghost" size="sm" className="h-8 px-2">
                  <User className="h-4 w-4" />
                </Button>
              </Link>

              <Separator orientation="vertical" className="h-6" />

              {isAuthenticated ? (
                <AuthButton />
              ) : authEnabled ? (
                <Button asChild size="sm" variant="outline">
                  <Link href={localizePath('/auth?mode=register')}>
                    {tAuth('signUp.button')}
                  </Link>
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  disabled
                  title={tAuth('errors.setupRequired')}
                >
                  {tAuth('signUp.button')}
                </Button>
              )}

              <Button asChild size="sm" variant="default">
                <Link href={localizePath('/billing')}>
                  <Sparkles className="mr-1 h-4 w-4" />
                  {tBilling('plans.free.button')}
                </Link>
              </Button>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onOpenSettings}
                    className="settings-button hover:text-primary"
                    aria-label={tCommon('tooltips.openSettings')}
                  >
                    <Settings className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent align="end">{tCommon('tooltips.providerSettings')}</TooltipContent>
              </Tooltip>
            </div>

            <div className="flex flex-shrink-0 items-center gap-2 lg:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                aria-label={tCommon('tooltips.toggleNavigation')}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>

          {mobileMenuOpen && (
            <div className="mt-4 space-y-4 rounded-2xl border border-border/60 bg-background/95 p-4 shadow-xl lg:hidden">
              <div className="flex items-center justify-between rounded-xl border border-border/70 bg-background/60 px-3 py-3 text-xs font-medium text-foreground/80">
                <CostTracker mode="compact" />
                <div className="flex items-center gap-2">
                  <ThemeSwitcher tooltip="Change theme & appearance" buttonVariant="ghost" />
                  <LanguageSwitcher currentLocale={locale} variant="compact" />
                  <TourActivationButton />
                </div>
              </div>
              <div className="flex items-center justify-between gap-2">
                <AuthButton />
                <Button asChild size="sm" variant="default" className="flex-1">
                  <Link href={localizePath('/billing')}>
                    <Sparkles className="mr-1 h-4 w-4" />
                    {tBilling('plans.free.button')}
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    onOpenSettings();
                    closeMobileMenu();
                  }}
                  aria-label={tCommon('tooltips.openSettings')}
                >
                  <Settings className="h-5 w-5" />
                </Button>
              </div>
              <Separator />
              <nav className="flex flex-col gap-2 text-sm font-medium text-foreground/90">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.key}
                      href={localizePath(item.href)}
                      className="rounded-xl border border-transparent px-3 py-3 transition-colors hover:border-primary/30 hover:bg-primary/5 flex items-center gap-3"
                      onClick={closeMobileMenu}
                    >
                      {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
                      <span>{tCommon(`navigation.${item.key}` as const)}</span>
                      {item.badge && (
                        <Badge variant="secondary" className="ml-auto px-1.5 py-0 text-[10px]">
                          {item.badge}
                        </Badge>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>
          )}
        </div>
      </header>
    </TooltipProvider>
  );
}


