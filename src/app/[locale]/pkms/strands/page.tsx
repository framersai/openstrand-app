import { StrandsManager } from '@/components/pkms/strands/StrandsManager';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Strands | OpenStrand PKMS',
  description: 'Manage your knowledge strands - documents, notes, media, and datasets all in one place.',
};

export default function StrandsPage() {
  return (
    <main className="min-h-screen">
      <div className="border-b border-border/40 bg-gradient-to-b from-background to-primary/5">
        <div className="container mx-auto px-4 py-12">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-4 text-4xl font-bold tracking-tight">
              My Strands
            </h1>
            <p className="text-lg text-muted-foreground">
              All your knowledge in one place. Search, filter, and organize your content strands.
            </p>
          </div>
        </div>
      </div>

      <StrandsManager />
    </main>
  );
}
