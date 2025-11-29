import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'FAQ - OpenStrand',
  description: 'Frequently asked questions about OpenStrand, our features, pricing, data privacy, and more.',
  openGraph: {
    title: 'FAQ - OpenStrand',
    description: 'Find answers to common questions about OpenStrand.',
  },
};

export default function FAQLayout({ children }: { children: ReactNode }) {
  return children;
}

