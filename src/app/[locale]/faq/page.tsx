import type { Locale } from '@/i18n/config';

export default function FAQPage({ params }: { params: { locale: Locale } }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <main className="container mx-auto max-w-3xl px-6 py-16">
        <div className="mb-8 space-y-3 text-center">
          <h1 className="text-3xl font-semibold tracking-tight">FAQ</h1>
          <p className="text-sm text-muted-foreground">Answers to common questions about privacy, billing, and offline mode.</p>
        </div>

        <div className="space-y-6 text-sm">
          <div>
            <h3 className="text-base font-semibold">Do you store my content?</h3>
            <p className="text-muted-foreground">Drafts are local by default. Attachments you upload to cloud are stored in your S3-compatible bucket with signed URLs. See the Storage & Backups doc for details.</p>
          </div>
          <div>
            <h3 className="text-base font-semibold">How do credits work with BYOK?</h3>
            <p className="text-muted-foreground">Calls made with your own keys (BYOK) don’t count against hosted credits. Hosted keys are metered by plan and surfaced in the dashboard usage card.</p>
          </div>
          <div>
            <h3 className="text-base font-semibold">Can I run fully offline?</h3>
            <p className="text-muted-foreground">Yes. The local SQL adapter stores drafts and media. You can sync later to a Teams deployment for collaboration and backups.</p>
          </div>
          <div>
            <h3 className="text-base font-semibold">Is there an admin dashboard?</h3>
            <p className="text-muted-foreground">Yes. Admin APIs are exposed in the OpenAPI docs. Team API tokens can be created in Settings for CI and integrations.</p>
          </div>
        </div>
      </main>
    </div>
  );
}


