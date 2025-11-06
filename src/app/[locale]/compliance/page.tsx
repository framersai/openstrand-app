import { Metadata } from 'next';

import { LegalPageLayout } from '@/components/legal/legal-page-layout';

export const metadata: Metadata = {
  title: 'Compliance Overview - OpenStrand',
  description: 'Understand the compliance posture of OpenStrand and how we help regulated teams.',
};

const toc = [
  { id: 'frameworks', label: 'Compliance Frameworks' },
  { id: 'data-processing', label: 'Data Processing & DPAs' },
  { id: 'customer-obligations', label: 'Shared Responsibilities' },
  { id: 'audit', label: 'Audit Support' },
  { id: 'contact', label: 'Contact our Compliance Team' },
];

export default function CompliancePage() {
  return (
    <LegalPageLayout
      title="Compliance Overview"
      description="OpenStrand is built with privacy and governance in mind. This page outlines our compliance posture and how we partner with customers to meet regulatory requirements."
      lastUpdated="January 15, 2026"
      toc={toc}
    >
      <section id="frameworks">
        <h2>Compliance Frameworks</h2>
        <p>
          We maintain policies, controls, and documentation aligned to major privacy and security
          frameworks relevant to data visualization and knowledge management. Current initiatives
          include:
        </p>
        <ul>
          <li>SOC 2 Type II assessment (in progress).</li>
          <li>ISO 27001-aligned information security program.</li>
          <li>GDPR-compliant data processing practices with EU data residency options.</li>
          <li>Support for HIPAA-regulated workloads via signed Business Associate Agreements.</li>
        </ul>
      </section>

      <section id="data-processing">
        <h2>Data Processing &amp; DPAs</h2>
        <p>
          We act as a data processor for customer content uploaded to OpenStrand cloud instances.
          Customers remain the data controller. Our Data Processing Addendum (DPA) includes:
        </p>
        <ul>
          <li>Sub-processor inventory and notification commitments.</li>
          <li>Industry-standard security measures and incident response procedures.</li>
          <li>Support for international transfers (EU Standard Contractual Clauses).</li>
          <li>Assistance with data subject requests and deletion workflows.</li>
        </ul>
      </section>

      <section id="customer-obligations">
        <h2>Shared Responsibilities</h2>
        <p>
          Compliance is a shared effort. We operate secure infrastructure, but customers are
          responsible for:
        </p>
        <ul>
          <li>Determining whether OpenStrand meets their regulatory obligations.</li>
          <li>Configuring access controls, retention settings, and export policies.</li>
          <li>Managing user lifecycle and training team members on proper usage.</li>
          <li>Reviewing AI outputs for regulatory constraints before publishing.</li>
        </ul>
      </section>

      <section id="audit">
        <h2>Audit Support</h2>
        <p>
          Enterprise plans include audit assistance such as security questionnaires, penetration test
          summaries, and compliance documentation. We can also sign custom agreements where
          appropriate.
        </p>
      </section>

      <section id="contact">
        <h2>Contact our Compliance Team</h2>
        <p>
          Email{' '}
          <a href="mailto:compliance@frame.dev" className="text-primary underline-offset-4 hover:underline">
            compliance@frame.dev
          </a>{' '}
          to request security documentation, DPAs, or to report incidents.
        </p>
      </section>
    </LegalPageLayout>
  );
}
