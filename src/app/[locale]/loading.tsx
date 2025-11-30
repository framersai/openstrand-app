import { Skeleton } from '@/components/ui/skeleton';

/**
 * Root Page Loading
 * Shows while redirecting to landing page
 */
export default function RootLoading() {
  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col bg-background">
      {/* Header Skeleton */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/95 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-3">
          <div className="flex w-full items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-2xl" />
            <div className="flex flex-col gap-1">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
            <div className="flex-1" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <Skeleton className="h-8 w-20 rounded-lg" />
            </div>
          </div>
        </div>
      </header>

      {/* Content skeleton with centered loading */}
      <main className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-12 w-12 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
          <Skeleton className="h-4 w-32" />
        </div>
      </main>
    </div>
  );
}

