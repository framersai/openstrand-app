'use client';

import React, { useState, useEffect } from 'react';
import { 
  Play,
  Pause,
  RotateCcw,
  Maximize2,
  Sparkles,
  Database,
  GitBranch,
  BarChart3,
  ArrowRight,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

/**
 * Demo step in the interactive walkthrough
 */
interface DemoStep {
  /** Step identifier */
  id: string;
  /** Step title */
  title: string;
  /** Step description */
  description: string;
  /** Icon for this step */
  icon: React.ReactNode;
  /** Highlighted UI element */
  highlight?: string;
  /** Demo action */
  action?: string;
}

/**
 * Demo scenario
 */
interface DemoScenario {
  /** Scenario ID */
  id: string;
  /** Scenario title */
  title: string;
  /** Brief description */
  description: string;
  /** Duration in seconds */
  duration: number;
  /** Steps in this scenario */
  steps: DemoStep[];
}

/**
 * Sample demo scenarios
 */
const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: 'create-strand',
    title: 'Create Your First Strand',
    description: 'Learn how to create and organize knowledge strands',
    duration: 30,
    steps: [
      {
        id: 'open-composer',
        title: 'Open Composer',
        description: 'Click the "New Strand" button to start',
        icon: <Sparkles className="h-4 w-4" />,
        highlight: 'composer-button',
        action: 'Open strand composer',
      },
      {
        id: 'add-content',
        title: 'Add Content',
        description: 'Type or paste your content, add metadata',
        icon: <Database className="h-4 w-4" />,
        highlight: 'editor',
        action: 'Add strand content',
      },
      {
        id: 'connect',
        title: 'Create Connections',
        description: 'Link to other strands to build your knowledge graph',
        icon: <GitBranch className="h-4 w-4" />,
        highlight: 'connections',
        action: 'Add connections',
      },
      {
        id: 'save',
        title: 'Save & Visualize',
        description: 'Save your strand and generate visualizations',
        icon: <BarChart3 className="h-4 w-4" />,
        highlight: 'save-button',
        action: 'Save strand',
      },
    ],
  },
  {
    id: 'visualize-data',
    title: 'Visualize Your Data',
    description: 'Transform data into beautiful visualizations',
    duration: 25,
    steps: [
      {
        id: 'upload-data',
        title: 'Upload Data',
        description: 'Upload CSV, JSON, or connect to a database',
        icon: <Database className="h-4 w-4" />,
      },
      {
        id: 'select-viz',
        title: 'Choose Visualization',
        description: 'Select from charts, graphs, and 3D views',
        icon: <BarChart3 className="h-4 w-4" />,
      },
      {
        id: 'customize',
        title: 'Customize',
        description: 'Adjust colors, labels, and styling',
        icon: <Sparkles className="h-4 w-4" />,
      },
      {
        id: 'share',
        title: 'Share',
        description: 'Export or share your visualization',
        icon: <ArrowRight className="h-4 w-4" />,
      },
    ],
  },
];

interface InteractiveDemoProps {
  /** CSS classes */
  className?: string;
  /** Auto-play demo */
  autoPlay?: boolean;
  /** Show in fullscreen mode */
  fullscreen?: boolean;
}

/**
 * InteractiveDemo
 * 
 * An interactive demo component that showcases key features
 * without requiring user signup. Provides a risk-free way
 * to explore the product.
 * 
 * Features:
 * - Multiple demo scenarios
 * - Step-by-step walkthrough
 * - Auto-play mode
 * - Pause/resume controls
 * - Visual highlights
 * - Keyboard accessible
 * - Dark mode compatible
 * - Responsive design
 * 
 * Best Practices:
 * - Keep demos short (< 60 seconds)
 * - Show real functionality (not fake)
 * - Provide clear narration
 * - Allow user control (pause/skip)
 * - End with clear CTA
 * 
 * @example
 * ```tsx
 * <InteractiveDemo autoPlay={false} />
 * ```
 */
export function InteractiveDemo({
  className,
  autoPlay = false,
  fullscreen = false,
}: InteractiveDemoProps) {
  const [selectedScenario, setSelectedScenario] = useState(DEMO_SCENARIOS[0].id);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [hasStarted, setHasStarted] = useState(false);

  const scenario = DEMO_SCENARIOS.find((s) => s.id === selectedScenario) || DEMO_SCENARIOS[0];
  const step = scenario.steps[currentStep];
  const isLastStep = currentStep === scenario.steps.length - 1;
  const progress = ((currentStep + 1) / scenario.steps.length) * 100;

  /**
   * Auto-advance to next step when playing
   */
  useEffect(() => {
    if (!isPlaying || !hasStarted) return;

    const timer = setTimeout(() => {
      if (isLastStep) {
        setIsPlaying(false);
      } else {
        setCurrentStep((prev) => prev + 1);
      }
    }, 3000); // 3 seconds per step

    return () => clearTimeout(timer);
  }, [isPlaying, currentStep, isLastStep, hasStarted]);

  /**
   * Start demo
   */
  const startDemo = () => {
    setHasStarted(true);
    setIsPlaying(true);
    setCurrentStep(0);
  };

  /**
   * Reset demo
   */
  const resetDemo = () => {
    setCurrentStep(0);
    setIsPlaying(false);
    setHasStarted(false);
  };

  /**
   * Navigate to specific step
   */
  const goToStep = (stepIndex: number) => {
    setCurrentStep(stepIndex);
    setHasStarted(true);
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Demo Tabs */}
      <Tabs value={selectedScenario} onValueChange={setSelectedScenario}>
        <TabsList className="grid w-full grid-cols-2">
          {DEMO_SCENARIOS.map((scenario) => (
            <TabsTrigger key={scenario.id} value={scenario.id}>
              {scenario.title}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Demo Player */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-xl">{scenario.title}</CardTitle>
              <CardDescription>{scenario.description}</CardDescription>
            </div>
            <Badge variant="outline" className="shrink-0">
              {scenario.duration}s demo
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Demo Viewport - Simulated Dashboard */}
          <div 
            className={cn(
              'relative overflow-hidden rounded-lg border bg-gradient-to-br from-background to-muted/20',
              'aspect-video'
            )}
            role="img"
            aria-label="Interactive demo preview"
          >
            {!hasStarted ? (
              // Start State
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-background/95 backdrop-blur-sm">
                <div className="text-center space-y-2">
                  <h4 className="text-lg font-semibold">Ready to explore?</h4>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    Watch a quick demo of {scenario.title.toLowerCase()}
                  </p>
                </div>
                <Button size="lg" onClick={startDemo}>
                  <Play className="h-5 w-5 mr-2" />
                  Start Demo
                </Button>
              </div>
            ) : (
              // Demo Content
              <div className="absolute inset-0 p-6">
                {/* Simulated UI Elements */}
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="h-8 w-32 rounded bg-primary/10 flex items-center px-3">
                      <span className="text-xs font-medium">OpenStrand</span>
                    </div>
                    <div className="flex gap-2">
                      <div className="h-8 w-8 rounded bg-muted" />
                      <div className="h-8 w-8 rounded bg-muted" />
                    </div>
                  </div>

                  {/* Content Area with Step Highlight */}
                  <div className="grid grid-cols-3 gap-4 h-48">
                    <div className={cn(
                      'col-span-2 rounded-lg border-2 transition-all',
                      step.highlight === 'editor'
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                        : 'border-border bg-muted/30'
                    )}>
                      <div className="p-4 space-y-2">
                        <div className="h-4 w-3/4 rounded bg-foreground/10" />
                        <div className="h-4 w-1/2 rounded bg-foreground/10" />
                        <div className="h-4 w-5/6 rounded bg-foreground/10" />
                      </div>
                    </div>
                    <div className={cn(
                      'rounded-lg border-2 transition-all',
                      step.highlight === 'connections'
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                        : 'border-border bg-muted/30'
                    )}>
                      <div className="p-4 space-y-2">
                        <div className="h-3 w-full rounded bg-foreground/10" />
                        <div className="h-3 w-4/5 rounded bg-foreground/10" />
                      </div>
                    </div>
                  </div>

                  {/* Action Button Highlight */}
                  <div className="flex justify-end">
                    <div className={cn(
                      'h-10 w-32 rounded-md transition-all flex items-center justify-center',
                      step.highlight === 'save-button'
                        ? 'bg-primary ring-2 ring-primary/20 animate-pulse'
                        : 'bg-muted'
                    )}>
                      <span className="text-xs font-medium">
                        {step.action || 'Action'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Step Indicator Overlay */}
                <div className="absolute bottom-4 left-4 right-4">
                  <Card className="border-primary/20 bg-background/95 backdrop-blur">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                          {step.icon}
                        </div>
                        <div className="flex-1 space-y-1">
                          <h4 className="font-semibold text-sm">{step.title}</h4>
                          <p className="text-xs text-muted-foreground">{step.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>

          {/* Progress Steps */}
          {hasStarted && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Step {currentStep + 1} of {scenario.steps.length}
                </span>
                <span className="font-medium">{Math.round(progress)}%</span>
              </div>

              {/* Step Pills */}
              <div className="flex gap-2 overflow-x-auto pb-2">
                {scenario.steps.map((s, index) => {
                  const isActive = index === currentStep;
                  const isCompleted = index < currentStep;

                  return (
                    <button
                      key={s.id}
                      onClick={() => goToStep(index)}
                      className={cn(
                        'flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-all',
                        'border-2 shrink-0',
                        isActive && 'border-primary bg-primary/10 text-primary',
                        isCompleted && 'border-primary/30 bg-primary/5',
                        !isActive && !isCompleted && 'border-border bg-background'
                      )}
                      aria-label={`${s.title} - ${isCompleted ? 'Completed' : isActive ? 'Current' : 'Upcoming'}`}
                      aria-current={isActive ? 'step' : undefined}
                    >
                      {isCompleted ? (
                        <div className="h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                          <svg className="h-3 w-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      ) : (
                        <div className={cn(
                          'h-4 w-4 rounded-full border-2',
                          isActive ? 'border-primary bg-primary' : 'border-muted-foreground'
                        )} />
                      )}
                      <span className={cn(
                        isActive && 'text-primary',
                        !isActive && !isCompleted && 'text-muted-foreground'
                      )}>
                        {s.title}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {hasStarted && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsPlaying(!isPlaying)}
                    aria-label={isPlaying ? 'Pause demo' : 'Play demo'}
                  >
                    {isPlaying ? (
                      <>
                        <Pause className="h-4 w-4 mr-2" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Play
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetDemo}
                    aria-label="Restart demo"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Restart
                  </Button>
                </>
              )}
            </div>

            <Button size="sm" asChild>
              <a href="/auth">
                Try it yourself
                <ArrowRight className="h-4 w-4 ml-2" />
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Feature Highlights */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          {
            icon: Sparkles,
            title: 'No Signup Required',
            description: 'Explore the demo without creating an account',
          },
          {
            icon: Database,
            title: 'Real Features',
            description: 'See actual OpenStrand functionality in action',
          },
          {
            icon: BarChart3,
            title: 'Interactive',
            description: 'Click through the interface yourself',
          },
        ].map((feature, index) => {
          const Icon = feature.icon;
          return (
            <Card key={index} className="border-dashed">
              <CardContent className="pt-6 text-center space-y-2">
                <div className="flex justify-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <h4 className="font-semibold text-sm">{feature.title}</h4>
                <p className="text-xs text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/**
 * DemoShowcase
 * 
 * A simplified demo widget for embedding in landing pages
 */
interface DemoShowcaseProps {
  /** Title */
  title?: string;
  /** Description */
  description?: string;
  /** CTA button text */
  ctaText?: string;
  /** CTA href */
  ctaHref?: string;
  /** Additional CSS classes */
  className?: string;
}

export function DemoShowcase({
  title = 'See OpenStrand in Action',
  description = 'Watch a quick demo or try it yourself',
  ctaText = 'Start Free',
  ctaHref = '/auth',
  className,
}: DemoShowcaseProps) {
  return (
    <section className={cn('py-12 sm:py-16', className)}>
      <div className="container max-w-6xl">
        <div className="text-center space-y-4 mb-8">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {title}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {description}
          </p>
        </div>

        <InteractiveDemo />

        <div className="text-center mt-8">
          <Button size="lg" asChild>
            <a href={ctaHref}>
              {ctaText}
              <ArrowRight className="h-5 w-5 ml-2" />
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}

