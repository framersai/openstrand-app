import type { Metadata } from 'next';

import { UnifiedHeader } from '@/components/navigation/UnifiedHeader';
import { StrandUploadWizard } from '@/features/strands/upload/StrandUploadWizard';

export const metadata: Metadata = {
  title: 'Create Strand | OpenStrand',
  description:
    'Author strands with rich metadata, approvals, and provenance. Promote datasets into strands or compose new knowledge by hand.',
};

export default function StrandUploadPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/10">
      <UnifiedHeader />
      <main className="container mx-auto px-4 py-10">
        <StrandUploadWizard />
      </main>
    </div>
  );
}

