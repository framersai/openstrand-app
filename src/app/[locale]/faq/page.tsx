import type { Metadata } from 'next';
import { FAQPageContent } from '@/components/pages/faq-content';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'FAQ - OpenStrand',
  description: 'Frequently asked questions about OpenStrand, our features, pricing, data privacy, and more.',
};

export default function FAQPage() {
  return <FAQPageContent />;
}
