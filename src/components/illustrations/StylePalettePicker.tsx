/**
 * Style Palette Picker
 * 
 * Allows users to select a consistent illustration style for all generated images.
 * Styles persist across flashcards, quizzes, and strands.
 * 
 * Presets:
 * - Studio Ghibli
 * - Flat 2D / Pastel
 * - Cyberpunk / Neon
 * - Realistic / Photographic
 * - Hand-Drawn / Sketch
 * - Minimalist / Line Art
 * - Watercolor / Artistic
 * - Custom (user-defined prompt)
 * 
 * @example
 * ```tsx
 * <StylePalettePicker
 *   value={currentStyle}
 *   onChange={setStyle}
 *   onApply={applyToAll}
 * />
 * ```
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Palette, Wand2, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export interface StylePreset {
  id: string;
  name: string;
  description: string;
  prompt: string;
  thumbnail?: string;
  tags: string[];
}

export const STYLE_PRESETS: StylePreset[] = [
  {
    id: 'ghibli',
    name: 'Studio Ghibli',
    description: 'Whimsical, hand-drawn animation style',
    prompt: 'in the style of Studio Ghibli animation, soft colors, dreamy atmosphere, hand-painted backgrounds',
    tags: ['anime', 'whimsical', 'colorful'],
  },
  {
    id: 'flat_pastel',
    name: 'Flat Pastel',
    description: 'Modern, minimal with soft colors',
    prompt: 'flat design, pastel color palette, geometric shapes, minimal details, clean composition',
    tags: ['modern', 'minimal', 'soft'],
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    description: 'Neon lights, futuristic, high contrast',
    prompt: 'cyberpunk style, neon lights, dark background, futuristic, high contrast, digital art',
    tags: ['neon', 'futuristic', 'bold'],
  },
  {
    id: 'photographic',
    name: 'Photographic',
    description: 'Realistic, professional photography',
    prompt: 'professional photograph, high quality, realistic lighting, sharp details, 4K resolution',
    tags: ['realistic', 'professional', 'detailed'],
  },
  {
    id: 'hand_drawn',
    name: 'Hand-Drawn',
    description: 'Sketch-like, pencil/ink style',
    prompt: 'hand-drawn sketch, pencil and ink, artistic linework, loose style, sketch pad aesthetic',
    tags: ['sketch', 'artistic', 'organic'],
  },
  {
    id: 'minimalist',
    name: 'Minimalist',
    description: 'Line art, monochrome, essential only',
    prompt: 'minimalist line art, simple shapes, monochrome or two-color palette, essential details only',
    tags: ['minimal', 'clean', 'simple'],
  },
  {
    id: 'watercolor',
    name: 'Watercolor',
    description: 'Artistic, flowing, soft edges',
    prompt: 'watercolor painting style, soft edges, flowing colors, artistic brush strokes, textured paper',
    tags: ['artistic', 'soft', 'flowing'],
  },
  {
    id: 'custom',
    name: 'Custom Style',
    description: 'Define your own style prompt',
    prompt: '',
    tags: ['custom'],
  },
];

export interface StylePalettePickerProps {
  value?: string; // Selected preset ID
  customPrompt?: string;
  onChange?: (presetId: string, prompt: string) => void;
  onApplyToAll?: () => Promise<void>;
  showApplyButton?: boolean;
}

export function StylePalettePicker({
  value = 'flat_pastel',
  customPrompt = '',
  onChange,
  onApplyToAll,
  showApplyButton = true,
}: StylePalettePickerProps) {
  const [selectedId, setSelectedId] = useState(value);
  const [customText, setCustomText] = useState(customPrompt);
  const [applying, setApplying] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Save to localStorage
    localStorage.setItem('illustrationStylePreset', selectedId);
    if (selectedId === 'custom') {
      localStorage.setItem('illustrationCustomPrompt', customText);
    }
  }, [selectedId, customText]);

  const handleSelect = (presetId: string) => {
    setSelectedId(presetId);
    const preset = STYLE_PRESETS.find((p) => p.id === presetId);
    if (preset && onChange) {
      onChange(presetId, preset.prompt || customText);
    }
  };

  const handleCustomChange = (text: string) => {
    setCustomText(text);
    if (selectedId === 'custom' && onChange) {
      onChange('custom', text);
    }
  };

  const handleApplyToAll = async () => {
    if (!onApplyToAll) return;

    try {
      setApplying(true);
      await onApplyToAll();
      toast({
        title: 'Style applied',
        description: 'All illustrations will use the selected style',
      });
    } catch (error: any) {
      toast({
        title: 'Apply failed',
        description: error.message || 'Could not apply style to all illustrations',
        variant: 'destructive',
      });
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Style Presets Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {STYLE_PRESETS.map((preset) => (
          <Card
            key={preset.id}
            className={cn(
              'cursor-pointer transition-all hover:shadow-lg hover:scale-105',
              selectedId === preset.id && 'ring-2 ring-primary shadow-xl'
            )}
            onClick={() => handleSelect(preset.id)}
          >
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <Palette className="h-5 w-5 text-primary" />
                {selectedId === preset.id && (
                  <Check className="h-5 w-5 text-primary" />
                )}
              </div>
              <h4 className="font-semibold text-sm">{preset.name}</h4>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {preset.description}
              </p>
              <div className="flex flex-wrap gap-1">
                {preset.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Custom Style Input */}
      {selectedId === 'custom' && (
        <Card>
          <CardContent className="p-4 space-y-2">
            <Label>Custom Style Prompt</Label>
            <Textarea
              value={customText}
              onChange={(e) => handleCustomChange(e.target.value)}
              placeholder="Describe your desired illustration style..."
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              Example: "in the style of vintage botanical illustrations, muted colors, scientific accuracy"
            </p>
          </CardContent>
        </Card>
      )}

      {/* Selected Style Info */}
      <Card className="border-primary/50 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex items-start gap-2">
            <Wand2 className="h-5 w-5 text-primary mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-primary">Selected Style</p>
              <p className="text-sm text-muted-foreground mt-1">
                {STYLE_PRESETS.find((p) => p.id === selectedId)?.name}
              </p>
              <p className="text-xs text-muted-foreground mt-2 font-mono bg-muted/50 p-2 rounded">
                {selectedId === 'custom' ? customText : STYLE_PRESETS.find((p) => p.id === selectedId)?.prompt}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Apply to All Button */}
      {showApplyButton && onApplyToAll && (
        <Button onClick={handleApplyToAll} disabled={applying} size="lg" className="w-full">
          {applying ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Applying style to all illustrations...
            </>
          ) : (
            <>
              <Wand2 className="h-4 w-4 mr-2" />
              Apply to All Future Illustrations
            </>
          )}
        </Button>
      )}
    </div>
  );
}

