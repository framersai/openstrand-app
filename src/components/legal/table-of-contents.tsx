'use client';

import { cn } from '@/lib/utils';

import type { TocItem } from './legal-page-layout';

interface TableOfContentsProps {
  items: TocItem[];
  className?: string;
}

export function TableOfContents({ items, className }: TableOfContentsProps) {
  if (!items.length) {
    return null;
  }

  return (
    <nav aria-label="On this page" className={cn('space-y-4', className)}>
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
        On this page
      </p>
      <ul className="space-y-2 text-sm">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className="text-foreground transition hover:text-primary"
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
