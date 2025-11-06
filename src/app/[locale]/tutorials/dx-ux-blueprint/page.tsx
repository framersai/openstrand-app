import type { Metadata } from 'next';

import { UnifiedHeader } from '@/components/navigation/UnifiedHeader';
import { siteMetadata, getRouteMetadata } from '@/config/seo';
import type { Locale } from '@/i18n/config';

const FALLBACK_METADATA = {
  title: 'Tutorial: Developer & Experience Blueprint',
  description:
    'Coordinate frontend, backend, and design teams when extending OpenStrand tutorials, composer modules, and dashboards.',
  keywords: [
    'openstrand tutorials',
    'developer experience',
    'ux process',
    'design systems',
  ],
  path: '/tutorials/dx-ux-blueprint',
};

type TutorialParams = {
  params: {
    locale: Locale;
  };
};

export async function generateMetadata({ params }: TutorialParams): Promise<Metadata> {
  const { locale } = params;
  const routeMetadata = getRouteMetadata('/tutorials/dx-ux-blueprint') ?? FALLBACK_METADATA;
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
    title: 'System map',
    body: (
      <>
        <p>
          Understand how the Next.js app, Fastify backend, and SDK fit together before extending features. The blueprint covers composer, dashboard, tutorials, and shared components.
        </p>
        <p className="text-sm text-muted-foreground">
          Refer to <code>docs/tutorials/dx-ux-blueprint.md</code> for diagrams and change-management rituals.
        </p>
      </>
    ),
  },
  {
    title: 'Coding standards & tooling',
    body: (
      <>
        <ul className="list-disc space-y-1 pl-6 text-sm text-muted-foreground">
          <li>Use TypeScript with explicit interfaces for API payloads and metadata objects.</li>
          <li>Keep linting/formatting consistent via root Prettier + ESLint scripts.</li>
          <li>Document exported functions/components with TSDoc.</li>
          <li>Write Vitest + Testing Library tests (frontend/back-end) before merging.</li>
        </ul>
      </>
    ),
  },
  {
    title: 'UX workflow',
    body: (
      <>
        <p>
          Align design and engineering efforts:
        </p>
        <ol className="list-decimal space-y-1 pl-6 text-sm text-muted-foreground">
          <li>Capture research sessions as strands (analog guide).</li>
          <li>Define design tokens and ensure contrast via <code>_theme-engine.scss</code>.</li>
          <li>Create interaction specs for new components; use shadcn/Radix primitives.</li>
          <li>Validate accessibility (keyboard, focus states, ARIA roles) and localisation.</li>
        </ol>
      </>
    ),
  },
  {
    title: 'DX roadmaps',
    body: (
      <>
        <p>
          Follow modular roadmaps depending on goal:</p>
        <ul className="list-disc space-y-1 pl-6 text-sm text-muted-foreground">
          <li><strong>Extend tutorials</strong>: add Markdown guide, create route under <code>/tutorials</code>, update marketing metadata.</li>
          <li><strong>Enhance composer</strong>: update `StrandComposer`, DTO types, API service, and tests.</li>
          <li><strong>Upgrade dashboard</strong>: add panels/components and hook into `useDashboardController`.</li>
        </ul>
      </>
    ),
  },
  {
    title: 'Collaboration rituals',
    body: (
      <>
        <p>
          Adopt shared ceremonies: weekly doc triage, design reviews for theme/contrast, testing sweeps across breakpoints, accessibility audits, and pair programming for schema + UI changes.</p>
        <p className="text-sm text-muted-foreground">Keep a running activity log strand for major changes.</p>
      </>
    ),
  },
  {
    title: 'Tooling checklist',
    body: (
      <ul className="list-disc space-y-1 pl-6 text-sm text-muted-foreground">
        <li>`npm run dev` (backend + frontend) lint-free.</li>
        <li>Prettier/ESLint integrated in IDE.</li>
        <li>Env loader working; Prisma migrations applied.</li>
        <li>Optional Storybook/Chromatic for component QA.</li>
        <li>Monitoring dashboards for AI usage and queue backlog.</li>
      </ul>
    ),
  },
];

export default function DxUxBlueprintTutorial() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
      <UnifiedHeader />
      <main className="container mx-auto max-w-4xl px-6 py-16">
        <header className="mb-12 space-y-4 text-center">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Tutorial: Developer &amp; Experience Blueprint</h1>
          <p className="mx-auto max-w-2xl text-sm text-muted-foreground sm:text-base">
            Coordinate design, engineering, and research teams when extending OpenStrand&apos;s tutorials, composer, and dashboard surfaces.
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


