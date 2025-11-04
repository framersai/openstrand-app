/**
 * @module components/ui/button
 * @description Button component with multiple variants and sizes.
 * Built with Radix UI and class-variance-authority.
 */

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex select-none items-center justify-center whitespace-nowrap rounded-full text-sm font-semibold tracking-tight ring-offset-background shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--focus-ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 motion-safe:transition-all motion-safe:duration-200 motion-safe:ease-out motion-safe:hover:-translate-y-[1px] motion-safe:active:translate-y-0 motion-safe:active:scale-[0.98]',
  {
    variants: {
      variant: {
        default:
          'relative overflow-hidden border border-primary/25 bg-[hsl(var(--surface-1))] text-primary shadow-[var(--shadow-glow)] hover:border-primary/35 hover:bg-[hsl(var(--surface-2))] hover:text-primary dark:border-primary/40 dark:bg-[hsl(var(--surface-2))] dark:text-primary-foreground dark:hover:bg-[hsl(var(--surface-3))] dark:shadow-[var(--shadow-glow)]',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-lg',
        outline:
          'border border-border/70 bg-[hsl(var(--surface-1))] text-foreground hover:border-primary/40 hover:bg-[hsl(var(--surface-2))] hover:text-primary dark:border-border/40 dark:bg-[hsl(var(--surface-2))] dark:hover:border-primary/50',
        secondary:
          'border border-border/60 bg-[hsl(var(--surface-2))] text-foreground shadow-none hover:border-primary/30 hover:bg-[hsl(var(--surface-3))] hover:text-foreground dark:border-border/40 dark:bg-[hsl(var(--surface-2))] dark:hover:bg-[hsl(var(--surface-3))]',
        ghost: 'text-foreground/85 hover:text-primary hover:bg-[hsl(var(--surface-2))] dark:hover:bg-[hsl(var(--surface-2))]',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-11 px-6 min-h-[44px]',
        sm: 'h-11 px-4 text-sm min-h-[44px]',
        lg: 'h-12 px-8 text-base min-h-[48px]',
        icon: 'h-11 w-11 rounded-full min-h-[44px] min-w-[44px]',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
