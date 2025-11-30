'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ChevronDown,
  Menu,
  X,
  BarChart3,
  BookOpen,
  Brain,
  Layers,
  Network,
  GraduationCap,
  FileText,
  FolderTree,
  Sparkles,
  Users,
  Building2,
  Code2,
  ExternalLink,
  Download,
  ArrowRight,
  Github,
  Zap,
  Globe,
  Star,
} from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLocalizedPath } from '@/hooks/useLocalizedPath';
import { OpenStrandLogo } from '@/components/icons/OpenStrandLogo';
import { GitHubStats } from '@/components/github/GitHubStats';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { LanguageSwitcher } from '@/components/language-switcher';
import { cn } from '@/lib/utils';

interface LandingHeaderProps {
  variant?: 'landing' | 'dashboard';
}

// Hover dropdown component
function HoverDropdown({
  trigger,
  children,
  align = 'left',
}: {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: 'left' | 'right';
}) {
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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
      ref={containerRef}
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        className={cn(
          'group inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-accent/50',
          isOpen && 'text-foreground bg-accent/50'
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
      </button>
      
      {isOpen && (
        <div
          className={cn(
            'absolute top-full mt-1.5 z-50 min-w-[280px] rounded-xl border border-border/50 bg-popover/95 backdrop-blur-xl shadow-xl p-2 animate-in fade-in-0 zoom-in-95',
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
        'flex gap-3 py-2 px-2 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer items-center',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

export function LandingHeader({ variant = 'landing' }: LandingHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();
  const localizePath = useLocalizedPath();
  const t = useTranslations('common');

  const isLanding = variant === 'landing' || pathname?.includes('/landing');
  const isDashboard = pathname?.includes('/dashboard');

  // Get current locale from pathname
  const locale = pathname?.split('/')[1] || 'en';

  // Scroll detection for nav background
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), []);

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full transition-all duration-300',
        isScrolled
          ? 'bg-background/80 backdrop-blur-xl border-b border-border/40 shadow-sm shadow-black/5'
          : 'bg-transparent'
      )}
    >
      {/* Neomorphic top edge highlight */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      
      <div className="container mx-auto px-4">
        <nav className="flex items-center justify-between h-16 lg:h-18">
          {/* Logo */}
          <Link
            href={localizePath(isDashboard ? '/landing' : '/')}
            className="flex items-center gap-2 group"
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

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {/* Features - Simple link */}
            <Link
              href="#features"
              className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-accent/50"
            >
              Features
            </Link>

            {/* PKMS Dropdown */}
            <HoverDropdown
              trigger={
                <>
                  <Brain className="h-4 w-4" />
                  Knowledge
                </>
              }
            >
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium px-2 py-1">Personal Knowledge Management</p>
                <Link href={localizePath('/pkms')}>
                  <NavMenuItem>
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <FolderTree className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium text-sm">Fabric Browser</div>
                      <div className="text-xs text-muted-foreground">Navigate your knowledge hierarchy</div>
                    </div>
                  </NavMenuItem>
                </Link>
                <Link href={localizePath('/weave')}>
                  <NavMenuItem>
                    <div className="h-9 w-9 rounded-lg bg-cyan-500/10 flex items-center justify-center flex-shrink-0">
                      <Network className="h-4 w-4 text-cyan-600" />
                    </div>
                    <div>
                      <div className="font-medium text-sm">Knowledge Graph</div>
                      <div className="text-xs text-muted-foreground">Visualize connections & relationships</div>
                    </div>
                  </NavMenuItem>
                </Link>
                <Link href={localizePath('/composer')}>
                  <NavMenuItem>
                    <div className="h-9 w-9 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                      <FileText className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div>
                      <div className="font-medium text-sm">Strand Composer</div>
                      <div className="text-xs text-muted-foreground">Create & import markdown notes</div>
                    </div>
                  </NavMenuItem>
                </Link>
                <div className="border-t border-border/50 my-2" />
                <p className="text-xs text-muted-foreground font-medium px-2 py-1">Learning Tools</p>
                <Link href={localizePath('/flashcards')}>
                  <NavMenuItem>
                    <div className="h-9 w-9 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                      <GraduationCap className="h-4 w-4 text-amber-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm flex items-center gap-2">
                        Flashcards & Quizzes
                        <Badge variant="secondary" className="text-[10px]">AI</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">Spaced repetition learning</div>
                    </div>
                  </NavMenuItem>
                </Link>
              </div>
            </HoverDropdown>

            {/* Dashboard Dropdown */}
            <HoverDropdown
              trigger={
                <>
                  <BarChart3 className="h-4 w-4" />
                  Visualize
                </>
              }
            >
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium px-2 py-1">Data Visualization</p>
                <Link href={localizePath('/dashboard')}>
                  <NavMenuItem>
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <BarChart3 className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm flex items-center gap-2">
                        AI Dashboard
                        <Badge variant="secondary" className="text-[10px]">New</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">Create charts with natural language</div>
                    </div>
                  </NavMenuItem>
                </Link>
                <Link href={localizePath('/gallery')}>
                  <NavMenuItem>
                    <div className="h-9 w-9 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                      <Layers className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <div className="font-medium text-sm">Community Gallery</div>
                      <div className="text-xs text-muted-foreground">Browse & share visualizations</div>
                    </div>
                  </NavMenuItem>
                </Link>
                <div className="border-t border-border/50 my-2" />
                <p className="text-xs text-muted-foreground font-medium px-2 py-1">AI Features</p>
                <Link href={localizePath('/dashboard#auto-insights')}>
                  <NavMenuItem>
                    <div className="h-9 w-9 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="h-4 w-4 text-amber-600" />
                    </div>
                    <div>
                      <div className="font-medium text-sm">Auto Insights</div>
                      <div className="text-xs text-muted-foreground">AI-powered data analysis</div>
                    </div>
                  </NavMenuItem>
                </Link>
              </div>
            </HoverDropdown>

            {/* Pricing Dropdown */}
            <HoverDropdown trigger="Pricing">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium px-2 py-1">Plans</p>
                <Link href="#pricing">
                  <NavMenuItem>
                    <div className="h-9 w-9 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                      <Download className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm flex items-center gap-2">
                        Community Edition
                        <Badge className="bg-emerald-500 text-white text-[10px]">Free Forever</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">Open source, offline-first, single user</div>
                    </div>
                  </NavMenuItem>
                </Link>
                <Link href={localizePath('/teams')}>
                  <NavMenuItem>
                    <div className="h-9 w-9 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                      <Users className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium text-sm">Teams Edition</div>
                      <div className="text-xs text-muted-foreground">Collaboration, sharing & community features</div>
                    </div>
                  </NavMenuItem>
                </Link>
                <Link href={localizePath('/teams#enterprise')}>
                  <NavMenuItem>
                    <div className="h-9 w-9 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                      <Building2 className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <div className="font-medium text-sm">Enterprise</div>
                      <div className="text-xs text-muted-foreground">SSO, audit logs, dedicated support</div>
                    </div>
                  </NavMenuItem>
                </Link>
                <div className="border-t border-border/50 my-2" />
                <p className="text-xs text-muted-foreground font-medium px-2 py-1">For Developers</p>
                <Link href={localizePath('/teams#api')}>
                  <NavMenuItem>
                    <div className="h-9 w-9 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                      <Code2 className="h-4 w-4 text-orange-600" />
                    </div>
                    <div>
                      <div className="font-medium text-sm">API & SDK</div>
                      <div className="text-xs text-muted-foreground">RESTful API, TypeScript SDK</div>
                    </div>
                  </NavMenuItem>
                </Link>
              </div>
            </HoverDropdown>

            {/* Docs Dropdown */}
            <HoverDropdown
              trigger={
                <>
                  <BookOpen className="h-4 w-4" />
                  Docs
                </>
              }
            >
              <div className="space-y-1">
                <Link href={localizePath('/tutorials')}>
                  <NavMenuItem>
                    <BookOpen className="h-4 w-4 text-primary" />
                    <div>
                      <div className="font-medium text-sm">Documentation Home</div>
                      <div className="text-xs text-muted-foreground">Guides & tutorials</div>
                    </div>
                  </NavMenuItem>
                </Link>
                <div className="border-t border-border/50 my-2" />
                <Link href={localizePath('/tutorials/backup-quickstart')}>
                  <NavMenuItem>
                    <Zap className="h-4 w-4 text-amber-500" />
                    <span className="text-sm">Quick Start Guide</span>
                  </NavMenuItem>
                </Link>
                <Link href={localizePath('/tutorials/metadata-playbook')}>
                  <NavMenuItem>
                    <FileText className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">Metadata Playbook</span>
                  </NavMenuItem>
                </Link>
                <Link href={localizePath('/tutorials/pen-and-paper-strand')}>
                  <NavMenuItem>
                    <Star className="h-4 w-4 text-purple-500" />
                    <span className="text-sm">Pen & Paper Modeling</span>
                  </NavMenuItem>
                </Link>
                <div className="border-t border-border/50 my-2" />
                <a 
                  href="https://github.com/framersai/openstrand" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <NavMenuItem>
                    <Github className="h-4 w-4" />
                    <span className="text-sm flex-1">GitHub Repository</span>
                    <ExternalLink className="h-3 w-3 opacity-50" />
                  </NavMenuItem>
                </a>
              </div>
            </HoverDropdown>
          </div>

          {/* Right side actions */}
          <div className="hidden lg:flex items-center gap-2">
            <GitHubStats variant="compact" />
            <ThemeSwitcher />
            <LanguageSwitcher currentLocale={locale as 'en' | 'zh-CN' | 'zh-TW' | 'ru' | 'pt' | 'hi' | 'fr'} variant="compact" showName={false} />
            
            {/* CTA Button - Changes based on context */}
            {isDashboard ? (
              <Button asChild variant="outline" size="sm" className="gap-1.5">
                <Link href={localizePath('/landing')}>
                  <Globe className="h-4 w-4" />
                  <span>Home</span>
                </Link>
              </Button>
            ) : (
              <Button
                asChild
                size="sm"
                className="gap-1.5 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/25 text-white"
              >
                <Link href={localizePath('/dashboard')}>
                  <BarChart3 className="h-4 w-4" />
                  <span>Open Dashboard</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </Button>
            )}
          </div>

          {/* Mobile: Theme, Language, Dashboard, Menu */}
          <div className="flex items-center gap-1.5 lg:hidden">
            <ThemeSwitcher />
            <LanguageSwitcher currentLocale={locale as 'en' | 'zh-CN' | 'zh-TW' | 'ru' | 'pt' | 'hi' | 'fr'} variant="compact" showName={false} />
            
            {/* Dashboard CTA - always visible on mobile */}
            <Button
              asChild
              size="sm"
              className="gap-1 h-9 px-3 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-md shadow-primary/20 text-white"
            >
              <Link href={localizePath('/dashboard')}>
                <BarChart3 className="h-4 w-4" />
              </Link>
            </Button>
            
            {/* Menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </nav>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 top-16 z-50 bg-background/95 backdrop-blur-xl">
          <div className="container mx-auto px-4 py-6 space-y-6 max-h-[calc(100vh-4rem)] overflow-y-auto">
            {/* Mobile nav sections */}
            <div className="space-y-4">
              <Link
                href="#features"
                onClick={closeMobileMenu}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent/50 transition-colors"
              >
                <Sparkles className="h-5 w-5 text-primary" />
                <span className="font-medium">Features</span>
              </Link>

              {/* Knowledge section */}
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground px-3">
                  Knowledge Management
                </p>
                <Link
                  href={localizePath('/pkms')}
                  onClick={closeMobileMenu}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent/50 transition-colors"
                >
                  <FolderTree className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-medium">Fabric Browser</div>
                    <div className="text-xs text-muted-foreground">Navigate your knowledge</div>
                  </div>
                </Link>
                <Link
                  href={localizePath('/weave')}
                  onClick={closeMobileMenu}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent/50 transition-colors"
                >
                  <Network className="h-5 w-5 text-cyan-600" />
                  <div>
                    <div className="font-medium">Knowledge Graph</div>
                    <div className="text-xs text-muted-foreground">Visualize connections</div>
                  </div>
                </Link>
                <Link
                  href={localizePath('/flashcards')}
                  onClick={closeMobileMenu}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent/50 transition-colors"
                >
                  <GraduationCap className="h-5 w-5 text-amber-600" />
                  <div>
                    <div className="font-medium">Flashcards & Quizzes</div>
                    <div className="text-xs text-muted-foreground">Spaced repetition</div>
                  </div>
                </Link>
              </div>

              {/* Visualization section */}
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground px-3">
                  Data Visualization
                </p>
                <Link
                  href={localizePath('/dashboard')}
                  onClick={closeMobileMenu}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent/50 transition-colors"
                >
                  <BarChart3 className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-medium">AI Dashboard</div>
                    <div className="text-xs text-muted-foreground">Create charts naturally</div>
                  </div>
                </Link>
                <Link
                  href={localizePath('/gallery')}
                  onClick={closeMobileMenu}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent/50 transition-colors"
                >
                  <Layers className="h-5 w-5 text-purple-600" />
                  <div>
                    <div className="font-medium">Community Gallery</div>
                    <div className="text-xs text-muted-foreground">Browse shared work</div>
                  </div>
                </Link>
              </div>

              {/* Pricing section */}
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground px-3">
                  Plans
                </p>
                <Link
                  href="#pricing"
                  onClick={closeMobileMenu}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent/50 transition-colors"
                >
                  <Download className="h-5 w-5 text-emerald-600" />
                  <div className="flex-1">
                    <div className="font-medium flex items-center gap-2">
                      Community Edition
                      <Badge className="bg-emerald-500 text-white text-[10px]">Free</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">Open source, offline-first</div>
                  </div>
                </Link>
                <Link
                  href={localizePath('/teams')}
                  onClick={closeMobileMenu}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent/50 transition-colors"
                >
                  <Users className="h-5 w-5 text-blue-600" />
                  <div>
                    <div className="font-medium">Teams & Enterprise</div>
                    <div className="text-xs text-muted-foreground">Collaboration features</div>
                  </div>
                </Link>
              </div>

              {/* Docs */}
              <Link
                href={localizePath('/tutorials')}
                onClick={closeMobileMenu}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent/50 transition-colors"
              >
                <BookOpen className="h-5 w-5 text-primary" />
                <span className="font-medium">Documentation</span>
              </Link>
            </div>

            {/* Mobile CTA */}
            <div className="pt-4 border-t border-border/40 space-y-3">
              <Button asChild className="w-full gap-2 text-white" size="lg">
                <Link href={localizePath('/dashboard')} onClick={closeMobileMenu}>
                  <BarChart3 className="h-4 w-4" />
                  Open Dashboard
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <div className="flex items-center justify-center gap-4">
                <GitHubStats variant="compact" />
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
