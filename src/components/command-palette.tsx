'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface CommandAction {
  id: string;
  label: string;
  hint?: string;
  shortcut?: string;
  onSelect: () => void;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  actions: CommandAction[];
}

export function CommandPalette({ open, onClose, actions }: CommandPaletteProps) {
  const listRef = React.useRef<HTMLDivElement | null>(null);
  const searchRef = React.useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = React.useState('');

  React.useEffect(() => {
    if (open) {
      setQuery('');
      const timeout = window.setTimeout(() => {
        searchRef.current?.focus();
      }, 10);
      return () => window.clearTimeout(timeout);
    }
    return undefined;
  }, [open]);

  React.useEffect(() => {
    if (!open) return undefined;

    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handler);
    return () => {
      window.removeEventListener('keydown', handler);
    };
  }, [open, onClose]);

  if (!open) return null;

  const filtered = actions.filter((action) =>
    action.label.toLowerCase().includes(query.toLowerCase().trim())
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 px-4 py-16 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-border/60 bg-card shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="border-b border-border/60">
          <input
            ref={searchRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search actions..."
            className="w-full border-none bg-transparent px-4 py-3 text-sm outline-none"
          />
        </div>
        <div ref={listRef} className="max-h-64 overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              No matching actions
            </p>
          ) : (
            filtered.map((action) => (
              <button
                key={action.id}
                onClick={() => {
                  action.onSelect();
                  onClose();
                }}
                className={cn(
                  'flex w-full items-center justify-between px-4 py-2 text-left text-sm transition-colors',
                  'hover:bg-muted focus:bg-muted focus:outline-none'
                )}
              >
                <span className="flex flex-col">
                  <span className="font-medium text-foreground">{action.label}</span>
                  {action.hint && (
                    <span className="text-xs text-muted-foreground">{action.hint}</span>
                  )}
                </span>
                {action.shortcut && (
                  <span className="rounded border border-border/60 px-2 py-0.5 text-[11px] uppercase tracking-wide text-muted-foreground">
                    {action.shortcut}
                  </span>
                )}
              </button>
            ))
          )}
        </div>
        <div className="border-t border-border/60 px-4 py-2 text-right text-xs text-muted-foreground">
          Press Esc to close
        </div>
      </div>
    </div>
  );
}
