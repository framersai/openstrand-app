/**
 * Micro-interactions & Animation Utilities
 * 
 * Provides delightful UI animations:
 * - Badge wiggle on hover
 * - Card 3D tilt on mouse move
 * - Progress ring pulse
 * - Number count-up animations
 */

import { useState, useEffect, useRef, MouseEvent } from 'react';

/**
 * Hook for 3D card tilt effect
 * 
 * @example
 * ```tsx
 * const { tiltStyle, bind } = useCardTilt({ maxTilt: 10 });
 * <div {...bind} style={tiltStyle}>Card</div>
 * ```
 */
export function useCardTilt(options: { maxTilt?: number; smoothing?: number } = {}) {
  const { maxTilt = 10, smoothing = 0.1 } = options;
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const targetTiltRef = useRef({ x: 0, y: 0 });
  const frameRef = useRef<number | null>(null);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    targetTiltRef.current = {
      x: ((y - centerY) / centerY) * maxTilt,
      y: ((centerX - x) / centerX) * maxTilt,
    };
  };

  const handleMouseLeave = () => {
    targetTiltRef.current = { x: 0, y: 0 };
  };

  useEffect(() => {
    const animate = () => {
      setTilt((prev) => ({
        x: prev.x + (targetTiltRef.current.x - prev.x) * smoothing,
        y: prev.y + (targetTiltRef.current.y - prev.y) * smoothing,
      }));
      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [smoothing]);

  const tiltStyle = {
    transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
    transition: 'transform 0.1s ease-out',
  };

  const bind = {
    onMouseMove: handleMouseMove,
    onMouseLeave: handleMouseLeave,
  };

  return { tiltStyle, bind };
}

/**
 * CSS classes for badge wiggle animation
 */
export const badgeWiggleAnimation = `
  @keyframes wiggle {
    0%, 100% { transform: rotate(0deg); }
    25% { transform: rotate(-5deg); }
    75% { transform: rotate(5deg); }
  }
  
  .badge-wiggle:hover {
    animation: wiggle 0.5s ease-in-out;
  }
`;

/**
 * Hook for count-up animation
 * 
 * @example
 * ```tsx
 * const count = useCountUp(1500, 2000); // Count from 0 to 1500 over 2s
 * <div>{count}</div>
 * ```
 */
export function useCountUp(target: number, duration = 1000) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    let frameId: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);

      setCount(Math.floor(progress * target));

      if (progress < 1) {
        frameId = requestAnimationFrame(animate);
      }
    };

    frameId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(frameId);
  }, [target, duration]);

  return count;
}

/**
 * Trigger confetti programmatically
 */
export function triggerConfetti(type: 'success' | 'streak' | 'badge' = 'success') {
  const event = new CustomEvent('openstrand:confetti', { detail: { type } });
  window.dispatchEvent(event);
}

/**
 * Hook to listen for confetti events
 */
export function useConfettiListener(callback: (type: string) => void) {
  useEffect(() => {
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent;
      callback(customEvent.detail.type);
    };

    window.addEventListener('openstrand:confetti', handler);
    return () => window.removeEventListener('openstrand:confetti', handler);
  }, [callback]);
}

