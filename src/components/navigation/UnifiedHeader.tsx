'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Plus, 
  Settings, 
  BookOpen, 
  Code, 
  GraduationCap, 
  Brain, 
  ClipboardCheck, 
  Star, 
  TrendingUp, 
  Clock,
  ChevronDown,
  Sparkles,
  Database,
  Network,
  Layers,
  Upload,
  BarChart3,
  Compass,
  Lightbulb,
  Rocket,
  Zap,
} from 'lucide-react';
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
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { LanguageSwitcher } from '@/components/language-switcher';
import { ThemeToggle } from '@/components/theme-toggle';
import { useFeatureFlags } from '@/lib/feature-flags';
import { PomodoroWidget } from '@/components/productivity/PomodoroWidget';

type NavItem = {
  key: string;
  href: string;
  label: string;
  icon?: React.ComponentType<{ className?: string; isActive?: boolean }>;
  description?: string;
};

type NavDropdownItem = {
  key: string;
  label: string;
  icon: React.ReactNode;
  items: {
    key: string;
    href: string;
    label: string;
    description: string;
    icon: React.ReactNode;
    badge?: string;
  }[];
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
  const [showPomodoro, setShowPomodoro] = useState(false);
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

  // Consolidated dashboard navigation with dropdowns
  const dashboardDropdowns: NavDropdownItem[] = useMemo(
    () => [
      {
        key: 'explore',
        label: 'Explore',
        icon: <Compass className="h-4 w-4" />,
        items: [
          {
            key: 'feed',
            href: '/',
            label: 'Feed',
            description: 'Your personalized activity stream',
            icon: <FeedIcon className="h-4 w-4" />,
          },
          {
            key: 'gallery',
            href: '/gallery',
            label: 'Gallery',
            description: 'Browse public visualizations',
            icon: <Star className="h-4 w-4" />,
          },
          {
            key: 'visualizations',
            href: '/visualizations',
            label: 'My Visualizations',
            description: 'Your created visualizations',
            icon: <VisualizationsIcon className="h-4 w-4" />,
          },
        ],
      },
      {
        key: 'knowledge',
        label: 'Knowledge',
        icon: <Layers className="h-4 w-4" />,
        items: [
          {
            key: 'strands',
            href: '/pkms',
            label: 'Strands',
            description: 'Your knowledge threads',
            icon: <KnowledgeIcon className="h-4 w-4" />,
          },
          {
            key: 'datasets',
            href: '/datasets',
            label: 'Datasets',
            description: 'Manage your data sources',
            icon: <Database className="h-4 w-4" />,
          },
          {
            key: 'weave',
            href: '/weave',
            label: 'Knowledge Graph',
            description: 'Visualize connections',
            icon: <Network className="h-4 w-4" />,
          },
        ],
      },
      {
        key: 'learn',
        label: 'Learn',
        icon: <Lightbulb className="h-4 w-4" />,
        items: [
          {
            key: 'flashcards',
            href: '/flashcards',
            label: 'Flashcards',
            description: 'Spaced repetition study',
            icon: <Brain className="h-4 w-4" />,
            badge: 'AI',
          },
          {
            key: 'quizzes',
            href: '/quizzes',
            label: 'Quizzes',
            description: 'Test your knowledge',
            icon: <ClipboardCheck className="h-4 w-4" />,
            badge: 'AI',
          },
          {
            key: 'productivity',
            href: '/productivity',
            label: 'Progress',
            description: 'Track learning stats',
            icon: <BarChart3 className="h-4 w-4" />,
          },
        ],
      },
    ],
    [],
  );

  const navItems = showDashboardNav ? [] : landingNavItems; // Empty for dashboard, use dropdowns instead
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
        </>
      );
    }

    if (authEnabled) {
      return (
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="font-medium text-foreground/80 hover:text-primary">
            <Link href={signInLink}>{tCommon('actions.login')}</Link>
          </Button>
          {isCloudMode && (
            <Button asChild size="sm" className="rounded-full px-4 font-semibold shadow-md shadow-primary/20">
              <Link href={signUpLink}>{tCommon('actions.startFree')}</Link>
            </Button>
          )}
        </div>
      );
    }

    if (onOpenSettings) {
      return (
        <div className="flex items-center gap-2">
          {isAuthenticated && !isGuest && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowPomodoro(true)}
              className="rounded-full border border-border/60 bg-card/80 text-foreground/80 hover:text-foreground"
              aria-label="Pomodoro Timer"
            >
              <Clock className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenSettings}
            className="rounded-full border border-border/60 bg-card/80 text-foreground/80 hover:text-foreground"
            aria-label={tCommon('tooltips.openSettings')}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      );
    }

    return null;
  }, [
    authEnabled,
    isAuthenticated,
    isCloudMode,
    onOpenSettings,
    signInLink,
    signUpLink,
    tCommon,
    isGuest,
  ]);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Check if any dropdown item is active
  const isDropdownActive = (dropdown: NavDropdownItem) => {
    return dropdown.items.some(
      (item) => pathname === item.href || pathname.startsWith(item.href + '/')
    );
  };

  return (
    <header 
      className={cn(
        "sticky top-0 z-50 transition-all duration-300",
        "border-b backdrop-blur-xl",
        isScrolled 
          ? "border-border/50 bg-background/85 shadow-lg shadow-black/5" 
          : "border-border/30 bg-background/95"
      )}
    >
      <div className="container mx-auto px-4 py-2.5">
        <div className="flex w-full items-center gap-3">
          {/* Logo */}
          <Link
            href={localizePath('/')}
            className="group flex items-center gap-2.5 rounded-xl px-2 py-1.5 transition-all hover:bg-primary/8"
            onClick={closeMobileMenu}
            aria-label="OpenStrand home"
          >
            <OpenStrandLogo 
              size="sm" 
              variant={isScrolled ? "mono" : "gradient"} 
              className="transition-all duration-300"
            />
            <div className="flex flex-col leading-none">
              <span className="text-[15px] font-semibold tracking-tight">
                OpenStrand{isTeamEdition && showDashboardNav ? ' Teams' : ''}
              </span>
              {showDashboardNav && (
                <span className="text-[9px] font-medium uppercase tracking-[0.2em] text-muted-foreground/70">
                  {isTeamEdition ? 'Enterprise' : 'Workspace'}
                </span>
              )}
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden flex-1 items-center gap-1 pl-4 md:flex">
            {showDashboardNav ? (
              <>
                {/* Dashboard dropdowns */}
                {dashboardDropdowns.map((dropdown) => {
                  const isActive = isDropdownActive(dropdown);
                  return (
                    <DropdownMenu key={dropdown.key}>
                      <DropdownMenuTrigger asChild>
                        <button
                          className={cn(
                            'group relative flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all',
                            isActive
                              ? 'bg-primary/12 text-primary'
                              : 'text-foreground/70 hover:bg-muted/80 hover:text-foreground'
                          )}
                        >
                          <span className={cn(
                            "transition-colors",
                            isActive ? "text-primary" : "text-foreground/50 group-hover:text-foreground/70"
                          )}>
                            {dropdown.icon}
                          </span>
                          <span>{dropdown.label}</span>
                          <ChevronDown className={cn(
                            "h-3 w-3 transition-transform duration-200",
                            "text-foreground/40 group-hover:text-foreground/60",
                            "group-data-[state=open]:rotate-180"
                          )} />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent 
                        align="start" 
                        sideOffset={8}
                        className="w-64 rounded-xl border-border/50 bg-popover/95 p-1.5 shadow-xl shadow-black/10 backdrop-blur-xl"
                      >
                        {dropdown.items.map((item, idx) => (
                          <DropdownMenuItem
                            key={item.key}
                            asChild
                            className={cn(
                              "flex cursor-pointer items-start gap-3 rounded-lg px-3 py-2.5 transition-colors",
                              "focus:bg-primary/10 focus:text-foreground",
                              pathname === item.href && "bg-primary/8"
                            )}
                          >
                            <Link href={localizePath(item.href)} className="flex w-full items-start gap-3">
                              <span className={cn(
                                "mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg",
                                pathname === item.href 
                                  ? "bg-primary/15 text-primary" 
                                  : "bg-muted/60 text-foreground/60"
                              )}>
                                {item.icon}
                              </span>
                              <div className="flex flex-1 flex-col gap-0.5">
                                <span className="flex items-center gap-2 text-sm font-medium">
                                  {item.label}
                                  {item.badge && (
                                    <span className="rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
                                      {item.badge}
                                    </span>
                                  )}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {item.description}
                                </span>
                              </div>
                            </Link>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  );
                })}

                {/* Docs dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className={cn(
                        'group relative flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all',
                        'text-foreground/70 hover:bg-muted/80 hover:text-foreground'
                      )}
                    >
                      <BookOpen className="h-4 w-4 text-foreground/50 group-hover:text-foreground/70" />
                      <span>Docs</span>
                      <ChevronDown className="h-3 w-3 text-foreground/40 transition-transform duration-200 group-hover:text-foreground/60 group-data-[state=open]:rotate-180" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent 
                    align="start" 
                    sideOffset={8}
                    className="w-72 rounded-xl border-border/50 bg-popover/95 p-1.5 shadow-xl shadow-black/10 backdrop-blur-xl"
                  >
                    {docsLinks.map((link) => (
                      <DropdownMenuItem
                        key={link.label}
                        asChild={!!link.href && !link.disabled}
                        disabled={link.disabled}
                        className={cn(
                          "flex cursor-pointer items-start gap-3 rounded-lg px-3 py-2.5",
                          link.disabled && "opacity-50"
                        )}
                      >
                        {link.disabled ? (
                          <div className="flex items-start gap-3">
                            <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-muted/40 text-foreground/40">
                              {link.icon}
                            </span>
                            <div className="flex flex-col gap-0.5">
                              <span className="text-sm font-medium">{link.label}</span>
                              <span className="text-xs text-muted-foreground">{link.description}</span>
                            </div>
                          </div>
                        ) : (
                          <a
                            href={link.href}
                            target={link.external ? '_blank' : undefined}
                            rel={link.external ? 'noreferrer' : undefined}
                            className="flex w-full items-start gap-3"
                          >
                            <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-muted/60 text-foreground/60">
                              {link.icon}
                            </span>
                            <div className="flex flex-1 flex-col gap-0.5">
                              <span className="flex items-center gap-2 text-sm font-medium">
                                {link.label}
                                {link.external && (
                                  <span className="text-[10px] text-muted-foreground">↗</span>
                                )}
                              </span>
                              <span className="text-xs text-muted-foreground">{link.description}</span>
                            </div>
                          </a>
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              // Landing page navigation
              <>
                {navItems.map((item) => {
                  const Icon = item.icon ?? null;
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                  
                  if (item.key === 'docs') {
                    return (
                      <DropdownMenu key={item.key}>
                        <DropdownMenuTrigger asChild>
                          <button
                            className={cn(
                              'group relative flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all',
                              'text-foreground/70 hover:bg-muted/80 hover:text-foreground'
                            )}
                          >
                            {Icon && <Icon className="h-4 w-4 text-foreground/50" />}
                            <span>Docs</span>
                            <ChevronDown className="h-3 w-3 text-foreground/40 group-data-[state=open]:rotate-180" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-72 rounded-xl p-1.5">
                          {docsLinks.map((link) => (
                            <DropdownMenuItem
                              key={link.label}
                              asChild={!!link.href && !link.disabled}
                              disabled={link.disabled}
                              className="flex cursor-pointer items-start gap-3 rounded-lg px-3 py-2.5"
                            >
                              {link.disabled ? (
                                <div className="flex items-start gap-3 opacity-60">
                                  <span className="mt-0.5">{link.icon}</span>
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
                                  <span className="mt-0.5">{link.icon}</span>
                                  <span className="flex flex-1 flex-col text-left">
                                    <span className="text-sm font-medium text-foreground">{link.label}</span>
                                    <span className="text-xs text-muted-foreground">{link.description}</span>
                                  </span>
                                  {link.external && <span className="text-xs text-muted-foreground">↗</span>}
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
                        'group relative flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all',
                        isActive
                          ? 'bg-primary/12 text-primary'
                          : 'text-foreground/70 hover:bg-muted/80 hover:text-foreground'
                      )}
                    >
                      {Icon && <Icon className="h-4 w-4 text-foreground/50" isActive={isActive} />}
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
                <Separator orientation="vertical" className="mx-2 h-5" />
                <GitHubStats variant="compact" />
              </>
            )}
          </nav>

          {/* Right side */}
          <div className="flex flex-1 items-center justify-end gap-2">
            {/* Create button - prominent for dashboard */}
            {showDashboardNav && (
              <Button
                asChild
                size="sm"
                className="hidden items-center gap-2 rounded-lg bg-gradient-to-r from-primary to-primary/80 px-4 font-medium shadow-md shadow-primary/25 transition-all hover:shadow-lg hover:shadow-primary/30 md:inline-flex"
              >
                <Link href={importLink}>
                  <Sparkles className="h-4 w-4" />
                  <span>Create</span>
                </Link>
              </Button>
            )}

            <div className="hidden items-center gap-2 md:flex">
              {showDashboardNav && (
                <Button
                  asChild
                  size="sm"
                  variant="ghost"
                  className="rounded-lg text-foreground/70 hover:bg-muted/80 hover:text-foreground"
                >
                  <Link href={landingLink} aria-label={tCommon('tooltips.backToLanding')}>
                    <LandingIcon className="h-4 w-4" />
                    <span className="ml-1.5">{tCommon('navigation.landing')}</span>
                  </Link>
                </Button>
              )}

              {mounted && (
                <div className="flex items-center gap-1 rounded-lg border border-border/40 bg-muted/30 p-1">
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
          </div>
        </div>

        {/* Mobile menu (overlay) */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-[55] lg:hidden" onClick={(e) => e.target === e.currentTarget && closeMobileMenu()}>
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-background/70 backdrop-blur-md"
              onClick={closeMobileMenu}
              aria-hidden="true"
            />
            {/* Panel - higher z-index to be above backdrop */}
            <div 
              className="absolute left-3 right-3 top-16 z-[56] max-h-[calc(100vh-5rem)] overflow-y-auto rounded-2xl border border-border/50 bg-background p-4 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {showDashboardNav ? (
                <nav className="flex flex-col gap-3">
                  {/* Mobile dashboard navigation */}
                  {dashboardDropdowns.map((dropdown) => (
                    <div key={dropdown.key} className="rounded-xl border border-border/40 bg-muted/20 p-3">
                      <div className="mb-2 flex items-center gap-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {dropdown.icon}
                        <span>{dropdown.label}</span>
                      </div>
                      <div className="space-y-1">
                        {dropdown.items.map((item) => {
                          const isActive = pathname === item.href;
                          return (
                            <Link
                              key={item.key}
                              href={localizePath(item.href)}
                              onClick={(e) => {
                                e.stopPropagation();
                                closeMobileMenu();
                              }}
                              className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors",
                                isActive
                                  ? "bg-primary/15 text-primary"
                                  : "text-foreground/80 hover:bg-muted/60 active:bg-muted"
                              )}
                            >
                              <span className={cn(
                                "flex h-8 w-8 items-center justify-center rounded-lg",
                                isActive ? "bg-primary/20" : "bg-muted/50"
                              )}>
                                {item.icon}
                              </span>
                              <div className="flex flex-col">
                                <span className="flex items-center gap-2 text-sm font-medium">
                                  {item.label}
                                  {item.badge && (
                                    <span className="rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 px-1.5 py-0.5 text-[9px] font-bold text-white">
                                      {item.badge}
                                    </span>
                                  )}
                                </span>
                                <span className="text-xs text-muted-foreground">{item.description}</span>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  {/* Create button mobile */}
                  <Button
                    asChild
                    className="w-full rounded-xl bg-gradient-to-r from-primary to-primary/80 py-3 font-semibold shadow-lg shadow-primary/25"
                  >
                    <Link 
                      href={importLink} 
                      onClick={(e) => {
                        e.stopPropagation();
                        closeMobileMenu();
                      }}
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      Create New
                    </Link>
                  </Button>
                </nav>
              ) : (
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
                            className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 text-sm font-semibold"
                            aria-expanded={docsExpanded}
                          >
                            <span className="flex items-center gap-2">
                              {Icon && <Icon className="h-4 w-4 text-primary" />}
                              <span>{tCommon('navigation.docs')}</span>
                            </span>
                            <ChevronDown className={cn(
                              "h-4 w-4 transition-transform",
                              docsExpanded && "rotate-180"
                            )} />
                          </button>
                          {docsExpanded && (
                            <div className="space-y-2 pl-2">
                              {docsLinks.map((link) => (
                                <Link
                                  key={link.label}
                                  href={link.disabled ? '#' : link.href}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (!link.disabled) closeMobileMenu();
                                  }}
                                  target={link.external ? '_blank' : undefined}
                                  rel={link.external ? 'noreferrer' : undefined}
                                  className={cn(
                                    'flex items-start gap-3 rounded-lg px-2 py-2 text-sm transition',
                                    link.disabled ? 'cursor-not-allowed opacity-60' : 'hover:bg-primary/10 active:bg-primary/15'
                                  )}
                                >
                                  <span className="mt-1">{link.icon}</span>
                                  <span className="flex flex-1 flex-col text-left">
                                    <span className="font-medium text-foreground">{link.label}</span>
                                    <span className="text-xs text-muted-foreground">{link.description}</span>
                                  </span>
                                  {link.external && <span className="text-xs text-muted-foreground">↗</span>}
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
                          'flex items-center gap-3 rounded-xl border px-3 py-3 text-sm font-medium transition',
                          isActive
                            ? 'border-primary/40 bg-primary/15 text-primary'
                            : 'border-transparent text-foreground/75 hover:border-primary/30 hover:bg-primary/10 active:bg-primary/15'
                        )}
                        onClick={(e) => {
                          e.stopPropagation();
                          closeMobileMenu();
                        }}
                      >
                        {Icon && <Icon className="h-4 w-4" isActive={isActive} />}
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </nav>
              )}

              <Separator className="my-4" />

              {!showDashboardNav && <GitHubStats className="mb-4 justify-center" />}

              <div className="flex flex-col gap-3">
                {mounted && (
                  <div className="flex flex-wrap items-center justify-center gap-2 rounded-xl border border-border/50 bg-muted/30 px-3 py-2">
                    <ThemeToggle />
                    <ThemeSwitcher buttonVariant="ghost" buttonSize="icon" tooltip="Select theme palette" />
                    <LanguageSwitcher variant="compact" showName={false} />
                  </div>
                )}

                {isGuest && !isAuthenticated && <GuestCreditIndicator variant="minimal" />}

                {mounted && (
                  <div className="flex flex-col gap-2">
                    {isAuthenticated ? (
                      <>
                        <AuthButton suppressLocalBadge className="w-full justify-center" />
                        {isLandingPage && (
                          <Button asChild size="sm" className="w-full">
                            <Link 
                              href={openDashboardLink}
                              onClick={(e) => {
                                e.stopPropagation();
                                closeMobileMenu();
                              }}
                            >
                              Open Dashboard
                            </Link>
                          </Button>
                        )}
                      </>
                    ) : authEnabled ? (
                      <>
                        <Button asChild variant="secondary" size="sm" className="w-full">
                          <Link 
                            href={signInLink} 
                            onClick={(e) => {
                              e.stopPropagation();
                              closeMobileMenu();
                            }}
                          >
                            Log in
                          </Link>
                        </Button>
                        {isCloudMode && (
                          <Button asChild size="sm" className="w-full">
                            <Link 
                              href={signUpLink} 
                              onClick={(e) => {
                                e.stopPropagation();
                                closeMobileMenu();
                              }}
                            >
                              Sign up
                            </Link>
                          </Button>
                        )}
                      </>
                    ) : onOpenSettings ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="w-full"
                        onClick={(e) => {
                          e.stopPropagation();
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
            className="rounded-xl border border-border/50 bg-card/95 p-2.5 text-foreground/85 shadow-lg backdrop-blur-sm transition hover:bg-muted"
          >
            {mobileMenuOpen ? <MobileCloseIcon className="h-5 w-5" /> : <MobileMenuIcon className="h-5 w-5" />}
          </button>
          <div className="rounded-xl border border-border/50 bg-card/95 p-1.5 shadow-lg backdrop-blur-sm">
            <ThemeToggle />
          </div>
          <Button
            asChild
            size="icon"
            className="rounded-xl bg-gradient-to-r from-primary to-primary/80 shadow-lg shadow-primary/30"
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
