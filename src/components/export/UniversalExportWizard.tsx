'use client';

/**
 * @module UniversalExportWizard
 * @description Reusable export wizard for all content types
 * 
 * Features:
 * - Unified UI for exporting strands, flashcards, quizzes, journals, looms
 * - Multiple formats: PDF, DOCX, Markdown, HTML, CSV, JSON, PNG, Anki
 * - Format-specific options (styling, compression, metadata)
 * - Cost estimation for exports requiring AI/rendering
 * - Progress tracking for batch exports
 * - Download or save to storage
 */

import React, { useState } from 'react';
import {
  FileText,
  Download,
  Settings,
  CheckCircle2,
  Loader2,
  FileJson,
  FileImage,
  Archive,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { CostBadge } from '@/components/ui/cost-badge';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export type ExportContentType = 'strand' | 'flashcard_deck' | 'quiz' | 'journal' | 'loom' | 'weave';
export type ExportFormat = 'pdf' | 'docx' | 'markdown' | 'html' | 'text' | 'json' | 'csv' | 'png' | 'anki' | 'zip';

interface UniversalExportWizardProps {
  /** Content to export */
  contentId: string | string[];
  contentType: ExportContentType;
  
  /** Content title for display */
  title: string;
  
  /** Trigger button (optional) */
  trigger?: React.ReactNode;
  
  /** Called when export completes */
  onExportComplete?: (format: ExportFormat, blob: Blob) => void;
  
  /** Custom class name */
  className?: string;
}

interface FormatOption {
  format: ExportFormat;
  name: string;
  description: string;
  icon: React.ReactNode;
  supportsImages: boolean;
  supportsStyling: boolean;
  estimatedCost?: number;
}

const FORMAT_OPTIONS: FormatOption[] = [
  {
    format: 'pdf',
    name: 'PDF',
    description: 'Portable document with styling',
    icon: <FileText className="h-5 w-5" />,
    supportsImages: true,
    supportsStyling: true,
  },
  {
    format: 'docx',
    name: 'Word (DOCX)',
    description: 'Microsoft Word document',
    icon: <FileText className="h-5 w-5" />,
    supportsImages: true,
    supportsStyling: true,
  },
  {
    format: 'markdown',
    name: 'Markdown',
    description: 'Plain text with formatting',
    icon: <FileText className="h-5 w-5" />,
    supportsImages: true,
    supportsStyling: false,
  },
  {
    format: 'html',
    name: 'HTML',
    description: 'Web page with styling',
    icon: <FileText className="h-5 w-5" />,
    supportsImages: true,
    supportsStyling: true,
  },
  {
    format: 'json',
    name: 'JSON',
    description: 'Structured data format',
    icon: <FileJson className="h-5 w-5" />,
    supportsImages: false,
    supportsStyling: false,
  },
  {
    format: 'png',
    name: 'PNG Images',
    description: 'One image per card/page',
    icon: <FileImage className="h-5 w-5" />,
    supportsImages: true,
    supportsStyling: true,
    estimatedCost: 0, // Headless browser rendering
  },
  {
    format: 'anki',
    name: 'Anki Deck',
    description: 'Import into Anki app',
    icon: <Archive className="h-5 w-5" />,
    supportsImages: true,
    supportsStyling: false,
  },
];

export function UniversalExportWizard({
  contentId,
  contentType,
  title,
  trigger,
  onExportComplete,
  className,
}: UniversalExportWizardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('pdf');
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [includeImages, setIncludeImages] = useState(true);
  const [includeRelationships, setIncludeRelationships] = useState(false);
  const [markdownFlavor, setMarkdownFlavor] = useState<'github' | 'commonmark' | 'obsidian'>('github');
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const selectedFormatOption = FORMAT_OPTIONS.find((f) => f.format === selectedFormat);

  const handleExport = async () => {
    try {
      setExporting(true);
      setProgress(0);

      const isMultiple = Array.isArray(contentId);
      const endpoint = isMultiple
        ? `/api/v1/export/${contentType}/batch`
        : `/api/v1/export/${contentType}/${contentId}`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          format: selectedFormat,
          contentIds: isMultiple ? contentId : undefined,
          options: {
            includeMetadata,
            includeAttachments: includeImages,
            includeRelationships,
            markdownFlavor,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }

      // Download file
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title.replace(/[^a-z0-9]/gi, '_')}.${selectedFormat}`;
      a.click();
      URL.revokeObjectURL(url);

      onExportComplete?.(selectedFormat, blob);

      toast({
        title: 'Export Complete',
        description: `${title} exported as ${selectedFormat.toUpperCase()}`,
      });

      setIsOpen(false);
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: 'Export Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setExporting(false);
      setProgress(0);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className={className}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Export {title}</DialogTitle>
          <DialogDescription>
            Choose format and options for exporting
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="format" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="format">Format</TabsTrigger>
            <TabsTrigger value="options">Options</TabsTrigger>
          </TabsList>

          {/* Format Selection */}
          <TabsContent value="format" className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {FORMAT_OPTIONS.map((option) => (
                <Card
                  key={option.format}
                  className={cn(
                    'cursor-pointer transition-all hover:shadow-md',
                    selectedFormat === option.format && 'ring-2 ring-primary'
                  )}
                  onClick={() => setSelectedFormat(option.format)}
                >
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      {option.icon}
                      <span className="font-semibold">{option.name}</span>
                      {selectedFormat === option.format && (
                        <CheckCircle2 className="h-4 w-4 text-primary ml-auto" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {option.description}
                    </p>
                    {option.estimatedCost !== undefined && (
                      <CostBadge amount={option.estimatedCost} size="sm" />
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Options */}
          <TabsContent value="options" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Export Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Include Metadata */}
                <div className="flex items-center justify-between">
                  <Label htmlFor="metadata">Include Metadata</Label>
                  <Checkbox
                    id="metadata"
                    checked={includeMetadata}
                    onCheckedChange={(checked) => setIncludeMetadata(checked as boolean)}
                  />
                </div>

                {/* Include Images */}
                {selectedFormatOption?.supportsImages && (
                  <div className="flex items-center justify-between">
                    <Label htmlFor="images">Include Images</Label>
                    <Checkbox
                      id="images"
                      checked={includeImages}
                      onCheckedChange={(checked) => setIncludeImages(checked as boolean)}
                    />
                  </div>
                )}

                {/* Include Relationships */}
                {(contentType === 'strand' || contentType === 'loom' || contentType === 'weave') && (
                  <div className="flex items-center justify-between">
                    <Label htmlFor="relationships">Include Relationships</Label>
                    <Checkbox
                      id="relationships"
                      checked={includeRelationships}
                      onCheckedChange={(checked) => setIncludeRelationships(checked as boolean)}
                    />
                  </div>
                )}

                {/* Markdown Flavor */}
                {selectedFormat === 'markdown' && (
                  <div className="space-y-2">
                    <Label>Markdown Flavor</Label>
                    <Select value={markdownFlavor} onValueChange={(v: any) => setMarkdownFlavor(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="github">GitHub Flavored</SelectItem>
                        <SelectItem value="commonmark">CommonMark</SelectItem>
                        <SelectItem value="obsidian">Obsidian</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Format-Specific Info */}
                {selectedFormat === 'anki' && contentType !== 'flashcard_deck' && (
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg text-sm">
                    <p className="text-muted-foreground">
                      Note: Anki format is optimized for flashcards. Other content types will be converted to Q&A format.
                    </p>
                  </div>
                )}

                {selectedFormat === 'png' && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg text-sm">
                    <p className="text-muted-foreground">
                      PNG export renders each card/page as a high-quality image using headless browser. This may take a few moments.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Export Button */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            Format: <Badge variant="secondary">{selectedFormatOption?.name}</Badge>
          </div>

          <Button onClick={handleExport} disabled={exporting}>
            {exporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Exporting... {progress > 0 && `${progress}%`}
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export as {selectedFormatOption?.name}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

