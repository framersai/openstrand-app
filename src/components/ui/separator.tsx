/**
 * @module components/ui/separator
 * @description Horizontal or vertical divider for grouping content.
 */

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface SeparatorProps
  extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical';
  decorative?: boolean;
}

const Separator = React.forwardRef<HTMLDivElement, SeparatorProps>(
  (
    {
      className,
      orientation = 'horizontal',
      decorative = true,
      role,
      ...props
    },
    ref
  ) => {
    const ariaOrientation =
      orientation === 'vertical' ? 'vertical' : 'horizontal';
    return (
      <div
        ref={ref}
        role={decorative ? undefined : role ?? 'separator'}
        aria-orientation={decorative ? undefined : ariaOrientation}
        className={cn(
          'bg-border',
          orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
          className
        )}
        {...props}
      />
    );
  }
);
Separator.displayName = 'Separator';

export { Separator };
