/**
 * Lazy Image Component
 * 
 * Progressive image loading with:
 * - Intersection Observer (loads when in viewport)
 * - Shimmer skeleton placeholder
 * - Blur-up from low-res preview
 * - Error fallback
 * - Retry logic
 * 
 * @example
 * ```tsx
 * <LazyImage
 *   src="/uploads/large-image.jpg"
 *   alt="Flashcard illustration"
 *   width={800}
 *   height={600}
 *   priority={false}
 * />
 * ```
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ImageOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface LazyImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean; // Skip lazy loading
  lowResSrc?: string; // Blur-up preview
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

export function LazyImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  lowResSrc,
  onLoad,
  onError,
}: LazyImageProps) {
  const [isLoading, setIsLoading] = useState(!priority);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const [retryCount, setRetryCount] = useState(0);

  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || isInView) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '200px', // Start loading 200px before entering viewport
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [priority, isInView]);

  // Load image when in view
  useEffect(() => {
    if (!isInView || isLoaded || hasError) return;

    const img = new Image();
    
    img.onload = () => {
      setIsLoaded(true);
      setIsLoading(false);
      setHasError(false);
      onLoad?.();
    };

    img.onerror = (e) => {
      setHasError(true);
      setIsLoading(false);
      onError?.(new Error('Image failed to load'));
    };

    img.src = src;
  }, [isInView, src, isLoaded, hasError, onLoad, onError]);

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1);
    setHasError(false);
    setIsLoaded(false);
    setIsLoading(true);
  };

  return (
    <div
      ref={containerRef}
      className={cn('relative overflow-hidden rounded-lg bg-muted', className)}
      style={{ width, height, aspectRatio: width && height ? `${width}/${height}` : undefined }}
    >
      {/* Low-res blur-up preview */}
      {lowResSrc && !isLoaded && !hasError && (
        <img
          src={lowResSrc}
          alt={alt}
          className="absolute inset-0 w-full h-full object-cover blur-lg scale-110 opacity-50"
        />
      )}

      {/* Shimmer skeleton */}
      {isLoading && !isLoaded && (
        <div className="absolute inset-0 bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-shimmer" />
      )}

      {/* Loading spinner */}
      {isLoading && isInView && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Actual image */}
      {isInView && !hasError && (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          className={cn(
            'w-full h-full object-cover transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0'
          )}
          loading={priority ? 'eager' : 'lazy'}
        />
      )}

      {/* Error fallback */}
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-muted">
          <ImageOff className="h-12 w-12 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Failed to load image</p>
          {retryCount < 3 && (
            <Button variant="outline" size="sm" onClick={handleRetry}>
              Retry ({retryCount}/3)
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Add shimmer animation to global CSS
 */
export const shimmerAnimation = `
  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
  
  .animate-shimmer {
    animation: shimmer 2s ease-in-out infinite;
  }
`;

