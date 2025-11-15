'use client';

/**
 * @module StylePresetCard
 * @description Visual preset card with preview, description, and best-use tooltip
 * 
 * Used in IllustrationGeneratorModal to help users pick the right style
 * for their content with inline guidance and examples.
 */

import { Info } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export interface StylePreset {
  value: string;
  label: string;
  description: string;
  category: 'modern' | 'classic' | 'retro' | 'anime' | '3d' | 'artistic';
  bestFor: string[];
  resolution: 'any' | 'high' | 'medium';
  costMultiplier?: number;
}

export const STYLE_PRESETS: StylePreset[] = [
  // Modern/Clean
  {
    value: 'flat_pastel',
    label: 'Flat Pastel',
    description: 'Soft colors, simple shapes, friendly vibe',
    category: 'modern',
    bestFor: ['Product docs', 'Onboarding', 'General education'],
    resolution: 'any',
  },
  {
    value: 'minimal_vector',
    label: 'Minimal Vector',
    description: 'Thin lines, limited palette, highly legible',
    category: 'modern',
    bestFor: ['Icons', 'Diagrams', 'Technical docs'],
    resolution: 'any',
  },
  {
    value: 'isometric',
    label: 'Isometric',
    description: 'Technical precision, 30° angles, game UI style',
    category: 'modern',
    bestFor: ['Architecture', 'Systems', 'Game design'],
    resolution: 'high',
  },
  
  // Classic/Traditional
  {
    value: 'watercolor_soft',
    label: 'Soft Watercolor',
    description: 'Gentle gradients, storybook feel',
    category: 'classic',
    bestFor: ['Children\'s content', 'Narratives', 'Humanities'],
    resolution: 'high',
  },
  {
    value: 'pencil_sketch',
    label: 'Pencil Sketch',
    description: 'Hand-drawn line art, notebook style',
    category: 'classic',
    bestFor: ['Brainstorming', 'Rough concepts', 'Informal notes'],
    resolution: 'any',
  },
  {
    value: 'comic_lineart',
    label: 'Comic Line Art',
    description: 'Clear outlines, expressive, educational panels',
    category: 'classic',
    bestFor: ['Sequential learning', 'Step-by-step guides'],
    resolution: 'medium',
  },
  
  // Retro/Gaming
  {
    value: 'pixel_8bit',
    label: '8-bit Pixel',
    description: 'Limited palette, crisp edges, NES aesthetic',
    category: 'retro',
    bestFor: ['Gaming content', 'Retro themes', 'Icons'],
    resolution: 'medium',
  },
  {
    value: 'pixel_16bit',
    label: '16-bit Pixel',
    description: 'Richer colors, dithered gradients, SNES era',
    category: 'retro',
    bestFor: ['Gaming content', 'Detailed pixel art'],
    resolution: 'high',
  },
  {
    value: 'ps1_lowpoly',
    label: 'PS1 Low-Poly',
    description: 'Chunky 3D, vertex jitter, early 3D gaming',
    category: 'retro',
    bestFor: ['3D concepts', 'Nostalgic content', 'Game dev'],
    resolution: 'medium',
  },
  {
    value: 'vaporwave',
    label: 'Vaporwave',
    description: 'Neon colors, grids, 80s/90s nostalgia',
    category: 'retro',
    bestFor: ['Creative projects', 'Aesthetic content', 'Music'],
    resolution: 'high',
  },
  
  // Anime/Manga
  {
    value: 'anime_cel',
    label: 'Anime Cel-Shaded',
    description: 'Bold outlines, vibrant colors, TV anime style',
    category: 'anime',
    bestFor: ['Character concepts', 'Storytelling', 'Japanese content'],
    resolution: 'high',
  },
  {
    value: 'anime_soft',
    label: 'Soft Anime',
    description: 'Pastel watercolor, dreamy, shoujo aesthetic',
    category: 'anime',
    bestFor: ['Emotional content', 'Gentle narratives'],
    resolution: 'high',
  },
  {
    value: 'manga_ink',
    label: 'Manga Ink',
    description: 'B&W, screentone shading, dynamic linework',
    category: 'anime',
    bestFor: ['Sequential art', 'High-contrast diagrams'],
    resolution: 'high',
  },
  
  // 3D/Realistic
  {
    value: 'render_3d',
    label: '3D Render',
    description: 'Smooth surfaces, studio lighting, polished',
    category: '3d',
    bestFor: ['Product visualization', 'Architecture', 'Technical'],
    resolution: 'high',
    costMultiplier: 1.2,
  },
  {
    value: 'photorealistic',
    label: 'Photorealistic',
    description: 'Natural lighting, fine details, lifelike',
    category: '3d',
    bestFor: ['Science', 'Nature', 'Realistic scenarios'],
    resolution: 'high',
    costMultiplier: 1.3,
  },
  {
    value: 'clay_render',
    label: 'Clay Render',
    description: 'Matte surfaces, stop-motion feel, playful',
    category: '3d',
    bestFor: ['Fun content', 'Children\'s material', 'Approachable 3D'],
    resolution: 'high',
  },
  
  // Artistic/Experimental
  {
    value: 'paper_cutout',
    label: 'Paper Cutout',
    description: 'Layered collage, textured edges, handcrafted',
    category: 'artistic',
    bestFor: ['Creative projects', 'Crafts', 'Tactile feel'],
    resolution: 'high',
  },
  {
    value: 'stained_glass',
    label: 'Stained Glass',
    description: 'Bold outlines, jewel tones, geometric',
    category: 'artistic',
    bestFor: ['Religious content', 'Historical', 'Decorative'],
    resolution: 'high',
  },
  {
    value: 'neon_sign',
    label: 'Neon Sign',
    description: 'Glowing tubes, dark background, cyberpunk',
    category: 'artistic',
    bestFor: ['Tech content', 'Night scenes', 'Modern urban'],
    resolution: 'medium',
  },
  {
    value: 'chalkboard',
    label: 'Chalkboard',
    description: 'Dark slate, chalk lines, classroom aesthetic',
    category: 'artistic',
    bestFor: ['Teaching', 'Math/science', 'Informal diagrams'],
    resolution: 'any',
  },
  {
    value: 'blueprint',
    label: 'Blueprint',
    description: 'Technical schematic, cyan on blue',
    category: 'artistic',
    bestFor: ['Engineering', 'Architecture', 'Technical specs'],
    resolution: 'high',
  },
];

interface StylePresetCardProps {
  preset: StylePreset;
  selected: boolean;
  onSelect: () => void;
}

/**
 * Visual card for selecting illustration style presets.
 * Shows preview, category badge, and tooltip with best practices.
 */
export function StylePresetCard({ preset, selected, onSelect }: StylePresetCardProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Card
            className={cn(
              'cursor-pointer transition-all hover:shadow-md',
              selected && 'ring-2 ring-primary shadow-lg'
            )}
            onClick={onSelect}
          >
            <CardContent className="p-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-foreground truncate">
                    {preset.label}
                  </div>
                  <div className="text-xs text-muted-foreground line-clamp-2">
                    {preset.description}
                  </div>
                </div>
                <Info className="h-3 w-3 text-muted-foreground shrink-0" />
              </div>
              
              <div className="flex items-center gap-1.5 flex-wrap">
                <Badge variant="outline" className="text-[10px] capitalize">
                  {preset.category}
                </Badge>
                {preset.costMultiplier && preset.costMultiplier > 1 && (
                  <Badge variant="secondary" className="text-[10px]">
                    +{((preset.costMultiplier - 1) * 100).toFixed(0)}% cost
                  </Badge>
                )}
                <Badge variant="secondary" className="text-[10px] capitalize">
                  {preset.resolution} res
                </Badge>
              </div>
            </CardContent>
          </Card>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-2 text-xs">
            <div className="font-semibold text-foreground">{preset.label}</div>
            <div className="text-muted-foreground">{preset.description}</div>
            <div>
              <div className="font-medium text-foreground mb-1">Best for:</div>
              <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
                {preset.bestFor.map((use, i) => (
                  <li key={i}>{use}</li>
                ))}
              </ul>
            </div>
            {preset.resolution === 'high' && (
              <div className="text-muted-foreground italic">
                💡 Use 1024×1024 or larger for best results
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

