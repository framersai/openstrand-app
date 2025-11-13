'use client';

import { useMemo } from 'react';
import {
  Activity,
  Globe,
  Lock,
  Cpu,
  Layers,
  Workflow,
  Bot,
  FileSpreadsheet,
  Code2,
  FolderPlus,
  HardDrive,
} from 'lucide-react';
import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import { useAppMode } from '@/hooks/useAppMode';

interface FeaturesSectionProps {
  id?: string;
  className?: string;
}

export function FeaturesSection({ id, className }: FeaturesSectionProps) {
  const t = useTranslations('landing.features');
  const { mode } = useAppMode();

  const features = useMemo(
    () => [
      {
        icon: HardDrive,
        title: 'Backup & Sync',
        description:
          'Mirror notes and assets to your filesystem with optional Git version control. Works offline and plays nicely with AI/CLI tools. Teams can enforce policy or use S3-compatible cloud.',
        badge: 'core',
      },
      {
        icon: Code2,
        title: 'Runnable Snippets',
        description:
          'Author and run TypeScript/JavaScript and Python snippets inline. Copy with one click and enjoy rich syntax highlighting for dozens of languages. Works offline in web, Electron, and mobile.',
        badge: 'core',
      },
      {
        icon: FolderPlus,
        title: 'Drag & Drop Folders → Strands',
        description:
          'Import any folder or repository and auto-map files into strands with metadata, language detection, and directory hierarchy preserved. Build knowledge from your codebases instantly.',
        badge: 'core',
      },
      {
        icon: FileSpreadsheet,
        title: 'Export & Import',
        description:
          'Export strands to Markdown, HTML, PDF, DOCX, JSON, CSV (datasets), or an Obsidian-ready vault (ZIP). Import repos via URL (PAT for private), zips, and Obsidian vaults.',
        badge: 'core',
      },
      {
        icon: Activity,
        title: t('items.analytics.title'),
        description: t('items.analytics.description'),
        badge: 'pro',
      },
      {
        icon: FileSpreadsheet,
        title: t('items.importers.title'),
        description: t('items.importers.description'),
        badge: 'core',
      },
      {
        icon: Cpu,
        title: t('items.pipeline.title'),
        description: t('items.pipeline.description'),
        badge: 'core',
      },
      {
        icon: Layers,
        title: t('items.tiers.title'),
        description: t('items.tiers.description'),
        badge: 'pro',
      },
      {
        icon: Workflow,
        title: t('items.spiral.title'),
        description: t('items.spiral.description'),
        badge: 'labs',
      },
      {
        icon: Globe,
        title: t('items.multilingual.title'),
        description: t('items.multilingual.description'),
        badge: 'core',
      },
      {
        icon: Lock,
        title: t('items.privacy.title'),
        description: t('items.privacy.description'),
        badge: 'core',
      },
      {
        icon: Bot,
        title: t('items.manualTools.title'),
        description:
          mode === 'offline'
            ? t('items.manualTools.descriptionOffline')
            : t('items.manualTools.description'),
        badge: mode === 'offline' ? 'offline' : 'core',
      },
    ],
    [mode, t],
  );

  const badgeClassName = (badge: string) =>
    cn(
      'inline-flex h-6 items-center rounded-full px-3 text-xs font-semibold uppercase tracking-wide',
      {
        'bg-primary/10 text-primary': badge === 'core',
        'bg-secondary/10 text-secondary-foreground': badge === 'pro',
        'bg-amber-100/80 text-amber-700 dark:bg-amber-500/10 dark:text-amber-200': badge === 'labs',
        'bg-emerald-100/90 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200':
          badge === 'offline',
      },
    );

  return (
    <section id={id} className={cn('landing-section features-section', className)}>
      <div className="container mx-auto px-4 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <span className="text-sm font-semibold uppercase tracking-[0.35em] text-primary/70">
            {t('eyebrow')}
          </span>
          <h2 className="mt-4 text-balance text-3xl font-bold text-foreground sm:text-4xl">
            {t('title')}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">{t('subtitle')}</p>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {features.map(({ icon: Icon, title, description, badge }) => (
            <div
              key={title}
              className="relative overflow-hidden rounded-2xl border border-border/60 bg-background/80 p-6 shadow-sm transition hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg"
            >
              <div className="absolute inset-0 aurora-gradient opacity-20" />
              <div className="relative flex h-full flex-col gap-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-primary/10 p-3 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">{title}</h3>
                  </div>
                  <span className={badgeClassName(badge)}>{t(`badges.${badge}`)}</span>
                </div>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
