'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Save, Type, Palette, Mic } from 'lucide-react';
import { exportToBlob } from '@excalidraw/excalidraw';
import dynamic from 'next/dynamic';

// Dynamically import Excalidraw to avoid SSR issues
const DoodlePad = dynamic(() => import('./DoodlePad'), { ssr: false });

interface JournalEntryProps {
  date: Date;
}

export function JournalEntry({ date }: JournalEntryProps) {
  const t = useTranslations('daily.journal');
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<'text' | 'doodle'>('text');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [doodleData, setDoodleData] = useState<any>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [isOcrRunning, setIsOcrRunning] = useState(false);
  const [exportQuality, setExportQuality] = useState<number>(1);

  const dateString = date.toISOString().split('T')[0];

  // Fetch existing daily note
  const { data: dailyNote, isLoading } = useQuery({
    queryKey: ['dailyNote', dateString],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/v1/journal/daily-notes/${dateString}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        if (!response.ok) {
          if (response.status === 404) return null;
          throw new Error('Failed to fetch daily note');
        }
        return response.json();
      } catch (error) {
        return null;
      }
    },
  });

  // Load existing content
  useEffect(() => {
    if (dailyNote) {
      setTitle(dailyNote.title || '');
      setContent(dailyNote.summary || '');
      // Load doodle data if exists
      if (dailyNote.metadata?.doodle) {
        setDoodleData(dailyNote.metadata.doodle);
      }
    } else {
      setTitle('');
      setContent('');
      setDoodleData(null);
    }
    setHasChanges(false);
  }, [dailyNote]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not authenticated');

      const payload = {
        title: title || undefined,
        summary: content || undefined,
        metadata: {
          ...(dailyNote?.metadata || {}),
          doodle: mode === 'doodle' ? doodleData : dailyNote?.metadata?.doodle,
        },
      };

      if (dailyNote) {
        // Update existing note
        const response = await fetch(`/api/v1/journal/daily-notes/${dateString}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error('Failed to update journal entry');
        return response.json();
      } else {
        // Create new note
        const response = await fetch('/api/v1/journal/daily-notes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            noteDate: date.toISOString(),
            ...payload,
          }),
        });
        if (!response.ok) throw new Error('Failed to create journal entry');
        return response.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dailyNote', dateString] });
      toast.success(t('saved'));
      setHasChanges(false);
    },
    onError: (error: Error) => {
      toast.error(t('saveError', { error: error.message }));
    },
  });

  const handleSave = () => {
    saveMutation.mutate();
  };

  const handleContentChange = (value: string) => {
    setContent(value);
    setHasChanges(true);
  };

  const handleTitleChange = (value: string) => {
    setTitle(value);
    setHasChanges(true);
  };

  const handleDoodleChange = (data: any) => {
    setDoodleData(data);
    setHasChanges(true);
  };

  const handleExportImage = async (format: 'png' | 'jpeg') => {
    if (!doodleData?.elements || doodleData.elements.length === 0) {
      toast.error(t('noDoodle'));
      return;
    }
    try {
      const blob = await exportToBlob({
        elements: doodleData.elements,
        appState: {
          exportBackground: true,
          ...(doodleData.appState || {}),
        },
        mimeType: format === 'png' ? 'image/png' : 'image/jpeg',
        quality: exportQuality,
      });
      if (!blob) {
        throw new Error('Failed to export image');
      }
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `journal-${date.toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success(t('exportedImage'));
    } catch (error) {
      toast.error(t('exportError'));
    }
  };

  const handleRunOcr = async () => {
    if (!doodleData?.elements || doodleData.elements.length === 0) {
      toast.error(t('noDoodle'));
      return;
    }
    try {
      setIsOcrRunning(true);
      const blob = await exportToBlob({
        elements: doodleData.elements,
        appState: {
          exportBackground: true,
          ...(doodleData.appState || {}),
        },
        mimeType: 'image/png',
        quality: exportQuality,
      });
      if (!blob) {
        throw new Error('Failed to export image for OCR');
      }
      const result = await openstrandAPI.ocr.extractFromBlob(blob, {
        minConfidence: 60,
      });
      if (result?.text) {
        setContent((prev) => `${prev}\n\n${result.text}`);
        setHasChanges(true);
        toast.success(t('ocrSuccess', { confidence: Math.round(result.confidence) }));
      } else {
        toast.error(t('ocrNoText'));
      }
    } catch (error) {
      toast.error(t('ocrError'));
    } finally {
      setIsOcrRunning(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{t('title')}</CardTitle>
        <Button
          onClick={handleSave}
          disabled={!hasChanges || saveMutation.isPending}
          size="sm"
        >
          <Save className="h-4 w-4 mr-2" />
          {saveMutation.isPending ? t('saving') : t('save')}
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Title Input */}
          <Input
            placeholder={t('titlePlaceholder')}
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="text-lg font-semibold"
          />

          {/* Mode Tabs */}
          <Tabs value={mode} onValueChange={(v) => setMode(v as 'text' | 'doodle')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="text" className="flex items-center gap-2">
                <Type className="h-4 w-4" />
                {t('textMode')}
              </TabsTrigger>
              <TabsTrigger value="doodle" className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                {t('doodleMode')}
              </TabsTrigger>
            </TabsList>

            {/* Text Mode */}
            <TabsContent value="text" className="mt-4">
              <Textarea
                placeholder={t('contentPlaceholder')}
                value={content}
                onChange={(e) => handleContentChange(e.target.value)}
                className="min-h-[300px] resize-y"
              />
              <p className="text-xs text-muted-foreground mt-2">
                {t('wikilinksHint')}
              </p>
            </TabsContent>

            {/* Doodle Mode */}
            <TabsContent value="doodle" className="mt-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{t('exportQuality')}</span>
                  <select
                    className="h-7 rounded border bg-background px-2 text-xs"
                    value={exportQuality}
                    onChange={(e) => setExportQuality(Number(e.target.value) || 1)}
                  >
                    <option value={0.7}>{t('qualityMedium')}</option>
                    <option value={1}>{t('qualityHigh')}</option>
                  </select>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExportImage('png')}
                  >
                    {t('exportPng')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExportImage('jpeg')}
                  >
                    {t('exportJpeg')}
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleRunOcr}
                    disabled={isOcrRunning}
                  >
                    {isOcrRunning ? t('ocrRunning') : t('runOcr')}
                  </Button>
                </div>
              </div>
              <DoodlePad
                initialData={doodleData}
                onChange={handleDoodleChange}
                height={400}
              />
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  );
}

