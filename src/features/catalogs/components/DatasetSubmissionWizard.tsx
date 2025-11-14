'use client';

import React, { useCallback, useReducer, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, UploadCloud } from 'lucide-react';
import { toast } from 'react-hot-toast';

import { api, DatasetVerificationResult } from '@/services/api';
import type { CatalogVisibility, DatasetMetadata, DatasetSummary, PlanTier } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppMode } from '@/hooks/useAppMode';
import { cn } from '@/lib/utils';

type StepId = 'source' | 'metadata' | 'verification' | 'publish';

const STEPS: Array<{ id: StepId; title: string; description: string }> = [
  {
    id: 'source',
    title: 'Source & Upload',
    description: 'Attach your dataset file or link a managed source.',
  },
  {
    id: 'metadata',
    title: 'Metadata & Preview',
    description: 'Review schema highlights and describe the dataset.',
  },
  {
    id: 'verification',
    title: 'Verification',
    description: 'Check duplicates and compliance before publishing.',
  },
  {
    id: 'publish',
    title: 'Publish',
    description: 'Confirm visibility, license, and submit for review.',
  },
];

interface WizardState {
  file: File | null;
  datasetId: string | null;
  uploadMeta: DatasetMetadata | null;
  summary: DatasetSummary | null;
  metadata: {
    name: string;
    description: string;
    visibility: CatalogVisibility;
    planRequired: PlanTier;
    license: string;
    tags: string[];
    allowStrandUsage: boolean;
  };
  verification: DatasetVerificationResult | null;
  acknowledged: boolean;
  forceClone: boolean;
  uploading: boolean;
  loadingSummary: boolean;
  verifying: boolean;
  publishing: boolean;
}

const DEFAULT_STATE: WizardState = {
  file: null,
  datasetId: null,
  uploadMeta: null,
  summary: null,
  metadata: {
    name: '',
    description: '',
    visibility: 'public',
    planRequired: 'free',
    license: 'CC-BY-4.0',
    tags: [],
    allowStrandUsage: true,
  },
  verification: null,
  acknowledged: false,
  forceClone: false,
  uploading: false,
  loadingSummary: false,
  verifying: false,
  publishing: false,
};

type WizardAction =
  | { type: 'SET_FILE'; file: File | null }
  | { type: 'UPLOAD_SUCCESS'; datasetId: string; metadata: DatasetMetadata }
  | { type: 'SET_SUMMARY'; summary: DatasetSummary | null }
  | { type: 'UPDATE_METADATA'; metadata: Partial<WizardState['metadata']> }
  | { type: 'SET_VERIFICATION'; verification: DatasetVerificationResult | null }
  | { type: 'SET_ACKNOWLEDGED'; value: boolean }
  | { type: 'SET_FORCE_CLONE'; value: boolean }
  | { type: 'SET_UPLOADING'; value: boolean }
  | { type: 'SET_LOADING_SUMMARY'; value: boolean }
  | { type: 'SET_VERIFYING'; value: boolean }
  | { type: 'SET_PUBLISHING'; value: boolean }
  | { type: 'RESET' };

function reducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case 'SET_FILE':
      return { ...state, file: action.file };
    case 'UPLOAD_SUCCESS':
      return {
        ...state,
        datasetId: action.datasetId,
        uploadMeta: action.metadata,
        summary: null,
        verification: null,
        acknowledged: false,
        forceClone: false,
      };
    case 'SET_SUMMARY':
      return { ...state, summary: action.summary };
    case 'UPDATE_METADATA':
      return { ...state, metadata: { ...state.metadata, ...action.metadata } };
    case 'SET_VERIFICATION':
      return {
        ...state,
        verification: action.verification,
        acknowledged: false,
        forceClone: action.verification?.status === 'duplicate' ? state.forceClone : false,
      };
    case 'SET_ACKNOWLEDGED':
      return { ...state, acknowledged: action.value };
    case 'SET_FORCE_CLONE':
      return { ...state, forceClone: action.value };
    case 'SET_UPLOADING':
      return { ...state, uploading: action.value };
    case 'SET_LOADING_SUMMARY':
      return { ...state, loadingSummary: action.value };
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

type DatasetSubmissionWizardContentProps = {
  state: WizardState;
  dispatch: React.Dispatch<WizardAction>;
  stepIndex: number;
  currentStep: (typeof STEPS)[number];
  canBack: boolean;
  policyNote: string;
  handleNext: () => Promise<void>;
  handleBack: () => void;
  handleUpload: () => Promise<void>;
  runVerification: () => Promise<void>;
  setStepIndex: React.Dispatch<React.SetStateAction<number>>;
};

// Separate render component to avoid SWC parser bug
function DatasetSubmissionWizardContent(props: DatasetSubmissionWizardContentProps) {
  const {
    state,
    dispatch,
    stepIndex,
    currentStep,
    canBack,
    policyNote,
    handleNext,
    handleBack,
    handleUpload,
    runVerification,
    setStepIndex,
  } = props;

  return (
    <div className="space-y-10">
      <header className="rounded-3xl border border-border/70 bg-card/80 p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Submit a dataset</h1>
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
          {currentStep.id === 'source' && (
            <div className="space-y-4">
              <div className="flex items-center justify-center rounded-xl border-2 border-dashed border-border/60 p-12">
                <div className="space-y-2 text-center">
                  <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="font-medium">Upload dataset</h3>
                  <p className="text-xs text-muted-foreground">CSV, JSON, or Parquet files supported</p>
                  <Input
                    type="file"
                    accept=".csv,.json,.parquet"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        dispatch({ type: 'SET_FILE', file });
                      }
                    }}
                    className="mx-auto max-w-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep.id === 'metadata' && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Name</label>
                <Input
                  value={state.metadata.name}
                  onChange={(e) => dispatch({ type: 'UPDATE_METADATA', metadata: { name: e.target.value } })}
                  placeholder="My Dataset"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={state.metadata.description}
                  onChange={(e) => dispatch({ type: 'UPDATE_METADATA', metadata: { description: e.target.value } })}
                  placeholder="Describe your dataset..."
                  rows={4}
                />
              </div>
            </div>
          )}

          {currentStep.id === 'verification' && (
            <div className="space-y-4">
              {state.verification ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    {state.verification.duplicates.length === 0 ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    )}
                    <span className="text-sm font-medium">
                      {state.verification.duplicates.length === 0
                        ? 'No duplicates found'
                        : `${state.verification.duplicates.length} potential duplicates`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {(state.verification.warnings?.length ?? 0) === 0 ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    )}
                    <span className="text-sm font-medium">
                      {(state.verification.warnings?.length ?? 0) === 0
                        ? 'No policy warnings'
                        : `${state.verification.warnings?.length ?? 0} warning(s)`}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Running verification checks...</p>
              )}
            </div>
          )}

          {currentStep.id === 'publish' && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Visibility</label>
                <Select
                  value={state.metadata.visibility}
                  onValueChange={(value) => dispatch({ type: 'UPDATE_METADATA', metadata: { visibility: value as CatalogVisibility } })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                    <SelectItem value="organization">Organization</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">License</label>
                <Input
                  value={state.metadata.license}
                  onChange={(e) => dispatch({ type: 'UPDATE_METADATA', metadata: { license: e.target.value } })}
                  placeholder="MIT, Apache 2.0, etc."
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <footer className="flex items-center justify-between">
        <Button variant="outline" onClick={handleBack} disabled={!canBack}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button onClick={handleNext}>
          {currentStep.id === 'publish' ? 'Submit' : 'Next'}
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </footer>
    </div>
  );
}

export function DatasetSubmissionWizard(): JSX.Element {
  const router = useRouter();
  const { mode } = useAppMode();
  const [state, dispatch] = useReducer(reducer, DEFAULT_STATE);
  const [stepIndex, setStepIndex] = useState(0);

  const currentStep = STEPS[stepIndex];
  const canBack = stepIndex > 0;

  // Compute policy note based on mode
  const policyNote = mode === 'cloud' 
    ? 'Cloud moderation blocks accidental duplicates by default, while editors can override per upload with audit markers.'
    : 'Offline mode uses local hashing only. Review uploads manually for distribution rights.';

  const fetchSummary = useCallback(
    async (datasetId: string) => {
      try {
        dispatch({ type: 'SET_LOADING_SUMMARY', value: true });
        const summary = await api.getDatasetSummary(datasetId);
        dispatch({ type: 'SET_SUMMARY', summary });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unable to load dataset summary.';
        toast.error(message);
      } finally {
        dispatch({ type: 'SET_LOADING_SUMMARY', value: false });
      }
    },
    []
  );

  const handleUpload = useCallback(async () => {
    if (!state.file) {
      toast.error('Choose a dataset file before continuing.');
      return;
    }

    try {
      dispatch({ type: 'SET_UPLOADING', value: true });
      const result = await api.uploadDataset(state.file);
      dispatch({
        type: 'UPLOAD_SUCCESS',
        datasetId: result.datasetId,
        metadata: result.metadata,
      });
      dispatch({
        type: 'UPDATE_METADATA',
        metadata: {
          name: result.metadata?.filename ?? state.file.name.replace(/\.[^.]+$/, ''),
          description: '',
          tags: [],
        },
      });
      await fetchSummary(result.datasetId);
      setStepIndex(1);
      toast.success('Dataset uploaded.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Upload failed.';
      toast.error(message);
    } finally {
      dispatch({ type: 'SET_UPLOADING', value: false });
    }
  }, [fetchSummary, state.file]);

  const runVerification = useCallback(async () => {
    if (!state.datasetId) {
      toast.error('Upload a dataset first.');
      return;
    }

    try {
      dispatch({ type: 'SET_VERIFYING', value: true });
      const verification = await api.verifyCatalogDatasetDraft({
        datasetId: state.datasetId,
        name: state.metadata.name,
        description: state.metadata.description,
        tags: state.metadata.tags,
        license: state.metadata.license,
        visibility: state.metadata.visibility,
      });
      dispatch({ type: 'SET_VERIFICATION', verification });
      if (verification.status === 'ok') {
        toast.success('Verification passed.');
      } else if (verification.status === 'duplicate') {
        toast('Possible duplicates detected. Review details below.', { icon: '⚠️' });
      } else {
        toast.error('Policy issues detected. Resolve before publishing.');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Verification failed.';
      toast.error(message);
    } finally {
      dispatch({ type: 'SET_VERIFYING', value: false });
    }
  }, [
    state.datasetId,
    state.metadata.description,
    state.metadata.license,
    state.metadata.name,
    state.metadata.tags,
    state.metadata.visibility,
  ]);

  const publish = useCallback(async () => {
    if (!state.datasetId) {
      toast.error('Upload a dataset first.');
      return;
    }

    if (state.verification && state.verification.status !== 'ok' && !state.acknowledged) {
      toast.error('Acknowledge the verification warnings to continue.');
      return;
    }
    if (state.verification && state.verification.status === 'duplicate' && !state.forceClone) {
      toast.error('Enable "Create duplicate copy" to override deduplication.');
      return;
    }

    try {
      dispatch({ type: 'SET_PUBLISHING', value: true });
      await api.submitCatalogDataset({
        datasetId: state.datasetId,
        name: state.metadata.name,
        description: state.metadata.description,
        visibility: state.metadata.visibility,
        planRequired: state.metadata.planRequired,
        tags: state.metadata.tags,
        license: state.metadata.license,
        allowStrandUsage: state.metadata.allowStrandUsage,
        forceDuplicate: state.forceClone,
      });
      toast.success('Dataset submitted for review.');
      dispatch({ type: 'RESET' });
      setStepIndex(0);
      router.push('/catalogs');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Publish failed.';
      toast.error(message);
    } finally {
      dispatch({ type: 'SET_PUBLISHING', value: false });
    }
  }, [
    router,
    state.acknowledged,
    state.datasetId,
    state.metadata.allowStrandUsage,
    state.metadata.description,
    state.metadata.license,
    state.metadata.name,
    state.metadata.planRequired,
    state.metadata.tags,
    state.metadata.visibility,
    state.forceClone,
    state.verification,
  ]);

  const handleNext = useCallback(async () => {
    if (currentStep.id === 'source') {
      await handleUpload();
      return;
    }

    if (currentStep.id === 'metadata') {
      if (!state.metadata.name.trim()) {
        toast.error('Give the dataset a descriptive name.');
        return;
      }
      setStepIndex(2);
      return;
    }

    if (currentStep.id === 'verification') {
      if (!state.verification) {
        await runVerification();
        return;
      }
      setStepIndex(3);
      return;
    }
  }, [currentStep.id, handleUpload, runVerification, state.metadata.name, state.verification]);

  const handleBack = useCallback(() => {
    if (!canBack) return;
    setStepIndex((value) => Math.max(0, value - 1));
  }, [canBack]);

  // Use separate component to avoid SWC parser bug
  return (
    <DatasetSubmissionWizardContent
      state={state}
      dispatch={dispatch}
      stepIndex={stepIndex}
      currentStep={currentStep}
      canBack={canBack}
      policyNote={policyNote}
      handleNext={handleNext}
      handleBack={handleBack}
      handleUpload={handleUpload}
      runVerification={runVerification}
      setStepIndex={setStepIndex}
    />
  );
}
