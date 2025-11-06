'use client';

import { useLocale } from 'next-intl';

import { buildLocalePath } from '@/lib/i18n/paths';

export function useLocalizedPath() {
  const locale = useLocale();

  return (href: string) => buildLocalePath(locale, href);
}

