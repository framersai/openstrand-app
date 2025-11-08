'use client';

import { useCallback, useMemo, useReducer, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, UploadCloud } from 'lucide-react';
import { toast } from 'react-hot-toast';

import { api, DatasetVerificationResult } from '@/services/api';
import type { CatalogVisibility, DatasetMetadata, DatasetSummary, PlanTier } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
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
    : mode === 'team'
    ? 'Team administrators can enforce duplicate removal from workspace settings and allow trusted overrides.'
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
          name: result.metadata?.title ?? state.file.name.replace(/\.[^.]+$/, ''),
          description: result.metadata?.description ?? '',
          tags: result.metadata?.tags ?? [],
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

  const content = useMemo(() => (
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
              <p className="text-sm text-muted-foreground">
                Upload CSV, TSV, JSON, or Parquet up to 2GB. We create fingerprints to keep the catalog clean.
              </p>
              <Input
                type="file"
                accept=".csv,.tsv,.txt,.json,.parquet"
                disabled={state.uploading}
                onChange={(event) =>
                  dispatch({
                    type: 'SET_FILE',
                    file: event.target.files?.[0] ?? null,
                  })
                }
              />
              {state.file ? (
                <p className="text-xs text-muted-foreground">
                  Selected <strong>{state.file.name}</strong> · {Math.round(state.file.size / 1024)} KB
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Need an external connector? Link your data warehouse from the Strands & Integrations settings.
                </p>
              )}
            </div>
          )}

          {currentStep.id === 'metadata' && (
            <div className="grid gap-6 md:grid-cols-[1.6fr_1fr]">
              <div className="space-y-4">
                <Input
                  placeholder="Dataset name"
                  value={state.metadata.name}
                  onChange={(event) =>
                    dispatch({ type: 'UPDATE_METADATA', metadata: { name: event.target.value } })
                  }
                />
                <Textarea
                  placeholder="Describe the dataset, provenance, and intended use..."
                  className="min-h-[120px]"
                  value={state.metadata.description}
                  onChange={(event) =>
                    dispatch({
                      type: 'UPDATE_METADATA',
                      metadata: { description: event.target.value },
                    })
                  }
                />
                <Input
                  placeholder="Comma separated tags (finance, ai, serverless...)"
                  value={state.metadata.tags.join(', ')}
                  onChange={(event) =>
                    dispatch({
                      type: 'UPDATE_METADATA',
                      metadata: {
                        tags: event.target.value
                          .split(',')
                          .map((tag) => tag.trim())
                          .filter(Boolean),
                      },
                    })
                  }
                />
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase text-muted-foreground">
                      Visibility
                    </label>
                    <Select
                      value={state.metadata.visibility}
                      onValueChange={(value: CatalogVisibility) =>
                        dispatch({ type: 'UPDATE_METADATA', metadata: { visibility: value } })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Public</SelectItem>
                        <SelectItem value="private">Private</SelectItem>
                        <SelectItem value="premium">Premium</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase text-muted-foreground">
                      Plan requirement
                    </label>
                    <Select
                      value={state.metadata.planRequired}
                      onValueChange={(value: PlanTier) =>
                        dispatch({ type: 'UPDATE_METADATA', metadata: { planRequired: value } })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="free">Free</SelectItem>
                        <SelectItem value="basic">Basic</SelectItem>
                        <SelectItem value="pro">Pro</SelectItem>
                        <SelectItem value="org">Organization</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase text-muted-foreground">
                      License
                    </label>
                    <Select
                      value={state.metadata.license}
                      onValueChange={(value) =>
                        dispatch({ type: 'UPDATE_METADATA', metadata: { license: value } })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CC-BY-4.0">CC-BY 4.0</SelectItem>
                        <SelectItem value="CC0-1.0">CC0 1.0</SelectItem>
                        <SelectItem value="ODC-BY-1.0">ODC-By 1.0</SelectItem>
                        <SelectItem value="MIT">MIT</SelectItem>
                        <SelectItem value="custom">Custom / proprietary</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <label className="flex items-start gap-3 rounded-xl border border-border/70 bg-muted/10 p-3 text-sm">
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 rounded border-border/70"
                      checked={state.metadata.allowStrandUsage}
                      onChange={(event) =>
                        dispatch({
                          type: 'UPDATE_METADATA',
                          metadata: { allowStrandUsage: event.target.checked },
                        })
                      }
                    />
                    <span>
                      Allow this dataset to be transformed into a Strand so teams can attach approvals,
                      structure requests, and visibility cascades.
                    </span>
                  </label>
                </div>
              </div>

              <div className="space-y-4 rounded-2xl border border-border/60 bg-muted/20 p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase text-muted-foreground">
                    Schema preview
                  </h3>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => state.datasetId && fetchSummary(state.datasetId)}
                    disabled={!state.datasetId || state.loadingSummary}
                  >
                    Refresh
                  </Button>
                </div>
                {state.loadingSummary ? (
                  <p className="text-xs text-muted-foreground">Profiling dataset...</p>
                ) : state.summary ? (
                  <div className="space-y-2 text-sm">
                    <p className="font-medium">
                      {state.summary.rowCount.toLocaleString()} rows · {state.summary.columnCount} columns
                    </p>
                    <div className="grid gap-2">
                      {state.summary.columns.slice(0, 8).map((column) => (
                        <div
                          key={column.name}
                          className="flex items-center justify-between rounded-lg border border-border/60 bg-background/70 px-3 py-2"
                        >
                          <span>{column.name}</span>
                          <Badge variant="outline">{column.type}</Badge>
                        </div>
                      ))}
                      {state.summary.columns.length > 8 && (
                        <p className="text-xs text-muted-foreground">
                          {state.summary.columns.length - 8} more columns hidden.
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Upload a dataset to view schema and profiling metrics.
                  </p>
                )}
              </div>
            </div>
          )}

          {currentStep.id === 'verification' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase text-muted-foreground">
                  Deduplication & compliance
                </h3>
                <Button size="sm" variant="outline" onClick={runVerification} disabled={state.verifying}>
                  Run verification
                </Button>
              </div>

              {state.verifying && (
                <div className="rounded-xl border border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground">
                  Checking for duplicates and policy issues...
                </div>
              )}

              {!state.verifying && state.verification && (
                <Card
                  className={cn(
                    'border',
                    state.verification.status === 'ok' && 'border-emerald-300/60 bg-emerald-50/80',
                    state.verification.status === 'duplicate' && 'border-amber-300/60 bg-amber-50/80',
                    state.verification.status === 'flagged' && 'border-red-300/60 bg-red-50/80'
                  )}
                >
                  <CardHeader>
                    <CardTitle className="text-base">
                      {state.verification.status === 'ok' && 'No issues detected'}
                      {state.verification.status === 'duplicate' && 'Potential duplicates found'}
                      {state.verification.status === 'flagged' && 'Policy issues detected'}
                    </CardTitle>
                    {state.verification.message && (
                      <CardDescription>{state.verification.message}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    {state.verification.warnings.length > 0 && (
                      <div className="space-y-2">
                        {state.verification.warnings.map((warning, index) => (
                          <div
                            key={index}
                            className="flex items-start gap-2 rounded-lg border border-border/50 bg-background/70 p-3"
                          >
                            <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-500" />
                            <p>{warning}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    {state.verification.duplicates.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-semibold uppercase text-muted-foreground">
                          Possible duplicates
                        </h4>
                        <div className="grid gap-2">
                          {state.verification.duplicates.map((dup) => (
                            <div
                              key={dup.id}
                              className="flex items-center justify-between rounded-lg border border-border/60 bg-background/80 px-3 py-2"
                            >
                              <div>
                                <p className="font-medium">{dup.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  Similarity {Math.round(dup.similarity * 100)}%
                                </p>
                              </div>
                              <Badge variant="outline">View</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {state.verification && state.verification.status !== 'ok' && (
              <label className="flex items-start gap-3 rounded-xl border border-border/70 bg-muted/10 p-3 text-sm">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 rounded border-border/70"
                  checked={state.acknowledged}
                  onChange={(event) =>
                    dispatch({ type: 'SET_ACKNOWLEDGED', value: event.target.checked })
                  }
                />
                <span>
                  I confirm that I hold the rights to distribute this dataset and understand that
                  non-compliant uploads may be removed.
                </span>
              </label>
              {state.verification?.status === 'duplicate' && (
                <label className="flex items-start gap-3 rounded-xl border border-border/70 bg-muted/10 p-3 text-sm">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 rounded border-border/70"
                    checked={state.forceClone}
                    onChange={(event) =>
                      dispatch({ type: 'SET_FORCE_CLONE', value: event.target.checked })
                    }
                  />
                  <span>
                    Create a duplicate copy anyway. We will assign a new ID, keep the existing hash for audit logs,
                    and mark this upload as an intentional clone.
                  </span>
                </label>
              )}
            )}

              {!state.verification && !state.verifying && (
                <div className="rounded-xl border border-dashed border-border/60 bg-muted/10 p-4 text-sm text-muted-foreground">
                  Run verification to fingerprint the dataset, compare against existing catalog entries, and validate licensing.
                </div>
              )}
            </div>
          )}

          {currentStep.id === 'publish' && (
            <div className="space-y-4">
              <Card className="border-border/60">
                <CardHeader>
                  <CardTitle className="text-base">Review summary</CardTitle>
                  <CardDescription>Double-check visibility, license, and metadata.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 text-sm md:grid-cols-2">
                  <div>
                    <p className="text-muted-foreground">Dataset name</p>
                    <p className="font-medium">{state.metadata.name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Visibility</p>
                    <p className="font-medium text-primary">{state.metadata.visibility}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">License</p>
                    <p className="font-medium">{state.metadata.license}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Plan requirement</p>
                    <p className="font-medium">{state.metadata.planRequired}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-muted-foreground">Tags</p>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {state.metadata.tags.length > 0 ? (
                        state.metadata.tags.map((tag) => <Badge key={tag}>{tag}</Badge>)
                      ) : (
                        <span className="text-muted-foreground/70">No tags provided</span>
                      )}
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-muted-foreground">Description</p>
                    <p className="whitespace-pre-line">{state.metadata.description || '—'}</p>
                  </div>
                  {state.uploadMeta && (
                  <div className="md:col-span-2 rounded-xl border border-border/50 bg-muted/10 p-3 text-xs text-muted-foreground">
                    Fingerprint: {state.uploadMeta.id} - File type {state.uploadMeta.fileType ?? 'n/a'}
                  </div>
                )}
                {state.forceClone && (
                  <div className="md:col-span-2 rounded-xl border border-amber-400/60 bg-amber-50/80 p-3 text-xs text-amber-700">
                    Intentional clone enabled. A new catalog entry will be created and linked to the original hash for audit tracking.
                  </div>
                )}
              </CardContent>
            </Card>
              <div className="rounded-xl border border-dashed border-border/60 bg-muted/10 p-4 text-xs text-muted-foreground">
                By publishing you agree to the OpenStrand Terms of Service. Datasets are versioned and moderation
                notices may be issued if licensing or authorship is disputed.
              </div>
            </div>
          )}
        </CardContent>

        <footer className="flex flex-col gap-3 border-t border-border/60 bg-muted/30 px-6 py-4 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <span>
              Hashes and provenance markers are stored with every upload. <Link href="/compliance" className="font-semibold text-primary underline-offset-4 hover:underline">Learn more</Link>
            </span>
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              disabled={!canBack || state.uploading || state.verifying || state.publishing}
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Back
            </Button>
            {currentStep.id !== 'publish' ? (
              <Button
                size="sm"
                onClick={handleNext}
                disabled={
                  state.uploading ||
                  state.verifying ||
                  (currentStep.id === 'source' && !state.file) ||
                  (currentStep.id === 'metadata' && !state.metadata.name.trim())
                }
              >
                Continue
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <Button size="sm" onClick={publish} disabled={state.publishing}>
                {state.publishing ? (
                  <>
                    <UploadCloud className="mr-2 h-4 w-4 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    Publish dataset
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </>
                )}
              </Button>
            )}
          </div>
        </footer>
      </Card>
    </div>
  );
}




