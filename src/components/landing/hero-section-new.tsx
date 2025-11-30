'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Download, 
  ArrowRight, 
  Users, 
  WifiOff,
  CheckCircle2,
  FileText,
  FolderTree,
  Network,
  Zap,
  Lock,
  Globe,
  Code2,
  BookOpen,
} from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { GitHubStats } from '@/components/github/GitHubStats';
import { useLocalizedPath } from '@/hooks/useLocalizedPath';

interface HeroSectionProps {
  id?: string;
  className?: string;
}

// Knowledge hierarchy visualization
function HierarchyVisualization() {
  const [activeLevel, setActiveLevel] = useState(0);
  
  // Auto-cycle through levels
  useState(() => {
    const interval = setInterval(() => {
      setActiveLevel((prev) => (prev + 1) % 4);
    }, 2500);
    return () => clearInterval(interval);
  });

  const levels = [
    { name: 'Fabric', icon: Globe, color: 'from-purple-500 to-indigo-500', desc: 'Your entire knowledge base' },
    { name: 'Weave', icon: FolderTree, color: 'from-blue-500 to-cyan-500', desc: 'Root-level topic collections' },
    { name: 'Loom', icon: Network, color: 'from-cyan-500 to-teal-500', desc: 'Nested sub-topics' },
    { name: 'Strand', icon: FileText, color: 'from-teal-500 to-emerald-500', desc: 'Individual .md notes' },
  ];

  return (
    <div className="relative p-5 rounded-2xl bg-card/80 border border-border/50 backdrop-blur-sm">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-4">
        Four-Tier Architecture
      </p>
      
      <div className="relative space-y-1.5">
        {levels.map((level, index) => {
          const Icon = level.icon;
          const isActive = activeLevel === index;
          
          return (
            <div
              key={level.name}
              className={cn(
                'flex items-center gap-2.5 p-2.5 rounded-lg transition-all duration-300',
                isActive 
                  ? 'bg-gradient-to-r ' + level.color + ' text-white shadow-md'
                  : 'bg-muted/40 hover:bg-muted/60'
              )}
              style={{ marginLeft: `${index * 10}px` }}
            >
              <div className={cn(
                'h-7 w-7 rounded-md flex items-center justify-center transition-all',
                isActive ? 'bg-white/20' : 'bg-background/50'
              )}>
                <Icon className={cn('h-3.5 w-3.5', isActive ? 'text-white' : 'text-muted-foreground')} />
              </div>
              <div className="flex-1 min-w-0">
                <div className={cn('text-xs font-semibold', !isActive && 'text-foreground')}>
                  {level.name}
                </div>
                <div className={cn('text-[10px] truncate', isActive ? 'text-white/80' : 'text-muted-foreground')}>
                  {level.desc}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-3 pt-3 border-t border-border/50 flex items-center gap-1.5 text-[10px] text-muted-foreground">
        <FileText className="h-3 w-3" />
        <span>.md files are your source of truth</span>
      </div>
    </div>
  );
}

// Edition comparison card
function EditionCard({ 
  edition, 
  isActive,
  onClick,
}: { 
  edition: 'community' | 'teams';
  isActive: boolean;
  onClick: () => void;
}) {
  const isCommunity = edition === 'community';
  
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex-1 p-3 rounded-xl border-2 transition-all text-left',
        isActive
          ? isCommunity
            ? 'border-emerald-500 bg-emerald-500/10'
            : 'border-blue-500 bg-blue-500/10'
          : 'border-border/50 hover:border-border'
      )}
    >
      <div className="flex items-center gap-2 mb-1">
        {isCommunity ? (
          <WifiOff className="h-3.5 w-3.5 text-emerald-600" />
        ) : (
          <Users className="h-3.5 w-3.5 text-blue-600" />
        )}
        <span className="font-semibold text-xs">
          {isCommunity ? 'Community' : 'Teams'}
        </span>
        {isCommunity && (
          <Badge className="bg-emerald-500 text-white text-[9px] ml-auto px-1.5 py-0">
            Free
          </Badge>
        )}
      </div>
      <p className="text-[10px] text-muted-foreground leading-tight">
        {isCommunity 
          ? 'Open source, offline-first, full features'
          : 'Collaboration & sharing features'}
      </p>
    </button>
  );
}

export function HeroSection({ id, className }: HeroSectionProps) {
  const [activeEdition, setActiveEdition] = useState<'community' | 'teams'>('community');
  const localizePath = useLocalizedPath();

  const keyFeatures = [
    { icon: WifiOff, label: 'Works 100% Offline' },
    { icon: Lock, label: 'Privacy-First' },
    { icon: Code2, label: 'Open Source' },
    { icon: Zap, label: 'No API Keys Needed' },
  ];

  return (
    <section 
      id={id} 
      className={cn('landing-section hero-section relative overflow-hidden', className)}
    >
      {/* Clean gradient background - no dots */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] via-transparent to-cyan-500/[0.03]" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
      </div>

      {/* Reduced padding */}
      <div className="container relative z-10 mx-auto px-4 py-8 lg:py-12">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-center lg:gap-12">
          {/* Left content */}
          <div className="space-y-5">
            {/* Main headline - no badges at top */}
            <h1 className="text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              Your Knowledge,{' '}
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-primary via-cyan-500 to-emerald-500 bg-clip-text text-transparent">
                  Woven Together
                </span>
                <svg 
                  className="absolute -bottom-1 left-0 w-full h-2 text-primary/30" 
                  viewBox="0 0 200 8"
                  preserveAspectRatio="none"
                >
                  <path 
                    d="M0 4 Q50 0, 100 4 T200 4" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2"
                    className="animate-draw"
                  />
                </svg>
              </span>
            </h1>

            {/* Subheadline */}
            <p className="max-w-lg text-base text-muted-foreground leading-relaxed">
              OpenStrand is a{' '}
              <strong className="text-foreground">personal knowledge management system</strong>{' '}
              that organizes your markdown notes into an interconnected fabric. 
              Like <em>Obsidian</em> meets <em>Notion</em>, but{' '}
              <strong className="text-emerald-600 dark:text-emerald-400">100% offline</strong>,{' '}
              <strong className="text-primary">open source</strong>, and{' '}
              <strong className="text-foreground">forever free</strong>.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-2.5">
              <Button
                size="default"
                className="gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/20"
                asChild
              >
                <a href="https://github.com/framersai/openstrand/releases" target="_blank" rel="noopener noreferrer">
                  <Download className="h-4 w-4" />
                  Download Free (Forever)
                </a>
              </Button>
              <Button
                variant="outline"
                size="default"
                className="gap-2"
                asChild
              >
                <Link href="#pricing">
                  <Users className="h-4 w-4" />
                  Teams & Enterprise
                </Link>
              </Button>
            </div>

            {/* Key features - compact inline */}
            <div className="flex flex-wrap gap-x-4 gap-y-2 pt-2">
              {keyFeatures.map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Icon className="h-3.5 w-3.5 text-primary" />
                  <span>{label}</span>
                </div>
              ))}
            </div>

            {/* Badges moved to bottom */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/50">
              <Badge 
                variant="outline" 
                className="gap-1 text-[10px] border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
              >
                <WifiOff className="h-2.5 w-2.5" />
                Offline-First
              </Badge>
              <Badge 
                variant="outline"
                className="gap-1 text-[10px] border-primary/30 bg-primary/10"
              >
                <Code2 className="h-2.5 w-2.5" />
                MIT Licensed
              </Badge>
              <GitHubStats variant="compact" />
            </div>

            {/* Trust statement */}
            <p className="text-xs text-muted-foreground">
              <CheckCircle2 className="inline h-3 w-3 text-emerald-500 mr-1" />
              Community Edition has <strong>full feature parity</strong> with Teams.
            </p>
          </div>

          {/* Right content - Interactive visualization */}
          <div className="space-y-3">
            {/* Edition selector */}
            <div className="flex gap-2">
              <EditionCard 
                edition="community" 
                isActive={activeEdition === 'community'}
                onClick={() => setActiveEdition('community')}
              />
              <EditionCard 
                edition="teams" 
                isActive={activeEdition === 'teams'}
                onClick={() => setActiveEdition('teams')}
              />
            </div>

            {/* Hierarchy visualization */}
            <HierarchyVisualization />

            {/* Bottom info */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/50">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-cyan-500 flex items-center justify-center">
                  <BookOpen className="h-4 w-4 text-white" />
                </div>
                <div>
                  <div className="text-xs font-medium">Markdown is Truth</div>
                  <div className="text-[10px] text-muted-foreground">
                    .md files + any assets you need
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="text-xs h-7" asChild>
                <Link href={localizePath('/tutorials/pen-and-paper-strand')}>
                  Learn More
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes draw {
          0% { stroke-dashoffset: 200; }
          100% { stroke-dashoffset: 0; }
        }
        .animate-draw {
          stroke-dasharray: 200;
          animation: draw 2s ease-out forwards;
        }
      `}</style>
    </section>
  );
}
