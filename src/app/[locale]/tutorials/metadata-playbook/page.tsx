import type { Metadata } from 'next';

import { UnifiedHeader } from '@/components/navigation/UnifiedHeader';
import { siteMetadata, getRouteMetadata } from '@/config/seo';
import type { Locale } from '@/i18n/config';

const FALLBACK_METADATA = {
  title: 'Tutorial: Metadata Architecture Playbook',
  description:
    'Standardise taxonomy, retention policies, and governance so every strand, weave, and dashboard card stays consistent.',
  keywords: [
    'openstrand tutorials',
    'metadata governance',
    'knowledge taxonomy',
    'retention policy',
  ],
  path: '/tutorials/metadata-playbook',
};

type TutorialParams = {
  params: {
    locale: Locale;
  };
};

export async function generateMetadata({ params }: TutorialParams): Promise<Metadata> {
  const { locale } = params;
  const routeMetadata = getRouteMetadata('/tutorials/metadata-playbook') ?? FALLBACK_METADATA;
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
    title: 'Blueprint overview',
    body: (
      <>
        <p>
          The metadata playbook ensures strands remain discoverable, auditable, and compliant. You&apos;ll design templates for authorship, taxonomy, retention, and analytics metadata while keeping UI and backend in sync.
        </p>
        <p className="text-sm text-muted-foreground">
          This tutorial mirrors <code>docs/tutorials/metadata-architecture.md</code>. Use it to align designers, developers, and knowledge ops.
        </p>
      </>
    ),
  },
  {
    title: 'Step 1 — Define metadata domains',
    body: (
      <>
        <p>
          Break metadata into clear domains: authorship, classification, provenance, analytics, retention, collaboration. Decide which live as structured fields versus JSON properties.
        </p>
        <ul className="list-disc space-y-1 pl-6 text-sm text-muted-foreground">
          <li>
            Authorship: <code>createdBy</code>, <code>updatedBy</code>, <code>coAuthorIds</code> keep credit accurate.
          </li>
          <li>
            Classification: <code>noteType</code>, <code>tags</code>, <code>difficulty</code> power filters and tutorials.
          </li>
          <li>
            Provenance & retention: <code>metadata.credibility</code>, <code>retentionPolicy</code> enable compliance workflows.
          </li>
        </ul>
      </>
    ),
  },
  {
    title: 'Step 2 — Implement templates in the composer',
    body: (
      <>
        <p>
          Pre-populate the metadata panel inside <strong>StrandComposer</strong>. When a user selects a note type, load a recommended schema with difficulty, tag suggestions, and retention defaults.
        </p>
        <p className="text-sm text-muted-foreground">
          Validate edits with Zod to prevent malformed JSON. Provide inline helper text linking back to this playbook.
        </p>
      </>
    ),
  },
  {
    title: 'Step 3 — Apply metadata across services',
    body: (
      <>
        <p>
          Ensure backend services respect metadata: search indexes use tags, deduplication references <code>metadata.similarStrands</code>, and retention jobs honour <code>retentionPolicy</code>.
        </p>
        <p className="text-sm text-muted-foreground">
          Add Postgres indexes for frequently filtered fields and track enrichment versions for audits.
        </p>
      </>
    ),
  },
  {
    title: 'Step 4 — Governance workflows',
    body: (
      <>
        <p>
          Create operational checklists: metadata validation in CI, retention cron jobs, diff previews before bulk updates, and RBAC for sensitive edits.
        </p>
        <p className="text-sm text-muted-foreground">
          Document GDPR export/delete flows and confirm metadata provides the necessary hooks.
        </p>
      </>
    ),
  },
  {
    title: 'Deliverables & next steps',
    body: (
      <ul className="list-disc space-y-1 pl-6 text-sm text-muted-foreground">
        <li>Shared metadata schema circulated to engineering, design, and research teams.</li>
        <li>Composer UX updated with metadata inspector, chips, and helper copy.</li>
        <li>Backend validators/migrations covering metadata JSON structures.</li>
        <li>Retention jobs scheduled and monitored.</li>
        <li>Cross-links to deterministic and AI enrichment tutorials for automated metadata population.</li>
      </ul>
    ),
  },
];

export default function MetadataPlaybookTutorial() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
      <UnifiedHeader />
      <main className="container mx-auto max-w-4xl px-6 py-16">
        <header className="mb-12 space-y-4 text-center">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Tutorial: Metadata Architecture Playbook</h1>
          <p className="mx-auto max-w-2xl text-sm text-muted-foreground sm:text-base">
            Standardise the way strands capture authorship, taxonomy, analytics, and retention so every dashboard module shares a common language.
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


