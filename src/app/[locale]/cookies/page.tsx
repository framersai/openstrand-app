import { Metadata } from 'next';

import { LegalPageLayout } from '@/components/legal/legal-page-layout';

export const metadata: Metadata = {
  title: 'Cookie Policy - OpenStrand',
  description: 'Learn how OpenStrand uses cookies and similar technologies.',
};

const toc = [
  { id: 'cookie-overview', label: 'Overview' },
  { id: 'necessary', label: 'Strictly Necessary Cookies' },
  { id: 'analytics', label: 'Analytics & Performance' },
  { id: 'preferences', label: 'Managing Your Preferences' },
  { id: 'offline', label: 'Offline Mode' },
  { id: 'more-info', label: 'More Information' },
];

export default function CookiesPage() {
  return (
    <LegalPageLayout
      title="Cookie Policy"
      description="This policy explains how and when OpenStrand uses cookies and local storage, as well as how you can control those choices."
      lastUpdated="January 15, 2026"
      toc={toc}
    >
      <section id="cookie-overview">
        <h2>Overview</h2>
        <p>
          OpenStrand uses cookies and similar technologies to provide, secure, and improve our
          services. Cookies are small text files placed on your device. Some cookies are required for
          essential functionality, while others are optional and only load with your consent.
        </p>
      </section>

      <section id="necessary">
        <h2>Strictly Necessary Cookies</h2>
        <p>These cookies are always active when you use the cloud experience:</p>
        <ul>
          <li>
            <strong>Session cookies</strong> keep you logged in as you navigate across pages and
            locales.
          </li>
          <li>
            <strong>Security tokens</strong> help prevent cross-site request forgery (CSRF) attacks.
          </li>
          <li>
            <strong>Localization preferences</strong> store your selected language and theme.
          </li>
        </ul>
        <p>We do not use these cookies for advertising or cross-site tracking.</p>
      </section>

      <section id="analytics">
        <h2>Analytics &amp; Performance</h2>
        <p>
          Optional analytics (Google Analytics and Microsoft Clarity) help us understand product
          performance. These cookies load only after you grant consent through our GDPR banner.
        </p>
        <ul>
          <li>Analytics cookies record aggregated usage data—never raw datasets or visualization content.</li>
          <li>You can withdraw consent at any time through the privacy settings panel.</li>
          <li>No analytics code runs in offline or local-only deployments.</li>
        </ul>
      </section>

      <section id="preferences">
        <h2>Managing Your Preferences</h2>
        <ul>
          <li>Use the cookie banner presented on your first visit to accept or decline analytics.</li>
          <li>
            Adjust browser-level controls to clear existing cookies or block future placements.
          </li>
          <li>
            Revisit privacy settings within the app to toggle analytics consent if you change your
            mind.
          </li>
        </ul>
      </section>

      <section id="offline">
        <h2>Offline Mode</h2>
        <p>
          The OpenStrand desktop and LAN clients do not set HTTP cookies. Instead, we store essential
          preferences (theme, locale, recent projects) in local storage on your device. This data
          never leaves your environment unless you opt to sync with the cloud later.
        </p>
      </section>

      <section id="more-info">
        <h2>More Information</h2>
        <p>
          If you have questions about our cookie practices or need assistance updating your
          preferences, contact{' '}
          <a href="mailto:privacy@frame.dev" className="text-primary underline-offset-4 hover:underline">
            privacy@frame.dev
          </a>
          .
        </p>
      </section>
    </LegalPageLayout>
  );
}
