'use client';

import { ReactNode, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface LazyChartProps {
  /** Render prop invoked once the container scrolls into view. */
  children: () => ReactNode;
  /** Optional class name passed to the outer div. */
  className?: string;
  /** Reserve height to avoid CLS while the skeleton is visible. */
  minHeight?: number | string;
  /** Custom skeleton / placeholder; defaults to a shadcn Skeleton. */
  fallback?: ReactNode;
}

/**
   * Lightweight IntersectionObserver-based wrapper that defers rendering (and
   * therefore bundle hydration) for heavy chart components until the user has
   * scrolled them into view. Keeps the PKMS dashboard responsive without
   * pulling in additional dependencies.
   */
export function LazyChart({
  children,
  className,
  minHeight = 240,
  fallback,
}: LazyChartProps) {
  const [visible, setVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.2,
      },
    );

    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn('w-full', className)}
      style={{ minHeight }}
      data-lazy-loaded={visible ? 'true' : 'false'}
    >
      {visible ? (
        children()
      ) : (
        fallback ?? (
          <Skeleton className="h-full w-full animate-pulse rounded-md" />
        )
      )}
    </div>
  );
}

