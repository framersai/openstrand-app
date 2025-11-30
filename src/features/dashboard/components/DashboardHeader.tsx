import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { 
  Menu, 
  Settings, 
  X, 
  Database, 
  User, 
  Home, 
  LifeBuoy, 
  CreditCard,
  HelpCircle,
  BookOpen,
  Keyboard,
  MessageCircle,
  ExternalLink,
  Play,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { OpenStrandLogo } from '@/components/icons/OpenStrandLogo';

import { LanguageSwitcher } from '@/components/language-switcher';
import { CostTracker } from '@/components/cost-tracker';
import { Button } from '@/components/ui/button';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AuthButton } from '@/features/auth';
import { useLocalizedPath } from '@/hooks/useLocalizedPath';
import { useTourController } from '@/components/guided-tour/GuidedTour';
import { GuestCreditIndicator } from '@/components/guest-credit-indicator';
import { useSupabase } from '@/features/auth';
import type { Locale } from '@/i18n/config';
import { cn } from '@/lib/utils';

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

// Hover dropdown component
function HoverDropdown({
  trigger,
  children,
  align = 'right',
}: {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: 'left' | 'right';
}) {
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 150);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          'h-8 px-2 gap-1.5',
          isOpen && 'bg-accent/50'
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        {trigger}
        <ChevronDown
          className={cn(
            'h-3 w-3 opacity-60 transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </Button>
      
      {isOpen && (
        <div
          className={cn(
            'absolute top-full mt-1.5 z-50 min-w-[220px] rounded-xl border border-border/50 bg-popover/95 backdrop-blur-xl shadow-xl p-2 animate-in fade-in-0 zoom-in-95',
            align === 'right' ? 'right-0' : 'left-0'
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
}

// Navigation Menu Item component for consistent styling
function NavMenuItem({ 
  children, 
  className,
  onClick,
}: { 
  children: React.ReactNode; 
  className?: string;
  onClick?: () => void;
}) {
  return (
    <div 
      className={cn(
        'flex gap-2 py-2 px-2 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer items-center text-sm',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

export function DashboardHeader({ onOpenSettings }: DashboardHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const tCommon = useTranslations('common');
  const tBilling = useTranslations('billing');
  const tAuth = useTranslations('auth');
  const locale = useLocale() as Locale;
  const localizePath = useLocalizedPath();
  const { isAuthenticated, authEnabled } = useSupabase();
  const { startTour, TourComponent } = useTourController();

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const handleKeyboardShortcuts = () => {
    const event = new KeyboardEvent('keydown', { key: 'k', metaKey: true });
    window.dispatchEvent(event);
  };

  return (
    <TooltipProvider>
      {TourComponent}
      <header className="dashboard-header sticky top-0 z-50 border-b border-border/60 bg-background/95 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-3">
          <div className="flex w-full items-center gap-4">
            <div className="flex min-w-0 flex-1 items-center gap-4">
              <Link
                href={localizePath('/landing')}
                className="flex flex-shrink-0 items-center gap-2 group"
                onClick={closeMobileMenu}
              >
                <div className="relative">
                  <OpenStrandLogo size="sm" variant="default" />
                  <div className="absolute inset-0 bg-primary/20 rounded-lg blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                {/* Full name on larger screens, abbreviated on small */}
                <span className="text-lg font-bold tracking-tight text-foreground hidden sm:block">
                  OpenStrand
                </span>
                <span className="text-lg font-bold tracking-tight text-foreground sm:hidden">
                  OS
                </span>
              </Link>

              <Separator orientation="vertical" className="hidden h-6 lg:block" />

              <nav className="hidden flex-1 items-center justify-center gap-4 text-sm font-medium lg:flex">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.key}
                      href={localizePath(item.href)}
                      className="relative inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-foreground/80 transition-all hover:bg-primary/10 hover:text-foreground"
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

              {/* Theme and Language - Before Help */}
              <ThemeSwitcher tooltip="Change theme & appearance" />
              <LanguageSwitcher currentLocale={locale} variant="compact" showName={false} />
              
              {/* Help Menu - Using custom hover dropdown */}
              <HoverDropdown
                trigger={
                  <>
                    <HelpCircle className="h-4 w-4" />
                    <span className="hidden xl:inline text-xs">Help</span>
                  </>
                }
              >
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium px-2 py-1">Get Started</p>
                  <NavMenuItem onClick={startTour}>
                    <Play className="h-4 w-4 text-primary" />
                    <span className="flex-1">Take a Tour</span>
                    <Badge variant="secondary" className="text-[10px]">New</Badge>
                  </NavMenuItem>
                  <Link href={localizePath('/tutorials')}>
                    <NavMenuItem>
                      <BookOpen className="h-4 w-4" />
                      <span>Tutorials</span>
                    </NavMenuItem>
                  </Link>
                  <NavMenuItem onClick={handleKeyboardShortcuts}>
                    <Keyboard className="h-4 w-4" />
                    <span className="flex-1">Keyboard Shortcuts</span>
                    <kbd className="text-[10px] bg-muted px-1 py-0.5 rounded">⌘K</kbd>
                  </NavMenuItem>
                  <div className="border-t border-border/50 my-2" />
                  <p className="text-xs text-muted-foreground font-medium px-2 py-1">Resources</p>
                  <a href="https://docs.openstrand.ai" target="_blank" rel="noopener noreferrer">
                    <NavMenuItem>
                      <ExternalLink className="h-4 w-4" />
                      <span>Documentation</span>
                    </NavMenuItem>
                  </a>
                  <Link href={localizePath('/contact')}>
                    <NavMenuItem>
                      <MessageCircle className="h-4 w-4" />
                      <span>Contact Support</span>
                    </NavMenuItem>
                  </Link>
                </div>
              </HoverDropdown>

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

              <Button asChild size="sm" variant="default" className="text-white">
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
                    className="settings-button hover:text-primary h-8 w-8"
                    aria-label={tCommon('tooltips.openSettings')}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent align="end">{tCommon('tooltips.providerSettings')}</TooltipContent>
              </Tooltip>
            </div>

            <div className="flex flex-shrink-0 items-center gap-2 lg:hidden">
              {/* Mobile: Theme and Language before hamburger */}
              <ThemeSwitcher tooltip="Theme" />
              <LanguageSwitcher currentLocale={locale} variant="compact" showName={false} />
              
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                aria-label={tCommon('tooltips.toggleNavigation')}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>

          {mobileMenuOpen && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div
                className="absolute inset-0 bg-background/60 backdrop-blur-sm"
                onClick={closeMobileMenu}
                aria-hidden="true"
              />
              <div className="absolute left-3 right-3 top-16 space-y-4 rounded-2xl border border-border/60 bg-background/95 p-4 shadow-xl">
              <div className="flex items-center justify-between rounded-xl border border-border/70 bg-background/60 px-3 py-3 text-xs font-medium text-foreground/80">
                <CostTracker mode="compact" />
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => { startTour(); closeMobileMenu(); }}
                    className="h-8 px-2 gap-1.5"
                  >
                    <HelpCircle className="h-4 w-4" />
                    <span className="text-xs">Tour</span>
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between gap-2">
                <AuthButton />
                <Button asChild size="sm" variant="default" className="flex-1 text-white">
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
            </div>
          )}
        </div>
      </header>
    </TooltipProvider>
  );
}
