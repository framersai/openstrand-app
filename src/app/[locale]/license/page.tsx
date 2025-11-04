import { Metadata } from 'next';

import { LegalPageLayout } from '@/components/legal/legal-page-layout';

export const metadata: Metadata = {
  title: 'Licensing - OpenStrand',
  description: 'Overview of OpenStrand licensing for open-source and commercial offerings.',
};

const toc = [
  { id: 'open-source', label: 'Open-Source Components' },
  { id: 'commercial', label: 'Commercial Offerings' },
  { id: 'contributions', label: 'Contributing & Attribution' },
  { id: 'trademarks', label: 'Trademarks & Branding' },
  { id: 'questions', label: 'Questions' },
];

export default function LicensePage() {
  return (
    <LegalPageLayout
      title="Licensing"
      description="OpenStrand includes both open-source packages and commercial services. This page explains how each component is licensed."
      lastUpdated="January 15, 2026"
      toc={toc}
    >
      <section id="open-source">
        <h2>Open-Source Components</h2>
        <p>
          The OpenStrand SDK, schema definitions, and reference backend are released under the MIT
          License. You are free to use, modify, and redistribute these packages, provided you include
          the original copyright notice.
        </p>
        <p>
          Community contributions remain under the MIT License unless otherwise noted. We are
          committed to keeping the core knowledge models open so organizations can build tailored
          experiences.
        </p>
      </section>

      <section id="commercial">
        <h2>Commercial Offerings</h2>
        <p>
          Managed cloud services, enterprise integrations, and premium analytics are delivered under
          a commercial agreement. These offerings include:
        </p>
        <ul>
          <li>Hosted workspaces with SLAs, incident response, and dedicated support.</li>
          <li>Advanced tier routing, AI orchestration, and governance dashboards.</li>
          <li>Optional expert services (migration, custom theming, training).</li>
        </ul>
        <p>
          Customers must accept a Master Services Agreement (MSA) and Data Processing Addendum (DPA)
          before access is provisioned.
        </p>
      </section>

      <section id="contributions">
        <h2>Contributing &amp; Attribution</h2>
        <ul>
          <li>Contributions to open-source packages are welcomed under the MIT License.</li>
          <li>
            If you fork or redistribute OpenStrand OSS components, please provide visible credit and
            link back to our repository.
          </li>
          <li>
            Commercial integrations that bundle OpenStrand components must maintain license headers
            and include the license text in documentation or about dialogs.
          </li>
        </ul>
      </section>

      <section id="trademarks">
        <h2>Trademarks &amp; Branding</h2>
        <p>
          “OpenStrand”, the weave logo, and related wordmarks are trademarks of Frame.dev. You may
          reference OpenStrand for fairness and attribution but should not imply official affiliation
          without written permission.
        </p>
      </section>

      <section id="questions">
        <h2>Questions</h2>
        <p>
          Licensing enquiries can be directed to{' '}
          <a href="mailto:legal@frame.dev" className="text-primary underline-offset-4 hover:underline">
            legal@frame.dev
          </a>
          .
        </p>
      </section>
    </LegalPageLayout>
  );
}
