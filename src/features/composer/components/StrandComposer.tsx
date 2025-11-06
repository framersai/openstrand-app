'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Placeholder from '@tiptap/extension-placeholder';
import { motion } from 'framer-motion';
import { FileText, Save, Sparkles, Tag } from 'lucide-react';
import { toast } from 'react-hot-toast';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useSupabase } from '@/features/auth';
import { openstrandAPI } from '@/services/openstrand.api';
import { StrandType, Difficulty, type NoteType as StrandNoteType, type Strand } from '@/types/openstrand';
import { FloatingVoiceRecorder } from './FloatingVoiceRecorder';
import { MediaAttachmentWizard } from './MediaAttachmentWizard';
import { WhiteboardCanvas } from './WhiteboardCanvas';
import { SlashCommand } from '../extensions/slash-command';
import { ExportWizard } from '@/features/export/ExportWizard';
import { TagsChipInput } from './TagsChipInput';

const NOTE_TYPE_OPTIONS = [
  { value: 'main', label: 'Main note' },
  { value: 'reference', label: 'Reference note' },
  { value: 'structure', label: 'Structure note' },
  { value: 'project', label: 'Project note' },
  { value: 'index', label: 'Index note' },
] as const;

type NoteTypeOption = typeof NOTE_TYPE_OPTIONS[number]['value'];

const DIFFICULTY_OPTIONS = [
  { value: '', label: 'Unspecified' },
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'expert', label: 'Expert' },
];

/**
 * StrandComposer
 *
 * Rich authoring experience for creating/editing strands.
 * Includes note metadata, attachments (audio, camera, whiteboard),
 * metadata-only save, offline save, and keyboard shortcuts.
 */
export interface StrandComposerProps {
  strandId?: string;
  title?: string;
  summary?: string;
  noteType?: NoteTypeOption;
  coAuthorIds?: string[];
  tags?: string[];
  difficulty?: string;
  onSave?: (payload: { strandId?: string; title: string; summary: string; content: any; noteType: NoteTypeOption; coAuthorIds: string[]; tags: string[]; difficulty: string }) => Promise<void> | void;
  onSaveSuccess?: (result: {
    strandId: string;
    title: string;
    summary: string;
    content: any;
    noteType: NoteTypeOption;
    coAuthorIds: string[];
    tags: string[];
    difficulty: string;
  }) => void;
}

/**
 * Rich strand authoring surface used across dashboard and inline knowledge graph flows.
 * Exposes metadata controls (note type, tags, difficulty) and invokes callbacks after persistence.
 */
export function StrandComposer({ strandId: initialStrandId, title: initialTitle = '', summary: initialSummary = '', noteType: initialNoteType = 'main', coAuthorIds: initialCoAuthors = [], tags: initialTags = [], difficulty: initialDifficulty = '', onSave, onSaveSuccess }: StrandComposerProps) {
  const { planTier } = useSupabase();
  const [strandId, setStrandId] = useState(initialStrandId ?? '');
  const [title, setTitle] = useState(initialTitle);
  const [summary, setSummary] = useState(initialSummary);
  const [noteType, setNoteType] = useState<NoteTypeOption>(initialNoteType);
  const [coAuthorIds, setCoAuthorIds] = useState<string[]>(initialCoAuthors);
  const [tags, setTags] = useState<string[]>(() => initialTags);
  const [difficulty, setDifficulty] = useState<string>(initialDifficulty ?? '');
  const [saving, setSaving] = useState(false);
  const [savingMetadata, setSavingMetadata] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(Boolean(initialStrandId));
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [showInspector, setShowInspector] = useState(false);
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [showExport, setShowExport] = useState(false);

  const normalizedTags = useMemo(
    () => (Array.isArray(tags) ? tags : []).map((t) => t.trim()).filter(Boolean),
    [tags]
  );

  const draftMetadata = useMemo(() => {
    return normalizedTags.length
      ? {
          language: 'en',
          tags: normalizedTags,
          keywords: [],
          concepts: [],
          version: '1.0.0',
          citations: [],
        }
      : undefined;
  }, [normalizedTags]);

  const metadataIssues = useMemo(() => {
    const issues: string[] = [];
    if (!draftMetadata) return issues;
    if (typeof (draftMetadata as any).language !== 'string') issues.push('language must be a string');
    if (!Array.isArray((draftMetadata as any).tags)) issues.push('tags must be an array');
    if (!Array.isArray((draftMetadata as any).keywords)) issues.push('keywords must be an array');
    if (!Array.isArray((draftMetadata as any).concepts)) issues.push('concepts must be an array');
    if (typeof (draftMetadata as any).version !== 'string') issues.push('version must be a string');
    if (!Array.isArray((draftMetadata as any).citations)) issues.push('citations must be an array');
    return issues;
  }, [draftMetadata]);

  

  const editor = useEditor({
    extensions: [
      StarterKit,
      TaskList,
      TaskItem.configure({ nested: true }),
      SlashCommand,
      Placeholder.configure({
        placeholder: 'Start narrating your strand... Use voice notes or paste content.',
      }),
    ],
    content: '<p></p>',
    autofocus: true,
  });

  const handleInsertTranscript = useCallback((transcript: string) => {
    if (!editor || !transcript) return;
    editor.commands.focus('end');
    editor.commands.insertContent(`\n<blockquote>${transcript}</blockquote>\n`);
  }, [editor]);

  useEffect(() => {
    if (!initialStrandId || !editor) {
      setLoadingExisting(false);
      return;
    }

    let cancelled = false;
    setLoadingExisting(true);

    (async () => {
      try {
        const existing = await openstrandAPI.strands.get(initialStrandId);
        if (cancelled) {
          return;
        }
        setStrandId(existing.id);
        setTitle(existing.title ?? '');
        setSummary(existing.summary ?? '');
        if (existing.noteType) {
          setNoteType(existing.noteType as NoteTypeOption);
        }
        if (Array.isArray(existing.coAuthorIds)) {
          setCoAuthorIds(existing.coAuthorIds);
        }
        const existingTags = Array.isArray(existing.metadata?.tags)
          ? (existing.metadata?.tags as string[])
          : typeof existing.metadata?.tags === 'string'
            ? String(existing.metadata.tags)
                .split(',')
                .map((tag) => tag.trim())
                .filter(Boolean)
            : [];
        setTags(existingTags);
        if (existing.difficulty) {
          setDifficulty(String(existing.difficulty));
        }
        const contentJson =
          (existing.content as any)?.data ??
          existing.content ??
          '<p></p>';
        editor.commands.setContent(contentJson ?? '<p></p>');
        setStatusMessage('Loaded strand');
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to load strand', error);
          toast.error('Unable to load strand content');
        }
      } finally {
        if (!cancelled) {
          setLoadingExisting(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [initialStrandId, editor]);

  useEffect(() => {
    if (!initialStrandId) {
      setTags(initialTags);
      setDifficulty(initialDifficulty ?? '');
    }
  }, [initialStrandId, initialTags, initialDifficulty]);

  const handleSave = useCallback(async () => {
    if (!editor) return;
    const content = editor.getJSON();
    const plainText = editor.getText().trim();
    const normalizedTags = (Array.isArray(tags) ? tags : [])
      .map((tag) => tag.trim())
      .filter(Boolean);

    try {
      setSaving(true);
      setStatusMessage(null);
      if (onSave) {
        await onSave({
          strandId: strandId || undefined,
          title,
          summary,
          content,
          noteType,
          coAuthorIds,
          tags: normalizedTags,
          difficulty,
        });
        if (strandId) {
          onSaveSuccess?.({
            strandId,
            title,
            summary,
            content,
            noteType,
            coAuthorIds,
            tags: normalizedTags,
            difficulty,
          });
        }
        setStatusMessage('Saved successfully');
        toast.success('Strand saved');
        return;
      }

      const payload: Partial<Strand> = {
        title: title || 'Untitled strand',
        summary,
        content: {
          data: content,
          metadata: {
            plainText,
            origin: 'composer',
            updatedAt: new Date().toISOString(),
            tags: normalizedTags,
            difficulty: difficulty || undefined,
          },
        },
        contentType: 'application/vnd.tiptap+json',
        noteType: noteType as StrandNoteType,
        coAuthorIds,
        visibility: 'private',
        type: StrandType.NOTE,
        difficulty: difficulty ? (difficulty as Difficulty) : undefined,
        metadata: normalizedTags.length
          ? {
              language: 'en',
              tags: normalizedTags,
              keywords: [],
              concepts: [],
              version: '1.0.0',
              citations: [],
            }
          : undefined,
      };

      let saved: Strand;
      if (strandId) {
        saved = await openstrandAPI.strands.update(strandId, payload);
      } else {
        saved = await openstrandAPI.strands.create(payload);
      }

      setStrandId(saved.id);
      setStatusMessage('Saved successfully');
      toast.success('Strand saved');
      onSaveSuccess?.({
        strandId: saved.id,
        title: payload.title ?? saved.title ?? title,
        summary: payload.summary ?? saved.summary ?? summary,
        content,
        noteType,
        coAuthorIds,
        tags: normalizedTags,
        difficulty,
      });
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Failed to save changes');
      toast.error(error instanceof Error ? error.message : 'Failed to save strand');
    } finally {
      setSaving(false);
    }
  }, [editor, onSave, strandId, title, summary, noteType, coAuthorIds, onSaveSuccess, tags, difficulty]);

  const handleSaveMetadataOnly = useCallback(async () => {
    if (!strandId) {
      toast.error('Set a target Strand ID before saving metadata');
      return;
    }
    try {
      setSavingMetadata(true);
      const metadataPayload = draftMetadata ?? {
        language: 'en',
        tags: normalizedTags,
        keywords: [],
        concepts: [],
        version: '1.0.0',
        citations: [],
      };
      await openstrandAPI.strands.updateMetadata(strandId, metadataPayload as any);
      setStatusMessage('Metadata saved');
      toast.success('Metadata saved');
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Failed to save metadata');
      toast.error(error instanceof Error ? error.message : 'Failed to save metadata');
    } finally {
      setSavingMetadata(false);
    }
  }, [strandId, draftMetadata, normalizedTags]);

  const handleSaveOffline = useCallback(async () => {
    try {
      const id = strandId || `draft-${Date.now()}`;
      const offlineStrand = {
        id,
        type: 'note' as const,
        title: title || 'Untitled',
        slug: id,
        summary: summary || '',
        contentType: 'application/vnd.tiptap+json',
        created: new Date(),
        modified: new Date(),
        relationships: [],
        content: {
          data: editor?.getJSON() ?? {},
          html: undefined,
          markdown: undefined,
        },
      } as const;
      // Save minimal strand offline
      await import('@/services/platform/storage.service').then(async (m) => {
        await m.platformStorage.saveStrand(offlineStrand as any);
      });
      setStatusMessage('Saved offline');
      toast.success('Draft saved offline');
      if (!strandId) setStrandId(id);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save offline');
    }
  }, [strandId, title, summary, editor]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const isMod = event.ctrlKey || event.metaKey;
      if (isMod && event.key.toLowerCase() === 's') {
        event.preventDefault();
        handleSave();
        return;
      }
      if (isMod && event.shiftKey && event.key.toLowerCase() === 'm') {
        event.preventDefault();
        void handleSaveMetadataOnly();
        return;
      }
      if (isMod && event.key.toLowerCase() === 'e') {
        event.preventDefault();
        setShowExport(true);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleSave, handleSaveMetadataOnly]);

  const planBadge = useMemo(() => {
    switch (planTier) {
      case 'pro':
        return <Badge variant="default">Pro tier: enhanced media limits</Badge>;
      case 'cloud':
      case 'team':
      case 'enterprise':
        return <Badge variant="outline">Cloud tier: 5-minute voice notes</Badge>;
      case 'free':
      default:
        return <Badge variant="secondary">Free tier: 2-minute voice notes</Badge>;
    }
  }, [planTier]);

  return (
    <TooltipProvider>
      <div className="relative flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <h1 className="text-lg font-semibold">Strand Composer</h1>
            </div>
            <div className="flex items-center gap-2">
              {planBadge}
              <Button variant="outline" size="sm" onClick={() => setShowInspector((v) => !v)}>
                {showInspector ? 'Hide' : 'Show'} Metadata Inspector
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowWhiteboard((v) => !v)}>
                {showWhiteboard ? 'Hide' : 'Show'} Whiteboard
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowExport(true)}>
                Export
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-[220px_1fr]">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium uppercase text-muted-foreground">Target Strand ID</label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Input
                    placeholder="Existing strand ID"
                    value={strandId}
                    onChange={(event) => setStrandId(event.target.value)}
                  />
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs text-xs">
                  Attachments are uploaded to the strand you specify here. Leave blank while drafting; set it before uploading audio or media.
                </TooltipContent>
              </Tooltip>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium uppercase text-muted-foreground">Title</label>
                <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Give your strand a working title" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium uppercase text-muted-foreground">Summary</label>
                <Textarea value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="One-line summary for quick scanning" rows={2} />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium uppercase text-muted-foreground">Note Type</label>
              <Select value={noteType} onValueChange={(value) => setNoteType(value as NoteTypeOption)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select note type" />
                </SelectTrigger>
                <SelectContent>
                  {NOTE_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-1 text-xs font-medium uppercase text-muted-foreground">
                <Tag className="h-3.5 w-3.5" /> Tags
              </label>
              <TagsChipInput value={tags} onChange={setTags} placeholder="Add tag and press Enter" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium uppercase text-muted-foreground">Difficulty</label>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger>
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  {DIFFICULTY_OPTIONS.map((option) => (
                    <SelectItem key={option.value || 'unspecified'} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
        </div>
      </div>

      <div className="relative">
        <FloatingVoiceRecorder
          strandId={strandId}
          planTier={planTier}
          onTranscriptReady={handleInsertTranscript}
        />

        <Card className="shadow-lg">
          <CardContent className="prose min-h-[360px] max-w-none rounded-md border border-border/60 bg-background/90 px-6 py-5 dark:prose-invert">
            {loadingExisting ? (
              <motion.div
                className="flex h-full w-full items-center justify-center text-sm text-muted-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                Loading strand…
              </motion.div>
            ) : null}
            <EditorContent editor={editor} />
          </CardContent>
        </Card>
      </div>

      {showInspector ? (
        <Card>
          <CardContent className="space-y-2 border border-border/60 px-6 py-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase text-muted-foreground">Metadata Inspector</span>
              {metadataIssues.length > 0 ? (
                <Badge variant="destructive">{metadataIssues.length} issue{metadataIssues.length > 1 ? 's' : ''}</Badge>
              ) : (
                <Badge variant="secondary">Valid</Badge>
              )}
            </div>
            <pre className="max-h-60 overflow-auto rounded bg-muted p-3 text-xs">
{JSON.stringify(draftMetadata ?? { language: 'en', tags: normalizedTags, keywords: [], concepts: [], version: '1.0.0', citations: [] }, null, 2)}
            </pre>
            {metadataIssues.length > 0 ? (
              <ul className="list-disc pl-5 text-xs text-amber-600">
                {metadataIssues.map((issue) => (
                  <li key={issue}>{issue}</li>
                ))}
              </ul>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {showExport && (
        <ExportWizard
          open={showExport}
          onClose={() => setShowExport(false)}
          getDocJson={() => editor?.getJSON?.()}
          getHtml={() => editor?.getHTML?.() || ''}
          defaultFilename={title?.trim() || 'strand'}
          strandId={strandId || undefined}
          onInsertIntoEditor={(url) => {
            if (!editor) return;
            editor.commands.focus('end');
            editor.commands.insertContent(`\n<figure><img src="${url}" alt="Edited image" /><figcaption></figcaption></figure>\n`);
            setShowExport(false);
          }}
        />
      )}

        <MediaAttachmentWizard
          strandId={strandId}
          planTier={planTier}
          onUploaded={(data) => {
            try {
              const url: string | undefined = data?.url;
              const type: string | undefined = data?.type || data?.attachmentType;
              if (editor && url) {
                editor.commands.focus('end');
                if (type === 'IMAGE' || (typeof data?.mimeType === 'string' && data.mimeType.startsWith('image/'))) {
                  editor.commands.insertContent(`\n<figure><img src="${url}" alt="Attachment" /><figcaption>${data?.summary || ''}</figcaption></figure>\n`);
                } else if (typeof data?.mimeType === 'string' && data.mimeType.startsWith('video/')) {
                  editor.commands.insertContent(`\n<p><a href="${url}" target="_blank" rel="noopener noreferrer">View video attachment</a></p>\n`);
                } else if (typeof data?.mimeType === 'string' && data.mimeType.startsWith('audio/')) {
                  editor.commands.insertContent(`\n<p><audio controls src="${url}"></audio></p>\n`);
                } else {
                  editor.commands.insertContent(`\n<p><a href="${url}" target="_blank" rel="noopener noreferrer">View attachment</a></p>\n`);
                }
              }
            } catch {
              // no-op
            }
          }}
        />

        {showWhiteboard ? (
          <div className="mt-4">
            <WhiteboardCanvas
              strandId={strandId}
              onUploaded={(data) => {
                try {
                  const url: string | undefined = data?.url;
                  if (editor && url) {
                    editor.commands.focus('end');
                    editor.commands.insertContent(`\n<figure><img src="${url}" alt="Whiteboard" /><figcaption>${data?.summary || 'Whiteboard sketch'}</figcaption></figure>\n`);
                  }
                } catch {}
              }}
            />
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 bg-background/70 px-4 py-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>Voice notes and media attachments automatically track GDPR-compliant retention policies.</span>
          </div>
          <div className="flex items-center gap-2">
            {statusMessage ? <span className="text-xs text-muted-foreground">{statusMessage}</span> : null}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button disabled={saving} onClick={handleSave} className="gap-2">
                  <Save className="h-4 w-4" />
                  {saving ? 'Saving…' : 'Save Draft'}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">Shortcut: Ctrl/Cmd+S</TooltipContent>
            </Tooltip>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="px-2">More</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem disabled={!strandId || savingMetadata} onSelect={(e) => { e.preventDefault(); void handleSaveMetadataOnly(); }}>
                  Save metadata only
                  <DropdownMenuShortcut>Ctrl/Cmd+Shift+M</DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setShowInspector((v) => !v); }}>
                  {showInspector ? 'Hide' : 'Show'} Metadata Inspector
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={(e) => { e.preventDefault(); void handleSaveOffline(); }}>
                  Save offline (IndexedDB/Capacitor)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
