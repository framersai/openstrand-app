'use client';

import * as React from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check } from 'lucide-react';

import { cn } from '@/lib/utils';

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(
  ({ className, ...props }, ref) => (
    <div className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center">
      <CheckboxPrimitive.Root
        ref={ref}
        className={cn(
          'peer h-5 w-5 shrink-0 rounded-[6px] border border-border/70 bg-background shadow-sm transition-colors duration-150 hover:border-primary/60 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60 data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground dark:border-border/60 dark:bg-background/90 dark:data-[state=checked]:border-primary/80 dark:data-[state=checked]:bg-primary/80',
          className,
        )}
        {...props}
      >
        <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current">
          <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden="true" />
        </CheckboxPrimitive.Indicator>
        <span className="sr-only">Toggle option</span>
      </CheckboxPrimitive.Root>
    </div>
  ),
);

Checkbox.displayName = CheckboxPrimitive.Root.displayName ?? 'Checkbox';

export { Checkbox };

