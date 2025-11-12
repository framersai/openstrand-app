'use client';

import { useTranslations } from 'next-intl';
import { Check, InfinityIcon, Sparkles, Gauge, WifiOff, Github, Code2, Shield } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useAppMode } from '@/hooks/useAppMode';
import { WeavePattern } from '@/components/icons/WeavePattern';

interface PricingTier {
  id: string;
  price: string;
  cadence: string;
  description: string;
  highlight?: boolean;
  features: string[];
  ctaHref: string;
  ctaLabel: string;
  badge?: string;
  offlineReady?: boolean;
}

interface PricingSectionProps {
  id?: string;
  className?: string;
}

export function PricingSection({ id, className }: PricingSectionProps) {
  const t = useTranslations('landing.pricing');
  const { mode } = useAppMode();

  const tiers: PricingTier[] = [
    {
      id: 'community',
      price: '$0',
      cadence: 'Free Forever',
      description: 'Community Edition - Works offline, always free.',
      features: [
        '✅ 100% Free Forever - No trials, no tricks',
        '✅ Works Offline Permanently',
        'Unlimited local data processing',
        'All core visualization features',
        'AI Artisan + 3-tier visualization system (BYOK, unlimited)',
        'Knowledge weaving & graphs',
        'Export to any format',
        'Community support & forums',
      ],
      ctaHref: '/',
      ctaLabel: 'Download Free Forever',
      offlineReady: true,
      badge: 'ALWAYS FREE',
    },
    {
      id: 'team',
      price: '$1,000',
      cadence: 'one-time team license',
      description: 'Commercial teams (≤50 seats or < $200k ARR). Unlimited usage, self-hostable, production API suite included.',
      features: [
        'Everything in Community Edition',
        'Full production OpenAPI + live Swagger explorer',
        'Team token management with scoped permissions and auditing',
        'Real-time collaboration & workspace sharing',
        'AI Artisan BYOK (unlimited) + optional managed keys',
        'Structured knowledge graph APIs & automated backlinks',
        'Priority support with 48h SLA',
        'Optional installation & hardening service (+$500)',
      ],
      ctaHref: '/contact',
      ctaLabel: 'Book onboarding',
      badge: 'Team License',
      highlight: true,
      offlineReady: true,
    },
    {
      id: 'enterprise',
      price: '$5,000',
      cadence: 'One-time license',
      description: 'Enterprise (51+ seats or ≥ $200k ARR). Everything in Team plus compliance automation and white-glove onboarding.',
      features: [
        'Everything in Team License',
        'Perpetual self-hosting license with source access escrow',
        'Dedicated install & performance tuning included',
        'SSO/SAML, SCIM, and advanced RBAC',
        'Audit-grade logging & compliance exports',
        'Custom visual pipelines + BYOM (bring your own models)',
        'Dedicated success engineer & quarterly architecture reviews',
      ],
      ctaHref: '/contact',
      ctaLabel: 'Purchase License',
      badge: 'Self-Host',
    },
  ];

  return (
    <section id={id} className={cn('landing-section pricing-section relative bg-background py-24', className)}>
      <div className="absolute inset-0 -z-10">
        <WeavePattern variant="hero" className="h-full w-full opacity-5" />
      </div>
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <Badge className="mb-4 border-emerald-400/50 bg-emerald-50/50 text-emerald-700 dark:border-emerald-500/50 dark:bg-emerald-500/10 dark:text-emerald-300">
            <Code2 className="mr-1.5 h-3 w-3" />
            Community Edition • Free Forever
          </Badge>
          <h2 className="mt-4 text-3xl font-bold text-foreground sm:text-4xl">
            Free Forever. No Trials. No Tricks.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Community Edition works offline forever at no cost. Upgrade to cloud for team collaboration or self-host with our enterprise license.
          </p>
        </div>

        <div className="relative mx-auto mt-16 grid gap-6 lg:grid-cols-3">
          <div className="pointer-events-none absolute inset-x-12 top-1/2 -translate-y-1/2 rounded-full bg-primary/15 blur-3xl dark:bg-primary/10" />
          {tiers.map((tier) => (
            <div
              key={tier.id}
              className={cn(
                'relative flex flex-col rounded-3xl border border-border/60 bg-background/95 p-8 shadow-xl transition hover:-translate-y-2 hover:border-primary/40',
                tier.highlight && 'border-primary/40 bg-gradient-to-b from-primary/5 to-background',
              )}
            >
              {tier.badge && (
                <span className="absolute right-6 top-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
                  <Sparkles className="h-3 w-3" />
                  {tier.badge}
                </span>
              )}

              <div>
                <h3 className="text-xl font-semibold text-foreground">
                  {tier.id === 'community'
                    ? 'Community Edition'
                    : tier.id === 'team'
                      ? 'Team License'
                      : 'Enterprise Self-Host'}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">{tier.description}</p>
              </div>

              <div className="mt-6 flex items-baseline gap-2">
                <span className="text-4xl font-bold text-foreground">{tier.price}</span>
                <span className="text-sm text-muted-foreground">{tier.cadence}</span>
              </div>

              <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className="mt-1 h-4 w-4 flex-shrink-0 text-primary" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {tier.id === 'community' && (
                <div className="mt-6 space-y-3">
                  <div className="flex items-center gap-3 rounded-xl border border-emerald-400/20 bg-emerald-100/40 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200">
                    <InfinityIcon className="h-4 w-4" />
                    <span className="font-semibold">Free Forever - No Credit Card</span>
                  </div>
                  <div className="flex items-center gap-3 rounded-xl border border-blue-400/20 bg-blue-100/40 px-4 py-3 text-sm text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-200">
                    <WifiOff className="h-4 w-4" />
                    <span className="font-semibold">Works Offline Forever</span>
                  </div>
                  <div className="flex items-center gap-3 rounded-xl border border-purple-400/20 bg-purple-100/40 px-4 py-3 text-sm text-purple-700 dark:border-purple-500/20 dark:bg-purple-500/10 dark:text-purple-200">
                    <Github className="h-4 w-4" />
                    <span className="font-semibold">100% Open Source</span>
                  </div>
                </div>
              )}
              
              {tier.offlineReady && tier.id !== 'community' && (
                <div className="mt-6 flex items-center gap-3 rounded-xl border border-amber-400/20 bg-amber-100/40 px-4 py-3 text-sm text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
                  <WifiOff className="h-4 w-4" />
                  <span>Works Offline Too</span>
                </div>
              )}

              <Button
                asChild
                size="lg"
                className={cn(
                  'mt-8',
                  tier.highlight ? 'btn-gradient-border w-full' : 'w-full',
                )}
              >
                <a href={tier.ctaHref}>{tier.ctaLabel}</a>
              </Button>
            </div>
          ))}
        </div>

        <div className="mt-16 grid gap-6 rounded-3xl border border-border/60 bg-muted/20 p-8 shadow-lg lg:grid-cols-3">
          <div className="flex items-center gap-3">
            <Gauge className="h-6 w-6 text-primary" />
            <div>
              <p className="text-sm font-semibold text-foreground">{t('stats.lowLatency.title')}</p>
              <p className="text-sm text-muted-foreground">{t('stats.lowLatency.description')}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <InfinityIcon className="h-6 w-6 text-primary" />
            <div>
              <p className="text-sm font-semibold text-foreground">
                {t('stats.scalable.title')}
              </p>
              <p className="text-sm text-muted-foreground">
                {mode === 'offline'
                  ? t('stats.scalable.descriptionOffline')
                  : t('stats.scalable.description')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Sparkles className="h-6 w-6 text-primary" />
            <div>
              <p className="text-sm font-semibold text-foreground">{t('stats.ai.title')}</p>
              <p className="text-sm text-muted-foreground">
                {mode === 'offline'
                  ? t('stats.ai.descriptionOffline')
                  : t('stats.ai.description')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
