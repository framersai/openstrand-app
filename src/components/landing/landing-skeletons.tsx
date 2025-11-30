'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface SectionSkeletonProps {
  className?: string;
}

/**
 * Skeleton for the Hero section
 */
export function HeroSkeleton({ className }: SectionSkeletonProps) {
  return (
    <section className={cn('landing-section hero-section relative overflow-hidden py-12 lg:py-16', className)}>
      <div className="container relative z-10 mx-auto grid gap-12 px-4 lg:grid-cols-2 lg:items-center">
        {/* Left content */}
        <div className="space-y-6">
          {/* Badges */}
          <div className="flex flex-wrap items-center gap-3">
            <Skeleton className="h-8 w-40 rounded-full" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>

          {/* Headline */}
          <div className="space-y-3">
            <Skeleton className="h-12 w-full max-w-lg" />
            <Skeleton className="h-12 w-4/5 max-w-md" />
          </div>

          {/* Subheadline */}
          <div className="space-y-2">
            <Skeleton className="h-5 w-full max-w-xl" />
            <Skeleton className="h-5 w-3/4 max-w-lg" />
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-wrap gap-3">
            <Skeleton className="h-12 w-44 rounded-lg" />
            <Skeleton className="h-12 w-48 rounded-lg" />
          </div>

          {/* Feature highlights */}
          <div className="space-y-3 pt-4">
            <Skeleton className="h-4 w-32" />
            <div className="grid gap-3 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3 rounded-xl border border-border/30 p-3">
                  <Skeleton className="h-10 w-10 rounded-lg flex-shrink-0" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right content - Demo card */}
        <div className="relative lg:pl-8">
          <div className="rounded-3xl border border-border/50 bg-card/80 overflow-hidden">
            {/* Card header */}
            <div className="border-b border-border/30 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-xl" />
                  <div className="space-y-1">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            </div>

            {/* Card content */}
            <div className="p-6 space-y-6">
              {/* Data flow */}
              <div>
                <Skeleton className="h-3 w-32 mb-3" />
                <div className="flex items-center justify-between">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex flex-col items-center gap-2">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <Skeleton className="h-3 w-12" />
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA button */}
              <Skeleton className="h-12 w-full rounded-lg" />

              {/* Trust badges */}
              <div className="flex items-center justify-center gap-6">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Skeleton for the Features section
 */
export function FeaturesSkeleton({ className }: SectionSkeletonProps) {
  return (
    <section className={cn('landing-section py-24', className)}>
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center mb-16">
          <Skeleton className="h-4 w-48 mx-auto mb-4" />
          <Skeleton className="h-10 w-96 mx-auto mb-4" />
          <Skeleton className="h-6 w-80 mx-auto" />
        </div>

        {/* Feature cards grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-3xl border border-border/60 bg-background/80 p-6"
            >
              <Skeleton className="h-6 w-20 mb-4 rounded-full" />
              <Skeleton className="h-6 w-full mb-2" />
              <Skeleton className="h-4 w-full mb-1" />
              <Skeleton className="h-4 w-3/4 mb-4" />
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, j) => (
                  <Skeleton key={j} className="h-3 w-full" />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Technical features grid */}
        <div className="mt-16 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-border/40 bg-background/60 p-4"
            >
              <Skeleton className="h-5 w-32 mb-2" />
              <Skeleton className="h-4 w-full mb-1" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * Skeleton for the Interactive Examples section
 */
export function InteractiveExamplesSkeleton({ className }: SectionSkeletonProps) {
  return (
    <section className={cn('landing-section py-16', className)}>
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center mb-12">
          <Skeleton className="h-4 w-40 mx-auto mb-4" />
          <Skeleton className="h-9 w-80 mx-auto mb-4" />
          <Skeleton className="h-5 w-96 mx-auto" />
        </div>

        {/* Demo tabs */}
        <div className="flex justify-center gap-2 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-28 rounded-lg" />
          ))}
        </div>

        {/* Demo content area */}
        <div className="mx-auto max-w-5xl">
          <div className="rounded-3xl border border-border/60 bg-background/80 p-8 min-h-[400px]">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <div className="pt-4 space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full rounded-xl" />
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-border/40 bg-muted/20 p-6">
                <Skeleton className="h-full min-h-[300px] rounded-xl" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Skeleton for the Visualization Showcase section
 */
export function VisualizationShowcaseSkeleton({ className }: SectionSkeletonProps) {
  return (
    <section className={cn('landing-section py-24 bg-muted/10', className)}>
      <div className="container mx-auto px-4">
        <div className="grid gap-12 lg:grid-cols-[1fr,1.2fr] lg:items-center">
          {/* Left side - content */}
          <div className="space-y-6">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-10 w-full max-w-md" />
            <Skeleton className="h-5 w-full max-w-lg" />

            {/* Advantages card */}
            <div className="rounded-2xl border border-border/60 bg-background/80 p-6">
              <div className="grid gap-4 sm:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Skeleton className="h-5 w-5 mt-1 rounded" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-24 mb-1" />
                      <Skeleton className="h-3 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Theme selector */}
            <div className="space-y-3">
              <Skeleton className="h-4 w-32" />
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 9 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-20 rounded-md" />
                ))}
              </div>
            </div>
          </div>

          {/* Right side - preview */}
          <div className="relative">
            <div className="rounded-3xl border border-border/60 bg-background/90 overflow-hidden">
              <div className="border-b border-border/50 bg-background/90 px-6 py-4">
                <Skeleton className="h-4 w-32 mb-1" />
                <Skeleton className="h-3 w-48" />
              </div>
              <div className="aspect-[16/10] p-8">
                <Skeleton className="h-6 w-32 rounded-full mb-6" />
                <Skeleton className="h-48 w-full rounded-2xl" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Skeleton for the Pricing section
 */
export function PricingSkeleton({ className }: SectionSkeletonProps) {
  return (
    <section className={cn('landing-section py-24', className)}>
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center mb-16">
          <Skeleton className="h-6 w-56 mx-auto mb-4 rounded-full" />
          <Skeleton className="h-10 w-80 mx-auto mb-4" />
          <Skeleton className="h-5 w-96 mx-auto" />
        </div>

        {/* Pricing cards */}
        <div className="grid gap-6 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="relative rounded-3xl border border-border/60 bg-background/95 p-8"
            >
              <Skeleton className="absolute right-6 top-6 h-6 w-24 rounded-full" />
              <Skeleton className="h-6 w-40 mb-2" />
              <Skeleton className="h-4 w-full mb-6" />
              <div className="flex items-baseline gap-2 mb-6">
                <Skeleton className="h-10 w-20" />
                <Skeleton className="h-4 w-24" />
              </div>
              <div className="space-y-3 mb-8">
                {Array.from({ length: 8 }).map((_, j) => (
                  <div key={j} className="flex items-start gap-3">
                    <Skeleton className="h-4 w-4 mt-0.5 rounded" />
                    <Skeleton className="h-4 flex-1" />
                  </div>
                ))}
              </div>
              <Skeleton className="h-12 w-full rounded-lg" />
            </div>
          ))}
        </div>

        {/* Stats bar */}
        <div className="mt-16 rounded-3xl border border-border/60 bg-muted/20 p-8">
          <div className="grid gap-6 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-6 w-6 rounded" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-24 mb-1" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Skeleton for the Testimonials section
 */
export function TestimonialsSkeleton({ className }: SectionSkeletonProps) {
  return (
    <section className={cn('landing-section py-24 bg-muted/10', className)}>
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center mb-16">
          <Skeleton className="h-4 w-48 mx-auto mb-4" />
          <Skeleton className="h-10 w-72 mx-auto mb-4" />
          <Skeleton className="h-5 w-96 mx-auto" />
        </div>

        {/* Stats row */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4 mb-16">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="text-center rounded-2xl border border-border/40 bg-background/60 p-6"
            >
              <Skeleton className="h-10 w-20 mx-auto mb-2" />
              <Skeleton className="h-4 w-24 mx-auto" />
            </div>
          ))}
        </div>

        {/* Featured testimonial */}
        <div className="mx-auto max-w-4xl mb-12">
          <div className="rounded-3xl border border-border/60 bg-background/80 p-8">
            <div className="flex gap-1 mb-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-5 w-5 rounded" />
              ))}
            </div>
            <Skeleton className="h-6 w-full mb-2" />
            <Skeleton className="h-6 w-3/4 mb-6" />
            <div className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div>
                <Skeleton className="h-4 w-32 mb-1" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
          </div>
        </div>

        {/* Testimonial cards */}
        <div className="grid gap-6 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-3xl border border-border/60 bg-background/80 p-6"
            >
              <div className="flex gap-1 mb-4">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Skeleton key={j} className="h-4 w-4 rounded" />
                ))}
              </div>
              <Skeleton className="h-4 w-full mb-1" />
              <Skeleton className="h-4 w-full mb-1" />
              <Skeleton className="h-4 w-2/3 mb-6" />
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div>
                  <Skeleton className="h-4 w-24 mb-1" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * Skeleton for the CTA section
 */
export function CTASkeleton({ className }: SectionSkeletonProps) {
  return (
    <section className={cn('landing-section pb-24', className)}>
      <div className="container mx-auto px-4">
        <div className="rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/10 p-12">
          <div className="mx-auto max-w-3xl text-center space-y-6">
            <Skeleton className="h-8 w-48 mx-auto rounded-full" />
            <Skeleton className="h-10 w-80 mx-auto" />
            <Skeleton className="h-5 w-96 mx-auto" />
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row pt-4">
              <Skeleton className="h-12 w-44 rounded-lg" />
              <Skeleton className="h-12 w-36 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Skeleton for the Spiral Curriculum section
 */
export function SpiralCurriculumSkeleton({ className }: SectionSkeletonProps) {
  return (
    <section className={cn('landing-section py-24', className)}>
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center mb-16">
          <Skeleton className="h-4 w-40 mx-auto mb-4" />
          <Skeleton className="h-10 w-96 mx-auto mb-4" />
          <Skeleton className="h-5 w-80 mx-auto" />
        </div>

        {/* Spiral visualization placeholder */}
        <div className="mx-auto max-w-4xl">
          <div className="rounded-3xl border border-border/60 bg-background/80 p-8">
            <div className="flex justify-center mb-8">
              <Skeleton className="h-64 w-64 rounded-full" />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-border/40 bg-muted/20 p-4 text-center"
                >
                  <Skeleton className="h-10 w-10 mx-auto mb-3 rounded-full" />
                  <Skeleton className="h-5 w-24 mx-auto mb-2" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

