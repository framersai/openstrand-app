import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Eraser, ImageDown, Paintbrush, ScanText, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

/**
 * WhiteboardCanvas
 *
 * Minimal canvas-based sketchpad for handwritten notes.
 * - Pen color/size and background control
 * - One-click export + upload to strand attachments with OCR + summary
 * - Emits `onUploaded` for WYSIWYG embedding
 */
interface WhiteboardCanvasProps {
  strandId?: string;
  onUploaded?: (attachment: any) => void;
}

export function WhiteboardCanvas({ strandId, onUploaded }: WhiteboardCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [color, setColor] = useState('#111827');
  const [size, setSize] = useState(3);
  const [bg, setBg] = useState('#ffffff');

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const rect = container.getBoundingClientRect();
    const scale = window.devicePixelRatio || 1;
    canvas.width = Math.floor(rect.width * scale);
    canvas.height = Math.floor(rect.height * scale);
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(scale, scale);
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, rect.width, rect.height);
    }
  }, [bg]);

  useEffect(() => {
    resizeCanvas();
    const onResize = () => resizeCanvas();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [resizeCanvas]);

  const getCtx = () => canvasRef.current?.getContext('2d') ?? null;

  const handlePointerDown: React.PointerEventHandler<HTMLCanvasElement> = (e) => {
    const canvas = canvasRef.current;
    const ctx = getCtx();
    if (!canvas || !ctx) return;
    setDrawing(true);
    const rect = canvas.getBoundingClientRect();
    ctx.strokeStyle = color;
    ctx.lineWidth = size;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const handlePointerMove: React.PointerEventHandler<HTMLCanvasElement> = (e) => {
    const ctx = getCtx();
    const canvas = canvasRef.current;
    if (!ctx || !canvas || !drawing) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const handlePointerUp: React.PointerEventHandler<HTMLCanvasElement> = () => {
    setDrawing(false);
  };

  const clear = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = getCtx();
    if (!canvas || !ctx || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, rect.width, rect.height);
  }, [bg]);

  const exportAndUpload = useCallback(async () => {
    try {
      if (!canvasRef.current) return;
      if (!strandId) {
        toast.error('Set a strand ID before uploading whiteboard');
        return;
      }
      const blob: Blob | null = await new Promise((resolve) => canvasRef.current!.toBlob(resolve, 'image/png', 0.95));
      if (!blob) throw new Error('Export failed');
      const file = new File([blob], `whiteboard-${Date.now()}.png`, { type: 'image/png' });
      const form = new FormData();
      form.append('file', file);
      form.append('type', 'image');
      form.append('generateSummary', 'true');
      form.append('runOCR', 'true');
      form.append('notes', 'Whiteboard sketch');

      const response = await fetch(`/api/v1/strands/${strandId}/attachments/media`, {
        method: 'POST',
        body: form,
        credentials: 'include',
      });
      if (!response.ok) throw new Error(await response.text());
      const payload = await response.json();
      toast.success('Whiteboard uploaded');
      onUploaded?.(payload?.data ?? payload);
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : 'Whiteboard upload failed');
    }
  }, [strandId, onUploaded]);

  return (
    <TooltipProvider>
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle className="text-sm">Whiteboard</CardTitle>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Paintbrush className="h-4 w-4 text-muted-foreground" />
              <Input
                type="color"
                aria-label="Brush color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-8 w-10 p-0"
              />
              <Label className="text-xs text-muted-foreground">Size</Label>
              <Input
                type="range"
                min={1}
                max={16}
                value={size}
                onChange={(e) => setSize(Number(e.target.value))}
                className="w-24"
              />
              <Label className="text-xs text-muted-foreground">Background</Label>
              <Input
                type="color"
                aria-label="Background"
                value={bg}
                onChange={(e) => setBg(e.target.value)}
                className="h-8 w-10 p-0"
              />
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={clear}>
                  <Eraser className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="text-xs">Clear</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={exportAndUpload} className="gap-1">
                  <ImageDown className="h-4 w-4" /> Upload <ScanText className="ml-1 h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="text-xs">Upload with OCR + summary</TooltipContent>
            </Tooltip>
          </div>
        </CardHeader>
        <CardContent>
          <div ref={containerRef} className="h-64 w-full rounded-md border border-border/60 bg-muted/20">
            <canvas
              ref={canvasRef}
              className="h-full w-full"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
            />
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}


