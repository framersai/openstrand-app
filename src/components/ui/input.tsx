/**
 * @module components/ui/input
 * @description Styled input component consistent with the design system.
 */

import * as React from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Label text */
  label?: string;
  /** Error message */
  error?: string;
  /** Success message */
  success?: string;
  /** Helper text */
  helperText?: string;
  /** Icon to display before input */
  leftIcon?: React.ReactNode;
  /** Icon to display after input */
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className, 
    type = 'text', 
    label,
    error,
    success,
    helperText,
    leftIcon,
    rightIcon,
    id,
    ...props 
  }, ref) => {
    const inputId = id || `input-${React.useId()}`;
    const hasError = !!error;
    const hasSuccess = !!success && !hasError;
    const [isFocused, setIsFocused] = React.useState(false);

    return (
      <div className="space-y-2 w-full">
        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              'block text-sm font-medium transition-colors',
              hasError && 'text-destructive',
              hasSuccess && 'text-[hsl(var(--color-success-600))]',
              isFocused && !hasError && !hasSuccess && 'text-primary'
            )}
          >
            {label}
            {props.required && <span className="text-destructive ml-1">*</span>}
          </label>
        )}

        {/* Input container */}
        <div className="relative">
          {/* Left icon */}
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
              {leftIcon}
            </div>
          )}

          {/* Input */}
          <input
            id={inputId}
            type={type}
            className={cn(
              'flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background',
              'placeholder:text-muted-foreground',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
              'disabled:cursor-not-allowed disabled:opacity-50',
              'transition-all duration-200',
              // Error state
              hasError && 'border-destructive focus-visible:ring-destructive',
              // Success state
              hasSuccess && 'border-[hsl(var(--color-success-500))] focus-visible:ring-[hsl(var(--color-success-500))]',
              // Normal state
              !hasError && !hasSuccess && 'border-input focus-visible:ring-primary/40',
              // Padding for icons
              leftIcon && 'pl-10',
              (rightIcon || hasError || hasSuccess) && 'pr-10',
              className
            )}
            ref={ref}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            aria-invalid={hasError}
            aria-describedby={
              error ? `${inputId}-error` :
              helperText ? `${inputId}-helper` :
              undefined
            }
            {...props}
          />

          {/* Right icon / status indicator */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {hasError && <AlertCircle className="h-4 w-4 text-destructive" />}
            {hasSuccess && <CheckCircle2 className="h-4 w-4 text-[hsl(var(--color-success-600))]" />}
            {!hasError && !hasSuccess && rightIcon && (
              <span className="text-muted-foreground">{rightIcon}</span>
            )}
          </div>
        </div>

        {/* Helper text / Error / Success message */}
        {helperText && !error && !success && (
          <p id={`${inputId}-helper`} className="text-xs text-muted-foreground">
            {helperText}
          </p>
        )}

        {error && (
          <p
            id={`${inputId}-error`}
            className="text-xs text-destructive flex items-center gap-1"
            role="alert"
          >
            <AlertCircle className="h-3 w-3" />
            {error}
          </p>
        )}

        {success && !error && (
          <p className="text-xs text-[hsl(var(--color-success-600))] flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            {success}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';
