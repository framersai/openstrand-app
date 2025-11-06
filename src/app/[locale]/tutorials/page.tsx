import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Locale } from '@/i18n/config';

export default function TutorialsPage({ params }: { params: { locale: Locale } }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <main className="container mx-auto max-w-5xl px-6 py-16">
        <div className="mb-8 space-y-3 text-center">
          <h1 className="text-3xl font-semibold tracking-tight">Tutorials & Guides</h1>
          <p className="text-sm text-muted-foreground">Step-by-step guides for common end-to-end flows.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Whiteboard → OCR → Summary → Publish</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>Sketch on the whiteboard, capture and OCR, summarize, and publish to your weave.</p>
              <Link href="/composer?whiteboard=1" className="text-primary hover:underline">Open in composer ↗</Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Voice → Transcript → Highlights → Objectives</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>Record a voice note, auto-insert the transcript, extract highlights and learning objectives.</p>
              <Link href="/composer" className="text-primary hover:underline">Try the recorder ↗</Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Media Wizard with OCR & Captions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>Upload images/video, run OCR, generate summaries, and embed figure/audio/video in notes.</p>
              <Link href="/composer" className="text-primary hover:underline">Open composer ↗</Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Datasets → Auto Insights → Visualizations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>Upload a dataset, run auto-insights, and build visualizations with presets.</p>
              <Link href="/" className="text-primary hover:underline">Go to dashboard ↗</Link>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

import Link from 'next/link';
import type { Metadata } from 'next';

import { UnifiedHeader } from '@/components/navigation/UnifiedHeader';
import { siteMetadata } from '@/config/seo';
import type { Locale } from '@/i18n/config';

const tutorials = [
  {
    slug: 'product-tour',
    title: 'Product Tour',
    description: 'Step through the dashboard help overlay, onboarding wizards, and storage/sync controls.',
    tags: ['onboarding', 'help', 'dashboard'],
  },
  {
    slug: 'pen-and-paper-strand',
    title: 'Analog Foundations',
    description: 'Sketch strands on paper, model relationships offline, and digitise them with authorship tracking.',
    tags: ['pen & paper', 'collaboration', 'zettelkasten'],
  },
  {
    slug: 'offline-analytics',
    title: 'Modeling Without LLMs',
    description: 'Use deterministic statistics and extractive summarisation to enrich strands in restricted environments.',
    tags: ['analytics', 'compliance', 'summaries'],
  },
  {
    slug: 'llm-augmentations',
    title: 'LLM-Augmented Workflows',
    description: 'Design prompt chains, cost controls, and review loops for AI-assisted strands.',
    tags: ['AI', 'prompt chaining', 'queues'],
  },
  {
    slug: 'metadata-playbook',
    title: 'Metadata Architecture Playbook',
    description: 'Standardise taxonomy, retention policies, and governance for every strand and weave.',
    tags: ['metadata', 'taxonomy', 'governance'],
  },
  {
    slug: 'dx-ux-blueprint',
    title: 'Developer & Experience Blueprint',
    description: 'Coordinate DX and UX workflows when extending dashboards, composer, and tutorials.',
    tags: ['DX', 'UX', 'design systems'],
  },
];

type TutorialIndexParams = {
  params: {
    locale: Locale;
  };
};

export async function generateMetadata({ params }: TutorialIndexParams): Promise<Metadata> {
  const { locale } = params;
  const canonicalUrl = `${siteMetadata.siteUrl}/${locale}/tutorials`;

  return {
    title: 'OpenStrand Tutorial Suite',
    description: 'Multi-guide learning hub covering analog workflows, offline analytics, LLM augmentations, metadata governance, and DX/UX operations.',
    keywords: [
      'openstrand tutorials',
      'knowledge management guides',
      'llm workflows',
      'metadata playbook',
      'developer experience'
    ],
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: 'OpenStrand Tutorial Suite',
      description: 'Explore analog, deterministic, and AI-assisted workflows for strands and dashboards.',
      url: canonicalUrl,
      siteName: siteMetadata.siteName,
      images: [{ url: `${siteMetadata.siteUrl}${siteMetadata.defaultImage}` }],
      locale,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'OpenStrand Tutorial Suite',
      description: 'Multi-guide learning hub for DX and UX teams.',
      images: [`${siteMetadata.siteUrl}${siteMetadata.defaultImage}`],
    },
  };
}

export default function TutorialIndexPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
      <UnifiedHeader />
      <main className="container mx-auto max-w-5xl px-6 py-16">
        <header className="mb-12 space-y-4 text-center">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">OpenStrand Tutorial Suite</h1>
          <p className="mx-auto max-w-3xl text-sm text-muted-foreground sm:text-base">
            Dive into analog foundations, deterministic analytics, AI augmentations, metadata governance, and DX/UX operations.
            Each guide pairs documentation with in-app walkthroughs and practical exercises.
          </p>
        </header>

        <section className="grid gap-6 sm:grid-cols-2">
          {tutorials.map((tutorial) => (
            <article
              key={tutorial.slug}
              className="group flex h-full flex-col justify-between rounded-xl border border-border/60 bg-background/85 p-6 shadow-sm transition hover:-translate-y-1 hover:border-primary/60 hover:shadow-lg"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-primary/80">
                  <span>Guide</span>
                  <span className="h-px flex-1 bg-primary/40" />
                </div>
                <h2 className="text-xl font-semibold tracking-tight group-hover:text-primary sm:text-2xl">
                  {tutorial.title}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {tutorial.description}
                </p>
              </div>

              <div className="mt-5 flex flex-wrap gap-2 text-[11px] uppercase tracking-wide text-muted-foreground">
                {tutorial.tags.map((tag) => (
                  <span key={tag} className="rounded-full border border-border/50 bg-background/80 px-2 py-1">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="mt-6 flex justify-end">
                <Link
                  href={`/tutorials/${tutorial.slug}`}
                  className="inline-flex items-center gap-1 text-sm font-medium text-primary transition hover:gap-2"
                >
                  Read guide
                  <span aria-hidden>→</span>
                </Link>
              </div>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}


