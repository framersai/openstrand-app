'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import {
  Sparkles,
  Zap,
  Shield,
  Globe,
  Users,
  FileText,
  Download,
  Clock,
  ChevronRight
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  KnowledgeWeavingIcon,
  SchemaIntelligenceIcon,
  LocalFirstIcon,
  TypeScriptMonorepoIcon,
  CommunityGraphIcon,
  PrivacyShieldIcon
} from '@/components/landing/icons';

interface FeaturesSectionProps {
  id?: string;
  className?: string;
}

const MAIN_FEATURE_CONFIG = [
  { key: 'assistant', icon: SchemaIntelligenceIcon, gradient: 'from-violet-500 to-fuchsia-500' },
  { key: 'hierarchies', icon: KnowledgeWeavingIcon, gradient: 'from-cyan-500 to-teal-500' },
  { key: 'approvals', icon: PrivacyShieldIcon, gradient: 'from-teal-500 to-emerald-500' },
] as const;

const TECH_FEATURE_CONFIG = [
  { key: 'typescript', icon: TypeScriptMonorepoIcon, gradient: 'from-blue-500/10 to-indigo-500/10' },
  { key: 'dedupe', icon: Shield, gradient: 'from-amber-500/10 to-rose-500/10' },
  { key: 'offline', icon: LocalFirstIcon, gradient: 'from-cyan-500/10 to-blue-500/10' },
  { key: 'placeholders', icon: PrivacyShieldIcon, gradient: 'from-emerald-500/10 to-teal-500/10' },
  { key: 'api', icon: KnowledgeWeavingIcon, gradient: 'from-teal-500/10 to-cyan-500/10' },
  { key: 'pipeline', icon: SchemaIntelligenceIcon, gradient: 'from-emerald-500/10 to-green-500/10' },
  { key: 'telemetry', icon: CommunityGraphIcon, gradient: 'from-indigo-500/10 to-blue-500/10' },
] as const;

const COMPARISON_PRODUCTS = ['openstrand', 'notion', 'obsidian', 'tableau'] as const;

export function FeaturesSection({ id, className }: FeaturesSectionProps) {
  const tFeatures = useTranslations('landing.features');

  const mainFeatures = useMemo(
    () =>
      MAIN_FEATURE_CONFIG.map(({ key, icon, gradient }) => ({
        icon,
        color: gradient,
        badge: tFeatures(`main.${key}.badge`),
        title: tFeatures(`main.${key}.title`),
        description: tFeatures(`main.${key}.description`),
        highlights: (tFeatures.raw(`main.${key}.highlights`) as string[]) ?? [],
      })),
    [tFeatures],
  );

  const technicalFeatures = useMemo(
    () =>
      TECH_FEATURE_CONFIG.map(({ key, icon, gradient }) => ({
        icon,
        gradient,
        title: tFeatures(`technical.${key}.title`),
        description: tFeatures(`technical.${key}.description`),
        metric: tFeatures(`technical.${key}.metric`),
      })),
    [tFeatures],
  );

  interface ComparisonRow {
    feature: string;
    openstrand: boolean | string;
    notion: boolean | string;
    obsidian: boolean | string;
    tableau?: boolean | string;
  }

  const comparisonRows = useMemo(
    () => ((tFeatures.raw('comparison.rows') as ComparisonRow[]) ?? []),
    [tFeatures],
  );

  const comparisonProducts = useMemo(
    () => ({
      openstrand: tFeatures('comparison.products.openstrand'),
      notion: tFeatures('comparison.products.notion'),
      obsidian: tFeatures('comparison.products.obsidian'),
      tableau: tFeatures('comparison.products.tableau'),
    }),
    [tFeatures],
  );

  return (
    <section id={id} className={cn('landing-section py-24', className)}>
      <div className="container mx-auto px-4">
        {/* Section header */}
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <Badge className="mb-4 bg-gradient-to-r from-cyan-500 to-teal-500 text-white">
            <Sparkles className="mr-1 h-3 w-3" />
            {tFeatures('eyebrow')}
          </Badge>
          <h2 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl">
            {tFeatures.rich('title', {
              highlight: (chunks) => (
                <span className="bg-gradient-to-r from-cyan-500 to-teal-500 bg-clip-text text-transparent">
                  {chunks}
                </span>
              ),
            })}
          </h2>
          <p className="text-lg text-muted-foreground">{tFeatures('subtitle')}</p>
        </div>

        {/* Main features grid */}
        <div className="mb-20 grid gap-8 lg:grid-cols-3">
          {mainFeatures.map((feature) => (
            <div
              key={feature.title}
              className="group relative overflow-hidden rounded-2xl border border-cyan-200/30 bg-gradient-to-br from-white to-cyan-50/20 p-8 shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl dark:border-cyan-800/30 dark:from-gray-900 dark:to-cyan-950/20"
            >
              {/* Background gradient */}
              <div
                className={cn(
                  'absolute -right-20 -top-20 h-40 w-40 rounded-full bg-gradient-to-br opacity-20 blur-3xl',
                  feature.color,
                )}
              />

              {/* Icon and badge */}
              <div className="relative mb-6 flex items-start justify-between">
                <div
                  className={cn(
                    'flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br shadow-lg',
                    feature.color,
                  )}
                >
                  <feature.icon className="h-7 w-7 text-white" />
                </div>
                <Badge variant="secondary" className="bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300">
                  {feature.badge}
                </Badge>
              </div>

              {/* Content */}
              <h3 className="mb-3 text-xl font-semibold text-foreground">{feature.title}</h3>
              <p className="mb-6 text-sm text-muted-foreground">{feature.description}</p>

              {/* Highlights */}
              <div className="space-y-2">
                {feature.highlights.map((highlight) => (
                  <div key={highlight} className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-cyan-500" />
                    <span className="text-xs font-medium text-foreground">{highlight}</span>
                  </div>
                ))}
              </div>

              {/* Learn more link */}
              <Button
                variant="ghost"
                size="sm"
                className="mt-6 gap-1 p-0 text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300"
              >
                {tFeatures('main.learnMore')}
                <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          ))}
        </div>

        {/* Technical features grid */}
        <div className="mb-20">
          <h3 className="mb-8 text-center text-2xl font-semibold text-foreground">
            {tFeatures('technical.title')}
          </h3>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {technicalFeatures.map((feature) => (
              <div
                key={feature.title}
                className="relative overflow-hidden rounded-xl border border-gray-200 bg-white p-6 transition-all hover:border-cyan-300 hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
              >
                <div className={cn('absolute inset-0 bg-gradient-to-br opacity-50', feature.gradient)} />

                <div className="relative">
                  <div className="mb-4 flex items-center gap-3">
                    <feature.icon className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
                    <h4 className="font-semibold text-foreground">{feature.title}</h4>
                  </div>
                  <p className="mb-3 text-sm text-muted-foreground">{feature.description}</p>
                  <div className="flex items-center gap-1">
                    <Zap className="h-3 w-3 text-cyan-600" />
                    <span className="text-xs font-medium text-cyan-600 dark:text-cyan-400">
                      {feature.metric}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Comparison table */}
        <div className="rounded-2xl border border-cyan-200/30 bg-gradient-to-br from-white to-cyan-50/10 p-8 dark:border-cyan-800/30 dark:from-gray-900 dark:to-cyan-950/10">
          <h3 className="mb-8 text-center text-2xl font-semibold text-foreground">
            {tFeatures('comparison.title')}
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-cyan-200/30 dark:border-cyan-800/30">
                  <th className="pb-4 text-left text-sm font-semibold text-foreground">
                    {tFeatures('comparison.featureColumn')}
                  </th>
                  {COMPARISON_PRODUCTS.map((product) => (
                    <th key={product} className="pb-4 text-center text-sm font-semibold text-muted-foreground">
                      <span className={product === 'openstrand' ? 'text-cyan-600 dark:text-cyan-400' : undefined}>
                        {comparisonProducts[product]}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row) => (
                  <tr key={row.feature} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-3 text-sm text-foreground">{row.feature}</td>
                    {COMPARISON_PRODUCTS.map((product) => {
                      const hasFeature = row[product];
                      return (
                        <td key={product} className="py-3 text-center">
                          {hasFeature ? (
                            <div className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900">
                              <Shield className="h-3 w-3 text-emerald-600 dark:text-emerald-300" />
                            </div>
                          ) : (
                            <span className="text-gray-400">{tFeatures('comparison.notAvailable')}</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* CTA */}
          <div className="mt-8 text-center">
            <p className="mb-4 text-sm text-muted-foreground">{tFeatures('cta.note')}</p>
            <Button className="gap-2 bg-gradient-to-r from-cyan-600 to-teal-600 text-white hover:from-cyan-700 hover:to-teal-700">
              <Sparkles className="h-4 w-4" />
              {tFeatures('cta.button')}
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
