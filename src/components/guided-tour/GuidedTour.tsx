'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Info,
  HelpCircle,
  Book,
  Lightbulb,
  Target,
  Sparkles,
  Keyboard,
  Upload,
  Settings,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface TourStep {
  id: string;
  target: string;
  title: string;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  icon?: React.ReactNode;
  action?: {
    label: string;
    handler: () => void;
  };
}

const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    target: 'body',
    title: 'Welcome to OpenStrand!',
    content: 'Let\'s take a quick tour to help you get started with AI-powered data visualization. You can press Escape or click outside to skip anytime.',
    position: 'center',
    icon: <Sparkles className="h-5 w-5" />,
  },
  {
    id: 'keyboard-shortcuts',
    target: 'body',
    title: 'Keyboard Power User',
    content: 'Press ⌘K (Ctrl+K on Windows) to open the command palette. Navigate anywhere, trigger any action, and search everything—all from your keyboard!',
    position: 'center',
    icon: <Keyboard className="h-5 w-5" />,
  },
  {
    id: 'upload',
    target: '[data-tour-id="upload-tab"]',
    title: 'Upload Your Data',
    content: 'Start by uploading a CSV, TSV, or JSON file. You can also use our sample datasets to explore the platform.',
    position: 'right',
    icon: <Upload className="h-5 w-5" />,
  },
  {
    id: 'visualize',
    target: '[data-tour-id="visualize-tab"]',
    title: 'Create Visualizations',
    content: 'Use natural language to describe what you want to see. Our AI will analyze your data and create the perfect visualization.',
    position: 'right',
    icon: <Target className="h-5 w-5" />,
  },
  {
    id: 'quick-actions',
    target: '[data-tour-id="quick-actions"]',
    title: 'Quick Actions & Presets',
    content: 'Use pre-configured templates for common visualizations, or run AI-powered Auto Insights to get smart suggestions.',
    position: 'top',
    icon: <Lightbulb className="h-5 w-5" />,
  },
  {
    id: 'catalog',
    target: 'a[href*="catalogs"]',
    title: 'Explore Dataset Catalog',
    content: 'Browse community-curated datasets with advanced filtering, tags, and search capabilities.',
    position: 'bottom',
    icon: <Book className="h-5 w-5" />,
  },
  {
    id: 'settings',
    target: '.settings-button',
    title: 'Customize Your Experience',
    content: 'Configure AI providers, choose your preferred theme, set language preferences, and customize keyboard shortcuts.',
    position: 'left',
    icon: <Settings className="h-5 w-5" />,
  },
];

interface GuidedTourProps {
  onComplete?: () => void;
  forceShow?: boolean;
}

export function GuidedTour({ onComplete, forceShow = false }: GuidedTourProps) {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [tooltipPosition, setTooltipPosition] = useState({ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' });
  const [isMobile, setIsMobile] = useState(false);

  // Check for mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const calculatePosition = useCallback((step: TourStep) => {
    if (step.position === 'center' || isMobile) {
      return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    }

    const target = document.querySelector(step.target) as HTMLElement;
    if (!target) {
      return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    }

    const rect = target.getBoundingClientRect();
    const tooltipWidth = 380;
    const tooltipHeight = 280;
    const padding = 16;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let top: string;
    let left: string;
    let transform = '';

    switch (step.position) {
      case 'top':
        top = `${Math.max(padding, rect.top - tooltipHeight - padding)}px`;
        left = `${Math.min(Math.max(padding, rect.left + rect.width / 2 - tooltipWidth / 2), viewportWidth - tooltipWidth - padding)}px`;
        break;
      case 'bottom':
        top = `${Math.min(rect.bottom + padding, viewportHeight - tooltipHeight - padding)}px`;
        left = `${Math.min(Math.max(padding, rect.left + rect.width / 2 - tooltipWidth / 2), viewportWidth - tooltipWidth - padding)}px`;
        break;
      case 'left':
        top = `${Math.min(Math.max(padding, rect.top + rect.height / 2 - tooltipHeight / 2), viewportHeight - tooltipHeight - padding)}px`;
        left = `${Math.max(padding, rect.left - tooltipWidth - padding)}px`;
        break;
      case 'right':
        top = `${Math.min(Math.max(padding, rect.top + rect.height / 2 - tooltipHeight / 2), viewportHeight - tooltipHeight - padding)}px`;
        left = `${Math.min(rect.right + padding, viewportWidth - tooltipWidth - padding)}px`;
        break;
      default:
        top = '50%';
        left = '50%';
        transform = 'translate(-50%, -50%)';
    }

    return { top, left, transform };
  }, [isMobile]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const tourSeen = localStorage.getItem('guidedTourCompleted');
    if (!tourSeen || forceShow) {
      setTimeout(() => setIsActive(true), 500);
    }
  }, [forceShow]);

  useEffect(() => {
    if (isActive && TOUR_STEPS[currentStep]) {
      const newPosition = calculatePosition(TOUR_STEPS[currentStep]);
      setTooltipPosition(newPosition);
    }
  }, [isActive, currentStep, calculatePosition, isMobile]);

  const handleComplete = useCallback(() => {
    setIsActive(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem('guidedTourCompleted', 'true');
    }
    onComplete?.();
  }, [onComplete]);

  const handleSkip = useCallback(() => {
    handleComplete();
  }, [handleComplete]);

  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        handleSkip();
      } else if (event.key === 'ArrowRight' || event.key === 'Enter') {
        event.preventDefault();
        if (currentStep < TOUR_STEPS.length - 1) {
          setCurrentStep(currentStep + 1);
        } else {
          handleComplete();
        }
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        if (currentStep > 0) {
          setCurrentStep(currentStep - 1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, handleSkip, handleComplete, currentStep]);

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const step = TOUR_STEPS[currentStep];

  if (!isActive) return null;

  return (
    <>
      {/* Overlay - theme-aware with subtle blur */}
      <div
        className={cn(
          "fixed inset-0 z-[9998]",
          "bg-background/60 dark:bg-background/70",
          "backdrop-blur-[2px]",
          "transition-opacity duration-300"
        )}
        onClick={handleSkip}
        aria-label="Close tour"
      />

      {/* Tour Card */}
      <div
        className={cn(
          "fixed z-[9999] w-[calc(100vw-2rem)] max-w-[380px]",
          // Mobile: bottom sheet style
          "max-sm:bottom-4 max-sm:left-1/2 max-sm:-translate-x-1/2 max-sm:w-[calc(100vw-2rem)]",
          // Animation
          "animate-in fade-in-0 zoom-in-95 duration-200"
        )}
        style={!isMobile ? {
          top: tooltipPosition.top,
          left: tooltipPosition.left,
          transform: tooltipPosition.transform || undefined,
        } : undefined}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-title"
      >
        <div className={cn(
          "rounded-2xl overflow-hidden",
          "bg-card dark:bg-card",
          "border border-border/50 dark:border-border/30",
          "shadow-xl dark:shadow-2xl dark:shadow-black/20",
          "ring-1 ring-primary/10"
        )}>
          {/* Gradient accent bar */}
          <div className="h-1 bg-gradient-to-r from-primary via-primary/80 to-primary/60" />
          
          <div className="p-5 sm:p-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                {step.icon && (
                  <div className={cn(
                    "h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0",
                    "bg-primary/10 dark:bg-primary/20",
                    "text-primary"
                  )}>
                    {step.icon}
                  </div>
                )}
                <div>
                  <h3 
                    id="tour-title"
                    className="font-semibold text-base sm:text-lg text-foreground leading-tight"
                  >
                    {step.title}
                  </h3>
                  <Badge 
                    variant="secondary" 
                    className={cn(
                      "mt-1.5 text-[10px] font-medium",
                      "bg-muted/80 dark:bg-muted/50",
                      "text-muted-foreground"
                    )}
                  >
                    {currentStep + 1} of {TOUR_STEPS.length}
                  </Badge>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSkip}
                className={cn(
                  "h-8 w-8 rounded-lg flex-shrink-0 -mr-1 -mt-1",
                  "text-muted-foreground hover:text-foreground",
                  "hover:bg-muted/80 dark:hover:bg-muted/50"
                )}
                aria-label="Close tour (Esc)"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Content */}
            <p className="text-sm text-muted-foreground leading-relaxed mb-5">
              {step.content}
            </p>

            {/* Action button if provided */}
            {step.action && (
              <Button
                variant="outline"
                size="sm"
                onClick={step.action.handler}
                className="w-full mb-4 h-10"
              >
                {step.action.label}
              </Button>
            )}

            {/* Progress bar */}
            <div className="mb-4">
              <div className="h-1 bg-muted/50 dark:bg-muted/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${((currentStep + 1) / TOUR_STEPS.length) * 100}%` }}
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
                className={cn(
                  "h-9 px-3",
                  "text-muted-foreground hover:text-foreground",
                  "disabled:opacity-40"
                )}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>

              {/* Step dots */}
              <div className="flex gap-1.5">
                {TOUR_STEPS.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentStep(index)}
                    className={cn(
                      "h-2 rounded-full transition-all duration-200",
                      index === currentStep
                        ? "w-6 bg-primary"
                        : index < currentStep
                        ? "w-2 bg-primary/50 hover:bg-primary/70"
                        : "w-2 bg-muted hover:bg-muted-foreground/30"
                    )}
                    aria-label={`Go to step ${index + 1}`}
                  />
                ))}
              </div>

              <Button
                variant={currentStep === TOUR_STEPS.length - 1 ? 'default' : 'ghost'}
                size="sm"
                onClick={handleNext}
                className={cn(
                  "h-9 px-3",
                  currentStep === TOUR_STEPS.length - 1 
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {currentStep === TOUR_STEPS.length - 1 ? (
                  'Get Started'
                ) : (
                  <>
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </>
                )}
              </Button>
            </div>

            {/* Keyboard hint */}
            <p className="text-[10px] text-muted-foreground/60 text-center mt-3">
              Use ← → arrow keys to navigate • Esc to close
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

// Tour activation button component
export function TourActivationButton() {
  const [showTour, setShowTour] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowTour(true)}
        className="h-8 px-2 text-xs gap-1.5"
      >
        <HelpCircle className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Tour</span>
      </Button>

      {showTour && (
        <GuidedTour
          forceShow
          onComplete={() => setShowTour(false)}
        />
      )}
    </>
  );
}
