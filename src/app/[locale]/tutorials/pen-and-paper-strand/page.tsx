import { Metadata } from 'next';

import { UnifiedHeader } from '@/components/navigation/UnifiedHeader';
import { siteMetadata, getRouteMetadata } from '@/config/seo';
import type { Locale } from '@/i18n/config';

type TutorialParams = {
  params: {
    locale: Locale;
  };
};

const FALLBACK_METADATA = {
  title: 'Tutorial: Start a Strand with Pen and Paper',
  description:
    'Create a collaborative OpenStrand note beginning with pen-and-paper sketches, then enrich it with AI assistance and team publishing workflows.',
  keywords: [
    'zettelkasten tutorial',
    'pen and paper note taking',
    'collaborative strand',
    'OpenStrand tutorials'
  ],
  path: '/tutorials/pen-and-paper-strand'
};

export async function generateMetadata({ params }: TutorialParams): Promise<Metadata> {
  const { locale } = params;
  const routeMetadata = getRouteMetadata('/tutorials/pen-and-paper-strand') ?? FALLBACK_METADATA;
  const canonicalUrl = `${siteMetadata.siteUrl}/${locale}${routeMetadata.path}`;

  return {
    title: routeMetadata.title,
    description: routeMetadata.description,
    keywords: Array.isArray(routeMetadata.keywords)
      ? routeMetadata.keywords
      : routeMetadata.keywords ?? [],
    alternates: {
      canonical: canonicalUrl
    },
    openGraph: {
      title: routeMetadata.title,
      description: routeMetadata.description,
      url: canonicalUrl,
      siteName: siteMetadata.siteName,
      images: [{ url: `${siteMetadata.siteUrl}${siteMetadata.defaultImage}` }],
      locale,
      type: 'article'
    },
    twitter: {
      card: 'summary_large_image',
      title: routeMetadata.title,
      description: routeMetadata.description,
      images: [`${siteMetadata.siteUrl}${siteMetadata.defaultImage}`]
    }
  };
}

const sections = [
  {
    title: 'Step 1 — Sketch the Strand with Pen and Paper',
    body: (
      <>
        <p>
          Begin with a blank index card or notebook page. Capture a single idea as your <strong>main note</strong>. Give it a short
          identifier, write a concise title, and list the core insight in one or two sentences. On the margins, reserve space for
          related ideas you might connect later.
        </p>
        <ul className="list-disc space-y-1 pl-6 text-sm text-muted-foreground">
          <li>Note the source if the idea comes from a book, article, or conversation.</li>
          <li>Mark potential reference materials with a light star or underline so you can capture them as <em>reference notes</em> later.</li>
          <li>Jot directional arrows or numbers that hint at relationships—these will become weave edges when digitised.</li>
        </ul>
      </>
    )
  },
  {
    title: 'Step 2 — Model Relationships Offline',
    body: (
      <>
        <p>
          Flip the page and draw a tiny knowledge map. Place the main note in the centre and surround it with neighbouring concepts,
          annotations, or open questions. Label the connections (e.g., “builds on”, “contradicts”, “part of”). This mimics OpenStrand’s
          <strong>Weave</strong> edges and prepares you for digital linking.
        </p>
        <p className="text-sm text-muted-foreground">
          If you are working with a team, invite collaborators to add sticky notes or coloured pens so each contribution is visible at a
          glance. When you later capture the strand online, you can assign co-authors and credit the person who proposed each link.
        </p>
      </>
    )
  },
  {
    title: 'Step 3 — Capture the Strand in OpenStrand',
    body: (
      <>
        <p>
          Open the Strand Composer and select the appropriate <strong>note type</strong>—“Main note” for your primary insight, “Reference note”
          for source digests, or “Structure note” when outlining an article. Transcribe the handwritten content, attach scans or images if
          useful, and recreate the relationships you sketched by adding weave links with short justifications.
        </p>
        <p className="text-sm text-muted-foreground">
          The composer automatically stores authorship (created by, updated by) and tracks co-authors. Use the summary field to keep
          your note indexable and add metadata such as tags, difficulty, or prerequisites to match the pen-and-paper cues.
        </p>
      </>
    )
  },
  {
    title: 'Step 4 — Enrich with AI and Metadata (Optional)',
    body: (
      <>
        <p>
          Once the note lives in OpenStrand, you can invite the optional AI assistants to help refine the content. Generate concise
          abstracts, extract key themes, or transform the note into a structure outline. Attach transcriptions from voice notes, add
          media metadata, and let the deduplication service warn you about overlapping ideas before you publish.
        </p>
        <p className="text-sm text-muted-foreground">
          Remember: the handwritten core still drives the strand. AI enhances clarity and searchability, ensuring your analogue work is
          future-proofed without losing its original intent.
        </p>
      </>
    )
  },
  {
    title: 'Step 5 — Collaborate and Publish',
    body: (
      <>
        <p>
          Share the strand with teammates or collaborators. Assign structure notes when outlining shared articles, record who created
          each link, and maintain an activity trail. To publish, convert structure notes into articles or knowledge base entries and use
          collections or threads to bundle related strands.
        </p>
        <p className="text-sm text-muted-foreground">
          Collaborative features—including structure workspaces, shared publishing pipelines, and private cloud backups—require an
          <strong>OpenStrand Team License</strong>. Plans are licensed annually or as a lifetime purchase:
        </p>
        <ul className="list-disc space-y-1 pl-6 text-sm text-muted-foreground">
          <li>Lifetime (revenue &gt; $200k/year): $5,000 — includes full whitelabelling rights, self-hosting guides, and discounted cloud storage.</li>
          <li>Lifetime (revenue ≤ $200k/year): $999 — same benefits with optional paid cloud storage add-ons.</li>
          <li>Annual team subscriptions remain available for organisations that prefer recurring billing.</li>
        </ul>
        <p className="text-sm text-muted-foreground">
          Individual users can continue to work offline or solo for free. Teams that need synchronised access, structure workspaces, and
          managed cloud backups will benefit from the paid plans.
        </p>
      </>
    )
  }
];

export default function PenAndPaperStrandTutorial() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
      <UnifiedHeader />
      <main className="container mx-auto max-w-4xl px-6 py-16">
        <header className="mb-12 space-y-4 text-center">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Tutorial: Start a Strand with Pen and Paper
          </h1>
          <p className="mx-auto max-w-2xl text-sm text-muted-foreground sm:text-base">
            Build your first collaborative zettelkasten strand without touching a keyboard. Capture ideas on paper, model the
            relationships, and then bring them into OpenStrand with AI enhancements and team-ready publishing workflows.
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

