'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  Info,
  HelpCircle,
  Book,
  Lightbulb,
  Target,
  Sparkles,
  Upload,
  LineChart,
  Layout,
  Command,
  Keyboard,
  Settings,
  Database,
  Layers,
  Activity,
  MessageSquare,
  Users,
  Zap,
  CheckCircle2,
  Circle,
  ArrowRight,
  MousePointer,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

// Tour step types
type StepType = 'info' | 'action' | 'interactive' | 'quiz' | 'video';
type TourMode = 'quick' | 'detailed' | 'feature';

interface TourStep {
  id: string;
  type: StepType;
  target?: string; // CSS selector for the element to highlight
  title: string;
  content: string | React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  icon?: React.ReactNode;
  action?: {
    label: string;
    handler: () => void;
    required?: boolean;
  };
  validation?: () => boolean;
  skipCondition?: () => boolean;
  media?: {
    type: 'image' | 'video' | 'animation';
    src: string;
  };
  tips?: string[];
  quiz?: {
    question: string;
    options: string[];
    correctAnswer: number;
  };
  category?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
}

// Comprehensive tour steps
const ALL_TOUR_STEPS: TourStep[] = [
  // Welcome & Overview
  {
    id: 'welcome',
    type: 'info',
    title: 'Welcome to OpenStrand!',
    content: (
      <div className="space-y-3">
        <p>Let's explore your AI-powered data visualization dashboard.</p>
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2 bg-primary/10 rounded">
            <Sparkles className="h-4 w-4 mb-1" />
            <span className="text-xs">AI-Powered</span>
          </div>
          <div className="p-2 bg-primary/10 rounded">
            <LineChart className="h-4 w-4 mb-1" />
            <span className="text-xs">Smart Visualizations</span>
          </div>
        </div>
      </div>
    ),
    position: 'center',
    icon: <Sparkles className="h-5 w-5" />,
    category: 'Getting Started',
    difficulty: 'beginner',
  },

  // Layout System
  {
    id: 'layout-presets',
    type: 'interactive',
    target: '.layout-preset-selector',
    title: 'Layout Presets',
    content: 'Choose from different layout presets to customize your workspace. Try clicking each preset to see how it changes the dashboard.',
    position: 'bottom',
    icon: <Layout className="h-5 w-5" />,
    action: {
      label: 'Try Different Layouts',
      handler: () => {
        const buttons = document.querySelectorAll('.layout-preset-selector button');
        buttons.forEach((btn, i) => {
          setTimeout(() => {
            (btn as HTMLElement).click();
          }, i * 1000);
        });
      },
    },
    tips: [
      'Focused: Hides sidebars for maximum workspace',
      'Balanced: Default view with all panels',
      'Overview: Shows all metrics and insights',
      'Zen: Minimal distractions, pure focus',
    ],
    category: 'Layout',
    difficulty: 'beginner',
  },

  // Data Upload
  {
    id: 'data-upload',
    type: 'action',
    target: '[data-tour-id="upload-panel"]',
    title: 'Upload Your Data',
    content: 'Start by uploading a dataset. Support for CSV, TSV, JSON, and more formats.',
    position: 'right',
    icon: <Upload className="h-5 w-5" />,
    action: {
      label: 'Open Upload Panel',
      handler: () => {
        const uploadPanel = document.querySelector('[data-tour-id="upload-panel"]') as HTMLElement;
        uploadPanel?.click();
      },
      required: true,
    },
    tips: [
      'Drag and drop files directly',
      'Use sample datasets to explore',
      'File size limits based on your plan',
    ],
    category: 'Data',
    difficulty: 'beginner',
  },

  // Visualization Creation
  {
    id: 'create-viz',
    type: 'interactive',
    target: '[data-tour-id="visualize-panel"]',
    title: 'Create Visualizations',
    content: 'Use natural language to describe what you want to visualize. Our AI understands your intent.',
    position: 'right',
    icon: <LineChart className="h-5 w-5" />,
    tips: [
      'Be specific about chart types',
      'Mention specific columns or metrics',
      'Use examples: "Show sales by month as a bar chart"',
    ],
    category: 'Visualization',
    difficulty: 'beginner',
  },

  // Floating Action Toolbar
  {
    id: 'fab-toolbar',
    type: 'interactive',
    target: '.floating-action-toolbar',
    title: 'Quick Actions Toolbar',
    content: 'Access frequently used actions from this floating toolbar. It follows you as you scroll.',
    position: 'left',
    icon: <Zap className="h-5 w-5" />,
    action: {
      label: 'Expand Toolbar',
      handler: () => {
        const fab = document.querySelector('.floating-action-toolbar button') as HTMLElement;
        fab?.click();
      },
    },
    tips: [
      'Customizable position and style',
      'Keyboard shortcuts available',
      'Can be hidden in Zen mode',
    ],
    category: 'Navigation',
    difficulty: 'beginner',
  },

  // Keyboard Navigation
  {
    id: 'keyboard-nav',
    type: 'info',
    title: 'Keyboard Navigation',
    content: (
      <div className="space-y-2">
        <p className="text-sm mb-3">Master these keyboard shortcuts:</p>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between p-1 bg-muted rounded">
            <span>Cmd/Ctrl + K</span>
            <span>Command Palette</span>
          </div>
          <div className="flex justify-between p-1 bg-muted rounded">
            <span>Alt + 1/2/3</span>
            <span>Layout Presets</span>
          </div>
          <div className="flex justify-between p-1 bg-muted rounded">
            <span>Ctrl + B</span>
            <span>Toggle Sidebar</span>
          </div>
          <div className="flex justify-between p-1 bg-muted rounded">
            <span>Ctrl + S</span>
            <span>Toggle Status Bar</span>
          </div>
        </div>
      </div>
    ),
    position: 'center',
    icon: <Keyboard className="h-5 w-5" />,
    category: 'Navigation',
    difficulty: 'intermediate',
  },

  // Masonry Grid
  {
    id: 'masonry-grid',
    type: 'interactive',
    target: '.masonry-grid',
    title: 'Pinterest-Style Grid',
    content: 'Your visualizations are displayed in a responsive masonry grid. Drag to reorder, resize, or maximize items.',
    position: 'top',
    icon: <Layers className="h-5 w-5" />,
    tips: [
      'Drag handles to reorder',
      'Double-click to maximize',
      'Adjustable column count',
    ],
    category: 'Visualization',
    difficulty: 'intermediate',
  },

  // Status Bar
  {
    id: 'status-bar',
    type: 'info',
    target: '.status-bar',
    title: 'Status Bar',
    content: 'Monitor system resources, dataset info, and sync status at a glance. Click any section for detailed information.',
    position: 'top',
    icon: <Activity className="h-5 w-5" />,
    category: 'Monitoring',
    difficulty: 'beginner',
  },

  // AI Insights
  {
    id: 'ai-insights',
    type: 'action',
    target: '[data-tour-id="auto-insights"]',
    title: 'AI-Powered Insights',
    content: 'Let AI analyze your data and suggest the best visualizations automatically.',
    position: 'right',
    icon: <Lightbulb className="h-5 w-5" />,
    action: {
      label: 'Run Auto Insights',
      handler: () => {
        const insightsBtn = document.querySelector('[data-tour-id="auto-insights"]') as HTMLElement;
        insightsBtn?.click();
      },
    },
    category: 'AI Features',
    difficulty: 'intermediate',
  },

  // Collapsible Panels
  {
    id: 'collapsible-panels',
    type: 'interactive',
    target: '.collapsible-panel',
    title: 'Collapsible Panels',
    content: 'All panels can be expanded or collapsed to save space. Click the header to toggle.',
    position: 'right',
    icon: <Info className="h-5 w-5" />,
    tips: [
      'Collapsed panels show preview info',
      'State is saved in layout presets',
      'Double-click to expand all',
    ],
    category: 'Layout',
    difficulty: 'beginner',
  },

  // Quiz: Understanding Features
  {
    id: 'quiz-features',
    type: 'quiz',
    title: 'Quick Check',
    content: "Let's test what you've learned!",
    position: 'center',
    icon: <HelpCircle className="h-5 w-5" />,
    quiz: {
      question: 'Which keyboard shortcut opens the Command Palette?',
      options: ['Ctrl + P', 'Cmd/Ctrl + K', 'Alt + C', 'Shift + Space'],
      correctAnswer: 1,
    },
    category: 'Quiz',
    difficulty: 'beginner',
  },

  // Completion
  {
    id: 'completion',
    type: 'info',
    title: 'Tour Complete!',
    content: (
      <div className="space-y-3">
        <p>You're ready to start visualizing your data!</p>
        <div className="p-3 bg-primary/10 rounded">
          <CheckCircle2 className="h-5 w-5 mb-2 text-primary" />
          <p className="text-sm font-medium">Pro Tip</p>
          <p className="text-xs text-muted-foreground">
            Press <kbd className="px-1 py-0.5 bg-muted rounded text-xs">?</kbd> anytime to see keyboard shortcuts
          </p>
        </div>
      </div>
    ),
    position: 'center',
    icon: <CheckCircle2 className="h-5 w-5" />,
    category: 'Getting Started',
    difficulty: 'beginner',
  },
];

// Tour modes with different step selections
const TOUR_MODES: Record<TourMode, string[]> = {
  quick: ['welcome', 'layout-presets', 'data-upload', 'create-viz', 'fab-toolbar', 'completion'],
  detailed: ALL_TOUR_STEPS.map(s => s.id),
  feature: [], // Dynamically populated based on feature selection
};

interface InteractiveTourProps {
  onComplete?: () => void;
  mode?: TourMode;
  feature?: string;
  autoStart?: boolean;
}

export function InteractiveTour({
  onComplete,
  mode = 'quick',
  feature,
  autoStart = false,
}: InteractiveTourProps) {
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [highlightElement, setHighlightElement] = useState<HTMLElement | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
  const [tourMode, setTourMode] = useState<TourMode>(mode);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

  // Get steps based on mode
  const tourSteps = useMemo(() => {
    if (feature) {
      return ALL_TOUR_STEPS.filter(s => s.category === feature);
    }
    const stepIds = TOUR_MODES[tourMode];
    return ALL_TOUR_STEPS.filter(s => stepIds.includes(s.id));
  }, [tourMode, feature]);

  const currentStepData = tourSteps[currentStep];
  const progress = ((currentStep + 1) / tourSteps.length) * 100;

  // Initialize tour
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const tourCompleted = localStorage.getItem('interactiveTourCompleted');
    const tourProgress = localStorage.getItem('tourProgress');

    if (tourProgress) {
      const progress = JSON.parse(tourProgress);
      setCompletedSteps(new Set(progress.completed));
      if (progress.currentStep) {
        setCurrentStep(progress.currentStep);
      }
    }

    if (autoStart || (!tourCompleted && !tourProgress)) {
      setTimeout(() => setIsActive(true), 500);
    }
  }, [autoStart]);

  // Save progress
  useEffect(() => {
    if (isActive && typeof window !== 'undefined') {
      const progress = {
        currentStep,
        completed: Array.from(completedSteps),
        mode: tourMode,
      };
      localStorage.setItem('tourProgress', JSON.stringify(progress));
    }
  }, [currentStep, completedSteps, tourMode, isActive]);

  const removeHighlight = useCallback(() => {
    if (highlightElement) {
      highlightElement.classList.remove('tour-highlight', 'tour-highlight-pulse');
      highlightElement.style.removeProperty('--tour-highlight-color');
      setHighlightElement(null);
    }
  }, [highlightElement]);

  const highlightTarget = useCallback((step: TourStep) => {
    removeHighlight();

    if (!step.target) {
      // Center position for steps without targets
      setTooltipPosition({
        top: window.innerHeight / 2 - 200,
        left: window.innerWidth / 2 - 250,
      });
      return;
    }

    const target = document.querySelector(step.target) as HTMLElement;
    if (!target) {
      console.warn(`Target not found: ${step.target}`);
      setTooltipPosition({
        top: window.innerHeight / 2 - 200,
        left: window.innerWidth / 2 - 250,
      });
      return;
    }

    // Add highlight classes
    target.classList.add('tour-highlight');
    if (step.type === 'interactive') {
      target.classList.add('tour-highlight-pulse');
    }
    setHighlightElement(target);

    // Scroll element into view
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Calculate tooltip position
    const rect = target.getBoundingClientRect();
    let top = rect.top;
    let left = rect.left;

    switch (step.position) {
      case 'bottom':
        top = rect.bottom + 16;
        left = rect.left + (rect.width / 2) - 250;
        break;
      case 'top':
        top = rect.top - 320;
        left = rect.left + (rect.width / 2) - 250;
        break;
      case 'left':
        top = rect.top + (rect.height / 2) - 160;
        left = rect.left - 520;
        break;
      case 'right':
        top = rect.top + (rect.height / 2) - 160;
        left = rect.right + 16;
        break;
      default:
        top = window.innerHeight / 2 - 200;
        left = window.innerWidth / 2 - 250;
    }

    // Ensure tooltip stays within viewport
    top = Math.max(16, Math.min(top, window.innerHeight - 350));
    left = Math.max(16, Math.min(left, window.innerWidth - 520));

    setTooltipPosition({ top, left });
  }, [removeHighlight]);

  const handleComplete = useCallback(() => {
    setIsActive(false);
    removeHighlight();
    if (typeof window !== 'undefined') {
      localStorage.setItem('interactiveTourCompleted', 'true');
      localStorage.removeItem('tourProgress');
    }
    onComplete?.();
  }, [removeHighlight, onComplete]);

  const handleNext = useCallback(() => {
    // Validate current step if needed
    if (currentStepData?.validation && !currentStepData.validation()) {
      return;
    }

    // Mark step as completed
    setCompletedSteps(prev => {
      const updated = new Set(prev);
      if (currentStepData) {
        updated.add(currentStepData.id);
      }
      return updated;
    });

    setQuizAnswer(null);

    if (currentStep < tourSteps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleComplete();
    }
  }, [currentStep, currentStepData, tourSteps.length, handleComplete]);

  // Highlight current step
  useEffect(() => {
    if (isActive && currentStepData) {
      // Check skip condition
      if (currentStepData.skipCondition?.()) {
        handleNext();
        return;
      }
      highlightTarget(currentStepData);
    } else if (!isActive) {
      removeHighlight();
    }
  }, [isActive, currentStep, currentStepData, highlightTarget, removeHighlight, handleNext]);

  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => Math.max(prev - 1, 0));
      setQuizAnswer(null);
    }
  }, [currentStep]);

  const handleSkip = useCallback(() => {
    handleComplete();
  }, [handleComplete]);

  const handleRestart = useCallback(() => {
    setCurrentStep(0);
    setCompletedSteps(new Set());
    setQuizAnswer(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('tourProgress');
    }
  }, []);

  const handleQuizAnswer = useCallback((answerIndex: number) => {
    setQuizAnswer(answerIndex);
    if (currentStepData?.quiz && answerIndex === currentStepData.quiz.correctAnswer) {
      setTimeout(() => handleNext(), 1500);
    }
  }, [currentStepData, handleNext]);

  // Auto-play functionality for informational steps
  useEffect(() => {
    if (isActive && !isPaused && currentStepData?.type === 'info') {
      autoPlayRef.current = setTimeout(() => {
        handleNext();
      }, 5000);
    }

    return () => {
      if (autoPlayRef.current) {
        clearTimeout(autoPlayRef.current);
      }
    };
  }, [isActive, isPaused, currentStepData, handleNext]);

  /**
   * Provides a universal Escape key shortcut to exit the interactive tour regardless of the current step.
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

  if (!isActive || !currentStepData) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm"
        onClick={handleSkip}
      />

      {/* Enhanced highlight styles */}
      <style jsx>{`
        :global(.tour-highlight) {
          position: relative !important;
          z-index: 9999 !important;
          box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.6);
          border-radius: 8px;
          outline: 3px solid rgba(var(--primary), 0.5);
          outline-offset: 4px;
        }

        :global(.tour-highlight-pulse) {
          animation: tour-pulse 2s infinite;
        }

        @keyframes tour-pulse {
          0%, 100% {
            outline-color: rgba(var(--primary), 0.5);
            outline-offset: 4px;
          }
          50% {
            outline-color: rgba(var(--primary), 0.8);
            outline-offset: 8px;
          }
        }
      `}</style>

      {/* Tour Card */}
      <Card
        className="fixed z-[10000] w-[500px] shadow-2xl border-primary/20"
        style={{
          top: `${tooltipPosition.top}px`,
          left: `${tooltipPosition.left}px`,
        }}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {currentStepData.icon && (
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  {currentStepData.icon}
                </div>
              )}
              <div>
                <CardTitle className="text-lg">{currentStepData.title}</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs">
                    {currentStep + 1} / {tourSteps.length}
                  </Badge>
                  {currentStepData.category && (
                    <Badge variant="outline" className="text-xs">
                      {currentStepData.category}
                    </Badge>
                  )}
                  {currentStepData.difficulty && (
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs",
                        currentStepData.difficulty === 'beginner' && 'border-green-500 text-green-500',
                        currentStepData.difficulty === 'intermediate' && 'border-yellow-500 text-yellow-500',
                        currentStepData.difficulty === 'advanced' && 'border-red-500 text-red-500'
                      )}
                    >
                      {currentStepData.difficulty}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsPaused(!isPaused)}
                className="h-8 w-8"
              >
                {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSkip}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <Progress value={progress} className="mt-3 h-1" />
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Main Content */}
          <div className="text-sm text-muted-foreground">
            {typeof currentStepData.content === 'string'
              ? <p>{currentStepData.content}</p>
              : currentStepData.content
            }
          </div>

          {/* Tips Section */}
          {currentStepData.tips && currentStepData.tips.length > 0 && (
            <div className="p-3 bg-muted/50 rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-xs font-medium">
                <Lightbulb className="h-3.5 w-3.5" />
                Tips
              </div>
              <ul className="space-y-1">
                {currentStepData.tips.map((tip, i) => (
                  <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                    <Circle className="h-2 w-2 mt-1.5 flex-shrink-0" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Quiz Section */}
          {currentStepData.type === 'quiz' && currentStepData.quiz && (
            <div className="space-y-3">
              <p className="font-medium text-sm">{currentStepData.quiz.question}</p>
              <div className="space-y-2">
                {currentStepData.quiz.options.map((option, i) => (
                  <Button
                    key={i}
                    variant={
                      quizAnswer === i
                        ? i === currentStepData.quiz!.correctAnswer
                          ? 'default'
                          : 'destructive'
                        : 'outline'
                    }
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => handleQuizAnswer(i)}
                    disabled={quizAnswer !== null}
                  >
                    {quizAnswer === i && i === currentStepData.quiz!.correctAnswer && (
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                    )}
                    {quizAnswer === i && i !== currentStepData.quiz!.correctAnswer && (
                      <X className="h-4 w-4 mr-2" />
                    )}
                    {option}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Action Button */}
          {currentStepData.action && (
            <Button
              variant="default"
              size="sm"
              onClick={currentStepData.action.handler}
              className="w-full"
            >
              {currentStepData.action.label}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRestart}
                disabled={currentStep === 0}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePrev}
                disabled={currentStep === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
            </div>

            {/* Progress Dots */}
            <div className="flex gap-1 max-w-[120px] overflow-hidden">
              {tourSteps.slice(
                Math.max(0, currentStep - 2),
                Math.min(tourSteps.length, currentStep + 3)
              ).map((_, index) => {
                const actualIndex = index + Math.max(0, currentStep - 2);
                return (
                  <button
                    key={actualIndex}
                    onClick={() => setCurrentStep(actualIndex)}
                    className={cn(
                      "h-2 w-2 rounded-full transition-all",
                      actualIndex === currentStep
                        ? 'bg-primary w-4'
                        : completedSteps.has(tourSteps[actualIndex]?.id)
                        ? 'bg-primary/50'
                        : 'bg-muted'
                    )}
                  />
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={currentStep === tourSteps.length - 1 ? 'default' : 'ghost'}
                size="sm"
                onClick={handleNext}
                disabled={
                  currentStepData.action?.required &&
                  !completedSteps.has(currentStepData.id)
                }
              >
                {currentStep === tourSteps.length - 1 ? 'Finish' : 'Next'}
                {currentStep < tourSteps.length - 1 && (
                  <ChevronRight className="h-4 w-4 ml-1" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSkip}
              >
                <SkipForward className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Completed Steps Indicator */}
          <div className="text-xs text-center text-muted-foreground">
            {completedSteps.size} of {tourSteps.length} steps completed
          </div>
        </CardContent>
      </Card>
    </>
  );
}

// Tour Control Panel
export function TourControlPanel() {
  const [showTour, setShowTour] = useState(false);
  const [selectedMode, setSelectedMode] = useState<TourMode>('quick');
  const [selectedFeature, setSelectedFeature] = useState<string | undefined>();

  const features = Array.from(new Set(ALL_TOUR_STEPS.map(s => s.category).filter(Boolean)));

  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 px-2">
            <HelpCircle className="h-4 w-4 mr-1" />
            Tour
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Interactive Tour</h4>
              <p className="text-xs text-muted-foreground mb-3">
                Learn how to use OpenStrand with our interactive guide
              </p>
            </div>

            <Tabs defaultValue="mode" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="mode">Tour Mode</TabsTrigger>
                <TabsTrigger value="feature">By Feature</TabsTrigger>
              </TabsList>

              <TabsContent value="mode" className="space-y-3">
                <div className="space-y-2">
                  <Button
                    variant={selectedMode === 'quick' ? 'default' : 'outline'}
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => {
                      setSelectedMode('quick');
                      setSelectedFeature(undefined);
                    }}
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Quick Tour (5 min)
                  </Button>
                  <Button
                    variant={selectedMode === 'detailed' ? 'default' : 'outline'}
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => {
                      setSelectedMode('detailed');
                      setSelectedFeature(undefined);
                    }}
                  >
                    <Book className="h-4 w-4 mr-2" />
                    Detailed Tour (15 min)
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="feature" className="space-y-2">
                {features.map(feature => (
                  <Button
                    key={feature}
                    variant={selectedFeature === feature ? 'default' : 'outline'}
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => {
                      setSelectedFeature(feature);
                      setSelectedMode('feature');
                    }}
                  >
                    {feature}
                  </Button>
                ))}
              </TabsContent>
            </Tabs>

            <div className="flex gap-2">
              <Button
                variant="default"
                size="sm"
                className="flex-1"
                onClick={() => setShowTour(true)}
              >
                Start Tour
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    localStorage.removeItem('interactiveTourCompleted');
                    localStorage.removeItem('tourProgress');
                  }
                }}
              >
                Reset
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {showTour && (
        <InteractiveTour
          mode={selectedMode}
          feature={selectedFeature}
          autoStart
          onComplete={() => setShowTour(false)}
        />
      )}
    </>
  );
}

// Hotspot component for persistent help indicators
export function TourHotspot({
  targetId,
  stepId,
  position = 'top-right'
}: {
  targetId: string;
  stepId: string;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}) {
  const [showTooltip, setShowTooltip] = useState(false);
  const step = ALL_TOUR_STEPS.find(s => s.id === stepId);

  if (!step) return null;

  const positionClasses = {
    'top-right': 'top-0 right-0 -translate-y-1/2 translate-x-1/2',
    'top-left': 'top-0 left-0 -translate-y-1/2 -translate-x-1/2',
    'bottom-right': 'bottom-0 right-0 translate-y-1/2 translate-x-1/2',
    'bottom-left': 'bottom-0 left-0 translate-y-1/2 -translate-x-1/2',
  };

  return (
    <div
      data-tour-hotspot={targetId}
      className={cn(
        "absolute z-50",
        positionClasses[position]
      )}
    >
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 rounded-full bg-primary/20 hover:bg-primary/30 animate-pulse"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={() => {
          // Start tour from this specific step
          const stepIndex = ALL_TOUR_STEPS.findIndex(s => s.id === stepId);
          // Implementation would trigger tour starting from this step
        }}
      >
        <HelpCircle className="h-3 w-3" />
      </Button>

      {showTooltip && (
        <Card className="absolute top-8 left-1/2 -translate-x-1/2 w-48 shadow-lg">
          <CardContent className="p-2">
            <p className="text-xs font-medium">{step.title}</p>
            <p className="text-xs text-muted-foreground mt-1">Click for help</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'; 