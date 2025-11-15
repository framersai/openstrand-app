'use client';

/**
 * @module PKMSTour
 * @description
 * Lightweight, client-side onboarding tour for the PKMS dashboard.
 *
 * Focuses on:
 * - Explaining Strand → Loom → Weave analytics at a glance.
 * - Highlighting quick capture / ask bar as the main entry points.
 * - Pointing users at help/preferences for deeper configuration.
 *
 * The tour is intentionally minimal:
 * - 3 steps, rendered in a small card that docks near the bottom of the page.
 * - Dismissed permanently per-browser via localStorage, with an explicit
 *   "Show tour again" button exposed via the Help modal.
 */

import { useEffect, useState } from 'react';
import { Sparkles, BarChart3, HelpCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'openstrand:pkms-tour-dismissed';

interface PKMSTourProps {
  /**
   * Optional external override to force the tour open (e.g. from Help).
   */
  forceOpen?: boolean;
}

const steps = [
  {
    id: 'analytics',
    title: 'Strand → Loom → Weave insights',
    description:
      'Use the three analytics panels to understand a single note, the active project, and your whole workspace at a glance.',
  },
  {
    id: 'capture',
    title: 'Capture first, tidy later',
    description:
      'Quick Capture and the Ask bar are the fastest ways to get content and questions into OpenStrand. Analytics will light up as strands are processed.',
  },
  {
    id: 'refine',
    title: 'Refine with ratings & illustrations',
    description:
      'Rate strands, generate illustrations, and watch quality and coverage metrics improve over time. Use Preferences to tailor defaults.',
  },
];

export function PKMSTour({ forceOpen }: PKMSTourProps) {
  const [visible, setVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // Allow explicit override from Help even if previously dismissed
    if (forceOpen) {
      setVisible(true);
      setCurrentStep(0);
      return;
    }

    if (typeof window === 'undefined') return;
    const dismissed = window.localStorage.getItem(STORAGE_KEY);
    if (dismissed === 'true') {
      setVisible(false);
    } else {
      setVisible(true);
    }
  }, [forceOpen]);

  if (!visible) return null;

  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;

  const handleDismiss = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, 'true');
    }
    setVisible(false);
  };

  return (
    <div
      className={cn(
        'pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-4',
      )}
    >
      <div className="pointer-events-auto w-full max-w-xl">
        <Card className="border-border/60 bg-card shadow-lg backdrop-blur">
          <CardHeader className="flex flex-row items-center gap-3 pb-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-sm font-semibold">
                PKMS tour
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Step {currentStep + 1} of {steps.length}
              </p>
            </div>
            <Badge variant="outline" className="hidden sm:inline-flex items-center gap-1 text-[10px]">
              <BarChart3 className="h-3 w-3" />
              Analytics aware
            </Badge>
          </CardHeader>
          <CardContent className="space-y-3 pb-4">
            <div className="space-y-1">
              <div className="text-sm font-semibold text-foreground">{step.title}</div>
              <p className="text-sm text-muted-foreground">
                {step.description}
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <HelpCircle className="h-3 w-3" />
                <span>
                  You can replay this tour from the Help menu in the PKMS dashboard.
                </span>
              </div>
              <div className="flex items-center justify-end gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="text-xs"
                  onClick={handleDismiss}
                >
                  Skip tour
                </Button>
                {!isLast && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="text-xs"
                    onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
                    disabled={currentStep === 0}
                  >
                    Back
                  </Button>
                )}
                <Button
                  type="button"
                  size="sm"
                  className="text-xs"
                  onClick={() => {
                    if (isLast) {
                      handleDismiss();
                    } else {
                      setCurrentStep((s) => Math.min(steps.length - 1, s + 1));
                    }
                  }}
                >
                  {isLast ? 'Got it' : 'Next'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


