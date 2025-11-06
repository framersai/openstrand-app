'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Mail, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAppMode } from '@/hooks/useAppMode';

const EMAILOCTOPUS_FORM_URL = process.env.NEXT_PUBLIC_EMAILOCTOPUS_FORM_URL;

export function Newsletter() {
  const t = useTranslations('footer.newsletter');
  const tFooter = useTranslations('footer');
  const { mode } = useAppMode();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  const isOffline = mode === 'offline';
  const formAvailable = Boolean(EMAILOCTOPUS_FORM_URL);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formAvailable || isOffline) {
      setStatus('error');
      return;
    }
    try {
      setStatus('submitting');
      const form = event.currentTarget;
      const formData = new FormData(form);
      const response = await fetch(EMAILOCTOPUS_FORM_URL as string, {
        method: 'POST',
        body: formData,
        headers: {
          Accept: 'application/json',
        },
      });

      if (response.ok) {
        setStatus('success');
        setEmail('');
        form.reset();
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="container mx-auto flex flex-col items-center gap-4 px-4 py-12 text-center sm:flex-row sm:items-end sm:justify-between sm:text-left">
      <div className="max-w-2xl space-y-2">
        <h3 className="text-2xl font-semibold text-foreground">
          {t('title')}
        </h3>
        <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
      </div>
      <div className="w-full max-w-lg">
        {isOffline ? (
          <div className="rounded-xl border border-amber-500/40 bg-amber-100/40 px-4 py-3 text-sm text-amber-800 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-200">
            {t('offlineMessage')}
          </div>
        ) : !formAvailable ? (
          <div className="rounded-xl border border-border/60 bg-background px-4 py-3 text-sm text-muted-foreground">
            {t('pendingIntegration')}
          </div>
        ) : (
          <form
            className="flex flex-col gap-3 sm:flex-row"
            method="post"
            onSubmit={handleSubmit}
          >
            <Input
              type="email"
              name="email"
              required
              autoComplete="email"
              placeholder={t('emailPlaceholder')}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-11 flex-1"
              aria-label={t('emailPlaceholder')}
              disabled={status === 'submitting'}
            />
            <Button
              type="submit"
              className="h-11 min-w-[120px]"
              disabled={status === 'submitting'}
            >
              {status === 'submitting' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('submit')}
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  {t('submit')}
                </>
              )}
            </Button>
          </form>
        )}

        {status === 'success' ? (
          <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-300">{t('success')}</p>
        ) : null}
        {status === 'error' && formAvailable && !isOffline ? (
          <p className="mt-2 text-xs text-red-500">{t('error')}</p>
        ) : null}
        <p className="mt-2 text-xs text-muted-foreground">
          {tFooter('newsletterDisclaimer')}
        </p>
      </div>
    </div>
  );
}
