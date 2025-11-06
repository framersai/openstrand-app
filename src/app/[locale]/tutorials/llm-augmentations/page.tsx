import type { Metadata } from 'next';

import { UnifiedHeader } from '@/components/navigation/UnifiedHeader';
import { siteMetadata, getRouteMetadata } from '@/config/seo';
import type { Locale } from '@/i18n/config';

const FALLBACK_METADATA = {
  title: 'Tutorial: LLM-Augmented Strand Workflows',
  description:
    'Design prompt chains, cost controls, and review UX so OpenStrand strands blend human insight with AI augmentation.',
  keywords: [
    'openstrand tutorials',
    'prompt chaining',
    'ai workflow',
    'knowledge management ai',
  ],
  path: '/tutorials/llm-augmentations',
};

type TutorialParams = {
  params: {
    locale: Locale;
  };
};

export async function generateMetadata({ params }: TutorialParams): Promise<Metadata> {
  const { locale } = params;
  const routeMetadata = getRouteMetadata('/tutorials/llm-augmentations') ?? FALLBACK_METADATA;
  const canonicalUrl = `${siteMetadata.siteUrl}/${locale}${routeMetadata.path}`;

  return {
    title: routeMetadata.title,
    description: routeMetadata.description,
    keywords: Array.isArray(routeMetadata.keywords)
      ? routeMetadata.keywords
      : routeMetadata.keywords ?? [],
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: routeMetadata.title,
      description: routeMetadata.description,
      url: canonicalUrl,
      siteName: siteMetadata.siteName,
      images: [{ url: `${siteMetadata.siteUrl}${siteMetadata.defaultImage}` }],
      locale,
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: routeMetadata.title,
      description: routeMetadata.description,
      images: [`${siteMetadata.siteUrl}${siteMetadata.defaultImage}`],
    },
  };
}

const sections = [
  {
    title: 'Overview',
    body: (
      <>
        <p>
          This guide demonstrates how to orchestrate LLM-assisted strands: create prompt chains, queue asynchronous jobs, and present AI outputs with human-in-the-loop review flows.
        </p>
        <p className="text-sm text-muted-foreground">
          It builds on the <code>docs/tutorials/llm-augmentations.md</code> reference. Follow along to configure providers, design UX affordances, and capture audit logs.
        </p>
      </>
    ),
  },
  {
    title: 'Step 1 — Configure providers & prompt chains',
    body: (
      <>
        <p>
          Define a <strong>PromptChain</strong> in the backend, populate with ordered <strong>PromptSteps</strong>, and set provider aliases (e.g., <code>openai:gpt-4o-mini</code>, <code>anthropic:haiku</code>).
        </p>
        <ul className="list-disc space-y-1 pl-6 text-sm text-muted-foreground">
          <li>Store chains via the Prisma models and expose them through admin tooling.</li>
          <li>When the composer runs the chain, log each <code>PromptRun</code> with tokens, cost, and duration.</li>
        </ul>
      </>
    ),
  },
  {
    title: 'Step 2 — Queue execution and caching',
    body: (
      <>
        <p>
          Push prompt jobs into BullMQ queues with priority tiers. Cache results keyed by <code>hash(prompt + strandId)</code> to avoid redundant calls.</p>
        <p className="text-sm text-muted-foreground">Fallback gracefully to deterministic methods if a provider is unavailable.</p>
      </>
    ),
  },
  {
    title: 'Step 3 — Design the review experience',
    body: (
      <>
        <p>
          In the UI, present AI output alongside the original strand: highlight diff, show provider badge, and include accept/reject controls.</p>
        <ul className="list-disc space-y-1 pl-6 text-sm text-muted-foreground">
          <li>Track reviewer decisions via <code>PromptRunLog</code> so audit trails remain complete.</li>
          <li>Allow overrides—when a user edits the AI suggestion, persist the result as a new run with <code>override: true</code>.</li>
        </ul>
      </>
    ),
  },
  {
    title: 'Step 4 — Voice notes & media insights',
    body: (
      <>
        <p>
          Record voice notes with the floating recorder, transcribe via Whisper or in-house models, and feed transcripts into the prompt chain for highlights or TODO extraction.</p>
        <p className="text-sm text-muted-foreground">Use the media wizard to request ALT text, object detection, and captions. Store outputs in <code>metadata.mediaInsights</code>.</p>
      </>
    ),
  },
  {
    title: 'Step 5 — RBAC and governance',
    body: (
      <>
        <p>
          Gate AI controls with <code>FeatureFlag</code> and <code>StrandPermission</code>. Editors see full AI functionality while viewers get read-only access.</p>
        <p className="text-sm text-muted-foreground">Log every run, cost, and decision for compliance. Integrate with billing providers via <code>CostRecord</code>.</p>
      </>
    ),
  },
  {
    title: 'Checklist',
    body: (
      <ul className="list-disc space-y-1 pl-6 text-sm text-muted-foreground">
        <li>Providers configured with environment variables and health checks.</li>
        <li>Prompt chains stored in Prisma and exposed via admin UI.</li>
        <li>Queues + caching set up with fallbacks.</li>
        <li>Review UI in the composer/dashboard with diff + accept/reject.</li>
        <li>Activity feed records prompt runs and overrides.</li>
      </ul>
    ),
  },
];

export default function LlmAugmentationsTutorial() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
      <UnifiedHeader />
      <main className="container mx-auto max-w-4xl px-6 py-16">
        <header className="mb-12 space-y-4 text-center">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Tutorial: LLM-Augmented Strand Workflows</h1>
          <p className="mx-auto max-w-2xl text-sm text-muted-foreground sm:text-base">
            Configure prompt chains, asynchronous processing, and review states so teams can harness AI responsibly inside OpenStrand.
          </p>
        </header>

        <div className="space-y-12">
          {sections.map((section) => (
            <section key={section.title} className="space-y-4 rounded-xl border border-border/60 bg-background/80 p-6 shadow-sm">
              <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">{section.title}</h2>
              <div className="prose max-w-none text-sm leading-relaxed text-foreground dark:prose-invert sm:text-base">
                {section.body}
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}


