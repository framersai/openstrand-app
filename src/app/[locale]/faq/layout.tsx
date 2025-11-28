import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FAQ - OpenStrand | Frequently Asked Questions',
  description: 'Find answers to common questions about OpenStrand\'s AI-powered knowledge management, visualization tiers, Spiral Curriculum learning, pricing, privacy, and integrations.',
  keywords: [
    'OpenStrand FAQ',
    'knowledge management questions',
    'PKM help',
    'visualization tiers',
    'Spiral Curriculum',
    'Jerome Bruner',
    'flashcards',
    'spaced repetition',
    'data privacy',
    'API documentation',
    'Obsidian integration',
    'Notion import',
  ],
  openGraph: {
    title: 'Frequently Asked Questions - OpenStrand',
    description: 'Get answers about OpenStrand\'s features, pricing, privacy, and integrations.',
    type: 'website',
    url: 'https://openstrand.ai/faq',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OpenStrand FAQ',
    description: 'Answers to common questions about AI-powered knowledge management.',
  },
  alternates: {
    canonical: 'https://openstrand.ai/faq',
  },
};

export default function FAQLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

