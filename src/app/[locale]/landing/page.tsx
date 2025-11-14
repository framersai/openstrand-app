import type { Metadata } from 'next';

import dynamic from 'next/dynamic';
import { HeroSection } from '@/components/landing/hero-section-new';
import { AnimatedBackground } from '@/components/landing/animated-backgrounds';
import { UnifiedHeader } from '@/components/navigation/UnifiedHeader';
import { landingStructuredData } from '@/components/seo/structured-data';
import { getRouteMetadata, siteMetadata } from '@/config/seo';
import type { Locale } from '@/i18n/config';
import { LazyOnViewport } from '@/components/utility/LazyOnViewport';

// Defer heavy client components until they are near viewport to reduce TBT
const FeaturesSection = dynamic(
  () => import('@/components/landing/features-section-new').then((m) => m.FeaturesSection),
  { ssr: false },
);
const InteractiveExamples = dynamic(
  () => import('@/components/landing/interactive-examples').then((m) => m.InteractiveExamples),
  { ssr: false, loading: () => <div className="container mx-auto h-40 sm:h-56" /> },
);
const VisualizationShowcase = dynamic(
  () => import('@/components/landing/visualization-showcase').then((m) => m.VisualizationShowcase),
  { ssr: false },
);
const PricingSection = dynamic(
  () => import('@/components/landing/pricing-section').then((m) => m.PricingSection),
  { ssr: false },
);
const TestimonialsEnhanced = dynamic(
  () => import('@/components/landing/testimonials-enhanced').then((m) => m.TestimonialsEnhanced),
  { ssr: false },
);
const CTASection = dynamic(
  () => import('@/components/landing/cta-section').then((m) => m.CTASection),
  { ssr: false },
);

type LandingPageParams = {
  params: {
    locale: Locale;
  };
};

const FALLBACK_METADATA = {
  title: 'OpenStrand',
  description:
    'OpenStrand helps teams explore and connect knowledge with guided AI visual storytelling.',
  keywords: [] as string[],
  path: '/landing',
};

export async function generateMetadata(
  { params }: LandingPageParams,
): Promise<Metadata> {
  const { locale } = params;
  const routeMetadata = getRouteMetadata('/landing') ?? FALLBACK_METADATA;
  const canonicalUrl = `${siteMetadata.siteUrl}/${locale}/landing`;
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
      images: [
        {
          url: `${siteMetadata.siteUrl}${siteMetadata.defaultImage}`,
        },
      ],
      locale,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: routeMetadata.title,
      description: routeMetadata.description,
      creator: siteMetadata.defaultTwitterHandle,
      images: [`${siteMetadata.siteUrl}${siteMetadata.defaultImage}`],
    },
  };
}

export default function LandingPage({ params }: LandingPageParams) {
  const { locale } = params;
  const canonicalUrl = `${siteMetadata.siteUrl}/${locale}/landing`;

  return (
    <div className="landing-page flex min-h-screen flex-col relative ocean-pattern">
      {/* Global animated background */}
      <AnimatedBackground variant="particles" intensity="light" />

      <UnifiedHeader />
      <main className="flex-1 relative z-10">
        <section className="relative">
          <AnimatedBackground variant="ocean" intensity="medium" />
          <HeroSection id="overview" />
        </section>

        <section className="relative">
          <LazyOnViewport rootMargin="300px">
            <AnimatedBackground variant="grid" intensity="light" />
            <InteractiveExamples id="examples" />
          </LazyOnViewport>
        </section>

        <section className="relative">
          <LazyOnViewport rootMargin="300px">
            <AnimatedBackground variant="neural" intensity="light" />
            <FeaturesSection id="features" />
          </LazyOnViewport>
        </section>

        <LazyOnViewport rootMargin="300px">
          <VisualizationShowcase id="use-cases" />
        </LazyOnViewport>
        <LazyOnViewport rootMargin="300px">
          <PricingSection id="pricing" />
        </LazyOnViewport>
        <LazyOnViewport rootMargin="300px">
          <TestimonialsEnhanced id="testimonials" />
        </LazyOnViewport>
        <LazyOnViewport rootMargin="300px">
          <CTASection id="cta" />
        </LazyOnViewport>
      </main>

      {landingStructuredData.map((schema, index) => (
        <script
          key={`landing-structured-data-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(Object.assign({}, schema as Record<string, unknown>, { url: canonicalUrl })),
          }}
        />
      ))}
    </div>
  );
}
