import { Skeleton } from '@/components/ui/skeleton';

/**
 * Dashboard Loading Skeleton
 * Shows immediately while the dashboard page loads
 * Prevents layout shift and provides visual feedback
 */
export default function DashboardLoading() {
  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col bg-background">
      {/* Header Skeleton */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/95 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-3">
          <div className="flex w-full items-center gap-4">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <Skeleton className="h-12 w-12 rounded-2xl" />
              <div className="flex flex-col gap-1">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
            
            {/* Nav items - hidden on mobile */}
            <div className="hidden lg:flex items-center gap-4 flex-1 justify-center">
              <Skeleton className="h-8 w-20 rounded-full" />
              <Skeleton className="h-8 w-20 rounded-full" />
              <Skeleton className="h-8 w-20 rounded-full" />
              <Skeleton className="h-8 w-20 rounded-full" />
            </div>
            
            {/* Right side actions */}
            <div className="flex items-center gap-2 ml-auto">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <Skeleton className="h-8 w-8 rounded-lg" />
              <Skeleton className="h-8 w-20 rounded-lg hidden sm:block" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Skeleton - hidden on mobile */}
        <aside className="hidden md:flex flex-col w-72 lg:w-80 xl:w-[340px] border-r border-border/40 bg-card/50">
          {/* Sidebar header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-border/40">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-7 w-7 rounded-md" />
          </div>
          
          {/* Tab triggers */}
          <div className="mx-3 mt-3">
            <div className="grid grid-cols-2 gap-1 p-1 bg-muted/50 rounded-lg">
              <Skeleton className="h-8 rounded-md" />
              <Skeleton className="h-8 rounded-md" />
            </div>
          </div>
          
          {/* Tab content */}
          <div className="flex-1 p-3 space-y-4">
            {/* Upload area skeleton */}
            <div className="border-2 border-dashed border-border/50 rounded-xl p-6 flex flex-col items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
            
            {/* Dataset info skeleton */}
            <div className="space-y-3">
              <Skeleton className="h-4 w-24" />
              <div className="space-y-2">
                <Skeleton className="h-12 w-full rounded-lg" />
                <Skeleton className="h-12 w-full rounded-lg" />
                <Skeleton className="h-12 w-full rounded-lg" />
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col overflow-hidden bg-muted/20">
          {/* Compact header bar */}
          <header className="flex-shrink-0 flex items-center gap-2 px-3 sm:px-4 lg:px-6 py-2 border-b border-border/40 bg-background/80 backdrop-blur-sm">
            {/* Mobile menu button */}
            <Skeleton className="h-8 w-8 rounded-md md:hidden" />
            
            {/* Dataset info */}
            <div className="flex items-center gap-2 flex-1">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <div className="flex-1 min-w-0">
                <Skeleton className="h-4 w-32 mb-1" />
                <Skeleton className="h-3 w-20 hidden sm:block" />
              </div>
            </div>
            
            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-16 rounded-md" />
              <Skeleton className="h-8 w-20 rounded-md" />
            </div>
          </header>

          {/* Visualization area skeleton */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6">
            {/* Empty state or loading grid */}
            <div className="h-full flex flex-col items-center justify-center gap-4 text-center">
              {/* Animated loading indicator */}
              <div className="relative">
                <Skeleton className="h-16 w-16 rounded-2xl" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                </div>
              </div>
              
              <div className="space-y-2">
                <Skeleton className="h-5 w-40 mx-auto" />
                <Skeleton className="h-4 w-56 mx-auto" />
              </div>
              
              {/* Action buttons skeleton */}
              <div className="flex flex-wrap gap-2 justify-center mt-2">
                <Skeleton className="h-10 w-32 rounded-lg" />
                <Skeleton className="h-10 w-28 rounded-lg" />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

