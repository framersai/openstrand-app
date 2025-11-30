'use client';

import { useState, useEffect, useCallback } from 'react';
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
  Database,
  GraduationCap,
  FileText,
  FolderTree,
  Sparkles,
  Users,
  Building2,
  CreditCard,
  Code2,
  ExternalLink,
  Download,
  ArrowRight,
  Github,
  Zap,
  Shield,
  Globe,
  Clock,
  Star,
} from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { useLocalizedPath } from '@/hooks/useLocalizedPath';
import { OpenStrandLogo } from '@/components/icons/OpenStrandLogo';
import { GitHubStats } from '@/components/github/GitHubStats';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { cn } from '@/lib/utils';

interface LandingHeaderProps {
  variant?: 'landing' | 'dashboard';
}

export function LandingHeader({ variant = 'landing' }: LandingHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();
  const localizePath = useLocalizedPath();
  const t = useTranslations('common');

  const isLanding = variant === 'landing' || pathname?.includes('/landing');
  const isDashboard = pathname?.includes('/dashboard');

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
            className="flex items-center gap-2.5 group"
            onClick={closeMobileMenu}
          >
            <div className="relative">
              <OpenStrandLogo size="md" variant="default" />
              <div className="absolute inset-0 bg-primary/20 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-foreground">
                OpenStrand
              </span>
              <span className="text-[10px] uppercase tracking-[0.2em] text-primary/70 font-medium -mt-0.5">
                Knowledge Fabric
              </span>
            </div>
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-accent/50">
                  <Brain className="h-4 w-4" />
                  Knowledge
                  <ChevronDown className="h-3 w-3 opacity-60" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-80">
                <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                  Personal Knowledge Management
                </DropdownMenuLabel>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href={localizePath('/pkms')} className="flex gap-3 py-2">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <FolderTree className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">Fabric Browser</div>
                      <div className="text-xs text-muted-foreground">Navigate your knowledge hierarchy</div>
                    </div>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href={localizePath('/weave')} className="flex gap-3 py-2">
                    <div className="h-9 w-9 rounded-lg bg-cyan-500/10 flex items-center justify-center flex-shrink-0">
                      <Network className="h-4 w-4 text-cyan-600" />
                    </div>
                    <div>
                      <div className="font-medium">Knowledge Graph</div>
                      <div className="text-xs text-muted-foreground">Visualize connections & relationships</div>
                    </div>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href={localizePath('/composer')} className="flex gap-3 py-2">
                    <div className="h-9 w-9 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                      <FileText className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div>
                      <div className="font-medium">Strand Composer</div>
                      <div className="text-xs text-muted-foreground">Create & import markdown notes</div>
                    </div>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                  Learning Tools
                </DropdownMenuLabel>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href={localizePath('/flashcards')} className="flex gap-3 py-2">
                    <div className="h-9 w-9 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                      <GraduationCap className="h-4 w-4 text-amber-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium flex items-center gap-2">
                        Flashcards & Quizzes
                        <Badge variant="secondary" className="text-[10px]">AI</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">Spaced repetition learning</div>
                    </div>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Dashboard Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-accent/50">
                  <BarChart3 className="h-4 w-4" />
                  Visualize
                  <ChevronDown className="h-3 w-3 opacity-60" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-80">
                <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                  Data Visualization
                </DropdownMenuLabel>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href={localizePath('/dashboard')} className="flex gap-3 py-2">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">AI Dashboard</div>
                      <div className="text-xs text-muted-foreground">Create charts with natural language</div>
                    </div>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href={localizePath('/datasets')} className="flex gap-3 py-2">
                    <div className="h-9 w-9 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                      <Database className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium">Datasets</div>
                      <div className="text-xs text-muted-foreground">Manage your data sources</div>
                    </div>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href={localizePath('/gallery')} className="flex gap-3 py-2">
                    <div className="h-9 w-9 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                      <Layers className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <div className="font-medium">Community Gallery</div>
                      <div className="text-xs text-muted-foreground">Browse shared visualizations</div>
                    </div>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Pricing Dropdown (includes Teams & API) */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-accent/50">
                  <CreditCard className="h-4 w-4" />
                  Pricing
                  <ChevronDown className="h-3 w-3 opacity-60" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-80">
                <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                  Plans & Editions
                </DropdownMenuLabel>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="#pricing" className="flex gap-3 py-2">
                    <div className="h-9 w-9 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                      <Download className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        Community Edition
                        <Badge className="bg-emerald-500 text-white text-[10px]">Free Forever</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">Open source, offline-first, single user</div>
                    </div>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href={localizePath('/teams')} className="flex gap-3 py-2">
                    <div className="h-9 w-9 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                      <Users className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium">Teams Edition</div>
                      <div className="text-xs text-muted-foreground">Collaboration, sharing & community features</div>
                    </div>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href={localizePath('/teams#enterprise')} className="flex gap-3 py-2">
                    <div className="h-9 w-9 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                      <Building2 className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <div className="font-medium">Enterprise</div>
                      <div className="text-xs text-muted-foreground">SSO, audit logs, dedicated support</div>
                    </div>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                  For Developers
                </DropdownMenuLabel>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href={localizePath('/teams#api')} className="flex gap-3 py-2">
                    <div className="h-9 w-9 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                      <Code2 className="h-4 w-4 text-orange-600" />
                    </div>
                    <div>
                      <div className="font-medium">API & SDK</div>
                      <div className="text-xs text-muted-foreground">RESTful API, TypeScript SDK</div>
                    </div>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Docs Dropdown - Also clickable to go to docs home */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Link
                  href={localizePath('/tutorials')}
                  className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-accent/50"
                  onClick={(e) => {
                    // Allow dropdown to open on click, but navigate on direct click
                    if ((e.target as HTMLElement).closest('[data-radix-collection-item]')) {
                      e.preventDefault();
                    }
                  }}
                >
                  <BookOpen className="h-4 w-4" />
                  Docs
                  <ChevronDown className="h-3 w-3 opacity-60" />
                </Link>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-72">
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href={localizePath('/tutorials')} className="flex gap-3 py-2">
                    <BookOpen className="h-4 w-4 text-primary" />
                    <div>
                      <div className="font-medium">Documentation Home</div>
                      <div className="text-xs text-muted-foreground">Guides & tutorials</div>
                    </div>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href={localizePath('/tutorials/backup-quickstart')} className="flex gap-2 py-1.5">
                    <Zap className="h-4 w-4 text-amber-500" />
                    <span>Quick Start Guide</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href={localizePath('/tutorials/metadata-playbook')} className="flex gap-2 py-1.5">
                    <FileText className="h-4 w-4 text-blue-500" />
                    <span>Metadata Playbook</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href={localizePath('/tutorials/pen-and-paper-strand')} className="flex gap-2 py-1.5">
                    <Star className="h-4 w-4 text-purple-500" />
                    <span>Pen & Paper Modeling</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="cursor-pointer">
                  <a 
                    href="https://github.com/framersai/openstrand" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex gap-2 py-1.5"
                  >
                    <Github className="h-4 w-4" />
                    <span>GitHub Repository</span>
                    <ExternalLink className="h-3 w-3 ml-auto opacity-50" />
                  </a>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Right side actions */}
          <div className="hidden lg:flex items-center gap-2">
            <GitHubStats variant="compact" />
            <ThemeSwitcher />
            
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
                className="gap-1.5 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/25"
              >
                <Link href={localizePath('/dashboard')}>
                  <BarChart3 className="h-4 w-4" />
                  <span>Open Dashboard</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </Button>
            )}
          </div>

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
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
              <Button asChild className="w-full gap-2" size="lg">
                <Link href={localizePath('/dashboard')} onClick={closeMobileMenu}>
                  <BarChart3 className="h-4 w-4" />
                  Open Dashboard
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <div className="flex items-center justify-center gap-4">
                <GitHubStats variant="compact" />
                <ThemeSwitcher />
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

