'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Menu, X, Settings, FileText, Network, Brain, Plus, Home, WifiOff, Cloud } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useLocalizedPath } from '@/hooks/useLocalizedPath';
import { useSupabase } from '@/features/auth';
import { OpenStrandLogo } from '@/components/icons/OpenStrandLogo';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { LanguageSwitcher } from '@/components/language-switcher';
import { useAppMode } from '@/hooks/useAppMode';
import { AuthButton } from '@/features/auth';
import { cn } from '@/lib/utils';

const PKMS_NAV = [
  { key: 'overview', href: '/pkms', label: 'Overview', icon: Brain },
  { key: 'strands', href: '/pkms/strands', label: 'My Strands', icon: FileText },
  { key: 'weave', href: '/pkms/weave', label: 'Knowledge Graph', icon: Network },
  { key: 'import', href: '/pkms/import', label: 'Import', icon: Plus },
];

interface PKMSHeaderProps {
  onOpenSettings?: () => void;
}

export function PKMSHeader({ onOpenSettings }: PKMSHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const localizePath = useLocalizedPath();
  const { isAuthenticated } = useSupabase();
  const { mode } = useAppMode();

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/95 backdrop-blur-xl">
      <div className="container mx-auto px-4 py-3">
        <div className="flex w-full items-center gap-4">
          {/* Logo */}
          <Link
            href={localizePath('/')}
            className="flex items-center gap-3"
            onClick={closeMobileMenu}
          >
            <OpenStrandLogo size="sm" variant="default" />
            <div className="flex flex-col">
              <span className="text-base font-semibold tracking-tight">OpenStrand</span>
              <span className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground">
                PKMS
              </span>
            </div>
          </Link>

          <Separator orientation="vertical" className="hidden h-8 lg:block" />

          {/* Navigation */}
          <nav className="hidden flex-1 items-center gap-4 text-sm font-medium lg:flex">
            {PKMS_NAV.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.key}
                  href={localizePath(item.href)}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2 transition-all",
                    "text-foreground/70 hover:bg-primary/5 hover:text-foreground",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Connection status */}
            <Badge 
              variant="outline" 
              className={cn(
                "hidden gap-1.5 border-border/50 text-xs sm:flex",
                mode === 'offline' ? 'border-amber-400/50 text-amber-700 dark:text-amber-300' : ''
              )}
            >
              {mode === 'offline' ? (
                <>
                  <WifiOff className="h-3 w-3" />
                  Local Only
                </>
              ) : (
                <>
                  <Cloud className="h-3 w-3 text-emerald-600" />
                  Synced
                </>
              )}
            </Badge>

            <div className="hidden items-center gap-2 lg:flex">
              <ThemeSwitcher />
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
              
              <Separator orientation="vertical" className="h-6" />
              
              {isAuthenticated ? (
                <>
                  <AuthButton />
                  <Button asChild size="sm">
                    <Link href={localizePath('/')}>
                      <Home className="mr-2 h-4 w-4" />
                      Dashboard
                    </Link>
                  </Button>
                </>
              ) : (
                <Button asChild size="sm" className="gap-2">
                  <Link href={localizePath('/auth?mode=register')}>
                    Get Started
                  </Link>
                </Button>
              )}
            </div>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="mt-4 space-y-4 rounded-2xl border border-border/60 bg-background/95 p-4 shadow-xl lg:hidden">
            <nav className="flex flex-col gap-2">
              {PKMS_NAV.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.key}
                    href={localizePath(item.href)}
                    className="flex items-center gap-3 rounded-xl border border-transparent px-3 py-3 text-sm font-medium text-foreground/80 transition hover:border-primary/30 hover:bg-primary/5"
                    onClick={closeMobileMenu}
                  >
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            
            <Separator />
            
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="gap-1.5 text-xs">
                  {mode === 'offline' ? (
                    <>
                      <WifiOff className="h-3 w-3" />
                      Local Only
                    </>
                  ) : (
                    <>
                      <Cloud className="h-3 w-3 text-emerald-600" />
                      Synced
                    </>
                  )}
                </Badge>
                
                <div className="flex items-center gap-2">
                  <ThemeSwitcher tooltip="Change theme" />
                  <LanguageSwitcher currentLocale={locale} variant="compact" />
                </div>
              </div>
              
              <div className="flex gap-2 pt-2">
                {isAuthenticated ? (
                  <>
                    <AuthButton className="flex-1" />
                    <Button asChild size="sm" className="flex-1">
                      <Link href={localizePath('/')} onClick={closeMobileMenu}>
                        Dashboard
                      </Link>
                    </Button>
                  </>
                ) : (
                  <Button asChild size="sm" className="w-full">
                    <Link href={localizePath('/auth?mode=register')} onClick={closeMobileMenu}>
                      Get Started
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
