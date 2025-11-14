'use client';

/**
 * Mobile Enhancement Components
 * Pull-to-refresh, swipe gestures, and mobile-specific interactions
 */

import { useState, useRef, useEffect, useCallback, type TouchEvent, type ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

/* ==========================================
   PULL TO REFRESH
   ========================================== */

export interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  /** Minimum pull distance to trigger refresh (px) */
  threshold?: number;
  /** Maximum pull distance (px) */
  maxPull?: number;
  /** Custom refresh indicator */
  refreshIndicator?: ReactNode;
  /** Additional CSS classes */
  className?: string;
}

export function PullToRefresh({
  onRefresh,
  children,
  threshold = 80,
  maxPull = 120,
  refreshIndicator,
  className,
}: PullToRefreshProps) {
  const [pulling, setPulling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: TouchEvent<HTMLDivElement>) => {
    // Only enable pull-to-refresh when scrolled to top
    if (window.scrollY === 0) {
      startY.current = e.touches[0].clientY;
    }
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent<HTMLDivElement>) => {
    if (!startY.current || refreshing) return;

    const currentY = e.touches[0].clientY;
    const distance = currentY - startY.current;

    // Only pull down
    if (distance > 0 && window.scrollY === 0) {
      setPulling(true);
      setPullDistance(Math.min(distance, maxPull));
      
      // Prevent default scroll behavior
      if (distance > 20) {
        e.preventDefault();
      }
    }
  }, [maxPull, refreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (pullDistance >= threshold && !refreshing) {
      setRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
      }
    }
    
    setPulling(false);
    setPullDistance(0);
    startY.current = 0;
  }, [pullDistance, threshold, onRefresh, refreshing]);

  const pullProgress = Math.min((pullDistance / threshold) * 100, 100);
  const shouldRefresh = pullDistance >= threshold;

  return (
    <div
      ref={containerRef}
      className={cn('relative', className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Refresh Indicator */}
      {(pulling || refreshing) && (
        <div
          className="absolute top-0 left-0 right-0 flex items-center justify-center transition-all duration-200 ease-out overflow-hidden"
          style={{
            height: `${refreshing ? 60 : pullDistance}px`,
            opacity: refreshing ? 1 : Math.min(pullProgress / 100, 1),
          }}
        >
          <div className="flex flex-col items-center gap-2">
            {refreshIndicator || (
              <>
                <RefreshCw
                  className={cn(
                    'h-6 w-6 text-primary transition-transform duration-200',
                    refreshing && 'animate-spin',
                    !refreshing && shouldRefresh && 'rotate-180'
                  )}
                  style={{
                    transform: !refreshing && !shouldRefresh 
                      ? `rotate(${pullProgress * 3.6}deg)` 
                      : undefined,
                  }}
                />
                <span className="text-xs text-muted-foreground">
                  {refreshing
                    ? 'Refreshing...'
                    : shouldRefresh
                    ? 'Release to refresh'
                    : 'Pull to refresh'}
                </span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div
        className="transition-transform duration-200 ease-out"
        style={{
          transform: `translateY(${refreshing ? 60 : pullDistance}px)`,
        }}
      >
        {children}
      </div>
    </div>
  );
}

/* ==========================================
   SWIPE GESTURES HOOK
   ========================================== */

export interface UseSwipeOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  minSwipeDistance?: number;
  preventDefaultTouchMove?: boolean;
}

export function useSwipe({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  minSwipeDistance = 50,
  preventDefaultTouchMove = false,
}: UseSwipeOptions) {
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);

  const onTouchStart = useCallback((e: TouchEvent) => {
    setTouchEnd(null);
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    });
  }, []);

  const onTouchMove = useCallback(
    (e: TouchEvent) => {
      setTouchEnd({
        x: e.targetTouches[0].clientX,
        y: e.targetTouches[0].clientY,
      });
      
      if (preventDefaultTouchMove) {
        e.preventDefault();
      }
    },
    [preventDefaultTouchMove]
  );

  const onTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd) return;

    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = touchStart.y - touchEnd.y;
    const isHorizontalSwipe = Math.abs(distanceX) > Math.abs(distanceY);

    if (isHorizontalSwipe) {
      // Horizontal swipes
      if (distanceX > minSwipeDistance && onSwipeLeft) {
        onSwipeLeft();
      }
      if (distanceX < -minSwipeDistance && onSwipeRight) {
        onSwipeRight();
      }
    } else {
      // Vertical swipes
      if (distanceY > minSwipeDistance && onSwipeUp) {
        onSwipeUp();
      }
      if (distanceY < -minSwipeDistance && onSwipeDown) {
        onSwipeDown();
      }
    }

    setTouchStart(null);
    setTouchEnd(null);
  }, [touchStart, touchEnd, minSwipeDistance, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown]);

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  };
}

/* ==========================================
   SWIPEABLE CARD COMPONENT
   ========================================== */

export interface SwipeableCardProps {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  children: ReactNode;
  className?: string;
  /** Show swipe actions */
  showActions?: boolean;
  /** Left action button */
  leftAction?: {
    icon: ReactNode;
    label: string;
    color: string;
  };
  /** Right action button */
  rightAction?: {
    icon: ReactNode;
    label: string;
    color: string;
  };
}

export function SwipeableCard({
  onSwipeLeft,
  onSwipeRight,
  children,
  className,
  showActions = true,
  leftAction,
  rightAction,
}: SwipeableCardProps) {
  const [swipeDistance, setSwipeDistance] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const startX = useRef(0);
  const currentX = useRef(0);

  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    startX.current = e.touches[0].clientX;
    setIsSwiping(true);
  };

  const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    if (!isSwiping) return;
    currentX.current = e.touches[0].clientX;
    const distance = currentX.current - startX.current;
    setSwipeDistance(distance);
  };

  const handleTouchEnd = () => {
    const threshold = 100;
    
    if (swipeDistance > threshold && onSwipeRight) {
      onSwipeRight();
    } else if (swipeDistance < -threshold && onSwipeLeft) {
      onSwipeLeft();
    }
    
    setSwipeDistance(0);
    setIsSwiping(false);
  };

  const showLeftAction = swipeDistance > 50 && leftAction && showActions;
  const showRightAction = swipeDistance < -50 && rightAction && showActions;

  return (
    <div className="relative overflow-hidden">
      {/* Left action background */}
      {showLeftAction && (
        <div
          className="absolute inset-y-0 left-0 flex items-center px-4"
          style={{
            backgroundColor: leftAction.color,
            width: Math.min(swipeDistance, 100),
          }}
        >
          <div className="flex flex-col items-center gap-1 text-white">
            {leftAction.icon}
            <span className="text-xs font-medium">{leftAction.label}</span>
          </div>
        </div>
      )}

      {/* Right action background */}
      {showRightAction && (
        <div
          className="absolute inset-y-0 right-0 flex items-center justify-end px-4"
          style={{
            backgroundColor: rightAction.color,
            width: Math.min(Math.abs(swipeDistance), 100),
          }}
        >
          <div className="flex flex-col items-center gap-1 text-white">
            {rightAction.icon}
            <span className="text-xs font-medium">{rightAction.label}</span>
          </div>
        </div>
      )}

      {/* Card content */}
      <div
        className={cn('bg-card transition-transform', className)}
        style={{
          transform: `translateX(${swipeDistance}px)`,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  );
}

/* ==========================================
   BOTTOM SHEET COMPONENT
   ========================================== */

export interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Snap points (0-1, percentage of viewport height) */
  snapPoints?: number[];
  /** Initial snap point index */
  initialSnapPoint?: number;
  /** Show drag handle */
  showDragHandle?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export function BottomSheet({
  isOpen,
  onClose,
  children,
  snapPoints = [0.5, 0.9],
  initialSnapPoint = 0,
  showDragHandle = true,
  className,
}: BottomSheetProps) {
  const [snapIndex, setSnapIndex] = useState(initialSnapPoint);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [currentHeight, setCurrentHeight] = useState(snapPoints[initialSnapPoint]);

  useEffect(() => {
    if (isOpen) {
      setCurrentHeight(snapPoints[snapIndex]);
    }
  }, [isOpen, snapIndex, snapPoints]);

  const handleDragStart = (e: TouchEvent<HTMLDivElement>) => {
    setIsDragging(true);
    setDragStartY(e.touches[0].clientY);
  };

  const handleDragMove = (e: TouchEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    
    const currentY = e.touches[0].clientY;
    const deltaY = dragStartY - currentY;
    const deltaPercent = deltaY / window.innerHeight;
    const newHeight = Math.max(0, Math.min(1, currentHeight + deltaPercent));
    
    setCurrentHeight(newHeight);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    
    // Snap to nearest snap point
    const closestSnapIndex = snapPoints.reduce((prev, curr, index) => {
      return Math.abs(curr - currentHeight) < Math.abs(snapPoints[prev] - currentHeight)
        ? index
        : prev;
    }, 0);
    
    // Close if dragged below minimum
    if (currentHeight < 0.2) {
      onClose();
    } else {
      setSnapIndex(closestSnapIndex);
      setCurrentHeight(snapPoints[closestSnapIndex]);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-40 md:hidden"
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <div
        className={cn(
          'fixed bottom-0 left-0 right-0 z-50',
          'bg-background rounded-t-2xl shadow-2xl',
          'transition-all duration-300 ease-out md:hidden',
          className
        )}
        style={{
          height: `${currentHeight * 100}vh`,
          transform: isDragging ? 'none' : undefined,
        }}
      >
        {/* Drag Handle */}
        {showDragHandle && (
          <div
            className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing"
            onTouchStart={handleDragStart}
            onTouchMove={handleDragMove}
            onTouchEnd={handleDragEnd}
          >
            <div className="w-12 h-1 bg-muted-foreground/30 rounded-full" />
          </div>
        )}

        {/* Content */}
        <div className="overflow-y-auto h-full pb-safe">
          {children}
        </div>
      </div>
    </>
  );
}

