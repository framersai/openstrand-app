import { ImportInterface } from '@/components/pkms/import/ImportInterface';
import { ImportHistory } from '@/components/pkms/import/ImportHistory';
import { SupportedFormats } from '@/components/pkms/import/SupportedFormats';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Import Content | OpenStrand PKMS',
  description: 'Import documents, media, and data into your personal knowledge management system. Support for 20+ file formats.',
};

export default function ImportPage() {
  return (
    <main className="min-h-screen">
      <div className="border-b border-border/40 bg-gradient-to-b from-background to-primary/5">
        <div className="container mx-auto px-4 py-12">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-4 text-4xl font-bold tracking-tight">
              Import Your Knowledge
            </h1>
            <p className="text-lg text-muted-foreground">
              Bring all your documents, notes, and media into OpenStrand. 
              We'll automatically organize and connect everything.
            </p>
          </div>
        </div>
      </div>

      <ImportInterface />
      <SupportedFormats />
      <ImportHistory />
    </main>
  );
}
