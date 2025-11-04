'use client';

/**
 * Lightweight editor for AI Artisan generated code.
 * Provides tabbed HTML/CSS/JS views with optional editing and copy/reset helpers.
 */

import { useEffect, useMemo, useState } from 'react';
import { ClipboardCopy, RotateCcw } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import type { AIArtisanResult } from '@/lib/visualization/types';

const EDITOR_TABS = ['html', 'css', 'js'] as const;
type EditorTab = (typeof EDITOR_TABS)[number];

const TAB_LABELS: Record<EditorTab, string> = {
  html: 'HTML',
  css: 'CSS',
  js: 'JavaScript',
};

interface AIArtisanEditorProps {
  code: AIArtisanResult['code'];
  onChange?: (code: AIArtisanResult['code']) => void;
  readOnly?: boolean;
  className?: string;
}

export function AIArtisanEditor({
  code,
  onChange,
  readOnly = false,
  className,
}: AIArtisanEditorProps) {
  const normalizedCode = useMemo(
    () => ({
      html: code.html ?? '',
      css: code.css ?? '',
      js: code.js ?? '',
    }),
    [code]
  );

  const [activeTab, setActiveTab] = useState<EditorTab>('js');
  const [draft, setDraft] = useState(normalizedCode);

  useEffect(() => {
    setDraft(normalizedCode);
  }, [normalizedCode]);

  const handleChange = (key: EditorTab, value: string) => {
    const next = { ...draft, [key]: value };
    setDraft(next);
    onChange?.(next);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(draft[activeTab] ?? '');
      toast.success(`${TAB_LABELS[activeTab]} copied to clipboard`);
    } catch (error) {
      console.error('Failed to copy AI Artisan code', error);
      toast.error('Could not copy code. Please copy manually.');
    }
  };

  const handleReset = () => {
    setDraft(normalizedCode);
    onChange?.(normalizedCode);
    toast.success('AI Artisan code reset');
  };

  return (
    <div className={cn('rounded-xl border border-border/60 bg-muted/20 p-4', className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold">AI Artisan Code</h3>
          <p className="text-xs text-muted-foreground">
            Review and refine the generated HTML, CSS, and JavaScript.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleCopy}>
            <ClipboardCopy className="mr-2 h-4 w-4" />
            Copy {TAB_LABELS[activeTab]}
          </Button>
          {!readOnly && (
            <Button variant="ghost" size="sm" onClick={handleReset}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as EditorTab)} className="mt-4">
        <TabsList className="grid grid-cols-3">
          {EDITOR_TABS.map((tab) => (
            <TabsTrigger key={tab} value={tab}>
              {TAB_LABELS[tab]}
            </TabsTrigger>
          ))}
        </TabsList>
        {EDITOR_TABS.map((tab) => (
          <TabsContent key={tab} value={tab} className="focus-visible:outline-none focus-visible:ring-0">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {TAB_LABELS[tab]}
            </label>
            <textarea
              value={draft[tab] ?? ''}
              onChange={(event) => handleChange(tab, event.target.value)}
              readOnly={readOnly}
              spellCheck={false}
              className={cn(
                'min-h-[200px] w-full rounded-lg border bg-background font-mono text-sm leading-relaxed shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
                readOnly && 'cursor-not-allowed bg-muted/30 text-muted-foreground'
              )}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

