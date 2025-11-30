/**
 * Strand Breadcrumb Component
 *
 * Navigation breadcrumb for strand hierarchy showing:
 * - Path from root to current strand
 * - Dropdown menus for siblings at each level
 * - Quick navigation to any ancestor
 *
 * @module components/strand-explorer/StrandBreadcrumb
 * @author OpenStrand <team@frame.dev>
 * @since 2.1.0
 */

'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import {
  ChevronRight,
  Home,
  Folder,
  FileText,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

// ============================================================================
// TYPES
// ============================================================================

export interface BreadcrumbItem {
  id: string;
  title: string;
  slug: string;
  isCollection?: boolean;
}

export interface StrandBreadcrumbProps {
  /**
   * Array of path elements from root to current
   */
  path: BreadcrumbItem[];
  /**
   * Siblings at each level for dropdown navigation
   */
  siblings?: Map<string, BreadcrumbItem[]>;
  /**
   * Called when an item is clicked
   */
  onNavigate?: (item: BreadcrumbItem | null) => void;
  /**
   * Base URL path for link generation
   */
  basePath?: string;
  /**
   * Use links instead of buttons
   */
  useLinks?: boolean;
  /**
   * Show home/root link
   */
  showRoot?: boolean;
  /**
   * Maximum items to show before collapsing
   */
  maxItems?: number;
  /**
   * Additional class name
   */
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Breadcrumb navigation for strand hierarchy
 *
 * @example
 * ```tsx
 * <StrandBreadcrumb
 *   path={[
 *     { id: '1', title: 'Courses', slug: 'courses' },
 *     { id: '2', title: 'Physics', slug: 'physics' },
 *     { id: '3', title: 'Quantum', slug: 'quantum' },
 *   ]}
 *   onNavigate={(item) => item ? router.push(`/strand/${item.slug}`) : router.push('/')}
 *   showRoot
 *   maxItems={4}
 * />
 * ```
 */
export function StrandBreadcrumb({
  path,
  siblings,
  onNavigate,
  basePath = '/strand',
  useLinks = false,
  showRoot = true,
  maxItems = 4,
  className,
}: StrandBreadcrumbProps) {
  // Calculate visible items with collapse
  const { visibleItems, collapsedItems } = useMemo(() => {
    if (path.length <= maxItems) {
      return { visibleItems: path, collapsedItems: [] };
    }

    // Show first item, ellipsis, and last (maxItems - 2) items
    const first = path.slice(0, 1);
    const last = path.slice(-(maxItems - 2));
    const collapsed = path.slice(1, -(maxItems - 2));

    return {
      visibleItems: [...first, ...last],
      collapsedItems: collapsed,
    };
  }, [path, maxItems]);

  const renderItem = (item: BreadcrumbItem, isLast: boolean, index: number) => {
    const itemSiblings = siblings?.get(item.id) ?? [];
    const hasSiblings = itemSiblings.length > 0;

    const content = (
      <span className="flex items-center gap-1">
        {item.isCollection ? (
          <Folder className="h-3.5 w-3.5 text-amber-500" />
        ) : (
          <FileText className="h-3.5 w-3.5 text-muted-foreground" />
        )}
        <span className={cn('truncate max-w-32', isLast && 'font-medium')}>
          {item.title}
        </span>
      </span>
    );

    if (hasSiblings) {
      return (
        <DropdownMenu key={item.id}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'h-auto py-1 px-2 gap-1',
                isLast ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {content}
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="max-h-64 overflow-auto">
            {/* Current item */}
            <DropdownMenuItem
              onClick={() => onNavigate?.(item)}
              className="font-medium"
            >
              {item.isCollection ? (
                <Folder className="h-4 w-4 mr-2 text-amber-500" />
              ) : (
                <FileText className="h-4 w-4 mr-2" />
              )}
              {item.title} (current)
            </DropdownMenuItem>

            {/* Siblings */}
            {itemSiblings.map((sibling) => (
              <DropdownMenuItem
                key={sibling.id}
                onClick={() => onNavigate?.(sibling)}
              >
                {sibling.isCollection ? (
                  <Folder className="h-4 w-4 mr-2 text-amber-500" />
                ) : (
                  <FileText className="h-4 w-4 mr-2" />
                )}
                {sibling.title}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }

    if (useLinks && !isLast) {
      return (
        <Link
          key={item.id}
          href={`${basePath}/${item.slug}`}
          className={cn(
            'flex items-center gap-1 px-2 py-1 rounded hover:bg-accent transition-colors',
            'text-muted-foreground hover:text-foreground'
          )}
        >
          {content}
        </Link>
      );
    }

    return (
      <Button
        key={item.id}
        variant="ghost"
        size="sm"
        onClick={() => !isLast && onNavigate?.(item)}
        className={cn(
          'h-auto py-1 px-2',
          isLast
            ? 'text-foreground cursor-default hover:bg-transparent'
            : 'text-muted-foreground hover:text-foreground'
        )}
        disabled={isLast}
      >
        {content}
      </Button>
    );
  };

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('flex items-center gap-1 text-sm overflow-hidden', className)}
    >
      {/* Root link */}
      {showRoot && (
        <>
          {useLinks ? (
            <Link
              href={basePath}
              className="flex items-center p-1 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
              aria-label="Go to root"
            >
              <Home className="h-4 w-4" />
            </Link>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground"
              onClick={() => onNavigate?.(null)}
              aria-label="Go to root"
            >
              <Home className="h-4 w-4" />
            </Button>
          )}

          {path.length > 0 && (
            <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          )}
        </>
      )}

      {/* First visible item */}
      {visibleItems.length > 0 && (
        <>
          {renderItem(visibleItems[0], visibleItems.length === 1, 0)}

          {/* Collapsed items dropdown */}
          {collapsedItems.length > 0 && (
            <>
              <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto py-1 px-2 text-muted-foreground"
                  >
                    ...
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {collapsedItems.map((item) => (
                    <DropdownMenuItem
                      key={item.id}
                      onClick={() => onNavigate?.(item)}
                    >
                      {item.isCollection ? (
                        <Folder className="h-4 w-4 mr-2 text-amber-500" />
                      ) : (
                        <FileText className="h-4 w-4 mr-2" />
                      )}
                      {item.title}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}

          {/* Remaining visible items */}
          {visibleItems.slice(1).map((item, index) => (
            <React.Fragment key={item.id}>
              <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              {renderItem(item, index === visibleItems.length - 2, index + 1)}
            </React.Fragment>
          ))}
        </>
      )}
    </nav>
  );
}

// ============================================================================
// COMPACT BREADCRUMB
// ============================================================================

interface CompactBreadcrumbProps {
  path: BreadcrumbItem[];
  onNavigate?: (item: BreadcrumbItem | null) => void;
  className?: string;
}

/**
 * Compact breadcrumb showing only current and parent
 */
export function CompactBreadcrumb({
  path,
  onNavigate,
  className,
}: CompactBreadcrumbProps) {
  if (path.length === 0) return null;

  const current = path[path.length - 1];
  const parent = path.length > 1 ? path[path.length - 2] : null;

  return (
    <nav className={cn('flex items-center gap-1 text-sm', className)}>
      {parent && (
        <>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate?.(parent)}
            className="h-auto py-0.5 px-1.5 text-xs text-muted-foreground"
          >
            {parent.title}
          </Button>
          <ChevronRight className="h-3 w-3 text-muted-foreground" />
        </>
      )}
      <span className="text-xs font-medium truncate max-w-32">{current.title}</span>
    </nav>
  );
}

export default StrandBreadcrumb;

