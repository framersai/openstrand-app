/**
 * Scroll Spy Hook
 *
 * Tracks scroll position and determines which heading/section is currently
 * active in the viewport. Used for table of contents highlighting and
 * reader view navigation.
 *
 * Features:
 * - IntersectionObserver-based tracking (performant)
 * - Handles responsive layouts
 * - Smooth scroll to heading
 * - Debounced updates
 * - SSR-safe
 *
 * @module hooks/use-scroll-spy
 * @author OpenStrand <team@frame.dev>
 * @since 2.1.0
 */

'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Heading element with metadata
 */
export interface HeadingElement {
  /** Heading ID (for linking) */
  id: string;
  /** Heading text content */
  text: string;
  /** Heading level (1-6) */
  level: number;
  /** DOM element reference */
  element: HTMLElement;
  /** Offset from top of document */
  offsetTop: number;
}

/**
 * Options for useScrollSpy hook
 */
export interface UseScrollSpyOptions {
  /**
   * Offset from top of viewport for activation
   * @default 100
   */
  offset?: number;

  /**
   * Root margin for IntersectionObserver
   * @default '-20% 0px -80% 0px'
   */
  rootMargin?: string;

  /**
   * Threshold values for IntersectionObserver
   * @default [0, 0.25, 0.5, 0.75, 1]
   */
  threshold?: number[];

  /**
   * Whether to automatically generate IDs for headings without them
   * @default true
   */
  autoGenerateIds?: boolean;

  /**
   * Debounce delay in ms
   * @default 10
   */
  debounceDelay?: number;

  /**
   * Container element selector (default is window)
   */
  containerSelector?: string;
}

/**
 * Return value from useScrollSpy hook
 */
export interface UseScrollSpyReturn {
  /** Currently active heading ID */
  activeId: string | null;
  /** All detected headings */
  headings: HeadingElement[];
  /** Scroll to a specific heading */
  scrollToHeading: (id: string) => void;
  /** Whether the hook is initialized */
  isReady: boolean;
  /** Current scroll progress (0-1) */
  scrollProgress: number;
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Debounce function
 */
function debounce<T extends (...args: unknown[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Generate a slug from text
 */
function generateSlug(text: string, index: number): string {
  const slug = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  return slug || `heading-${index}`;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook for tracking scroll position and active heading
 *
 * @param headingSelector - CSS selector for headings to track
 * @param options - Configuration options
 * @returns Scroll spy state and utilities
 *
 * @example
 * ```tsx
 * const { activeId, headings, scrollToHeading } = useScrollSpy(
 *   'h1, h2, h3',
 *   { offset: 80 }
 * );
 *
 * return (
 *   <nav>
 *     {headings.map(h => (
 *       <button
 *         key={h.id}
 *         onClick={() => scrollToHeading(h.id)}
 *         className={activeId === h.id ? 'active' : ''}
 *       >
 *         {h.text}
 *       </button>
 *     ))}
 *   </nav>
 * );
 * ```
 */
export function useScrollSpy(
  headingSelector: string = 'h1, h2, h3, h4, h5, h6',
  options: UseScrollSpyOptions = {}
): UseScrollSpyReturn {
  const {
    offset = 100,
    rootMargin = '-20% 0px -80% 0px',
    threshold = [0, 0.25, 0.5, 0.75, 1],
    autoGenerateIds = true,
    debounceDelay = 10,
    containerSelector,
  } = options;

  const [activeId, setActiveId] = useState<string | null>(null);
  const [headings, setHeadings] = useState<HeadingElement[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const visibleHeadingsRef = useRef<Map<string, number>>(new Map());

  // Collect headings on mount and when selector changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const collectHeadings = () => {
      const container = containerSelector
        ? document.querySelector(containerSelector)
        : document;

      if (!container) return;

      const elements = container.querySelectorAll(headingSelector);
      const headingList: HeadingElement[] = [];

      elements.forEach((el, index) => {
        const htmlEl = el as HTMLElement;

        // Skip hidden elements
        if (htmlEl.offsetParent === null) return;

        // Generate ID if needed
        if (!htmlEl.id && autoGenerateIds) {
          htmlEl.id = generateSlug(htmlEl.textContent ?? '', index);
        }

        if (!htmlEl.id) return;

        headingList.push({
          id: htmlEl.id,
          text: htmlEl.textContent?.trim() ?? '',
          level: parseInt(htmlEl.tagName.charAt(1), 10),
          element: htmlEl,
          offsetTop: htmlEl.offsetTop,
        });
      });

      setHeadings(headingList);
      setIsReady(true);

      // Set initial active heading
      if (headingList.length > 0) {
        const scrollTop = window.scrollY;
        for (let i = headingList.length - 1; i >= 0; i--) {
          if (headingList[i].offsetTop <= scrollTop + offset) {
            setActiveId(headingList[i].id);
            break;
          }
        }

        if (!activeId && headingList.length > 0) {
          setActiveId(headingList[0].id);
        }
      }
    };

    // Initial collection
    collectHeadings();

    // Re-collect on resize (offsets may change)
    const handleResize = debounce(collectHeadings, 250);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [headingSelector, containerSelector, autoGenerateIds, offset, activeId]);

  // Set up IntersectionObserver
  useEffect(() => {
    if (typeof window === 'undefined' || headings.length === 0) return;

    // Clean up previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    visibleHeadingsRef.current.clear();

    // Create new observer
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            visibleHeadingsRef.current.set(entry.target.id, entry.intersectionRatio);
          } else {
            visibleHeadingsRef.current.delete(entry.target.id);
          }
        });

        // Determine best active heading
        updateActiveHeading();
      },
      {
        rootMargin,
        threshold,
      }
    );

    // Observe all headings
    headings.forEach((heading) => {
      observerRef.current?.observe(heading.element);
    });

    return () => {
      observerRef.current?.disconnect();
    };
  }, [headings, rootMargin, threshold]);

  // Update active heading based on visibility and scroll position
  const updateActiveHeading = useCallback(
    debounce(() => {
      if (headings.length === 0) return;

      let bestId: string | null = null;
      let bestScore = -Infinity;

      // Find visible heading closest to the offset line
      for (const heading of headings) {
        const ratio = visibleHeadingsRef.current.get(heading.id) || 0;
        const rect = heading.element.getBoundingClientRect();
        const distanceFromOffset = Math.abs(rect.top - offset);

        // Score: prioritize visibility and proximity to offset
        // Headings near the offset line get higher scores
        const score = ratio > 0 ? 1000 * ratio - distanceFromOffset : -distanceFromOffset;

        if (score > bestScore) {
          bestScore = score;
          bestId = heading.id;
        }
      }

      // Fallback: if no heading is visible, find the one just above viewport
      if (!bestId || visibleHeadingsRef.current.size === 0) {
        const scrollTop = window.scrollY;

        for (let i = headings.length - 1; i >= 0; i--) {
          const rect = headings[i].element.getBoundingClientRect();
          if (rect.top < offset) {
            bestId = headings[i].id;
            break;
          }
        }

        // Default to first heading if nothing found
        if (!bestId && headings.length > 0) {
          bestId = headings[0].id;
        }
      }

      if (bestId !== null) {
        setActiveId(bestId);
      }
    }, debounceDelay),
    [headings, offset, debounceDelay]
  );

  // Track scroll progress
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateProgress = () => {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? Math.min(1, Math.max(0, window.scrollY / docHeight)) : 0;
      setScrollProgress(progress);
    };

    const debouncedUpdate = debounce(updateProgress, 50);

    window.addEventListener('scroll', debouncedUpdate, { passive: true });
    updateProgress(); // Initial value

    return () => {
      window.removeEventListener('scroll', debouncedUpdate);
    };
  }, []);

  // Scroll to heading function
  const scrollToHeading = useCallback(
    (id: string) => {
      const heading = headings.find((h) => h.id === id);
      if (!heading) return;

      const targetY = heading.element.getBoundingClientRect().top + window.scrollY - offset;

      window.scrollTo({
        top: targetY,
        behavior: 'smooth',
      });

      // Update URL hash without jumping
      if (typeof window !== 'undefined' && window.history.pushState) {
        window.history.pushState(null, '', `#${id}`);
      }
    },
    [headings, offset]
  );

  return {
    activeId,
    headings,
    scrollToHeading,
    isReady,
    scrollProgress,
  };
}

// ============================================================================
// CONVENIENCE HOOKS
// ============================================================================

/**
 * Simplified hook that only returns active heading ID
 */
export function useActiveHeading(
  headingSelector: string = 'h2, h3',
  offset: number = 100
): string | null {
  const { activeId } = useScrollSpy(headingSelector, { offset });
  return activeId;
}

/**
 * Hook for scroll progress indicator
 */
export function useScrollProgress(): number {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateProgress = () => {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const newProgress = docHeight > 0 ? Math.min(1, Math.max(0, window.scrollY / docHeight)) : 0;
      setProgress(newProgress);
    };

    window.addEventListener('scroll', updateProgress, { passive: true });
    updateProgress();

    return () => {
      window.removeEventListener('scroll', updateProgress);
    };
  }, []);

  return progress;
}

export default useScrollSpy;

