import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'How It Works - OpenStrand | AI-Powered Knowledge Management',
  description: 'Learn how OpenStrand transforms knowledge management with AI visualization, the Spiral Curriculum methodology, and intelligent learning paths. Get started in 15 minutes.',
  keywords: [
    'OpenStrand tutorial',
    'knowledge management',
    'PKM guide',
    'how to use OpenStrand',
    'Spiral Curriculum',
    'Jerome Bruner',
    'AI visualization',
    'learning paths',
    'knowledge graph',
    'spaced repetition',
    'flashcards',
    'data visualization',
  ],
  openGraph: {
    title: 'How OpenStrand Works - AI-Powered Knowledge Management',
    description: 'Transform how you organize, understand, and share knowledge with AI-powered visualization and the proven Spiral Curriculum methodology.',
    type: 'website',
    url: 'https://openstrand.ai/how-it-works',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'How OpenStrand Works',
    description: 'AI-powered knowledge management with Spiral Curriculum learning.',
  },
  alternates: {
    canonical: 'https://openstrand.ai/how-it-works',
  },
};

export default function HowItWorksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

