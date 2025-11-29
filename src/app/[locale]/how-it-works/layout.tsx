import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'How It Works - OpenStrand',
  description: 'Learn how OpenStrand helps you organize knowledge with AI-powered analysis and the Spiral Curriculum methodology.',
  openGraph: {
    title: 'How It Works - OpenStrand',
    description: 'Discover the OpenStrand workflow and learning methodology.',
  },
};

export default function HowItWorksLayout({ children }: { children: ReactNode }) {
  return children;
}

