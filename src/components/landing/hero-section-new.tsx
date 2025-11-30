'use client';

import { useMemo, useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { 
  Download, 
  ArrowRight, 
  Sparkles, 
  Users, 
  Shield, 
  Wifi, 
  WifiOff,
  Github,
  CheckCircle2,
  FileText,
  FolderTree,
  Network,
  Zap,
  Clock,
  Lock,
  Globe,
  Code2,
  BookOpen,
} from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { OpenStrandLogo } from '@/components/icons/OpenStrandLogo';
import { GitHubStats } from '@/components/github/GitHubStats';
import { useLocalizedPath } from '@/hooks/useLocalizedPath';

interface HeroSectionProps {
  id?: string;
  className?: string;
}

// Animated floating node component
function FloatingNode({ 
  delay = 0, 
  size = 'md',
  color = 'primary',
  x = 0,
  y = 0,
}: { 
  delay?: number; 
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'cyan' | 'emerald' | 'amber';
  x?: number;
  y?: number;
}) {
  const sizeClasses = {
    sm: 'h-2 w-2',
    md: 'h-3 w-3',
    lg: 'h-4 w-4',
  };
  
  const colorClasses = {
    primary: 'bg-primary/60',
    cyan: 'bg-cyan-500/60',
    emerald: 'bg-emerald-500/60',
    amber: 'bg-amber-500/60',
  };

  return (
    <div
      className={cn(
        'absolute rounded-full blur-[1px]',
        sizeClasses[size],
        colorClasses[color],
        'animate-float'
      )}
      style={{
        left: `${x}%`,
        top: `${y}%`,
        animationDelay: `${delay}s`,
        animationDuration: `${3 + Math.random() * 2}s`,
      }}
    />
  );
}

// Animated connection line
function ConnectionLine({ 
  x1, y1, x2, y2, delay = 0 
}: { 
  x1: number; y1: number; x2: number; y2: number; delay?: number;
}) {
  return (
    <line
      x1={`${x1}%`}
      y1={`${y1}%`}
      x2={`${x2}%`}
      y2={`${y2}%`}
      stroke="currentColor"
      strokeWidth="1"
      className="text-primary/20 animate-pulse"
      style={{ animationDelay: `${delay}s` }}
    />
  );
}

// Knowledge hierarchy visualization
function HierarchyVisualization() {
  const [activeLevel, setActiveLevel] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveLevel((prev) => (prev + 1) % 4);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const levels = [
    { name: 'Fabric', icon: Globe, color: 'from-purple-500 to-indigo-500', desc: 'Your entire knowledge base' },
    { name: 'Weave', icon: FolderTree, color: 'from-blue-500 to-cyan-500', desc: 'Root-level topic collections' },
    { name: 'Loom', icon: Network, color: 'from-cyan-500 to-teal-500', desc: 'Nested sub-topics' },
    { name: 'Strand', icon: FileText, color: 'from-teal-500 to-emerald-500', desc: 'Individual .md notes' },
  ];

  return (
    <div className="relative p-6 rounded-2xl bg-gradient-to-br from-card/80 to-card/40 border border-border/50 backdrop-blur-sm">
      <div className="absolute inset-0 overflow-hidden rounded-2xl">
        <svg className="absolute inset-0 w-full h-full opacity-30">
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-primary/10" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>
      
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-4 relative">
        Four-Tier Knowledge Architecture
      </p>
      
      <div className="relative space-y-2">
        {levels.map((level, index) => {
          const Icon = level.icon;
          const isActive = activeLevel === index;
          
          return (
            <div
              key={level.name}
              className={cn(
                'flex items-center gap-3 p-3 rounded-xl transition-all duration-500',
                isActive 
                  ? 'bg-gradient-to-r ' + level.color + ' text-white shadow-lg scale-[1.02]'
                  : 'bg-muted/30 hover:bg-muted/50'
              )}
              style={{ marginLeft: `${index * 12}px` }}
            >
              <div className={cn(
                'h-8 w-8 rounded-lg flex items-center justify-center transition-all',
                isActive ? 'bg-white/20' : 'bg-primary/10'
              )}>
                <Icon className={cn('h-4 w-4', isActive ? 'text-white' : 'text-primary')} />
              </div>
              <div className="flex-1 min-w-0">
                <div className={cn('text-sm font-semibold', !isActive && 'text-foreground')}>
                  {level.name}
                </div>
                <div className={cn('text-xs truncate', isActive ? 'text-white/80' : 'text-muted-foreground')}>
                  {level.desc}
                </div>
              </div>
              {index < levels.length - 1 && (
                <div className={cn(
                  'absolute left-6 top-full h-2 w-px',
                  isActive ? 'bg-white/40' : 'bg-border'
                )} />
              )}
            </div>
          );
        })}
      </div>
      
      <div className="mt-4 pt-4 border-t border-border/50 flex items-center gap-2 text-xs text-muted-foreground">
        <FileText className="h-3.5 w-3.5" />
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
        'flex-1 p-4 rounded-xl border-2 transition-all text-left',
        isActive
          ? isCommunity
            ? 'border-emerald-500 bg-emerald-500/10'
            : 'border-blue-500 bg-blue-500/10'
          : 'border-border/50 hover:border-border'
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        {isCommunity ? (
          <WifiOff className="h-4 w-4 text-emerald-600" />
        ) : (
          <Users className="h-4 w-4 text-blue-600" />
        )}
        <span className="font-semibold text-sm">
          {isCommunity ? 'Community' : 'Teams'}
        </span>
        {isCommunity && (
          <Badge className="bg-emerald-500 text-white text-[10px] ml-auto">
            Free Forever
          </Badge>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        {isCommunity 
          ? 'Open source, offline-first, single user. Full feature parity.'
          : 'Collaboration, sharing, community features. Licensed.'}
      </p>
    </button>
  );
}

export function HeroSection({ id, className }: HeroSectionProps) {
  const [activeEdition, setActiveEdition] = useState<'community' | 'teams'>('community');
  const localizePath = useLocalizedPath();
  const tHero = useTranslations('landing.hero');

  // Floating nodes for background animation
  const floatingNodes = useMemo(() => {
    const nodes = [];
    for (let i = 0; i < 20; i++) {
      nodes.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: ['sm', 'md', 'lg'][Math.floor(Math.random() * 3)] as 'sm' | 'md' | 'lg',
        color: ['primary', 'cyan', 'emerald', 'amber'][Math.floor(Math.random() * 4)] as 'primary' | 'cyan' | 'emerald' | 'amber',
        delay: Math.random() * 2,
      });
    }
    return nodes;
  }, []);

  const keyFeatures = [
    { icon: WifiOff, label: 'Works 100% Offline', desc: 'No internet required, ever' },
    { icon: Lock, label: 'Privacy-First', desc: 'Your data stays yours' },
    { icon: Code2, label: 'Open Source', desc: 'MIT licensed, forever' },
    { icon: Zap, label: 'Deterministic NLP', desc: 'No API keys needed' },
  ];

  return (
    <section 
      id={id} 
      className={cn('landing-section hero-section relative overflow-hidden', className)}
    >
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Gradient base */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-cyan-500/5" />
        
        {/* Floating nodes */}
        <div className="absolute inset-0">
          {floatingNodes.map((node) => (
            <FloatingNode key={node.id} {...node} />
          ))}
        </div>
        
        {/* Connection lines SVG */}
        <svg className="absolute inset-0 w-full h-full opacity-20">
          <ConnectionLine x1={10} y1={20} x2={30} y2={40} delay={0} />
          <ConnectionLine x1={30} y1={40} x2={50} y2={30} delay={0.5} />
          <ConnectionLine x1={50} y1={30} x2={70} y2={50} delay={1} />
          <ConnectionLine x1={70} y1={50} x2={90} y2={35} delay={1.5} />
          <ConnectionLine x1={20} y1={60} x2={40} y2={80} delay={0.3} />
          <ConnectionLine x1={60} y1={70} x2={80} y2={85} delay={0.8} />
        </svg>
      </div>

      <div className="container relative z-10 mx-auto px-4 py-12 lg:py-16">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
          {/* Left content */}
          <div className="space-y-6">
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-3">
              <Badge 
                variant="outline" 
                className="gap-1.5 border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
              >
                <WifiOff className="h-3 w-3" />
                Offline-First
              </Badge>
              <Badge 
                variant="outline"
                className="gap-1.5 border-primary/30 bg-primary/10"
              >
                <Code2 className="h-3 w-3" />
                Open Source
              </Badge>
              <GitHubStats variant="compact" />
            </div>

            {/* Main headline */}
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Your Knowledge,{' '}
              <span className="relative">
                <span className="bg-gradient-to-r from-primary via-cyan-500 to-emerald-500 bg-clip-text text-transparent">
                  Woven Together
                </span>
                <svg 
                  className="absolute -bottom-2 left-0 w-full h-3 text-primary/30" 
                  viewBox="0 0 200 12"
                  preserveAspectRatio="none"
                >
                  <path 
                    d="M0 6 Q50 0, 100 6 T200 6" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2"
                    className="animate-draw"
                  />
                </svg>
              </span>
            </h1>

            {/* Subheadline - Updated copy */}
            <p className="max-w-xl text-lg text-muted-foreground leading-relaxed">
              OpenStrand is a{' '}
              <strong className="text-foreground">personal knowledge management system</strong>{' '}
              that organizes your markdown notes into a beautiful, interconnected fabric. 
              Think <em>Obsidian</em> meets <em>Notion</em>, but{' '}
              <strong className="text-emerald-600 dark:text-emerald-400">100% offline</strong>,{' '}
              <strong className="text-primary">open source</strong>, and{' '}
              <strong className="text-foreground">forever free</strong>.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-3">
              <Button
                size="lg"
                className="gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/25"
                asChild
              >
                <a href="https://github.com/framersai/openstrand/releases" target="_blank" rel="noopener noreferrer">
                  <Download className="h-4 w-4" />
                  Download Free (Forever)
                  <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="gap-2"
                asChild
              >
                <Link href="#pricing">
                  <Users className="h-4 w-4" />
                  View Teams & Enterprise Plans
                </Link>
              </Button>
            </div>

            {/* Key features grid */}
            <div className="grid grid-cols-2 gap-3 pt-4">
              {keyFeatures.map(({ icon: Icon, label, desc }) => (
                <div 
                  key={label}
                  className="flex items-start gap-2.5 p-3 rounded-xl bg-card/50 border border-border/50 hover:border-primary/30 transition-colors"
                >
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-foreground">{label}</div>
                    <div className="text-xs text-muted-foreground">{desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Trust statement */}
            <p className="text-xs text-muted-foreground pt-2">
              <CheckCircle2 className="inline h-3.5 w-3.5 text-emerald-500 mr-1" />
              Community Edition has <strong>full feature parity</strong> with Teams. 
              No artificial limitations. No upselling.{' '}
              <Link href="/license" className="text-primary hover:underline">
                MIT Licensed
              </Link>.
            </p>
          </div>

          {/* Right content - Interactive visualization */}
          <div className="space-y-4 lg:pl-4">
            {/* Edition selector */}
            <div className="flex gap-3">
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
            <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/50">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-cyan-500 flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="text-sm font-medium">Markdown is Truth</div>
                  <div className="text-xs text-muted-foreground">
                    Store PDFs, images, any assets. .md files are always the source.
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="sm" asChild>
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
        @keyframes float {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.6; }
          50% { transform: translateY(-20px) scale(1.1); opacity: 1; }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
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
