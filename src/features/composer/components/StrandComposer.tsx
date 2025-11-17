'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { createLowlight } from 'lowlight';
// Register a sensible default set of popular languages for highlighting
import ts from 'highlight.js/lib/languages/typescript';
import js from 'highlight.js/lib/languages/javascript';
import json from 'highlight.js/lib/languages/json';
import bash from 'highlight.js/lib/languages/bash';
import python from 'highlight.js/lib/languages/python';
import markdown from 'highlight.js/lib/languages/markdown';
import c from 'highlight.js/lib/languages/c';
import cpp from 'highlight.js/lib/languages/cpp';
import java from 'highlight.js/lib/languages/java';
import go from 'highlight.js/lib/languages/go';
import rust from 'highlight.js/lib/languages/rust';
import ruby from 'highlight.js/lib/languages/ruby';
import php from 'highlight.js/lib/languages/php';
import swift from 'highlight.js/lib/languages/swift';
import kotlin from 'highlight.js/lib/languages/kotlin';
import scala from 'highlight.js/lib/languages/scala';
import sql from 'highlight.js/lib/languages/sql';
import yaml from 'highlight.js/lib/languages/yaml';
import dockerfile from 'highlight.js/lib/languages/dockerfile';
import html from 'highlight.js/lib/languages/xml';
import css from 'highlight.js/lib/languages/css';
import { FileText, Save, Sparkles, Tag } from 'lucide-react';
import { toast } from 'react-hot-toast';

const lowlight = createLowlight();

lowlight.registerLanguage('typescript', ts);
lowlight.registerLanguage('javascript', js);
lowlight.registerLanguage('json', json);
lowlight.registerLanguage('bash', bash);
lowlight.registerLanguage('shell', bash);
lowlight.registerLanguage('python', python);
lowlight.registerLanguage('md', markdown);
lowlight.registerLanguage('markdown', markdown);
lowlight.registerLanguage('c', c);
lowlight.registerLanguage('cpp', cpp);
lowlight.registerLanguage('java', java);
lowlight.registerLanguage('go', go);
lowlight.registerLanguage('rust', rust);
lowlight.registerLanguage('ruby', ruby);
lowlight.registerLanguage('php', php);
lowlight.registerLanguage('swift', swift);
lowlight.registerLanguage('kotlin', kotlin);
lowlight.registerLanguage('scala', scala);
lowlight.registerLanguage('sql', sql);
lowlight.registerLanguage('yaml', yaml);
lowlight.registerLanguage('dockerfile', dockerfile);
lowlight.registerLanguage('html', html);
lowlight.registerLanguage('xml', html);
lowlight.registerLanguage('css', css);

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSupabase } from '@/features/auth';
import { openstrandAPI } from '@/services/openstrand.api';
import { StrandType, type NoteType as StrandNoteType, type Strand } from '@/types/openstrand';
import { FloatingVoiceRecorder } from './FloatingVoiceRecorder';
import { MediaAttachmentWizard } from './MediaAttachmentWizard';
import { InlineVisualizationWizard } from './InlineVisualizationWizard';
import { ProjectImportWizard } from './ProjectImportWizard';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { cn } from '@/lib/utils';
import { useAutoMetadata } from '../hooks/useAutoMetadata';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useComposerPreferences } from '../hooks/useComposerPreferences';
import { AutoMetadataReviewModal } from './AutoMetadataReviewModal';
import { CodeSnippetRunner } from './CodeSnippetRunner';
import { WhiteboardPanel } from '@/components/editor/WhiteboardPanel';

const NOTE_TYPE_OPTIONS = [
  { value: 'main', label: 'Main note' },
  { value: 'reference', label: 'Reference note' },
  { value: 'structure', label: 'Structure note' },
  { value: 'project', label: 'Project note' },
  { value: 'index', label: 'Index note' },
] as const;

type NoteTypeOption = typeof NOTE_TYPE_OPTIONS[number]['value'];

const DIFFICULTY_OPTIONS = [
  { value: 'beginner', label: 'Beginner (default)' },
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'expert', label: 'Expert' },
];

export interface StrandComposerProps {
  strandId?: string;
  title?: string;
  summary?: string;
  noteType?: NoteTypeOption;
  coAuthorIds?: string[];
  tags?: string[];
  difficulty?: string;
  initialContentHtml?: string;
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
export function StrandComposer({ strandId: initialStrandId, title: initialTitle = '', summary: initialSummary = '', noteType: initialNoteType = 'main', coAuthorIds: initialCoAuthors = [], tags: initialTags = [], difficulty: initialDifficulty = '', initialContentHtml, onSave, onSaveSuccess }: StrandComposerProps) {
  const { planTier } = useSupabase();
  const { device, orientation, utils } = useResponsiveLayout();
  const [strandId, setStrandId] = useState(initialStrandId ?? '');
  const [title, setTitle] = useState(initialTitle);
  const [summary, setSummary] = useState(initialSummary);
  const [noteType, setNoteType] = useState<NoteTypeOption>(initialNoteType);
  const [coAuthorIds, setCoAuthorIds] = useState<string[]>(initialCoAuthors);
  const [tags, setTags] = useState<string>(() => initialTags.join(', '));
  const [difficulty, setDifficulty] = useState<string>(initialDifficulty || 'beginner');
  const [saving, setSaving] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(Boolean(initialStrandId));
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [inlineVisualizations, setInlineVisualizations] = useState<any[]>([]);
  const { run: runAutoMetadata, suggest: suggestAutoMetadata } = useAutoMetadata();
  const [prefs, updatePrefs] = useComposerPreferences();
  const contentDirtyRef = useRef(false as boolean);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewTags, setReviewTags] = useState<string[]>([]);
  const [reviewRelated, setReviewRelated] = useState<Array<{ id: string; title?: string; summary?: string }>>([]);
  const [visibility, setVisibility] = useState<'private' | 'public' | 'unlisted' | 'team'>('private');
  const snippetApiRef = useRef<{ runWith: (code: string, language: 'ts' | 'js' | 'py') => void; getLastLogs: () => string[]; getLastError: () => string | null } | null>(null);
  const [lastCodeRun, setLastCodeRun] = useState<{ language: string; logs: string[]; error?: string | null; ranAt: string } | null>(null);
  const [editorMode, setEditorMode] = useState<'text' | 'whiteboard'>('text');
  const [whiteboardData, setWhiteboardData] = useState<any>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false, // disable default to use lowlight version
      }),
      CodeBlockLowlight.configure({
        lowlight,
        defaultLanguage: 'typescript',
      }),
      Placeholder.configure({
        placeholder: 'Start narrating your strand... Use voice notes or paste content.',
      }),
    ],
    content: '<p></p>',
    autofocus: true,
    onUpdate: () => {
      contentDirtyRef.current = true;
    },
  });

  const runCurrentCodeBlock = useCallback(() => {
    if (!editor || !snippetApiRef.current) return;
    const { state } = editor;
    const { $from } = state.selection;
    const parent = $from.parent;
    if (parent?.type?.name !== 'codeBlock') {
      toast.error('Place the cursor inside a code block to run it.');
      return;
    }
    const language = (parent.attrs?.language as string | undefined) ?? 'ts';
    const text = parent?.textContent ?? '';
    if (!text.trim()) {
      toast.error('Code block is empty.');
      return;
    }
    snippetApiRef.current.runWith(text, (language === 'javascript' ? 'js' : language) as any);
    // poll logs briefly after a short delay
    setTimeout(() => {
      const logs = snippetApiRef.current?.getLastLogs() ?? [];
      const error = snippetApiRef.current?.getLastError() ?? null;
      setLastCodeRun({
        language,
        logs,
        error,
        ranAt: new Date().toISOString(),
      });
    }, 400);
  }, [editor]);

  const handleInsertTranscript = useCallback((transcript: string) => {
    if (!editor || !transcript) return;
    editor.commands.focus('end');
    editor.commands.insertContent(`\n<blockquote>${transcript}</blockquote>\n`);
  }, [editor]);

  useEffect(() => {
    if (!initialStrandId || !editor) {
      setLoadingExisting(false);
      // If creating a new strand and a template body is provided, seed the editor.
      if (!initialStrandId && initialContentHtml && editor) {
        try {
          editor.commands.setContent(initialContentHtml, true);
        } catch {
          // ignore if invalid HTML
        }
      }
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
        setTags(existingTags.join(', '));
        if (typeof existing.metadata?.difficulty === 'string') {
          setDifficulty(existing.metadata.difficulty);
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
      setTags(initialTags.join(', '));
      setDifficulty(initialDifficulty ?? '');
    }
  }, [initialStrandId, initialTags, initialDifficulty]);

  const handleSave = useCallback(async () => {
    if (!editor) return;
    const content = editor.getJSON();
    const plainText = editor.getText().trim();
    const normalizedTags = tags
      .split(',')
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
          difficulty: difficulty || 'beginner',
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
            difficulty: difficulty || 'beginner',
          });
          // Background auto-metadata on custom save path
          if (prefs.reviewBeforeApply) {
            const suggestions = await suggestAutoMetadata({
              strandId,
              plainText,
              existingTags: normalizedTags,
              maxBacklinks: prefs.maxBacklinks,
            });
            setReviewTags(suggestions.tags);
            setReviewRelated(suggestions.related);
            setReviewOpen(true);
          } else {
            void runAutoMetadata({
              strandId,
              plainText,
              existingTags: normalizedTags,
              options: {
                autoTag: prefs.autoTag,
                autoBacklinks: prefs.autoBacklinks,
                maxBacklinks: prefs.maxBacklinks,
              },
            });
          }
        }
        setStatusMessage('Saved successfully');
        toast.success('Strand saved');
        contentDirtyRef.current = false;
        return;
      }

      const normalizedVisibility: 'public' | 'private' | 'unlisted' | 'premium' =
        visibility === 'team' ? 'private' : visibility;

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
            difficulty: difficulty || 'beginner',
            visualizations: inlineVisualizations.length ? inlineVisualizations : undefined,
            ...(lastCodeRun
              ? { codeLastRun: lastCodeRun }
              : {}),
          },
        },
        contentType: 'application/vnd.tiptap+json',
        noteType: noteType as StrandNoteType,
        coAuthorIds,
        visibility: normalizedVisibility,
        type: StrandType.NOTE,
        metadata: {
          language: 'en',
          tags: normalizedTags,
          keywords: [],
          concepts: [],
          version: '1.0',
          citations: [],
          difficulty: (typeof difficulty === 'string' && difficulty && ['beginner', 'intermediate', 'advanced', 'expert'].includes(difficulty)) ? difficulty : 'beginner',
        } as any,
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
      contentDirtyRef.current = false;
      onSaveSuccess?.({
        strandId: saved.id,
        title: payload.title ?? saved.title ?? title,
        summary: payload.summary ?? saved.summary ?? summary,
        content,
        noteType,
        coAuthorIds,
        tags: normalizedTags,
        difficulty: difficulty || 'beginner',
      });

      if (prefs.reviewBeforeApply) {
        const suggestions = await suggestAutoMetadata({
          strandId: saved.id,
          plainText,
          existingTags: normalizedTags,
          maxBacklinks: prefs.maxBacklinks,
        });
        setReviewTags(suggestions.tags);
        setReviewRelated(suggestions.related);
        setReviewOpen(true);
      } else {
        // Background auto-metadata on default save path
        void runAutoMetadata({
          strandId: saved.id,
          plainText,
          existingTags: normalizedTags,
          options: {
            autoTag: prefs.autoTag,
            autoBacklinks: prefs.autoBacklinks,
            maxBacklinks: prefs.maxBacklinks,
          },
        });
      }
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Failed to save changes');
      toast.error(error instanceof Error ? error.message : 'Failed to save strand');
    } finally {
      setSaving(false);
    }
  }, [editor, onSave, strandId, title, summary, noteType, coAuthorIds, onSaveSuccess, tags, difficulty, prefs, runAutoMetadata, suggestAutoMetadata]);

  // Autosave after idle if enabled
  useEffect(() => {
    if (!prefs.autosave) return;
    if (!editor) return;
    const interval = setInterval(() => {
      if (contentDirtyRef.current && !saving) {
        void handleSave();
      }
    }, 8000);
    return () => clearInterval(interval);
  }, [prefs.autosave, editor, handleSave, saving]);

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
      <div className={cn(
        "relative flex flex-col",
        device.isPhone ? "gap-4" : "gap-6"
      )}>
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <FileText className={cn(
                "text-primary",
                device.isPhone ? "h-4 w-4" : "h-5 w-5"
              )} />
              <h1 className={cn(
                "font-semibold",
                device.isPhone ? "text-base" : "text-lg"
              )}>Strand Composer</h1>
            </div>
            {planBadge}
          </div>

          <div className={cn(
            "grid gap-4",
            device.isPhone && "grid-cols-1",
            device.isTablet && orientation.isPortrait && "grid-cols-1",
            device.isTablet && orientation.isLandscape && "md:grid-cols-[220px_1fr]",
            (device.isLaptop || device.isDesktop || device.isUltrawide) && "md:grid-cols-[220px_1fr]"
          )}>
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

            <div className={cn(
              "grid gap-3",
              device.isPhone ? "grid-cols-1" : "sm:grid-cols-2"
            )}>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium uppercase text-muted-foreground">Title</label>
                <Input 
                  value={title} 
                  onChange={(event) => setTitle(event.target.value)} 
                  placeholder="Give your strand a working title" 
                  className={device.isPhone ? "text-sm" : ""}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium uppercase text-muted-foreground">Summary</label>
                <Textarea 
                  value={summary} 
                  onChange={(event) => setSummary(event.target.value)} 
                  placeholder="One-line summary for quick scanning" 
                  rows={device.isPhone ? 1 : 2}
                  className={device.isPhone ? "text-sm" : ""} 
                />
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
              <Input
                value={tags}
                onChange={(event) => setTags(event.target.value)}
                placeholder="Comma-separated tags"
              />
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
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium uppercase text-muted-foreground">Visibility</label>
              <Select value={visibility} onValueChange={(v) => setVisibility(v as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select visibility" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">Private</SelectItem>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="unlisted">Unlisted</SelectItem>
                  <SelectItem value="team">Team</SelectItem>
                </SelectContent>
              </Select>
            </div>
        </div>
      </div>

      <div className="relative">
        {/* Editor Mode Toggle */}
        <div className="mb-4 flex items-center gap-2">
          <Button
            variant={editorMode === 'text' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setEditorMode('text')}
          >
            Text Editor
          </Button>
          <Button
            variant={editorMode === 'whiteboard' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setEditorMode('whiteboard')}
          >
            Whiteboard
          </Button>
        </div>

        {editorMode === 'text' ? (
          <>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" onClick={runCurrentCodeBlock}>
                Run current code block
              </Button>
              {lastCodeRun ? (
                <span className="text-xs text-muted-foreground">
                  Last run ({lastCodeRun.language}) at {new Date(lastCodeRun.ranAt).toLocaleTimeString()}
                </span>
              ) : null}
            </div>
            <FloatingVoiceRecorder
              strandId={strandId}
              planTier={planTier}
              onTranscriptReady={handleInsertTranscript}
            />

            <Card className="shadow-lg">
              <CardContent className={cn(
                "prose max-w-none rounded-md border border-border/60 bg-background/90 dark:prose-invert",
                device.isPhone && "min-h-[240px] px-4 py-3",
                device.isTablet && "min-h-[300px] px-5 py-4",
                (device.isLaptop || device.isDesktop || device.isUltrawide) && "min-h-[360px] px-6 py-5"
              )}>
                {loadingExisting ? (
                  <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
                    Loading strand…
                  </div>
                ) : null}
                <EditorContent editor={editor} />
              </CardContent>
            </Card>
          </>
        ) : (
          <WhiteboardPanel
            strandId={strandId}
            initialData={whiteboardData}
            onChange={setWhiteboardData}
            height={device.isPhone ? 300 : device.isTablet ? 400 : 500}
            autoSave={prefs.autosave}
            autoSaveInterval={8000}
          />
        )}
      </div>

      {/* Runnable snippet utility - optional helper side by side with editor */}
      <div className="mt-4">
        <CodeSnippetRunner
          hideControls
          onReady={(api) => {
            snippetApiRef.current = api;
          }}
        />
      </div>

        <MediaAttachmentWizard strandId={strandId} planTier={planTier} />
      <div className="mt-4">
        <ProjectImportWizard />
      </div>
        <InlineVisualizationWizard
          strandId={strandId}
          onAddVisualizationMetadata={(viz) => {
            setInlineVisualizations((prev) => [...prev, {
              id: viz.id,
              type: viz.type,
              title: viz.title,
              config: viz.config,
              data: viz.data,
              createdAt: viz.createdAt,
            }]);
          }}
        />

        <div className={cn(
          "flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 bg-background/80",
          device.isPhone ? "px-3 py-2 sticky bottom-2 z-10 backdrop-blur supports-[backdrop-filter]:bg-background/70" : "px-4 py-3"
        )}>
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>Autosave</span>
            <Switch checked={prefs.autosave} onCheckedChange={(v) => updatePrefs({ autosave: Boolean(v) })} />
            <span className="ml-3">Auto-tag</span>
            <Switch checked={prefs.autoTag} onCheckedChange={(v) => updatePrefs({ autoTag: Boolean(v) })} />
            <span className="ml-3">Auto-backlinks</span>
            <Switch checked={prefs.autoBacklinks} onCheckedChange={(v) => updatePrefs({ autoBacklinks: Boolean(v) })} />
            <span className="ml-3">Review before apply</span>
            <Switch checked={prefs.reviewBeforeApply} onCheckedChange={(v) => updatePrefs({ reviewBeforeApply: Boolean(v) })} />
          </div>
          <div className="flex items-center gap-2">
            {statusMessage ? <span className="text-xs text-muted-foreground">{statusMessage}</span> : null}
            <Button disabled={saving} onClick={handleSave} className="gap-2">
              <Save className="h-4 w-4" />
              {saving ? 'Saving…' : 'Save Draft'}
            </Button>
          </div>
        </div>
      </div>

      <AutoMetadataReviewModal
        open={reviewOpen}
        onOpenChange={setReviewOpen}
        tags={reviewTags}
        related={reviewRelated}
        onApply={async ({ tags: chosenTags, relatedIds }) => {
          const strand = (strandId || '').trim() ? strandId! : undefined;
          if (!strand) return;
          // Apply selected tags
          if (chosenTags.length) {
            await openstrandAPI.strands.update(strand, { metadata: { tags: Array.from(new Set([...(tags.split(',').map((t)=>t.trim()).filter(Boolean)), ...chosenTags])) } } as any);
          }
          // Apply selected backlinks
          if (relatedIds.length) {
            await Promise.allSettled(
              relatedIds.map((rid) =>
                openstrandAPI.strands.createRelationship(strand, {
                  targetId: rid,
                  type: 'related',
                  weight: 1,
                  metadata: { origin: 'review' },
                }),
              ),
            );
          }
          setStatusMessage('Metadata applied');
        }}
      />
    </TooltipProvider>
  );
}
