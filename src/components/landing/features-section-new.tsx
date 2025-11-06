'use client';

import { useMemo } from 'react';
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

const mainFeatures = [
  {
    icon: KnowledgeWeavingIcon,
    title: 'Recursive strand hierarchies',
    description: 'Model multi-scope DAGs with single parents per scope and reusable descendants across programmes.',
    highlights: ['Per-scope single parent', 'Cycle detection', 'Cross-scope reuse'],
    badge: 'Core engine',
    color: 'from-cyan-500 to-teal-500'
  },
  {
    icon: PrivacyShieldIcon,
    title: 'Approval workbench',
    description: 'Queue, review, and resolve structure requests with full audit trails and webhook hooks.',
    highlights: ['Scoped approval queues', 'SLA tracking', 'Webhook + Slack hooks'],
    badge: 'Governance',
    color: 'from-teal-500 to-emerald-500'
  },
  {
    icon: SchemaIntelligenceIcon,
    title: 'AI-assisted modelling',
    description: 'Pipeline intelligence proposes new placements, placeholder copy, and conflict prevention before teams review.',
    highlights: ['Suggested placements', 'Placeholder drafts', 'Conflict avoidance'],
    badge: 'AI-powered',
    color: 'from-emerald-500 to-green-500'
  }
];

const technicalFeatures = [
  {
    icon: TypeScriptMonorepoIcon,
    title: 'End-to-end TypeScript',
    description: 'Shared schema types across Prisma, Fastify, Next.js, and the SDK keep approvals type-safe.',
    metric: 'Zero drift between layers',
    gradient: 'from-blue-500/10 to-indigo-500/10'
  },
  {
    icon: Shield,
    title: 'Smart dedupe overrides',
    description: 'Content hashes block accidental duplicates, while editors can intentionally clone datasets or strands with audit logs.',
    metric: 'Enforce or override per upload',
    gradient: 'from-amber-500/10 to-rose-500/10'
  },
  {
    icon: LocalFirstIcon,
    title: 'Offline-first + cloud ready',
    description: 'PGlite locally, PostgreSQL in production. Cascades and approvals behave identically in both.',
    metric: 'One migration path',
    gradient: 'from-cyan-500/10 to-blue-500/10'
  },
  {
    icon: PrivacyShieldIcon,
    title: 'Placeholder policy engine',
    description: 'Visibility caches compute who sees real content vs placeholders per scope and audience.',
    metric: 'Milliseconds to evaluate',
    gradient: 'from-emerald-500/10 to-teal-500/10'
  },
  {
    icon: KnowledgeWeavingIcon,
    title: 'Structure request APIs',
    description: 'Submit, list, and resolve structure requests from the app, SDK, or automation workflows.',
    metric: 'REST + SDK parity',
    gradient: 'from-teal-500/10 to-cyan-500/10'
  },
  {
    icon: SchemaIntelligenceIcon,
    title: 'AI suggestion pipeline',
    description: 'Heuristics and models propose new parents, replacements, and placeholder copy for review.',
    metric: 'Configurable providers',
    gradient: 'from-emerald-500/10 to-green-500/10'
  },
  {
    icon: CommunityGraphIcon,
    title: 'Audit-ready telemetry',
    description: 'Visibility cascades emit metrics and logs for dashboards, alerts, and compliance exports.',
    metric: 'Prometheus-friendly',
    gradient: 'from-indigo-500/10 to-blue-500/10'
  }
];

const comparisonData = [
  { feature: 'Recursive strands', openstrand: true, notion: false, obsidian: true, tableau: false },
  { feature: 'Structure approvals', openstrand: true, notion: false, obsidian: false, tableau: false },
  { feature: 'Visibility cascades', openstrand: true, notion: false, obsidian: false, tableau: false },
  { feature: 'Placeholder policies', openstrand: true, notion: false, obsidian: false, tableau: false },
  { feature: 'SDK parity', openstrand: true, notion: false, obsidian: false, tableau: false },
  { feature: 'Self-host & offline', openstrand: true, notion: false, obsidian: true, tableau: false },
  { feature: 'Audit trails', openstrand: true, notion: false, obsidian: false, tableau: false },
  { feature: 'AI suggestions', openstrand: true, notion: false, obsidian: false, tableau: false }
];

export function FeaturesSection({ id, className }: FeaturesSectionProps) {
  return (
    <section id={id} className={cn('landing-section py-24', className)}>
      <div className="container mx-auto px-4">
        {/* Section header */}
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <Badge className="mb-4 bg-gradient-to-r from-cyan-500 to-teal-500 text-white">
            <Sparkles className="mr-1 h-3 w-3" />
            Powerful Features
          </Badge>
          <h2 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl">
            Everything You Need to{' '}
            <span className="bg-gradient-to-r from-cyan-500 to-teal-500 bg-clip-text text-transparent">
              Weave Knowledge
            </span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Model recursive strands, approve structural changes with full audit trails, and let visibility cascades keep every scope aligned.
            Built for knowledge teams that need rigor and reuse.
          </p>
        </div>

        {/* Main features grid */}
        <div className="mb-20 grid gap-8 lg:grid-cols-3">
          {mainFeatures.map((feature) => (
            <div
              key={feature.title}
              className="group relative overflow-hidden rounded-2xl border border-cyan-200/30 bg-gradient-to-br from-white to-cyan-50/20 p-8 shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl dark:border-cyan-800/30 dark:from-gray-900 dark:to-cyan-950/20"
            >
              {/* Background gradient */}
              <div className={cn(
                'absolute -right-20 -top-20 h-40 w-40 rounded-full bg-gradient-to-br opacity-20 blur-3xl',
                feature.color
              )} />

              {/* Icon and badge */}
              <div className="relative mb-6 flex items-start justify-between">
                <div className={cn(
                  'flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br shadow-lg',
                  feature.color
                )}>
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
                Learn more
                <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          ))}
        </div>

        {/* Technical features grid */}
        <div className="mb-20">
          <h3 className="mb-8 text-center text-2xl font-semibold text-foreground">
            Built for Scale & Reliability
          </h3>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {technicalFeatures.map((feature) => (
              <div
                key={feature.title}
                className="relative overflow-hidden rounded-xl border border-gray-200 bg-white p-6 transition-all hover:border-cyan-300 hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
              >
                <div className={cn(
                  'absolute inset-0 bg-gradient-to-br opacity-50',
                  feature.gradient
                )} />

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
            How OpenStrand Compares
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-cyan-200/30 dark:border-cyan-800/30">
                  <th className="pb-4 text-left text-sm font-semibold text-foreground">Feature</th>
                  <th className="pb-4 text-center text-sm font-semibold text-cyan-600 dark:text-cyan-400">
                    OpenStrand
                  </th>
                  <th className="pb-4 text-center text-sm font-semibold text-muted-foreground">
                    Notion
                  </th>
                  <th className="pb-4 text-center text-sm font-semibold text-muted-foreground">
                    Obsidian
                  </th>
                  <th className="pb-4 text-center text-sm font-semibold text-muted-foreground">
                    Tableau
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((row) => (
                  <tr key={row.feature} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-3 text-sm text-foreground">{row.feature}</td>
                    <td className="py-3 text-center">
                      {row.openstrand ? (
                        <div className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900">
                          <Shield className="h-3 w-3 text-emerald-600 dark:text-emerald-300" />
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-3 text-center">
                      {row.notion ? (
                        <div className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900">
                          <Shield className="h-3 w-3 text-emerald-600 dark:text-emerald-300" />
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-3 text-center">
                      {row.obsidian ? (
                        <div className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900">
                          <Shield className="h-3 w-3 text-emerald-600 dark:text-emerald-300" />
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-3 text-center">
                      {row.tableau ? (
                        <div className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900">
                          <Shield className="h-3 w-3 text-emerald-600 dark:text-emerald-300" />
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* CTA */}
          <div className="mt-8 text-center">
            <p className="mb-4 text-sm text-muted-foreground">
              Community Edition • Free Forever • No Credit Card • Works Offline
            </p>
            <Button className="gap-2 bg-gradient-to-r from-cyan-600 to-teal-600 text-white hover:from-cyan-700 hover:to-teal-700">
              <Sparkles className="h-4 w-4" />
              Download Free Forever
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
