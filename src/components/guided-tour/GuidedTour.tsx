'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface TourStep {
  id: string;
  target: string; // CSS selector for the element to highlight
  title: string;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  icon?: React.ReactNode;
  action?: {
    label: string;
    handler: () => void;
  };
}

const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    target: '.dashboard-header',
    title: 'Welcome to OpenStrand!',
    content: 'Let\'s take a quick tour to help you get started with data visualization using AI.',
    position: 'bottom',
    icon: <Sparkles className="h-5 w-5" />,
  },
  {
    id: 'keyboard-shortcuts',
    target: 'body',
    title: 'Keyboard Power User',
    content: 'Press / or Cmd+K (Ctrl+K on Windows) to open the command palette. Navigate anywhere, trigger any action, and search everything—all from your keyboard!',
    position: 'bottom',
    icon: <Book className="h-5 w-5" />,
  },
  {
    id: 'upload',
    target: '[data-tour-id="upload-tab"]',
    title: 'Upload Your Data',
    content: 'Start by uploading a CSV, TSV, or JSON file. You can also use our sample datasets to explore.',
    position: 'right',
    icon: <Info className="h-5 w-5" />,
  },
  {
    id: 'visualize',
    target: '[data-tour-id="visualize-tab"]',
    title: 'Create Visualizations',
    content: 'Use natural language to describe what you want to see. Our AI will create the perfect visualization for your data.',
    position: 'right',
    icon: <Target className="h-5 w-5" />,
  },
  {
    id: 'quick-actions',
    target: '[data-tour-id="quick-actions"]',
    title: 'Quick Actions',
    content: 'Use pre-configured templates for common visualizations, or run AI-powered insights on your dataset.',
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
    content: 'Access settings to configure AI providers, themes, language preferences, and more.',
    position: 'bottom',
    icon: <HelpCircle className="h-5 w-5" />,
  },
];

interface GuidedTourProps {
  onComplete?: () => void;
  forceShow?: boolean;
}

export function GuidedTour({ onComplete, forceShow = false }: GuidedTourProps) {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightElement, setHighlightElement] = useState<HTMLElement | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });

  const removeHighlight = useCallback(() => {
    if (highlightElement) {
      highlightElement.classList.remove('tour-highlight');
      setHighlightElement(null);
    }
  }, [highlightElement]);

  const highlightTarget = useCallback((step: TourStep) => {
    removeHighlight();

    const target = document.querySelector(step.target) as HTMLElement;
    if (!target) {
      console.warn(`Target not found for step: ${step.id}`);
      return;
    }

    target.classList.add('tour-highlight');
    setHighlightElement(target);

    const rect = target.getBoundingClientRect();
    const top = step.position === 'bottom'
      ? rect.bottom + window.scrollY + 16
      : rect.top + window.scrollY - 16;

    const left = step.position === 'right'
      ? rect.right + window.scrollX + 16
      : rect.left + window.scrollX - 380;

    setTooltipPosition({ top, left });
  }, [removeHighlight]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if user has seen the tour before
    const tourSeen = localStorage.getItem('guidedTourCompleted');
    // Show tour on first visit or if forced
    if (!tourSeen || forceShow) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        setIsActive(true);
      }, 500);
    }
  }, [forceShow]);

  useEffect(() => {
    if (isActive && TOUR_STEPS[currentStep]) {
      highlightTarget(TOUR_STEPS[currentStep]);
    } else if (!isActive) {
      removeHighlight();
    }
  }, [isActive, currentStep, highlightTarget, removeHighlight]);

  const handleComplete = useCallback(() => {
    setIsActive(false);
    removeHighlight();
    if (typeof window !== 'undefined') {
      localStorage.setItem('guidedTourCompleted', 'true');
    }
    onComplete?.();
  }, [onComplete, removeHighlight]);

  const handleSkip = useCallback(() => {
    handleComplete();
  }, [handleComplete]);

  /**
   * Provides an Escape key shortcut to dismiss the lightweight guided tour overlay.
   */
  useEffect(() => {
    if (!isActive) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        handleSkip();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, handleSkip]);

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

  if (!isActive) return null;

  const step = TOUR_STEPS[currentStep];

  return (
    <>
      {/* Overlay - more opaque background for better visibility */}
      <div
        className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm"
        onClick={handleSkip}
        aria-label="Close tour"
      />

          {/* Highlight cutout styles */}
      <style jsx>{`
        :global(.tour-highlight) {
          position: relative;
          z-index: 50 !important;
          box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.8);
          border-radius: 8px;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% {
            box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.8),
                        0 0 0 4px rgba(59, 130, 246, 0.5);
          }
          50% {
            box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.8),
                        0 0 0 8px rgba(59, 130, 246, 0.3);
          }
        }
      `}</style>

      {/* Tour Tooltip - fully responsive with bottom sheet on mobile */}
      <Card
        className="fixed z-50 shadow-2xl border-primary/30 bg-card text-card-foreground
          sm:w-[calc(100vw-2rem)] sm:max-w-md
          max-sm:bottom-0 max-sm:left-0 max-sm:right-0 max-sm:rounded-b-none max-sm:rounded-t-2xl max-sm:w-full max-sm:max-w-full
          max-sm:animate-in max-sm:slide-in-from-bottom-full max-sm:duration-300"
        style={{
          // Desktop positioning
          ...(typeof window !== 'undefined' && window.innerWidth >= 640 ? {
            top: `${Math.min(Math.max(tooltipPosition.top, window.innerHeight * 0.12), window.innerHeight * 0.7)}px`,
            left: `${Math.min(Math.max(tooltipPosition.left, 16), window.innerWidth - 400)}px`,
          } : {}),
        }}
      >
        <CardContent className="p-4 sm:p-6 safe-area-bottom">
          {/* Mobile drag handle indicator */}
          <div className="sm:hidden w-12 h-1 bg-muted-foreground/20 rounded-full mx-auto mb-4" />
          
          {/* Header */}
          <div className="flex items-start justify-between mb-3 sm:mb-4">
            <div className="flex items-center gap-2 sm:gap-3">
              {step.icon && (
                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                  {step.icon}
                </div>
              )}
              <div className="min-w-0">
                <h3 className="font-semibold text-base sm:text-lg leading-tight">{step.title}</h3>
                <Badge variant="secondary" className="text-[10px] sm:text-xs mt-1">
                  Step {currentStep + 1} of {TOUR_STEPS.length}
                </Badge>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              className="h-10 w-10 sm:h-8 sm:w-8 p-0 flex-shrink-0 -mr-2 -mt-1"
              aria-label="Close tour"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <p className="text-sm text-foreground/80 mb-4 sm:mb-6 leading-relaxed">
            {step.content}
          </p>

          {/* Action button if provided */}
          {step.action && (
            <Button
              variant="outline"
              size="sm"
              onClick={step.action.handler}
              className="w-full mb-4 min-h-[44px]"
            >
              {step.action.label}
            </Button>
          )}

          {/* Navigation - stacked on mobile landscape */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-2">
            {/* Progress dots - centered on mobile */}
            <div className="flex gap-1.5 justify-center sm:order-2">
              {TOUR_STEPS.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 w-2 rounded-full transition-colors ${
                    index === currentStep
                      ? 'bg-primary'
                      : index < currentStep
                      ? 'bg-primary/50'
                      : 'bg-muted'
                  }`}
                />
              ))}
            </div>
            
            {/* Buttons row */}
            <div className="flex items-center justify-between sm:contents gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePrev}
                disabled={currentStep === 0}
                className="min-h-[44px] sm:min-h-[36px] sm:order-1"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Previous</span>
                <span className="sm:hidden">Back</span>
              </Button>

              <Button
                variant={currentStep === TOUR_STEPS.length - 1 ? 'default' : 'ghost'}
                size="sm"
                onClick={handleNext}
                className="min-h-[44px] sm:min-h-[36px] sm:order-3"
              >
                {currentStep === TOUR_STEPS.length - 1 ? 'Finish' : 'Next'}
                {currentStep < TOUR_STEPS.length - 1 && (
                  <ChevronRight className="h-4 w-4 ml-1" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
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
        className="h-8 px-2 text-xs"
      >
        <HelpCircle className="h-4 w-4 mr-1" />
        Tour
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
