'use client';

import { useEffect, useMemo, useState, type ElementType } from 'react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Globe,
  Server,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useOpenStrandStore } from '@/store/openstrand.store';
import { useFeatureFlags } from '@/lib/feature-flags';
import { useAppMode } from '@/hooks/useAppMode';

interface TeamOnboardingProps {
  onOpenSettings?: () => void;
}

type StepAction = {
  label: string;
  href: string;
  external?: boolean;
};

type TeamOnboardingStep = {
  id: string;
  title: string;
  description: string;
  icon: ElementType;
  actions?: StepAction[];
};

const ADMIN_CONSOLE_URL = process.env.NEXT_PUBLIC_ADMIN_CONSOLE_URL ?? 'http://localhost:3002';

const steps: TeamOnboardingStep[] = [
  {
    id: 'infrastructure',
    title: 'Verify infrastructure health',
    description:
      'Open the Teams admin console to confirm PostgreSQL, Redis, and worker services are online. This ensures caching, BullMQ jobs, and attachment processing stay reliable.',
    icon: Server,
    actions: [
      { label: 'Open admin console', href: ADMIN_CONSOLE_URL, external: true },
    ],
  },
  {
    id: 'team-access',
    title: 'Invite your teammates & assign roles',
    description:
      'Create seats for editors, reviewers, and viewers. Use RBAC roles (owner, admin, editor, viewer) to map responsibilities before sharing strands or workspaces.',
    icon: Users,
    actions: [
      { label: 'Team onboarding guide', href: '/tutorials/dx-ux-blueprint' },
    ],
  },
  {
    id: 'security',
    title: 'Configure RBAC & compliance workflows',
    description:
      'Audit strand permissions, strand-level visibility, and WeaveEdge attribution. Enable SSO/SAML or JWT rotation in the admin console when operating in regulated environments.',
    icon: ShieldCheck,
    actions: [
      { label: 'RBAC checklist', href: '/tutorials/metadata-playbook' },
    ],
  },
  {
    id: 'automation',
    title: 'Enable AI pipelines and publishing automations',
    description:
      'Connect voice notes, OCR, and prompt chains to your preferred AI providers. Validate BullMQ queues and ensure cost tracking is configured before publishing datasets or knowledge hubs.',
    icon: Sparkles,
    actions: [
      { label: 'Automation playbook', href: '/tutorials/llm-augmentations' },
    ],
  },
  {
    id: 'launch',
    title: 'Launch and share your workspace',
    description:
      'Set up custom domains, export knowledge bundles, and announce the workspace to collaborators. Use the activity timeline to monitor engagement after launch.',
    icon: Globe,
    actions: [
      { label: 'Publisher checklist', href: 'https://docs.openstrand.com', external: true },
    ],
  },
];

export function TeamOnboarding({ onOpenSettings }: TeamOnboardingProps) {
  const { isTeamEdition } = useFeatureFlags();
  const { mode } = useAppMode();
  const capabilities = useOpenStrandStore((state) => state.capabilities);
  const teamOnboardingComplete = useOpenStrandStore((state) => state.teamOnboardingComplete);
  const completeTeamOnboarding = useOpenStrandStore((state) => state.completeTeamOnboarding);

  const [open, setOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const environmentMode = capabilities?.environment?.mode ?? mode;

  useEffect(() => {
    if (isTeamEdition && environmentMode === 'cloud' && !teamOnboardingComplete) {
      setOpen(true);
    }
  }, [isTeamEdition, environmentMode, teamOnboardingComplete]);

  const currentStep = useMemo(() => steps[activeStep], [activeStep]);
  const ActiveIcon = currentStep.icon;

  const openSettingsAndDismiss = () => {
    setOpen(false);
    onOpenSettings?.();
  };

  if (!open) {
    return null;
  }

  const totalSteps = steps.length;
  const progress = Math.round(((activeStep + 1) / totalSteps) * 100);

  const handleComplete = async () => {
    try {
      await completeTeamOnboarding(true);
      toast.success('Team onboarding marked as complete');
    } catch (error) {
      console.error(error);
    } finally {
      setOpen(false);
    }
  };

  const handleSkip = () => {
    setOpen(false);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-background/85 backdrop-blur-sm px-4 py-10">
      <Card className="w-full max-w-3xl border-border/60 bg-background/95 shadow-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="gap-2">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="uppercase tracking-wide">Teams edition</Badge>
            <Badge variant="outline">Cloud</Badge>
          </div>
          <CardTitle className="text-2xl">Set up your collaborative workspace</CardTitle>
          <CardDescription>
            Follow these steps to align infrastructure, permissions, and AI pipelines before inviting
            collaborators into your Teams environment.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <span>
              Step {activeStep + 1} of {totalSteps} · {progress}% complete
            </span>
          </div>

          <div className="flex flex-col gap-6 md:flex-row">
            <nav className="md:w-1/3 space-y-2">
              {steps.map((step, index) => {
                const isActive = index === activeStep;
                const Icon = step.icon;
                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => setActiveStep(index)}
                    className={cn(
                      'flex w-full items-start gap-3 rounded-md border px-3 py-2 text-left transition',
                      isActive
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-transparent bg-muted/40 text-muted-foreground hover:border-primary/30 hover:bg-primary/5 hover:text-primary',
                    )}
                  >
                    <Icon className="mt-1 h-4 w-4" />
                    <div>
                      <span className="block text-sm font-medium">{step.title}</span>
                      <span className="text-xs">{index < activeStep ? 'Completed' : `Step ${index + 1}`}</span>
                    </div>
                  </button>
                );
              })}
            </nav>

            <Separator orientation="vertical" className="hidden md:block" />

            <section className="flex-1 space-y-4">
              <div className="flex items-center gap-3">
                <ActiveIcon className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">{currentStep.title}</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {currentStep.description}
              </p>
              {currentStep.actions && currentStep.actions.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {currentStep.actions.map((action) =>
                    action.external ? (
                      <Button key={action.label} variant="outline" size="sm" asChild>
                        <a href={action.href} target="_blank" rel="noreferrer">
                          {action.label}
                        </a>
                      </Button>
                    ) : (
                      <Button key={action.label} variant="outline" size="sm" asChild>
                        <Link href={action.href}>{action.label}</Link>
                      </Button>
                    ),
                  )}
                  {currentStep.id === 'team-access' && onOpenSettings ? (
                    <Button variant="ghost" size="sm" onClick={openSettingsAndDismiss}>
                      Open settings
                    </Button>
                  ) : null}
                </div>
              ) : null}
            </section>
          </div>

          <Separator />

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs text-muted-foreground">
              Progress saves locally. You can revisit this checklist anytime from the dashboard.
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSkip}
              >
                Remind me later
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveStep((prev) => Math.max(prev - 1, 0))}
                disabled={activeStep === 0}
              >
                <ArrowLeft className="mr-1 h-4 w-4" /> Back
              </Button>
              {activeStep === totalSteps - 1 ? (
                <Button variant="default" size="sm" onClick={handleComplete}>
                  Mark complete
                </Button>
              ) : (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setActiveStep((prev) => Math.min(prev + 1, totalSteps - 1))}
                >
                  Next <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

