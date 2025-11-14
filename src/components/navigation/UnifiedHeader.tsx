'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Plus, Settings, BookOpen, Code, GraduationCap } from 'lucide-react';
import React from 'react';
import { useTranslations } from 'next-intl';

import {
  FeedIcon,
  VisualizationsIcon,
  KnowledgeIcon,
  DatasetsIcon,
  FeaturesIcon,
  PricingIcon,
  DocsIcon,
  PKMSIcon,
} from '@/components/icons/NavigationIcons';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useLocalizedPath } from '@/hooks/useLocalizedPath';
import { useSupabase } from '@/features/auth';
import { OpenStrandLogo } from '@/components/icons/OpenStrandLogo';
import { GitHubStats } from '@/components/github/GitHubStats';
import { useAppMode } from '@/hooks/useAppMode';
import { AuthButton } from '@/features/auth';
import { GuestCreditIndicator } from '@/components/guest-credit-indicator';
import { cn } from '@/lib/utils';
import { useGuestSession } from '@/hooks/useGuestSession';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { LanguageSwitcher } from '@/components/language-switcher';
import { ThemeToggle } from '@/components/theme-toggle';
import { useFeatureFlags } from '@/lib/feature-flags';

type NavItem = {
  key: string;
  href: string;
  label: string;
  icon?: React.ComponentType<{ className?: string; isActive?: boolean }>;
  description?: string;
};

interface UnifiedHeaderProps {
  onOpenSettings?: () => void;
}

const LandingIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 20 20" fill="none" {...props}>
    <path
      d="M6 12.5 10 9l4 3.5"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M10 4v9"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
    />
    <circle cx="10" cy="10" r="8.5" stroke="currentColor" strokeOpacity={0.25} />
  </svg>
);

const AccountPortalIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <circle cx="12" cy="9" r="4" stroke="currentColor" strokeWidth="1.4" />
    <path
      d="M5.5 19c1.4-2.7 4.3-4.5 6.5-4.5s5.1 1.8 6.5 4.5"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
    />
    <path
      d="M17.5 4.5h3v3"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M20.5 4.5 17 8"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
    />
  </svg>
);

const API_DOCS_URL =
  (process.env.NEXT_PUBLIC_API_DOCS_URL ?? '') ||
  (process.env.NEXT_PUBLIC_API_URL
    ? `${process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '')}/docs`
    : '');

const SDK_DOCS_URL =
  process.env.NEXT_PUBLIC_SDK_DOCS_URL ??
  'https://github.com/framersai/openstrand/tree/main/docs/generated';

export function UnifiedHeader({ onOpenSettings }: UnifiedHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [docsExpanded, setDocsExpanded] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const localizePath = useLocalizedPath();
  const { isAuthenticated, authEnabled } = useSupabase();
  const { isGuest } = useGuestSession();
  const { mode } = useAppMode();
  const tCommon = useTranslations('common');
  const { isTeamEdition } = useFeatureFlags();

  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false);
    setDocsExpanded(false);
  }, []);

  // Determine which nav to show based on auth and path
  const isLandingPage = pathname === '/landing' || pathname.endsWith('/landing');
  const showDashboardNav = !isLandingPage;

  const landingNavItems: NavItem[] = useMemo(
    () => [
      { key: 'features', href: '#features', label: tCommon('navigation.features'), icon: FeaturesIcon },
      { key: 'pricing', href: '#pricing', label: tCommon('navigation.pricing'), icon: PricingIcon },
      { key: 'teams', href: '/teams', label: tCommon('navigation.teamsApi'), icon: DocsIcon },
      { key: 'docs', href: '#', label: tCommon('navigation.docs'), icon: DocsIcon },
      { key: 'pkms', href: '/pkms', label: tCommon('navigation.pkms'), icon: PKMSIcon },
      { key: 'import', href: '/composer', label: tCommon('navigation.import'), icon: DatasetsIcon },
    ],
    [tCommon],
  );

  const dashboardNavItems: NavItem[] = useMemo(
    () => [
      {
        key: 'feed',
        href: '/',
        label: tCommon('navigation.feed'),
        icon: FeedIcon,
        description: tCommon('navigationDescriptions.feed'),
      },
      {
        key: 'visualizations',
        href: '/visualizations',
        label: tCommon('navigation.visualizations'),
        icon: VisualizationsIcon,
        description: tCommon('navigationDescriptions.visualizations'),
      },
      {
        key: 'strands',
        href: '/pkms',
        label: tCommon('navigation.strands'),
        icon: KnowledgeIcon,
        description: tCommon('navigationDescriptions.strands'),
      },
      {
        key: 'datasets',
        href: '/', // TODO: Create catalogs page
        label: tCommon('navigation.datasets'),
        icon: DatasetsIcon,
        description: tCommon('navigationDescriptions.datasets'),
      },
      {
        key: 'import',
        href: '/composer',
        label: tCommon('navigation.import'),
        icon: DatasetsIcon,
        description: tCommon('actions.import'),
      },
    ],
    [tCommon],
  );

  const navItems = showDashboardNav ? dashboardNavItems : landingNavItems;
  const isCloudMode = mode === 'cloud';
  const landingLink = localizePath('/landing');
  const signInLink = localizePath('/auth?view=sign-in');
  const signUpLink = localizePath('/auth?view=sign-up');
  const openDashboardLink = localizePath('/');
  const importLink = localizePath('/composer');

  useEffect(() => {
    setMounted(true);
  }, []);

  const apiDocsUrl = API_DOCS_URL ? API_DOCS_URL : null;

  const docsLinks = useMemo(
    () => [
      {
        label: tCommon('docs.product.label'),
        description: tCommon('docs.product.description'),
        href: localizePath('/docs'),
        icon: <BookOpen className="h-4 w-4" aria-hidden />,
        external: false,
        disabled: false,
      },
      {
        label: tCommon('docs.tutorials.label'),
        description: tCommon('docs.tutorials.description'),
        href: localizePath('/tutorials'),
        icon: <GraduationCap className="h-4 w-4" aria-hidden />,
        external: false,
        disabled: false,
      },
      {
        label: tCommon('docs.api.label'),
        description: apiDocsUrl
          ? tCommon('docs.api.description')
          : tCommon('docs.api.unavailable'),
        href: apiDocsUrl ?? '#',
        icon: <Code className="h-4 w-4" aria-hidden />,
        external: true,
        disabled: !apiDocsUrl,
      },
      {
        label: tCommon('docs.sdk.label'),
        description: tCommon('docs.sdk.description'),
        href: SDK_DOCS_URL,
        icon: <DocsIcon className="h-4 w-4" aria-hidden />,
        external: true,
        disabled: false,
      },
    ],
    [apiDocsUrl, localizePath, tCommon],
  );

  const authControls = useMemo(() => {
    if (isAuthenticated) {
      return (
        <>
          <AuthButton suppressLocalBadge className="hidden md:inline-flex" />
          <AuthButton suppressLocalBadge className="md:hidden w-full justify-center" />
          <Button
            asChild
            size="sm"
            variant="outline"
            className="w-full justify-center rounded-full border-border/70 bg-background/80 text-foreground hover:border-primary/40 hover:bg-primary/10 hover:text-primary md:w-auto md:px-4"
          >
            <Link href={isLandingPage ? openDashboardLink : importLink}>
              {isLandingPage ? tCommon('actions.openDashboard') : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  {tCommon('actions.import')}
                </>
              )}
            </Link>
          </Button>
        </>
      );
    }

    if (authEnabled) {
      return (
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="font-semibold text-foreground/80 hover:text-primary">
            <Link href={signInLink}>{tCommon('actions.login')}</Link>
          </Button>
          {isCloudMode ? (
            <Button asChild size="sm" className="px-5 font-semibold">
              <Link href={signUpLink}>{tCommon('actions.startFree')}</Link>
            </Button>
          ) : (
            <Button asChild size="sm" variant="outline" className="rounded-full border-border/70">
              <Link href={signInLink}>{tCommon('actions.openLogin')}</Link>
            </Button>
          )}
        </div>
      );
    }

    if (onOpenSettings) {
      return (
        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenSettings}
          className="rounded-full border border-border/60 bg-card/80 text-foreground/80 hover:text-foreground"
          aria-label={tCommon('tooltips.openSettings')}
        >
          <Settings className="h-4 w-4" />
        </Button>
      );
    }

    return null;
  }, [
    authEnabled,
    importLink,
    isAuthenticated,
    isCloudMode,
    isLandingPage,
    onOpenSettings,
    openDashboardLink,
    signInLink,
    signUpLink,
    tCommon,
  ]);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header 
      className={cn(
        "sticky top-0 z-50 transition-all duration-300",
        "border-b backdrop-blur-xl",
        isScrolled 
          ? "border-border/60 bg-background/90 shadow-sm" 
          : "border-border/40 bg-background/95"
      )}
    >
      <div className="container mx-auto px-4 py-3">
        <div className="flex w-full items-center gap-4">
          {/* Logo */}
          <Link
            href={localizePath('/')}
            className="group flex items-center gap-3 rounded-full px-2 py-1 transition-transform hover:scale-105 hover:bg-primary/10"
            onClick={closeMobileMenu}
            aria-label="OpenStrand home"
          >
            <OpenStrandLogo 
              size="sm" 
              variant={isScrolled ? "mono" : "gradient"} 
              className="transition-all duration-300"
            />
            <div className="flex flex-col">
              <span className="text-base font-semibold tracking-tight">
                OpenStrand{isTeamEdition && showDashboardNav ? ' Teams' : ''}
              </span>
              {showDashboardNav && (
                <span className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground">
                  {isTeamEdition ? 'Teams Edition' : 'Dashboard'}
                </span>
              )}
            </div>
          </Link>

          <Separator orientation="vertical" className="hidden h-8 lg:block" />

          {/* Desktop Navigation */}
          <nav className="hidden flex-1 items-center gap-2 md:flex">
            {navItems.map((item) => {
              const Icon = item.icon ?? null;
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              
              if (item.key === 'docs') {
                return (
                  <DropdownMenu key={item.key}>
                    <DropdownMenuTrigger asChild>
                      <button
                        className={cn(
                          'group relative flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition-all',
                          'border-transparent text-foreground/75 hover:border-primary/30 hover:bg-primary/10 hover:text-foreground',
                        )}
                      >
                        {Icon && (
                          <Icon
                            className="h-4 w-4 text-foreground/60 transition-colors group-hover:text-foreground"
                            isActive={false}
                          />
                        )}
                        <span className="whitespace-nowrap">Docs</span>
                        <span className="text-xs text-muted-foreground group-hover:text-foreground/80">▾</span>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-72">
                      <DropdownMenuItem asChild disabled>
                        <span className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                          Strands
                        </span>
                      </DropdownMenuItem>
                      {docsLinks.map((link) => (
                        <DropdownMenuItem
                          key={link.label}
                          asChild={!!link.href && !link.disabled}
                          disabled={link.disabled}
                          className="flex cursor-pointer items-start gap-3 px-3 py-2.5"
                        >
                          {link.disabled ? (
                            <div className="flex items-start gap-3 opacity-70">
                              <span className="mt-1">{link.icon}</span>
                              <div>
                                <p className="text-sm font-medium">{link.label}</p>
                                <p className="text-xs text-muted-foreground">{link.description}</p>
                              </div>
                            </div>
                          ) : (
                            <a
                              href={link.href}
                              target={link.external ? '_blank' : undefined}
                              rel={link.external ? 'noreferrer' : undefined}
                              className="flex items-start gap-3"
                            >
                              <span className="mt-1">{link.icon}</span>
                              <span className="flex flex-1 flex-col text-left">
                                <span className="text-sm font-medium text-foreground">{link.label}</span>
                                <span className="text-xs text-muted-foreground">{link.description}</span>
                              </span>
                              {link.external ? (
                                <span className="text-xs text-muted-foreground">↗</span>
                              ) : null}
                            </a>
                          )}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                );
              }

              return (
                <Link
                  key={item.key}
                  href={item.href.startsWith('#') ? item.href : localizePath(item.href)}
                  className={cn(
                    'group relative flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition-all',
                    isActive
                      ? 'border-primary/40 bg-primary/15 text-primary dark:text-primary-foreground shadow-sm'
                      : 'border-transparent text-foreground/75 hover:border-primary/30 hover:bg-primary/10 hover:text-foreground'
                  )}
                  title={item.description ?? item.label}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {Icon && (
                    <Icon
                      className={cn(
                        'h-4 w-4 transition-colors',
                        isActive ? 'text-primary dark:text-primary-foreground' : 'text-foreground/60'
                      )}
                      isActive={isActive}
                    />
                  )}
                  <span className="whitespace-nowrap">{item.label}</span>
                  {isActive && (
                    <div className="absolute inset-x-2 bottom-1 h-0.5 rounded-full bg-primary/70 dark:bg-primary/80" />
                  )}
                </Link>
              );
            })}

            {!showDashboardNav && (
              <>
                <Separator orientation="vertical" className="mx-2 h-6" />
                <GitHubStats variant="compact" />
              </>
            )}
          </nav>

          {/* Right side */}
          <div className="flex-1 flex items-center justify-end gap-3">
            <div className="hidden items-center gap-3 md:flex">
              {showDashboardNav && (
                <Button
                  asChild
                  size="sm"
                  className="group hidden items-center gap-2 rounded-full border border-border/60 bg-background/80 px-3 py-1.5 text-sm font-medium text-foreground shadow-none transition hover:border-foreground/30 hover:bg-foreground/5 hover:text-foreground dark:border-white/12 dark:bg-white/5 dark:text-white dark:hover:border-white/25 dark:hover:bg-white/10 dark:hover:text-white md:inline-flex"
                >
                  <Link href={landingLink} aria-label={tCommon('tooltips.backToLanding')}>
                    <LandingIcon className="h-[16px] w-[16px] text-foreground/75 transition-colors group-hover:text-foreground dark:text-white/80 dark:group-hover:text-white" />
                    <span>{tCommon('navigation.landing')}</span>
                  </Link>
                </Button>
              )}

              {mounted && (
                <div className="flex items-center gap-2 rounded-full border border-border/60 bg-card/80 px-2 py-1 shadow-sm">
                  <ThemeToggle />
                  <ThemeSwitcher buttonVariant="ghost" buttonSize="icon" tooltip="Select theme palette" />
                  <LanguageSwitcher variant="compact" showName={false} />
                </div>
              )}

              {isGuest && !isAuthenticated && (
                <GuestCreditIndicator variant="minimal" />
              )}
              {mounted && authControls}
            </div>
            {/* Hide in-flow hamburger on mobile; we render fixed buttons instead */}
            <div className="hidden md:block" />
          </div>
        </div>

        {/* Mobile menu (overlay) */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-background/60 backdrop-blur-sm"
              onClick={closeMobileMenu}
              aria-hidden="true"
            />
            {/* Panel */}
            <div className="absolute left-3 right-3 top-16 space-y-4 rounded-2xl border border-border/60 bg-background/95 p-4 shadow-xl">
              <nav className="flex flex-col gap-2">
              {navItems.map((item) => {
                const Icon = item.icon ?? null;
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

                if (item.key === 'docs') {
                  return (
                    <div key={item.key} className="flex flex-col gap-2 rounded-xl border border-border/60 bg-background/90 p-3">
                      <button
                        type="button"
                        onClick={() => setDocsExpanded((prev) => !prev)}
                        className={cn(
                          'flex items-center justify-between gap-3 rounded-lg px-2 py-2 text-sm font-semibold transition',
                          'text-foreground',
                        )}
                        aria-expanded={docsExpanded}
                      >
                        <span className="flex items-center gap-2">
                          {Icon && <Icon className="h-4 w-4 text-primary" />}
                          <span>{tCommon('navigation.docs')}</span>
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {docsExpanded ? tCommon('actions.hide') : tCommon('actions.show')}
                        </span>
                      </button>
                      {docsExpanded && (
                        <div className="space-y-2 pl-2">
                          {docsLinks.map((link) => (
                            <Link
                              key={link.label}
                              href={link.disabled ? '#' : link.href}
                              onClick={() => {
                                if (!link.disabled) {
                                  closeMobileMenu();
                                }
                              }}
                              target={link.external ? '_blank' : undefined}
                              rel={link.external ? 'noreferrer' : undefined}
                              className={cn(
                                'flex items-start gap-3 rounded-lg border border-transparent px-2 py-2 text-sm transition',
                                link.disabled
                                  ? 'cursor-not-allowed opacity-60'
                                  : 'hover:border-primary/40 hover:bg-primary/10',
                              )}
                            >
                              <span className="mt-1">{link.icon}</span>
                              <span className="flex flex-1 flex-col text-left">
                                <span className="font-medium text-foreground">{link.label}</span>
                                <span className="text-xs text-muted-foreground">{link.description}</span>
                              </span>
                              {link.external ? (
                                <span className="text-xs text-muted-foreground">↗</span>
                              ) : null}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.key}
                    href={item.href.startsWith('#') ? item.href : localizePath(item.href)}
                    className={cn(
                      'group flex items-center gap-3 rounded-xl border px-3 py-3 text-sm font-medium transition',
                      isActive
                        ? 'border-primary/40 bg-primary/15 text-primary dark:text-primary-foreground'
                        : 'border-transparent text-foreground/75 hover:border-primary/30 hover:bg-primary/10 hover:text-foreground'
                    )}
                    onClick={closeMobileMenu}
                    aria-current={isActive ? 'page' : undefined}
                    title={item.description ?? item.label}
                  >
                    {Icon && (
                      <Icon
                        className={cn(
                          'h-4 w-4 transition-colors',
                          isActive ? 'text-primary dark:text-primary-foreground' : 'text-foreground/60'
                        )}
                        isActive={isActive}
                      />
                    )}
                    <span>{item.label}</span>
                  </Link>
                );
              })}
              </nav>

            {showDashboardNav && (
              <Button
                asChild
                size="sm"
                className="group flex items-center justify-center gap-2 rounded-full border border-border/60 bg-background/80 py-2 text-sm font-medium text-foreground shadow-none transition hover:border-foreground/30 hover:bg-foreground/5 hover:text-foreground dark:border-white/12 dark:bg-white/5 dark:text-white dark:hover:border-white/25 dark:hover:bg-white/12 dark:hover:text-white"
              >
                <Link href={landingLink} onClick={closeMobileMenu} aria-label={tCommon('tooltips.backToLanding')}>
                  <LandingIcon className="h-[16px] w-[16px] text-foreground/75 transition-colors group-hover:text-foreground dark:text-white/80 dark:group-hover:text-white" />
                  <span>{tCommon('navigation.landing')}</span>
                </Link>
              </Button>
            )}

            <Separator />

            {!showDashboardNav && <GitHubStats className="justify-center" />}

            <div className="flex flex-col gap-3">
              {mounted && (
                <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border/70 bg-background/60 px-3 py-2">
                  <ThemeToggle />
                  <ThemeSwitcher buttonVariant="ghost" buttonSize="icon" tooltip="Select theme palette" />
                  <LanguageSwitcher variant="compact" showName={false} />
                </div>
              )}

              {isGuest && !isAuthenticated && <GuestCreditIndicator variant="minimal" />}

              {mounted && (
                <div className="flex flex-col gap-2 pt-1">
                  {isAuthenticated ? (
                    <>
                      <AuthButton suppressLocalBadge className="w-full justify-center" />
                      {isLandingPage ? (
                        <Button asChild size="sm" className="px-5 font-semibold" onClick={closeMobileMenu}>
                          <Link href={openDashboardLink}>Open Dashboard</Link>
                        </Button>
                      ) : (
                        <Button asChild size="sm" variant="outline" onClick={closeMobileMenu}>
                          <Link href={importLink}>
                            <Plus className="mr-2 h-4 w-4" />
                            Import
                          </Link>
                        </Button>
                      )}
                    </>
                  ) : authEnabled ? (
                    <>
                      <Button asChild variant="secondary" size="sm">
                        <Link href={signInLink} onClick={closeMobileMenu}>
                          Log in
                        </Link>
                      </Button>
                      {isCloudMode ? (
                        <Button asChild size="sm" className="btn-gradient-border">
                          <Link href={signUpLink} onClick={closeMobileMenu}>
                            Sign up
                          </Link>
                        </Button>
                      ) : null}
                    </>
                  ) : onOpenSettings ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        closeMobileMenu();
                        onOpenSettings();
                      }}
                    >
                      Open setup
                    </Button>
                  ) : null}
                </div>
              )}
            </div>
            </div>
          </div>
        )}
      </div>

      {/* Fixed mobile quick toolbar (top-right) */}
      {mounted && (
        <div className="fixed right-3 top-3 z-[60] flex items-center gap-2 md:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label={mobileMenuOpen ? tCommon('tooltips.closeNavigation') : tCommon('tooltips.toggleNavigation')}
            aria-expanded={mobileMenuOpen}
            className="rounded-full border border-border/70 bg-card/90 p-2 text-foreground/85 shadow-sm transition hover:border-primary/40 hover:bg-primary/10 hover:text-primary dark:border-white/10 dark:bg-background/70 dark:text-white/85"
          >
            {mobileMenuOpen ? <MobileCloseIcon className="h-5 w-5" /> : <MobileMenuIcon className="h-5 w-5" />}
          </button>
          <div className="rounded-full border border-border/70 bg-card/90 p-1 shadow-sm">
            <ThemeToggle />
          </div>
          <Button
            asChild
            size="icon"
            className="rounded-full border border-border/70 bg-primary/90 text-primary-foreground hover:bg-primary"
            aria-label={tCommon('actions.new') ?? 'New'}
          >
            <Link href={importLink}>
              <Plus className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      )}
    </header>
  );
}

function MobileMenuIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <rect x="3.5" y="6" width="17" height="1.6" rx="0.8" className="fill-current" />
      <rect x="3.5" y="11.2" width="17" height="1.6" rx="0.8" className="fill-current" />
      <rect x="3.5" y="16.4" width="17" height="1.6" rx="0.8" className="fill-current" />
      <circle cx="20" cy="6.8" r="0.4" className="fill-primary" />
      <circle cx="20" cy="12" r="0.4" className="fill-primary" />
      <circle cx="20" cy="17.2" r="0.4" className="fill-primary" />
    </svg>
  );
}

function MobileCloseIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <circle cx="12" cy="12" r="9.5" className="stroke-current" strokeWidth="1.2" opacity="0.5" />
      <path d="M8 8l8 8M16 8l-8 8" className="stroke-current" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

