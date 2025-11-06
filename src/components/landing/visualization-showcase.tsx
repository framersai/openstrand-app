'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Palette, Eye, Accessibility, Sparkles } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface ThemePreview {
  id: string;
  label: string;
  description: string;
  surfaceClass?: string;
  cardClass?: string;
  badgeClass?: string;
}

interface VisualizationShowcaseProps {
  id?: string;
  className?: string;
}

export function VisualizationShowcase({ id, className }: VisualizationShowcaseProps) {
  const t = useTranslations('landing.showcase');
  const [activeTheme, setActiveTheme] = useState('modern-light');

  const themePreviews = useMemo<ThemePreview[]>(
    () => [
      {
        id: 'modern-light',
        label: t('themes.modern.title'),
        description: t('themes.modern.description'),
        surfaceClass: 'gradient-surface',
        cardClass: 'card-glass',
      },
      {
        id: 'classic-light',
        label: t('themes.classic.title'),
        description: t('themes.classic.description'),
        surfaceClass: 'gradient-surface',
        cardClass: 'card-classic',
      },
      {
        id: 'paper-light',
        label: t('themes.paper.title'),
        description: t('themes.paper.description'),
        surfaceClass: 'gradient-surface',
        cardClass: 'theme-preview-card',
      },
      {
        id: 'aurora-light',
        label: t('themes.aurora.title'),
        description: t('themes.aurora.description'),
        surfaceClass: 'aurora-gradient',
        cardClass: 'card-aurora',
      },
      {
        id: 'ocean-light',
        label: t('themes.ocean.title'),
        description: t('themes.ocean.description'),
        surfaceClass: 'wave-surface',
        cardClass: 'card-wave',
        badgeClass: 'badge-crest',
      },
      {
        id: 'forest-light',
        label: t('themes.forest.title'),
        description: t('themes.forest.description'),
        surfaceClass: 'forest-surface',
        cardClass: 'card-canopy',
      },
      {
        id: 'space-light',
        label: t('themes.space.title'),
        description: t('themes.space.description'),
        surfaceClass: 'space-field',
        cardClass: 'card-nebula',
      },
      {
        id: 'cyberpunk-light',
        label: t('themes.cyberpunk.title'),
        description: t('themes.cyberpunk.description'),
        surfaceClass: 'space-field',
        cardClass: 'neon-border',
      },
      {
        id: 'minimal-light',
        label: t('themes.minimal.title'),
        description: t('themes.minimal.description'),
        surfaceClass: 'gradient-surface',
        cardClass: 'theme-preview-card',
      },
    ],
    [t],
  );

  const activePreview = themePreviews.find((theme) => theme.id === activeTheme) ?? themePreviews[0];

  return (
    <section
      id={id}
      className={cn('landing-section visualization-showcase bg-muted/10 py-24', className)}
    >
      <div className="container mx-auto grid gap-12 px-4 lg:grid-cols-[1fr,1.2fr] lg:items-center">
        <div className="space-y-6">
          <span className="text-sm font-semibold uppercase tracking-[0.35em] text-primary/70">
            {t('eyebrow')}
          </span>
          <h2 className="text-balance text-3xl font-bold text-foreground sm:text-4xl">
            {t('title')}
          </h2>
          <p className="text-lg text-muted-foreground">{t('subtitle')}</p>

          <div className="rounded-2xl border border-border/60 bg-background/80 p-6 shadow-md">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="flex items-start gap-3">
                <Palette className="mt-1 h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {t('advantages.design.title')}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t('advantages.design.description')}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Accessibility className="mt-1 h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {t('advantages.accessibility.title')}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t('advantages.accessibility.description')}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Sparkles className="mt-1 h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {t('advantages.ai.title')}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t('advantages.ai.description')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {t('themeSelector.label')}
            </p>
            <div className="flex flex-wrap gap-2">
              {themePreviews.map((theme) => (
                <Button
                  key={theme.id}
                  type="button"
                  size="sm"
                  variant={theme.id === activeTheme ? 'default' : 'secondary'}
                  onClick={() => setActiveTheme(theme.id)}
                >
                  {theme.label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -top-12 right-6 h-32 w-32 rounded-full bg-primary/20 blur-3xl dark:bg-primary/10" />
          <div
            className={cn(
              'relative overflow-hidden rounded-3xl border border-border/60 bg-background/90 shadow-2xl',
              activePreview.surfaceClass ?? 'gradient-surface',
            )}
            data-theme={activeTheme}
          >
            <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between border-b border-border/50 bg-background/90 px-6 py-4 backdrop-blur">
              <div>
                <p className="text-sm font-semibold text-muted-foreground">
                  {t('themePreview.title')}
                </p>
                <p className="text-xs text-muted-foreground/80">
                  {activePreview.description}
                </p>
              </div>
              <Eye className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="relative aspect-[16/10] theme-preview-surface">
              <div className="absolute inset-0 overflow-hidden">
                <div className="h-full w-full overflow-hidden p-8 sm:p-10">
                  <div
                    className={cn(
                      'inline-flex items-center gap-2 rounded-full border border-border/40 bg-background/70 px-3 py-1 text-xs uppercase tracking-[0.3em]',
                      activePreview.badgeClass ?? 'preview-badge',
                    )}
                  >
                    {t('advantages.design.title')}
                  </div>

                  <div
                    className={cn(
                      'theme-preview-card mt-6 rounded-2xl border border-border/40 bg-background/90 p-6 shadow-lg',
                      activePreview.cardClass,
                    )}
                  >
                    <h3 className="text-lg font-semibold text-foreground">
                      {t('themePreview.alt')}
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {t('advantages.ai.description')}
                    </p>
                    <div className="mt-4 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                      <div className="rounded-lg border border-border/40 bg-background/70 p-3">
                        <p className="font-semibold text-foreground">
                          {t('advantages.design.title')}
                        </p>
                        <p>{t('advantages.design.description')}</p>
                      </div>
                      <div className="rounded-lg border border-border/40 bg-background/70 p-3">
                        <p className="font-semibold text-foreground">
                          {t('advantages.accessibility.title')}
                        </p>
                        <p>{t('advantages.accessibility.description')}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
