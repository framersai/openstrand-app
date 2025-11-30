import type { Metadata } from 'next';
import { getRouteMetadata, siteMetadata } from '@/config/seo';
import type { Locale } from '@/i18n/config';

export { default } from '@/features/dashboard/page/DashboardPage';

type DashboardPageParams = {
  params: {
    locale: Locale;
  };
};

const FALLBACK_METADATA = {
  title: 'Dashboard | OpenStrand',
  description: 'Create AI-powered data visualizations with natural language prompts.',
  keywords: ['dashboard', 'data visualization', 'AI', 'charts', 'analytics'],
  path: '/dashboard',
};

export async function generateMetadata({ params }: DashboardPageParams): Promise<Metadata> {
  const { locale } = params;
  const routeMetadata = getRouteMetadata('/dashboard') ?? FALLBACK_METADATA;
  const canonicalUrl = `${siteMetadata.siteUrl}/${locale}/dashboard`;
  const keywords = Array.isArray(routeMetadata.keywords)
    ? routeMetadata.keywords
    : (routeMetadata.keywords ?? []);

  return {
    title: routeMetadata.title,
    description: routeMetadata.description,
    keywords,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: routeMetadata.title,
      description: routeMetadata.description,
      url: canonicalUrl,
      siteName: siteMetadata.siteName,
      type: 'website',
    },
  };
}

