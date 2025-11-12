'use client';

import { useCallback, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Upload, Link as LinkIcon, Image as ImageIcon, Mic, Type } from 'lucide-react';
import { openstrandAPI } from '@/services/openstrand.api';
import { useTranslations } from 'next-intl';
import { toast } from 'react-hot-toast';
import { useComposerPreferences } from '@/features/composer/hooks/useComposerPreferences';
import { useAutoMetadata } from '@/features/composer/hooks/useAutoMetadata';

/**
 * QuickCapturePanel
 *
 * Minimal, fast paths to create a new strand from:
 * - Paste text
 * - Paste link (stored as metadata for backend scraping)
 * - Image upload
 * - Audio upload
 *
 * Audio recording is available inside the full Composer. This panel focuses on single-shot capture.
 */
export function QuickCapturePanel() {
  const t = useTranslations('pkms');
  const [prefs] = useComposerPreferences();
  const { run: runAutoMetadata } = useAutoMetadata();

  const [pasteText, setPasteText] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const createFromPaste = useCallback(async () => {
    const text = pasteText.trim();
    if (!text) return;
    setBusy(true);
    try {
      const content = {
        type: 'doc',
        content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
      };
      const strand = await openstrandAPI.strands.create({
        title: text.slice(0, 64),
        summary: text.slice(0, 160),
        content: { data: content, metadata: { origin: 'quick-capture', source: 'paste' } },
        contentType: 'application/vnd.tiptap+json',
        noteType: 'main' as any,
        visibility: 'private',
        metadata: { tags: [], language: 'en' } as any,
      });
      toast.success(t('quickCapture.done'));
      if (prefs.autoTag) {
        void runAutoMetadata({
          strandId: strand.id,
          plainText: text,
          existingTags: [],
          options: { autoTag: true, autoBacklinks: prefs.autoBacklinks, maxBacklinks: prefs.maxBacklinks },
        });
      }
      setPasteText('');
    } catch (e) {
      toast.error(t('quickCapture.error'));
    } finally {
      setBusy(false);
    }
  }, [pasteText, prefs, runAutoMetadata, t]);

  const createFromLink = useCallback(async () => {
    const url = linkUrl.trim();
    if (!url) return;
    setBusy(true);
    try {
      const result = await openstrandAPI.scraper.scrapeUrl({
        url,
        method: 'auto',
        options: { createStrand: true, extractMetadata: true, findRelated: false, autoSync: false },
      });
      // If scraper created a strandId, optionally run auto-metadata
      const strandId = (result as any)?.strandId;
      toast.success(t('quickCapture.done'));
      if (prefs.autoTag && strandId) {
        void runAutoMetadata({
          strandId,
          plainText: url,
          existingTags: ['link'],
          options: { autoTag: true, autoBacklinks: prefs.autoBacklinks, maxBacklinks: prefs.maxBacklinks },
        });
      }
      setLinkUrl('');
    } catch {
      toast.error(t('quickCapture.error'));
    } finally {
      setBusy(false);
    }
  }, [linkUrl, prefs, runAutoMetadata, t]);

  const createFromFile = useCallback(async (file: File, kind: 'image' | 'audio') => {
    setBusy(true);
    try {
      const strand = await openstrandAPI.strands.upload(file, { origin: 'quick-capture', source: kind });
      toast.success(t('quickCapture.done'));
      if (prefs.autoTag) {
        void runAutoMetadata({
          strandId: strand.id,
          plainText: strand.title ?? '',
          existingTags: [],
          options: { autoTag: true, autoBacklinks: prefs.autoBacklinks, maxBacklinks: prefs.maxBacklinks },
        });
      }
      if (kind === 'image') setImageFile(null);
      if (kind === 'audio') setAudioFile(null);
    } catch {
      toast.error(t('quickCapture.error'));
    } finally {
      setBusy(false);
    }
  }, [prefs, runAutoMetadata, t]);

  return (
    <Card>
      <CardContent className="p-4">
        <Tabs defaultValue="paste">
          <TabsList className="flex w-full max-w-full overflow-x-auto whitespace-nowrap rounded-lg">
            <TabsTrigger className="text-xs sm:text-sm" value="paste"><Type className="mr-2 h-3.5 w-3.5" />{t('quickCapture.paste')}</TabsTrigger>
            <TabsTrigger className="text-xs sm:text-sm" value="link"><LinkIcon className="mr-2 h-3.5 w-3.5" />{t('quickCapture.link')}</TabsTrigger>
            <TabsTrigger className="text-xs sm:text-sm" value="image"><ImageIcon className="mr-2 h-3.5 w-3.5" />{t('quickCapture.image')}</TabsTrigger>
            <TabsTrigger className="text-xs sm:text-sm" value="audio"><Mic className="mr-2 h-3.5 w-3.5" />{t('quickCapture.audio')}</TabsTrigger>
          </TabsList>
          <TabsContent value="paste" className="mt-3">
            <div className="grid gap-2">
              <Textarea value={pasteText} onChange={(e) => setPasteText(e.target.value)} rows={4} placeholder={t('quickCapture.pastePH')} />
              <Button disabled={busy || !pasteText.trim()} onClick={createFromPaste} className="gap-2 w-full sm:w-auto">
                <Upload className="h-4 w-4" /> {t('quickCapture.create')}
              </Button>
            </div>
          </TabsContent>
          <TabsContent value="link" className="mt-3">
            <div className="grid gap-2">
              <Input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://example.com/article" />
              <Button disabled={busy || !linkUrl.trim()} onClick={createFromLink} className="gap-2 w-full sm:w-auto">
                <Upload className="h-4 w-4" /> {t('quickCapture.create')}
              </Button>
            </div>
          </TabsContent>
          <TabsContent value="image" className="mt-3">
            <div className="grid gap-2">
              <Input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] ?? null)} />
              <Button disabled={busy || !imageFile} onClick={() => imageFile && void createFromFile(imageFile, 'image')} className="gap-2 w-full sm:w-auto">
                <Upload className="h-4 w-4" /> {t('quickCapture.create')}
              </Button>
            </div>
          </TabsContent>
          <TabsContent value="audio" className="mt-3">
            <div className="grid gap-2">
              <Input type="file" accept="audio/*" onChange={(e) => setAudioFile(e.target.files?.[0] ?? null)} />
              <Button disabled={busy || !audioFile} onClick={() => audioFile && void createFromFile(audioFile, 'audio')} className="gap-2 w-full sm:w-auto">
                <Upload className="h-4 w-4" /> {t('quickCapture.create')}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}


