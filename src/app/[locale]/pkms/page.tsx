import type { Metadata } from 'next';
import { PKMSHero } from '@/components/pkms/PKMSHero';
import { PKMSFeatures } from '@/components/pkms/PKMSFeatures';
import { WeaveShowcase } from '@/components/pkms/WeaveShowcase';
import { StrandExamples } from '@/components/pkms/StrandExamples';
import { getRouteMetadata, siteMetadata } from '@/config/seo';
import type { Locale } from '@/i18n/config';

type PKMSPageParams = {
  params: {
    locale: Locale;
  };
};

export async function generateMetadata({ params }: PKMSPageParams): Promise<Metadata> {
  const { locale } = params;
  const canonicalUrl = `${siteMetadata.siteUrl}/${locale}/pkms`;

  return {
    title: 'Personal Knowledge Management System | OpenStrand',
    description: 'Build your interconnected knowledge graph with strands, weaves, and AI-enhanced learning paths. Free forever, works offline.',
    keywords: ['pkms', 'personal knowledge management', 'knowledge graph', 'strands', 'weave', 'learning', 'open source'],
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: 'OpenStrand PKMS - Your Knowledge, Interconnected',
      description: 'Build your interconnected knowledge graph with strands, weaves, and AI-enhanced learning paths.',
      url: canonicalUrl,
      siteName: siteMetadata.siteName,
      images: [
        {
          url: `${siteMetadata.siteUrl}/images/pkms-og.png`,
          width: 1200,
          height: 630,
          alt: 'OpenStrand Personal Knowledge Management System',
        },
      ],
      locale,
      type: 'website',
    },
  };
}

export default function PKMSPage({ params }: PKMSPageParams) {
  return (
    <main className="pkms-page min-h-screen relative overflow-hidden">
      {/* Aurora background effect */}
      <div className="aurora-bg absolute inset-0" />
      
      <div className="relative z-10">
        <PKMSHero />
        <PKMSFeatures />
        <WeaveShowcase />
        <StrandExamples />
      </div>
    </main>
  );
}
