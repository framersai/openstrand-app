'use client';

/**
 * IconPicker Component
 * 
 * A searchable, categorized icon picker for selecting preset icons.
 * Fully accessible with keyboard navigation and screen reader support.
 * 
 * @module components/icons/IconPicker
 */

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Search, X, Check } from 'lucide-react';
import {
  PRESET_ICONS,
  ICON_CATEGORIES,
  getIconsByCategory,
  searchIcons,
  getRecommendedIconsForUseCase,
  getPresetIcon,
  type PresetIcon,
  type IconCategory,
} from '@/lib/icons/preset-icons';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DynamicIcon } from './DynamicIcon';

export interface IconPickerProps {
  /** Currently selected icon ID */
  value?: string | null;
  /** Callback when icon is selected */
  onChange?: (iconId: string) => void;
  /** Optional use case for recommended icons */
  useCase?: 'storytelling' | 'worldbuilding' | 'research' | 'notebook' | 'documentation' | 'education' | 'custom';
  /** Placeholder text when no icon selected */
  placeholder?: string;
  /** Whether the picker is disabled */
  disabled?: boolean;
  /** Additional class names */
  className?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Icon picker with search and category navigation
 * 
 * @example
 * ```tsx
 * const [icon, setIcon] = useState<string>('folder');
 * 
 * <IconPicker
 *   value={icon}
 *   onChange={setIcon}
 *   useCase="research"
 *   placeholder="Choose an icon"
 * />
 * ```
 */
export function IconPicker({
  value,
  onChange,
  useCase,
  placeholder = 'Select icon',
  disabled = false,
  className,
  size = 'md',
}: IconPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<IconCategory | 'all' | 'recommended'>('all');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus search input when popover opens
  useEffect(() => {
    if (open && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [open]);

  // Get the current icon
  const currentIcon = useMemo(() => {
    return value ? getPresetIcon(value) : undefined;
  }, [value]);

  // Get recommended icons if use case is provided
  const recommendedIcons = useMemo(() => {
    if (!useCase) return [];
    return getRecommendedIconsForUseCase(useCase);
  }, [useCase]);

  // Filter icons based on search and category
  const filteredIcons = useMemo(() => {
    if (search) {
      return searchIcons(search);
    }
    
    if (activeCategory === 'all') {
      return PRESET_ICONS;
    }
    
    if (activeCategory === 'recommended') {
      return recommendedIcons;
    }
    
    return getIconsByCategory(activeCategory);
  }, [search, activeCategory, recommendedIcons]);

  const handleSelect = useCallback((iconId: string) => {
    onChange?.(iconId);
    setOpen(false);
    setSearch('');
  }, [onChange]);

  const handleClear = useCallback(() => {
    onChange?.('');
    setOpen(false);
  }, [onChange]);

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
  };

  const iconSizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label={currentIcon ? `Selected icon: ${currentIcon.name}` : placeholder}
          disabled={disabled}
          className={cn(
            'justify-center p-0',
            sizeClasses[size],
            className
          )}
        >
          {currentIcon ? (
            <DynamicIcon
              iconId={currentIcon.id}
              className={iconSizeClasses[size]}
              decorative
            />
          ) : (
            <span className="text-muted-foreground text-xs">+</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[340px] p-0" 
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="flex flex-col">
          {/* Search Header */}
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                placeholder="Search icons..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-8"
                aria-label="Search icons"
              />
              {search && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1 h-6 w-6 p-0"
                  onClick={() => setSearch('')}
                  aria-label="Clear search"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>

          {/* Category Tabs */}
          {!search && (
            <Tabs
              value={activeCategory}
              onValueChange={(v) => setActiveCategory(v as IconCategory | 'all' | 'recommended')}
              className="w-full"
            >
              <div className="border-b px-3">
                <TabsList className="h-9 w-full justify-start gap-1 bg-transparent p-0">
                  <TabsTrigger
                    value="all"
                    className="h-7 px-2 text-xs data-[state=active]:bg-muted"
                  >
                    All
                  </TabsTrigger>
                  {useCase && recommendedIcons.length > 0 && (
                    <TabsTrigger
                      value="recommended"
                      className="h-7 px-2 text-xs data-[state=active]:bg-muted"
                    >
                      Recommended
                    </TabsTrigger>
                  )}
                  {ICON_CATEGORIES.slice(0, 5).map((cat) => (
                    <TabsTrigger
                      key={cat.id}
                      value={cat.id}
                      className="h-7 px-2 text-xs data-[state=active]:bg-muted"
                    >
                      {cat.name.split(' ')[0]}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
            </Tabs>
          )}

          {/* Icon Grid */}
          <ScrollArea className="h-[280px]">
            <div className="p-3">
              {filteredIcons.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No icons found
                </div>
              ) : (
                <div className="grid grid-cols-8 gap-1">
                  {filteredIcons.map((icon) => (
                    <IconButton
                      key={icon.id}
                      icon={icon}
                      isSelected={value === icon.id}
                      onSelect={handleSelect}
                    />
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Footer */}
          {currentIcon && (
            <div className="border-t p-2 flex items-center justify-between">
              <span className="text-xs text-muted-foreground pl-2">
                Selected: {currentIcon.name}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="h-7 text-xs"
              >
                Clear
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/**
 * Individual icon button in the grid
 */
interface IconButtonProps {
  icon: PresetIcon;
  isSelected: boolean;
  onSelect: (iconId: string) => void;
}

function IconButton({ icon, isSelected, onSelect }: IconButtonProps) {
  const IconComponent = icon.icon;
  
  return (
    <button
      type="button"
      onClick={() => onSelect(icon.id)}
      className={cn(
        'relative flex items-center justify-center h-8 w-8 rounded-md transition-colors',
        'hover:bg-accent hover:text-accent-foreground',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        isSelected && 'bg-primary text-primary-foreground'
      )}
      title={icon.name}
      aria-label={icon.ariaLabel}
      aria-pressed={isSelected}
    >
      <IconComponent className="h-4 w-4" aria-hidden="true" />
      {isSelected && (
        <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-primary border-2 border-background">
          <Check className="h-1.5 w-1.5 text-primary-foreground absolute top-0 left-0" />
        </span>
      )}
    </button>
  );
}

/**
 * Inline icon picker for use in forms
 */
export interface InlineIconPickerProps extends Omit<IconPickerProps, 'size'> {
  /** Label for the picker */
  label?: string;
}

export function InlineIconPicker({
  label = 'Icon',
  ...props
}: InlineIconPickerProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium">{label}</span>
      <IconPicker {...props} size="md" />
      {props.value && (
        <span className="text-sm text-muted-foreground">
          {getPresetIcon(props.value)?.name}
        </span>
      )}
    </div>
  );
}

export default IconPicker;

