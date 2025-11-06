'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * SkeletonLoader
 * 
 * Provides better loading UX with skeleton screens instead of spinners.
 * Maintains layout stability and gives visual feedback about content structure.
 * 
 * Features:
 * - Multiple preset variants for common UI patterns
 * - Accessible (aria-busy, aria-label)
 * - Dark mode compatible
 * - Smooth animations
 * - Customizable
 * 
 * @example
 * ```tsx
 * // Card skeleton
 * <SkeletonLoader variant="card" count={3} />
 * 
 * // Table skeleton
 * <SkeletonLoader variant="table" rows={5} />
 * 
 * // Custom skeleton
 * <SkeletonLoader>
 *   <Skeleton className="h-8 w-48" />
 *   <Skeleton className="h-4 w-full" />
 * </SkeletonLoader>
 * ```
 */

interface SkeletonLoaderProps {
  /** Preset variant */
  variant?: 'card' | 'list' | 'table' | 'profile' | 'dashboard' | 'custom';
  /** Number of items to show (for card, list variants) */
  count?: number;
  /** Number of rows (for table variant) */
  rows?: number;
  /** Number of columns (for table variant) */
  columns?: number;
  /** Additional CSS classes */
  className?: string;
  /** Custom children (for custom variant) */
  children?: React.ReactNode;
  /** Accessible label */
  'aria-label'?: string;
}

/**
 * Card skeleton - for loading card-based content
 */
function CardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </CardHeader>
      <CardContent className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
      </CardContent>
    </Card>
  );
}

/**
 * List item skeleton - for loading list content
 */
function ListItemSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-start gap-4 p-4 rounded-lg border', className)}>
      <Skeleton className="h-12 w-12 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="h-8 w-20 shrink-0" />
    </div>
  );
}

/**
 * Table skeleton - for loading table content
 */
function TableSkeleton({ 
  rows = 5, 
  columns = 4,
  className 
}: { 
  rows?: number; 
  columns?: number;
  className?: string;
}) {
  return (
    <div className={cn('w-full overflow-hidden rounded-lg border', className)}>
      {/* Header */}
      <div className="flex gap-4 border-b bg-muted/50 p-4">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton 
            key={`header-${i}`} 
            className={cn(
              'h-4',
              i === 0 ? 'w-32' : 'flex-1'
            )}
          />
        ))}
      </div>
      
      {/* Rows */}
      <div className="divide-y">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={`row-${rowIndex}`} className="flex gap-4 p-4">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton 
                key={`cell-${rowIndex}-${colIndex}`}
                className={cn(
                  'h-4',
                  colIndex === 0 ? 'w-32' : 'flex-1'
                )}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Profile skeleton - for loading profile pages
 */
function ProfileSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-start gap-6">
        <Skeleton className="h-24 w-24 rounded-full shrink-0" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-24" />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={`stat-${i}`}>
            <CardContent className="p-6 space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Content sections */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-32" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <ListItemSkeleton key={`content-${i}`} />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Dashboard skeleton - for loading dashboard content
 */
function DashboardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={`stat-${i}`}>
            <CardHeader className="space-y-2 pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={`chart-${i}`}>
            <CardHeader className="space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-3 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

/**
 * Main SkeletonLoader component
 */
export function SkeletonLoader({
  variant = 'card',
  count = 1,
  rows,
  columns,
  className,
  children,
  'aria-label': ariaLabel = 'Loading content',
}: SkeletonLoaderProps) {
  return (
    <div 
      className={cn('animate-pulse', className)}
      role="status"
      aria-busy="true"
      aria-label={ariaLabel}
    >
      {variant === 'custom' && children}
      
      {variant === 'card' && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: count }).map((_, i) => (
            <CardSkeleton key={`card-${i}`} />
          ))}
        </div>
      )}

      {variant === 'list' && (
        <div className="space-y-3">
          {Array.from({ length: count }).map((_, i) => (
            <ListItemSkeleton key={`list-${i}`} />
          ))}
        </div>
      )}

      {variant === 'table' && (
        <TableSkeleton rows={rows} columns={columns} />
      )}

      {variant === 'profile' && <ProfileSkeleton />}

      {variant === 'dashboard' && <DashboardSkeleton />}

      <span className="sr-only">{ariaLabel}</span>
    </div>
  );
}

/**
 * Inline skeleton for custom layouts
 */
export function InlineSkeleton({ 
  className,
  'aria-label': ariaLabel,
}: { 
  className?: string;
  'aria-label'?: string;
}) {
  return (
    <Skeleton 
      className={className}
      role="status"
      aria-label={ariaLabel}
    />
  );
}

