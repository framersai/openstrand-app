/**
 * Confetti Component
 * 
 * Celebration effect for achievements and milestones.
 * Triggers on: 7-day streak, badge unlock, quiz perfect score.
 * 
 * Uses canvas-confetti library.
 * 
 * @example
 * ```tsx
 * <Confetti trigger={showConfetti} type="streak" />
 * ```
 */

'use client';

import React, { useEffect, useRef } from 'react';

export interface ConfettiProps {
  trigger: boolean;
  type?: 'success' | 'streak' | 'badge' | 'achievement';
  duration?: number;
  onComplete?: () => void;
}

export function Confetti({ trigger, type = 'success', duration = 3000, onComplete }: ConfettiProps) {
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (!trigger) return;

    startTimeRef.current = Date.now();

    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '9999';
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Confetti particles
    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      color: string;
      size: number;
      rotation: number;
      rotationSpeed: number;
    }> = [];

    // Color schemes by type
    const colorSchemes = {
      success: ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b'],
      streak: ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'],
      badge: ['#ffd700', '#ffaa00', '#ff6600', '#ff0000'],
      achievement: ['#10b981', '#06b6d4', '#3b82f6', '#8b5cf6'],
    };

    const colors = colorSchemes[type] || colorSchemes.success;

    // Create particles
    for (let i = 0; i < 150; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: -10,
        vx: (Math.random() - 0.5) * 8,
        vy: Math.random() * 3 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 6 + 2,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
      });
    }

    // Animation loop
    const animate = () => {
      if (!ctx || !canvas) return;

      const elapsed = Date.now() - (startTimeRef.current || 0);
      if (elapsed > duration) {
        // Cleanup
        document.body.removeChild(canvas);
        onComplete?.();
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        // Update position
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.1; // Gravity
        p.rotation += p.rotationSpeed;

        // Draw confetti piece
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 2);
        ctx.restore();
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (canvas.parentElement) {
        document.body.removeChild(canvas);
      }
    };
  }, [trigger, type, duration, onComplete]);

  return null;
}

