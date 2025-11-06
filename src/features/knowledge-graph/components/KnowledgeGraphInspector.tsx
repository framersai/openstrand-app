'use client';

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useLocalizedPath } from '@/hooks/useLocalizedPath';
import { useKnowledgeGraphStore } from '@/store/knowledge-graph.store';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { openstrandAPI } from '@/services/openstrand.api';

interface KnowledgeGraphInspectorProps {
  className?: string;
}

const NOTE_TYPE_OPTIONS = [
  { value: 'main', label: 'Main note' },
  { value: 'reference', label: 'Reference note' },
  { value: 'structure', label: 'Structure note' },
  { value: 'project', label: 'Project note' },
  { value: 'index', label: 'Index note' },
];

const DIFFICULTY_OPTIONS = [
  { value: '', label: 'Unspecified' },
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'expert', label: 'Expert' },
];

type StrandValidationState =
  | { status: 'idle'; message?: string }
  | { status: 'checking'; message?: string }
  | { status: 'valid'; message?: string }
  | { status: 'invalid'; message?: string }
  | { status: 'error'; message?: string };

/**
 * Side panel used alongside the knowledge graph canvas for inspecting and editing nodes and edges.
 * Provides metadata editing, strand linking, and inline composer access.
 */
export function KnowledgeGraphInspector({ className }: KnowledgeGraphInspectorProps) {
  const buildLocalizedPath = useLocalizedPath();
  const {
    selection,
    nodes,
    edges,
    readOnly,
    loading,
    updateNode,
    deleteNode,
    deleteEdge,
    weaveId,
    openComposerForNode,
  } = useKnowledgeGraphStore((state) => ({
    selection: state.selection,
    nodes: state.nodes,
    edges: state.edges,
    readOnly: state.readOnly,
    loading: state.loading,
    updateNode: state.updateNode,
    deleteNode: state.deleteNode,
    deleteEdge: state.deleteEdge,
    weaveId: state.weaveId,
    openComposerForNode: state.openComposerForNode,
  }));

  const selectedNode = selection.nodes.length ? nodes[selection.nodes[0]] : null;
  /**
   * Computes the localized composer URL for the currently selected node, when linked to a strand.
   */
  const composerHref = useMemo(() => {
    if (!selectedNode?.strandId) {
      return null;
    }
    return buildLocalizedPath(`/composer/${selectedNode.strandId}`);
  }, [buildLocalizedPath, selectedNode?.strandId]);
  const selectedEdge = useMemo(() => {
    if (!selection.edges.length) {
      return null;
    }
    const edgeId = selection.edges[0];
    return (
      Object.values(edges).find((edge) => {
        const key = edge.id ?? `${edge.source}::${edge.target}::${edge.type}`;
        return key === edgeId;
      }) ?? null
    );
  }, [selection.edges, edges]);

  const [title, setTitle] = useState('');
  const [type, setType] = useState('');
  const [summary, setSummary] = useState('');
  const [strandLink, setStrandLink] = useState('');
  const [noteType, setNoteType] = useState<string>('');
  const [tags, setTags] = useState('');
  const [difficulty, setDifficulty] = useState<string>('');
  const [strandValidation, setStrandValidation] = useState<StrandValidationState>({ status: 'idle' });
  const [isPending, startTransition] = useTransition();

  const tagSuggestions = useMemo(() => {
    const suggestionSet = new Set<string>();
    Object.values(nodes).forEach((node) => {
      const rawTags = Array.isArray(node.metadata?.tags)
        ? (node.metadata?.tags as string[])
        : typeof node.metadata?.tags === 'string'
          ? String(node.metadata.tags)
              .split(',')
              .map((tag) => tag.trim())
              .filter(Boolean)
          : [];
      rawTags.forEach((tag) => suggestionSet.add(tag));
    });
    return Array.from(suggestionSet).sort((a, b) => a.localeCompare(b));
  }, [nodes]);

  const filteredTagSuggestions = useMemo(() => {
    if (!tagSuggestions.length) {
      return [] as string[];
    }
    const currentEntries = tags
      .split(',')
      .map((tag) => tag.trim().toLowerCase())
      .filter(Boolean);
    const activeFilter = tags
      .split(',')
      .pop()?.trim().toLowerCase() ?? '';

    return tagSuggestions
      .filter((suggestion) => {
        const lower = suggestion.toLowerCase();
        if (currentEntries.includes(lower)) {
          return false;
        }
        if (!activeFilter) {
          return true;
        }
        return lower.includes(activeFilter);
      })
      .slice(0, 12);
  }, [tags, tagSuggestions]);

  useEffect(() => {
    if (selectedNode) {
      setTitle(selectedNode.title ?? '');
      setType(selectedNode.type ?? '');
      const summaryValue =
        typeof selectedNode.summary === 'string'
          ? selectedNode.summary
          : typeof selectedNode.metadata?.summary === 'string'
            ? (selectedNode.metadata.summary as string)
            : '';
      setSummary(summaryValue ?? '');
      setStrandLink(selectedNode.strandId ?? '');
      const existingNoteType =
        typeof selectedNode.metadata?.noteType === 'string'
          ? (selectedNode.metadata.noteType as string)
          : typeof (selectedNode.metadata as Record<string, unknown> | undefined)?.note_type === 'string'
            ? String((selectedNode.metadata as Record<string, unknown>).note_type)
            : '';
      setNoteType(existingNoteType ?? '');
      const existingTags = Array.isArray(selectedNode.metadata?.tags)
        ? (selectedNode.metadata?.tags as string[])
        : typeof (selectedNode.metadata as Record<string, unknown> | undefined)?.tags === 'string'
          ? String((selectedNode.metadata as Record<string, unknown>).tags).split(',').map((tag) => tag.trim()).filter(Boolean)
          : [];
      setTags(existingTags.join(', '));
      const existingDifficulty =
        typeof selectedNode.metadata?.difficulty === 'string'
          ? String(selectedNode.metadata.difficulty)
          : typeof (selectedNode.metadata as Record<string, unknown> | undefined)?.difficulty === 'string'
            ? String((selectedNode.metadata as Record<string, unknown>).difficulty)
            : '';
      setDifficulty(existingDifficulty ?? '');
      setStrandValidation({ status: selectedNode.strandId ? 'valid' : 'idle' });
    } else {
      setTitle('');
      setType('');
      setSummary('');
      setStrandLink('');
      setNoteType('');
      setTags('');
      setDifficulty('');
      setStrandValidation({ status: 'idle' });
    }
  }, [selectedNode]);

  useEffect(() => {
    const trimmed = strandLink.trim();

    if (!trimmed) {
      setStrandValidation({ status: 'idle' });
      return;
    }

    let cancelled = false;
    setStrandValidation({ status: 'checking', message: 'Looking up strand…' });

    const timeout = setTimeout(() => {
      void openstrandAPI.strands
        .get(trimmed)
        .then(() => {
          if (cancelled) return;
          setStrandValidation({ status: 'valid', message: 'Strand confirmed.' });
        })
        .catch((error) => {
          if (cancelled) return;
          const statusCode = (error as { status?: number })?.status;
          if (statusCode === 404) {
            setStrandValidation({ status: 'invalid', message: 'No strand found with this identifier.' });
            toast.error('Strand lookup failed — double-check the identifier.');
          } else {
            setStrandValidation({ status: 'error', message: 'Unable to verify strand right now.' });
            toast.error('Temporary issue verifying strand. Please retry shortly.');
          }
        });
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [strandLink]);

  const handleSaveNode = () => {
    if (!selectedNode) return;
    startTransition(async () => {
      try {
        const normalizedTags = tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean);
        await updateNode(selectedNode.id, {
          label: title.trim() || selectedNode.title,
          type: type.trim() || selectedNode.type,
          strandId: strandLink.trim() ? strandLink.trim() : null,
          metadata: {
            ...(selectedNode.metadata ?? {}),
            summary: summary.trim() || undefined,
            noteType: noteType.trim() || undefined,
            tags: normalizedTags.length ? normalizedTags : undefined,
            difficulty: difficulty || undefined,
          },
        });
        toast.success('Node updated');
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to update node');
      }
    });
  };

  const handleDeleteNode = () => {
    if (!selectedNode) return;
    startTransition(async () => {
      try {
        await deleteNode(selectedNode.id);
        toast.success('Node removed from graph');
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to remove node');
      }
    });
  };

  const handleDeleteEdge = () => {
    if (!selectedEdge) return;
    const edgeKey = selectedEdge.id ?? `${selectedEdge.source}::${selectedEdge.target}::${selectedEdge.type}`;
    startTransition(async () => {
      try {
        await deleteEdge(edgeKey);
        toast.success('Relationship deleted');
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to delete relationship');
      }
    });
  };

  const handleOpenInlineComposer = useCallback(() => {
    if (!selectedNode) {
      return;
    }
    openComposerForNode(selectedNode.id);
  }, [openComposerForNode, selectedNode?.id]);

  if (!selectedNode && !selectedEdge) {
    return (
      <div className={className}>
        <div className="rounded-2xl border border-dashed border-border/60 bg-muted/10 p-6 text-sm text-muted-foreground">
          Select a node or relationship to inspect metadata, edit details, or open the full composer.
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {selectedNode && (
        <div className="space-y-4 rounded-2xl border border-border/60 bg-background/80 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold">Node details</h3>
              <p className="text-xs text-muted-foreground">
                {readOnly
                  ? 'Viewing aggregated workspace graph (read-only). Select a workspace weave to edit.'
                  : 'Adjust the inline metadata or jump to the full composer for richer editing.'}
              </p>
            </div>
            {selectedNode.clusterId && (
              <Badge variant="outline">Cluster {selectedNode.clusterId.replace('cluster-', '#')}</Badge>
            )}
          </div>

          <div className="space-y-3">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground" htmlFor="kg-node-title">
                Title
              </label>
              <Input
                id="kg-node-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                disabled={readOnly || isPending || loading}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground" htmlFor="kg-node-type">
                Type
              </label>
              <Input
                id="kg-node-type"
                value={type}
                onChange={(event) => setType(event.target.value)}
                placeholder="concept, dataset, note…"
                disabled={readOnly || isPending || loading}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground" htmlFor="kg-node-summary">
                Summary
              </label>
              <Textarea
                id="kg-node-summary"
                value={summary}
                onChange={(event) => setSummary(event.target.value)}
                rows={5}
                disabled={readOnly || isPending || loading}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              onClick={handleSaveNode}
              disabled={readOnly || isPending || loading}
            >
              Save changes
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={handleOpenInlineComposer}
              disabled={readOnly || isPending || loading}
            >
              Inline composer
            </Button>
            {composerHref && (
              <Button asChild variant="outline" size="sm">
                <Link href={composerHref}>Open in composer</Link>
              </Button>
            )}
            <div className="flex-1" />
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive"
              onClick={handleDeleteNode}
              disabled={readOnly || isPending || loading}
            >
              Remove node
            </Button>
          </div>

          <Separator />

          <div className="grid gap-1 text-xs text-muted-foreground">
            <div>
              <span className="font-medium text-foreground">Node ID:</span> {selectedNode.id}
            </div>
            <div className="space-y-2 pt-3">
              <label className="text-[11px] font-medium uppercase text-muted-foreground" htmlFor="kg-node-strand-id">
                Strand Link
              </label>
              <Input
                id="kg-node-strand-id"
                value={strandLink}
                onChange={(event) => setStrandLink(event.target.value)}
                placeholder="Strand identifier (leave blank to detach)"
                disabled={readOnly || isPending || loading}
              />
              <p
                className={
                  strandValidation.status === 'invalid' || strandValidation.status === 'error'
                    ? 'text-[11px] text-destructive'
                    : strandValidation.status === 'valid'
                      ? 'text-[11px] text-emerald-500'
                      : 'text-[11px] text-muted-foreground'
                }
              >
                {strandValidation.status === 'idle'
                  ? 'Optional: link this node to a strand for inline authoring.'
                  : strandValidation.message ?? null}
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-medium uppercase text-muted-foreground" htmlFor="kg-node-note-type">
                Note Type
              </label>
              <Select
                value={noteType}
                onValueChange={setNoteType}
                disabled={readOnly || isPending || loading}
              >
                <SelectTrigger id="kg-node-note-type">
                  <SelectValue placeholder="Select note type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {NOTE_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-medium uppercase text-muted-foreground" htmlFor="kg-node-tags">
                Tags
              </label>
              <Input
                id="kg-node-tags"
                value={tags}
                onChange={(event) => setTags(event.target.value)}
                placeholder="Comma-separated tags (e.g., AI, graph theory)"
                disabled={readOnly || isPending || loading}
              />
              {filteredTagSuggestions.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {filteredTagSuggestions.map((suggestion) => (
                    <Button
                      key={suggestion}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-6 rounded-full px-3 text-[11px]"
                      onClick={() => {
                        const tokens = tags.split(',');
                        const trimmedTokens = tokens.map((token) => token.trim()).filter(Boolean);
                        if (trimmedTokens.includes(suggestion)) {
                          return;
                        }
                        if (!tokens.length) {
                          setTags(suggestion);
                          return;
                        }
                        const nextTokens = [...tokens];
                        nextTokens[nextTokens.length - 1] = ` ${suggestion}`;
                        const nextValue = nextTokens
                          .join(',')
                          .split(',')
                          .map((token) => token.trim())
                          .filter(Boolean)
                          .join(', ');
                        setTags(nextValue);
                      }}
                      disabled={readOnly || isPending || loading}
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-medium uppercase text-muted-foreground" htmlFor="kg-node-difficulty">
                Difficulty
              </label>
              <Select
                value={difficulty}
                onValueChange={setDifficulty}
                disabled={readOnly || isPending || loading}
              >
                <SelectTrigger id="kg-node-difficulty">
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  {DIFFICULTY_OPTIONS.map((option) => (
                    <SelectItem key={option.value || 'none'} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <span className="font-medium text-foreground">Importance:</span>{' '}
              {Number.isFinite(selectedNode.importance) ? selectedNode.importance.toFixed(2) : '1.00'}
            </div>
          </div>
        </div>
      )}

      {selectedEdge && (
        <div className="mt-6 space-y-4 rounded-2xl border border-border/60 bg-background/80 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Relationship</h3>
            <Badge variant="secondary">{selectedEdge.type}</Badge>
          </div>

          <div className="grid gap-2 text-xs text-muted-foreground">
            <div>
              <span className="font-medium text-foreground">Source:</span> {selectedEdge.source}
            </div>
            <div>
              <span className="font-medium text-foreground">Target:</span> {selectedEdge.target}
            </div>
            <div>
              <span className="font-medium text-foreground">Weight:</span>{' '}
              {Number.isFinite(selectedEdge.weight) ? selectedEdge.weight.toFixed(2) : '1.00'}
            </div>
            {selectedEdge.note && (
              <div>
                <span className="font-medium text-foreground">Note:</span> {selectedEdge.note}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {readOnly
                ? 'Relationships are read-only in aggregated mode.'
                : 'Deleting removes the relationship from this weave.'}
            </span>
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive"
              onClick={handleDeleteEdge}
              disabled={readOnly || isPending || loading}
            >
              Delete relationship
            </Button>
          </div>
        </div>
      )}

      {weaveId && (
        <p className="mt-6 text-[11px] text-muted-foreground">
          Workspace graph: <span className="font-semibold text-foreground">{weaveId}</span>
        </p>
      )}
    </div>
  );
}

export default KnowledgeGraphInspector;


