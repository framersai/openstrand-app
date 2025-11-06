'use client';

/**
 * @module features/dashboard/components/DatasetInspectorPanel
 * @description Consolidated inspector surface that ties together dataset metadata, summaries, notes, and AI insights.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  ExternalLink,
  Loader2,
  NotebookPen,
  RefreshCw,
  Sparkles,
  Workflow,
  ShieldAlert,
  ShieldCheck,
  Settings2,
  Eye,
  Check,
  X,
  Ban,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { DatasetMetadata, DatasetSummary } from '@/types';
import type { Strand, StrandStructureRequest } from '@/types/openstrand';
import { openstrandAPI } from '@/services/openstrand.api';
import {
  saveDatasetNote,
  listDatasetNotes,
  type DatasetNoteSummary,
} from '@/services/dataset-notes.service';
import { useOpenStrandStore } from '@/store/openstrand.store';
import { DatasetSummaryPanel } from './DatasetSummaryPanel';
import { AutoInsightsPanel } from './AutoInsightsPanel';
import { DatasetNoteComposer } from './DatasetNoteComposer';
import type { AutoInsightsSnapshot } from './VisualizeTabContent';

interface DatasetInspectorPanelProps {
  datasetName?: string | null;
  datasetId?: string | null;
  metadata?: DatasetMetadata | null;
  summary: DatasetSummary | null;
  isSummaryLoading: boolean;
  autoInsights: AutoInsightsSnapshot;
  onRefreshSummary?: () => void;
  onRunAutoInsights?: () => void;
  onViewRecommendations?: () => void;
  hasDataset?: boolean;
  onNoteSaved?: (note: Strand) => void;
}

export function DatasetInspectorPanel({
  datasetName,
  datasetId,
  metadata,
  summary,
  isSummaryLoading,
  autoInsights,
  onRefreshSummary,
  onRunAutoInsights,
  onViewRecommendations,
  hasDataset = false,
  onNoteSaved,
}: DatasetInspectorPanelProps) {
  const datasetIdentifier = useMemo(
    () => datasetId ?? metadata?.datasetId ?? summary?.datasetId ?? null,
    [datasetId, metadata?.datasetId, summary?.datasetId],
  );

  const [noteSummaries, setNoteSummaries] = useState<DatasetNoteSummary[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [noteViewerOpen, setNoteViewerOpen] = useState(false);
  const [noteViewerLoading, setNoteViewerLoading] = useState(false);
  const [activeNote, setActiveNote] = useState<Strand | null>(null);
  const [lastSavedNote, setLastSavedNote] = useState<Strand | null>(null);
  const loadStructureRequests = useOpenStrandStore((state) => state.loadStructureRequests);
  const resolveStructureRequest = useOpenStrandStore((state) => state.resolveStructureRequest);
  const loadPlaceholderPreferences = useOpenStrandStore((state) => state.loadPlaceholderPreferences);
  const updatePlaceholderPreferences = useOpenStrandStore((state) => state.updatePlaceholderPreferences);
  const placeholderPreferences = useOpenStrandStore((state) => state.placeholderPreferences);

  const [structureRequests, setStructureRequests] = useState<StrandStructureRequest[]>([]);
  const [structureLoading, setStructureLoading] = useState(false);
  const [placeholderDialogOpen, setPlaceholderDialogOpen] = useState(false);
  const [placeholderText, setPlaceholderText] = useState('');
  const [placeholderIcon, setPlaceholderIcon] = useState('');

  const [selectedNoteType, setSelectedNoteType] = useState<string>('all');
  const [selectedAuthor, setSelectedAuthor] = useState<string>('all');

  const rowCount = metadata?.rowCount ?? summary?.rowCount ?? null;
  const columnCount = metadata?.columns.length ?? summary?.columnCount ?? null;
  const lastUpdatedIso = metadata?.uploadedAt ?? summary?.generatedAt ?? null;
  const intelligenceStatus =
    metadata?.intelligenceStatus ??
    (metadata?.intelligenceReady === true
      ? 'Ready'
      : metadata?.intelligenceReady === false
        ? 'Processing'
        : null);
  const friendlyName =
    datasetName ?? metadata?.filename ?? summary?.datasetId ?? 'Active dataset';

  const formattedUpdated =
    lastUpdatedIso && !Number.isNaN(new Date(lastUpdatedIso).getTime())
      ? new Date(lastUpdatedIso).toLocaleString(undefined, {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : null;

  const pendingStructureCount = useMemo(() => structureRequests.filter((request) => request.status === 'PENDING').length, [structureRequests]);

  const placeholderDefaults = useMemo(() => placeholderPreferences?.default ?? { text: 'Hidden strand', icon: 'ph:lock' }, [placeholderPreferences]);

  const formatStructureType = useCallback(
    (type: string) =>
      type
        .toLowerCase()
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase()),
    [],
  );

  const handleSavePlaceholderPreferences = useCallback(async () => {
    const updated = await updatePlaceholderPreferences({
      default: {
        text: placeholderText.trim() || 'Hidden strand',
        icon: placeholderIcon.trim() || undefined,
      },
      scopes: placeholderPreferences?.scopes,
    });
    if (updated) {
      toast.success('Placeholder settings updated');
      setPlaceholderDialogOpen(false);
    }
  }, [placeholderText, placeholderIcon, updatePlaceholderPreferences, placeholderPreferences]);

  const handleResolveStructureRequest = useCallback(
    async (
      request: StrandStructureRequest,
      action: 'approve' | 'reject' | 'cancel',
      note?: string,
    ) => {
      if (!datasetIdentifier) {
        toast.error('Dataset context missing for structure action');
        return;
      }

      const actionVerb = action === 'approve' ? 'Approving' : action === 'reject' ? 'Rejecting' : 'Cancelling';
      const successMessage =
        action === 'approve'
          ? 'Structure change approved'
          : action === 'reject'
            ? 'Structure change rejected'
            : 'Structure request cancelled';

      const toastId = toast.loading(`${actionVerb} structure request...`);
      setResolvingRequestId(request.id);
      try {
        await resolveStructureRequest(request.id, action, note);
        toast.success(successMessage, { id: toastId });
        setStructureLoading(true);
        const refreshed = await loadStructureRequests(datasetIdentifier);
        setStructureRequests(refreshed);
        setStructureResolutionNote('');
      } catch (error) {
        console.error('Failed to resolve structure request', error);
        toast.error('Unable to resolve structure request', { id: toastId });
      } finally {
        setResolvingRequestId(null);
        setStructureLoading(false);
      }
    },
    [datasetIdentifier, loadStructureRequests, resolveStructureRequest],
  );

  const handleOpenStructureDetail = useCallback((request: StrandStructureRequest) => {
    setStructureDetail(request);
    setStructureDetailOpen(true);
  }, []);

  const hasInsights =
    Boolean(autoInsights?.insights) || Boolean(autoInsights?.status) || autoInsights.isLoading;

  const refreshNotes = useCallback(async () => {
    if (!datasetIdentifier) {
      setNoteSummaries([]);
      return;
    }

    setNotesLoading(true);
    try {
      const notes = await listDatasetNotes(datasetIdentifier, 5);
      setNoteSummaries(notes);
    } catch (error) {
      console.warn('Failed to load dataset notes', error);
      toast.error('Unable to load dataset notes');
    } finally {
      setNotesLoading(false);
    }
  }, [datasetIdentifier]);

  useEffect(() => {
    if (!datasetIdentifier) {
      setNoteSummaries([]);
      return;
    }
    void refreshNotes();
  }, [datasetIdentifier, refreshNotes]);

  useEffect(() => {
    setLastSavedNote(null);
  }, [datasetIdentifier]);

  useEffect(() => {
    if (!datasetIdentifier) {
      setStructureRequests([]);
      return;
    }

    let cancelled = false;
    const fetchRequests = async () => {
      setStructureLoading(true);
      try {
        const requests = await loadStructureRequests(datasetIdentifier);
        if (!cancelled) {
          setStructureRequests(requests);
        }
      } catch (error) {
        if (!cancelled) {
          toast.error('Unable to load structure requests');
        }
      } finally {
        if (!cancelled) {
          setStructureLoading(false);
        }
      }
    };

    void fetchRequests();
    return () => {
      cancelled = true;
    };
  }, [datasetIdentifier, loadStructureRequests]);

  useEffect(() => {
    setStructureDetail((current) => {
      if (structureRequests.length === 0) {
        return null;
      }
      if (current) {
        const match = structureRequests.find((request) => request.id === current.id);
        return match ?? structureRequests[0];
      }
      return structureRequests[0];
    });
  }, [structureRequests]);


  useEffect(() => {
    void loadPlaceholderPreferences();
  }, [loadPlaceholderPreferences]);

  useEffect(() => {
    if (!placeholderDialogOpen) {
      return;
    }

    const defaults = placeholderPreferences?.default ?? { text: 'Hidden strand', icon: 'ph:lock' };
    setPlaceholderText(defaults.text ?? '');
    setPlaceholderIcon(defaults.icon ?? '');
  }, [placeholderDialogOpen, placeholderPreferences]);

  const noteTypeOptions = useMemo(() => {
    const unique = new Set<string>();
    noteSummaries.forEach((note) => {
      if (note.noteType) {
        unique.add(note.noteType);
      }
    });
    return Array.from(unique);
  }, [noteSummaries]);

  const authorOptions = useMemo(() => {
    const unique = new Set<string>();
    noteSummaries.forEach((note) => {
      if (note.authorId) {
        unique.add(note.authorId);
      }
    });
    return Array.from(unique);
  }, [noteSummaries]);

  useEffect(() => {
    if (selectedNoteType !== 'all' && !noteTypeOptions.includes(selectedNoteType)) {
      setSelectedNoteType('all');
    }
  }, [noteTypeOptions, selectedNoteType]);

  useEffect(() => {
    if (selectedAuthor !== 'all' && !authorOptions.includes(selectedAuthor)) {
      setSelectedAuthor('all');
    }
  }, [authorOptions, selectedAuthor]);

  const filteredNotes = useMemo(() => {
    return noteSummaries.filter((note) => {
      const matchesType =
        selectedNoteType === 'all' || note.noteType === selectedNoteType;
      const matchesAuthor =
        selectedAuthor === 'all' || note.authorId === selectedAuthor;
      return matchesType && matchesAuthor;
    });
  }, [noteSummaries, selectedNoteType, selectedAuthor]);

  const handleRunInsights = useCallback(() => {
    onRunAutoInsights?.();
  }, [onRunAutoInsights]);

  const handleViewRecommendations = useCallback(() => {
    onViewRecommendations?.();
  }, [onViewRecommendations]);

  const handleViewNote = useCallback(async (noteId: string) => {
    setNoteViewerLoading(true);
    try {
      let strand = await openstrandAPI.strands.get(noteId);

      const existingMetadata =
        typeof strand.content?.metadata === 'object' && strand.content?.metadata !== null
          ? { ...(strand.content.metadata as Record<string, unknown>) }
          : {};

      const plainText =
        typeof existingMetadata.plainText === 'string'
          ? (existingMetadata.plainText as string)
          : undefined;

      if (!plainText) {
        const fallbackPlain =
          noteSummaries.find((note) => note.id === noteId)?.plainText ??
          strand.summary ??
          '';

        if (fallbackPlain) {
          const updatedContent = {
            ...(strand.content ?? {}),
            metadata: {
              ...existingMetadata,
              plainText: fallbackPlain,
              hydratedAt: new Date().toISOString(),
            },
          };

          try {
            await openstrandAPI.strands.update(noteId, {
              content: updatedContent,
            });
            strand = {
              ...strand,
              content: updatedContent as Strand['content'],
            };
            void refreshNotes();
          } catch (error) {
            console.warn('Failed to persist plain text metadata for note', error);
          }
        }
      }

      setActiveNote(strand);
      setNoteViewerOpen(true);
    } catch (error) {
      console.error('Failed to load note', error);
      toast.error('Unable to open note');
    } finally {
      setNoteViewerLoading(false);
    }
  }, [noteSummaries, refreshNotes]);

  const handleDatasetNoteSave = useCallback(
    async ({ content, plainText }: { content: Record<string, any>; plainText: string }) => {
      if (!plainText.trim()) {
        toast.error('Write a note before saving.');
        throw new Error('Note content is empty');
      }

      try {
        const strand = await saveDatasetNote({
          datasetId: datasetIdentifier,
          datasetName: friendlyName,
          content,
          plainText,
        });
        setLastSavedNote(strand);
        onNoteSaved?.(strand);
        toast.success('Note saved to strands');
        void refreshNotes();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unable to save note. Please try again.';
        toast.error(message);
        throw error instanceof Error ? error : new Error(message);
      }
    },
    [datasetIdentifier, friendlyName, onNoteSaved, refreshNotes],
  );

  return (
    <section className="mb-8 rounded-3xl border border-border/60 bg-card/70 p-6 shadow-sm shadow-primary/5">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold tracking-tight text-foreground">{friendlyName}</h2>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {rowCount !== null && (
              <span>
                {rowCount.toLocaleString()} rows • {columnCount?.toLocaleString() ?? '0'} columns
              </span>
            )}
            {formattedUpdated && <span>Updated {formattedUpdated}</span>}
            {metadata?.language && <span>Language: {metadata.language}</span>}
            {intelligenceStatus && (
              <span>
                Schema intelligence: <Badge variant="secondary">{intelligenceStatus}</Badge>
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={onRefreshSummary}
            disabled={!hasDataset || isSummaryLoading}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh summary
          </Button>
          <Button
            size="sm"
            onClick={handleRunInsights}
            disabled={!hasDataset || autoInsights.isLoading}
            className="gap-2"
          >
            <Sparkles className="h-4 w-4" />
            Run Auto Insights
          </Button>
        </div>
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <DatasetSummaryPanel
            summary={summary}
            isLoading={isSummaryLoading}
            onRefresh={onRefreshSummary}
            disableRefresh={isSummaryLoading}
          />

          <DatasetNoteComposer datasetName={friendlyName} onSave={handleDatasetNoteSave} />

          <div className="rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-primary">Knowledge strands</p>
                <p className="text-xs text-primary/80">
                  Promote saved notes or visualisations into the PKMS to keep teams aligned.
                </p>
              </div>
              <Workflow className="h-5 w-5 text-primary/80" />
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button asChild size="sm" variant="secondary" className="gap-2">
                <Link href="/pkms/strands">
                  <Workflow className="h-4 w-4" />
                  Open strands
                </Link>
              </Button>
              <Button asChild size="sm" variant="ghost" className="gap-2 text-primary">
                <Link href="/pkms/import">
                  <NotebookPen className="h-4 w-4" />
                  New strand
                </Link>
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="gap-2 text-primary"
                onClick={() => void refreshNotes()}
                disabled={notesLoading}
              >
                {notesLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Refresh notes
              </Button>
            </div>

            {lastSavedNote && (
              <div className="mt-3 rounded-lg border border-primary/20 bg-primary/10 px-3 py-2 text-xs text-primary">
                <p className="font-medium">Latest note saved:</p>
                <p className="truncate text-primary/80">{lastSavedNote.title}</p>
              </div>
            )}

            <div className="mt-4 space-y-2">
              <div className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-primary/70 sm:flex-row sm:items-center sm:justify-between">
                <span>Recent dataset notes</span>
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-normal normal-case">
                  <Select value={selectedNoteType} onValueChange={setSelectedNoteType}>
                    <SelectTrigger className="h-8 w-32 text-xs">
                      <SelectValue placeholder="Note type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All types</SelectItem>
                      {noteTypeOptions.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={selectedAuthor} onValueChange={setSelectedAuthor}>
                    <SelectTrigger className="h-8 w-40 text-xs">
                      <SelectValue placeholder="Author" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All authors</SelectItem>
                      {authorOptions.map((author) => (
                        <SelectItem key={author} value={author}>
                          {author}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {notesLoading ? (
                <div className="flex items-center gap-2 text-xs text-primary/80">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Loading notes…
                </div>
              ) : filteredNotes.length === 0 ? (
                <p className="text-xs text-primary/70">
                  {noteSummaries.length === 0
                    ? 'Notes you capture here will appear in this list for quick access.'
                    : 'No notes match the selected filters.'}
                </p>
              ) : (
                <ul className="space-y-2">
                  {filteredNotes.map((note) => (
                    <li
                      key={note.id}
                      className="rounded-lg border border-primary/15 bg-primary/10 px-3 py-2 text-xs text-primary"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 space-y-1">
                          <p className="truncate font-semibold text-primary/90">{note.title}</p>
                          {note.summary && (
                            <p className="line-clamp-2 text-primary/70">{note.summary}</p>
                          )}
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] uppercase tracking-wide text-primary/60">
                            {note.noteType && (
                              <Badge variant="outline" className="border-primary/30 text-primary/70">
                                {note.noteType}
                              </Badge>
                            )}
                            {note.authorId && <span>Author: {note.authorId}</span>}
                            {note.modified && (
                              <span>
                                Updated {new Date(note.modified).toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex shrink-0 flex-col gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-primary hover:text-primary"
                            onClick={() => void handleViewNote(note.id)}
                          >
                            Open
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-primary hover:text-primary"
                            onClick={() =>
                              window.open(`/composer?strandId=${note.id}`, '_blank', 'noopener,noreferrer')
                            }
                          >
                            <ExternalLink className="mr-1 h-3 w-3" />
                            Composer
                          </Button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <AutoInsightsPanel
            insights={autoInsights.insights}
            isLoading={autoInsights.isLoading}
            error={autoInsights.error}
            statusMessage={autoInsights.status}
            logs={autoInsights.logs}
            onViewRecommendations={hasInsights ? handleViewRecommendations : undefined}
          />

          <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-foreground">Structure & approvals</p>
                <p className="text-xs text-muted-foreground">
                  Keep track of hierarchy changes before publishing.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={pendingStructureCount > 0 ? 'destructive' : 'secondary'} className="uppercase">
                  {pendingStructureCount > 0 ? `${pendingStructureCount} pending` : 'Up to date'}
                </Badge>
                {structureRequests.length > 0 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs"
                    onClick={() => setStructureDetailOpen(true)}
                    disabled={structureLoading}
                  >
                    Manage
                  </Button>
                )}
              </div>
            </div>
            {structureLoading ? (
              <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading structure requests...
              </div>
            ) : structureRequests.length === 0 ? (
              <p className="mt-4 text-xs text-muted-foreground">No structure requests for this dataset yet.</p>
            ) : (
              <ul className="mt-4 space-y-2 text-xs">
                {structureRequests.slice(0, 3).map((request) => (
                  <li key={request.id} className="rounded-lg border border-border/60 bg-background/70 p-3">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                          {request.status === 'PENDING' ? (
                            <ShieldAlert className="h-4 w-4 text-yellow-500" />
                          ) : (
                            <ShieldCheck className="h-4 w-4 text-emerald-500" />
                          )}
                          {formatStructureType(request.type)}
                        </div>
                        <Badge
                          variant={request.status === 'PENDING' ? 'destructive' : 'secondary'}
                          className="uppercase"
                        >
                          {request.status.toLowerCase()}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] uppercase tracking-wide text-muted-foreground">
                        <span>Scope: {request.scopeId ?? 'global'}</span>
                        {request.parentId && <span>Parent: {request.parentId}</span>}
                        {request.targetId && <span>Target: {request.targetId}</span>}
                        <span>Requested {new Date(request.createdAt).toLocaleString()}</span>
                        <span>By {request.requestedBy ?? 'unknown'}</span>
                      </div>
                      {request.justification && (
                        <p className="text-xs leading-snug text-muted-foreground/90">{request.justification}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-2">
                        {request.status === 'PENDING' && (
                          <Button
                            size="xs"
                            className="gap-1"
                            onClick={() => void handleResolveStructureRequest(request, 'approve')}
                            disabled={resolvingRequestId === request.id}
                          >
                            <Check className="h-3 w-3" />
                            Approve
                          </Button>
                        )}
                        {request.status === 'PENDING' && (
                          <Button
                            size="xs"
                            variant="destructive"
                            className="gap-1"
                            onClick={() => void handleResolveStructureRequest(request, 'reject')}
                            disabled={resolvingRequestId === request.id}
                          >
                            <X className="h-3 w-3" />
                            Reject
                          </Button>
                        )}
                        {request.status === 'PENDING' && (
                          <Button
                            size="xs"
                            variant="ghost"
                            className="gap-1 text-muted-foreground"
                            onClick={() => void handleResolveStructureRequest(request, 'cancel')}
                            disabled={resolvingRequestId === request.id}
                          >
                            <Ban className="h-3 w-3" />
                            Cancel
                          </Button>
                        )}
                        <Button
                          size="xs"
                          variant="outline"
                          className="gap-1"
                          onClick={() => handleOpenStructureDetail(request)}
                        >
                          <Eye className="h-3 w-3" />
                          Review
                        </Button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {structureRequests.length > 3 && (
              <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
                <span>+{structureRequests.length - 3} more requests in backlog</span>
                <Button size="sm" variant="ghost" className="text-xs" onClick={() => setStructureDetailOpen(true)}>
                  Review all
                </Button>
              </div>
            )}
          </div>
          <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-foreground">Placeholder defaults</p>
                <p className="text-xs text-muted-foreground">Define what collaborators see when access is limited.</p>
              </div>
              <Button size="sm" variant="outline" className="gap-2" onClick={() => setPlaceholderDialogOpen(true)}>
                <Settings2 className="h-4 w-4" />
                Edit
              </Button>
            </div>
            <div className="mt-3 space-y-1 text-xs text-muted-foreground">
              <p>Text: <span className="text-foreground">{placeholderDefaults.text}</span></p>
              <p>Icon: <span className="text-foreground">{placeholderDefaults.icon ?? 'ph:lock'}</span></p>
            </div>
          </div>

          {hasInsights && autoInsights.recommendations?.length > 0 && (
            <div className="rounded-2xl border border-border/70 bg-background/60 p-4 text-xs">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-foreground">Recommended visuals</p>
                <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
                  {autoInsights.recommendations.length} queued
                </Badge>
              </div>
              <p className="mt-2 text-muted-foreground">
                Auto Insights queued tailored visualisations for this dataset. Jump to the visualization workspace to generate them with a single click.
              </p>
              <Button
                size="sm"
                variant="ghost"
                className="mt-3 gap-1 text-primary"
                onClick={handleViewRecommendations}
              >
                Review suggestions
                <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      </div>

      <Dialog
        open={structureDetailOpen}
        onOpenChange={(open) => {
          setStructureDetailOpen(open);
          if (!open) {
            setStructureResolutionNote('');
          }
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review structure request</DialogTitle>
            <DialogDescription>
              Approve or reject structural changes before they are applied to the dataset hierarchy.
            </DialogDescription>
          </DialogHeader>
          {structureRequests.length === 0 ? (
            <p className="text-sm text-muted-foreground">No structure requests are queued for this dataset.</p>
          ) : (
            <div className="space-y-4">
              <Select
                value={structureDetail?.id ?? structureRequests[0].id}
                onValueChange={(value) => {
                  const next = structureRequests.find((request) => request.id === value);
                  if (next) {
                    setStructureDetail(next);
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select structure request" />
                </SelectTrigger>
                <SelectContent>
                  {structureRequests.map((request) => (
                    <SelectItem key={request.id} value={request.id}>
                      {formatStructureType(request.type)} - {request.scopeId ?? 'global'} - {request.status.toLowerCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {structureDetail && (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant={structureDetail.status === 'PENDING' ? 'destructive' : 'secondary'}
                      className="uppercase"
                    >
                      {structureDetail.status.toLowerCase()}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Requested {new Date(structureDetail.createdAt).toLocaleString()} by{' '}
                      {structureDetail.requestedBy ?? 'unknown'}
                    </span>
                  </div>
                  <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                    <div>Scope: <span className="text-foreground">{structureDetail.scopeId ?? 'global'}</span></div>
                    <div>Parent: <span className="text-foreground">{structureDetail.parentId ?? '-'}</span></div>
                    <div>Target: <span className="text-foreground">{structureDetail.targetId ?? '-'}</span></div>
                    <div>Updated: <span className="text-foreground">{new Date(structureDetail.updatedAt ?? structureDetail.createdAt).toLocaleString()}</span></div>
                  </div>
                  {structureDetail.justification && (
                    <div className="rounded-md border border-border/60 bg-muted/30 p-3 text-sm text-muted-foreground">
                      {structureDetail.justification}
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Requested payload</p>
                    <pre className="mt-1 max-h-48 overflow-auto rounded-md border border-border/60 bg-background/80 p-3 text-xs">
                      {JSON.stringify(structureDetail.payload ?? {}, null, 2)}
                    </pre>
                  </div>
                  {structureDetail.status === 'PENDING' && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">Resolution note (optional)</p>
                      <Textarea
                        value={structureResolutionNote}
                        onChange={(event) => setStructureResolutionNote(event.target.value)}
                        placeholder="Add context for the requester..."
                        rows={3}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
            <Button size="sm" variant="outline" className="gap-2" onClick={() => setStructureDetailOpen(false)}>
              Close
            </Button>
            {structureDetail && (
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  className="gap-2"
                  onClick={() => void handleResolveStructureRequest(structureDetail, 'approve')}
                  disabled={structureDetail.status !== 'PENDING' || resolvingRequestId === structureDetail.id}
                >
                  <Check className="h-4 w-4" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="gap-2"
                  onClick={() =>
                    void handleResolveStructureRequest(
                      structureDetail,
                      'reject',
                      structureResolutionNote.trim() || undefined,
                    )
                  }
                  disabled={structureDetail.status !== 'PENDING' || resolvingRequestId === structureDetail.id}
                >
                  <X className="h-4 w-4" />
                  Reject
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="gap-2"
                  onClick={() =>
                    void handleResolveStructureRequest(
                      structureDetail,
                      'cancel',
                      structureResolutionNote.trim() || undefined,
                    )
                  }
                  disabled={structureDetail.status !== 'PENDING' || resolvingRequestId === structureDetail.id}
                >
                  <Ban className="h-4 w-4" />
                  Cancel
                </Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={noteViewerOpen}
        onOpenChange={(open) => {
          setNoteViewerOpen(open);
          if (!open) {
            setActiveNote(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{activeNote?.title ?? 'Dataset note'}</DialogTitle>
            {activeNote?.modified && (
              <DialogDescription>
                Last updated {new Date(activeNote.modified).toLocaleString()}
              </DialogDescription>
            )}
          </DialogHeader>

          {noteViewerLoading ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : activeNote ? (
            <div className="space-y-3 text-sm text-muted-foreground">
              {activeNote.summary && <p className="text-foreground">{activeNote.summary}</p>}
              <div className="rounded-md border border-border/60 bg-muted/30 p-3 text-foreground">
                {typeof activeNote.content?.metadata === 'object' &&
                activeNote.content?.metadata !== null &&
                'plainText' in activeNote.content.metadata
                  ? (activeNote.content.metadata.plainText as string)
                  : 'No transcript available for this note yet.'}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Select a note to preview its content.
            </p>
          )}

          <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Button
              size="sm"
              variant="ghost"
              className="gap-2"
              asChild
              disabled={!activeNote}
            >
              <Link
                href={activeNote ? `/composer?strandId=${activeNote.id}` : '#'}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4" />
                Edit in composer
              </Link>
            </Button>
            <Button variant="outline" onClick={() => setNoteViewerOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={placeholderDialogOpen} onOpenChange={setPlaceholderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit placeholder defaults</DialogTitle>
            <DialogDescription>
              Configure the text and icon shown when viewers don't have access to a strand.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Placeholder text</p>
              <Input value={placeholderText} onChange={(event) => setPlaceholderText(event.target.value)} />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Icon (optional)</p>
              <Input
                value={placeholderIcon}
                onChange={(event) => setPlaceholderIcon(event.target.value)}
                placeholder="e.g. ph:lock"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPlaceholderDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePlaceholderPreferences} disabled={!placeholderText.trim()}>
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </section>
  );
}











