import type { Metadata } from 'next';
import { PKMSDashboard } from '@/components/pkms/PKMSDashboard';
import { getRouteMetadata, siteMetadata } from '@/config/seo';
import type { Locale } from '@/i18n/config';

type PKMSPageParams = {
  params: {
    locale: Locale;
  };
};

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: PKMSPageParams): Promise<Metadata> {
  const { locale } = params;
  const canonicalUrl = `${siteMetadata.siteUrl}/${locale}/pkms`;

  return {
    title: 'PKMS Dashboard | OpenStrand',
    description: 'Create, import, and organise strands. Build your knowledge weave with templates and a WYSIWYG composer.',
    keywords: ['pkms', 'personal knowledge management', 'knowledge graph', 'strands', 'weave', 'learning', 'open source'],
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: 'OpenStrand PKMS • Dashboard',
      description: 'Create, import, and organise strands with templates and a WYSIWYG composer.',
      url: canonicalUrl,
      siteName: siteMetadata.siteName,
      images: [
        {
          url: `${siteMetadata.siteUrl}/images/pkms-og.png`,
          width: 1200,
          height: 630,
          alt: 'OpenStrand PKMS Dashboard',
        },
      ],
      locale,
      type: 'website',
    },
  };
}

export default function PKMSPage({ params }: PKMSPageParams) {
  return (
    <main className="min-h-screen">
      <PKMSDashboard />
    </main>
  );
}
