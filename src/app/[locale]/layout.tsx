import type { ReactNode } from 'react';
import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';

import { SiteFooter } from '@/components/site-footer';
import { ThemeProvider } from '@/components/theme-provider';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AnalyticsManager } from '@/components/analytics/analytics-manager';
import { GDPRConsentBanner } from '@/components/privacy/gdpr-consent-banner';
import { SupabaseProvider } from '@/features/auth';
import { PluginRuntimeProvider } from '@/components/plugins';
import { ScrollToTop } from '@/components/landing/scroll-to-top';
import { QuantumJournalFABWrapper } from '@/components/journal/QuantumJournalFABWrapper';
import { AssistantModalWrapper } from '@/components/assistant/AssistantModalWrapper';
import {
  getLocaleDirection,
  getLocaleFont,
  localeSEO,
  locales,
  type Locale,
} from '@/i18n/config';
import { siteMetadata } from '@/config/seo';
import { getMessages } from '@/i18n/messages';

import '../globals.scss';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
};

type LayoutParams = { locale: Locale };

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata(
  { params }: { params: LayoutParams },
): Promise<Metadata> {
  const locale = params.locale;
  const seo = localeSEO[locale] ?? localeSEO.en;

  return {
    metadataBase: new URL(siteMetadata.siteUrl),
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords,
    icons: {
      icon: [
        { url: '/favicons/favicon-32x32.png', type: 'image/png', sizes: '32x32' },
        { url: '/favicons/favicon-16x16.png', type: 'image/png', sizes: '16x16' },
        { url: '/favicon.ico' },
      ],
      apple: [{ url: '/favicons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
    },
    openGraph: {
      title: seo.title,
      description: seo.description,
      url: `${siteMetadata.siteUrl}/${locale}`,
      siteName: siteMetadata.siteName,
      images: [`${siteMetadata.siteUrl}/images/og-default.png`],
      locale,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: seo.title,
      description: seo.description,
      creator: siteMetadata.defaultTwitterHandle,
      images: [`${siteMetadata.siteUrl}/images/og-default.png`],
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: LayoutParams;
}) {
  const { locale } = params;

  if (!locales.includes(locale)) {
    notFound();
  }

  const messages = await getMessages(locale);
  const direction = getLocaleDirection(locale);
  const fontStack = getLocaleFont(locale);

  return (
    <html lang={locale} dir={direction} suppressHydrationWarning>
      <body
        className={`${inter.variable} font-sans antialiased`}
        style={{ fontFamily: fontStack }}
      >
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <SupabaseProvider>
              <PluginRuntimeProvider>
                <TooltipProvider delayDuration={200}>
                  <div className="flex min-h-screen flex-col">
                    <main className="flex-1">{children}</main>
                    <SiteFooter />
                  </div>
                </TooltipProvider>
                <ScrollToTop />
                <QuantumJournalFABWrapper />
                <AssistantModalWrapper />
                <Toaster
                  position="bottom-right"
                  toastOptions={{
                    duration: 4000,
                    style: {
                      background: 'var(--background)',
                      color: 'var(--foreground)',
                      border: '1px solid var(--border)',
                    },
                    success: {
                      iconTheme: {
                        primary: '#10b981',
                        secondary: '#ffffff',
                      },
                    },
                    error: {
                      iconTheme: {
                        primary: '#ef4444',
                        secondary: '#ffffff',
                      },
                    },
                  }}
                />
                <GDPRConsentBanner />
                <AnalyticsManager />
              </PluginRuntimeProvider>
            </SupabaseProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
