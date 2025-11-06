'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { WeavePattern } from '@/components/icons/WeavePattern';
import { FileText, Network, Brain, Sparkles, Lock, WifiOff, GitFork, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useLocalizedPath } from '@/hooks/useLocalizedPath';

export function PKMSHero() {
  const localizePath = useLocalizedPath();

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-background via-background to-primary/5 py-24">
      {/* Background pattern */}
      <div className="absolute inset-0 -z-10">
        <WeavePattern variant="hero" className="h-full w-full opacity-10" animated />
      </div>

      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-4xl text-center">
          {/* Badges */}
          <div className="mb-6 flex flex-wrap items-center justify-center gap-3">
            <Badge className="gap-1.5 border-emerald-400/50 bg-emerald-50/50 text-emerald-700 dark:border-emerald-500/50 dark:bg-emerald-500/10 dark:text-emerald-300">
              <Lock className="h-3 w-3" />
              Your Data, Your Control
            </Badge>
            <Badge className="gap-1.5 border-blue-400/50 bg-blue-50/50 text-blue-700 dark:border-blue-500/50 dark:bg-blue-500/10 dark:text-blue-300">
              <WifiOff className="h-3 w-3" />
              Works Offline
            </Badge>
            <Badge className="gap-1.5 border-purple-400/50 bg-purple-50/50 text-purple-700 dark:border-purple-500/50 dark:bg-purple-500/10 dark:text-purple-300">
              <GitFork className="h-3 w-3" />
              Open Source
            </Badge>
          </div>

          {/* Title */}
          <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Your Personal{' '}
            <span className="relative inline-block">
              <span className="relative z-10 bg-gradient-to-r from-primary via-purple-500 to-purple-400 bg-clip-text text-transparent">
                Knowledge Management
              </span>
              <WeavePattern
                variant="subtle"
                className="pointer-events-none absolute inset-0 -z-10 h-full w-full scale-150 opacity-20"
              />
            </span>{' '}
            System
          </h1>

          {/* Description */}
          <p className="mb-8 text-lg text-muted-foreground sm:text-xl">
            OpenStrand PKMS transforms scattered information into an interconnected knowledge graph. 
            Create strands of knowledge, weave them together, and discover new connections with AI assistance.
          </p>

          {/* CTA Buttons */}
          <div className="mb-12 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button asChild size="lg" className="gap-2">
              <Link href={localizePath('/composer?origin=pkms')} prefetch={false}>
                <FileText className="h-5 w-5" />
                Start Creating Strands
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="group gap-2">
              <Link href={localizePath('/pkms/weave')}>
                <Network className="h-5 w-5" />
                Explore Knowledge Graph
                <ExternalLink className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
          </div>

          {/* Feature highlights */}
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="group rounded-xl border border-border/50 bg-background/80 p-6 backdrop-blur transition-all hover:border-primary/30 hover:shadow-lg">
              <div className="mb-4 flex justify-center">
                <div className="rounded-full bg-gradient-to-br from-blue-500/20 to-blue-600/20 p-4">
                  <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <h3 className="mb-2 text-lg font-semibold">Strands</h3>
              <p className="text-sm text-muted-foreground">
                Atomic units of knowledge: documents, notes, datasets, or any content type
              </p>
            </div>

            <div className="group rounded-xl border border-border/50 bg-background/80 p-6 backdrop-blur transition-all hover:border-primary/30 hover:shadow-lg">
              <div className="mb-4 flex justify-center">
                <div className="rounded-full bg-gradient-to-br from-purple-500/20 to-purple-600/20 p-4">
                  <Network className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
              <h3 className="mb-2 text-lg font-semibold">Weave</h3>
              <p className="text-sm text-muted-foreground">
                Your knowledge graph showing relationships and learning paths
              </p>
            </div>

            <div className="group rounded-xl border border-border/50 bg-background/80 p-6 backdrop-blur transition-all hover:border-primary/30 hover:shadow-lg">
              <div className="mb-4 flex justify-center">
                <div className="relative rounded-full bg-gradient-to-br from-amber-500/20 to-amber-600/20 p-4">
                  <Brain className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                  <Sparkles className="absolute -bottom-1 -right-1 h-4 w-4 text-amber-400 dark:text-amber-200" />
                </div>
              </div>
              <h3 className="mb-2 text-lg font-semibold">AI Enhancement</h3>
              <p className="text-sm text-muted-foreground">
                Optional AI to discover connections and enhance your learning
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
