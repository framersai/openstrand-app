import type { Metadata } from 'next';

import { UnifiedHeader } from '@/components/navigation/UnifiedHeader';
import { DatasetSubmissionWizard } from '@/features/catalogs/components/DatasetSubmissionWizard';

export const metadata: Metadata = {
  title: 'Submit Dataset | OpenStrand',
  description:
    'Share structured data with the OpenStrand community. Auto-profile your upload, attach licensing, and publish with provenance.',
};

export default function CatalogSubmissionPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <UnifiedHeader />
      <main className="container mx-auto px-4 py-10">
        <DatasetSubmissionWizard />
      </main>
    </div>
  );
}

