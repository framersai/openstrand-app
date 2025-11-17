/**
 * @module components/ui/button
 * @description Button component with multiple variants and sizes.
 * Built with Radix UI and class-variance-authority.
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

type SlotProps = React.HTMLAttributes<HTMLElement> & {
  children?: React.ReactNode;
};

function composeRefs<T>(...refs: Array<React.Ref<T> | undefined>) {
  return (value: T) => {
    refs.forEach((ref) => {
      if (!ref) return;
      if (typeof ref === 'function') {
        ref(value);
      } else {
        (ref as React.MutableRefObject<T | null>).current = value;
      }
    });
  };
}

const Slot = React.forwardRef<HTMLElement, SlotProps>(({ children, className, ...props }, forwardedRef) => {
  if (!React.isValidElement(children)) {
    return (
      <span ref={forwardedRef as React.Ref<HTMLSpanElement>} className={className} {...props}>
        {children}
      </span>
    );
  }

  const mergedClassName = cn(children.props.className, className);
  return React.cloneElement(children, {
    ...props,
    className: mergedClassName || undefined,
    ref: composeRefs(children.ref, forwardedRef),
  });
});
Slot.displayName = 'Slot';

const buttonVariants = cva(
  'inline-flex select-none items-center justify-center whitespace-nowrap rounded-full text-sm font-semibold tracking-tight ring-offset-background shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--focus-ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 motion-safe:transition-all motion-safe:duration-200 motion-safe:ease-out motion-safe:hover:-translate-y-[1px] motion-safe:active:translate-y-0 motion-safe:active:scale-[0.98]',
  {
    variants: {
      variant: {
        default:
          'relative overflow-hidden border border-primary/25 bg-[hsl(var(--surface-1))] text-primary shadow-[var(--shadow-glow)] hover:border-primary/35 hover:bg-[hsl(var(--surface-2))] hover:text-primary dark:border-primary/40 dark:bg-[hsl(var(--surface-2))] dark:text-primary-foreground dark:hover:bg-[hsl(var(--surface-3))] dark:shadow-[var(--shadow-glow)]',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-lg hover:shadow-xl',
        outline:
          'border border-border/70 bg-[hsl(var(--surface-1))] text-foreground hover:border-primary/40 hover:bg-[hsl(var(--surface-2))] hover:text-primary dark:border-border/40 dark:bg-[hsl(var(--surface-2))] dark:hover:border-primary/50',
        secondary:
          'border border-border/60 bg-[hsl(var(--surface-2))] text-foreground shadow-none hover:border-primary/30 hover:bg-[hsl(var(--surface-3))] hover:text-foreground dark:border-border/40 dark:bg-[hsl(var(--surface-2))] dark:hover:bg-[hsl(var(--surface-3))]',
        ghost: 'text-foreground/85 hover:text-primary hover:bg-[hsl(var(--surface-2))] dark:hover:bg-[hsl(var(--surface-2))]',
        link: 'text-primary underline-offset-4 hover:underline shadow-none',
        gradient: 'relative overflow-hidden bg-gradient-to-r from-primary via-secondary to-primary bg-[length:200%_100%] text-primary-foreground hover:shadow-lg hover:shadow-primary/30 animate-gradient-x border-0',
        glass: 'backdrop-blur-xl bg-card/70 border border-border/50 hover:bg-card/80 hover:shadow-lg',
        success: 'bg-[hsl(var(--color-success-500))] text-white hover:bg-[hsl(var(--color-success-600))] hover:shadow-lg hover:shadow-[hsl(var(--color-success-500))]/30',
      },
      size: {
        default: 'h-11 px-6 min-h-[44px]',
        sm: 'h-11 px-4 text-sm min-h-[44px]',
        lg: 'h-12 px-8 text-base min-h-[48px]',
        xl: 'h-14 px-10 text-lg min-h-[52px]',
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
  /** Show loading spinner */
  loading?: boolean;
  /** Icon to display before text */
  leftIcon?: React.ReactNode;
  /** Icon to display after text */
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    let slottableChild = children;

    if (asChild) {
      if (!React.isValidElement(slottableChild)) {
        throw new Error('[Button] asChild requires a valid React element as its only child.');
      }

      const childContent = slottableChild.props?.children;
      const childContentCount = React.Children.count(childContent);

      if (childContentCount === 0) {
        throw new Error('[Button] asChild requires the provided element to have child content.');
      }

      if (childContentCount > 1) {
        slottableChild = React.cloneElement(
          slottableChild,
          undefined,
          <span className="inline-flex items-center gap-2">{childContent}</span>
        );
      }
    }

    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading}
        {...props}
      >
        {loading && (
          <svg
            className="mr-2 h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-label="Loading"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {!loading && leftIcon && <span className="mr-2">{leftIcon}</span>}
        {asChild ? slottableChild : children}
        {!loading && rightIcon && <span className="ml-2">{rightIcon}</span>}
      </Comp>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
