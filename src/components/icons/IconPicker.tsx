'use client';

/**
 * @module IconPicker
 * @description Icon picker component with search and categorization
 * 
 * Features:
 * - Search functionality
 * - Category tabs
 * - Recommended icons based on use case
 * - Keyboard navigation
 * - Accessibility support
 */

import { useState, useMemo, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import {
  PRESET_ICONS,
  ICON_CATEGORIES,
  searchIcons,
  getIconsByCategory,
  getRecommendedIconsForUseCase,
  type PresetIcon,
  type IconCategory,
} from '@/lib/icons/preset-icons';
import { DynamicIcon } from './DynamicIcon';

// ============================================================================
// Types
// ============================================================================

export interface IconPickerProps {
  /** Currently selected icon ID */
  value?: string | null;
  /** Callback when icon is selected */
  onChange: (iconId: string) => void;
  /** Use case for recommended icons */
  useCase?: 'loom' | 'weave' | 'strand' | 'folder' | 'general';
  /** Disabled state */
  disabled?: boolean;
  /** Additional class names */
  className?: string;
}

export interface InlineIconPickerProps extends IconPickerProps {
  /** Maximum icons to show */
  maxIcons?: number;
}

// ============================================================================
// Components
// ============================================================================

/**
 * Full icon picker with popover, search, and categories
 */
export function IconPicker({
  value,
  onChange,
  useCase = 'general',
  disabled = false,
  className,
}: IconPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<IconCategory | 'all' | 'recommended'>('recommended');

  const recommendedIcons = useMemo(() => {
    return getRecommendedIconsForUseCase(useCase);
  }, [useCase]);

  const filteredIcons = useMemo(() => {
    if (search.trim()) {
      return searchIcons(search);
    }
    if (activeCategory === 'recommended') {
      return recommendedIcons;
    }
    if (activeCategory === 'all') {
      return PRESET_ICONS;
    }
    return getIconsByCategory(activeCategory);
  }, [search, activeCategory, recommendedIcons]);

  const handleSelect = useCallback((iconId: string) => {
    onChange(iconId);
    setOpen(false);
    setSearch('');
  }, [onChange]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn("gap-2", className)}
          disabled={disabled}
        >
          <DynamicIcon iconId={value} size="sm" />
          <span className="text-xs">Change icon</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-3 border-b">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search icons..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-9"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {!search && (
          <Tabs value={activeCategory} onValueChange={(v) => setActiveCategory(v as any)}>
            <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0 h-auto flex-wrap">
              <TabsTrigger value="recommended" className="text-xs px-3 py-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
                Recommended
              </TabsTrigger>
              <TabsTrigger value="all" className="text-xs px-3 py-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
                All
              </TabsTrigger>
              {ICON_CATEGORIES.slice(0, 4).map((cat) => (
                <TabsTrigger key={cat} value={cat} className="text-xs px-3 py-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary capitalize">
                  {cat}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        )}

        <div className="p-3 max-h-64 overflow-y-auto">
          <div className="grid grid-cols-8 gap-1">
            {filteredIcons.map((icon) => (
              <button
                key={icon.id}
                onClick={() => handleSelect(icon.id)}
                className={cn(
                  "p-2 rounded-md hover:bg-muted transition-colors",
                  value === icon.id && "bg-primary/10 ring-1 ring-primary"
                )}
                title={icon.name}
              >
                <icon.icon className="h-4 w-4" />
              </button>
            ))}
          </div>
          {filteredIcons.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-4">
              No icons found
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/**
 * Inline icon picker showing icons directly without popover
 */
export function InlineIconPicker({
  value,
  onChange,
  useCase = 'general',
  maxIcons = 12,
  disabled = false,
  className,
}: InlineIconPickerProps) {
  const recommendedIcons = useMemo(() => {
    return getRecommendedIconsForUseCase(useCase).slice(0, maxIcons);
  }, [useCase, maxIcons]);

  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {recommendedIcons.map((icon) => (
        <button
          key={icon.id}
          onClick={() => onChange(icon.id)}
          disabled={disabled}
          className={cn(
            "p-2 rounded-md hover:bg-muted transition-colors",
            value === icon.id && "bg-primary/10 ring-1 ring-primary",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          title={icon.name}
        >
          <icon.icon className="h-4 w-4" />
        </button>
      ))}
    </div>
  );
}

export default IconPicker;

