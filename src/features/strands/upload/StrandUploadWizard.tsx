'use client';

import React, { useCallback, useReducer, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { toast } from 'react-hot-toast';

import { api, StrandVerificationResult } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppMode } from '@/hooks/useAppMode';
import { cn } from '@/lib/utils';

type StepId = 'basics' | 'content' | 'metadata' | 'verification' | 'publish';

const STEPS: Array<{ id: StepId; title: string; description: string }> = [
  {
    id: 'basics',
    title: 'Strand basics',
    description: 'Choose strand type, note type, and target scope.',
  },
  {
    id: 'content',
    title: 'Content & attachments',
    description: 'Author the primary body and attach supporting material.',
  },
  {
    id: 'metadata',
    title: 'Metadata & relationships',
    description: 'Describe topics, licensing, and upstream references.',
  },
  {
    id: 'verification',
    title: 'Verification',
    description: 'Fingerprint the strand and detect duplicates or conflicts.',
  },
  {
    id: 'publish',
    title: 'Publish',
    description: 'Confirm settings and publish the strand to its scope.',
  },
];

const STRAND_TYPES = [
  { value: 'note', label: 'Knowledge strand (note)' },
  { value: 'dataset', label: 'Dataset reference' },
  { value: 'paper', label: 'Academic paper' },
  { value: 'article', label: 'Article or blog post' },
  { value: 'tutorial', label: 'Tutorial or guide' },
];

const NOTE_TYPES = [
  { value: 'summary', label: 'Summary' },
  { value: 'analysis', label: 'Analysis' },
  { value: 'review', label: 'Review' },
  { value: 'question', label: 'Question' },
  { value: 'idea', label: 'Idea' },
];

interface WizardState {
  draft: {
    strandType: string;
    noteType: string;
    scopeId: string;
    title: string;
    summary: string;
    content: string;
    tags: string[];
    references: string[];
    datasetId?: string;
    license: string;
    allowStructureRequests: boolean;
  };
  attachments: File[];
  verification: StrandVerificationResult | null;
  acknowledged: boolean;
  forceDuplicate: boolean;
  verifying: boolean;
  publishing: boolean;
}

const DEFAULT_STATE: WizardState = {
  draft: {
    strandType: 'note',
    noteType: 'summary',
    scopeId: 'personal',
    title: '',
    summary: '',
    content: '',
    tags: [],
    references: [],
    datasetId: undefined,
    license: 'CC-BY-4.0',
    allowStructureRequests: false,
  },
  attachments: [],
  verification: null,
  acknowledged: false,
  forceDuplicate: false,
  verifying: false,
  publishing: false,
};

type Action =
  | { type: 'SET_STRAND_TYPE'; value: string }
  | { type: 'SET_NOTE_TYPE'; value: string }
  | { type: 'SET_SCOPE_ID'; value: string }
  | { type: 'SET_TITLE'; value: string }
  | { type: 'SET_SUMMARY'; value: string }
  | { type: 'SET_CONTENT'; value: string }
  | { type: 'SET_TAGS'; value: string[] }
  | { type: 'SET_REFERENCES'; value: string[] }
  | { type: 'SET_DATASET_ID'; value: string | undefined }
  | { type: 'SET_LICENSE'; value: string }
  | { type: 'SET_ALLOW_STRUCTURE_REQUESTS'; value: boolean }
  | { type: 'ADD_ATTACHMENT'; value: File }
  | { type: 'REMOVE_ATTACHMENT'; value: number }
  | { type: 'SET_VERIFICATION'; value: StrandVerificationResult }
  | { type: 'SET_ACKNOWLEDGED'; value: boolean }
  | { type: 'SET_FORCE_DUPLICATE'; value: boolean }
  | { type: 'SET_VERIFYING'; value: boolean }
  | { type: 'SET_PUBLISHING'; value: boolean }
  | { type: 'RESET' };

function reducer(state: WizardState, action: Action): WizardState {
  switch (action.type) {
    case 'SET_STRAND_TYPE':
      return { ...state, draft: { ...state.draft, strandType: action.value } };
    case 'SET_NOTE_TYPE':
      return { ...state, draft: { ...state.draft, noteType: action.value } };
    case 'SET_SCOPE_ID':
      return { ...state, draft: { ...state.draft, scopeId: action.value } };
    case 'SET_TITLE':
      return { ...state, draft: { ...state.draft, title: action.value } };
    case 'SET_SUMMARY':
      return { ...state, draft: { ...state.draft, summary: action.value } };
    case 'SET_CONTENT':
      return { ...state, draft: { ...state.draft, content: action.value } };
    case 'SET_TAGS':
      return { ...state, draft: { ...state.draft, tags: action.value } };
    case 'SET_REFERENCES':
      return { ...state, draft: { ...state.draft, references: action.value } };
    case 'SET_DATASET_ID':
      return { ...state, draft: { ...state.draft, datasetId: action.value } };
    case 'SET_LICENSE':
      return { ...state, draft: { ...state.draft, license: action.value } };
    case 'SET_ALLOW_STRUCTURE_REQUESTS':
      return { ...state, draft: { ...state.draft, allowStructureRequests: action.value } };
    case 'ADD_ATTACHMENT':
      return { ...state, attachments: [...state.attachments, action.value] };
    case 'REMOVE_ATTACHMENT':
      return { ...state, attachments: state.attachments.filter((_, i) => i !== action.value) };
    case 'SET_VERIFICATION':
      return { ...state, verification: action.value };
    case 'SET_ACKNOWLEDGED':
      return { ...state, acknowledged: action.value };
    case 'SET_FORCE_DUPLICATE':
      return { ...state, forceDuplicate: action.value };
    case 'SET_VERIFYING':
      return { ...state, verifying: action.value };
    case 'SET_PUBLISHING':
      return { ...state, publishing: action.value };
    case 'RESET':
      return DEFAULT_STATE;
    default:
      return state;
  }
}

type StrandUploadWizardContentProps = {
  state: WizardState;
  dispatch: React.Dispatch<Action>;
  stepIndex: number;
  currentStep: (typeof STEPS)[number];
  canBack: boolean;
  policyNote: string;
  datasetHint: boolean;
  handleNext: () => void;
  handleBack: () => void;
  handlePublish: () => Promise<void>;
};

// Separate render component to avoid SWC parser bug
function StrandUploadWizardContent(props: StrandUploadWizardContentProps) {
  const {
    state,
    dispatch,
    stepIndex,
    currentStep,
    canBack,
    policyNote,
    datasetHint,
    handleNext,
    handleBack,
    handlePublish,
  } = props;

  return (
    <div className="space-y-10">
      <header className="rounded-3xl border border-border/70 bg-card/80 p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Create a strand</h1>
            <p className="text-sm text-muted-foreground">{policyNote}</p>
          </div>
          <div className="flex items-center gap-2">
            {STEPS.map((step, index) => {
              const isActive = index === stepIndex;
              const isDone = index < stepIndex;
              let stepClassName = 'border-border/60 text-muted-foreground';
              if (isActive) {
                stepClassName = 'border-primary/50 bg-primary/10 text-primary';
              } else if (isDone) {
                stepClassName = 'border-emerald-300/60 bg-emerald-50 text-emerald-600';
              }
              return (
                <div
                  key={step.id}
                  className={cn(
                    'flex flex-col items-center rounded-xl border px-3 py-2 text-xs transition',
                    stepClassName
                  )}
                >
                  <span className="font-semibold">{index + 1}</span>
                  <span className="hidden text-[11px] font-medium md:block">{step.title}</span>
                </div>
              );
            })}
          </div>
        </div>
      </header>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle>{currentStep.title}</CardTitle>
          <CardDescription>{currentStep.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {currentStep.id === 'basics' && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <label className="text-xs font-semibold uppercase text-muted-foreground">Strand type</label>
                <Select
                  value={state.draft.strandType}
                  onValueChange={(value) => dispatch({ type: 'SET_STRAND_TYPE', value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STRAND_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {state.draft.strandType === 'note' && (
                <div className="space-y-3">
                  <label className="text-xs font-semibold uppercase text-muted-foreground">Note type</label>
                  <Select
                    value={state.draft.noteType}
                    onValueChange={(value) => dispatch({ type: 'SET_NOTE_TYPE', value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {NOTE_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {datasetHint && (
                <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 md:col-span-2">
                  <div className="flex gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <p className="text-xs text-yellow-800">
                      For dataset strands, upload the actual data through the Catalogs section first.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {currentStep.id === 'content' && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={state.draft.title}
                  onChange={(e) => dispatch({ type: 'SET_TITLE', value: e.target.value })}
                  placeholder="Enter a descriptive title"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Summary</label>
                <Textarea
                  value={state.draft.summary}
                  onChange={(e) => dispatch({ type: 'SET_SUMMARY', value: e.target.value })}
                  placeholder="Brief summary of your strand"
                  rows={3}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Content</label>
                <Textarea
                  value={state.draft.content}
                  onChange={(e) => dispatch({ type: 'SET_CONTENT', value: e.target.value })}
                  placeholder="Main content of your strand"
                  rows={10}
                />
              </div>
            </div>
          )}

          {currentStep.id === 'metadata' && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Tags</label>
                <Input
                  value={state.draft.tags.join(', ')}
                  onChange={(e) => dispatch({ type: 'SET_TAGS', value: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
                  placeholder="Comma-separated tags"
                />
              </div>
              <div>
                <label className="text-sm font-medium">License</label>
                <Input
                  value={state.draft.license}
                  onChange={(e) => dispatch({ type: 'SET_LICENSE', value: e.target.value })}
                  placeholder="e.g., CC-BY-4.0"
                />
              </div>
            </div>
          )}

          {currentStep.id === 'verification' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase text-muted-foreground">
                  Deduplication & policy checks
                </h3>
                {state.verifying && (
                  <Badge variant="outline" className="gap-1">
                    <Sparkles className="h-3 w-3 animate-pulse" />
                    Verifying...
                  </Badge>
                )}
              </div>

              {state.verification ? (
                <div className="space-y-3">
                  {(state.verification.isDuplicate ?? state.verification.status === 'duplicate') ? (
                    <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                      <div className="flex gap-3">
                        <AlertTriangle className="h-5 w-5 text-yellow-600" />
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-yellow-900">Potential duplicate detected</p>
                          <p className="text-xs text-yellow-800">
                            Similar content already exists. You can still publish, but consider reviewing existing strands first.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="text-sm font-medium">No duplicates found</span>
                    </div>
                  )}

                  {(state.verification.policyViolations?.length ??
                    state.verification.warnings?.length ??
                    0) > 0 ? (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                      <div className="flex gap-3">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-red-900">Policy violations detected</p>
                          <ul className="list-disc list-inside text-xs text-red-800">
                            {(state.verification.policyViolations ?? state.verification.warnings ?? []).map(
                              (violation, index) => (
                              <li key={index}>{violation}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="text-sm font-medium">Policy check passed</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Click "Verify" to check for duplicates and policy compliance.
                </p>
              )}
            </div>
          )}

          {currentStep.id === 'publish' && (
            <div className="space-y-4">
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <h3 className="font-medium text-blue-900">Ready to publish</h3>
                <p className="mt-1 text-sm text-blue-800">
                  Review your strand details above before publishing.
                </p>
              </div>

              <div className="flex items-start space-x-2">
                <input
                  type="checkbox"
                  id="acknowledge"
                  className="mt-1"
                  checked={state.acknowledged}
                  onChange={(e) => dispatch({ type: 'SET_ACKNOWLEDGED', value: e.target.checked })}
                />
                <label htmlFor="acknowledge" className="text-sm text-muted-foreground">
                  I acknowledge that this content is original or properly attributed, and I have the right to publish it.
                </label>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <footer className="flex items-center justify-between">
        <div className="flex gap-2">
          {canBack && (
            <Button variant="outline" onClick={handleBack}>
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          )}
        </div>

        <div className="flex gap-2">
          {currentStep.id === 'verification' && !state.verification && (
            <Button
              onClick={async () => {
                dispatch({ type: 'SET_VERIFYING', value: true });
                try {
                  const result = await api.verifyStrandDraft({
                    strandType: state.draft.strandType,
                    noteType: state.draft.noteType,
                    title: state.draft.title,
                    content: state.draft.content,
                    tags: state.draft.tags,
                    license: state.draft.license,
                  });
                  dispatch({
                    type: 'SET_VERIFICATION',
                    value: {
                      ...result,
                      isDuplicate: result.isDuplicate ?? result.status === 'duplicate',
                      policyViolations: result.policyViolations ?? result.warnings ?? [],
                    },
                  });
                  toast.success('Strand verification completed');
                } catch (error) {
                  console.error('Strand verification failed', error);
                  toast.error('Unable to verify strand at this time');
                } finally {
                  dispatch({ type: 'SET_VERIFYING', value: false });
                }
              }}
              disabled={state.verifying}
            >
              {state.verifying ? 'Verifying...' : 'Verify'}
            </Button>
          )}

          {currentStep.id === 'publish' ? (
            <Button
              onClick={handlePublish}
              disabled={!state.acknowledged || state.publishing}
            >
              {state.publishing ? 'Publishing...' : 'Publish Strand'}
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={
                (currentStep.id === 'content' && !state.draft.title) ||
                (currentStep.id === 'verification' && !state.verification)
              }
            >
              Next
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </footer>
    </div>
  );
}

export function StrandUploadWizard(): JSX.Element {
  const router = useRouter();
  const { mode } = useAppMode();
  const [state, dispatch] = useReducer(reducer, DEFAULT_STATE);
  const [stepIndex, setStepIndex] = useState(0);

  const currentStep = STEPS[stepIndex];
  const canBack = stepIndex > 0;

  // Compute policy note and dataset hint based on mode
  const policyNote = mode === 'cloud'
    ? 'Published to your cloud workspace. Collaborators can view and edit.'
    : 'Stored locally on your device. Not synced to cloud.';

  const handleNext = useCallback(() => {
    if (stepIndex < STEPS.length - 1) {
      setStepIndex(stepIndex + 1);
    }
  }, [stepIndex]);

  const handleBack = useCallback(() => {
    if (stepIndex > 0) {
      setStepIndex(stepIndex - 1);
    }
  }, [stepIndex]);

  const handlePublish = useCallback(async () => {
    if (!state.acknowledged) return;

    dispatch({ type: 'SET_PUBLISHING', value: true });

    try {
      const response = await api.createStrand({
        ...state.draft,
        references: state.draft.references.join('\n'),
        allowStructureRequests: state.draft.allowStructureRequests,
        forceDuplicate: state.forceDuplicate,
      });

      toast.success('Strand published successfully!');
      dispatch({ type: 'RESET' });
      setStepIndex(0);
      const strandId = response?.id ?? response?.strandId;
      router.push(strandId ? `/pkms/strands/${strandId}` : '/pkms');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Publish failed.';
      toast.error(message);
    } finally {
      dispatch({ type: 'SET_PUBLISHING', value: false });
    }
  }, [router, state.acknowledged, state.draft, state.forceDuplicate, state.verification]);

  const datasetHint = state.draft.strandType === 'dataset';

  // Use separate component to avoid SWC parser bug
  return (
    <StrandUploadWizardContent
      state={state}
      dispatch={dispatch}
      stepIndex={stepIndex}
      currentStep={currentStep}
      canBack={canBack}
      policyNote={policyNote}
      datasetHint={datasetHint}
      handleNext={handleNext}
      handleBack={handleBack}
      handlePublish={handlePublish}
    />
  );
}