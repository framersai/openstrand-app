import type { Metadata } from 'next';
import { HowItWorksContent } from '@/components/pages/how-it-works-content';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'How It Works - OpenStrand',
  description: 'Learn how OpenStrand helps you organize knowledge with AI-powered analysis and the Spiral Curriculum methodology.',
};

export default function HowItWorksPage() {
  return <HowItWorksContent />;
}
