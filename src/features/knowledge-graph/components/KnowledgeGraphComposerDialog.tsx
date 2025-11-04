'use client';

import { useCallback, useMemo } from 'react';
import { toast } from 'react-hot-toast';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { StrandComposer } from '@/features/composer';
import { useKnowledgeGraphStore } from '@/store/knowledge-graph.store';

const ALLOWED_NOTE_TYPES = ['main', 'reference', 'structure', 'project', 'index'] as const;
type AllowedNoteType = typeof ALLOWED_NOTE_TYPES[number];

/**
 * Dialog wrapper that embeds the StrandComposer inline so authors can modify strand content without leaving the graph view.
 * Automatically syncs metadata back into the graph store after successful saves.
 */
export function KnowledgeGraphComposerDialog() {
  const {
    composerNodeId,
    nodes,
    closeComposer,
    refresh,
    readOnly,
    updateNode,
  } = useKnowledgeGraphStore((state) => ({
    composerNodeId: state.composerNodeId ?? null,
    nodes: state.nodes,
    closeComposer: state.closeComposer,
    refresh: state.refresh,
    readOnly: state.readOnly,
    updateNode: state.updateNode,
  }));

  const node = useMemo(() => (composerNodeId ? nodes[composerNodeId] : undefined), [composerNodeId, nodes]);
  const strandId = node?.strandId;
  const open = Boolean(composerNodeId);
  const nodeTags = useMemo(() => {
    if (!node) {
      return [] as string[];
    }
    if (Array.isArray(node.metadata?.tags)) {
      return node.metadata?.tags as string[];
    }
    if (typeof node.metadata?.tags === 'string') {
      return String(node.metadata.tags)
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean);
    }
    return [] as string[];
  }, [node]);
  const nodeDifficulty =
    typeof node?.metadata?.difficulty === 'string'
      ? (node.metadata?.difficulty as string)
      : undefined;
  const nodeNoteType = useMemo(() => {
    if (typeof node?.metadata?.noteType !== 'string') {
      return undefined;
    }
    const lower = node.metadata.noteType.toLowerCase();
    return ALLOWED_NOTE_TYPES.find((type) => type === lower) as AllowedNoteType | undefined;
  }, [node?.metadata?.noteType]);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        closeComposer();
        void refresh().catch((error) => {
          console.error('Failed to refresh knowledge graph after closing composer', error);
          toast.error('Unable to refresh graph. Changes may appear after the next sync.');
        });
      }
    },
    [closeComposer, refresh],
  );

  const handleSaveSuccess = useCallback(async (
    result: {
      strandId: string;
      title: string;
      summary: string;
      content: any;
      noteType: string;
      tags: string[];
      difficulty: string;
    },
  ) => {
    if (!node) {
      return;
    }

    try {
      await updateNode(node.id, {
        strandId: result.strandId,
        label: result.title,
        metadata: {
          ...(node.metadata ?? {}),
          summary: result.summary,
          noteType: result.noteType || undefined,
          tags: result.tags.length ? result.tags : undefined,
          difficulty: result.difficulty || undefined,
        },
      });
    } catch (error) {
      console.error('Failed to sync knowledge graph node after composer save', error);
      toast.error('Saved strand, but failed to sync graph node. Refresh to retry.');
    }
  }, [node, updateNode]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] w-[min(1100px,95vw)] overflow-hidden border-border/70 bg-background/98 p-0 shadow-2xl">
        <DialogHeader className="border-b border-border/60 px-6 py-4">
          <DialogTitle className="text-lg font-semibold">Inline strand composer</DialogTitle>
          <DialogDescription className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            {node ? (
              <>
                <span>
                  Editing node <span className="font-medium text-foreground">{node.title}</span>
                </span>
                {node.type ? <Badge variant="outline">{node.type}</Badge> : null}
                {readOnly ? (
                  <Badge variant="secondary">Aggregated graph (read-only)</Badge>
                ) : (
                  <Badge variant="secondary">Live workspace weave</Badge>
                )}
              </>
            ) : (
              <span>Select a knowledge node to open the composer.</span>
            )}
          </DialogDescription>
        </DialogHeader>

        {node ? (
          readOnly ? (
            <div className="flex flex-col gap-4 px-6 py-10 text-sm text-muted-foreground">
              <p>
                The aggregated workspace graph is read-only. Select a specific workspace weave to edit strands inline.
              </p>
              <Separator />
              <div>
                <Button size="sm" variant="outline" onClick={closeComposer}>
                  Close
                </Button>
              </div>
            </div>
          ) : (
            <ScrollArea className="max-h-[calc(90vh-96px)] px-6 py-6">
              <StrandComposer
                strandId={strandId ?? undefined}
                title={node.title}
                summary={
                  typeof node.summary === 'string'
                    ? node.summary
                    : typeof node.metadata?.summary === 'string'
                      ? (node.metadata.summary as string)
                      : ''
                }
                noteType={nodeNoteType}
                tags={nodeTags}
                difficulty={nodeDifficulty}
                onSaveSuccess={handleSaveSuccess}
              />
              {!strandId && (
                <div className="mt-6 rounded-xl border border-dashed border-border/60 bg-muted/20 px-4 py-3 text-xs text-muted-foreground">
                  Saving will create a new strand and link it to this node automatically.
                </div>
              )}
            </ScrollArea>
          )
        ) : (
          <div className="flex flex-col gap-4 px-6 py-10 text-sm text-muted-foreground">
            <p>Select a node with strand content to open the inline composer.</p>
            <Separator />
            <div>
              <Button size="sm" variant="outline" onClick={closeComposer}>
                Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
