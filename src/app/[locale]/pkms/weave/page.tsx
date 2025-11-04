import { WeaveVisualization } from '@/components/pkms/weave/WeaveVisualization';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Knowledge Graph | OpenStrand PKMS',
  description: 'Explore your interconnected knowledge graph. Discover relationships and learning paths.',
};

export default function WeavePage() {
  return (
    <main className="min-h-screen">
      <div className="border-b border-border/40 bg-gradient-to-b from-background to-primary/5">
        <div className="container mx-auto px-4 py-12">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-4 text-4xl font-bold tracking-tight">
              Your Knowledge Graph
            </h1>
            <p className="text-lg text-muted-foreground">
              Explore connections between your strands. Discover patterns and find optimal learning paths.
            </p>
          </div>
        </div>
      </div>

      <WeaveVisualization />
    </main>
  );
}
