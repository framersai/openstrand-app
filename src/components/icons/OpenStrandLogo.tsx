/**
 * OpenStrand Logo Component
 * A geometric-organic logo representing interconnected knowledge
 * The design combines flowing strands with structured nodes
 */

import { useId } from 'react';

import { cn } from '@/lib/utils';

interface OpenStrandLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'mono' | 'gradient';
}

export function OpenStrandLogo({
  className,
  size = 'md',
  variant = 'default'
}: OpenStrandLogoProps) {
  const sizeMap = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };

  const baseClasses = cn(
    'openstrand-logo',
    sizeMap[size],
    className
  );

  const reactId = useId();
  // Stable gradient ID to avoid hydration mismatches
  const gradientId = `logo-gradient-${reactId}`;

  return (
    <svg
      viewBox="0 0 100 100"
      className={baseClasses}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {variant === 'gradient' && (
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop
              offset="0%"
              className="text-blue-500 dark:text-cyan-400"
              stopColor="currentColor"
            />
            <stop
              offset="100%"
              className="text-teal-500 dark:text-teal-400"
              stopColor="currentColor"
            />
          </linearGradient>
        )}
        <filter id="logo-shadow">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.2"/>
        </filter>
      </defs>

      {/* Background circle */}
      {variant === 'default' && (
        <circle
          cx="50"
          cy="50"
          r="45"
          className="fill-background/10 stroke-border/50"
          strokeWidth="1"
        />
      )}

      {/* Main weave symbol */}
      <g
        fill="none"
        className={variant === 'gradient' ? '' : 'text-foreground'}
        stroke={variant === 'gradient' ? `url(#${gradientId})` : 'currentColor'}
        strokeWidth="3"
        strokeLinecap="round"
        filter={variant === 'default' ? 'url(#logo-shadow)' : undefined}
      >
        {/* Three interwoven strands forming an abstract 'S' */}
        <path d="M30,25 Q50,35 70,25 Q70,50 50,50 Q30,50 30,75 Q50,65 70,75" />
        <path d="M25,35 Q50,45 75,35" opacity="0.6" />
        <path d="M25,65 Q50,55 75,65" opacity="0.6" />
      </g>

      {/* Knowledge nodes */}
      <g
        className={variant === 'gradient' ? '' : 'text-foreground'}
        fill={variant === 'gradient' ? `url(#${gradientId})` : 'currentColor'}
      >
        <circle cx="30" cy="25" r="4" />
        <circle cx="70" cy="25" r="4" />
        <circle cx="50" cy="50" r="5" />
        <circle cx="30" cy="75" r="4" />
        <circle cx="70" cy="75" r="4" />
      </g>
    </svg>
  );
}

/**
 * OpenStrand Icon - Simplified version for small sizes
 */
export function OpenStrandIcon({ 
  className,
  size = 16 
}: { 
  className?: string;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={cn('openstrand-icon', className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
    >
      <g stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M6,6 Q12,9 18,6 Q18,12 12,12 Q6,12 6,18 Q12,15 18,18" />
        <path d="M4,9 Q12,12 20,9" opacity="0.5" />
        <path d="M4,15 Q12,12 20,15" opacity="0.5" />
      </g>
      <g fill="currentColor">
        <circle cx="6" cy="6" r="1.5" />
        <circle cx="18" cy="6" r="1.5" />
        <circle cx="12" cy="12" r="2" />
        <circle cx="6" cy="18" r="1.5" />
        <circle cx="18" cy="18" r="1.5" />
      </g>
    </svg>
  );
}
