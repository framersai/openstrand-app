import { Metadata } from 'next';

import { LegalPageLayout } from '@/components/legal/legal-page-layout';

export const metadata: Metadata = {
  title: 'Terms of Service - OpenStrand',
  description: 'Understand the rules that govern your use of the OpenStrand platform.',
};

const toc = [
  { id: 'overview', label: '1. Overview' },
  { id: 'eligibility', label: '2. Eligibility' },
  { id: 'accounts', label: '3. Accounts & Responsibilities' },
  { id: 'acceptable-use', label: '4. Acceptable Use' },
  { id: 'subscriptions', label: '5. Subscriptions & Billing' },
  { id: 'service', label: '6. Service Commitments' },
  { id: 'termination', label: '7. Termination' },
  { id: 'changes', label: '8. Changes to these Terms' },
];

export default function TermsPage() {
  return (
    <LegalPageLayout
      title="Terms of Service"
      description="These terms form a binding agreement between you and OpenStrand. They describe what you can expect from us and what we in turn expect from you."
      lastUpdated="January 15, 2026"
      toc={toc}
    >
      <section id="overview">
        <h2>1. Overview</h2>
        <p>
          OpenStrand helps individuals and teams explore, visualize, and narrate knowledge across
          offline and cloud environments. By creating an account, downloading the local client, or
          interacting with our services, you agree to these Terms of Service.
        </p>
      </section>

      <section id="eligibility">
        <h2>2. Eligibility</h2>
        <p>
          You must be at least 16 years old (or the age of digital consent in your jurisdiction) to
          use OpenStrand. If you accept these terms on behalf of an organization, you represent that
          you have authority to bind that organization.
        </p>
      </section>

      <section id="accounts">
        <h2>3. Accounts &amp; Responsibilities</h2>
        <ul>
          <li>Provide accurate registration information and keep it up to date.</li>
          <li>Safeguard your login credentials and notify us of any unauthorized use.</li>
          <li>Ensure your use of OpenStrand complies with applicable laws and policies.</li>
          <li>
            When using the offline client, you are responsible for local backups and device
            security.
          </li>
        </ul>
      </section>

      <section id="acceptable-use">
        <h2>4. Acceptable Use</h2>
        <p>You may not:</p>
        <ul>
          <li>Use OpenStrand to distribute malware, spam, or harmful content.</li>
          <li>Reverse engineer, decompile, or attempt to access restricted systems.</li>
          <li>Overload or disrupt OpenStrand infrastructure or third-party providers.</li>
          <li>Misrepresent your identity or affiliation when using collaboration features.</li>
        </ul>
      </section>

      <section id="subscriptions">
        <h2>5. Subscriptions &amp; Billing</h2>
        <p>
          Certain features—such as Tier 2 dynamic visualizations or BYOK orchestration—require a
          paid plan. Pricing and plan details are available on our website.
        </p>
        <ul>
          <li>Fees are billed in advance and are non-refundable unless required by law.</li>
          <li>Plans renew automatically unless you cancel before the end of the current term.</li>
          <li>You may downgrade to the offline-only plan at any time; cloud features will pause immediately.</li>
        </ul>
      </section>

      <section id="service">
        <h2>6. Service Commitments</h2>
        <p>
          We aim to provide a highly reliable platform and will communicate scheduled maintenance in
          advance. The offline client remains fully functional when our cloud services are
          unavailable.
        </p>
        <p>
          OpenStrand is provided “as-is”. To the maximum extent permitted by law, we disclaim
          warranties for fitness, merchantability, and non-infringement.
        </p>
      </section>

      <section id="termination">
        <h2>7. Termination</h2>
        <ul>
          <li>You may terminate your account at any time via the billing or account settings page.</li>
          <li>
            We may suspend or terminate access if you breach these terms, violate the law, or pose a
            security risk to the service.
          </li>
          <li>
            Upon termination we will delete account data from cloud systems, subject to legal retention requirements. Local data stored in the offline client remains on your device.
          </li>
        </ul>
      </section>

      <section id="changes">
        <h2>8. Changes to these Terms</h2>
        <p>
          We may update these terms to reflect new features, legal requirements, or changes to our
          business. When we do, we will post the updated terms and provide reasonable notice. Your
          continued use after the effective date constitutes acceptance.
        </p>
      </section>
    </LegalPageLayout>
  );
}
