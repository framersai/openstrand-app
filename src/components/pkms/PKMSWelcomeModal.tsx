'use client';

import { useEffect, useMemo, useState } from 'react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { PKMSHero } from '@/components/pkms/PKMSHero';
import { PKMSFeatures } from '@/components/pkms/PKMSFeatures';
import { WeaveShowcase } from '@/components/pkms/WeaveShowcase';
import { StrandExamples } from '@/components/pkms/StrandExamples';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

const STORAGE_KEYS = {
  hasSeen: 'pkms:welcome:hasSeen',
  showAgain: 'pkms:welcome:showAgain',
} as const;

interface PKMSWelcomeModalProps {
  className?: string;
  triggerOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/**
 * Landing-style welcome content shown in a modal on first visit.
 * Users can choose whether to see it again next time (unchecked by default).
 * A small "About PKMS" button elsewhere can reopen this at any time.
 */
export function PKMSWelcomeModal({ className, triggerOpen, onOpenChange }: PKMSWelcomeModalProps) {
  const [open, setOpen] = useState<boolean>(false);
  const [showAgainNextTime, setShowAgainNextTime] = useState<boolean>(false);
  const t = useTranslations('pkms');

  // Decide initial open state based on localStorage. First visit should open once.
  useEffect(() => {
    try {
      const hasSeen = localStorage.getItem(STORAGE_KEYS.hasSeen);
      const showAgain = localStorage.getItem(STORAGE_KEYS.showAgain);
      const shouldShowAgain = showAgain === 'true';
      setShowAgainNextTime(shouldShowAgain);

      if (typeof triggerOpen === 'boolean') {
        setOpen(triggerOpen);
        return;
      }

      if (!hasSeen) {
        // First visit: show modal once, default checkbox unchecked.
        setOpen(true);
        localStorage.setItem(STORAGE_KEYS.hasSeen, 'true');
      } else if (shouldShowAgain) {
        setOpen(true);
      }
    } catch {
      // If storage unavailable, degrade gracefully by opening on first render only.
      if (typeof triggerOpen !== 'boolean') {
        setOpen(true);
      }
    }
  }, [triggerOpen]);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    onOpenChange?.(next);
  };

  const persistPreference = () => {
    try {
      localStorage.setItem(STORAGE_KEYS.showAgain, showAgainNextTime ? 'true' : 'false');
      localStorage.setItem(STORAGE_KEYS.hasSeen, 'true');
    } catch {
      // ignore
    }
  };

  const content = useMemo(() => {
    return (
      <div className="space-y-10">
        <div className="relative overflow-hidden rounded-2xl border border-border/40 bg-gradient-to-b from-background to-primary/5">
          <div className="relative z-10 p-2 sm:p-3">
            <PKMSHero />
          </div>
        </div>
        <PKMSFeatures />
        <WeaveShowcase />
        <StrandExamples />
      </div>
    );
  }, []);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className={cn('max-w-[96vw] sm:max-w-4xl p-0 sm:p-0 ring-1 ring-primary/30 border-primary/30', className)}>
        <div className="h-1 w-full rounded-t-3xl bg-gradient-to-r from-primary/40 via-accent/30 to-transparent" />
        <div className="max-h-[85vh] overflow-y-auto px-6 py-6 sm:px-8 sm:py-8">
          <DialogHeader className="mb-2">
            <DialogTitle className="text-2xl">{t('welcome.title')}</DialogTitle>
            <DialogDescription>
              {t('welcome.description')}
            </DialogDescription>
          </DialogHeader>
          {content}
        </div>
        <DialogFooter className="w-full border-t border-border/60 px-6 py-4 sm:px-8 bg-card/90">
          <div className="flex w-full flex-col items-center justify-between gap-3 sm:flex-row">
            <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
              <Checkbox
                checked={showAgainNextTime}
                onCheckedChange={(checked) => setShowAgainNextTime(Boolean(checked))}
              />
              {t('welcome.showAgain')}
            </label>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  // Persist preference and close
                  persistPreference();
                  setOpen(false);
                }}
              >
                {t('actions.close')}
              </Button>
              <Button
                onClick={() => {
                  setShowAgainNextTime(false);
                  persistPreference();
                  setOpen(false);
                }}
              >
                {t('welcome.gotIt')}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


