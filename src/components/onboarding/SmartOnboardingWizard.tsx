'use client';

/**
 * Smart Onboarding Wizard
 * 
 * Unified onboarding wizard that adapts based on environment mode (offline, local, cloud)
 * and edition (Community, Teams).
 * 
 * @module components/onboarding
 */

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles, 
  FolderOpen, 
  Building2,
  Users,
  Loader2
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useOpenStrandStore } from '@/store/openstrand.store';
import { useFeatureFlags } from '@/lib/feature-flags';
import { useAppMode } from '@/hooks/useAppMode';

import { StorageOnboardingStep } from './StorageOnboardingStep';
import { TemplateSelector } from './TemplateSelector';
import { WorkEmailEnrichment } from './WorkEmailEnrichment';

/**
 * Wizard step configuration
 */
interface WizardStep {
  id: string;
  title: string;
  description: string;
  icon: typeof Sparkles;
  component?: React.ComponentType<WizardStepProps>;
  condition?: (context: WizardContext) => boolean;
}

/**
 * Wizard step props
 */
interface WizardStepProps {
  onNext: () => void;
  onSkip: () => void;
  wizardData: Record<string, unknown>;
  updateWizardData: (data: Record<string, unknown>) => void;
}

/**
 * Wizard context
 */
interface WizardContext {
  isTeamEdition: boolean;
  isOffline: boolean;
  isCloud: boolean;
  userEmail?: string;
}

/**
 * Smart Onboarding Wizard Component
 */
export function SmartOnboardingWizard() {
  const router = useRouter();
  const { isTeamEdition, features } = useFeatureFlags();
  const { mode } = useAppMode();
  const capabilities = useOpenStrandStore((state) => state.capabilities);
  const user = useOpenStrandStore((state) => state.user);

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [wizardData, setWizardData] = useState<Record<string, unknown>>({});
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Determine environment
  const environmentMode = capabilities?.environment?.mode ?? mode;
  const isOffline = environmentMode === 'offline';
  const isCloud = environmentMode === 'cloud';

  // Build context
  const context: WizardContext = {
    isTeamEdition,
    isOffline,
    isCloud,
    userEmail: user?.email,
  };

  // Define steps (filtered by conditions)
  const allSteps: WizardStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to OpenStrand',
      description: 'Let's set up your knowledge workspace',
      icon: Sparkles,
    },
    {
      id: 'storage',
      title: 'Storage Configuration',
      description: 'Choose where to store your data',
      icon: FolderOpen,
      component: StorageOnboardingStep as any,
      condition: (ctx) => ctx.isOffline || !ctx.isCloud,
    },
    {
      id: 'template',
      title: 'Choose a Template',
      description: 'Start with a pre-built layout',
      icon: Building2,
      component: TemplateSelector as any,
    },
    {
      id: 'work-email',
      title: 'Company Enrichment',
      description: 'Auto-populate with company info',
      icon: Building2,
      component: WorkEmailEnrichment as any,
      condition: (ctx) => ctx.isTeamEdition && !!ctx.userEmail,
    },
    {
      id: 'team-setup',
      title: 'Team Setup',
      description: 'Invite teammates and configure roles',
      icon: Users,
      condition: (ctx) => ctx.isTeamEdition && ctx.isCloud,
    },
    {
      id: 'complete',
      title: 'All Set!',
      description: 'Your workspace is ready',
      icon: CheckCircle2,
    },
  ];

  // Filter steps based on conditions
  const steps = useMemo(() => {
    return allSteps.filter((step) => {
      if (!step.condition) return true;
      return step.condition(context);
    });
  }, [context]);

  const currentStep = steps[currentStepIndex];
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  // Create wizard session on mount
  useEffect(() => {
    createWizardSession();
  }, []);

  /**
   * Create wizard session
   */
  const createWizardSession = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

      if (!token) return; // Skip if not authenticated

      const response = await fetch(`${backendUrl}/api/wizard/session`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'onboarding',
          totalSteps: steps.length,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSessionId(data.id);
      }
    } catch (error) {
      console.error('Failed to create wizard session:', error);
      // Continue without session tracking
    }
  };

  /**
   * Update wizard session
   */
  const updateWizardSession = async (updates: Record<string, unknown>) => {
    if (!sessionId) return;

    try {
      const token = localStorage.getItem('auth_token');
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

      await fetch(`${backendUrl}/api/wizard/session/${sessionId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentStep: currentStepIndex,
          data: { ...wizardData, ...updates },
        }),
      });
    } catch (error) {
      console.error('Failed to update wizard session:', error);
    }
  };

  /**
   * Handle next step
   */
  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
      updateWizardSession({ currentStep: currentStepIndex + 1 });
    } else {
      handleComplete();
    }
  };

  /**
   * Handle skip step
   */
  const handleSkip = () => {
    handleNext();
  };

  /**
   * Handle back
   */
  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
      updateWizardSession({ currentStep: currentStepIndex - 1 });
    }
  };

  /**
   * Update wizard data
   */
  const updateData = (data: Record<string, unknown>) => {
    setWizardData((prev) => ({ ...prev, ...data }));
    updateWizardSession(data);
  };

  /**
   * Complete wizard
   */
  const handleComplete = async () => {
    setIsLoading(true);

    try {
      // Mark session as completed
      if (sessionId) {
        const token = localStorage.getItem('auth_token');
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

        await fetch(`${backendUrl}/api/wizard/session/${sessionId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: 'completed',
          }),
        });
      }

      // Mark onboarding as complete in store
      if (isTeamEdition) {
        useOpenStrandStore.getState().completeTeamOnboarding(true);
      } else {
        useOpenStrandStore.getState().completeLocalOnboarding(true);
      }

      toast.success('Onboarding complete! Welcome to OpenStrand.');

      // Navigate to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      toast.error('Failed to complete onboarding');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Render step content
   */
  const renderStepContent = () => {
    const StepComponent = currentStep.component;

    if (StepComponent) {
      return (
        <StepComponent
          onNext={handleNext}
          onSkip={handleSkip}
          wizardData={wizardData}
          updateWizardData={updateData}
        />
      );
    }

    // Default content for steps without custom component
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-6">
        <div className="rounded-full bg-primary/10 p-6">
          <currentStep.icon className="h-12 w-12 text-primary" />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-2xl font-semibold">{currentStep.title}</h3>
          <p className="text-muted-foreground">{currentStep.description}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-background/80 backdrop-blur-sm px-4 py-10">
      <Card className="w-full max-w-3xl border-border/60 shadow-2xl">
        <CardHeader className="space-y-4 border-b border-border/60 pb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="uppercase tracking-wide">
                {isTeamEdition ? 'Teams Edition' : 'Community Edition'}
              </Badge>
              {isOffline && <Badge variant="outline">Offline</Badge>}
              {isCloud && <Badge variant="outline">Cloud</Badge>}
            </div>
            <span className="text-sm text-muted-foreground">
              Step {currentStepIndex + 1} of {steps.length}
            </span>
          </div>
          
          <div className="space-y-2">
            <CardTitle className="text-2xl">Setup Wizard</CardTitle>
            <Progress value={progress} className="h-2" />
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          {renderStepContent()}

          {/* Navigation */}
          {!currentStep.component && (
            <div className="flex items-center justify-between gap-4 pt-6 border-t border-border/60 mt-6">
              <Button
                variant="ghost"
                onClick={handleBack}
                disabled={currentStepIndex === 0}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>

              <div className="flex gap-2">
                {currentStepIndex < steps.length - 1 && (
                  <Button variant="outline" onClick={handleSkip}>
                    Skip
                  </Button>
                )}
                <Button onClick={handleNext} disabled={isLoading}>
                  {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {currentStepIndex === steps.length - 1 ? 'Finish' : 'Next'}
                  {currentStepIndex < steps.length - 1 && (
                    <ArrowRight className="h-4 w-4 ml-2" />
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

