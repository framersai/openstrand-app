'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Sparkles,
  Keyboard,
  Upload,
  Settings,
  BarChart3,
  Layers,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface TourStep {
  id: string;
  target: string; // CSS selector for the element to highlight
  title: string;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  icon?: React.ReactNode;
  spotlightPadding?: number;
  action?: {
    label: string;
    handler: () => void;
  };
}

const DEFAULT_TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    target: '[data-tour-id="dashboard-main"]',
    title: 'Welcome to OpenStrand!',
    content: 'Create AI-powered visualizations from your data. This quick tour will show you the essentials. Click outside or press Esc anytime to explore on your own.',
    position: 'auto',
    icon: <Sparkles className="h-5 w-5" />,
    spotlightPadding: 20,
  },
  {
    id: 'data-tab',
    target: '[data-tour-id="upload-tab"]',
    title: 'Upload Your Data',
    content: 'Start here! Upload CSV, JSON, or TSV files. You can also browse sample datasets and community content.',
    position: 'right',
    icon: <Upload className="h-5 w-5" />,
    spotlightPadding: 8,
  },
  {
    id: 'create-tab',
    target: '[data-tour-id="visualize-tab"]',
    title: 'Create Visualizations',
    content: 'Describe what you want in plain English. Try "Show sales by region as a bar chart" or use our quick presets.',
    position: 'right',
    icon: <BarChart3 className="h-5 w-5" />,
    spotlightPadding: 8,
  },
  {
    id: 'auto-insights',
    target: '[data-tour-id="auto-insights"]',
    title: 'AI Auto-Insights',
    content: 'Let AI analyze your data and suggest the best visualizations automatically. One click to discover patterns!',
    position: 'auto',
    icon: <Zap className="h-5 w-5" />,
    spotlightPadding: 12,
  },
  {
    id: 'visualization-area',
    target: '[data-tour-id="visualization-area"]',
    title: 'Your Visualizations',
    content: 'Charts appear here. Hover for options, click to expand, or drag to reorder. Export as PNG, SVG, or share links.',
    position: 'left',
    icon: <Layers className="h-5 w-5" />,
    spotlightPadding: 16,
  },
  {
    id: 'keyboard-shortcuts',
    target: '[data-tour-id="command-palette"]',
    title: 'Keyboard Power User',
    content: 'Press ⌘K (Ctrl+K on Windows) for the command palette. Search, navigate, and execute actions without touching your mouse.',
    position: 'bottom',
    icon: <Keyboard className="h-5 w-5" />,
    spotlightPadding: 8,
  },
  {
    id: 'settings',
    target: '.settings-button',
    title: 'Customize Settings',
    content: 'Configure AI providers, themes, languages, and keyboard shortcuts. Make OpenStrand work your way.',
    position: 'left',
    icon: <Settings className="h-5 w-5" />,
    spotlightPadding: 8,
  },
];

interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface TooltipPosition {
  top: number;
  left: number;
  arrowPosition: 'top' | 'bottom' | 'left' | 'right';
}

interface GuidedTourProps {
  steps?: TourStep[];
  onComplete?: () => void;
  onDismiss?: () => void;
  forceShow?: boolean;
  storageKey?: string;
}

export function GuidedTour({
  steps = DEFAULT_TOUR_STEPS,
  onComplete,
  onDismiss,
  forceShow = false,
  storageKey = 'guidedTourCompleted',
}: GuidedTourProps) {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [spotlight, setSpotlight] = useState<SpotlightRect | null>(null);
  const [tooltipPos, setTooltipPos] = useState<TooltipPosition | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  // Calculate best position for tooltip
  const calculateTooltipPosition = useCallback((
    targetRect: DOMRect,
    preferredPosition: TourStep['position'],
    tooltipWidth: number,
    tooltipHeight: number
  ): TooltipPosition => {
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
    };
    const padding = 16;
    const arrowOffset = 12;

    // Check available space in each direction
    const spaceTop = targetRect.top - padding;
    const spaceBottom = viewport.height - targetRect.bottom - padding;
    const spaceLeft = targetRect.left - padding;
    const spaceRight = viewport.width - targetRect.right - padding;

    // Determine best position
    let position = preferredPosition;
    if (position === 'auto' || !position) {
      // Find best position based on available space
      const spaces = [
        { pos: 'bottom' as const, space: spaceBottom },
        { pos: 'top' as const, space: spaceTop },
        { pos: 'right' as const, space: spaceRight },
        { pos: 'left' as const, space: spaceLeft },
      ];
      const best = spaces.reduce((a, b) => (a.space > b.space ? a : b));
      position = best.pos;
    }

    let top: number;
    let left: number;
    let arrowPosition: TooltipPosition['arrowPosition'];

    switch (position) {
      case 'top':
        top = targetRect.top - tooltipHeight - arrowOffset;
        left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
        arrowPosition = 'bottom';
        break;
      case 'bottom':
        top = targetRect.bottom + arrowOffset;
        left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
        arrowPosition = 'top';
        break;
      case 'left':
        top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2;
        left = targetRect.left - tooltipWidth - arrowOffset;
        arrowPosition = 'right';
        break;
      case 'right':
        top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2;
        left = targetRect.right + arrowOffset;
        arrowPosition = 'left';
        break;
      default:
        top = targetRect.bottom + arrowOffset;
        left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
        arrowPosition = 'top';
    }

    // Clamp to viewport
    top = Math.max(padding, Math.min(top, viewport.height - tooltipHeight - padding));
    left = Math.max(padding, Math.min(left, viewport.width - tooltipWidth - padding));

    return { top, left, arrowPosition };
  }, []);

  // Update spotlight and tooltip position
  const updatePositions = useCallback(() => {
    if (!isActive || !steps[currentStep]) return;

    const step = steps[currentStep];
    const target = document.querySelector(step.target) as HTMLElement;

    if (target) {
      const rect = target.getBoundingClientRect();
      const spotPadding = step.spotlightPadding ?? 8;

      setSpotlight({
        top: rect.top - spotPadding,
        left: rect.left - spotPadding,
        width: rect.width + spotPadding * 2,
        height: rect.height + spotPadding * 2,
      });

      // Scroll element into view if needed
      if (rect.top < 100 || rect.bottom > window.innerHeight - 100) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }

      // Calculate tooltip position
      const tooltipWidth = Math.min(360, window.innerWidth - 32);
      const tooltipHeight = 240; // Approximate
      const pos = calculateTooltipPosition(rect, step.position, tooltipWidth, tooltipHeight);
      setTooltipPos(pos);
    } else {
      // No target found - center the tooltip
      setSpotlight(null);
      setTooltipPos({
        top: window.innerHeight / 2 - 120,
        left: window.innerWidth / 2 - 180,
        arrowPosition: 'top',
      });
    }
  }, [isActive, currentStep, steps, calculateTooltipPosition]);

  // Initialize tour
  useEffect(() => {
    setIsMounted(true);
    if (typeof window === 'undefined') return undefined;

    const tourSeen = localStorage.getItem(storageKey);
    if (!tourSeen || forceShow) {
      const timer = setTimeout(() => setIsActive(true), 600);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [forceShow, storageKey]);

  // Update positions on step change or resize
  useEffect(() => {
    if (!isActive) return;

    updatePositions();

    // Listen for resize and scroll
    const handleUpdate = () => updatePositions();
    window.addEventListener('resize', handleUpdate);
    window.addEventListener('scroll', handleUpdate, true);

    // Watch for DOM changes
    resizeObserverRef.current = new ResizeObserver(handleUpdate);
    const step = steps[currentStep];
    if (step) {
      const target = document.querySelector(step.target);
      if (target) {
        resizeObserverRef.current.observe(target);
      }
    }

    return () => {
      window.removeEventListener('resize', handleUpdate);
      window.removeEventListener('scroll', handleUpdate, true);
      resizeObserverRef.current?.disconnect();
    };
  }, [isActive, currentStep, steps, updatePositions]);

  const handleComplete = useCallback(() => {
    setIsActive(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, 'true');
    }
    onComplete?.();
  }, [onComplete, storageKey]);

  const handleDismiss = useCallback(() => {
    setIsActive(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, 'true');
    }
    onDismiss?.();
  }, [onDismiss, storageKey]);

  const handleNext = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  }, [currentStep, steps.length, handleComplete]);

  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  // Keyboard navigation
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleDismiss();
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, handleDismiss, handleNext, handlePrev]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    // Only dismiss if clicking the overlay, not the spotlight area
    if (e.target === e.currentTarget) {
      handleDismiss();
    }
  };

  if (!isMounted || !isActive) return null;

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;

  const tourContent = (
    <>
      {/* SVG Overlay with spotlight cutout */}
      <svg
        className="fixed inset-0 z-[9998] pointer-events-none"
        style={{ width: '100%', height: '100%' }}
      >
        <defs>
          <mask id="spotlight-mask">
            <rect width="100%" height="100%" fill="white" />
            {spotlight && (
              <rect
                x={spotlight.left}
                y={spotlight.top}
                width={spotlight.width}
                height={spotlight.height}
                rx="12"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          className="fill-black/50 dark:fill-black/60"
          mask="url(#spotlight-mask)"
          style={{ pointerEvents: 'auto' }}
          onClick={handleOverlayClick}
        />
      </svg>

      {/* Spotlight ring highlight */}
      {spotlight && (
        <div
          className="fixed z-[9998] pointer-events-none rounded-xl ring-2 ring-primary ring-offset-2 ring-offset-transparent animate-pulse"
          style={{
            top: spotlight.top,
            left: spotlight.left,
            width: spotlight.width,
            height: spotlight.height,
          }}
        />
      )}

      {/* Tooltip */}
      {tooltipPos && (
        <div
          ref={tooltipRef}
          className={cn(
            "fixed z-[9999]",
            "w-[calc(100vw-2rem)] max-w-[360px]",
            "animate-in fade-in-0 slide-in-from-bottom-2 duration-200",
            // Mobile: bottom sheet
            isMobile && "!bottom-4 !left-1/2 !-translate-x-1/2 !top-auto"
          )}
          style={!isMobile ? {
            top: tooltipPos.top,
            left: tooltipPos.left,
          } : undefined}
          role="dialog"
          aria-modal="true"
          aria-labelledby="tour-title"
        >
          {/* Arrow */}
          {!isMobile && spotlight && (
            <div
              className={cn(
                "absolute w-3 h-3 bg-card rotate-45 border-border/50",
                tooltipPos.arrowPosition === 'top' && "top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 border-l border-t",
                tooltipPos.arrowPosition === 'bottom' && "bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 border-r border-b",
                tooltipPos.arrowPosition === 'left' && "left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 border-l border-b",
                tooltipPos.arrowPosition === 'right' && "right-0 top-1/2 translate-x-1/2 -translate-y-1/2 border-r border-t"
              )}
            />
          )}

          <div className={cn(
            "rounded-2xl overflow-hidden",
            "bg-card",
            "border border-border/50",
            "shadow-2xl shadow-black/20"
          )}>
            {/* Accent bar */}
            <div className="h-1 bg-gradient-to-r from-primary via-primary/80 to-primary/60" />

            <div className="p-4 sm:p-5">
              {/* Header */}
              <div className="flex items-start gap-3 mb-3">
                {step.icon && (
                  <div className={cn(
                    "h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0",
                    "bg-primary/10 text-primary"
                  )}>
                    {step.icon}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3
                    id="tour-title"
                    className="font-semibold text-base text-foreground leading-tight"
                  >
                    {step.title}
                  </h3>
                  <Badge
                    variant="secondary"
                    className="mt-1 text-[10px] font-medium bg-muted/80 text-muted-foreground"
                  >
                    {currentStep + 1} of {steps.length}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDismiss}
                  className="h-8 w-8 rounded-lg flex-shrink-0 -mr-1 -mt-1 text-muted-foreground hover:text-foreground"
                  aria-label="Close tour"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Content */}
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                {step.content}
              </p>

              {/* Action button */}
              {step.action && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={step.action.handler}
                  className="w-full mb-3"
                >
                  {step.action.label}
                </Button>
              )}

              {/* Progress */}
              <div className="mb-3">
                <div className="h-1 bg-muted/50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-300"
                    style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePrev}
                  disabled={currentStep === 0}
                  className="h-9 px-3 text-muted-foreground hover:text-foreground disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>

                {/* Step dots */}
                <div className="flex gap-1.5 max-sm:hidden">
                  {steps.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentStep(index)}
                      className={cn(
                        "h-2 rounded-full transition-all duration-200",
                        index === currentStep
                          ? "w-5 bg-primary"
                          : index < currentStep
                          ? "w-2 bg-primary/50 hover:bg-primary/70"
                          : "w-2 bg-muted hover:bg-muted-foreground/30"
                      )}
                      aria-label={`Go to step ${index + 1}`}
                    />
                  ))}
                </div>

                <Button
                  variant={isLastStep ? 'default' : 'ghost'}
                  size="sm"
                  onClick={handleNext}
                  className={cn(
                    "h-9 px-3",
                    isLastStep
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {isLastStep ? 'Get Started' : (
                    <>
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </>
                  )}
                </Button>
              </div>

              {/* Keyboard hint */}
              <p className="text-[10px] text-muted-foreground/60 text-center mt-2 max-sm:hidden">
                ← → to navigate • Esc to close • Click outside to dismiss
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );

  // Use portal to render at document root
  return createPortal(tourContent, document.body);
}

// Reusable tour trigger button for help menus
export function TourTriggerButton({
  onClick,
  className,
  variant = 'ghost',
  size = 'sm',
  showLabel = true,
}: {
  onClick: () => void;
  className?: string;
  variant?: 'ghost' | 'outline' | 'default';
  size?: 'sm' | 'default' | 'lg' | 'icon';
  showLabel?: boolean;
}) {
  return (
    <Button
      variant={variant}
      size={size}
      onClick={onClick}
      className={cn("gap-1.5", className)}
    >
      <HelpCircle className="h-4 w-4" />
      {showLabel && <span>Take a Tour</span>}
    </Button>
  );
}

// Hook to control tour programmatically
export function useTourController(storageKey = 'guidedTourCompleted') {
  const [showTour, setShowTour] = useState(false);

  const startTour = useCallback(() => {
    setShowTour(true);
  }, []);

  const resetTour = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(storageKey);
    }
    setShowTour(true);
  }, [storageKey]);

  const endTour = useCallback(() => {
    setShowTour(false);
  }, []);

  return {
    showTour,
    startTour,
    resetTour,
    endTour,
    TourComponent: showTour ? (
      <GuidedTour
        forceShow
        storageKey={storageKey}
        onComplete={endTour}
        onDismiss={endTour}
      />
    ) : null,
  };
}

// Legacy export for backwards compatibility
export function TourActivationButton() {
  const { startTour, TourComponent } = useTourController();

  return (
    <>
      <TourTriggerButton onClick={startTour} showLabel={false} size="sm" className="h-8 px-2" />
      {TourComponent}
    </>
  );
}
