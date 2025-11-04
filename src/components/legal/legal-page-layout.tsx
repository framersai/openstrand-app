'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';

import { cn } from '@/lib/utils';
import { TableOfContents } from './table-of-contents';

export interface TocItem {
  id: string;
  label: string;
}

interface LegalPageLayoutProps {
  title: string;
  description?: string;
  lastUpdated?: string;
  children: ReactNode;
  toc?: TocItem[];
  className?: string;
}

export function LegalPageLayout({
  title,
  description,
  lastUpdated,
  toc = [],
  children,
  className,
}: LegalPageLayoutProps) {
  return (
    <div className={cn('bg-background text-foreground', className)}>
      <a
        href="#legal-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:rounded focus:bg-primary/10 focus:px-4 focus:py-2 focus:text-sm focus:text-primary"
      >
        Skip to content
      </a>
      <header className="border-b border-border/40 bg-muted/20">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-3xl space-y-4">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
            {description ? (
              <p className="text-base text-muted-foreground">{description}</p>
            ) : null}
            {lastUpdated ? (
              <p className="text-sm text-muted-foreground">
                Last updated:{' '}
                <time dateTime={lastUpdated}>{lastUpdated}</time>
              </p>
            ) : null}
          </div>
        </div>
      </header>
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(220px,280px)]">
          <article
            id="legal-content"
            className="prose prose-sm max-w-none text-foreground dark:prose-invert sm:prose-base lg:prose-lg"
          >
            {children}
          </article>
          <aside className="top-4 self-start border border-border/40 bg-muted/10 p-4 shadow-sm lg:sticky">
            <TableOfContents items={toc} />
            <div className="mt-6 space-y-3 border-t border-border/40 pt-4 text-sm text-muted-foreground">
              <p className="font-semibold text-foreground">Need help?</p>
              <p>
                Reach out at{' '}
                <Link href="mailto:privacy@frame.dev" className="text-primary underline-offset-4 hover:underline">
                  privacy@frame.dev
                </Link>{' '}
                for privacy questions or{' '}
                <Link href="mailto:legal@frame.dev" className="text-primary underline-offset-4 hover:underline">
                  legal@frame.dev
                </Link>{' '}
                for compliance requests.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
