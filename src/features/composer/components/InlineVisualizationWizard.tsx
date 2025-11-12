'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { BarChart2, Download, ImageDown, Info, Settings2, Upload, Wand2 } from 'lucide-react';
import Papa from 'papaparse';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import ChartDisplay from '@/components/visualizations/tier1/ChartDisplay';
import type { Visualization, VisualizationType } from '@/types';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import { useTranslations } from 'next-intl';

type SupportedType = Extract<VisualizationType, 'bar' | 'line' | 'pie' | 'doughnut' | 'scatter' | 'radar' | 'table'>;

export interface InlineVisualizationWizardProps {
  strandId?: string;
  onAddVisualizationMetadata?: (viz: Visualization) => void;
}

export function InlineVisualizationWizard({ strandId, onAddVisualizationMetadata }: InlineVisualizationWizardProps) {
  const t = useTranslations('pkms');
  const chartRef = useRef<{ exportAsImage?: () => string | undefined } | null>(null);
  const [vizType, setVizType] = useState<SupportedType>('bar');
  const [title, setTitle] = useState<string>('Untitled chart');
  const [csv, setCsv] = useState<string>('label,value\nA,10\nB,20\nC,15');
  const [jsonInput, setJsonInput] = useState<string>('');
  const [useCsv, setUseCsv] = useState<boolean>(true);
  const [parsingError, setParsingError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const visualization = useMemo<Visualization | null>(() => {
    try {
      setParsingError(null);
      // Build ProcessedData from CSV or JSON
      if (useCsv) {
        const result = Papa.parse(csv.trim(), { header: true });
        const rows = (result.data as any[]).filter((r) => r && (r.label !== undefined || r.value !== undefined));
        const labels = rows.map((r) => String(r.label ?? r.Label ?? r.name ?? ''));
        const values = rows.map((r) => Number(r.value ?? r.Value ?? r.y ?? r.count ?? 0));
        const data = {
          labels,
          datasets: [
            {
              label: title || 'Series 1',
              data: values,
              backgroundColor: 'rgba(99, 102, 241, 0.5)',
              borderColor: 'rgb(99, 102, 241)',
              borderWidth: 1,
            },
          ],
        };
        return {
          id: `viz-${Math.random().toString(36).slice(2, 10)}`,
          type: vizType,
          title: title || 'Visualization',
          description: 'Inline visualization',
          config: {
            chartOptions: {
              responsive: true,
              maintainAspectRatio: false,
            },
          },
          data,
          prompt: 'manual',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          metadata: { tier: 1, origin: 'inline-wizard' },
        } as Visualization;
      }
      // JSON path
      const parsed = JSON.parse(jsonInput || '{}');
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('Invalid JSON');
      }
      return {
        id: `viz-${Math.random().toString(36).slice(2, 10)}`,
        type: vizType,
        title: title || 'Visualization',
        description: 'Inline visualization',
        config: parsed.config ?? { chartOptions: { responsive: true, maintainAspectRatio: false } },
        data: parsed.data ?? {},
        prompt: 'manual',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: { tier: 1, origin: 'inline-wizard' },
      } as Visualization;
    } catch (error) {
      setParsingError(error instanceof Error ? error.message : 'Parse error');
      return null;
    }
  }, [csv, jsonInput, title, useCsv, vizType]);

  const exportAsImage = useCallback(async () => {
    if (!visualization) {
      toast.error('Nothing to export yet');
      return;
    }
    const url = chartRef.current?.exportAsImage?.();
    if (!url) {
      toast.error('Export failed');
      return;
    }
    const a = document.createElement('a');
    a.href = url;
    a.download = `${visualization.title.replace(/\s+/g, '-')}.png`;
    a.click();
  }, [visualization]);

  const attachToStrand = useCallback(async () => {
    if (!strandId) {
      toast.error('Set a strand ID before saving the image attachment');
      return;
    }
    if (!visualization) {
      toast.error('Nothing to attach');
      return;
    }
    const url = chartRef.current?.exportAsImage?.();
    if (!url) {
      toast.error('Export failed');
      return;
    }
    setUploading(true);
    try {
      const blob = await (await fetch(url)).blob();
      const file = new File([blob], `${visualization.title.replace(/\s+/g, '-')}.png`, { type: 'image/png' });
      const form = new FormData();
      form.append('file', file);
      form.append('type', 'image');
      form.append('notes', JSON.stringify({ title: visualization.title, viz: { type: visualization.type, config: visualization.config, data: visualization.data } }));

      const response = await fetch(`/api/v1/strands/${strandId}/attachments/media`, {
        method: 'POST',
        body: form,
        credentials: 'include',
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Upload failed');
      }
      toast.success('Visualization image attached');
      onAddVisualizationMetadata?.(visualization);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to attach image');
    } finally {
      setUploading(false);
    }
  }, [onAddVisualizationMetadata, strandId, visualization]);

  return (
    <TooltipProvider>
      <Card className="border-primary/20 bg-background/90">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle className="text-sm font-semibold">{t('viz.title')}</CardTitle>
            <p className="text-xs text-muted-foreground">{t('viz.subtitle')}</p>
          </div>
          <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
            <BarChart2 className="mr-1 inline h-3 w-3 text-primary" />
            Chart.js
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
            <div className="space-y-3">
              <div className="flex flex-col gap-2">
                <Label className="text-xs uppercase text-muted-foreground">{t('viz.fields.title')}</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('viz.fields.titlePH')} />
              </div>
              <div className="flex flex-col gap-2">
                <Label className="text-xs uppercase text-muted-foreground">{t('viz.fields.type')}</Label>
                <Select value={vizType} onValueChange={(v) => setVizType(v as SupportedType)}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('viz.fields.typePH')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bar">Bar</SelectItem>
                    <SelectItem value="line">Line</SelectItem>
                    <SelectItem value="pie">Pie</SelectItem>
                    <SelectItem value="doughnut">Doughnut</SelectItem>
                    <SelectItem value="scatter">Scatter</SelectItem>
                    <SelectItem value="radar">Radar</SelectItem>
                    <SelectItem value="table" disabled>Table</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="rounded-md border border-border/60">
                <div className="flex items-center justify-between border-b border-border/60 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Settings2 className="h-4 w-4 text-primary" />
                    <span className="text-xs font-medium text-foreground">{t('viz.data.title')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant={useCsv ? 'default' : 'ghost'} size="sm" onClick={() => setUseCsv(true)}>
                      CSV
                    </Button>
                    <Button variant={!useCsv ? 'default' : 'ghost'} size="sm" onClick={() => setUseCsv(false)}>
                      JSON
                    </Button>
                  </div>
                </div>
                <div className="p-3">
                  {useCsv ? (
                    <Textarea
                      value={csv}
                      onChange={(e) => setCsv(e.target.value)}
                      className="min-h-[140px] font-mono text-xs"
                      placeholder="label,value&#10;A,10&#10;B,20"
                    />
                  ) : (
                    <Textarea
                      value={jsonInput}
                      onChange={(e) => setJsonInput(e.target.value)}
                      className="min-h-[140px] font-mono text-xs"
                      placeholder='{"config": {...}, "data": {...}}'
                    />
                  )}
                  {parsingError ? (
                    <div className="mt-2 rounded-md border border-red-600/40 bg-red-600/10 p-2 text-xs text-red-600">
                      {parsingError}
                    </div>
                  ) : null}
                  <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
                          <Info className="h-3 w-3" />
                          {t('viz.data.hint')}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs text-xs">
                        {t('viz.data.help')}
                      </TooltipContent>
                    </Tooltip>
                    <div className="flex items-center gap-2 sm:justify-end">
                      <Button variant="outline" size="sm" className="gap-2 w-full sm:w-auto" onClick={exportAsImage}>
                        <ImageDown className="h-4 w-4" />
                        {t('viz.actions.export')}
                      </Button>
                      <Button size="sm" disabled={uploading} className="gap-2 w-full sm:w-auto" onClick={attachToStrand}>
                        <Upload className="h-4 w-4" />
                        {uploading ? t('viz.actions.uploading') : t('viz.actions.attach')}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
              <div className={cn('relative h-[260px] sm:h-[320px] lg:h-[360px] w-full overflow-hidden rounded-md bg-background')}>
                {visualization ? (
                  <ChartDisplay ref={chartRef as any} visualization={visualization} />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    {t('viz.preview.empty')}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}


