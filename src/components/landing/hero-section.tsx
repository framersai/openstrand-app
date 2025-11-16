'use client';

import { useMemo, useEffect, useState } from 'react';
import { ShieldCheck, WifiOff, BarChart, Bot, CheckCircle, Github, ExternalLink, InfinityIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useAppMode } from '@/hooks/useAppMode';
import { OpenStrandLogo } from '@/components/icons/OpenStrandLogo';
import { GitHubStats } from '@/components/github/GitHubStats';

interface HeroSectionProps {
  id?: string;
  className?: string;
}

export function HeroSection({ id, className }: HeroSectionProps) {
  const t = useTranslations('landing.hero');
  const { mode } = useAppMode();
  const [hydratedMode, setHydratedMode] = useState<'offline' | 'cloud'>(mode);

  const heroHighlights = useMemo(
    () => [
      {
        icon: ShieldCheck,
        label: 'Recursive Organization - No folders, just Strands with infinite nesting',
      },
      {
        icon: BarChart,
        label: 'Knowledge Graphs - Navigate by hierarchy OR conceptual relationships',
      },
      {
        icon: Bot,
        label: 'AI Intelligence - Hybrid recommendations, RAG Q&A, graph analytics',
      },
      {
        icon: WifiOff,
        label: 'Import Anything - Folders, Git repos, Obsidian vaults with structure preserved',
      },
    ],
    [t],
  );
  useEffect(() => {
    setHydratedMode(mode);
  }, [mode]);



  return (
    <section id={id} className={cn('landing-section hero-section', className)}>
      <div className="container mx-auto grid gap-10 px-4 pb-20 pt-24 lg:grid-cols-2 lg:items-center">
        <div className="space-y-8">
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-50/50 px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm backdrop-blur dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300">
              <InfinityIcon className="h-4 w-4" />
              Everything is a Strand. Structure is relationship, not type.
            </div>
            <GitHubStats variant="compact" />
          </div>
          <h1 className="max-w-2xl text-balance text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Build Your Living{' '}
            <span className="relative">
              <span className="relative z-10 text-gradient">Knowledge Graph</span>
            </span>
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground md:text-xl">
            Transform folders into <strong className="text-primary">Looms</strong>, files into <strong className="text-primary">Strands</strong>, 
            and connections into <strong className="text-primary">Weaves</strong>. 
            OpenStrand turns your notes, research, and code into an intelligent fabric of knowledge 
            with AI-powered recommendations and RAG-powered Q&A.
          </p>

          <div className="flex flex-col gap-4 sm:flex-row">
            <Button
              size="lg"
              className="btn-gradient-border gap-2 whitespace-nowrap px-6 py-3 text-base"
              asChild
            >
              <a href="/" className="group">
                <span className="inline-flex items-center gap-2">
                  Start Building Your Codex
                  <ExternalLink className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </a>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="group gap-2 border-primary/20 hover:border-primary/40"
              asChild
            >
              <a href="https://github.com/framersai/openstrand" target="_blank" rel="noopener noreferrer">
                <span className="inline-flex items-center gap-2">
                  <Github className="h-5 w-5" />
                  View on GitHub
                </span>
              </a>
            </Button>
          </div>

          <div className="space-y-4">
            <p className="text-sm font-medium text-muted-foreground">
              One primitive. Infinite possibilities:
            </p>
            <ul className="grid gap-3 sm:grid-cols-2">
              {heroHighlights.map(({ icon: Icon, label }) => (
                <li
                  key={label}
                  className="flex items-center gap-3 rounded-xl border border-border/40 bg-gradient-to-r from-background/80 to-background/60 px-4 py-3 shadow-sm backdrop-blur transition hover:border-primary/30 hover:shadow-md"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 text-primary">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="text-sm font-medium text-foreground">{label}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="relative">
          <div className="card-glass relative overflow-hidden rounded-3xl border border-border/50 bg-background/80 shadow-2xl backdrop-blur-xl">
            <div className="relative p-8">
              <div className="mb-8 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <OpenStrandLogo size="lg" variant="default" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      OpenStrand Platform
                    </p>
                    <p className="text-lg font-semibold text-foreground">
                      Your Knowledge, Interconnected
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="border-emerald-400/50 bg-emerald-50/50 text-emerald-700 dark:border-emerald-500/50 dark:bg-emerald-500/10 dark:text-emerald-300">
                  MIT Licensed
                </Badge>
              </div>
              <div className="grid gap-6">
                <div className="rounded-2xl border border-border/60 bg-background/90 p-5 shadow-sm">
                  <p className="text-sm font-semibold text-muted-foreground">
                    Multi-Hierarchy Organization
                  </p>
                  <p className="mt-2 text-base text-foreground">
                    Same Strand can appear in multiple Looms with different parents. Tag-like flexibility with tree structure benefits.
                  </p>
                </div>
                <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/10 p-5 shadow-md">
                  <p className="text-sm font-semibold text-primary">
                    RAG-Powered Knowledge Base
                  </p>
                  <p className="mt-2 text-base text-foreground">
                    Ask your knowledge base anything. Get answers grounded in your Strands with citations. LLM + embeddings + graph traversal.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


