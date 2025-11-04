'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const gradientButtonVariants = cva(
  'relative inline-flex items-center justify-center rounded-lg text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: [
          'bg-gradient-to-r from-primary via-secondary to-accent',
          'text-primary-foreground',
          'shadow-lg hover:shadow-xl',
          'before:absolute before:inset-0 before:rounded-lg before:p-[1px]',
          'before:bg-gradient-to-r before:from-primary before:via-secondary before:to-accent',
          'before:-z-10 before:animate-gradient-x',
          'after:absolute after:inset-[1px] after:rounded-[7px]',
          'after:bg-background after:-z-10',
          'hover:after:bg-background/95',
        ],
        solid: [
          'bg-gradient-to-r from-primary to-secondary',
          'text-primary-foreground',
          'shadow-lg hover:shadow-xl',
          'hover:brightness-110',
        ],
        outline: [
          'border border-input bg-background',
          'hover:bg-accent hover:text-accent-foreground',
          'before:absolute before:inset-0 before:rounded-lg',
          'before:bg-gradient-to-r before:from-primary before:via-secondary before:to-accent',
          'before:opacity-0 hover:before:opacity-20',
          'before:transition-opacity before:duration-300',
        ],
        ghost: [
          'hover:bg-accent hover:text-accent-foreground',
          'relative overflow-hidden',
          'before:absolute before:inset-0',
          'before:bg-gradient-to-r before:from-primary/20 before:to-secondary/20',
          'before:translate-x-[-100%] hover:before:translate-x-0',
          'before:transition-transform before:duration-500',
        ],
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 px-3',
        lg: 'h-11 px-8',
        icon: 'h-10 w-10',
      },
      glow: {
        true: [
          'shadow-[0_0_20px_rgba(var(--primary)/0.5)]',
          'hover:shadow-[0_0_30px_rgba(var(--primary)/0.7)]',
        ],
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      glow: false,
    },
  }
);

export interface GradientButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof gradientButtonVariants> {
  asChild?: boolean;
}

const GradientButton = React.forwardRef<HTMLButtonElement, GradientButtonProps>(
  ({ className, variant, size, glow, asChild = false, children, ...props }, ref) => {
    const Comp = asChild ? React.Fragment : 'button';
    const buttonProps = asChild ? {} : props;

    return (
      <Comp
        className={cn(gradientButtonVariants({ variant, size, glow, className }))}
        ref={ref}
        {...buttonProps}
      >
        <span className="relative z-10 flex items-center gap-2">
          {children}
        </span>
      </Comp>
    );
  }
);
GradientButton.displayName = 'GradientButton';

// Animated gradient background keyframes in globals.css:
// @keyframes gradient-x {
//   0%, 100% { background-position: 0% 50%; }
//   50% { background-position: 100% 50%; }
// }

export { GradientButton, gradientButtonVariants };
