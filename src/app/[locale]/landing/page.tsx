import type { Metadata } from 'next';

import { HeroSection } from '@/components/landing/hero-section-new';
import { FeaturesSection } from '@/components/landing/features-section-new';
import { InteractiveExamples } from '@/components/landing/interactive-examples';
import { VisualizationShowcase } from '@/components/landing/visualization-showcase';
import { PricingSection } from '@/components/landing/pricing-section';
import { TestimonialsEnhanced } from '@/components/landing/testimonials-enhanced';
import { CTASection } from '@/components/landing/cta-section';
import { UnifiedHeader } from '@/components/navigation/UnifiedHeader';
import { AnimatedBackground } from '@/components/landing/animated-backgrounds';
import { landingStructuredData } from '@/components/seo/structured-data';
import { getRouteMetadata, siteMetadata } from '@/config/seo';
import type { Locale } from '@/i18n/config';

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
          <AnimatedBackground variant="grid" intensity="light" />
          <InteractiveExamples id="examples" />
        </section>

        <section className="relative">
          <AnimatedBackground variant="neural" intensity="light" />
          <FeaturesSection id="features" />
        </section>

        <VisualizationShowcase id="use-cases" />
        <PricingSection id="pricing" />
        <TestimonialsEnhanced id="testimonials" />
        <CTASection id="cta" />
      </main>

      {landingStructuredData.map((schema, index) => (
        <script
          key={`landing-structured-data-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              ...schema,
              url: schema?.url ?? canonicalUrl,
            }),
          }}
        />
      ))}
    </div>
  );
}
