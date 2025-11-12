'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import {
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Database,
  Sparkles,
  Target,
  Settings,
  Rocket,
  Users,
  BookOpen,
  BarChart3,
  Shield,
  Upload,
  X,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useOpenStrandStore } from '@/store/openstrand.store';

/**
 * User goal options for onboarding personalization
 */
const USER_GOALS = [
  {
    id: 'personal',
    label: 'Personal Knowledge',
    description: 'Organize my notes, research, and ideas',
    icon: BookOpen,
    color: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'team',
    label: 'Team Collaboration',
    description: 'Work with my team on shared knowledge',
    icon: Users,
    color: 'from-purple-500 to-pink-500',
  },
  {
    id: 'research',
    label: 'Academic Research',
    description: 'Manage research projects and citations',
    icon: BarChart3,
    color: 'from-green-500 to-emerald-500',
  },
  {
    id: 'business',
    label: 'Business Intelligence',
    description: 'Organize business data and insights',
    icon: Target,
    color: 'from-orange-500 to-red-500',
  },
] as const;

/**
 * Storage backend options for workspace setup
 */
const STORAGE_OPTIONS = [
  {
    id: 'local',
    label: 'Local Storage',
    description: 'Store data on your device (offline-first)',
    icon: Database,
    recommended: true,
  },
  {
    id: 'cloud',
    label: 'Cloud Storage',
    description: 'Store data in the cloud (sync across devices)',
    icon: Sparkles,
    recommended: false,
  },
] as const;

/**
 * Onboarding wizard state persisted to localStorage
 */
interface OnboardingState {
  currentStep: number;
  selectedGoal: string | null;
  storageType: 'local' | 'cloud';
  displayName: string;
  enableNotifications: boolean;
  enableAutoInsights: boolean;
  importData: boolean;
  completed: boolean;
}

interface ProfileOnboardingWizardProps {
  /** Callback when wizard is dismissed */
  onDismiss?: () => void;
  /** Callback when wizard is completed */
  onComplete?: () => void;
  /** Whether to show the wizard */
  isOpen?: boolean;
}

/**
 * ProfileOnboardingWizard
 * 
 * A comprehensive multi-step onboarding wizard for new users.
 * Guides users through:
 * 1. Goal setting and personalization
 * 2. Workspace and storage configuration
 * 3. Feature discovery with interactive tour
 * 4. Preference customization
 * 5. Success state with next steps
 * 
 * Features:
 * - Progress tracking and persistence
 * - Keyboard navigation (Arrow keys, Enter, Escape)
 * - Full accessibility support (ARIA labels, screen reader friendly)
 * - Dark mode compatible
 * - Responsive design
 * - Can be resumed from any step
 * 
 * @example
 * ```tsx
 * <ProfileOnboardingWizard
 *   isOpen={showOnboarding}
 *   onComplete={() => setShowOnboarding(false)}
 *   onDismiss={() => setShowOnboarding(false)}
 * />
 * ```
 */
export function ProfileOnboardingWizard({
  onDismiss,
  onComplete,
  isOpen = true,
}: ProfileOnboardingWizardProps) {
  const router = useRouter();
  const capabilities = useOpenStrandStore((state) => state.capabilities);

  // Load persisted state from localStorage
  const [state, setState] = useState<OnboardingState>(() => {
    if (typeof window === 'undefined') {
      return {
        currentStep: 0,
        selectedGoal: null,
        storageType: 'local',
        displayName: '',
        enableNotifications: true,
        enableAutoInsights: true,
        importData: false,
        completed: false,
      };
    }

    try {
      const saved = localStorage.getItem('openstrand-onboarding-state');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('Failed to load onboarding state:', error);
    }

    return {
      currentStep: 0,
      selectedGoal: null,
      storageType: 'local',
      displayName: '',
      enableNotifications: true,
      enableAutoInsights: true,
      importData: false,
      completed: false,
    };
  });

  /**
   * Persist state to localStorage whenever it changes
   */
  useEffect(() => {
    try {
      localStorage.setItem('openstrand-onboarding-state', JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save onboarding state:', error);
    }
  }, [state]);

  /**
   * Update a specific field in the state
   */
  const updateState = useCallback((updates: Partial<OnboardingState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  const TOTAL_STEPS = 5;

  /**
   * Move to the next step
   */
  const nextStep = useCallback(() => {
    if (state.currentStep < TOTAL_STEPS - 1) {
      updateState({ currentStep: state.currentStep + 1 });
    }
  }, [state.currentStep, updateState]);

  /**
   * Move to the previous step
   */
  const previousStep = useCallback(() => {
    if (state.currentStep > 0) {
      updateState({ currentStep: state.currentStep - 1 });
    }
  }, [state.currentStep, updateState]);

  /**
   * Complete the onboarding process
   */
  const completeOnboarding = useCallback(async () => {
    try {
      // Save preferences to backend or local storage
      updateState({ completed: true });
      
      // Show success message
      toast.success('Welcome to OpenStrand! Your workspace is ready.');
      
      // Clear onboarding state
      localStorage.removeItem('openstrand-onboarding-state');
      
      // Call completion callback
      onComplete?.();
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      toast.error('Failed to save preferences. Please try again.');
    }
  }, [onComplete, updateState]);

  /**
   * Handle keyboard navigation
   */
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'Escape':
          onDismiss?.();
          break;
        case 'ArrowRight':
          if (!event.ctrlKey && !event.metaKey) {
            nextStep();
          }
          break;
        case 'ArrowLeft':
          if (!event.ctrlKey && !event.metaKey) {
            previousStep();
          }
          break;
        case 'Enter':
          if (state.currentStep === TOTAL_STEPS - 1) {
            completeOnboarding();
          } else if (canProceed(state.currentStep)) {
            nextStep();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, state.currentStep, nextStep, previousStep, completeOnboarding, onDismiss]);

  /**
   * Check if user can proceed from current step
   */
  const canProceed = useCallback((step: number): boolean => {
    switch (step) {
      case 0:
        return state.selectedGoal !== null;
      case 1:
        return true; // Storage type has default
      case 2:
        return true; // Feature discovery can be skipped
      case 3:
        return true; // Preferences have defaults
      default:
        return true;
    }
  }, [state.selectedGoal]);

  const progress = ((state.currentStep + 1) / TOTAL_STEPS) * 100;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onDismiss?.();
        }
      }}
    >
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <CardHeader className="space-y-1">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle id="onboarding-title" className="text-2xl">
                Welcome to OpenStrand
              </CardTitle>
              <CardDescription>
                Let's personalize your experience
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onDismiss}
              aria-label="Close onboarding wizard"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Progress bar */}
          <div className="pt-4 space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Step {state.currentStep + 1} of {TOTAL_STEPS}</span>
              <span>{Math.round(progress)}% complete</span>
            </div>
            <Progress value={progress} className="h-2" aria-label="Onboarding progress" />
          </div>
        </CardHeader>

        <Separator />

        {/* Step Content */}
        <CardContent className="pt-6">
          {/* Step 0: Goal Setting */}
          {state.currentStep === 0 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  What brings you to OpenStrand?
                </h3>
                <p className="text-sm text-muted-foreground">
                  This helps us personalize your experience and recommend relevant features.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {USER_GOALS.map((goal) => {
                  const Icon = goal.icon;
                  const isSelected = state.selectedGoal === goal.id;

                  return (
                    <button
                      key={goal.id}
                      onClick={() => updateState({ selectedGoal: goal.id })}
                      className={cn(
                        'group relative flex flex-col items-start gap-3 rounded-lg border-2 p-4 text-left transition-all',
                        'hover:border-primary/50 hover:bg-accent/50',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                        isSelected
                          ? 'border-primary bg-accent'
                          : 'border-border bg-background'
                      )}
                      role="radio"
                      aria-checked={isSelected}
                    >
                      <div className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br',
                        goal.color
                      )}>
                        <Icon className="h-5 w-5 text-white" />
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{goal.label}</h4>
                          {isSelected && (
                            <CheckCircle className="h-4 w-4 text-primary" aria-hidden="true" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {goal.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 1: Workspace Setup */}
          {state.currentStep === 1 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Database className="h-5 w-5 text-primary" />
                  Configure Your Workspace
                </h3>
                <p className="text-sm text-muted-foreground">
                  Choose where to store your data and how to access it.
                </p>
              </div>

              {/* Storage Type */}
              <div className="space-y-4">
                <Label>Storage Backend</Label>
                <div className="grid gap-4 sm:grid-cols-2">
                  {STORAGE_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    const isSelected = state.storageType === option.id;

                    return (
                      <button
                        key={option.id}
                        onClick={() => updateState({ storageType: option.id as 'local' | 'cloud' })}
                        className={cn(
                          'relative flex flex-col items-start gap-3 rounded-lg border-2 p-4 text-left transition-all',
                          'hover:border-primary/50 hover:bg-accent/50',
                          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                          isSelected
                            ? 'border-primary bg-accent'
                            : 'border-border bg-background'
                        )}
                        aria-pressed={isSelected}
                      >
                        {option.recommended && (
                          <Badge variant="secondary" className="absolute top-2 right-2">
                            Recommended
                          </Badge>
                        )}

                        <Icon className="h-8 w-8 text-primary" />

                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{option.label}</h4>
                            {isSelected && (
                              <CheckCircle className="h-4 w-4 text-primary" aria-hidden="true" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {option.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Display Name */}
              <div className="space-y-2">
                <Label htmlFor="display-name">Display Name (Optional)</Label>
                <Input
                  id="display-name"
                  type="text"
                  placeholder="Enter your name"
                  value={state.displayName}
                  onChange={(e) => updateState({ displayName: e.target.value })}
                  aria-describedby="display-name-hint"
                />
                <p id="display-name-hint" className="text-xs text-muted-foreground">
                  This will be shown in your profile and when collaborating with others.
                </p>
              </div>

              {/* Import Data Option */}
              <div className="flex items-start space-x-3 rounded-lg border p-4">
                <Upload className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="import-data" className="cursor-pointer">
                      Import Existing Data
                    </Label>
                    <Switch
                      id="import-data"
                      checked={state.importData}
                      onCheckedChange={(checked) => updateState({ importData: checked })}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Import notes from Notion, Obsidian, or other tools
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Feature Discovery */}
          {state.currentStep === 2 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Discover Key Features
                </h3>
                <p className="text-sm text-muted-foreground">
                  Get familiar with what makes OpenStrand powerful.
                </p>
              </div>

              <div className="space-y-4">
                {[
                  {
                    title: 'Create Strands',
                    description: 'Build interconnected knowledge nodes with rich metadata',
                    icon: BookOpen,
                  },
                  {
                    title: 'Weave Connections',
                    description: 'Link strands together to form knowledge graphs',
                    icon: Sparkles,
                  },
                  {
                    title: 'Visualize Data',
                    description: 'Generate beautiful visualizations from your data',
                    icon: BarChart3,
                  },
                  {
                    title: 'Collaborate',
                    description: 'Share and work together with your team',
                    icon: Users,
                  },
                ].map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <div
                      key={index}
                      className="flex items-start gap-4 rounded-lg border p-4 bg-accent/50"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-medium">{feature.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="rounded-lg bg-primary/5 p-4 border border-primary/20">
                <p className="text-sm font-medium flex items-center gap-2">
                  <Rocket className="h-4 w-4 text-primary" />
                  Tip: You can start a guided tour anytime from the help menu
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Preferences */}
          {state.currentStep === 3 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Settings className="h-5 w-5 text-primary" />
                  Customize Your Experience
                </h3>
                <p className="text-sm text-muted-foreground">
                  Configure how OpenStrand works for you. You can change these later.
                </p>
              </div>

              <div className="space-y-4">
                {/* Notifications */}
                <div className="flex items-start space-x-3 rounded-lg border p-4">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="notifications" className="cursor-pointer">
                        Enable Notifications
                      </Label>
                      <Switch
                        id="notifications"
                        checked={state.enableNotifications}
                        onCheckedChange={(checked) => updateState({ enableNotifications: checked })}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Get notified about updates, mentions, and important events
                    </p>
                  </div>
                </div>

                {/* Auto Insights */}
                <div className="flex items-start space-x-3 rounded-lg border p-4">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="auto-insights" className="cursor-pointer">
                        Enable Auto-Insights
                      </Label>
                      <Switch
                        id="auto-insights"
                        checked={state.enableAutoInsights}
                        onCheckedChange={(checked) => updateState({ enableAutoInsights: checked })}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Automatically generate insights and suggestions from your data
                    </p>
                  </div>
                </div>

                {/* Privacy Note */}
                <div className="rounded-lg bg-muted/50 p-4 border flex items-start gap-3">
                  <Shield className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium">Your Privacy Matters</h4>
                    <p className="text-xs text-muted-foreground">
                      We never share your data with third parties. All processing happens
                      {state.storageType === 'local' ? ' locally on your device' : ' securely in the cloud'}.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Success & Next Steps */}
          {state.currentStep === 4 && (
            <div className="space-y-6 text-center">
              <div className="flex justify-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-emerald-500">
                  <Rocket className="h-10 w-10 text-white" />
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-bold">You're All Set!</h3>
                <p className="text-muted-foreground">
                  Your workspace is configured and ready to use.
                </p>
              </div>

              <Separator />

              <div className="space-y-4 text-left">
                <h4 className="font-semibold">Recommended Next Steps:</h4>
                <div className="space-y-3">
                  {[
                    {
                      title: 'Create your first strand',
                      description: 'Start building your knowledge base',
                      link: '/pkms/strands',
                    },
                    {
                      title: 'Explore tutorials',
                      description: 'Learn best practices and workflows',
                      link: '/tutorials',
                    },
                    {
                      title: 'Join the community',
                      description: 'Connect with other OpenStrand users',
                      link: '/contact',
                    },
                  ].map((item, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        completeOnboarding();
                        router.push(item.link);
                      }}
                      className="flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-accent"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                        {index + 1}
                      </div>
                      <div className="flex-1 space-y-0.5">
                        <h5 className="font-medium">{item.title}</h5>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>

        <Separator />

        {/* Footer Navigation */}
        <div className="flex items-center justify-between p-6">
          <Button
            variant="ghost"
            onClick={previousStep}
            disabled={state.currentStep === 0}
            aria-label="Previous step"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <div className="flex gap-2">
            {state.currentStep < TOTAL_STEPS - 1 ? (
              <>
                <Button variant="ghost" onClick={onDismiss}>
                  Skip for now
                </Button>
                <Button
                  onClick={nextStep}
                  disabled={!canProceed(state.currentStep)}
                  aria-label="Next step"
                >
                  Continue
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </>
            ) : (
              <Button onClick={completeOnboarding} className="min-w-32">
                Get Started
                <Rocket className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

