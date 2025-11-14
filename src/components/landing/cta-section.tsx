'use client';

import { useTranslations } from 'next-intl';
import { Sparkles, Send, FileText, WifiOff } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useAppMode } from '@/hooks/useAppMode';
import { cn } from '@/lib/utils';

interface CTASectionProps {
  id?: string;
  className?: string;
}

export function CTASection({ id, className }: CTASectionProps) {
  const t = useTranslations('landing.cta');
  const { mode } = useAppMode();

  return (
    <section id={id} className={cn('landing-section cta-section', className)}>
      <div className="container mx-auto px-4 pb-24">
        <div className="relative overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/10 p-12 text-center shadow-xl">
          <div className="absolute -left-24 -top-24 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute -bottom-16 right-12 hidden h-48 w-48 rounded-full bg-secondary/20 blur-3xl lg:block" />

          <div className="relative mx-auto max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-background/80 px-4 py-2 text-sm font-semibold text-primary shadow-sm">
              <Sparkles className="h-4 w-4" />
              {t('tagline')}
            </div>
            <h2 className="text-balance text-3xl font-bold text-foreground sm:text-4xl">
              {t('title')}
            </h2>
            <p className="text-lg text-muted-foreground">{t('subtitle')}</p>

            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" className="btn-gradient-border gap-2" asChild>
                <a href={t('primaryCta.href')}>
                  <span className="inline-flex items-center gap-2">
                    <Send className="h-5 w-5" />
                    {t('primaryCta.label')}
                  </span>
                </a>
              </Button>
              <Button size="lg" variant="secondary" className="gap-2" asChild>
                <a href={t('secondaryCta.href')}>
                  <span className="inline-flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {t('secondaryCta.label')}
                  </span>
                </a>
              </Button>
            </div>

            {mode === 'offline' && (
              <div className="inline-flex items-center gap-3 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-200">
                <WifiOff className="h-4 w-4" />
                {t('offlineBadge')}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
