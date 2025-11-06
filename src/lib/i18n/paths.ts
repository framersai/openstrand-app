import { locales } from '@/i18n/config';

const EXTERNAL_PREFIXES = ['http://', 'https://', 'mailto:', 'tel:', 'sms:', 'data:', '//'];

function splitHref(href: string) {
  const hashIndex = href.indexOf('#');
  const hash = hashIndex >= 0 ? href.slice(hashIndex) : '';
  const base = hashIndex >= 0 ? href.slice(0, hashIndex) : href;

  const queryIndex = base.indexOf('?');
  const query = queryIndex >= 0 ? base.slice(queryIndex) : '';
  const pathname = queryIndex >= 0 ? base.slice(0, queryIndex) : base;

  return { pathname, query, hash };
}

function stripKnownLocale(pathname: string) {
  if (!pathname) {
    return '';
  }

  let normalized = pathname.startsWith('/') ? pathname : `/${pathname}`;

  for (const candidate of locales) {
    if (normalized === `/${candidate}`) {
      return '';
    }

    if (normalized.startsWith(`/${candidate}/`)) {
      normalized = normalized.slice(candidate.length + 1);
      return normalized.startsWith('/') ? normalized : `/${normalized}`;
    }
  }

  return normalized;
}

export function isExternalHref(href: string) {
  return EXTERNAL_PREFIXES.some((prefix) => href.startsWith(prefix));
}

export function buildLocalePath(locale: string, href: string) {
  if (!href || href === '/') {
    return `/${locale}`;
  }

  if (isExternalHref(href) || href.startsWith('#')) {
    return href;
  }

  if (href.startsWith('/api') || href.startsWith('/_next') || href.startsWith('/static')) {
    return href;
  }

  const { pathname, query, hash } = splitHref(href);
  let normalizedPath = stripKnownLocale(pathname || '');

  if (normalizedPath === '' || normalizedPath === '/') {
    normalizedPath = '';
  }

  const basePath = normalizedPath ? `/${locale}${normalizedPath}` : `/${locale}`;

  return `${basePath}${query}${hash}`;
}

export function replaceLocaleInPathname(pathname: string, nextLocale: string) {
  if (!pathname || pathname === '/') {
    return `/${nextLocale}`;
  }

  let rest = stripKnownLocale(pathname);
  if (rest === '/' || rest === '') {
    rest = '';
  }

  return rest ? `/${nextLocale}${rest}` : `/${nextLocale}`;
}

