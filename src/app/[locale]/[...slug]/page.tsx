'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { AlertCircle } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useLocalizedPath } from '@/hooks/useLocalizedPath';
import { UnifiedHeader } from '@/components/navigation/UnifiedHeader';
import { SiteFooter } from '@/components/site-footer';

export default function CatchAllPage({ params }: { params: { locale: string; slug: string[] } }) {
  const t = useTranslations('common');
  const localizePath = useLocalizedPath();
  const slug = params.slug?.join('/') || '';
  
  // Map of slugs to more user-friendly titles
  const pageNames: { [key: string]: string } = {
    visualizations: 'Visualizations Gallery',
    docs: 'Documentation',
    tutorials: 'Tutorials',
    guides: 'Guides',
    changelog: 'Changelog',
    blog: 'Blog',
    about: 'About Us',
    team: 'Our Team',
    careers: 'Careers',
    help: 'Help Center',
    faq: 'Frequently Asked Questions',
    security: 'Security',
    privacy: 'Privacy Policy',
    terms: 'Terms of Service',
    cookies: 'Cookie Policy',
    license: 'License'
  };

  const pageName = pageNames[slug] || slug.split('/').map(s => 
    s.charAt(0).toUpperCase() + s.slice(1)
  ).join(' - ');

  return (
    <>
      <UnifiedHeader />
      <div className="container mx-auto px-4 py-16 min-h-screen">
        <div className="max-w-2xl mx-auto">
          <Alert className="mb-8 border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <AlertTitle className="text-amber-800 dark:text-amber-200">Page Coming Soon</AlertTitle>
            <AlertDescription className="text-amber-700 dark:text-amber-300">
              The <strong>{pageName}</strong> page is currently under development. Please check back soon!
            </AlertDescription>
          </Alert>
          
          <div className="prose prose-gray dark:prose-invert max-w-none">
            <h1 className="text-3xl font-bold mb-4">{pageName}</h1>
            <p className="text-muted-foreground mb-8">
              We&apos;re working hard to bring you this content. In the meantime, you can explore other areas of OpenStrand or return to the dashboard.
            </p>
          </div>

          <div className="flex gap-4 mt-8">
            <Button asChild>
              <Link href={localizePath('/')}>
                Return to Dashboard
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={localizePath('/landing')}>
                View Landing Page
              </Link>
            </Button>
          </div>
        </div>
      </div>
      <SiteFooter />
    </>
  );
}
