import { NextRequest, NextResponse } from 'next/server';
import { match as matchLocale } from '@formatjs/intl-localematcher';
import Negotiator from 'negotiator';
import { locales, defaultLocale } from '@/i18n/config';

function getLocale(request: NextRequest): string {
  // Check if locale is in cookie
  const cookieLocale = request.cookies.get('locale')?.value;
  if (cookieLocale && locales.includes(cookieLocale as any)) {
    return cookieLocale;
  }

  // Get locale from Accept-Language header
  const negotiatorHeaders: Record<string, string> = {};
  request.headers.forEach((value, key) => (negotiatorHeaders[key] = value));

  const languages = new Negotiator({ headers: negotiatorHeaders }).languages();

  try {
    return matchLocale(languages, locales as any, defaultLocale);
  } catch {
    return defaultLocale;
  }
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Skip middleware for static files and api routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') // Has file extension
  ) {
    return;
  }

  // Check if there is any supported locale in the pathname
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameHasLocale) {
    // Extract locale from pathname
    const locale = pathname.split('/')[1];

    // Set locale cookie if different
    const response = NextResponse.next();
    if (request.cookies.get('locale')?.value !== locale) {
      response.cookies.set('locale', locale, {
        maxAge: 365 * 24 * 60 * 60, // 1 year
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      });
    }

    return response;
  }

  // Redirect if no locale
  const locale = getLocale(request);
  const newUrl = new URL(`/${locale}${pathname}`, request.url);

  const response = NextResponse.redirect(newUrl);
  response.cookies.set('locale', locale, {
    maxAge: 365 * 24 * 60 * 60, // 1 year
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });

  return response;
}

export const config = {
  matcher: [
    // Skip all internal paths (_next, api, static)
    '/((?!_next|api|static|.*\\..*|favicon.ico).*)',
  ],
};