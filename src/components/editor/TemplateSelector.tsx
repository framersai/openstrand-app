/**
 * Template Selector Component
 *
 * Component for browsing and selecting strand templates from
 * the framersai/codex repository.
 *
 * @module components/editor/TemplateSelector
 * @author OpenStrand <team@frame.dev>
 * @since 2.1.0
 */

'use client';

import React, { useState, useMemo } from 'react';
import {
  FileText,
  Folder,
  BookOpen,
  Code,
  Lightbulb,
  Layers,
  ExternalLink,
  Search,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { StrandTemplate } from '@/services/github.service';

// ============================================================================
// TYPES
// ============================================================================

export interface TemplateSelectorProps {
  templates: StrandTemplate[];
  isLoading?: boolean;
  onSelect: (template: StrandTemplate) => void;
  triggerLabel?: string;
  className?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  general: FileText,
  documentation: BookOpen,
  guide: Layers,
  reference: Code,
  tutorial: Lightbulb,
  collection: Folder,
};

const CATEGORY_LABELS: Record<string, string> = {
  general: 'General',
  documentation: 'Documentation',
  guide: 'Guides',
  reference: 'Reference',
  tutorial: 'Tutorials',
  collection: 'Collections',
};

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Template selector dialog with search and categorization
 *
 * @example
 * ```tsx
 * <TemplateSelector
 *   templates={templates}
 *   onSelect={(template) => loadTemplate(template)}
 *   triggerLabel="Use Template"
 * />
 * ```
 */
export function TemplateSelector({
  templates,
  isLoading,
  onSelect,
  triggerLabel = 'Templates',
  className,
}: TemplateSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set(templates.map((t) => t.category));
    return ['all', ...Array.from(cats)];
  }, [templates]);

  // Filter templates
  const filteredTemplates = useMemo(() => {
    return templates.filter((template) => {
      const matchesSearch =
        !search ||
        template.name.toLowerCase().includes(search.toLowerCase()) ||
        template.description.toLowerCase().includes(search.toLowerCase()) ||
        template.metadata.tags.some((t) =>
          t.toLowerCase().includes(search.toLowerCase())
        );

      const matchesCategory =
        selectedCategory === 'all' || template.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [templates, search, selectedCategory]);

  const handleSelect = (template: StrandTemplate) => {
    onSelect(template);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className={className}>
          <Layers className="h-4 w-4 mr-1" />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Choose a Template</DialogTitle>
          <DialogDescription>
            Start from a template to quickly create your strand.
            <a
              href="https://github.com/framersai/codex/tree/main/templates"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center ml-1 text-primary hover:underline"
            >
              View on GitHub
              <ExternalLink className="h-3 w-3 ml-0.5" />
            </a>
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Categories */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="grid w-full grid-cols-4 h-auto">
            {categories.slice(0, 4).map((category) => {
              const Icon = CATEGORY_ICONS[category] || FileText;
              return (
                <TabsTrigger
                  key={category}
                  value={category}
                  className="text-xs py-1.5"
                >
                  <Icon className="h-3.5 w-3.5 mr-1" />
                  {CATEGORY_LABELS[category] || category}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>

        {/* Template list */}
        <ScrollArea className="flex-1 -mx-6 px-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
              <FileText className="h-8 w-8 mb-2" />
              <p className="text-sm">No templates found</p>
              {search && (
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => setSearch('')}
                >
                  Clear search
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2 pb-4">
              {filteredTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onSelect={handleSelect}
                />
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t text-xs text-muted-foreground">
          <span>
            {filteredTemplates.length} of {templates.length} templates
          </span>
          <a
            href="https://github.com/framersai/codex/new/main/templates"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center hover:text-foreground"
          >
            Contribute a template
            <ExternalLink className="h-3 w-3 ml-1" />
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// TEMPLATE CARD
// ============================================================================

interface TemplateCardProps {
  template: StrandTemplate;
  onSelect: (template: StrandTemplate) => void;
}

function TemplateCard({ template, onSelect }: TemplateCardProps) {
  const Icon = CATEGORY_ICONS[template.category] || FileText;

  return (
    <button
      onClick={() => onSelect(template)}
      className={cn(
        'w-full text-left p-4 rounded-lg border',
        'hover:bg-accent/50 hover:border-primary/50 transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-ring'
      )}
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-md bg-muted">
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-medium truncate">{template.name}</h4>
            {template.metadata.difficulty && (
              <Badge variant="outline" className="text-xs">
                {template.metadata.difficulty}
              </Badge>
            )}
          </div>
          {template.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {template.description}
            </p>
          )}
          {template.metadata.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {template.metadata.tags.slice(0, 5).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {template.metadata.tags.length > 5 && (
                <Badge variant="secondary" className="text-xs">
                  +{template.metadata.tags.length - 5}
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

// ============================================================================
// QUICK TEMPLATES
// ============================================================================

interface QuickTemplatesProps {
  templates: StrandTemplate[];
  onSelect: (template: StrandTemplate) => void;
  className?: string;
}

/**
 * Horizontal quick template selector for inline use
 */
export function QuickTemplates({ templates, onSelect, className }: QuickTemplatesProps) {
  // Show top 5 templates
  const quickTemplates = templates.slice(0, 5);

  if (quickTemplates.length === 0) return null;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className="text-sm text-muted-foreground">Quick start:</span>
      {quickTemplates.map((template) => (
        <Button
          key={template.id}
          variant="outline"
          size="sm"
          onClick={() => onSelect(template)}
          className="h-7 text-xs"
        >
          {template.name}
        </Button>
      ))}
    </div>
  );
}

export default TemplateSelector;

