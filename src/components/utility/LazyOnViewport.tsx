'use client';

import React, { useEffect, useRef, useState } from 'react';

type LazyOnViewportProps = {
  children: React.ReactNode;
  rootMargin?: string;
  threshold?: number | number[];
  className?: string;
};

/**
 * Mounts children the first time the wrapper scrolls into view.
 * Reduces initial JS execution and improves TBT on landing pages.
 */
export function LazyOnViewport({
  children,
  rootMargin = '200px',
  threshold = 0,
  className,
}: LazyOnViewportProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isVisible) return;
    const target = ref.current;
    if (!target) return;

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setIsVisible(true);
              observer.disconnect();
            }
          });
        },
        { root: null, rootMargin, threshold },
      );
      observer.observe(target);
      return () => observer.disconnect();
    }

    // Fallback for very old browsers - mount immediately
    setIsVisible(true);
  }, [isVisible, rootMargin, threshold]);

  return <div ref={ref} className={className}>{isVisible ? children : null}</div>;
}


