/**
 * Strand Editor Component
 *
 * Full-featured WYSIWYG/Markdown editor with:
 * - Auto-saving drafts locally (IndexedDB/localStorage)
 * - Live preview split screen
 * - Schema/frontmatter separation
 * - Publish to DB or GitHub PR (for codex repos)
 * - Template support
 *
 * @module components/editor/StrandEditor
 * @author OpenStrand <team@frame.dev>
 * @since 2.1.0
 */

'use client';

import React, {
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Save,
  Eye,
  EyeOff,
  Columns,
  Maximize2,
  Minimize2,
  Settings,
  Upload,
  GitBranch,
  ExternalLink,
  FileText,
  Code,
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Link,
  Image,
  Quote,
  Minus,
  Undo,
  Redo,
  Check,
  Clock,
  AlertCircle,
  ChevronDown,
  PanelLeft,
  PanelRight,
  Copy,
  Download,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

// ============================================================================
// TYPES
// ============================================================================

export interface StrandMetadata {
  title: string;
  slug?: string;
  summary?: string;
  tags: string[];
  strandType: string;
  classification?: string;
  difficulty?: string;
  prerequisites?: string[];
  visibility?: 'private' | 'team' | 'public';
  author?: string;
  created?: string;
  updated?: string;
  [key: string]: unknown;
}

export interface EditorDraft {
  id: string;
  strandId?: string;
  metadata: StrandMetadata;
  content: string;
  lastSaved: string;
  isDirty: boolean;
  version: number;
}

export interface PublishTarget {
  type: 'database' | 'github';
  repo?: string;
  branch?: string;
  path?: string;
}

export type EditorMode = 'edit' | 'preview' | 'split';
export type EditorSyntax = 'markdown' | 'wysiwyg';
export type SaveStatus = 'saved' | 'saving' | 'dirty' | 'error';

export interface StrandEditorProps {
  /** Initial strand ID (for editing existing) */
  strandId?: string;
  /** Initial metadata */
  initialMetadata?: Partial<StrandMetadata>;
  /** Initial content */
  initialContent?: string;
  /** Publish target configuration */
  publishTarget?: PublishTarget;
  /** Callback when saved to DB */
  onSave?: (metadata: StrandMetadata, content: string) => Promise<void>;
  /** Callback when publishing */
  onPublish?: (metadata: StrandMetadata, content: string, target: PublishTarget) => Promise<string>;
  /** Template to use */
  template?: string;
  /** Show metadata editor */
  showMetadataEditor?: boolean;
  /** Auto-save interval in ms */
  autoSaveInterval?: number;
  /** Class name */
  className?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_METADATA: StrandMetadata = {
  title: 'Untitled Strand',
  tags: [],
  strandType: 'document',
  classification: 'core',
  visibility: 'private',
};

const CODEX_REPO = 'framersai/codex';
const CODEX_TEMPLATES_PATH = 'templates';

const DRAFT_STORAGE_KEY = 'openstrand-drafts';
const AUTOSAVE_DEBOUNCE = 2000;

// ============================================================================
// DRAFT MANAGER (LOCAL STORAGE)
// ============================================================================

class DraftManager {
  private static instance: DraftManager;
  private drafts: Map<string, EditorDraft> = new Map();

  private constructor() {
    this.loadFromStorage();
  }

  static getInstance(): DraftManager {
    if (!DraftManager.instance) {
      DraftManager.instance = new DraftManager();
    }
    return DraftManager.instance;
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.drafts = new Map(Object.entries(parsed));
      }
    } catch (error) {
      console.error('Failed to load drafts:', error);
    }
  }

  private saveToStorage() {
    try {
      const obj = Object.fromEntries(this.drafts);
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(obj));
    } catch (error) {
      console.error('Failed to save drafts:', error);
    }
  }

  createDraft(strandId?: string): EditorDraft {
    const id = strandId || `draft-${Date.now()}`;
    const draft: EditorDraft = {
      id,
      strandId,
      metadata: { ...DEFAULT_METADATA },
      content: '',
      lastSaved: new Date().toISOString(),
      isDirty: false,
      version: 1,
    };
    this.drafts.set(id, draft);
    this.saveToStorage();
    return draft;
  }

  getDraft(id: string): EditorDraft | undefined {
    return this.drafts.get(id);
  }

  saveDraft(draft: EditorDraft): void {
    draft.lastSaved = new Date().toISOString();
    draft.isDirty = false;
    draft.version++;
    this.drafts.set(draft.id, draft);
    this.saveToStorage();
  }

  deleteDraft(id: string): void {
    this.drafts.delete(id);
    this.saveToStorage();
  }

  getAllDrafts(): EditorDraft[] {
    return Array.from(this.drafts.values());
  }

  hasDraft(id: string): boolean {
    return this.drafts.has(id);
  }
}

// ============================================================================
// MARKDOWN RENDERER
// ============================================================================

interface MarkdownPreviewProps {
  content: string;
  className?: string;
}

function MarkdownPreview({ content, className }: MarkdownPreviewProps) {
  // Simple markdown to HTML conversion
  // In production, use a proper library like react-markdown
  const html = useMemo(() => {
    let result = content
      // Headers
      .replace(/^### (.*$)/gm, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
      .replace(/^## (.*$)/gm, '<h2 class="text-xl font-semibold mt-6 mb-3">$1</h2>')
      .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mt-8 mb-4">$1</h1>')
      // Bold and italic
      .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary underline hover:no-underline" target="_blank" rel="noopener">$1</a>')
      // Images
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="max-w-full rounded-lg my-4" />')
      // Code blocks
      .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre class="bg-muted rounded-lg p-4 my-4 overflow-x-auto"><code>$2</code></pre>')
      // Inline code
      .replace(/`([^`]+)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-sm">$1</code>')
      // Blockquotes
      .replace(/^> (.*$)/gm, '<blockquote class="border-l-4 border-primary pl-4 italic my-4">$1</blockquote>')
      // Horizontal rules
      .replace(/^---$/gm, '<hr class="my-6 border-border" />')
      // Lists
      .replace(/^\* (.*$)/gm, '<li class="ml-4">$1</li>')
      .replace(/^\d+\. (.*$)/gm, '<li class="ml-4 list-decimal">$1</li>')
      // Paragraphs
      .replace(/\n\n/g, '</p><p class="my-4">')
      .replace(/\n/g, '<br />');

    return `<p class="my-4">${result}</p>`;
  }, [content]);

  return (
    <div
      className={cn('prose prose-sm dark:prose-invert max-w-none', className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

// ============================================================================
// METADATA EDITOR
// ============================================================================

interface MetadataEditorProps {
  metadata: StrandMetadata;
  onChange: (metadata: StrandMetadata) => void;
  className?: string;
}

function MetadataEditor({ metadata, onChange, className }: MetadataEditorProps) {
  const [tagInput, setTagInput] = useState('');

  const handleTagAdd = () => {
    if (tagInput.trim() && !metadata.tags.includes(tagInput.trim())) {
      onChange({
        ...metadata,
        tags: [...metadata.tags, tagInput.trim()],
      });
      setTagInput('');
    }
  };

  const handleTagRemove = (tag: string) => {
    onChange({
      ...metadata,
      tags: metadata.tags.filter((t) => t !== tag),
    });
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={metadata.title}
          onChange={(e) => onChange({ ...metadata, title: e.target.value })}
          placeholder="Enter strand title..."
        />
      </div>

      {/* Slug */}
      <div className="space-y-2">
        <Label htmlFor="slug">Slug</Label>
        <Input
          id="slug"
          value={metadata.slug || ''}
          onChange={(e) => onChange({ ...metadata, slug: e.target.value })}
          placeholder="url-friendly-slug"
        />
      </div>

      {/* Summary */}
      <div className="space-y-2">
        <Label htmlFor="summary">Summary</Label>
        <Textarea
          id="summary"
          value={metadata.summary || ''}
          onChange={(e) => onChange({ ...metadata, summary: e.target.value })}
          placeholder="Brief description..."
          rows={3}
        />
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <Label>Tags</Label>
        <div className="flex gap-2">
          <Input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            placeholder="Add tag..."
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleTagAdd())}
          />
          <Button type="button" onClick={handleTagAdd} variant="outline">
            Add
          </Button>
        </div>
        <div className="flex flex-wrap gap-1 mt-2">
          {metadata.tags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
              onClick={() => handleTagRemove(tag)}
            >
              {tag} ×
            </Badge>
          ))}
        </div>
      </div>

      {/* Type & Classification */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Type</Label>
          <Select
            value={metadata.strandType}
            onValueChange={(value) => onChange({ ...metadata, strandType: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="document">Document</SelectItem>
              <SelectItem value="note">Note</SelectItem>
              <SelectItem value="article">Article</SelectItem>
              <SelectItem value="guide">Guide</SelectItem>
              <SelectItem value="reference">Reference</SelectItem>
              <SelectItem value="collection">Collection</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Visibility</Label>
          <Select
            value={metadata.visibility || 'private'}
            onValueChange={(value) =>
              onChange({ ...metadata, visibility: value as 'private' | 'team' | 'public' })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="private">Private</SelectItem>
              <SelectItem value="team">Team</SelectItem>
              <SelectItem value="public">Public</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Difficulty */}
      <div className="space-y-2">
        <Label>Difficulty</Label>
        <Select
          value={metadata.difficulty || ''}
          onValueChange={(value) => onChange({ ...metadata, difficulty: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select difficulty..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="beginner">Beginner</SelectItem>
            <SelectItem value="intermediate">Intermediate</SelectItem>
            <SelectItem value="advanced">Advanced</SelectItem>
            <SelectItem value="expert">Expert</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

// ============================================================================
// EDITOR TOOLBAR
// ============================================================================

interface EditorToolbarProps {
  onFormat: (format: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

function EditorToolbar({ onFormat, onUndo, onRedo, canUndo, canRedo }: EditorToolbarProps) {
  return (
    <div className="flex items-center gap-1 p-2 border-b bg-muted/30">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={onUndo}
        disabled={!canUndo}
        title="Undo"
      >
        <Undo className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={onRedo}
        disabled={!canRedo}
        title="Redo"
      >
        <Redo className="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" className="h-6 mx-1" />

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => onFormat('bold')}
        title="Bold"
      >
        <Bold className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => onFormat('italic')}
        title="Italic"
      >
        <Italic className="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" className="h-6 mx-1" />

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => onFormat('h1')}
        title="Heading 1"
      >
        <Heading1 className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => onFormat('h2')}
        title="Heading 2"
      >
        <Heading2 className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => onFormat('h3')}
        title="Heading 3"
      >
        <Heading3 className="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" className="h-6 mx-1" />

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => onFormat('ul')}
        title="Bullet List"
      >
        <List className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => onFormat('ol')}
        title="Numbered List"
      >
        <ListOrdered className="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" className="h-6 mx-1" />

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => onFormat('link')}
        title="Link"
      >
        <Link className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => onFormat('image')}
        title="Image"
      >
        <Image className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => onFormat('quote')}
        title="Quote"
      >
        <Quote className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => onFormat('code')}
        title="Code"
      >
        <Code className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => onFormat('hr')}
        title="Horizontal Rule"
      >
        <Minus className="h-4 w-4" />
      </Button>
    </div>
  );
}

// ============================================================================
// PUBLISH DIALOG
// ============================================================================

interface PublishDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  metadata: StrandMetadata;
  publishTarget?: PublishTarget;
  onPublish: (target: PublishTarget, commitMessage: string) => void;
  isPublishing: boolean;
}

function PublishDialog({
  open,
  onOpenChange,
  metadata,
  publishTarget,
  onPublish,
  isPublishing,
}: PublishDialogProps) {
  const [target, setTarget] = useState<'database' | 'github'>(
    publishTarget?.type || 'database'
  );
  const [commitMessage, setCommitMessage] = useState(
    `Add/Update: ${metadata.title}`
  );
  const [branch, setBranch] = useState(publishTarget?.branch || 'main');
  const [createPR, setCreatePR] = useState(true);

  const handlePublish = () => {
    const finalTarget: PublishTarget =
      target === 'github'
        ? {
            type: 'github',
            repo: publishTarget?.repo || CODEX_REPO,
            branch: createPR ? `strand/${metadata.slug || 'new'}` : branch,
            path: publishTarget?.path,
          }
        : { type: 'database' };

    onPublish(finalTarget, commitMessage);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Publish Strand</DialogTitle>
          <DialogDescription>
            Publish your strand to the database or create a GitHub pull request.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Target selection */}
          <div className="space-y-2">
            <Label>Publish To</Label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="target"
                  value="database"
                  checked={target === 'database'}
                  onChange={() => setTarget('database')}
                  className="w-4 h-4"
                />
                <FileText className="h-4 w-4" />
                <span>Database</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="target"
                  value="github"
                  checked={target === 'github'}
                  onChange={() => setTarget('github')}
                  className="w-4 h-4"
                />
                <GitBranch className="h-4 w-4" />
                <span>GitHub (Codex)</span>
              </label>
            </div>
          </div>

          {/* GitHub options */}
          {target === 'github' && (
            <>
              <div className="space-y-2">
                <Label>Repository</Label>
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted p-2 rounded">
                  <GitBranch className="h-4 w-4" />
                  {publishTarget?.repo || CODEX_REPO}
                  <a
                    href={`https://github.com/${publishTarget?.repo || CODEX_REPO}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-auto"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="create-pr">Create Pull Request</Label>
                <Switch
                  id="create-pr"
                  checked={createPR}
                  onCheckedChange={setCreatePR}
                />
              </div>

              {!createPR && (
                <div className="space-y-2">
                  <Label htmlFor="branch">Branch</Label>
                  <Input
                    id="branch"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    placeholder="main"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="commit-message">Commit Message</Label>
                <Input
                  id="commit-message"
                  value={commitMessage}
                  onChange={(e) => setCommitMessage(e.target.value)}
                  placeholder="Describe your changes..."
                />
              </div>
            </>
          )}

          {/* Summary */}
          <div className="bg-muted p-3 rounded-lg text-sm space-y-1">
            <p>
              <strong>Title:</strong> {metadata.title}
            </p>
            <p>
              <strong>Type:</strong> {metadata.strandType}
            </p>
            <p>
              <strong>Tags:</strong> {metadata.tags.join(', ') || 'None'}
            </p>
            {target === 'github' && createPR && (
              <p className="text-primary">
                A PR will be created for review before merging.
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handlePublish} disabled={isPublishing}>
            {isPublishing ? (
              <>
                <Clock className="h-4 w-4 mr-2 animate-spin" />
                Publishing...
              </>
            ) : target === 'github' && createPR ? (
              <>
                <GitBranch className="h-4 w-4 mr-2" />
                Create PR
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Publish
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// IMAGE UPLOAD DIALOG
// ============================================================================

interface ImageUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (file: File) => void;
  onUrlInsert: (url: string, alt: string) => void;
  isUploading: boolean;
}

function ImageUploadDialog({
  open,
  onOpenChange,
  onUpload,
  onUrlInsert,
  isUploading,
}: ImageUploadDialogProps) {
  const [mode, setMode] = useState<'upload' | 'url'>('upload');
  const [url, setUrl] = useState('');
  const [altText, setAltText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      onUpload(file);
    }
  };

  const handleUrlSubmit = () => {
    if (url.trim()) {
      onUrlInsert(url.trim(), altText.trim());
      setUrl('');
      setAltText('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Insert Image</DialogTitle>
          <DialogDescription>
            Upload an image or paste a URL
          </DialogDescription>
        </DialogHeader>

        <Tabs value={mode} onValueChange={(v) => setMode(v as 'upload' | 'url')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">Upload</TabsTrigger>
            <TabsTrigger value="url">URL</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4">
            <div
              className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
              />
              {isUploading ? (
                <div className="space-y-2">
                  <Clock className="h-8 w-8 mx-auto animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Uploading...</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Image className="h-8 w-8 mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Click to select or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PNG, JPG, GIF, WebP up to 10MB
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="url" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="image-url">Image URL</Label>
              <Input
                id="image-url"
                placeholder="https://example.com/image.png"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="alt-text">Alt Text (optional)</Label>
              <Input
                id="alt-text"
                placeholder="Description of the image"
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
              />
            </div>
            <Button onClick={handleUrlSubmit} disabled={!url.trim()} className="w-full">
              Insert Image
            </Button>
          </TabsContent>
        </Tabs>

        <p className="text-xs text-muted-foreground text-center">
          Tip: You can also paste images directly in the editor (Ctrl+V)
        </p>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// MAIN EDITOR COMPONENT
// ============================================================================

/**
 * Full-featured strand editor with auto-save and publish capabilities
 *
 * @example
 * ```tsx
 * <StrandEditor
 *   strandId="existing-strand-id"
 *   initialMetadata={{ title: 'My Doc' }}
 *   publishTarget={{ type: 'github', repo: 'framersai/codex' }}
 *   onSave={async (meta, content) => await saveStrand(meta, content)}
 *   onPublish={async (meta, content, target) => await publishStrand(meta, content, target)}
 *   showMetadataEditor
 *   autoSaveInterval={2000}
 * />
 * ```
 */
export function StrandEditor({
  strandId,
  initialMetadata,
  initialContent = '',
  publishTarget,
  onSave,
  onPublish,
  template,
  showMetadataEditor = true,
  autoSaveInterval = AUTOSAVE_DEBOUNCE,
  className,
}: StrandEditorProps) {
  // Refs
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // State
  const [mode, setMode] = useState<EditorMode>('split');
  const [syntax, setSyntax] = useState<EditorSyntax>('markdown');
  const [metadata, setMetadata] = useState<StrandMetadata>({
    ...DEFAULT_METADATA,
    ...initialMetadata,
  });
  const [content, setContent] = useState(initialContent);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [showMetadataPanel, setShowMetadataPanel] = useState(false);
  const [history, setHistory] = useState<string[]>([initialContent]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Draft manager
  const draftManager = DraftManager.getInstance();
  const draftId = strandId || `new-${Date.now()}`;

  // Load draft on mount
  useEffect(() => {
    const existingDraft = draftManager.getDraft(draftId);
    if (existingDraft) {
      setMetadata(existingDraft.metadata);
      setContent(existingDraft.content);
      setHistory([existingDraft.content]);
    }
  }, [draftId]);

  // Auto-save draft
  useEffect(() => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    setSaveStatus('dirty');

    autoSaveTimerRef.current = setTimeout(() => {
      const draft: EditorDraft = {
        id: draftId,
        strandId,
        metadata,
        content,
        lastSaved: new Date().toISOString(),
        isDirty: false,
        version: 1,
      };
      draftManager.saveDraft(draft);
      setSaveStatus('saved');
    }, autoSaveInterval);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [metadata, content, autoSaveInterval, draftId, strandId]);

  // Format handlers
  const handleFormat = useCallback((format: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);

    let replacement = '';
    let cursorOffset = 0;

    switch (format) {
      case 'bold':
        replacement = `**${selectedText || 'bold text'}**`;
        cursorOffset = selectedText ? 0 : -2;
        break;
      case 'italic':
        replacement = `*${selectedText || 'italic text'}*`;
        cursorOffset = selectedText ? 0 : -1;
        break;
      case 'h1':
        replacement = `# ${selectedText || 'Heading 1'}`;
        break;
      case 'h2':
        replacement = `## ${selectedText || 'Heading 2'}`;
        break;
      case 'h3':
        replacement = `### ${selectedText || 'Heading 3'}`;
        break;
      case 'ul':
        replacement = `* ${selectedText || 'List item'}`;
        break;
      case 'ol':
        replacement = `1. ${selectedText || 'List item'}`;
        break;
      case 'link':
        replacement = `[${selectedText || 'link text'}](url)`;
        cursorOffset = selectedText ? -1 : -5;
        break;
      case 'image':
        // Open image upload dialog instead of inserting placeholder
        setShowImageUpload(true);
        return;
      case 'quote':
        replacement = `> ${selectedText || 'Quote'}`;
        break;
      case 'code':
        replacement = selectedText.includes('\n')
          ? `\`\`\`\n${selectedText}\n\`\`\``
          : `\`${selectedText || 'code'}\``;
        break;
      case 'hr':
        replacement = '\n---\n';
        break;
      default:
        return;
    }

    const newContent =
      content.substring(0, start) + replacement + content.substring(end);
    setContent(newContent);

    // Update history
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newContent);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);

    // Set cursor position
    setTimeout(() => {
      textarea.focus();
      const newPosition = start + replacement.length + cursorOffset;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  }, [content, history, historyIndex]);

  // Undo/Redo
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setContent(history[historyIndex - 1]);
    }
  }, [historyIndex, history]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setContent(history[historyIndex + 1]);
    }
  }, [historyIndex, history]);

  // Image upload handler
  const handleImageUpload = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    setUploadingImage(true);
    try {
      // For now, create a local blob URL (in production, upload to server/CDN)
      const url = URL.createObjectURL(file);
      const altText = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      
      const textarea = textareaRef.current;
      if (textarea) {
        const start = textarea.selectionStart;
        const imageMarkdown = `![${altText}](${url})`;
        const newContent =
          content.substring(0, start) + imageMarkdown + content.substring(start);
        setContent(newContent);
        
        // Update history
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(newContent);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
      }
      
      toast.success('Image added');
      setShowImageUpload(false);
    } catch (error) {
      toast.error('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  }, [content, history, historyIndex]);

  const handleImageUrlInsert = useCallback((url: string, altText: string) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const imageMarkdown = `![${altText || 'image'}](${url})`;
      const newContent =
        content.substring(0, start) + imageMarkdown + content.substring(start);
      setContent(newContent);
      
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(newContent);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }
    setShowImageUpload(false);
  }, [content, history, historyIndex]);

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type.startsWith('image/')) {
      handleImageUpload(files[0]);
    }
  }, [handleImageUpload]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          handleImageUpload(file);
          return;
        }
      }
    }
  }, [handleImageUpload]);

  // Content change handler
  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);

    // Update history (debounced)
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newContent);
    if (newHistory.length > 50) newHistory.shift(); // Limit history
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  // Save handler
  const handleSave = async () => {
    try {
      setSaveStatus('saving');
      await onSave?.(metadata, content);
      draftManager.deleteDraft(draftId);
      setSaveStatus('saved');
      toast.success('Saved successfully');
    } catch (error) {
      setSaveStatus('error');
      toast.error('Failed to save');
    }
  };

  // Publish handler
  const handlePublish = async (target: PublishTarget, commitMessage: string) => {
    try {
      setIsPublishing(true);

      const result = await onPublish?.(metadata, content, target);

      if (target.type === 'github' && result) {
        // Open PR in new tab
        window.open(result, '_blank');
        toast.success('Pull request created!');
      } else {
        toast.success('Published successfully!');
      }

      draftManager.deleteDraft(draftId);
      setShowPublishDialog(false);
    } catch (error) {
      toast.error('Failed to publish');
    } finally {
      setIsPublishing(false);
    }
  };

  // Save status icon
  const SaveStatusIcon = useMemo(() => {
    switch (saveStatus) {
      case 'saved':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'saving':
        return <Clock className="h-4 w-4 text-yellow-500 animate-spin" />;
      case 'dirty':
        return <Clock className="h-4 w-4 text-muted-foreground" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
    }
  }, [saveStatus]);

  return (
    <div className={cn('flex flex-col h-full bg-background', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b">
        <div className="flex items-center gap-3">
          <h2 className="font-semibold truncate max-w-md">{metadata.title}</h2>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            {SaveStatusIcon}
            <span>
              {saveStatus === 'saved'
                ? 'Saved'
                : saveStatus === 'saving'
                ? 'Saving...'
                : 'Unsaved changes'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex items-center border rounded-lg">
            <Button
              variant={mode === 'edit' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setMode('edit')}
              className="rounded-r-none"
            >
              <Code className="h-4 w-4" />
            </Button>
            <Button
              variant={mode === 'split' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setMode('split')}
              className="rounded-none border-x"
            >
              <Columns className="h-4 w-4" />
            </Button>
            <Button
              variant={mode === 'preview' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setMode('preview')}
              className="rounded-l-none"
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Metadata panel toggle */}
          <Button
            variant={showMetadataPanel ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setShowMetadataPanel(!showMetadataPanel)}
          >
            <Settings className="h-4 w-4 mr-1" />
            Metadata
          </Button>

          {/* Save button */}
          <Button variant="outline" size="sm" onClick={handleSave}>
            <Save className="h-4 w-4 mr-1" />
            Save
          </Button>

          {/* Publish button */}
          <Button size="sm" onClick={() => setShowPublishDialog(true)}>
            <Upload className="h-4 w-4 mr-1" />
            Publish
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      {mode !== 'preview' && (
        <EditorToolbar
          onFormat={handleFormat}
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={historyIndex > 0}
          canRedo={historyIndex < history.length - 1}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Metadata panel */}
        <AnimatePresence>
          {showMetadataPanel && showMetadataEditor && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="border-r overflow-hidden"
            >
              <div className="p-4 h-full overflow-auto">
                <h3 className="font-semibold mb-4">Strand Metadata</h3>
                <MetadataEditor metadata={metadata} onChange={setMetadata} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Editor/Preview */}
        <div className="flex-1 flex overflow-hidden">
          {/* Editor pane */}
          {mode !== 'preview' && (
            <div
              className={cn(
                'flex-1 flex flex-col overflow-hidden',
                mode === 'split' && 'border-r'
              )}
            >
              <textarea
                ref={textareaRef}
                value={content}
                onChange={handleContentChange}
                onPaste={handlePaste}
                onDrop={handleFileDrop}
                onDragOver={(e) => e.preventDefault()}
                className={cn(
                  'flex-1 w-full p-4 resize-none outline-none',
                  'font-mono text-sm bg-background',
                  'focus:ring-0 focus:outline-none'
                )}
                placeholder="Start writing your strand content here... (paste images with Ctrl+V)"
                spellCheck={false}
              />
            </div>
          )}

          {/* Preview pane */}
          {(mode === 'preview' || mode === 'split') && (
            <div className="flex-1 overflow-auto p-6">
              <div className="max-w-3xl mx-auto">
                <h1 className="text-3xl font-bold mb-4">{metadata.title}</h1>
                {metadata.summary && (
                  <p className="text-lg text-muted-foreground mb-6">
                    {metadata.summary}
                  </p>
                )}
                {metadata.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-6">
                    {metadata.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
                <Separator className="mb-6" />
                <MarkdownPreview content={content} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Publish dialog */}
      <PublishDialog
        open={showPublishDialog}
        onOpenChange={setShowPublishDialog}
        metadata={metadata}
        publishTarget={publishTarget}
        onPublish={handlePublish}
        isPublishing={isPublishing}
      />

      {/* Image upload dialog */}
      <ImageUploadDialog
        open={showImageUpload}
        onOpenChange={setShowImageUpload}
        onUpload={handleImageUpload}
        onUrlInsert={handleImageUrlInsert}
        isUploading={uploadingImage}
      />
    </div>
  );
}

export default StrandEditor;

