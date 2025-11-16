/**
 * useCardGestures Hook
 * 
 * Touch/mouse gestures for flashcard/quiz navigation.
 * Swipe left = "again" (or skip), Swipe right = "easy" (or next)
 * Long-press = show hint
 * 
 * @example
 * ```tsx
 * const { bind, swipeDirection, swipeProgress } = useCardGestures({
 *   onSwipeLeft: () => handleRating('again'),
 *   onSwipeRight: () => handleRating('easy'),
 *   onLongPress: () => setShowHint(true),
 * });
 * 
 * <div {...bind()}>Card content</div>
 * ```
 */

import { useRef, useState, useCallback } from 'react';
import { haptic } from '@/lib/haptics';

export interface CardGestureOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onLongPress?: () => void;
  onTap?: () => void;
  swipeThreshold?: number; // pixels to trigger swipe
  longPressDelay?: number; // ms to trigger long press
}

export interface CardGestureResult {
  bind: () => Record<string, any>;
  swipeDirection: 'left' | 'right' | 'up' | 'down' | null;
  swipeProgress: number; // 0-100
  isLongPressing: boolean;
}

export function useCardGestures(options: CardGestureOptions = {}): CardGestureResult {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onLongPress,
    onTap,
    swipeThreshold = 100,
    longPressDelay = 500,
  } = options;

  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | 'up' | 'down' | null>(null);
  const [swipeProgress, setSwipeProgress] = useState(0);
  const [isLongPressing, setIsLongPressing] = useState(false);

  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    const touch = 'touches' in e ? e.touches[0] : e;
    
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };

    // Start long press timer
    longPressTimerRef.current = setTimeout(() => {
      if (onLongPress) {
        haptic.medium();
        setIsLongPressing(true);
        onLongPress();
      }
    }, longPressDelay);
  }, [onLongPress, longPressDelay]);

  const handleTouchMove = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (!touchStartRef.current) return;

    const touch = 'touches' in e ? e.touches[0] : e;
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;

    // Cancel long press on move
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    // Determine direction
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    if (absX > absY) {
      // Horizontal swipe
      if (deltaX > 10) {
        setSwipeDirection('right');
        setSwipeProgress(Math.min(100, (deltaX / swipeThreshold) * 100));
      } else if (deltaX < -10) {
        setSwipeDirection('left');
        setSwipeProgress(Math.min(100, (-deltaX / swipeThreshold) * 100));
      }
    } else {
      // Vertical swipe
      if (deltaY > 10) {
        setSwipeDirection('down');
        setSwipeProgress(Math.min(100, (deltaY / swipeThreshold) * 100));
      } else if (deltaY < -10) {
        setSwipeDirection('up');
        setSwipeProgress(Math.min(100, (-deltaY / swipeThreshold) * 100));
      }
    }
  }, [swipeThreshold]);

  const handleTouchEnd = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (!touchStartRef.current) return;

    // Cancel long press
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    const touch = 'changedTouches' in e ? e.changedTouches[0] : e;
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    const deltaTime = Date.now() - touchStartRef.current.time;

    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    // Detect tap (small movement, quick time)
    if (absX < 10 && absY < 10 && deltaTime < 300 && !isLongPressing) {
      if (onTap) {
        haptic.selection();
        onTap();
      }
    }
    // Detect swipe
    else if (absX > absY && absX > swipeThreshold) {
      if (deltaX > 0 && onSwipeRight) {
        haptic.medium();
        onSwipeRight();
      } else if (deltaX < 0 && onSwipeLeft) {
        haptic.medium();
        onSwipeLeft();
      }
    } else if (absY > absX && absY > swipeThreshold) {
      if (deltaY > 0 && onSwipeDown) {
        haptic.light();
        onSwipeDown();
      } else if (deltaY < 0 && onSwipeUp) {
        haptic.light();
        onSwipeUp();
      }
    }

    // Reset
    touchStartRef.current = null;
    setSwipeDirection(null);
    setSwipeProgress(0);
    setIsLongPressing(false);
  }, [
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onTap,
    swipeThreshold,
    isLongPressing,
  ]);

  const bind = useCallback(() => ({
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
    onMouseDown: handleTouchStart,
    onMouseMove: handleTouchMove,
    onMouseUp: handleTouchEnd,
    onMouseLeave: handleTouchEnd,
  }), [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    bind,
    swipeDirection,
    swipeProgress,
    isLongPressing,
  };
}

