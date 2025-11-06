'use client';

import { useMemo, useState } from 'react';
import { Filter, Search, ChevronDown } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

/**
 * DashboardToolbar
 *
 * Context-aware, themed toolbar with search and dynamic filters for the dashboard.
 * - Collapsible filter group with tags/difficulty (visualize) or file type (data)
 * - Styled to match shadcn/OpenStrand theme
 */
export interface DashboardToolbarProps {
  context: 'overview' | 'data' | 'visualize';
  searchValue: string;
  onSearchValueChange: (value: string) => void;
  onSubmitSearch: (value: string) => void;

  // Visualize filters
  tags?: string[];
  onTagsChange?: (tags: string[]) => void;
  difficulty?: string;
  onDifficultyChange?: (difficulty: string) => void;

  // Data filters
  fileType?: string;
  onFileTypeChange?: (fileType: string) => void;
}

export function DashboardToolbar({
  context,
  searchValue,
  onSearchValueChange,
  onSubmitSearch,
  tags = [],
  onTagsChange,
  difficulty = '',
  onDifficultyChange,
  fileType = '',
  onFileTypeChange,
}: DashboardToolbarProps) {
  const [expanded, setExpanded] = useState(false);

  const placeholder = useMemo(() => {
    switch (context) {
      case 'data':
        return 'Search datasets, sources, or keywords…';
      case 'visualize':
        return 'Search strands by title, tags, or concepts…';
      default:
        return 'Search workspace…';
    }
  }, [context]);

  const filterSummary = useMemo(() => {
    const chips: string[] = [];
    if (context === 'visualize') {
      if (difficulty) chips.push(`difficulty:${difficulty}`);
      if (tags?.length) chips.push(`${tags.length} tag${tags.length > 1 ? 's' : ''}`);
    }
    if (context === 'data' && fileType) chips.push(`type:${fileType}`);
    return chips.join(' · ');
  }, [context, difficulty, tags, fileType]);

  return (
    <TooltipProvider>
      <div className="mb-4 flex flex-col gap-2 rounded-xl border border-border/70 bg-card/70 p-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex min-w-0 flex-1 items-center">
            <Search className="pointer-events-none absolute left-3 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchValue}
              onChange={(e) => onSearchValueChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onSubmitSearch(searchValue);
              }}
              placeholder={placeholder}
              className="pl-9"
            />
          </div>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" onClick={() => onSubmitSearch(searchValue)}>
                Search
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Press Enter to search</TooltipContent>
          </Tooltip>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1">
                <Filter className="h-4 w-4" />
                Filters
                <ChevronDown className="ml-1 h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              {context === 'visualize' ? (
                <>
                  <DropdownMenuItem asChild>
                    <div className="flex w-full flex-col gap-1 px-1 py-1">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Difficulty</span>
                      <Select value={difficulty} onValueChange={(v) => onDifficultyChange?.(v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Any" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Any</SelectItem>
                          <SelectItem value="beginner">Beginner</SelectItem>
                          <SelectItem value="intermediate">Intermediate</SelectItem>
                          <SelectItem value="advanced">Advanced</SelectItem>
                          <SelectItem value="expert">Expert</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <div className="flex w-full flex-col gap-1 px-1 py-1">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Tags</span>
                      <Input
                        placeholder="Comma-separated"
                        defaultValue={tags?.join(', ')}
                        onBlur={(e) => {
                          const t = e.target.value
                            .split(',')
                            .map((x) => x.trim())
                            .filter(Boolean);
                          onTagsChange?.(t);
                        }}
                      />
                    </div>
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem asChild>
                    <div className="flex w-full flex-col gap-1 px-1 py-1">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">File Type</span>
                      <Select value={fileType} onValueChange={(v) => onFileTypeChange?.(v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Any" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Any</SelectItem>
                          <SelectItem value="csv">CSV</SelectItem>
                          <SelectItem value="json">JSON</SelectItem>
                          <SelectItem value="xlsx">XLSX</SelectItem>
                          <SelectItem value="parquet">Parquet</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Filter chips / summary */}
        <div className={cn('flex flex-wrap items-center gap-2 transition-all', expanded ? 'opacity-100' : 'opacity-100')}>
          {filterSummary ? <Badge variant="secondary">{filterSummary}</Badge> : (
            <span className="text-xs text-muted-foreground">No filters</span>
          )}
          <Button variant="ghost" size="sm" onClick={() => setExpanded((v) => !v)} className="ml-auto">
            {expanded ? 'Hide' : 'Show'} advanced
          </Button>
        </div>

        {expanded && (
          <div className="rounded-lg border border-border/60 bg-background/70 p-3 text-xs text-muted-foreground">
            <p>Advanced options coming soon: size range, date ranges, owners, scopes, and more.</p>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}


