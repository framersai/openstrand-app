'use client';

/**
 * @module composer/wizard/MarkdownEditor
 * @description Markdown template selector and editor
 */

import { useState, useCallback, useMemo } from 'react';
import { 
  FileCode, 
  FileText,
  BookOpen,
  GraduationCap,
  FlaskConical,
  Users,
  Eye,
  Edit3,
  Copy,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { MARKDOWN_TEMPLATES } from './types';

const TEMPLATE_ICONS: Record<string, React.ElementType> = {
  note: FileText,
  article: BookOpen,
  tutorial: GraduationCap,
  research: FlaskConical,
  meeting: Users,
};

interface MarkdownEditorProps {
  content: string;
  onContentChange: (content: string) => void;
  title: string;
  summary: string;
  difficulty: string;
  estimatedTime: number;
}

export function MarkdownEditor({
  content,
  onContentChange,
  title,
  summary,
  difficulty,
  estimatedTime,
}: MarkdownEditorProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
  const [copied, setCopied] = useState(false);

  const applyTemplate = useCallback((templateId: string) => {
    const template = MARKDOWN_TEMPLATES.find(t => t.id === templateId);
    if (!template) return;

    // Replace placeholders
    let processed = template.template
      .replace(/\{\{title\}\}/g, title || 'Untitled')
      .replace(/\{\{summary\}\}/g, summary || 'Add a summary...')
      .replace(/\{\{difficulty\}\}/g, difficulty || 'beginner')
      .replace(/\{\{estimatedTime\}\}/g, String(estimatedTime || 15))
      .replace(/\{\{date\}\}/g, new Date().toLocaleDateString());

    onContentChange(processed);
    setSelectedTemplate(templateId);
  }, [title, summary, difficulty, estimatedTime, onContentChange]);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [content]);

  // Simple markdown to HTML preview
  const previewHtml = useMemo(() => {
    if (!content) return '';
    
    return content
      // Headers
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mt-6 mb-3">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-6 mb-4">$1</h1>')
      // Bold
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      // Blockquotes
      .replace(/^\> (.*$)/gim, '<blockquote class="border-l-4 border-primary/30 pl-4 italic text-muted-foreground my-4">$1</blockquote>')
      // Unordered lists
      .replace(/^\- (.*$)/gim, '<li class="ml-4">$1</li>')
      // Ordered lists
      .replace(/^\d+\. (.*$)/gim, '<li class="ml-4 list-decimal">$1</li>')
      // Checkboxes
      .replace(/^\- \[ \] (.*$)/gim, '<div class="flex items-center gap-2"><input type="checkbox" disabled class="rounded" /><span>$1</span></div>')
      .replace(/^\- \[x\] (.*$)/gim, '<div class="flex items-center gap-2"><input type="checkbox" checked disabled class="rounded" /><span class="line-through text-muted-foreground">$1</span></div>')
      // Code blocks
      .replace(/```(\w+)?\n([\s\S]*?)```/gim, '<pre class="bg-muted p-4 rounded-lg overflow-x-auto my-4"><code>$2</code></pre>')
      // Inline code
      .replace(/`([^`]+)`/gim, '<code class="bg-muted px-1.5 py-0.5 rounded text-sm">$1</code>')
      // Links
      .replace(/\[([^\]]+)\]\(([^\)]+)\)/gim, '<a href="$2" class="text-primary hover:underline">$1</a>')
      // Horizontal rule
      .replace(/^---$/gim, '<hr class="my-6 border-border" />')
      // Paragraphs
      .replace(/\n\n/gim, '</p><p class="my-3">')
      // Line breaks
      .replace(/\n/gim, '<br />');
  }, [content]);

  return (
    <div className="space-y-4">
      {/* Template Selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Start with a template</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {MARKDOWN_TEMPLATES.map((template) => {
            const Icon = TEMPLATE_ICONS[template.id] || FileCode;
            const isSelected = selectedTemplate === template.id;
            
            return (
              <button
                key={template.id}
                type="button"
                onClick={() => applyTemplate(template.id)}
                className={cn(
                  "flex flex-col items-center gap-2 p-3 rounded-lg border transition-all text-center",
                  "hover:border-primary/50 hover:bg-primary/5",
                  isSelected
                    ? "border-primary bg-primary/10"
                    : "border-border bg-card"
                )}
              >
                <Icon className={cn(
                  "h-5 w-5",
                  isSelected ? "text-primary" : "text-muted-foreground"
                )} />
                <div>
                  <div className="text-sm font-medium">{template.title}</div>
                  <div className="text-[10px] text-muted-foreground line-clamp-1">
                    {template.description}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Editor/Preview */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-foreground">Content</label>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-7 text-xs"
              disabled={!content}
            >
              {copied ? (
                <Check className="h-3 w-3 mr-1 text-green-500" />
              ) : (
                <Copy className="h-3 w-3 mr-1" />
              )}
              {copied ? 'Copied!' : 'Copy'}
            </Button>
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'edit' | 'preview')}>
              <TabsList className="h-7">
                <TabsTrigger value="edit" className="text-xs h-6 px-2 gap-1">
                  <Edit3 className="h-3 w-3" />
                  Edit
                </TabsTrigger>
                <TabsTrigger value="preview" className="text-xs h-6 px-2 gap-1">
                  <Eye className="h-3 w-3" />
                  Preview
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {viewMode === 'edit' ? (
          <Textarea
            value={content}
            onChange={(e) => onContentChange(e.target.value)}
            placeholder="Write your content in Markdown..."
            className="min-h-[300px] font-mono text-sm resize-y"
          />
        ) : (
          <div 
            className="min-h-[300px] p-4 rounded-lg border border-border bg-card overflow-y-auto prose prose-sm dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: previewHtml || '<p class="text-muted-foreground">Nothing to preview yet...</p>' }}
          />
        )}

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {content.split(/\s+/).filter(Boolean).length} words · {content.length} characters
          </span>
          <Badge variant="outline" className="text-[10px]">
            Markdown supported
          </Badge>
        </div>
      </div>

      {/* Markdown Tips */}
      <details className="group">
        <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
          Markdown formatting tips
        </summary>
        <div className="mt-2 p-3 bg-muted/50 rounded-lg text-xs space-y-1">
          <p><code className="bg-muted px-1 rounded"># Heading 1</code> · <code className="bg-muted px-1 rounded">## Heading 2</code> · <code className="bg-muted px-1 rounded">### Heading 3</code></p>
          <p><code className="bg-muted px-1 rounded">**bold**</code> · <code className="bg-muted px-1 rounded">*italic*</code> · <code className="bg-muted px-1 rounded">`code`</code></p>
          <p><code className="bg-muted px-1 rounded">- list item</code> · <code className="bg-muted px-1 rounded">1. numbered</code> · <code className="bg-muted px-1 rounded">- [ ] checkbox</code></p>
          <p><code className="bg-muted px-1 rounded">[link](url)</code> · <code className="bg-muted px-1 rounded">&gt; blockquote</code> · <code className="bg-muted px-1 rounded">---</code> horizontal rule</p>
        </div>
      </details>
    </div>
  );
}

