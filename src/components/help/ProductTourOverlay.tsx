'use client';

import { useEffect, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChevronLeft, ChevronRight, Pin, PinOff, X } from 'lucide-react';

import { useProductTour } from '@/providers/ProductTourProvider';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

const markdownComponents = {
  h2: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2 className="text-lg font-semibold tracking-tight text-foreground" {...props} />
  ),
  h3: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 className="text-base font-semibold text-foreground" {...props} />
  ),
  p: (props: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className="text-sm leading-relaxed text-muted-foreground" {...props} />
  ),
  ul: (props: React.HTMLAttributes<HTMLUListElement>) => (
    <ul className="ml-5 list-disc space-y-2 text-sm text-muted-foreground" {...props} />
  ),
  ol: (props: React.HTMLAttributes<HTMLOListElement>) => (
    <ol className="ml-5 list-decimal space-y-2 text-sm text-muted-foreground" {...props} />
  ),
  li: (props: React.HTMLAttributes<HTMLLIElement>) => (
    <li className="leading-relaxed" {...props} />
  ),
  a: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
    const isInternal = props.href?.startsWith('/') ?? false;
    return (
      <a
        className="font-medium text-primary underline-offset-4 hover:underline"
        target={props.target ?? (isInternal ? undefined : '_blank')}
        rel={props.rel ?? (isInternal ? undefined : 'noreferrer')}
        {...props}
      />
    );
  },
  img: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className="rounded-lg border border-border/60"
      loading="lazy"
      decoding="async"
      {...props}
    />
  ),
  blockquote: (props: React.BlockquoteHTMLAttributes<HTMLQuoteElement>) => (
    <blockquote
      className="rounded-md border-l-4 border-primary/60 bg-muted/40 px-4 py-2 text-sm italic text-muted-foreground"
      {...props}
    />
  ),
  code: (props: React.HTMLAttributes<HTMLElement>) => (
    <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-primary" {...props} />
  ),
};

function TourLayout({
  onClose,
  onDockToggle,
  docked,
  children,
}: {
  onClose: () => void;
  onDockToggle: () => void;
  docked: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center justify-between border-b border-border/60 px-6 py-4">
        <div className="flex flex-col">
          <DialogTitle className="text-base font-semibold">OpenStrand product tour</DialogTitle>
          <p className="text-xs text-muted-foreground">
            Explore onboarding wizards, storage controls, and dashboard shortcuts without leaving
            the canvas.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onDockToggle}
            className="flex items-center gap-2"
          >
            {docked ? (
              <>
                <PinOff className="h-3.5 w-3.5" />
                Undock
              </>
            ) : (
              <>
                <Pin className="h-3.5 w-3.5" />
                Dock
              </>
            )}
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close tour">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="flex flex-1 overflow-hidden">{children}</div>
    </div>
  );
}

export function ProductTourOverlay() {
  const {
    isOpen,
    mode,
    closeTour,
    sections,
    currentSectionId,
    selectSection,
    goNext,
    goPrevious,
    canGoNext,
    canGoPrevious,
    setDocked,
    loading,
    error,
    retry,
  } = useProductTour();

  const currentSection = useMemo(() => {
    if (!currentSectionId) return null;
    return sections.find((section) => section.id === currentSectionId) ?? null;
  }, [currentSectionId, sections]);
  const [query, setQuery] = useState('');
  const filteredSections = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      return sections;
    }
    return sections.filter(
      (section) =>
        section.title.toLowerCase().includes(trimmed) ||
        section.content.toLowerCase().includes(trimmed),
    );
  }, [sections, query]);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
    }
  }, [isOpen]);

  const contentBody = (
    <>
      <aside className="hidden w-60 shrink-0 border-r border-border/60 bg-muted/30 md:flex md:flex-col">
        <div className="space-y-3 px-4 pb-4 pt-6">
          <Badge variant="outline" className="text-[11px] uppercase tracking-wide">
            Sections
          </Badge>
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search tour…"
            className="h-8 text-xs"
          />
        </div>
        <ScrollArea className="flex-1 px-2">
          <div className="space-y-1 pb-6">
            {filteredSections.length === 0 ? (
              <p className="px-3 text-xs text-muted-foreground">No matching sections.</p>
            ) : (
              filteredSections.map((section) => {
                const isActive = section.id === currentSectionId;
                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => selectSection(section.id)}
                    className={cn(
                      'w-full rounded-md px-3 py-2 text-left text-sm transition',
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                    )}
                  >
                    {section.title}
                  </button>
                );
              })
            )}
          </div>
        </ScrollArea>
      </aside>
      <section className="flex flex-1 flex-col">
        <ScrollArea className="flex-1 px-6 py-6">
          {loading ? (
            <div className="space-y-3">
              <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
              <div className="h-3 w-full animate-pulse rounded bg-muted" />
              <div className="h-3 w-5/6 animate-pulse rounded bg-muted" />
              <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-start gap-3 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <p>{error}</p>
              <Button size="sm" variant="outline" onClick={retry}>
                Retry
              </Button>
            </div>
          ) : currentSection ? (
            <article className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-foreground">{currentSection.title}</h2>
                <p className="text-sm text-muted-foreground">
                  Section {sections.findIndex((section) => section.id === currentSection.id) + 1} of{' '}
                  {sections.length}
                </p>
              </div>
              <ReactMarkdown
                className="prose prose-sm dark:prose-invert max-w-none"
                remarkPlugins={[remarkGfm]}
                components={markdownComponents}
              >
                {currentSection.content}
              </ReactMarkdown>
            </article>
          ) : (
            <p className="text-sm text-muted-foreground">
              Select a section from the list to begin the tour.
            </p>
          )}
        </ScrollArea>
        <footer className="flex shrink-0 items-center justify-between border-t border-border/60 px-6 py-4">
          <div className="text-xs text-muted-foreground">
            Use the sidebar or shortcuts below to move through the tour.
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goPrevious} disabled={!canGoPrevious}>
              <ChevronLeft className="mr-1 h-4 w-4" />
              Previous
            </Button>
            <Button variant="default" size="sm" onClick={goNext} disabled={!canGoNext}>
              Next
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </footer>
      </section>
    </>
  );

  const dockedContent = (
    <div className="pointer-events-auto fixed right-6 top-24 z-[80] flex h-[70vh] w-[420px] overflow-hidden rounded-2xl border border-border/60 bg-background shadow-2xl">
      <TourLayout onClose={closeTour} onDockToggle={() => setDocked(false)} docked>
        {contentBody}
      </TourLayout>
    </div>
  );

  if (!isOpen) {
    return null;
  }

  if (mode === 'docked') {
    return dockedContent;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => (open ? null : closeTour())}>
      <DialogContent className="h-[90vh] max-w-5xl overflow-hidden p-0">
        <TourLayout onClose={closeTour} onDockToggle={() => setDocked(true)} docked={false}>
          {contentBody}
        </TourLayout>
      </DialogContent>
    </Dialog>
  );
}
