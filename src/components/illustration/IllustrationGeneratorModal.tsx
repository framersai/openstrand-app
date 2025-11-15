'use client';

/**
 * @module IllustrationGeneratorModal
 * @description Modal for generating illustrations with preview → confirm → batch workflow
 * 
 * Features:
 * - Tab 1: Settings (style presets, safety, API key)
 * - Tab 2: Preview (generate 1-5 samples, refine style)
 * - Tab 3: Batch (show cost estimate, generate all)
 * - Real-time progress tracking
 * - Cost estimates displayed throughout
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Sparkles, 
  Settings, 
  Eye, 
  Zap, 
  DollarSign,
  AlertCircle,
  Check,
  X,
  Loader2,
  Info,
  HelpCircle
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { StylePresetCard, STYLE_PRESETS } from './StylePresetCard';

interface PageSummary {
  pageNumber: number;
  title?: string;
  summary: string;
}

interface IllustrationGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  strandId: string;
  pages: PageSummary[];
  onComplete?: (jobId: string) => void;
}

interface PreviewResult {
  pageNumber: number;
  imageUrl: string;
  cost: number;
}

interface CostEstimate {
  pageCount: number;
  totalCost: number;
  costPerPage: number;
}

interface BatchProgress {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: {
    completed: number;
    total: number;
  };
  totalCost: number;
}

/**
 * IllustrationGeneratorModal
 *
 * High-level UX wrapper around the illustration HTTP API. It provides:
 * - Style preset + safety + size/quality controls
 * - Optional page-range selection and variant count
 * - Cost estimation, preview, and background batch generation
 * - Optional contextual generation (RAG + visual language), toggled via UI
 *
 * The underlying backend contracts are:
 * - POST /api/v1/illustrations/estimate
 * - POST /api/v1/illustrations/preview
 * - POST /api/v1/illustrations/batch
 * - GET  /api/v1/illustrations/batch/:jobId
 * - DELETE /api/v1/illustrations/batch/:jobId
 */

export function IllustrationGeneratorModal({
  isOpen,
  onClose,
  strandId,
  pages,
  onComplete,
}: IllustrationGeneratorModalProps) {
  const [activeTab, setActiveTab] = useState<'settings' | 'preview' | 'batch'>('settings');

  // Settings
  const [stylePreset, setStylePreset] = useState('flat_pastel');
  const [customStyle, setCustomStyle] = useState('');
  const [safetyLevel, setSafetyLevel] = useState('default');
  const [imageSize, setImageSize] = useState<'1024x1024' | '1792x1024' | '1024x1792'>('1024x1024');
  const [imageQuality, setImageQuality] = useState<'standard' | 'hd'>('standard');
  const [variants, setVariants] = useState<number>(1);
  const [pageStart, setPageStart] = useState<number>(1);
  const [pageEnd, setPageEnd] = useState<number>(pages.length || 1);

  // Preview
  const [previewCount, setPreviewCount] = useState(3);
  const [previews, setPreviews] = useState<PreviewResult[]>([]);
  const [generatingPreview, setGeneratingPreview] = useState(false);
  
  // Batch
  const [costEstimate, setCostEstimate] = useState<CostEstimate | null>(null);
  const [estimating, setEstimating] = useState(false);
  const [batchJobId, setBatchJobId] = useState<string | null>(null);
  const [batchProgress, setBatchProgress] = useState<BatchProgress | null>(null);

  const { toast } = useToast();
  const [useContext, setUseContext] = useState<boolean>(false);

  // Persist basic illustration preferences locally so users get a cohesive style by default.
  useEffect(() => {
    if (!isOpen) return;

    try {
      const raw = window.localStorage.getItem('openstrand:illustration:prefs');
      if (!raw) return;
      const prefs = JSON.parse(raw) as {
        stylePreset?: string;
        safetyLevel?: string;
        imageSize?: '1024x1024' | '1792x1024' | '1024x1792';
        imageQuality?: 'standard' | 'hd';
      };
      if (prefs.stylePreset) setStylePreset(prefs.stylePreset);
      if (prefs.safetyLevel) setSafetyLevel(prefs.safetyLevel);
      if (prefs.imageSize) setImageSize(prefs.imageSize);
      if (prefs.imageQuality) setImageQuality(prefs.imageQuality);
    } catch {
      // ignore malformed prefs
    }
  }, [isOpen]);

  useEffect(() => {
    try {
      const payload = JSON.stringify({
        stylePreset,
        safetyLevel,
        imageSize,
        imageQuality,
      });
      window.localStorage.setItem('openstrand:illustration:prefs', payload);
    } catch {
      // ignore
    }
  }, [stylePreset, safetyLevel, imageSize, imageQuality]);

  const resetPreferences = () => {
    setStylePreset('flat_pastel');
    setSafetyLevel('default');
    setImageSize('1024x1024');
    setImageQuality('standard');
    setVariants(1);
    setPageStart(1);
    setPageEnd(pages.length || 1);
    try {
      window.localStorage.removeItem('openstrand:illustration:prefs');
    } catch {
      // ignore
    }
  };

  const selectedPages = useMemo(() => {
    if (!pages.length) return [];
    const clampedStart = Math.max(1, Math.min(pageStart, pages.length));
    const clampedEnd = Math.max(clampedStart, Math.min(pageEnd, pages.length));
    return pages.filter(
      (p) => p.pageNumber >= clampedStart && p.pageNumber <= clampedEnd,
    );
  }, [pages, pageStart, pageEnd]);
  
  // Load cost estimate when modal opens
  useEffect(() => {
    if (isOpen && activeTab === 'batch') {
      loadCostEstimate();
    }
  }, [isOpen, activeTab, stylePreset, imageSize, imageQuality, safetyLevel, variants, selectedPages.length]);

  // Poll batch progress
  useEffect(() => {
    if (!batchJobId) return;

    const interval = setInterval(() => {
      loadBatchProgress();
    }, 2000);

    return () => clearInterval(interval);
  }, [batchJobId]);

  const loadCostEstimate = async () => {
    if (!selectedPages.length) return;
    try {
      setEstimating(true);
      const response = await fetch('/api/v1/illustrations/estimate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          strandId,
          pages: selectedPages,
          stylePreset,
          safetyLevel,
          imageOptions: {
            size: imageSize,
            quality: imageQuality,
          },
          useContext,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setCostEstimate(data.data);
        toast({
          title: 'Illustration cost estimated',
          description: `~$${data.data.totalCost.toFixed(2)} for ${data.data.pageCount} page(s).`,
        });
      } else {
        toast({
          title: 'Failed to estimate cost',
          description: 'The server could not compute an estimate. Please try again.',
        });
      }
    } catch (error) {
      console.error('Failed to load cost estimate:', error);
      toast({
        title: 'Failed to estimate cost',
        description: 'Network error while contacting the illustration service.',
      });
    } finally {
      setEstimating(false);
    }
  };

  const generatePreviews = async () => {
    if (!selectedPages.length) return;
    try {
      setGeneratingPreview(true);
      const response = await fetch('/api/v1/illustrations/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          strandId,
          pages: selectedPages,
          previewCount,
          stylePreset,
          customStylePrompt: customStyle || undefined,
          safetyLevel,
          imageOptions: {
            size: imageSize,
            quality: imageQuality,
          },
          useContext,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setPreviews(data.data.previews.map((p: any) => ({
          pageNumber: p.pageNumber,
          imageUrl: p.image.url,
          cost: p.cost,
        })));
        setActiveTab('preview');
        toast({
          title: 'Previews generated',
          description: `Generated ${data.data.previews.length} preview image(s).`,
        });
      } else {
        toast({
          title: 'Failed to generate previews',
          description: 'The illustration service returned an error.',
        });
      }
    } catch (error) {
      console.error('Failed to generate previews:', error);
      toast({
        title: 'Failed to generate previews',
        description: 'Network error while contacting the illustration service.',
      });
    } finally {
      setGeneratingPreview(false);
    }
  };

  const startBatchJob = async () => {
    if (!selectedPages.length) return;
    try {
      const response = await fetch('/api/v1/illustrations/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          strandId,
          pages: selectedPages,
          stylePreset,
          customStylePrompt: customStyle || undefined,
          safetyLevel,
          imageOptions: {
            size: imageSize,
            quality: imageQuality,
            n: variants,
          },
          useContext,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setBatchJobId(data.data.jobId);
        toast({
          title: 'Batch started',
          description: `Generating illustrations for ${selectedPages.length} page(s)…`,
        });
      } else {
        toast({
          title: 'Failed to start batch',
          description: 'The illustration service returned an error.',
        });
      }
    } catch (error) {
      console.error('Failed to start batch job:', error);
      toast({
        title: 'Failed to start batch',
        description: 'Network error while contacting the illustration service.',
      });
    }
  };

  const loadBatchProgress = async () => {
    if (!batchJobId) return;

    try {
      const response = await fetch(`/api/v1/illustrations/batch/${batchJobId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setBatchProgress(data.data);

        if (data.data.status === 'completed') {
          onComplete?.(batchJobId);
          toast({
            title: 'Illustrations ready',
            description: `All ${data.data.progress.total} illustrations have been generated.`,
          });
        }
      } else if (response.status === 404) {
        setBatchJobId(null);
        setBatchProgress(null);
      }
    } catch (error) {
      console.error('Failed to load batch progress:', error);
    }
  };

  const cancelBatchJob = async () => {
    if (!batchJobId) return;

    try {
      const response = await fetch(`/api/v1/illustrations/batch/${batchJobId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        setBatchJobId(null);
        setBatchProgress(null);
        toast({
          title: 'Batch cancelled',
          description: 'The illustration batch job was cancelled.',
        });
      }
    } catch (error) {
      console.error('Failed to cancel batch job:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col mx-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Sparkles className="h-5 w-5 text-primary shrink-0" />
            <span>Generate Illustrations</span>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-3 shrink-0">
            <TabsTrigger value="settings" className="gap-1 sm:gap-2 text-xs sm:text-sm">
              <Settings className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
            <TabsTrigger value="preview" className="gap-1 sm:gap-2 text-xs sm:text-sm">
              <Eye className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Preview</span> ({previews.length})
            </TabsTrigger>
            <TabsTrigger value="batch" className="gap-1 sm:gap-2 text-xs sm:text-sm">
              <Zap className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Batch</span>
            </TabsTrigger>
          </TabsList>

          {/* Settings Tab */}
          <TabsContent value="settings" className="flex-1 overflow-y-auto space-y-6 p-4 sm:p-6">
            {/* Style Preset Gallery */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold text-foreground">Art Style</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs text-xs">
                      Choose a visual style that matches your content. Hover over each preset for details and best practices.
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {STYLE_PRESETS.map((preset) => (
                  <StylePresetCard
                    key={preset.value}
                    preset={preset}
                    selected={stylePreset === preset.value}
                    onSelect={() => setStylePreset(preset.value)}
                  />
                ))}
              </div>
            </div>

            {/* Custom Style */}
            {stylePreset === 'custom' && (
              <div className="space-y-2">
                <Label>Custom Style Description</Label>
                <Input
                  placeholder="e.g., minimalist line art with pastel colors"
                  value={customStyle}
                  onChange={(e) => setCustomStyle(e.target.value)}
                />
              </div>
            )}

            {/* Safety Level */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-foreground">Content Safety</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs text-xs">
                      <div className="space-y-1">
                        <div><strong>Strict:</strong> K-12 safe, no sensitive topics</div>
                        <div><strong>Censored:</strong> All ages appropriate</div>
                        <div><strong>Default:</strong> Moderate filtering</div>
                        <div><strong>Uncensored:</strong> More creative freedom</div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Select value={safetyLevel} onValueChange={setSafetyLevel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="strict">Strict (K-12 safe)</SelectItem>
                  <SelectItem value="censored">Censored (All ages)</SelectItem>
                  <SelectItem value="default">Default (Moderate)</SelectItem>
                  <SelectItem value="uncensored">Uncensored (Adult)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Image Size */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-foreground">Image Size</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs text-xs">
                      <div className="space-y-1">
                        <div><strong>Square (1024×1024):</strong> Best for diagrams, icons, general use</div>
                        <div><strong>Landscape (1792×1024):</strong> Wide scenes, timelines, panoramas</div>
                        <div><strong>Portrait (1024×1792):</strong> Tall diagrams, mobile screens, infographics</div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Select value={imageSize} onValueChange={(v: any) => setImageSize(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1024x1024">Square (1024×1024)</SelectItem>
                  <SelectItem value="1792x1024">Landscape (1792×1024)</SelectItem>
                  <SelectItem value="1024x1792">Portrait (1024×1792)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Quality */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-foreground">Quality</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs text-xs">
                      <div className="space-y-1">
                        <div><strong>Standard:</strong> Faster generation, lower cost (~$0.04/image)</div>
                        <div><strong>HD:</strong> Higher fidelity, more detail (~$0.08/image)</div>
                        <div>💡 Standard is usually sufficient for educational content</div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Select value={imageQuality} onValueChange={(v: any) => setImageQuality(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard (Faster, cheaper)</SelectItem>
                  <SelectItem value="hd">HD (Better quality)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Preview Count */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-foreground">Preview Images</Label>
                <Badge variant="outline" className="text-xs">{previewCount}</Badge>
              </div>
              <Slider
                value={[previewCount]}
                onValueChange={([v]) => setPreviewCount(v)}
                min={1}
                max={5}
                step={1}
                className="py-2"
              />
              <p className="text-xs text-muted-foreground">
                Generate {previewCount} sample{previewCount > 1 ? 's' : ''} to verify style before batch
              </p>
            </div>

            {/* Variants per page */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-foreground">Variants per Page</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className="text-xs">{variants}</Badge>
                        <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs text-xs">
                      Generate multiple variations per page. You can pick the best one later. Note: costs multiply by variant count.
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Slider
                value={[variants]}
                onValueChange={([v]) => setVariants(v)}
                min={1}
                max={4}
                step={1}
                className="py-2"
              />
              <p className="text-xs text-muted-foreground">
                Generate up to {variants} variation{variants > 1 ? 's' : ''} per page in the background batch.
              </p>
            </div>

            {/* Page Range */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-foreground">Page Range</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs text-xs">
                      Select a subset of pages to illustrate. Useful for testing styles on a chapter before generating the entire document.
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Input
                  type="number"
                  min={1}
                  max={pages.length || 1}
                  value={pageStart}
                  onChange={(e) => setPageStart(Number(e.target.value) || 1)}
                  className="w-20 sm:w-24"
                  aria-label="Start page"
                />
                <span className="text-xs text-muted-foreground">to</span>
                <Input
                  type="number"
                  min={1}
                  max={pages.length || 1}
                  value={pageEnd}
                  onChange={(e) => setPageEnd(Number(e.target.value) || 1)}
                  className="w-20 sm:w-24"
                  aria-label="End page"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setPageStart(1);
                    setPageEnd(pages.length || 1);
                  }}
                >
                  All ({pages.length})
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Currently targeting {selectedPages.length} page{selectedPages.length === 1 ? '' : 's'} for preview and batch.
              </p>
            </div>

            {/* Use Context Toggle */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-foreground">Use Knowledge Context</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs text-xs">
                      <div className="space-y-1">
                        <div>When enabled, illustrations will match your project's visual language and incorporate context from related strands.</div>
                        <div>💡 Improves cohesiveness across multi-page documents</div>
                        <div>⚠️ Slightly increases generation time</div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  checked={useContext}
                  onCheckedChange={setUseContext}
                  aria-label="Toggle knowledge context"
                />
                <span className="text-sm text-muted-foreground">
                  {useContext ? 'Using RAG context for cohesive style' : 'Standard generation (faster)'}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button onClick={generatePreviews} disabled={generatingPreview} className="flex-1">
                {generatingPreview ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    Generate Preview
                  </>
                )}
              </Button>
              <Button variant="ghost" type="button" onClick={resetPreferences}>
                Reset settings
              </Button>
            </div>
          </TabsContent>

          {/* Preview Tab */}
          <TabsContent value="preview" className="flex-1 overflow-y-auto space-y-6 p-6">
            {previews.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="p-12 text-center">
                  <Eye className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    No previews generated yet. Go to Settings and click "Generate Preview".
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">Preview Results</h4>
                    <Badge variant="outline">
                      Cost: ${previews.reduce((sum, p) => sum + p.cost, 0).toFixed(4)}
                    </Badge>
                  </div>

                  {/* Preview Grid */}
                  <div className="grid grid-cols-3 gap-4">
                    {previews.map((preview) => (
                      <Card key={preview.pageNumber} className="overflow-hidden">
                        <CardContent className="p-0">
                          <img
                            src={preview.imageUrl}
                            alt={`Page ${preview.pageNumber} preview`}
                            className="w-full h-auto"
                          />
                          <div className="p-2 text-xs text-center bg-muted">
                            Page {preview.pageNumber}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div className="text-sm text-muted-foreground">
                    Happy with the style? Proceed to generate all {pages.length} pages.
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setActiveTab('settings')}>
                      <X className="h-4 w-4 mr-2" />
                      Refine Style
                    </Button>
                    <Button onClick={() => setActiveTab('batch')}>
                      Proceed to Batch
                      <Check className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          {/* Batch Tab */}
          <TabsContent value="batch" className="flex-1 overflow-y-auto space-y-6 p-6">
            {!batchJobId ? (
              <>
                {/* Cost Estimate */}
                <Card>
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-primary" />
                      <h4 className="font-semibold">Cost Estimate</h4>
                    </div>

                    {estimating ? (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Calculating...</span>
                      </div>
                    ) : costEstimate ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <div className="text-3xl font-bold text-primary">
                              ${costEstimate.totalCost.toFixed(2)}
                            </div>
                            <div className="text-xs text-muted-foreground">Total Cost</div>
                          </div>
                          <div>
                            <div className="text-3xl font-bold">{costEstimate.pageCount}</div>
                            <div className="text-xs text-muted-foreground">Pages</div>
                          </div>
                          <div>
                            <div className="text-3xl font-bold">
                              ${costEstimate.costPerPage.toFixed(4)}
                            </div>
                            <div className="text-xs text-muted-foreground">Per Page</div>
                          </div>
                        </div>

                        <div className="p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg flex gap-2">
                          <AlertCircle className="h-4 w-4 text-yellow-600 shrink-0 mt-0.5" />
                          <div className="text-xs text-muted-foreground">
                            This estimate is based on DALL-E 3 pricing. Actual cost may vary
                            slightly. Generation may take 5-10 minutes for large documents.
                          </div>
                        </div>
                      </div>
                    ) : (
                      <Button onClick={loadCostEstimate} variant="outline">
                        Calculate Cost
                      </Button>
                    )}
                  </CardContent>
                </Card>

                {/* Start Batch */}
                {costEstimate && (
                  <div className="flex gap-3">
                    <Button onClick={onClose} variant="outline" className="flex-1">
                      Cancel
                    </Button>
                    <Button onClick={startBatchJob} className="flex-1">
                      <Zap className="h-4 w-4 mr-2" />
                      Generate All ({pages.length} pages)
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Progress Display */}
                <Card>
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">Batch Generation Progress</h4>
                      <Badge variant={
                        batchProgress?.status === 'completed' ? 'default' :
                        batchProgress?.status === 'failed' ? 'destructive' :
                        'secondary'
                      }>
                        {batchProgress?.status || 'pending'}
                      </Badge>
                    </div>

                    {batchProgress && (
                      <div className="space-y-3">
                        <Progress 
                          value={(batchProgress.progress.completed / batchProgress.progress.total) * 100}
                          className="h-3"
                        />
                        
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            {batchProgress.progress.completed} / {batchProgress.progress.total} pages
                          </span>
                          <span className="font-semibold">
                            ${batchProgress.totalCost.toFixed(2)} spent
                          </span>
                        </div>

                        {batchProgress.status === 'processing' && (
                          <Button onClick={cancelBatchJob} variant="outline" size="sm">
                            Cancel Generation
                          </Button>
                        )}

                        {batchProgress.status === 'completed' && (
                          <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg flex gap-2">
                            <Check className="h-5 w-5 text-green-600" />
                            <div>
                              <div className="font-semibold text-green-900 dark:text-green-100">
                                Generation Complete!
                              </div>
                              <div className="text-sm text-green-700 dark:text-green-300">
                                All {batchProgress.progress.total} illustrations have been generated.
                                Total cost: ${batchProgress.totalCost.toFixed(2)}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

