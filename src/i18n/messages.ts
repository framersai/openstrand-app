import type { Locale } from './config';
import { defaultLocale } from './config';

type Messages = Record<string, Record<string, unknown>>;

const namespaces = [
  'common',
  'datasets',
  'visualizations',
  'settings',
  'auth',
  'billing',
  'errors',
  'landing',
  'footer',
  'tutorials',
] as const;

type Namespace = (typeof namespaces)[number];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function deepMerge(
  base: Record<string, unknown>,
  override: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = { ...base };
  Object.entries(override).forEach(([key, value]) => {
    if (isRecord(value) && isRecord(result[key])) {
      result[key] = deepMerge(result[key] as Record<string, unknown>, value);
    } else {
      result[key] = value;
    }
  });
  return result;
}

async function importNamespace(locale: Locale, namespace: Namespace) {
  switch (namespace) {
    case 'common':
      return (await import(`@/i18n/locales/${locale}/common.json`)).default;
    case 'datasets':
      return (await import(`@/i18n/locales/${locale}/datasets.json`)).default;
    case 'visualizations':
      return (await import(`@/i18n/locales/${locale}/visualizations.json`)).default;
    case 'settings':
      return (await import(`@/i18n/locales/${locale}/settings.json`)).default;
    case 'auth':
      return (await import(`@/i18n/locales/${locale}/auth.json`)).default;
    case 'billing':
      return (await import(`@/i18n/locales/${locale}/billing.json`)).default;
    case 'errors':
      return (await import(`@/i18n/locales/${locale}/errors.json`)).default;
    case 'landing':
      return (await import(`@/i18n/locales/${locale}/landing.json`)).default;
    case 'footer':
      return (await import(`@/i18n/locales/${locale}/footer.json`)).default;
    case 'tutorials':
      return (await import(`@/i18n/locales/${locale}/tutorials.json`)).default;
    default:
      return {};
  }
}

async function loadNamespace(locale: Locale, namespace: Namespace) {
  const fallback = await importNamespace(defaultLocale, namespace).catch(() => ({}));

  if (locale === defaultLocale) {
    return fallback;
  }

  try {
    const localized = await importNamespace(locale, namespace);
    if (isRecord(fallback) && isRecord(localized)) {
      return deepMerge(fallback, localized);
    }
    return localized;
  } catch {
    return fallback;
  }
}

export async function getMessages(locale: Locale): Promise<Messages> {
  const entries = await Promise.all(
    namespaces.map(async (namespace) => {
      const messages = await loadNamespace(locale, namespace);
      return [namespace, messages] as const;
    }),
  );

  return Object.fromEntries(entries);
}
