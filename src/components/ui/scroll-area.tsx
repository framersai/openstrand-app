'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean;
}

export const ScrollArea = React.forwardRef<HTMLDivElement, ScrollAreaProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'relative overflow-hidden rounded-lg border border-border/60 bg-background/80',
          className
        )}
        {...props}
      >
        <div className="h-full w-full overflow-auto [scrollbar-width:thin] [scrollbar-color:var(--border)_transparent]">
          {children}
        </div>
      </div>
    );
  }
);

ScrollArea.displayName = 'ScrollArea';
