import type { Metadata } from 'next';

import { UnifiedHeader } from '@/components/navigation/UnifiedHeader';
import { siteMetadata, getRouteMetadata } from '@/config/seo';
import type { Locale } from '@/i18n/config';

const FALLBACK_METADATA = {
  title: 'Tutorial: Modeling Strands Without LLMs',
  description:
    'Build analytical strands using statistical profiling, extractive summarisation, and deterministic pipelines when AI integrations are disabled.',
  keywords: [
    'openstrand tutorials',
    'deterministic summarisation',
    'compliance analytics',
    'knowledge graph analytics',
  ],
  path: '/tutorials/offline-analytics',
};

type TutorialParams = {
  params: {
    locale: Locale;
  };
};

export async function generateMetadata({ params }: TutorialParams): Promise<Metadata> {
  const { locale } = params;
  const routeMetadata = getRouteMetadata('/tutorials/offline-analytics') ?? FALLBACK_METADATA;
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
    title: 'Why deterministic workflows matter',
    body: (
      <>
        <p>
          In highly regulated environments you often cannot call external LLM APIs. This walkthrough mirrors the{' '}
          <strong>Modeling Without LLMs</strong> guide and shows how to enrich strands using statistical profiling, extractive summarisation, and rule-based heuristics.
        </p>
        <p className="text-sm text-muted-foreground">
          You&apos;ll finish with reproducible summaries, quality flags, and metadata that feed the dashboard without relying on generative AI.
        </p>
      </>
    ),
  },
  {
    title: 'Step 1 — Profile your dataset',
    body: (
      <>
        <p>
          Start by computing descriptive statistics using your preferred tooling (DuckDB, pandas, or Node scripts). Capture row counts, null ratios, min/max values, and anomaly flags.
        </p>
        <ul className="list-disc space-y-1 pl-6 text-sm text-muted-foreground">
          <li>
            Store results under <code>metadata.profile</code> when creating a <strong>reference</strong> strand via the OpenStrand API.
          </li>
          <li>
            Attach a small sample (CSV snippet or JSON) using the media wizard so reviewers can inspect raw data offline.
          </li>
        </ul>
      </>
    ),
  },
  {
    title: 'Step 2 — Generate extractive summaries',
    body: (
      <>
        <p>
          Run deterministic summarisation algorithms (TextRank, SumBasic, BM25 centroid) against the strand&apos;s text or transcript. Persist the output in <code>metadata.extractiveSummary</code> with algorithm provenance.
        </p>
        <p className="text-sm text-muted-foreground">
          These summaries power quick scan cards in the dashboard while remaining auditable and reproducible.
        </p>
      </>
    ),
  },
  {
    title: 'Step 3 — Keyword & topic extraction',
    body: (
      <>
        <p>
          Use RAKE/YAKE or TF-IDF to identify important phrases. Map them to controlled vocabularies so your knowledge graph stays consistent.</p>
        <ul className="list-disc space-y-1 pl-6 text-sm text-muted-foreground">
          <li>Save keywords to <code>metadata.tags</code> and domain ontologies to <code>metadata.ontology</code>.</li>
          <li>Feed the deduplication service with n-gram hashes to catch near-duplicates during imports.</li>
        </ul>
      </>
    ),
  },
  {
    title: 'Step 4 — Governance & automation',
    body: (
      <>
        <p>
          Use BullMQ to schedule enrichment jobs, Redis for caching, and the activity service for logging. Respect privacy and RBAC with the <code>visibility</code> and <code>teamId</code> fields.</p>
        <p className="text-sm text-muted-foreground">Document algorithm versions in <code>metadata.enrichmentVersion</code> so you can audit changes over time.</p>
      </>
    ),
  },
  {
    title: 'Deliverables',
    body: (
      <>
        <ul className="list-disc space-y-1 pl-6 text-sm text-muted-foreground">
          <li>A reference strand populated with statistical profiles and summary cards.</li>
          <li>Caches and queues configured for deterministic pipelines.</li>
          <li>Dashboard cards (Dataset Inspector, Feedback) showing provenance badges.</li>
          <li>Automated unit tests verifying expected summary outputs for sample datasets.</li>
        </ul>
        <p className="text-sm text-muted-foreground">
          For exhaustive procedural detail, open <code>docs/tutorials/offline-analytics-guide.md</code> in the repository.
        </p>
      </>
    ),
  },
];

export default function OfflineAnalyticsTutorial() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
      <UnifiedHeader />
      <main className="container mx-auto max-w-4xl px-6 py-16">
        <header className="mb-12 space-y-4 text-center">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Tutorial: Modeling Strands Without LLMs</h1>
          <p className="mx-auto max-w-2xl text-sm text-muted-foreground sm:text-base">
            Follow a deterministic enrichment pipeline—from statistical profiling to extractive summarisation—so your strands remain compliant in air-gapped or regulated environments.
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


