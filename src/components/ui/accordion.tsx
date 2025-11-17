'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';

type AccordionValue = string;

type AccordionProps = {
  type?: 'single' | 'multiple';
  defaultValue?: AccordionValue | AccordionValue[];
  collapsible?: boolean;
  children: React.ReactNode;
  className?: string;
};

type AccordionContextValue = {
  openValues: Set<AccordionValue>;
  toggleValue: (value: AccordionValue) => void;
  isOpen: (value: AccordionValue) => boolean;
};

const AccordionContext = React.createContext<AccordionContextValue | null>(null);
const AccordionItemContext = React.createContext<AccordionValue | null>(null);

function toArray(value?: AccordionValue | AccordionValue[]) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

const Accordion = ({
  type = 'multiple',
  defaultValue,
  collapsible = true,
  children,
  className,
}: AccordionProps) => {
  const initialValues = React.useMemo(() => new Set(toArray(defaultValue)), [defaultValue]);
  const [openValues, setOpenValues] = React.useState<Set<AccordionValue>>(initialValues);

  const toggleValue = React.useCallback(
    (value: AccordionValue) => {
      setOpenValues((prev) => {
        const next = new Set(prev);
        if (type === 'single') {
          const isOpen = next.has(value);
          next.clear();
          if (!isOpen || !collapsible) {
            next.add(value);
          }
          return next;
        }

        if (next.has(value)) {
          next.delete(value);
        } else {
          next.add(value);
        }
        return next;
      });
    },
    [type, collapsible],
  );

  const contextValue = React.useMemo<AccordionContextValue>(
    () => ({
      openValues,
      toggleValue,
      isOpen: (value: AccordionValue) => openValues.has(value),
    }),
    [openValues, toggleValue],
  );

  return (
    <AccordionContext.Provider value={contextValue}>
      <div className={cn('divide-y divide-border/60 rounded-lg border border-border/60', className)}>{children}</div>
    </AccordionContext.Provider>
  );
};

const AccordionItem = ({
  value,
  className,
  children,
}: React.PropsWithChildren<{ value: AccordionValue; className?: string }>) => (
  <AccordionItemContext.Provider value={value}>
    <div className={cn('border-b border-border/40 last:border-b-0', className)}>{children}</div>
  </AccordionItemContext.Provider>
);

function useAccordionContext() {
  const ctx = React.useContext(AccordionContext);
  if (!ctx) throw new Error('Accordion components must be used within <Accordion>');
  return ctx;
}

function useAccordionItemValue() {
  const value = React.useContext(AccordionItemContext);
  if (!value) throw new Error('<AccordionItem> must wrap Trigger and Content');
  return value;
}

const AccordionTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<'button'> & { icon?: React.ReactNode }
>(({ className, children, icon, ...props }, ref) => {
  const { toggleValue, isOpen } = useAccordionContext();
  const value = useAccordionItemValue();
  const open = isOpen(value);

  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        'flex w-full items-center justify-between bg-transparent py-4 text-sm font-medium transition-colors',
        'hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        className,
      )}
      aria-expanded={open}
      onClick={() => toggleValue(value)}
      {...props}
    >
      <span className="text-left">{children}</span>
      <span className={cn('ml-2 inline-flex h-5 w-5 items-center justify-center transition-transform', open && 'rotate-180')}>
        {icon ?? (
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
    </button>
  );
});
AccordionTrigger.displayName = 'AccordionTrigger';

const AccordionContent = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<'div'>>(
  ({ className, children, ...props }, ref) => {
    const { isOpen } = useAccordionContext();
    const value = useAccordionItemValue();
    const open = isOpen(value);

    return (
      <div
        ref={ref}
        className={cn(
          'grid text-sm transition-all duration-200 ease-out',
          open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
        )}
        {...props}
      >
        <div className={cn('overflow-hidden pb-4 pt-0', className)}>{children}</div>
      </div>
    );
  },
);
AccordionContent.displayName = 'AccordionContent';

export { Accordion, AccordionContent, AccordionItem, AccordionTrigger };

