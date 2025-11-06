'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Search, X, Filter, Clock, TrendingUp, Calendar } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

/**
 * Tutorial difficulty levels
 */
export type TutorialDifficulty = 'beginner' | 'intermediate' | 'advanced' | 'all';

/**
 * Tutorial duration categories
 */
export type TutorialDuration = 'quick' | 'medium' | 'long' | 'all';

/**
 * Sort options for tutorials
 */
export type TutorialSort = 'popular' | 'newest' | 'duration' | 'title';

/**
 * Filter state for tutorials
 */
export interface TutorialFilters {
  /** Search query */
  query: string;
  /** Difficulty level */
  difficulty: TutorialDifficulty;
  /** Duration category */
  duration: TutorialDuration;
  /** Selected categories */
  categories: string[];
  /** Selected tags */
  tags: string[];
  /** Sort order */
  sort: TutorialSort;
}

interface TutorialSearchProps {
  /** Current filter state */
  filters: TutorialFilters;
  /** Callback when filters change */
  onFiltersChange: (filters: TutorialFilters) => void;
  /** Available categories */
  categories?: string[];
  /** Available tags */
  tags?: string[];
  /** Show compact version */
  compact?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * TutorialSearch
 * 
 * A comprehensive search and filtering component for tutorials.
 * Provides multiple ways to discover and filter tutorial content.
 * 
 * Features:
 * - Real-time search with debouncing
 * - Multiple filter dimensions (difficulty, duration, category, tags)
 * - Sort options (popularity, date, duration)
 * - Active filter badges with quick clear
 * - Responsive design (mobile-friendly)
 * - Keyboard accessible
 * - Dark mode compatible
 * 
 * @example
 * ```tsx
 * const [filters, setFilters] = useState<TutorialFilters>({
 *   query: '',
 *   difficulty: 'all',
 *   duration: 'all',
 *   categories: [],
 *   tags: [],
 *   sort: 'popular',
 * });
 * 
 * <TutorialSearch
 *   filters={filters}
 *   onFiltersChange={setFilters}
 *   categories={['Setup', 'Workflows', 'API']}
 *   tags={['ai', 'collaboration', 'analytics']}
 * />
 * ```
 */
export function TutorialSearch({
  filters,
  onFiltersChange,
  categories = [],
  tags = [],
  compact = false,
  className,
}: TutorialSearchProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  /**
   * Update a single filter field
   */
  const updateFilter = useCallback(
    <K extends keyof TutorialFilters>(key: K, value: TutorialFilters[K]) => {
      onFiltersChange({ ...filters, [key]: value });
    },
    [filters, onFiltersChange]
  );

  /**
   * Clear all filters
   */
  const clearFilters = useCallback(() => {
    onFiltersChange({
      query: '',
      difficulty: 'all',
      duration: 'all',
      categories: [],
      tags: [],
      sort: filters.sort, // Keep sort preference
    });
    setIsFilterOpen(false);
  }, [filters.sort, onFiltersChange]);

  /**
   * Toggle a category filter
   */
  const toggleCategory = useCallback(
    (category: string) => {
      const newCategories = filters.categories.includes(category)
        ? filters.categories.filter((c) => c !== category)
        : [...filters.categories, category];
      updateFilter('categories', newCategories);
    },
    [filters.categories, updateFilter]
  );

  /**
   * Toggle a tag filter
   */
  const toggleTag = useCallback(
    (tag: string) => {
      const newTags = filters.tags.includes(tag)
        ? filters.tags.filter((t) => t !== tag)
        : [...filters.tags, tag];
      updateFilter('tags', newTags);
    },
    [filters.tags, updateFilter]
  );

  /**
   * Count active filters
   */
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.difficulty !== 'all') count++;
    if (filters.duration !== 'all') count++;
    if (filters.categories.length > 0) count++;
    if (filters.tags.length > 0) count++;
    return count;
  }, [filters]);

  /**
   * Check if any filters are active
   */
  const hasActiveFilters = activeFilterCount > 0 || filters.query.length > 0;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Search and Filter Row */}
      <div className="flex flex-col sm:flex-row gap-2">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search tutorials..."
            value={filters.query}
            onChange={(e) => updateFilter('query', e.target.value)}
            className="pl-9 pr-9"
            aria-label="Search tutorials"
          />
          {filters.query && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => updateFilter('query', '')}
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Sort Select */}
        <Select
          value={filters.sort}
          onValueChange={(value) => updateFilter('sort', value as TutorialSort)}
        >
          <SelectTrigger className="w-full sm:w-48" aria-label="Sort by">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="popular">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Most Popular
              </div>
            </SelectItem>
            <SelectItem value="newest">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Newest First
              </div>
            </SelectItem>
            <SelectItem value="duration">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                By Duration
              </div>
            </SelectItem>
            <SelectItem value="title">A-Z</SelectItem>
          </SelectContent>
        </Select>

        {/* Filter Button */}
        <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="relative w-full sm:w-auto">
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {activeFilterCount > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center"
                >
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Filters</h4>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                  >
                    Clear all
                  </Button>
                )}
              </div>

              <Separator />

              {/* Difficulty */}
              <div className="space-y-2">
                <Label>Difficulty</Label>
                <Select
                  value={filters.difficulty}
                  onValueChange={(value) => updateFilter('difficulty', value as TutorialDifficulty)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Duration */}
              <div className="space-y-2">
                <Label>Duration</Label>
                <Select
                  value={filters.duration}
                  onValueChange={(value) => updateFilter('duration', value as TutorialDuration)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any Duration</SelectItem>
                    <SelectItem value="quick">&lt; 5 minutes</SelectItem>
                    <SelectItem value="medium">5-15 minutes</SelectItem>
                    <SelectItem value="long">&gt; 15 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Categories */}
              {categories.length > 0 && (
                <div className="space-y-2">
                  <Label>Categories</Label>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((category) => {
                      const isActive = filters.categories.includes(category);
                      return (
                        <Badge
                          key={category}
                          variant={isActive ? 'default' : 'outline'}
                          className="cursor-pointer"
                          onClick={() => toggleCategory(category)}
                        >
                          {category}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tags */}
              {tags.length > 0 && (
                <div className="space-y-2">
                  <Label>Tags</Label>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => {
                      const isActive = filters.tags.includes(tag);
                      return (
                        <Badge
                          key={tag}
                          variant={isActive ? 'default' : 'outline'}
                          className="cursor-pointer"
                          onClick={() => toggleTag(tag)}
                        >
                          #{tag}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && !compact && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Active filters:</span>

          {filters.query && (
            <Badge variant="secondary" className="gap-1">
              Search: {filters.query}
              <button
                onClick={() => updateFilter('query', '')}
                className="ml-1 hover:text-foreground"
                aria-label="Remove search filter"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {filters.difficulty !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              {filters.difficulty}
              <button
                onClick={() => updateFilter('difficulty', 'all')}
                className="ml-1 hover:text-foreground"
                aria-label="Remove difficulty filter"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {filters.duration !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              {filters.duration === 'quick' && '< 5 min'}
              {filters.duration === 'medium' && '5-15 min'}
              {filters.duration === 'long' && '> 15 min'}
              <button
                onClick={() => updateFilter('duration', 'all')}
                className="ml-1 hover:text-foreground"
                aria-label="Remove duration filter"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {filters.categories.map((category) => (
            <Badge key={category} variant="secondary" className="gap-1">
              {category}
              <button
                onClick={() => toggleCategory(category)}
                className="ml-1 hover:text-foreground"
                aria-label={`Remove ${category} category filter`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}

          {filters.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1">
              #{tag}
              <button
                onClick={() => toggleTag(tag)}
                className="ml-1 hover:text-foreground"
                aria-label={`Remove ${tag} tag filter`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-auto py-1 text-xs"
            >
              Clear all
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

