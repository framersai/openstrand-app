import { Metadata } from 'next';

import { LegalPageLayout } from '@/components/legal/legal-page-layout';

export const metadata: Metadata = {
  title: 'Privacy Policy - OpenStrand',
  description: 'Learn how OpenStrand collects, uses, and protects your personal information.',
};

const toc = [
  { id: 'information-we-collect', label: 'Information We Collect' },
  { id: 'how-we-use', label: 'How We Use Information' },
  { id: 'offline-mode', label: 'Offline Mode & Local Storage' },
  { id: 'data-storage', label: 'Data Storage & Security' },
  { id: 'third-parties', label: 'Third-Party Services' },
  { id: 'your-rights', label: 'Your Rights' },
  { id: 'contact', label: 'Contact' },
];

export default function PrivacyPolicyPage() {
  return (
    <LegalPageLayout
      title="Privacy Policy"
      description="OpenStrand is designed for privacy-first knowledge work. This policy explains how we collect, use, store, and protect personal data across our offline and cloud deployments."
      lastUpdated="January 15, 2026"
      toc={toc}
    >
      <section id="information-we-collect">
        <h2>Information We Collect</h2>
        <p>
          OpenStrand collects only the data required to provide the product experience you choose. In
          the local client we process everything on-device. When you connect to the cloud, we may
          collect:
        </p>
        <ul>
          <li>
            <strong>Account details</strong> such as name, email address, and locale preferences.
          </li>
          <li>
            <strong>Workspace usage</strong> including visualization types generated, datasets
            accessed, and plan tier information.
          </li>
          <li>
            <strong>Technical diagnostics</strong> like browser metadata, device type, and crash
            logs to help us secure and improve the service.
          </li>
          <li>
            <strong>Optional analytics</strong> (Google Analytics, Microsoft Clarity) only when you
            explicitly accept our GDPR-compliant consent prompt.
          </li>
        </ul>
      </section>

      <section id="how-we-use">
        <h2>How We Use Information</h2>
        <p>We use collected information to:</p>
        <ul>
          <li>Operate, maintain, and improve OpenStrand features and infrastructure.</li>
          <li>Deliver optional tiered services such as dynamic visualizations and AI overlays.</li>
          <li>Provide customer support, respond to inquiries, and troubleshoot issues.</li>
          <li>Enforce our terms of service, prevent abuse, and comply with legal obligations.</li>
          <li>
            Send transactional communications (e.g., account changes, incident notices). Marketing
            messages are opt-in only.
          </li>
        </ul>
      </section>

      <section id="offline-mode">
        <h2>Offline Mode &amp; Local Storage</h2>
        <p>
          The OpenStrand desktop and LAN deployments operate without any network connection. In this
          mode:
        </p>
        <ul>
          <li>All datasets, strands, and generated content remain on your device in encrypted SQLite databases.</li>
          <li>No analytics, crash reporting, or usage telemetry is sent to OpenStrand services.</li>
          <li>You can opt to connect later and selectively sync strands or upload analytics.</li>
        </ul>
        <p>
          When offline, features that require cloud resources (e.g., BYOK AI execution) are hidden,
          and GDPR-tracked tooling—including analytics scripts—is fully disabled.
        </p>
      </section>

      <section id="data-storage">
        <h2>Data Storage &amp; Security</h2>
        <p>
          We apply layered security controls to protect personal data regardless of deployment:
        </p>
        <ul>
          <li>Encryption in transit (TLS 1.2+) and at rest (AES-256) for cloud databases.</li>
          <li>Principle of least privilege for employee access and scoped service roles.</li>
          <li>Quarterly vulnerability assessments and annual third-party penetration tests.</li>
          <li>Hourly incremental backups with 30-day retention for production clusters.</li>
          <li>ISO 27001-aligned policies and SOC 2 Type II attestation (in progress).</li>
        </ul>
      </section>

      <section id="third-parties">
        <h2>Third-Party Services</h2>
        <p>
          When you enable cloud features we rely on carefully vetted processors. Each partner is
          bound by data-processing agreements (DPAs) and security reviews:
        </p>
        <ul>
          <li>
            <strong>Supabase</strong> for authentication, database hosting, and object storage.
          </li>
          <li>
            <strong>Vercel</strong> for CDN caching and application delivery.
          </li>
          <li>
            <strong>Stripe</strong> or <strong>Lemon Squeezy</strong> for billing (card information is never stored on OpenStrand systems).
          </li>
          <li>
            <strong>Optional AI providers</strong> (OpenAI, Anthropic, OpenRouter) when you supply your own API keys.
          </li>
        </ul>
        <p>
          We do not sell personal information. Data is shared only to deliver the services you have
          enabled or when legally required.
        </p>
      </section>

      <section id="your-rights">
        <h2>Your Rights</h2>
        <p>Depending on your region, you may request the following at any time:</p>
        <ul>
          <li>Access or export of the personal data we store about you.</li>
          <li>Correction of inaccurate or outdated information.</li>
          <li>Deletion of personal data, subject to contractual or legal obligations.</li>
          <li>Restriction or objection to specific processing activities.</li>
          <li>Withdrawal of consent for optional analytics or marketing.</li>
          <li>Filing a complaint with your local supervisory authority.</li>
        </ul>
      </section>

      <section id="contact">
        <h2>Contact</h2>
        <p>
          Privacy questions, requests, or incident reports can be sent to our dedicated team. We aim
          to respond within 72 hours.
        </p>
        <address className="not-italic">
          <strong>Frame.dev (Manic Agency LLC)</strong>
          <br />
          321 Market Street, Suite 500
          <br />
          San Francisco, CA 94105, USA
          <br />
          <a className="text-primary underline-offset-4 hover:underline" href="mailto:privacy@frame.dev">
            privacy@frame.dev
          </a>
        </address>
      </section>
    </LegalPageLayout>
  );
}
