'use client';

import { useMemo } from 'react';
import { ShieldCheck, XCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { useAppMode } from '@/hooks/useAppMode';
import { useGdprConsent } from '@/hooks/useGdprConsent';
import { useOpenStrandStore } from '@/store/openstrand.store';
import { cn } from '@/lib/utils';

interface GDPRConsentBannerProps {
  className?: string;
}

export function GDPRConsentBanner({ className }: GDPRConsentBannerProps) {
  const t = useTranslations('common.gdpr');
  const { mode } = useAppMode();
  const capabilities = useOpenStrandStore((state) => state.capabilities);
  const gdprEnabled = capabilities?.compliance?.gdpr ?? false;

  const { consentStatus, isLoaded, grantConsent, denyConsent } = useGdprConsent(
    gdprEnabled && mode !== 'offline',
  );

  const shouldRender = useMemo(
    () => isLoaded && gdprEnabled && mode !== 'offline' && consentStatus === 'unknown',
    [consentStatus, gdprEnabled, isLoaded, mode],
  );

  if (!shouldRender) {
    return null;
  }

  return (
    <div
      className={cn(
        'safe-area-padding fixed inset-x-4 bottom-4 z-[1000] max-w-3xl rounded-2xl border border-border/70 bg-background/95 p-6 shadow-xl backdrop-blur',
        className,
      )}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3 text-left">
          <div className="rounded-full bg-primary/10 p-2 text-primary">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{t('title')}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t('description')}</p>
            <a
              href="/privacy"
              className="mt-2 inline-flex text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              {t('privacyLink')}
            </a>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button variant="secondary" onClick={denyConsent} className="gap-2" size="sm">
            <XCircle className="h-4 w-4" />
            {t('decline')}
          </Button>
          <Button onClick={grantConsent} className="gap-2" size="sm">
            {t('accept')}
          </Button>
        </div>
      </div>
    </div>
  );
}
