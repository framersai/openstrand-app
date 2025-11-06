/**
 * Weave Pattern SVG Component
 * A geometric-organic pattern representing knowledge interconnection
 * Reusable across the platform for consistent branding
 */

import { cn } from '@/lib/utils';

interface WeavePatternProps {
  className?: string;
  variant?: 'default' | 'hero' | 'subtle';
  animated?: boolean;
}

export function WeavePattern({ 
  className, 
  variant = 'default',
  animated = false 
}: WeavePatternProps) {
  const baseClasses = cn(
    'weave-pattern',
    animated && 'animate-pulse',
    className
  );

  if (variant === 'hero') {
    return (
      <svg
        viewBox="0 0 800 400"
        className={baseClasses}
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="weave-gradient-hero" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.1" />
            <stop offset="50%" stopColor="var(--color-primary)" stopOpacity="0.05" />
            <stop offset="100%" stopColor="var(--color-secondary)" stopOpacity="0.1" />
          </linearGradient>
          <filter id="weave-glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {/* Organic flowing lines representing knowledge streams */}
        <g fill="none" stroke="url(#weave-gradient-hero)" strokeWidth="1.5" opacity="0.4">
          <path d="M0,100 Q200,50 400,100 T800,100" className={animated ? 'animate-weave-flow' : ''} />
          <path d="M0,200 Q200,250 400,200 T800,200" className={animated ? 'animate-weave-flow-delayed' : ''} />
          <path d="M0,300 Q200,350 400,300 T800,300" className={animated ? 'animate-weave-flow' : ''} />
        </g>
        
        {/* Geometric nodes representing knowledge points */}
        <g fill="var(--color-primary)" opacity="0.2">
          <circle cx="150" cy="100" r="4" filter="url(#weave-glow)" />
          <circle cx="400" cy="200" r="6" filter="url(#weave-glow)" />
          <circle cx="650" cy="150" r="5" filter="url(#weave-glow)" />
          <circle cx="300" cy="300" r="4" filter="url(#weave-glow)" />
          <circle cx="550" cy="280" r="7" filter="url(#weave-glow)" />
        </g>
        
        {/* Connecting threads */}
        <g stroke="var(--color-primary)" strokeWidth="0.5" opacity="0.3" fill="none">
          <path d="M150,100 L400,200" />
          <path d="M400,200 L650,150" />
          <path d="M300,300 L550,280" />
          <path d="M150,100 L300,300" />
        </g>
      </svg>
    );
  }

  if (variant === 'subtle') {
    return (
      <svg
        viewBox="0 0 200 200"
        className={baseClasses}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="weave-gradient-subtle" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.05" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        
        <g fill="none" stroke="url(#weave-gradient-subtle)" strokeWidth="1">
          <path d="M20,50 Q100,30 180,50" />
          <path d="M20,100 Q100,120 180,100" />
          <path d="M20,150 Q100,170 180,150" />
        </g>
        
        <g fill="currentColor" opacity="0.1">
          <circle cx="50" cy="50" r="2" />
          <circle cx="100" cy="100" r="3" />
          <circle cx="150" cy="150" r="2" />
        </g>
      </svg>
    );
  }

  // Default variant
  return (
    <svg
      viewBox="0 0 400 400"
      className={baseClasses}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="weave-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.2" />
          <stop offset="100%" stopColor="var(--color-secondary)" stopOpacity="0.2" />
        </linearGradient>
      </defs>
      
      {/* Central weave pattern */}
      <g fill="none" stroke="url(#weave-gradient)" strokeWidth="2">
        <path d="M100,200 Q200,100 300,200 T400,200" />
        <path d="M0,200 Q100,300 200,200 T400,200" />
        <path d="M200,0 Q100,100 200,200 T200,400" />
        <path d="M200,0 Q300,100 200,200 T200,400" />
      </g>
      
      {/* Knowledge nodes */}
      <g fill="var(--color-primary)" opacity="0.3">
        <circle cx="200" cy="200" r="8" />
        <circle cx="100" cy="100" r="5" />
        <circle cx="300" cy="100" r="5" />
        <circle cx="100" cy="300" r="5" />
        <circle cx="300" cy="300" r="5" />
      </g>
    </svg>
  );
}
