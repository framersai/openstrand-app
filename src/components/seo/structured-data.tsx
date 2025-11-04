export const organizationStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Frame.dev',
  alternateName: 'Manic Agency LLC',
  url: 'https://frame.dev',
  logo: 'https://frame.dev/logo.png',
  description:
    'Frame.dev (Manic Agency LLC) builds privacy-first knowledge tools including OpenStrand, the AI-enhanced personal knowledge management platform.',
  foundingDate: '2020',
  address: {
    '@type': 'PostalAddress',
    addressCountry: 'US',
  },
  contactPoint: [
    {
      '@type': 'ContactPoint',
      telephone: '+1-415-555-0137',
      contactType: 'customer service',
      email: 'support@frame.dev',
      areaServed: 'Worldwide',
      availableLanguage: [
        'English',
        'Chinese',
        'Spanish',
        'Hindi',
        'Arabic',
        'Japanese',
        'Korean',
        'Portuguese',
        'Russian',
        'French',
      ],
    },
  ],
  sameAs: [
    'https://twitter.com/framersai',
    'https://github.com/framersai/openstrand',
    'https://linkedin.com/company/framersai',
    'https://openstrand.ai',
  ],
} as const;

export const softwareStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'OpenStrand',
  alternativeName: 'OpenStrand Studio',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web, iOS, Android, Windows, macOS, Linux',
  publisher: {
    '@type': 'Organization',
    name: 'Frame.dev',
    url: 'https://frame.dev',
  },
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
    description: 'Free tier available with premium options',
  },
  featureList: [
    'AI-powered data visualization',
    'Multi-format content ingestion',
    'Three-tier visualization system',
    'Offline-first architecture',
    '10+ language support',
    'Custom AI Artisan visualizations',
  ],
  screenshot: 'https://openstrand.ai/screenshots/main.png',
  softwareVersion: '1.0.0',
  provider: {
    '@type': 'Organization',
    name: 'Frame.dev',
    url: 'https://frame.dev',
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    reviewCount: '127',
  },
} as const;

export const faqStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is OpenStrand?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'OpenStrand is an AI-enhanced Personal Knowledge Management System (PKMS) that transforms your data into interactive visual stories with guided AI storytelling.',
      },
    },
    {
      '@type': 'Question',
      name: 'What file formats does OpenStrand support?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'OpenStrand supports CSV, JSON, Markdown, PDFs, images, and various other data formats for comprehensive knowledge management.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is OpenStrand available offline?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, OpenStrand features an offline-first architecture with local SQLite storage and optional cloud sync capabilities.',
      },
    },
  ],
} as const;

export const landingStructuredData = [
  organizationStructuredData,
  softwareStructuredData,
  faqStructuredData,
] as const;

export function StructuredData() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@graph': landingStructuredData,
        }),
      }}
    />
  );
}
