/**
 * Empty Visualization SVG Icon
 * A custom icon for empty visualization states
 */

import { cn } from '@/lib/utils';

interface EmptyVisualizationProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function EmptyVisualization({
  className,
  size = 'lg'
}: EmptyVisualizationProps) {
  const sizeMap = {
    sm: 'h-12 w-12',
    md: 'h-16 w-16',
    lg: 'h-20 w-20',
    xl: 'h-24 w-24'
  };

  return (
    <svg
      viewBox="0 0 100 100"
      className={cn(sizeMap[size], 'text-muted-foreground', className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background chart frame */}
      <rect
        x="15"
        y="15"
        width="70"
        height="50"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="4 2"
        opacity="0.5"
        rx="4"
      />
      
      {/* Axis lines */}
      <path
        d="M20 60 L20 25 L75 60"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.3"
      />
      
      {/* Empty bar indicators */}
      <rect x="28" y="45" width="8" height="15" fill="currentColor" opacity="0.2" rx="1" />
      <rect x="40" y="35" width="8" height="25" fill="currentColor" opacity="0.15" rx="1" />
      <rect x="52" y="40" width="8" height="20" fill="currentColor" opacity="0.2" rx="1" />
      <rect x="64" y="30" width="8" height="30" fill="currentColor" opacity="0.15" rx="1" />
      
      {/* Question mark overlay */}
      <circle cx="50" cy="40" r="18" fill="currentColor" opacity="0.1" />
      <path
        d="M50 28 C45 28 42 31 42 35 C42 37 43 39 46 40 L48 42 L48 44 M48 50 L48 52"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.6"
      />
      
      {/* Decorative dots */}
      <circle cx="25" cy="70" r="1.5" fill="currentColor" opacity="0.3" />
      <circle cx="50" cy="70" r="1.5" fill="currentColor" opacity="0.3" />
      <circle cx="75" cy="70" r="1.5" fill="currentColor" opacity="0.3" />
    </svg>
  );
}
