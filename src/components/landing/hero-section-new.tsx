'use client';

import { useMemo, useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle, Github, ArrowRight, Sparkles, InfinityIcon, GitBranch, ShieldCheck, Eye, Lock, LogIn } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { OpenStrandLogo } from '@/components/icons/OpenStrandLogo';
import { GitHubStats } from '@/components/github/GitHubStats';
import {
  KnowledgeWeavingIcon,
  DataOceanIcon,
  NeuralStrandIcon,
  SchemaIntelligenceIcon,
  LocalFirstIcon,
  PrivacyShieldIcon
} from '@/components/landing/icons';
import { useLocalizedPath } from '@/hooks/useLocalizedPath';

interface HeroSectionProps {
  id?: string;
  className?: string;
}

const HERO_HIGHLIGHT_CONFIG = [
  { key: 'hierarchies', icon: KnowledgeWeavingIcon },
  { key: 'approvals', icon: PrivacyShieldIcon },
  { key: 'ai', icon: SchemaIntelligenceIcon },
  { key: 'offline', icon: LocalFirstIcon },
  { key: 'api', icon: SchemaIntelligenceIcon },
  { key: 'sdk', icon: NeuralStrandIcon },
] as const;

const HERO_DATA_FLOW_CONFIG = [
  { key: 'map', icon: GitBranch, gradient: 'from-blue-500 to-cyan-500' },
  { key: 'approve', icon: ShieldCheck, gradient: 'from-cyan-500 to-teal-500' },
  { key: 'cascade', icon: Eye, gradient: 'from-teal-500 to-emerald-500' },
  { key: 'placeholder', icon: Lock, gradient: 'from-emerald-500 to-green-500' },
] as const;

export function HeroSection({ id, className }: HeroSectionProps) {
  const [activeDataPoint, setActiveDataPoint] = useState(0);
  const localizePath = useLocalizedPath();
  const tHero = useTranslations('landing.hero');


  // Animate data points
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveDataPoint((prev) => (prev + 1) % 4);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const heroHighlights = useMemo(
    () =>
      HERO_HIGHLIGHT_CONFIG.map(({ key, icon }) => ({
        icon,
        label: tHero(`highlights.${key}.title`),
        description: tHero(`highlights.${key}.description`),
      })),
    [tHero],
  );

  const dataFlowItems = useMemo(
    () =>
      HERO_DATA_FLOW_CONFIG.map(({ key, icon: Icon, gradient }) => ({
        label: tHero(`journey.items.${key}`),
        icon: <Icon className="h-5 w-5" />,
        color: gradient,
      })),
    [tHero],
  );

  return (
    <section id={id} className={cn('landing-section hero-section relative overflow-hidden', className)}>
      {/* Ocean-inspired gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-950 via-cyan-950 to-teal-950 opacity-10" />

      {/* Animated ocean waves */}
      <div className="absolute inset-0 overflow-hidden">
        <DataOceanIcon className="absolute -left-20 top-20 h-96 w-96 text-cyan-500/10 animate-pulse" />
        <DataOceanIcon className="absolute -right-20 bottom-20 h-96 w-96 text-teal-500/10 animate-pulse delay-1000" />
      </div>

      <div className="container relative z-10 mx-auto grid gap-16 px-4 pb-20 pt-24 lg:grid-cols-2 lg:items-center">
        {/* Left content */}
        <div className="space-y-8">
          {/* Badges */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-gradient-to-r from-cyan-50/50 to-teal-50/50 px-4 py-2 text-sm font-semibold text-cyan-700 shadow-sm backdrop-blur dark:border-cyan-500/30 dark:bg-gradient-to-r dark:from-cyan-500/10 dark:to-teal-500/10 dark:text-cyan-300">
              <InfinityIcon className="h-4 w-4" />
              {tHero('badge.community')}
            </div>
            <GitHubStats variant="compact" />
          </div>

          {/* Main headline */}
          <h1 className="max-w-2xl text-balance text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            {tHero.rich('headline', {
              highlight: (chunks) => (
                <span className="relative">
                  <span className="relative z-10 bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 bg-clip-text text-transparent">
                    {chunks}
                  </span>
                  <NeuralStrandIcon className="absolute -right-8 -top-6 h-12 w-12 text-cyan-500/30 animate-pulse" />
                </span>
              ),
            })}
          </h1>

          {/* Subheadline */}
          <p className="max-w-2xl text-lg text-muted-foreground md:text-xl">
            {tHero.rich('subheadline', {
              strong: (chunks) => <span className="font-semibold text-foreground">{chunks}</span>,
            })}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col gap-4 sm:flex-row">
            <Button
              size="lg"
              className="group relative gap-2 border border-cyan-500/30 bg-cyan-50 text-cyan-700 shadow-sm transition hover:border-cyan-500/40 hover:bg-cyan-100 hover:text-cyan-800 dark:border-transparent dark:bg-gradient-to-r dark:from-cyan-600 dark:to-teal-600 dark:text-white dark:hover:from-cyan-700 dark:hover:to-teal-700"
              asChild
            >
              <Link href={localizePath('/auth?view=sign-up')} className="group">
                <InfinityIcon className="h-4 w-4" />
                {tHero('cta.primary')}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="group gap-2 border-cyan-600/20 hover:border-cyan-600/40"
              asChild
            >
              <Link href={localizePath('/landing#pricing')}>
                <ShieldCheck className="h-5 w-5" />
                {tHero('cta.secondary')}
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="lg"
              className="gap-2"
              asChild
            >
              <Link href={localizePath('/auth?view=sign-in')} className="group">
                <LogIn className="h-4 w-4" />
                {tHero('cta.manage')}
              </Link>
            </Button>
          </div>

          <p className="mt-2 text-xs text-muted-foreground">
            {tHero.rich('explore', {
              repo: (chunks) => (
                <a
                  href="https://github.com/framersai/openstrand"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-cyan-600 underline-offset-4 hover:underline dark:text-cyan-300"
                >
                  {chunks}
                </a>
              ),
              docs: (chunks) => (
                <Link
                  href={localizePath('/docs')}
                  className="font-medium text-cyan-600 underline-offset-4 hover:underline dark:text-cyan-300"
                >
                  {chunks}
                </Link>
              ),
            })}
          </p>

          {/* Feature highlights grid */}
          <div className="space-y-4">
            <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              {tHero('highlightsTitle')}
            </p>
            <ul className="grid gap-3 sm:grid-cols-2">
              {heroHighlights.map(({ icon: Icon, label, description }) => (
                <li
                  key={label}
                  className="group relative flex items-start gap-3 rounded-xl border border-cyan-200/20 bg-gradient-to-br from-cyan-50/5 to-teal-50/5 px-4 py-3 shadow-sm backdrop-blur transition-all hover:border-cyan-400/40 hover:shadow-lg hover:shadow-cyan-500/10 dark:border-cyan-800/30 dark:from-cyan-900/10 dark:to-teal-900/10"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500/10 to-teal-500/10 text-cyan-600 dark:text-cyan-400">
                    <Icon size="md" />
                  </span>
                  <div className="flex-1">
                    <span className="block text-sm font-semibold text-foreground">{label}</span>
                    <span className="text-xs text-muted-foreground">{description}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right content - Interactive Demo */}
        <div className="relative lg:pl-8">
          {/* Animated background pattern */}
          <div className="absolute -inset-4 -z-10">
            <KnowledgeWeavingIcon className="h-full w-full text-cyan-500/5" />
          </div>

          {/* Main demo card */}
          <div className="card-glass relative overflow-hidden rounded-3xl border border-cyan-200/50 bg-gradient-to-br from-white/80 to-cyan-50/30 shadow-2xl backdrop-blur-xl dark:border-cyan-800/50 dark:from-gray-900/80 dark:to-cyan-950/30">
            {/* Header */}
            <div className="border-b border-cyan-200/30 bg-gradient-to-r from-cyan-50/50 to-teal-50/50 px-6 py-4 dark:border-cyan-800/30 dark:from-cyan-950/50 dark:to-teal-950/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <OpenStrandLogo size="md" variant="default" />
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">
                        {tHero('card.title')}
                      </p>
                      <p className="text-sm font-semibold text-foreground">
                        {tHero('card.subtitle')}
                      </p>
                    </div>
                </div>
                  <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
                    {tHero('trust.badge')}
                  </Badge>
              </div>
            </div>

            {/* Demo content */}
            <div className="relative p-6">
              {/* Data flow visualization */}
              <div className="mb-6">
                <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {tHero('journey.title')}
                </p>
                <div className="flex items-center justify-between">
                  {dataFlowItems.map((item, index) => (
                    <div
                      key={item.label}
                      className={cn(
                        'relative flex flex-col items-center gap-2 transition-all',
                        activeDataPoint === index ? 'scale-110' : 'scale-100 opacity-60'
                      )}
                    >
                      <div
                        className={cn(
                          'flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br text-2xl transition-all',
                          activeDataPoint === index
                            ? `${item.color} shadow-lg`
                            : 'from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800'
                        )}
                      >
                        {item.icon}
                      </div>
                      <span className="text-xs font-medium text-muted-foreground">
                        {item.label}
                      </span>
                      {index < dataFlowItems.length - 1 && (
                        <ArrowRight className="absolute -right-6 top-5 h-4 w-4 text-cyan-500/30" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Stats cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-cyan-200/30 bg-gradient-to-br from-cyan-50/50 to-white/50 p-4 dark:border-cyan-800/30 dark:from-cyan-950/50 dark:to-gray-900/50">
                  <p className="text-xs text-muted-foreground">{tHero('metrics.approvals.title')}</p>
                  <p className="text-2xl font-bold text-foreground">
                    <ShieldCheck className="mr-1 inline h-5 w-5 text-emerald-500" /> 128
                  </p>
                  <p className="mt-1 text-xs text-cyan-600 dark:text-cyan-400">
                    {tHero('metrics.approvals.detail')}
                  </p>
                </div>
                <div className="rounded-xl border border-teal-200/30 bg-gradient-to-br from-teal-50/50 to-white/50 p-4 dark:border-teal-800/30 dark:from-teal-950/50 dark:to-gray-900/50">
                  <p className="text-xs text-muted-foreground">{tHero('metrics.placeholders.title')}</p>
                  <p className="text-2xl font-bold text-foreground">
                    <Eye className="mr-1 inline h-5 w-5 text-teal-500" /> 100%
                  </p>
                  <p className="mt-1 text-xs text-teal-600 dark:text-teal-400">
                    {tHero('metrics.placeholders.detail')}
                  </p>
                </div>
              </div>

              {/* Try it now button */}
              <Button
                className="mt-6 w-full gap-2 border border-cyan-500/30 bg-cyan-50 text-cyan-700 shadow-sm transition hover:border-cyan-500/40 hover:bg-cyan-100 hover:text-cyan-800 dark:border-transparent dark:bg-gradient-to-r dark:from-cyan-600 dark:to-teal-600 dark:text-white dark:hover:from-cyan-700 dark:hover:to-teal-700"
                size="lg"
              >
                <Sparkles className="h-4 w-4" />
                {tHero('cta.launchDemo')}
                <ArrowRight className="h-4 w-4" />
              </Button>

              {/* Trust badges */}
              <div className="mt-4 flex items-center justify-center gap-6 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <PrivacyShieldIcon className="h-4 w-4 text-cyan-600" />
                  {tHero('trust.gdpr')}
                </span>
                <span className="flex items-center gap-1">
                  <LocalFirstIcon className="h-4 w-4 text-cyan-600" />
                  {tHero('trust.selfHosted')}
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  {tHero('trust.mit')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
