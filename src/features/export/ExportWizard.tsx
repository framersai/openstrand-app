'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { tiptapJsonToMarkdown } from './markdown';

export type ExportFormat = 'json' | 'markdown' | 'html' | 'pdf' | 'png' | 'jpeg' | 'svg';

export interface ExportWizardProps {
  open: boolean;
  onClose: () => void;
  // Content accessors (for strands)
  getDocJson?: () => any;
  getHtml?: () => string;
  // If exporting a chart/visualization, pass a canvas element or svg element
  canvasRef?: HTMLCanvasElement | null;
  svgElement?: SVGElement | null;
  defaultFilename?: string;
  strandId?: string;
  imageDataUrl?: string | null;
  onInsertIntoEditor?: (url: string, kind: 'image' | 'video' | 'audio') => void;
}

function downloadBlob(data: BlobPart, filename: string, type: string) {
  const blob = new Blob([data], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function ExportWizard({ open, onClose, getDocJson, getHtml, canvasRef, svgElement, defaultFilename = 'export', strandId, imageDataUrl, onInsertIntoEditor }: ExportWizardProps) {
  const [format, setFormat] = useState<ExportFormat>('markdown');
  const [filename, setFilename] = useState(defaultFilename);
  const [jpegQuality, setJpegQuality] = useState(0.92);
  const [scale, setScale] = useState(2);
  const [rotate, setRotate] = useState(0);
  const [cropX, setCropX] = useState<number>(0);
  const [cropY, setCropY] = useState<number>(0);
  const [cropW, setCropW] = useState<number>(0);
  const [cropH, setCropH] = useState<number>(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [destination, setDestination] = useState<'download' | 'offline' | 'attach'>('download');
  const [saving, setSaving] = useState(false);
  const [sourceImage, setSourceImage] = useState<HTMLImageElement | null>(null);
  const previewContainerRef = useRef<HTMLDivElement | null>(null);
  const previewImgRef = useRef<HTMLImageElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const [isCropAdjustMode, setIsCropAdjustMode] = useState(false);
  const [displayRect, setDisplayRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [selectionPx, setSelectionPx] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const dragRef = useRef<{ mode: 'new' | 'move' | 'resize' | null; handle?: string; startX: number; startY: number; startRect?: { x: number; y: number; w: number; h: number } } | null>(null);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [aspectRatio, setAspectRatio] = useState<'free' | '1:1' | '4:3' | '16:9' | '3:2'>('free');

  const canImage = Boolean(canvasRef) || Boolean(imageDataUrl);
  const canSvg = Boolean(svgElement);
  const canHtml = Boolean(getHtml);
  const canJson = Boolean(getDocJson);

  // Load image when imageDataUrl is provided
  useEffect(() => {
    if (!imageDataUrl) {
      setSourceImage(null);
      return;
    }
    const img = new Image();
    img.onload = () => setSourceImage(img);
    img.src = imageDataUrl;
  }, [imageDataUrl]);

  // Compute displayed rect of the <img> within container
  const recomputeDisplayRect = () => {
    const container = previewContainerRef.current;
    const img = previewImgRef.current;
    if (!container || !img) {
      setDisplayRect(null);
      return;
    }
    const c = container.getBoundingClientRect();
    const i = img.getBoundingClientRect();
    setDisplayRect({ x: i.left - c.left, y: i.top - c.top, w: i.width, h: i.height });
  };

  useEffect(() => {
    const onResize = () => recomputeDisplayRect();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Reflect numeric crop into overlay selection when metrics known
  useEffect(() => {
    if (!displayRect) return;
    const naturalW = canvasRef?.width ?? sourceImage?.naturalWidth ?? 0;
    const naturalH = canvasRef?.height ?? sourceImage?.naturalHeight ?? 0;
    if (!naturalW || !naturalH) return;
    const sx = displayRect.x + (cropX / naturalW) * displayRect.w;
    const sy = displayRect.y + (cropY / naturalH) * displayRect.h;
    const sw = (Math.max(0, cropW) / naturalW) * displayRect.w;
    const sh = (Math.max(0, cropH) / naturalH) * displayRect.h;
    setSelectionPx({ x: sx, y: sy, w: sw, h: sh });
  }, [cropX, cropY, cropW, cropH, displayRect, canvasRef, sourceImage]);

  const availableFormats = useMemo(() => {
    const items: Array<{ value: ExportFormat; label: string; disabled?: boolean }> = [
      { value: 'json', label: 'JSON', disabled: !canJson },
      { value: 'markdown', label: 'Markdown (.md)', disabled: !canJson },
      { value: 'html', label: 'HTML (.html)', disabled: !canHtml },
      { value: 'pdf', label: 'PDF (Print)', disabled: !canHtml },
      { value: 'png', label: 'PNG (raster)', disabled: !canImage },
      { value: 'jpeg', label: 'JPEG (raster)', disabled: !canImage },
      { value: 'svg', label: 'SVG (vector)', disabled: !canSvg },
    ];
    return items;
  }, [canHtml, canImage, canJson, canSvg]);

  if (!open) return null;

  const makeImageBlob = (): { blob: Blob; mime: string; ext: string } | null => {
    const naturalW = canvasRef?.width ?? sourceImage?.naturalWidth ?? 0;
    const naturalH = canvasRef?.height ?? sourceImage?.naturalHeight ?? 0;
    if (!naturalW || !naturalH) return null;
    const cropRect = {
      x: Math.max(0, cropX),
      y: Math.max(0, cropY),
      w: cropW > 0 ? Math.min(cropW, naturalW) : naturalW,
      h: cropH > 0 ? Math.min(cropH, naturalH) : naturalH,
    };
    const targetW = Math.floor(cropRect.w * scale);
    const targetH = Math.floor(cropRect.h * scale);
    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    // Prepare cropped tmp image
    const tmp = document.createElement('canvas');
    tmp.width = Math.floor(cropRect.w * scale);
    tmp.height = Math.floor(cropRect.h * scale);
    const tctx = tmp.getContext('2d');
    if (!tctx) return null;
    if (canvasRef) {
      tctx.drawImage(
        canvasRef,
        cropRect.x,
        cropRect.y,
        cropRect.w,
        cropRect.h,
        0,
        0,
        Math.floor(cropRect.w * scale),
        Math.floor(cropRect.h * scale)
      );
    } else if (sourceImage) {
      tctx.drawImage(
        sourceImage,
        cropRect.x,
        cropRect.y,
        cropRect.w,
        cropRect.h,
        0,
        0,
        Math.floor(cropRect.w * scale),
        Math.floor(cropRect.h * scale)
      );
    }
    // Apply filters and transforms on main ctx, then draw tmp
    ctx.save();
    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
    const rad = (rotate % 360) * Math.PI / 180;
    const needRotate = (rotate % 360) !== 0;
    const flipScaleX = flipH ? -1 : 1;
    const flipScaleY = flipV ? -1 : 1;
    if (needRotate) {
      ctx.translate(targetW / 2, targetH / 2);
      ctx.rotate(rad);
      ctx.scale(flipScaleX, flipScaleY);
      ctx.drawImage(tmp, -Math.floor(tmp.width / 2), -Math.floor(tmp.height / 2));
    } else {
      if (flipScaleX === -1 || flipScaleY === -1) {
        ctx.translate(flipScaleX === -1 ? targetW : 0, flipScaleY === -1 ? targetH : 0);
        ctx.scale(flipScaleX, flipScaleY);
      }
      ctx.drawImage(tmp, 0, 0);
    }
    ctx.restore();
    const mime = format === 'jpeg' ? 'image/jpeg' : 'image/png';
    const dataUrl = canvas.toDataURL(mime, format === 'jpeg' ? jpegQuality : undefined);
    const bin = atob(dataUrl.split(',')[1]);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
    return { blob: new Blob([bytes], { type: mime }), mime, ext: format };
  };

  useMemo(() => {
    try {
      if ((format === 'png' || format === 'jpeg') && (canvasRef || sourceImage)) {
        const out = makeImageBlob();
        if (out) {
          const url = URL.createObjectURL(out.blob);
          setPreviewUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return url; });
        }
      } else if (format === 'svg' && svgElement) {
        const serializer = new XMLSerializer();
        const source = serializer.serializeToString(svgElement);
        setPreviewUrl('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(source));
      } else if (format === 'html' && getHtml) {
        const html = getHtml();
        setPreviewUrl('data:text/html;charset=utf-8,' + encodeURIComponent(html));
      } else if (format === 'markdown' && getDocJson) {
        const md = tiptapJsonToMarkdown(getDocJson());
        setPreviewUrl('data:text/markdown;charset=utf-8,' + encodeURIComponent(md));
      } else {
        setPreviewUrl(null);
      }
    } catch {
      setPreviewUrl(null);
    }
    return undefined;
  }, [format, jpegQuality, scale, rotate, canvasRef, sourceImage, svgElement, getHtml, getDocJson]);

  const handleExport = async () => {
    try {
      const name = filename || 'export';
      if (format === 'json' && getDocJson) {
        const json = getDocJson();
        const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
        if (destination === 'offline') {
          const { platformStorage } = await import('@/services/platform/storage.service');
          await platformStorage.saveMedia(`${name}-${Date.now()}`, blob, 'image');
        } else {
          downloadBlob(blob, `${name}.json`, 'application/json');
        }
        return;
      }
      if (format === 'markdown' && getDocJson) {
        const json = getDocJson();
        const md = tiptapJsonToMarkdown(json);
        const blob = new Blob([md], { type: 'text/markdown' });
        if (destination === 'offline') {
          const { platformStorage } = await import('@/services/platform/storage.service');
          await platformStorage.saveMedia(`${name}-${Date.now()}`, blob, 'image');
        } else {
          downloadBlob(blob, `${name}.md`, 'text/markdown');
        }
        return;
      }
      if (format === 'html' && getHtml) {
        const html = getHtml();
        const doc = `<!doctype html><html><head><meta charset="utf-8"/><title>${name}</title></head><body>${html}</body></html>`;
        const blob = new Blob([doc], { type: 'text/html' });
        if (destination === 'offline') {
          const { platformStorage } = await import('@/services/platform/storage.service');
          await platformStorage.saveMedia(`${name}-${Date.now()}`, blob, 'image');
        } else {
          downloadBlob(blob, `${name}.html`, 'text/html');
        }
        return;
      }
      if (format === 'pdf' && getHtml) {
        // Print-friendly: open new window and trigger print
        const html = getHtml();
        const popup = window.open('', '_blank');
        if (popup) {
          popup.document.open();
          popup.document.write(`<!doctype html><html><head><meta charset="utf-8"/><title>${name}</title><style>body{margin:24px;font-family:system-ui,Segoe UI,Roboto,Helvetica,Arial}</style></head><body>${html}</body></html>`);
          popup.document.close();
          popup.focus();
          popup.print();
        }
        return;
      }
      if ((format === 'png' || format === 'jpeg') && (canvasRef || sourceImage)) {
        const out = makeImageBlob();
        if (!out) return;
        if (destination === 'offline') {
          const { platformStorage } = await import('@/services/platform/storage.service');
          await platformStorage.saveMedia(`${name}-${Date.now()}`, out.blob, 'image');
        } else if (destination === 'attach' && strandId) {
          setSaving(true);
          const file = new File([out.blob], `${name}.${out.ext}`, { type: out.mime });
          const { openstrandAPI } = await import('@/services/openstrand.api');
          await openstrandAPI.attachments.uploadMedia(strandId, file, 'image', { generateSummary: true });
          setSaving(false);
        } else {
          downloadBlob(out.blob, `${name}.${out.ext}`, out.mime);
        }
        return;
      }
      if (format === 'svg' && svgElement) {
        const serializer = new XMLSerializer();
        const source = serializer.serializeToString(svgElement);
        const blob = new Blob([source], { type: 'image/svg+xml' });
        if (destination === 'offline') {
          const { platformStorage } = await import('@/services/platform/storage.service');
          await platformStorage.saveMedia(`${name}-${Date.now()}`, blob, 'image');
        } else if (destination === 'attach' && strandId) {
          setSaving(true);
          const file = new File([blob], `${name}.svg`, { type: 'image/svg+xml' });
          const { openstrandAPI } = await import('@/services/openstrand.api');
          await openstrandAPI.attachments.uploadMedia(strandId, file, 'image', { generateSummary: true });
          setSaving(false);
        } else {
          downloadBlob(blob, `${name}.svg`, 'image/svg+xml');
        }
        return;
      }
    } catch (error) {
      // no-op
    }
  };

  // Drag handlers for crop overlay
  const startDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isCropAdjustMode || !displayRect) return;
    const container = previewContainerRef.current;
    if (!container) return;
    const cRect = container.getBoundingClientRect();
    const cx = e.clientX - cRect.left;
    const cy = e.clientY - cRect.top;
    const sel = selectionPx ?? { x: displayRect.x + 10, y: displayRect.y + 10, w: Math.max(1, displayRect.w - 20), h: Math.max(1, displayRect.h - 20) };
    const within = (x: number, y: number, r: { x: number; y: number; w: number; h: number }) => x >= r.x && y >= r.y && x <= r.x + r.w && y <= r.y + r.h;
    const near = (x: number, y: number, tx: number, ty: number, tol = 8) => Math.abs(x - tx) <= tol && Math.abs(y - ty) <= tol;
    let mode: 'new' | 'move' | 'resize' = 'new';
    let handle: string | undefined;
    if (selectionPx && within(cx, cy, sel)) {
      const handles = [
        { id: 'nw', x: sel.x, y: sel.y },
        { id: 'n', x: sel.x + sel.w / 2, y: sel.y },
        { id: 'ne', x: sel.x + sel.w, y: sel.y },
        { id: 'e', x: sel.x + sel.w, y: sel.y + sel.h / 2 },
        { id: 'se', x: sel.x + sel.w, y: sel.y + sel.h },
        { id: 's', x: sel.x + sel.w / 2, y: sel.y + sel.h },
        { id: 'sw', x: sel.x, y: sel.y + sel.h },
        { id: 'w', x: sel.x, y: sel.y + sel.h / 2 },
      ];
      const found = handles.find(h => near(cx, cy, h.x, h.y));
      if (found) { mode = 'resize'; handle = found.id; } else { mode = 'move'; }
    }
    dragRef.current = { mode, handle, startX: cx, startY: cy, startRect: sel };
    if (!selectionPx) setSelectionPx(sel);
    window.addEventListener('mousemove', onDrag);
    window.addEventListener('mouseup', endDrag);
  };

  const onDrag = (ev: MouseEvent) => {
    if (!dragRef.current || !displayRect) return;
    const { mode, handle, startX, startY, startRect } = dragRef.current;
    if (!startRect) return;
    const c = previewContainerRef.current;
    if (!c) return;
    const cRect = c.getBoundingClientRect();
    const cx = ev.clientX - cRect.left;
    const cy = ev.clientY - cRect.top;
    const dx = cx - startX;
    const dy = cy - startY;
    let next = { ...startRect };
    const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
    if (mode === 'move') {
      next.x = clamp(startRect.x + dx, displayRect.x, displayRect.x + displayRect.w - startRect.w);
      next.y = clamp(startRect.y + dy, displayRect.y, displayRect.y + displayRect.h - startRect.h);
    } else if (mode === 'resize') {
      let x = startRect.x;
      let y = startRect.y;
      let w = startRect.w;
      let h = startRect.h;
      const minSize = 8;
      if (handle?.includes('e')) w = clamp(startRect.w + dx, minSize, displayRect.x + displayRect.w - startRect.x);
      if (handle?.includes('s')) h = clamp(startRect.h + dy, minSize, displayRect.y + displayRect.h - startRect.y);
      if (handle?.includes('w')) { const nx = clamp(startRect.x + dx, displayRect.x, startRect.x + startRect.w - minSize); w = startRect.x + startRect.w - nx; x = nx; }
      if (handle?.includes('n')) { const ny = clamp(startRect.y + dy, displayRect.y, startRect.y + startRect.h - minSize); h = startRect.y + startRect.h - ny; y = ny; }
      next = { x, y, w, h };
    } else if (mode === 'new') {
      const x1 = clamp(startX, displayRect.x, displayRect.x + displayRect.w);
      const y1 = clamp(startY, displayRect.y, displayRect.y + displayRect.h);
      const x2 = clamp(cx, displayRect.x, displayRect.x + displayRect.w);
      const y2 = clamp(cy, displayRect.y, displayRect.y + displayRect.h);
      next = { x: Math.min(x1, x2), y: Math.min(y1, y2), w: Math.abs(x2 - x1), h: Math.abs(y2 - y1) };
    }
    setSelectionPx(next);
  };

  const endDrag = () => {
    window.removeEventListener('mousemove', onDrag);
    window.removeEventListener('mouseup', endDrag);
    if (selectionPx && displayRect) {
      const naturalW = canvasRef?.width ?? sourceImage?.naturalWidth ?? 0;
      const naturalH = canvasRef?.height ?? sourceImage?.naturalHeight ?? 0;
      if (naturalW && naturalH) {
        const nx = Math.round(((selectionPx.x - displayRect.x) / displayRect.w) * naturalW);
        const ny = Math.round(((selectionPx.y - displayRect.y) / displayRect.h) * naturalH);
        const nw = Math.round((selectionPx.w / displayRect.w) * naturalW);
        const nh = Math.round((selectionPx.h / displayRect.h) * naturalH);
        setCropX(nx); setCropY(ny); setCropW(nw); setCropH(nh);
      }
    }
    dragRef.current = null;
  };

  // Keyboard nudge and reset
  const getNaturalDims = () => ({
    w: canvasRef?.width ?? sourceImage?.naturalWidth ?? 0,
    h: canvasRef?.height ?? sourceImage?.naturalHeight ?? 0,
  });

  const resetCrop = () => {
    const { w, h } = getNaturalDims();
    if (!w || !h) return;
    setCropX(0); setCropY(0); setCropW(w); setCropH(h);
  };

  const onOverlayKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!isCropAdjustMode) return;
    const { w, h } = getNaturalDims();
    if (!w || !h || cropW <= 0 || cropH <= 0) return;
    const step = e.shiftKey ? 10 : 1;
    let handled = false;
    if (e.key === 'ArrowLeft') {
      const nx = Math.max(0, cropX - step);
      setCropX(nx);
      handled = true;
    } else if (e.key === 'ArrowRight') {
      const nx = Math.min(w - cropW, cropX + step);
      setCropX(nx);
      handled = true;
    } else if (e.key === 'ArrowUp') {
      const ny = Math.max(0, cropY - step);
      setCropY(ny);
      handled = true;
    } else if (e.key === 'ArrowDown') {
      const ny = Math.min(h - cropH, cropY + step);
      setCropY(ny);
      handled = true;
    }
    if (handled) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 backdrop-blur-sm" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="export-dialog-title">
      <Card className="w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
        <CardHeader>
          <CardTitle id="export-dialog-title">Export</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-6 md:grid-cols-5">
            <div className="md:col-span-3">
              <div ref={previewContainerRef} className="relative aspect-video w-full overflow-hidden rounded-lg border border-border/60 bg-muted/20">
                {(previewUrl || (isCropAdjustMode && (imageDataUrl || canvasRef))) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    ref={previewImgRef}
                    src={isCropAdjustMode ? (canvasRef ? canvasRef.toDataURL('image/png') : (imageDataUrl || previewUrl || '')) : (previewUrl || '')}
                    alt="Preview"
                    className="h-full w-full object-contain select-none"
                    draggable={false}
                    onLoad={recomputeDisplayRect}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-muted-foreground">Preview not available</div>
                )}

                {isCropAdjustMode && (format === 'png' || format === 'jpeg') && displayRect ? (
                  <div
                    ref={overlayRef}
                    tabIndex={0}
                    className="absolute inset-0 outline-none"
                    onMouseDown={startDrag}
                    onKeyDown={onOverlayKeyDown}
                    role="region"
                    aria-label="Crop overlay"
                  >
                    {/* Selection rectangle */}
                    {selectionPx ? (
                      <div
                        className="absolute border-2 border-primary/80 bg-primary/5"
                        style={{ left: selectionPx.x, top: selectionPx.y, width: selectionPx.w, height: selectionPx.h }}
                      >
                        {/* Rule-of-thirds grid */}
                        <div className="absolute inset-0 pointer-events-none">
                          <div className="absolute left-1/3 top-0 h-full w-px bg-primary/40" />
                          <div className="absolute left-2/3 top-0 h-full w-px bg-primary/40" />
                          <div className="absolute top-1/3 left-0 w-full h-px bg-primary/40" />
                          <div className="absolute top-2/3 left-0 w-full h-px bg-primary/40" />
                        </div>
                        {/* Handles */}
                        {['nw','n','ne','e','se','s','sw','w'].map((h) => {
                          const size = 10; const half = size / 2;
                          const centers: Record<string, { left: number; top: number }> = {
                            nw: { left: (selectionPx.x), top: (selectionPx.y) },
                            n: { left: (selectionPx.x + selectionPx.w / 2), top: (selectionPx.y) },
                            ne: { left: (selectionPx.x + selectionPx.w), top: (selectionPx.y) },
                            e: { left: (selectionPx.x + selectionPx.w), top: (selectionPx.y + selectionPx.h / 2) },
                            se: { left: (selectionPx.x + selectionPx.w), top: (selectionPx.y + selectionPx.h) },
                            s: { left: (selectionPx.x + selectionPx.w / 2), top: (selectionPx.y + selectionPx.h) },
                            sw: { left: (selectionPx.x), top: (selectionPx.y + selectionPx.h) },
                            w: { left: (selectionPx.x), top: (selectionPx.y + selectionPx.h / 2) },
                          };
                          const c = centers[h];
                          return (
                            <div key={h} className="absolute h-[10px] w-[10px] rounded-sm bg-primary" style={{ left: c.left - half, top: c.top - half }} />
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
              {(format === 'png' || format === 'jpeg') && (
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-6">
                  <Button size="sm" variant="outline" onClick={() => setRotate((r) => (r + 90) % 360)} className="col-span-2">Rotate 90°</Button>
                  <Button size="sm" variant="outline" onClick={() => { setIsCropAdjustMode((v) => !v); setTimeout(() => { recomputeDisplayRect(); if (!isCropAdjustMode) overlayRef.current?.focus(); }, 0); }} className="col-span-2">{isCropAdjustMode ? 'Done' : 'Adjust crop'}</Button>
                  <Button size="sm" variant="outline" onClick={resetCrop} className="col-span-2">Reset crop</Button>
                  <div className="col-span-2 flex items-center gap-2">
                    <Label className="w-6">X</Label>
                    <Input inputMode="numeric" aria-label="Crop X" value={cropX} onChange={(e) => setCropX(Number(e.target.value || 0))} />
                  </div>
                  <div className="col-span-2 flex items-center gap-2">
                    <Label className="w-6">Y</Label>
                    <Input inputMode="numeric" aria-label="Crop Y" value={cropY} onChange={(e) => setCropY(Number(e.target.value || 0))} />
                  </div>
                  <div className="col-span-3 flex items-center gap-2">
                    <Label className="w-12">Width</Label>
                    <Input inputMode="numeric" aria-label="Crop width" value={cropW} onChange={(e) => setCropW(Number(e.target.value || 0))} />
                  </div>
                  <div className="col-span-3 flex items-center gap-2">
                    <Label className="w-12">Height</Label>
                    <Input inputMode="numeric" aria-label="Crop height" value={cropH} onChange={(e) => setCropH(Number(e.target.value || 0))} />
                  </div>
                  <div className="col-span-3 flex items-center gap-2">
                    <Label className="w-20">Aspect</Label>
                    <Select value={aspectRatio} onValueChange={(v) => { setAspectRatio(v as any); if (v !== 'free') applyAspectRatio(v as any); }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Free" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="free">Free</SelectItem>
                        <SelectItem value="1:1">1:1</SelectItem>
                        <SelectItem value="4:3">4:3</SelectItem>
                        <SelectItem value="16:9">16:9</SelectItem>
                        <SelectItem value="3:2">3:2</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-3 flex items-center gap-2">
                    <Button size="sm" variant={flipH ? 'default' : 'outline'} onClick={() => setFlipH((v) => !v)}>Flip H</Button>
                    <Button size="sm" variant={flipV ? 'default' : 'outline'} onClick={() => setFlipV((v) => !v)}>Flip V</Button>
                  </div>
                  <div className="col-span-3 flex items-center gap-2">
                    <Label className="w-20">Brightness</Label>
                    <input type="range" min={50} max={150} value={brightness} onChange={(e) => setBrightness(Number(e.target.value))} className="w-full" />
                  </div>
                  <div className="col-span-3 flex items-center gap-2">
                    <Label className="w-20">Contrast</Label>
                    <input type="range" min={50} max={150} value={contrast} onChange={(e) => setContrast(Number(e.target.value))} className="w-full" />
                  </div>
                  <div className="col-span-3 flex items-center gap-2">
                    <Label className="w-20">Saturation</Label>
                    <input type="range" min={0} max={200} value={saturation} onChange={(e) => setSaturation(Number(e.target.value))} className="w-full" />
                  </div>
                </div>
              )}
            </div>
            <div className="md:col-span-2 space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Filename</Label>
              <Input value={filename} onChange={(e) => setFilename(e.target.value)} placeholder="export" />
            </div>
            <div className="space-y-2">
              <Label>Format</Label>
              <Select value={format} onValueChange={(v) => setFormat(v as ExportFormat)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  {availableFormats.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} disabled={opt.disabled}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
              </div>

              {(format === 'jpeg') && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>JPEG quality (0.5 – 1.0)</Label>
                    <Input type="number" min={0.5} max={1} step={0.01} value={jpegQuality} onChange={(e) => setJpegQuality(Number(e.target.value))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Scale (1–4x)</Label>
                    <Input type="number" min={1} max={4} step={1} value={scale} onChange={(e) => setScale(Number(e.target.value))} />
                  </div>
                </div>
              )}

              {(format === 'png') && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Scale (1–4x)</Label>
                    <Input type="number" min={1} max={4} step={1} value={scale} onChange={(e) => setScale(Number(e.target.value))} />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Destination</Label>
                <Select value={destination} onValueChange={(v) => setDestination(v as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select destination" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="download">Download</SelectItem>
                    <SelectItem value="offline">Save offline</SelectItem>
                    <SelectItem value="attach" disabled={!strandId || (format !== 'png' && format !== 'jpeg' && format !== 'svg')}>Attach to current strand</SelectItem>
                    <SelectItem value="cloud" disabled>Cloud backup (S3/Linode) — configure in Settings</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">Cloud backups require storage connectors. Configure S3/Linode in Settings → Docs & maintenance.</p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" onClick={onClose}>Close</Button>
                {onInsertIntoEditor && (format === 'png' || format === 'jpeg') && (canvasRef || sourceImage) && strandId ? (
                  <Button variant="outline" onClick={() => void handleInsertIntoEditor()} disabled={saving}>Insert into editor</Button>
                ) : null}
                <Button onClick={() => void handleExport()} disabled={saving}>Export</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


