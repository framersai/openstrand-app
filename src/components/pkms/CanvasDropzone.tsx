'use client';

/**
 * @module CanvasDropzone
 * @description Interactive media drop zone with drawing capabilities
 * 
 * Features:
 * - Drag & drop file uploads
 * - Drawing pad with brush tools (pen, eraser, shapes)
 * - Color palette & brush size controls
 * - Undo/redo stack
 * - Export as PNG
 * - Paste from clipboard
 * - Load images and annotate them
 * - Save to strand attachments
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { fabric } from 'fabric';
import {
  Pen,
  Eraser,
  Undo2,
  Redo2,
  Trash2,
  Download,
  Upload,
  Square,
  Circle,
  Type,
  Palette,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface CanvasDropzoneProps {
  /** Called when user saves/exports the canvas */
  onSave?: (blob: Blob, filename: string) => void;
  
  /** Initial image to load on canvas */
  initialImage?: string;
  
  /** Canvas dimensions */
  width?: number;
  height?: number;
  
  /** Custom class name */
  className?: string;
}

type DrawingTool = 'pen' | 'eraser' | 'select' | 'rectangle' | 'circle' | 'text';

const COLORS = [
  '#000000', // Black
  '#FFFFFF', // White
  '#FF0000', // Red
  '#00FF00', // Green
  '#0000FF', // Blue
  '#FFFF00', // Yellow
  '#FF00FF', // Magenta
  '#00FFFF', // Cyan
  '#FFA500', // Orange
  '#800080', // Purple
];

export function CanvasDropzone({
  onSave,
  initialImage,
  width = 800,
  height = 600,
  className,
}: CanvasDropzoneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const [tool, setTool] = useState<DrawingTool>('pen');
  const [brushSize, setBrushSize] = useState(5);
  const [color, setColor] = useState('#000000');
  const [history, setHistory] = useState<string[]>([]);
  const [historyStep, setHistoryStep] = useState(-1);
  const { toast } = useToast();

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current || canvas) return;

    const fabricCanvas = new fabric.Canvas(canvasRef.current, {
      width,
      height,
      backgroundColor: '#ffffff',
      isDrawingMode: true,
    });

    // Configure initial brush
    fabricCanvas.freeDrawingBrush.color = color;
    fabricCanvas.freeDrawingBrush.width = brushSize;

    setCanvas(fabricCanvas);

    // Load initial image if provided
    if (initialImage) {
      fabric.Image.fromURL(initialImage, (img) => {
        img.scaleToWidth(width * 0.8);
        img.set({ left: width / 2 - (img.getScaledWidth() / 2), top: height / 2 - (img.getScaledHeight() / 2) });
        fabricCanvas.add(img);
        fabricCanvas.renderAll();
        saveState(fabricCanvas);
      });
    }

    // Save initial state
    saveState(fabricCanvas);

    return () => {
      fabricCanvas.dispose();
    };
  }, []);

  // Update brush when tool/color/size changes
  useEffect(() => {
    if (!canvas) return;

    switch (tool) {
      case 'pen':
        canvas.isDrawingMode = true;
        canvas.freeDrawingBrush.color = color;
        canvas.freeDrawingBrush.width = brushSize;
        break;

      case 'eraser':
        canvas.isDrawingMode = true;
        canvas.freeDrawingBrush.color = '#ffffff';
        canvas.freeDrawingBrush.width = brushSize * 2;
        break;

      case 'select':
        canvas.isDrawingMode = false;
        break;

      default:
        canvas.isDrawingMode = false;
    }
  }, [canvas, tool, color, brushSize]);

  const saveState = useCallback((fabricCanvas: fabric.Canvas) => {
    const json = JSON.stringify(fabricCanvas.toJSON());
    setHistory((prev) => {
      const newHistory = prev.slice(0, historyStep + 1);
      newHistory.push(json);
      return newHistory;
    });
    setHistoryStep((prev) => prev + 1);
  }, [historyStep]);

  const handleUndo = () => {
    if (!canvas || historyStep <= 0) return;

    const newStep = historyStep - 1;
    canvas.loadFromJSON(history[newStep], () => {
      canvas.renderAll();
      setHistoryStep(newStep);
    });
  };

  const handleRedo = () => {
    if (!canvas || historyStep >= history.length - 1) return;

    const newStep = historyStep + 1;
    canvas.loadFromJSON(history[newStep], () => {
      canvas.renderAll();
      setHistoryStep(newStep);
    });
  };

  const handleClear = () => {
    if (!canvas) return;

    canvas.clear();
    canvas.backgroundColor = '#ffffff';
    canvas.renderAll();
    saveState(canvas);
  };

  const handleExport = () => {
    if (!canvas) return;

    canvas.getElement().toBlob((blob) => {
      if (!blob) {
        toast({
          title: 'Export Failed',
          description: 'Could not export canvas',
          variant: 'destructive',
        });
        return;
      }

      const filename = `canvas-${Date.now()}.png`;

      if (onSave) {
        onSave(blob, filename);
      } else {
        // Fallback: download directly
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
      }

      toast({
        title: 'Exported',
        description: 'Canvas saved as PNG',
      });
    });
  };

  const handleAddShape = (shape: 'rectangle' | 'circle') => {
    if (!canvas) return;

    let obj: fabric.Object;

    if (shape === 'rectangle') {
      obj = new fabric.Rect({
        left: 100,
        top: 100,
        width: 150,
        height: 100,
        fill: 'transparent',
        stroke: color,
        strokeWidth: 3,
      });
    } else {
      obj = new fabric.Circle({
        left: 100,
        top: 100,
        radius: 75,
        fill: 'transparent',
        stroke: color,
        strokeWidth: 3,
      });
    }

    canvas.add(obj);
    canvas.renderAll();
    saveState(canvas);
    setTool('select');
  };

  const handleAddText = () => {
    if (!canvas) return;

    const text = new fabric.IText('Double-click to edit', {
      left: 100,
      top: 100,
      fontSize: 24,
      fill: color,
    });

    canvas.add(text);
    canvas.renderAll();
    saveState(canvas);
    setTool('select');
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (!canvas || acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        fabric.Image.fromURL(dataUrl, (img) => {
          img.scaleToWidth(width * 0.8);
          img.set({
            left: width / 2 - (img.getScaledWidth() / 2),
            top: height / 2 - (img.getScaledHeight() / 2),
          });
          canvas.add(img);
          canvas.renderAll();
          saveState(canvas);
        });
      };
      reader.readAsDataURL(file);

      toast({
        title: 'Image Loaded',
        description: `${file.name} added to canvas`,
      });
    }
  }, [canvas, width, height, saveState, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
    },
    noClick: true, // Don't trigger on canvas clicks
  });

  // Listen for canvas modifications to save state
  useEffect(() => {
    if (!canvas) return;

    const handleModified = () => {
      saveState(canvas);
    };

    canvas.on('object:modified', handleModified);
    canvas.on('object:added', handleModified);
    canvas.on('path:created', handleModified);

    return () => {
      canvas.off('object:modified', handleModified);
      canvas.off('object:added', handleModified);
      canvas.off('path:created', handleModified);
    };
  }, [canvas, saveState]);

  // Handle paste from clipboard
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      if (!canvas) return;

      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith('image/')) {
          const blob = item.getAsFile();
          if (blob) {
            const reader = new FileReader();
            reader.onload = (event) => {
              const dataUrl = event.target?.result as string;
              fabric.Image.fromURL(dataUrl, (img) => {
                img.scaleToWidth(width * 0.6);
                img.set({
                  left: width / 2 - (img.getScaledWidth() / 2),
                  top: height / 2 - (img.getScaledHeight() / 2),
                });
                canvas.add(img);
                canvas.renderAll();
              });
            };
            reader.readAsDataURL(blob);

            toast({
              title: 'Image Pasted',
              description: 'Image from clipboard added',
            });
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [canvas, width, height, toast]);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Toolbar */}
      <Card>
        <CardContent className="p-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Drawing Tools */}
            <div className="flex gap-1">
              <Button
                variant={tool === 'pen' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setTool('pen')}
                title="Pen"
              >
                <Pen className="h-4 w-4" />
              </Button>
              <Button
                variant={tool === 'eraser' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setTool('eraser')}
                title="Eraser"
              >
                <Eraser className="h-4 w-4" />
              </Button>
              <Button
                variant={tool === 'select' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setTool('select')}
                title="Select"
              >
                <Square className="h-4 w-4" />
              </Button>
            </div>

            <div className="h-6 w-px bg-border" />

            {/* Shapes */}
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleAddShape('rectangle')}
                title="Add Rectangle"
              >
                <Square className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleAddShape('circle')}
                title="Add Circle"
              >
                <Circle className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleAddText}
                title="Add Text"
              >
                <Type className="h-4 w-4" />
              </Button>
            </div>

            <div className="h-6 w-px bg-border" />

            {/* Color Picker */}
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4 text-muted-foreground" />
              <div className="flex gap-1">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    className={cn(
                      'w-6 h-6 rounded-full border-2 transition-transform hover:scale-110',
                      color === c ? 'ring-2 ring-primary ring-offset-2' : 'border-border'
                    )}
                    style={{ backgroundColor: c }}
                    onClick={() => setColor(c)}
                    title={c}
                  />
                ))}
              </div>
            </div>

            <div className="h-6 w-px bg-border" />

            {/* Brush Size */}
            <div className="flex items-center gap-2 min-w-[120px]">
              <span className="text-xs text-muted-foreground">Size:</span>
              <Slider
                value={[brushSize]}
                onValueChange={(values) => setBrushSize(values[0])}
                min={1}
                max={50}
                step={1}
                className="w-20"
              />
              <span className="text-xs font-mono w-6">{brushSize}</span>
            </div>

            <div className="h-6 w-px bg-border" />

            {/* History */}
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="icon"
                onClick={handleUndo}
                disabled={historyStep <= 0}
                title="Undo"
              >
                <Undo2 className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleRedo}
                disabled={historyStep >= history.length - 1}
                title="Redo"
              >
                <Redo2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="h-6 w-px bg-border" />

            {/* Actions */}
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="icon"
                onClick={handleClear}
                title="Clear Canvas"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button
                variant="default"
                size="icon"
                onClick={handleExport}
                title="Export as PNG"
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Canvas Area */}
      <div
        {...getRootProps()}
        className={cn(
          'relative border-2 border-dashed rounded-lg overflow-hidden transition-colors',
          isDragActive ? 'border-primary bg-primary/5' : 'border-border'
        )}
      >
        <input {...getInputProps()} />
        
        <canvas
          ref={canvasRef}
          className="block max-w-full h-auto"
        />

        {/* Drag Overlay */}
        {isDragActive && (
          <div className="absolute inset-0 flex items-center justify-center bg-primary/10 backdrop-blur-sm">
            <div className="text-center space-y-2">
              <Upload className="h-12 w-12 mx-auto text-primary" />
              <p className="font-semibold">Drop your image here</p>
            </div>
          </div>
        )}

        {/* Instructions Overlay (when empty) */}
        {history.length === 1 && !initialImage && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center space-y-2 text-muted-foreground">
              <Upload className="h-12 w-12 mx-auto" />
              <p className="text-sm">Drag & drop images or paste from clipboard</p>
              <p className="text-xs">Then draw, annotate, and export!</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

