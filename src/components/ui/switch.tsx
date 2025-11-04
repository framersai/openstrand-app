/**
 * @module components/ui/switch
 * @description Accessible toggle switch component.
 */

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface SwitchProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
}

const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ className, checked = false, onCheckedChange, disabled = false, ...props }, ref) => {
    const handleClick = () => {
      if (disabled) return;
      onCheckedChange?.(!checked);
    };

    return (
      <button
        ref={ref}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-disabled={disabled}
        data-state={checked ? 'checked' : 'unchecked'}
        className={cn(
          'relative inline-flex h-5 w-9 cursor-pointer items-center rounded-full border border-transparent transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2',
          disabled ? 'cursor-not-allowed opacity-50' : checked ? 'bg-primary' : 'bg-muted',
          className
        )}
        onClick={handleClick}
        {...props}
      >
        <span
          className={cn(
            'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-background shadow transition-transform',
            checked ? 'translate-x-4' : 'translate-x-1'
          )}
        />
      </button>
    );
  }
);
Switch.displayName = 'Switch';

export { Switch };
