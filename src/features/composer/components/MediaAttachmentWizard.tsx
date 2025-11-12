'use client';

import { useCallback, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Camera, ChevronLeft, ChevronRight, Film, Info, UploadCloud } from 'lucide-react';
import { toast } from 'react-hot-toast';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';

interface MediaAttachmentWizardProps {
  strandId?: string;
  planTier: 'free' | 'basic' | 'cloud' | 'pro' | 'team' | 'org' | 'enterprise';
}

type WizardStep = 0 | 1 | 2;

export function MediaAttachmentWizard({ strandId, planTier }: MediaAttachmentWizardProps) {
  const [step, setStep] = useState<WizardStep>(0);
  const [file, setFile] = useState<File | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [generateSummary, setGenerateSummary] = useState(true);
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);

  const planMessage = useMemo(() => {
    switch (planTier) {
      case 'pro':
        return 'Teams/Pro: High-resolution images & 4K video supported.';
      case 'cloud':
      case 'team':
      case 'enterprise':
        return 'Cloud plan: HD video (10 minutes) and large images up to 25 MB.';
      case 'free':
      default:
        return 'Free plan: 1080p video up to 5 minutes; images up to 10 MB.';
    }
  }, [planTier]);

  const reset = useCallback(() => {
    setStep(0);
    setFile(null);
    setNotes('');
    setGenerateSummary(true);
  }, []);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    if (!selected) {
      setFile(null);
      return;
    }

    const isImage = selected.type.startsWith('image/');
    const isVideo = selected.type.startsWith('video/');

    if (!isImage && !isVideo) {
      toast.error('Only image or video files are supported.');
      setFile(null);
      return;
    }

    setMediaType(isVideo ? 'video' : 'image');
    setFile(selected);
  }, []);

  const upload = useCallback(async () => {
    if (!strandId) {
      toast.error('Set a strand ID before uploading media.');
      return;
    }

    if (!file) {
      toast.error('Select a file to upload.');
      return;
    }

    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('type', mediaType);
      form.append('generateSummary', String(generateSummary));
      if (notes) {
        form.append('notes', notes);
      }

      const response = await fetch(`/api/v1/strands/${strandId}/attachments/media`, {
        method: 'POST',
        body: form,
        credentials: 'include',
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || 'Upload failed');
      }

      toast.success('Media attachment uploaded');
      reset();
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload media');
    } finally {
      setUploading(false);
    }
  }, [file, generateSummary, mediaType, notes, reset, strandId]);

  return (
    <TooltipProvider>
      <Card className="border-primary/20 bg-background/90">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle className="text-sm font-semibold">Media Attachment Wizard</CardTitle>
            <p className="text-xs text-muted-foreground">Attach sketches, screenshots, or video walk-throughs with contextual summaries.</p>
          </div>
          <Badge variant="outline" className="text-[10px] uppercase tracking-wide">{planMessage}</Badge>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-6">
            <AnimatePresence mode="wait">
              {step === 0 && (
                <motion.div
                  key="step-0"
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 16 }}
                  transition={{ duration: 0.2 }}
                  className="grid gap-4 md:grid-cols-[200px_1fr]"
                >
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="file-input" className="text-xs uppercase text-muted-foreground">1. Choose file</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                          <Camera className="h-4 w-4" />
                          {file ? file.name : 'Select image or video'}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs text-xs">
                        Drag-and-drop coming soon. For now choose a file up to plan limits. Metadata (EXIF, duration) is captured automatically.
                      </TooltipContent>
                    </Tooltip>
                    <Input id="file-input" type="file" accept="image/*,video/*" onChange={handleFileChange} />
                  </div>
                  <div className="rounded-lg border border-dashed border-muted-foreground/30 p-4 text-xs text-muted-foreground">
                    <p className="mb-2 font-medium text-foreground">Tip: pair visuals with transcripts</p>
                    <p>After uploading a video, trigger transcription to convert speech into searchable notes. Images can be summarized via AI to surface objects, settings, and actors.</p>
                    <div className="mt-4 flex items-center justify-between rounded-md border border-border/50 bg-background/70 p-3 text-xs text-foreground">
                      <div className="flex items-center gap-2">
                        {mediaType === 'video' ? (
                          <Film className="h-4 w-4 text-primary" />
                        ) : (
                          <Camera className="h-4 w-4 text-primary" />
                        )}
                        <span className="font-medium">{mediaType === 'video' ? 'Video analysis enabled' : 'Image annotations enabled'}</span>
                      </div>
                      <span className="text-muted-foreground">
                        {mediaType === 'video' ? 'Transcript & chaptering ready' : 'Object tagging & ALT text ready'}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 1 && (
                <motion.div
                  key="step-1"
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 16 }}
                  transition={{ duration: 0.2 }}
                  className="grid gap-4 md:grid-cols-2"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs uppercase text-muted-foreground">2. Configure options</Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent className="text-xs">Summaries add instant context for teammates skimming the strand. Disable to save credits.</TooltipContent>
                      </Tooltip>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch id="generate-summary" checked={generateSummary} onCheckedChange={setGenerateSummary} />
                      <Label htmlFor="generate-summary" className="text-xs">Generate AI summary</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch id="media-type" checked={mediaType === 'video'} onCheckedChange={(checked) => setMediaType(checked ? 'video' : 'image')} />
                      <Label htmlFor="media-type" className="text-xs">Treat as video (enable timeline metadata)</Label>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-xs uppercase text-muted-foreground">Optional notes</Label>
                    <Textarea
                      value={notes}
                      onChange={(event) => setNotes(event.target.value)}
                      className="min-h-[120px]"
                      placeholder="Describe context, participants, or follow-ups. These notes stay private to editors."
                    />
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step-2"
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 16 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-3 rounded-lg border border-border/60 bg-muted/30 p-4 text-xs"
                >
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <UploadCloud className="h-4 w-4" /> Ready to upload
                  </div>
                  <ul className="list-inside list-disc space-y-1">
                    <li>Attach to strand: <span className="font-medium text-foreground">{strandId || '—'}</span></li>
                    <li>File: <span className="font-medium text-foreground">{file?.name ?? 'Not selected'}</span></li>
                    <li>Type: <span className="font-medium text-foreground">{mediaType}</span></li>
                    <li>AI summary: <span className="font-medium text-foreground">{generateSummary ? 'Yes' : 'No'}</span></li>
                  </ul>
                  <p className="text-muted-foreground">Uploads inherit enterprise retention policies. Remove attachments anytime from the strand detail view.</p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                className="gap-1"
                disabled={step === 0}
                onClick={() => setStep((prev) => (Math.max(prev - 1, 0) as WizardStep))}
              >
                <ChevronLeft className="h-4 w-4" /> Back
              </Button>
              <div className="flex items-center gap-2">
                {step < 2 ? (
                  <Button
                    size="sm"
                    className="gap-1"
                    onClick={() => {
                      if (step === 0 && !file) {
                        toast.error('Select a file to continue.');
                        return;
                      }
                      setStep((prev) => (Math.min(prev + 1, 2) as WizardStep));
                    }}
                  >
                    Next <ChevronRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button size="sm" className="gap-1" onClick={upload} disabled={uploading}>
                    {uploading ? 'Uploading…' : 'Finish upload'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
