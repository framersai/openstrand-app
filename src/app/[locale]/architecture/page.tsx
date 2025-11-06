import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Locale } from '@/i18n/config';

export default function ArchitecturePage({ params }: { params: { locale: Locale } }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <main className="container mx-auto max-w-5xl px-6 py-16">
        <div className="mb-8 space-y-3 text-center">
          <h1 className="text-3xl font-semibold tracking-tight">Architecture</h1>
          <p className="text-sm text-muted-foreground">Storage, OCR/Speech flows, BYOK vs hosted keys, billing and backups.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Storage & Backups</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>Local SQL for drafts, S3-compatible object storage for attachments, Postgres for metadata. Backups via bucket versioning + pg_dump.</p>
              <Link href="https://github.com/framersai/openstrand/tree/main/docs/STORAGE_AND_BACKUPS.md" className="text-primary hover:underline" target="_blank">Read the doc ↗</Link>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Billing & Rate Limits</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>BYOK calls do not count against hosted credits. Hosted/global keys are metered monthly and visible in dashboard usage.</p>
              <Link href="https://github.com/framersai/openstrand/tree/main/docs/BILLING_AND_RATE_LIMITS.md" className="text-primary hover:underline" target="_blank">Read the doc ↗</Link>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Environment & Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>All env variables documented including OCR, Speech, storage, billing, and admin bootstrap credentials.</p>
              <Link href="https://github.com/framersai/openstrand/tree/main/docs/ENVIRONMENT.md" className="text-primary hover:underline" target="_blank">Environment doc ↗</Link>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>OpenAPI & SDK</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>Live OpenAPI schema and typed SDK for strands, weaves, attachments, and billing flows.</p>
              <Link href="/docs" className="text-primary hover:underline">Open API docs ↗</Link>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}


