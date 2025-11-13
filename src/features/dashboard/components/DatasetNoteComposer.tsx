'use client';

/**
 * @module features/dashboard/components/DatasetNoteComposer
 * @description Minimal TipTap-powered composer tailored for dataset context notes inside the dashboard.
 */

import { useCallback, useMemo, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { lowlight } from 'lowlight';
import ts from 'highlight.js/lib/languages/typescript';
import js from 'highlight.js/lib/languages/javascript';
import json from 'highlight.js/lib/languages/json';
import bash from 'highlight.js/lib/languages/bash';
import python from 'highlight.js/lib/languages/python';
import markdown from 'highlight.js/lib/languages/markdown';
import { Save, RotateCcw, Type } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export interface DatasetNoteComposerProps {
  /**
   * Optional initial content for the editor. Accepts TipTap JSON or HTML string.
   */
  initialContent?: string | Record<string, any>;
  /**
   * Dataset name used for placeholder copy.
   */
  datasetName?: string | null;
  /**
   * Persist note content upstream. The handler receives TipTap JSON for easier storage.
   */
  onSave?: (payload: { content: Record<string, any>; plainText: string }) => Promise<void> | void;
  /**
   * Optional callback when user clears the current draft.
   */
  onReset?: () => void;
  /**
   * When provided, enables background auto-metadata (tags/backlinks) after save.
   * The strandId should refer to the dataset strand representing this dataset.
   */
  strandId?: string;
  /**
   * Toggle for running auto-metadata on save. Defaults to false to avoid surprises.
   */
  autoMetadata?: boolean;
}

/**
 * A lightweight WYSIWYG composer for capturing insights or TODOs while analysing a dataset.
 * Designed to live alongside the inspector so analysts can draft narrative context without
 * jumping into the full strand composer.
 */
export function DatasetNoteComposer({
  initialContent,
  datasetName,
  onSave,
  onReset,
  strandId,
  autoMetadata = false,
}: DatasetNoteComposerProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusTone, setStatusTone] = useState<'success' | 'error' | null>(null);
  const { run: runAutoMetadata } = require('../../composer/hooks/useAutoMetadata') as {
    run: (params: { strandId: string; plainText?: string; existingTags?: string[]; options: { autoTag: boolean; autoBacklinks: boolean; maxBacklinks?: number } }) => Promise<any>;
  };
  // Register popular languages once (safe to call multiple times)
  lowlight.registerLanguage('typescript', ts);
  lowlight.registerLanguage('javascript', js);
  lowlight.registerLanguage('json', json);
  lowlight.registerLanguage('bash', bash);
  lowlight.registerLanguage('shell', bash);
  lowlight.registerLanguage('python', python);
  lowlight.registerLanguage('md', markdown);
  lowlight.registerLanguage('markdown', markdown);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        bulletList: { keepMarks: true },
        orderedList: { keepMarks: true },
      }),
      CodeBlockLowlight.configure({
        lowlight,
        defaultLanguage: 'typescript',
      }),
      Placeholder.configure({
        placeholder: datasetName
          ? `Capture the story behind ${datasetName}...`
          : 'Capture the story as you explore this dataset...',
      }),
    ],
    content: initialContent ?? '<p></p>',
    autofocus: false,
  });

  const canUndo = editor ? editor.can().undo() : false;
  const canRedo = editor ? editor.can().redo() : false;
  const hasContent = useMemo(() => {
    if (!editor) return false;
    return editor.getText().trim().length > 0;
  }, [editor]);

  const handleSave = useCallback(async () => {
    if (!editor || !onSave) return;
    const json = editor.getJSON();
    const plainText = editor.getText();

    try {
      setIsSaving(true);
      setStatusMessage(null);
      setStatusTone(null);
      await onSave({ content: json, plainText });
      editor.commands.clearContent();
      setStatusTone('success');
      setStatusMessage('Note saved to strands');

      // Optional background auto-metadata for the dataset strand
      if (autoMetadata && typeof strandId === 'string' && strandId.trim().length > 0) {
        void runAutoMetadata({
          strandId,
          plainText,
          existingTags: [],
          options: {
            autoTag: true,
            autoBacklinks: false,
          },
        }).catch(() => undefined);
      }
    } catch (error) {
      setStatusTone('error');
      setStatusMessage(
        error instanceof Error ? error.message : 'Failed to save note. Please try again.'
      );
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [editor, onSave]);

  const handleReset = useCallback(() => {
    if (!editor) return;
    editor.commands.clearContent();
    setStatusMessage(null);
    setStatusTone(null);
    onReset?.();
  }, [editor, onReset]);

  if (!editor) {
    return null;
  }

  return (
    <Card className="shadow-sm">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Type className="h-4 w-4 text-primary" />
            Dataset notes
          </span>
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => editor.commands.undo()}
              disabled={!canUndo}
              className="h-8 w-8"
              aria-label="Undo"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => editor.commands.redo()}
              disabled={!canRedo}
              className="h-8 w-8 rotate-180"
              aria-label="Redo"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="min-h-[160px] rounded-xl border border-border/60 bg-background/80 p-3">
          <EditorContent editor={editor} className="prose prose-sm max-w-none dark:prose-invert" />
        </div>

        <div className="flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            disabled={!hasContent}
            className="gap-2 text-muted-foreground"
          >
            <RotateCcw className="h-4 w-4" />
            Clear draft
          </Button>
          <Button
            size="sm"
            className="gap-2"
            onClick={() => {
              void handleSave().catch(() => undefined);
            }}
            disabled={!hasContent || isSaving}
          >
            <Save className="h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save note'}
          </Button>
        </div>
        {statusMessage ? (
          <p
            className={`text-xs ${
              statusTone === 'error' ? 'text-destructive' : 'text-muted-foreground'
            }`}
          >
            {statusMessage}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
