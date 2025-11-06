import { KnowledgeGraphPanel } from '@/features/knowledge-graph';

/**
 * Page-level wrapper for the knowledge graph experience.
 * Provides a responsive container around the panel without altering its internals.
 */
export function KnowledgeGraphLayout() {
  return (
    <section className="relative w-full">
      <div className="container mx-auto px-4 py-6">
        <KnowledgeGraphPanel className="rounded-3xl border border-border/60 bg-background/90 p-4 shadow-2xl" />
      </div>
    </section>
  );
}
