'use client';

import { useState, useCallback, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Download, Scan, Save, History, Upload } from 'lucide-react';
import { toast } from 'react-hot-toast';
import dynamic from 'next/dynamic';
import { exportToBlob } from '@excalidraw/excalidraw';
import { openstrandAPI } from '@/services/openstrand.api';
import { editorAPI } from '@/services/editor.api';
import type { EditorContentType } from '@/services/editor.api';

// Dynamically import DoodlePad to avoid SSR issues
const DoodlePad = dynamic(() => import('../journal/DoodlePad'), { ssr: false });

interface WhiteboardPanelProps {
  strandId?: string;
  initialData?: any;
  onChange?: (data: any) => void;
  onSave?: (data: any) => void;
  height?: number;
  autoSave?: boolean;
  autoSaveInterval?: number;
}

/**
 * WhiteboardPanel - Reusable Excalidraw whiteboard with OCR, export, and versioning
 * 
 * Features:
 * - Full Excalidraw whiteboard
 * - PNG/JPEG export with quality control
 * - OCR text extraction from whiteboard
 * - Auto-save to EditorService
 * - Version history integration
 * - Standalone or embedded in StrandComposer
 */
export function WhiteboardPanel({
  strandId,
  initialData,
  onChange,
  onSave,
  height = 500,
  autoSave = false,
  autoSaveInterval = 30000, // 30 seconds
}: WhiteboardPanelProps) {
  const t = useTranslations('editor.whiteboard');
  const [doodleData, setDoodleData] = useState<any>(initialData);
  const [exportQuality, setExportQuality] = useState<'medium' | 'high'>('medium');
  const [isOcrRunning, setIsOcrRunning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Load existing whiteboard state from EditorService
  useEffect(() => {
    if (!strandId) return;

    const loadState = async () => {
      try {
        const state = await editorAPI.getState(strandId, 'excalidraw');
        if (state && state.content) {
          setDoodleData(state.content);
          setLastSaved(new Date(state.modified));
        }
      } catch (error) {
        console.error('Failed to load whiteboard state:', error);
      }
    };

    loadState();
  }, [strandId]);

  // Auto-save
  useEffect(() => {
    if (!autoSave || !strandId || !hasUnsavedChanges) return;

    const interval = setInterval(() => {
      if (hasUnsavedChanges) {
        handleSave();
      }
    }, autoSaveInterval);

    return () => clearInterval(interval);
  }, [autoSave, strandId, hasUnsavedChanges, autoSaveInterval]);

  const handleDoodleChange = useCallback((data: any) => {
    setDoodleData(data);
    setHasUnsavedChanges(true);
    onChange?.(data);
  }, [onChange]);

  const handleSave = useCallback(async () => {
    if (!strandId || !doodleData) {
      toast.error(t('saveError.noStrand'));
      return;
    }

    setIsSaving(true);
    try {
      await editorAPI.saveState(strandId, doodleData, 'excalidraw', {
        isDraft: true,
      });

      setHasUnsavedChanges(false);
      setLastSaved(new Date());
      toast.success(t('saved'));
      onSave?.(doodleData);
    } catch (error) {
      console.error('Failed to save whiteboard:', error);
      toast.error(t('saveError.generic'));
    } finally {
      setIsSaving(false);
    }
  }, [strandId, doodleData, onSave, t]);

  const handleExport = useCallback(async (format: 'png' | 'jpeg') => {
    if (!doodleData || !doodleData.elements || doodleData.elements.length === 0) {
      toast.error(t('exportError.empty'));
      return;
    }

    try {
      const quality = exportQuality === 'high' ? 1.0 : 0.7;
      const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';

      const blob = await exportToBlob({
        elements: doodleData.elements,
        appState: doodleData.appState,
        files: null,
        mimeType,
        quality,
      });

      // Trigger download
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `whiteboard-${Date.now()}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(t('exported', { format: format.toUpperCase() }));
    } catch (error) {
      console.error('Export failed:', error);
      toast.error(t('exportError.generic'));
    }
  }, [doodleData, exportQuality, t]);

  const handleOcr = useCallback(async () => {
    if (!doodleData || !doodleData.elements || doodleData.elements.length === 0) {
      toast.error(t('ocrError.empty'));
      return;
    }

    setIsOcrRunning(true);
    try {
      // Export to PNG blob
      const blob = await exportToBlob({
        elements: doodleData.elements,
        appState: doodleData.appState,
        files: null,
        mimeType: 'image/png',
        quality: 1.0,
      });

      // Run OCR
      const result = await openstrandAPI.ocr.extractFromBlob(blob, {
        minConfidence: 60,
      });

      if (result.text.trim()) {
        toast.success(
          t('ocrSuccess', {
            wordCount: result.wordCount,
            confidence: Math.round(result.confidence),
          })
        );

        // Return extracted text for parent component to handle
        // (e.g., insert into TipTap editor in StrandComposer)
        if (onChange) {
          onChange({
            ...doodleData,
            ocrText: result.text,
            ocrConfidence: result.confidence,
          });
        }

        return result.text;
      } else {
        toast.warning(t('ocrWarning.noText'));
      }
    } catch (error) {
      console.error('OCR failed:', error);
      toast.error(t('ocrError.generic'));
    } finally {
      setIsOcrRunning(false);
    }
  }, [doodleData, onChange, t]);

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b">
          <div className="flex items-center gap-2">
            <Label htmlFor="export-quality" className="text-sm">
              {t('quality')}:
            </Label>
            <Select
              value={exportQuality}
              onValueChange={(v) => setExportQuality(v as 'medium' | 'high')}
            >
              <SelectTrigger id="export-quality" className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="medium">{t('qualityMedium')}</SelectItem>
                <SelectItem value="high">{t('qualityHigh')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            {strandId && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving || !hasUnsavedChanges}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? t('saving') : t('save')}
                </Button>
                {lastSaved && (
                  <span className="text-xs text-muted-foreground">
                    {t('lastSaved', { time: lastSaved.toLocaleTimeString() })}
                  </span>
                )}
              </>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport('png')}
            >
              <Download className="h-4 w-4 mr-2" />
              PNG
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport('jpeg')}
            >
              <Download className="h-4 w-4 mr-2" />
              JPEG
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleOcr}
              disabled={isOcrRunning}
            >
              <Scan className="h-4 w-4 mr-2" />
              {isOcrRunning ? t('ocrRunning') : t('ocr')}
            </Button>
          </div>
        </div>

        {/* Whiteboard Canvas */}
        <DoodlePad
          initialData={doodleData}
          onChange={handleDoodleChange}
          height={height}
        />

        {hasUnsavedChanges && strandId && (
          <p className="text-xs text-muted-foreground text-center">
            {t('unsavedChanges')}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

