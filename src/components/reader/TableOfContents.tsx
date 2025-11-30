/**
 * Table of Contents Component
 *
 * Interactive table of contents for reader view with:
 * - Scroll-tracked active section highlighting
 * - Responsive collapsible design
 * - Smooth scroll navigation
 * - Progress indicator
 * - Keyboard navigation support
 *
 * @module components/reader/TableOfContents
 * @author OpenStrand <team@frame.dev>
 * @since 2.1.0
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useScrollSpy, HeadingElement } from '@/hooks/use-scroll-spy';
import { ChevronRight, ChevronDown, List, X } from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

export interface TableOfContentsProps {
  /**
   * CSS selector for headings to track
   * @default 'h2, h3, h4'
   */
  headingSelector?: string;

  /**
   * Offset from top of viewport for activation
   * @default 100
   */
  offset?: number;

  /**
   * Whether to show the progress bar
   * @default true
   */
  showProgress?: boolean;

  /**
   * Whether to show heading counts
   * @default false
   */
  showCounts?: boolean;

  /**
   * Maximum heading level to show (2-6)
   * @default 4
   */
  maxLevel?: number;

  /**
   * Container element selector for scoped scrolling
   */
  containerSelector?: string;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Whether to start collapsed on mobile
   * @default true
   */
  collapsedByDefault?: boolean;

  /**
   * Title for the component
   * @default 'On This Page'
   */
  title?: string;

  /**
   * Callback when heading is clicked
   */
  onHeadingClick?: (heading: HeadingElement) => void;
}

// ============================================================================
// SUBCOMPONENTS
// ============================================================================

interface TOCItemProps {
  heading: HeadingElement;
  isActive: boolean;
  maxLevel: number;
  onClick: () => void;
}

/**
 * Individual TOC item
 */
function TOCItem({ heading, isActive, maxLevel, onClick }: TOCItemProps) {
  // Calculate indent based on heading level
  // h2 = 0px, h3 = 12px, h4 = 24px, etc.
  const indent = (heading.level - 2) * 12;

  // Skip if beyond max level
  if (heading.level > maxLevel) return null;

  return (
    <li style={{ paddingLeft: `${indent}px` }}>
      <button
        onClick={onClick}
        className={cn(
          'group flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-left text-sm',
          'transition-all duration-200',
          'hover:bg-accent hover:text-accent-foreground',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1',
          isActive
            ? 'bg-primary/10 font-medium text-primary border-l-2 border-primary -ml-[2px] pl-[14px]'
            : 'text-muted-foreground hover:text-foreground'
        )}
        aria-current={isActive ? 'location' : undefined}
      >
        {/* Level indicator dot for h3+ */}
        {heading.level > 2 && (
          <span
            className={cn(
              'h-1.5 w-1.5 rounded-full flex-shrink-0',
              isActive ? 'bg-primary' : 'bg-muted-foreground/40 group-hover:bg-muted-foreground'
            )}
          />
        )}
        <span className="truncate">{heading.text}</span>
      </button>
    </li>
  );
}

/**
 * Progress bar component
 */
function ProgressBar({ progress }: { progress: number }) {
  return (
    <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
      <div
        className="h-full bg-primary transition-all duration-150 ease-out"
        style={{ width: `${progress * 100}%` }}
        role="progressbar"
        aria-valuenow={Math.round(progress * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Reading progress"
      />
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * Table of Contents component with scroll tracking
 *
 * @example
 * ```tsx
 * <TableOfContents
 *   headingSelector="h2, h3"
 *   showProgress
 *   maxLevel={3}
 * />
 * ```
 */
export function TableOfContents({
  headingSelector = 'h2, h3, h4',
  offset = 100,
  showProgress = true,
  showCounts = false,
  maxLevel = 4,
  containerSelector,
  className,
  collapsedByDefault = true,
  title = 'On This Page',
  onHeadingClick,
}: TableOfContentsProps) {
  const [isExpanded, setIsExpanded] = useState(!collapsedByDefault);
  const [isMobile, setIsMobile] = useState(false);

  // Use scroll spy hook
  const { activeId, headings, scrollToHeading, isReady, scrollProgress } = useScrollSpy(
    headingSelector,
    {
      offset,
      containerSelector,
    }
  );

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle heading click
  const handleHeadingClick = useCallback(
    (heading: HeadingElement) => {
      scrollToHeading(heading.id);
      onHeadingClick?.(heading);

      // Collapse on mobile after navigation
      if (isMobile) {
        setIsExpanded(false);
      }
    },
    [scrollToHeading, onHeadingClick, isMobile]
  );

  // Toggle expansion
  const toggleExpanded = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  // Filter headings by max level
  const filteredHeadings = headings.filter((h) => h.level <= maxLevel);

  // Don't render if no headings
  if (!isReady || filteredHeadings.length === 0) {
    return null;
  }

  // Count by level for stats
  const countsByLevel = filteredHeadings.reduce(
    (acc, h) => {
      acc[h.level] = (acc[h.level] || 0) + 1;
      return acc;
    },
    {} as Record<number, number>
  );

  return (
    <nav
      className={cn(
        'relative',
        // Sticky positioning
        'lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)]',
        // Background & border
        'rounded-lg border bg-card',
        // Mobile: full width, Desktop: sidebar width
        'w-full lg:w-64',
        className
      )}
      aria-label="Table of contents"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b">
        <button
          onClick={toggleExpanded}
          className={cn(
            'flex items-center gap-2 text-sm font-semibold',
            'lg:cursor-default',
            'hover:text-primary transition-colors'
          )}
          aria-expanded={isExpanded}
          aria-controls="toc-content"
        >
          <List className="h-4 w-4" />
          <span>{title}</span>
          {showCounts && (
            <span className="text-xs text-muted-foreground">
              ({filteredHeadings.length})
            </span>
          )}
          {/* Mobile expand icon */}
          <span className="lg:hidden ml-auto">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </span>
        </button>

        {/* Mobile close button when expanded */}
        {isMobile && isExpanded && (
          <button
            onClick={() => setIsExpanded(false)}
            className="p-1 hover:bg-accent rounded"
            aria-label="Close table of contents"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Progress bar */}
      {showProgress && <ProgressBar progress={scrollProgress} />}

      {/* Content */}
      <div
        id="toc-content"
        className={cn(
          'overflow-y-auto transition-all duration-300',
          // Mobile: collapse/expand animation
          isMobile && !isExpanded && 'max-h-0 opacity-0 invisible',
          isMobile && isExpanded && 'max-h-[60vh] opacity-100 visible',
          // Desktop: always visible
          'lg:max-h-[calc(100vh-10rem)] lg:opacity-100 lg:visible'
        )}
      >
        <ul className="p-3 space-y-1" role="list">
          {filteredHeadings.map((heading) => (
            <TOCItem
              key={heading.id}
              heading={heading}
              isActive={activeId === heading.id}
              maxLevel={maxLevel}
              onClick={() => handleHeadingClick(heading)}
            />
          ))}
        </ul>
      </div>

      {/* Heading level counts (optional) */}
      {showCounts && isExpanded && Object.keys(countsByLevel).length > 1 && (
        <div className="px-3 py-2 border-t text-xs text-muted-foreground">
          {Object.entries(countsByLevel).map(([level, count]) => (
            <span key={level} className="mr-3">
              H{level}: {count}
            </span>
          ))}
        </div>
      )}
    </nav>
  );
}

// ============================================================================
// FLOATING VARIANT
// ============================================================================

/**
 * Floating TOC that appears as a button and expands into a panel
 */
export function FloatingTableOfContents(props: TableOfContentsProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          'fixed bottom-4 right-4 z-40',
          'flex items-center justify-center',
          'h-12 w-12 rounded-full',
          'bg-primary text-primary-foreground shadow-lg',
          'hover:bg-primary/90 transition-all',
          'lg:hidden', // Only show on mobile
          isOpen && 'scale-0 opacity-0'
        )}
        aria-label="Open table of contents"
      >
        <List className="h-5 w-5" />
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Panel */}
      <div
        className={cn(
          'fixed bottom-0 left-0 right-0 z-50',
          'transform transition-transform duration-300',
          'lg:hidden',
          isOpen ? 'translate-y-0' : 'translate-y-full'
        )}
      >
        <TableOfContents
          {...props}
          collapsedByDefault={false}
          className="rounded-b-none rounded-t-2xl"
        />
      </div>
    </>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default TableOfContents;

