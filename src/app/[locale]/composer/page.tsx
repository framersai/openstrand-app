import type { Metadata } from 'next';

import { UnifiedHeader } from '@/components/navigation/UnifiedHeader';
import { getRouteMetadata, siteMetadata } from '@/config/seo';
import type { Locale } from '@/i18n/config';
import { StrandComposer } from '@/features/composer';

type ComposerPageParams = {
  params: {
    locale: Locale;
  };
};

type ComposerPageProps = ComposerPageParams & {
  searchParams?: Record<string, string | string[] | undefined>;
};

const FALLBACK_METADATA = {
  title: 'Strand Composer',
  description: 'Capture strands with rich text, voice notes, images, and videos — all synchronized across the OpenStrand knowledge graph.',
  keywords: ['voice notes', 'recorder', 'knowledge base'],
  path: '/composer',
};

export async function generateMetadata({ params }: ComposerPageParams): Promise<Metadata> {
  const { locale } = params;
  const routeMetadata = getRouteMetadata('/composer') ?? FALLBACK_METADATA;
  const canonicalUrl = `${siteMetadata.siteUrl}/${locale}/composer`;

  return {
    title: routeMetadata.title,
    description: routeMetadata.description,
    keywords: Array.isArray(routeMetadata.keywords) ? routeMetadata.keywords : (routeMetadata.keywords ?? []),
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: routeMetadata.title,
      description: routeMetadata.description,
      url: canonicalUrl,
      siteName: siteMetadata.siteName,
      images: [{ url: `${siteMetadata.siteUrl}${siteMetadata.defaultImage}` }],
      locale,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: routeMetadata.title,
      description: routeMetadata.description,
      images: [`${siteMetadata.siteUrl}${siteMetadata.defaultImage}`],
    },
  };
}

export default function ComposerPage({ searchParams }: ComposerPageProps) {
  const strandId =
    typeof searchParams?.strandId === 'string' ? searchParams.strandId : undefined;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <UnifiedHeader />
      <main className="container mx-auto max-w-5xl px-6 py-16">
        <div className="mb-8 space-y-3 text-center">
          <h1 className="text-3xl font-semibold tracking-tight">Capture strands with voice, visuals, and rich context</h1>
          <p className="text-sm text-muted-foreground">
            Use the floating push-to-talk interface to drop voice notes beside the editor, or upload annotated media with AI summaries.
          </p>
        </div>

        <StrandComposer strandId={strandId} />
      </main>
    </div>
  );
}
