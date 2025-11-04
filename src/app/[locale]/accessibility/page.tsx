import { Metadata } from 'next';

import { LegalPageLayout } from '@/components/legal/legal-page-layout';

export const metadata: Metadata = {
  title: 'Accessibility Statement - OpenStrand',
  description: 'Learn about the accessibility goals and commitments of the OpenStrand platform.',
};

const toc = [
  { id: 'commitment', label: 'Our Commitment' },
  { id: 'standards', label: 'Standards & Testing' },
  { id: 'features', label: 'Accessibility Features' },
  { id: 'ongoing', label: 'Continuous Improvement' },
  { id: 'feedback', label: 'Feedback & Contact' },
];

export default function AccessibilityPage() {
  return (
    <LegalPageLayout
      title="Accessibility Statement"
      description="OpenStrand strives to ensure that our product, documentation, and marketing experiences are inclusive and usable by everyone."
      lastUpdated="January 15, 2026"
      toc={toc}
    >
      <section id="commitment">
        <h2>Our Commitment</h2>
        <p>
          We believe knowledge management should be accessible to every learner, analyst, and
          storyteller. OpenStrand is actively working toward compliance with WCAG 2.1 AA standards
          across our application, documentation, and embedded visualizations.
        </p>
      </section>

      <section id="standards">
        <h2>Standards &amp; Testing</h2>
        <ul>
          <li>
            Our design system is built with semantic HTML, ARIA landmarks, and consistent focus
            states.
          </li>
          <li>Automated linting (axe-core, ESLint plugins) runs in CI for new UI components.</li>
          <li>
            Manual keyboard and screen-reader testing is performed before major releases, prioritizing the visualization and onboarding flows.
          </li>
        </ul>
      </section>

      <section id="features">
        <h2>Accessibility Features</h2>
        <ul>
          <li>Keyboard navigable layouts with skip links and logical tab order.</li>
          <li>Support for reduced motion and high-contrast media queries.</li>
          <li>Theme system with curated palettes that meet WCAG contrast guidelines.</li>
          <li>Alt text and live region announcements for AI-generated charts and alerts.</li>
          <li>Internationalization with right-to-left language support.</li>
        </ul>
      </section>

      <section id="ongoing">
        <h2>Continuous Improvement</h2>
        <p>
          Accessibility is a continuous process. We conduct quarterly audits, track issues
          publicly in our documentation, and prioritize fixes in product planning. If you encounter
          barriers, we want to hear from you.
        </p>
      </section>

      <section id="feedback">
        <h2>Feedback &amp; Contact</h2>
        <p>
          Share suggestions or report accessibility issues by emailing{' '}
          <a href="mailto:accessibility@frame.dev" className="text-primary underline-offset-4 hover:underline">
            accessibility@frame.dev
          </a>
          . We typically respond within 5 business days.
        </p>
      </section>
    </LegalPageLayout>
  );
}
