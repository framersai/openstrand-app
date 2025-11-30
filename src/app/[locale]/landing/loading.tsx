import { Skeleton } from '@/components/ui/skeleton';

/**
 * Landing Page Loading Skeleton
 * Shows immediately while the landing page loads
 * Matches the landing page layout to prevent layout shift
 */
export default function LandingLoading() {
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
            <div className="hidden lg:flex items-center gap-6 flex-1 justify-center">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
            </div>
            
            {/* Right side actions */}
            <div className="flex items-center gap-2 ml-auto">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <Skeleton className="h-8 w-8 rounded-lg" />
              <Skeleton className="h-9 w-24 rounded-lg hidden sm:block" />
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section Skeleton */}
      <section className="relative py-16 sm:py-20 lg:py-28">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            {/* Badge */}
            <Skeleton className="h-7 w-48 mx-auto rounded-full" />
            
            {/* Headline */}
            <div className="space-y-3">
              <Skeleton className="h-12 sm:h-16 w-full max-w-2xl mx-auto" />
              <Skeleton className="h-12 sm:h-16 w-3/4 mx-auto" />
            </div>
            
            {/* Subheadline */}
            <div className="space-y-2 max-w-2xl mx-auto">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-4/5 mx-auto" />
            </div>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
              <Skeleton className="h-12 w-40 rounded-lg" />
              <Skeleton className="h-12 w-36 rounded-lg" />
            </div>
            
            {/* Trust indicators */}
            <div className="flex flex-wrap gap-4 justify-center pt-6">
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-6 w-28 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section Skeleton */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          {/* Section header */}
          <div className="text-center mb-12 space-y-3">
            <Skeleton className="h-6 w-32 mx-auto rounded-full" />
            <Skeleton className="h-10 w-64 mx-auto" />
            <Skeleton className="h-5 w-96 max-w-full mx-auto" />
          </div>
          
          {/* Feature cards grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-card rounded-xl p-6 border border-border/50">
                <Skeleton className="h-12 w-12 rounded-xl mb-4" />
                <Skeleton className="h-6 w-40 mb-2" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-4/5" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Visualization Showcase Skeleton */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 space-y-3">
            <Skeleton className="h-6 w-28 mx-auto rounded-full" />
            <Skeleton className="h-10 w-72 mx-auto" />
          </div>
          
          {/* Chart preview skeleton */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-card rounded-2xl border border-border/50 p-6">
              <div className="flex items-center gap-3 mb-6">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div>
                  <Skeleton className="h-5 w-48 mb-1" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
              <Skeleton className="h-64 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section Skeleton */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 space-y-3">
            <Skeleton className="h-6 w-24 mx-auto rounded-full" />
            <Skeleton className="h-10 w-56 mx-auto" />
          </div>
          
          {/* Pricing cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card rounded-xl p-6 border border-border/50">
                <Skeleton className="h-6 w-24 mb-2" />
                <Skeleton className="h-10 w-20 mb-4" />
                <div className="space-y-2 mb-6">
                  {[1, 2, 3, 4].map((j) => (
                    <Skeleton key={j} className="h-4 w-full" />
                  ))}
                </div>
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

