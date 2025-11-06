import type { Metadata } from 'next';

import { UnifiedHeader } from '@/components/navigation/UnifiedHeader';
import { siteMetadata, getRouteMetadata } from '@/config/seo';
import type { Locale } from '@/i18n/config';

const FALLBACK_METADATA = {
  title: 'Tutorial: OpenStrand Product Tour',
  description:
    'Use the in-app product tour overlay to explore onboarding wizards, local storage controls, and sync management without leaving the dashboard.',
  keywords: ['product tour', 'onboarding', 'help overlay', 'storage'],
  path: '/tutorials/product-tour',
};

type TutorialParams = {
  params: {
    locale: Locale;
  };
};

export async function generateMetadata({ params }: TutorialParams): Promise<Metadata> {
  const { locale } = params;
  const routeMetadata = getRouteMetadata('/tutorials/product-tour') ?? FALLBACK_METADATA;
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
    title: 'Launch the overlay',
    body: (
      <div className="space-y-3">
        <p>
          Open the tour from <strong>Help &gt; Product Tour</strong> in the dashboard header (or
          press <kbd>?</kbd>) to keep guidance alongside your work. The overlay supports docked and
          modal modes so you can leave it pinned during workshops or onboarding calls.
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Use the search box or sidebar to jump straight to a topic.</li>
          <li>The tour remembers your last visited section across sessions.</li>
          <li>Dock/undock at any time; the last mode is saved for your next visit.</li>
        </ul>
      </div>
    ),
  },
  {
    title: 'Storage and sync quick reference',
    body: (
      <div className="space-y-3">
        <p>
          The tour mirrors the Settings/Profile “Local workspace storage” card so you can confirm
          adapter kind, database path, and sync status from one place.
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Copy the SQLite path for manual backups or debugging.</li>
          <li>Trigger <strong>Sync now</strong> after enabling `OPENSTRAND_SYNC_REMOTE_URL`.</li>
          <li>
            Review the last sync timestamp, pending changes, and conflict badges before escalating
            support tickets.
          </li>
        </ul>
      </div>
    ),
  },
  {
    title: 'Onboarding wizards',
    body: (
      <div className="space-y-3">
        <p>
          The overlay highlights both onboarding flows so local-first and Teams deployments follow
          the correct checklist.
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>LocalOnboarding</strong>: storage card quick actions, links to analog tutorials,
            and optional sync enablement.
          </li>
          <li>
            <strong>TeamOnboarding</strong>: infrastructure validation, RBAC prompts, AI automation
            configuration, and “mark complete” guidance.
          </li>
        </ul>
      </div>
    ),
  },
  {
    title: 'Docs and admin follow-up',
    body: (
      <div className="space-y-3">
        <p>
          Each section links out to deeper documentation, including the raw Markdown at{' '}
          <code>docs/tutorials/product-tour.md</code>, so operations teams can customise training
          material without redeploying the app.
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Pair the tour with the admin dashboard’s storage telemetry to monitor sync health across
            workspaces.
          </li>
          <li>
            Encourage teams to leave feedback via the dashboard feedback pulse—those tips feed back
            into the docs.
          </li>
        </ul>
      </div>
    ),
  },
];

export default function ProductTourTutorial({ params }: TutorialParams) {
  const { locale } = params;
  const routeMetadata = getRouteMetadata('/tutorials/product-tour') ?? FALLBACK_METADATA;
  const canonicalUrl = `${siteMetadata.siteUrl}/${locale}${routeMetadata.path}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <UnifiedHeader />
      <main className="container mx-auto max-w-5xl space-y-12 px-4 pb-16 pt-10 sm:px-6 lg:px-8">
        <header className="space-y-6 rounded-2xl border border-border/60 bg-background/90 p-8 text-foreground shadow-md backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
            Guided overlay
          </p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            OpenStrand Product Tour
          </h1>
          <p className="text-base text-muted-foreground sm:text-lg">
            Keep the dashboard tour overlay handy while you explore onboarding, storage, and sync
            capabilities. The content updates automatically from the repository so training and
            support teams stay aligned with the product.
          </p>
        </header>

        <div className="space-y-12">
          {sections.map((section) => (
            <section
              key={section.title}
              className="space-y-4 rounded-xl border border-border/60 bg-background/80 p-6 shadow-sm"
            >
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
