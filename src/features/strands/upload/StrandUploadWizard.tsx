'use client';

import { useCallback, useMemo, useReducer, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, Sparkles, UploadCloud } from 'lucide-react';
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
  { value: 'dataset', label: 'Dataset-backed strand' },
  { value: 'visualization', label: 'Visualization or story' },
  { value: 'playbook', label: 'Playbook / procedural strand' },
];

const NOTE_TYPES = [
  { value: 'main', label: 'Main narrative' },
  { value: 'reference', label: 'Reference / source' },
  { value: 'task', label: 'Task / follow-up' },
];

const SCOPE_OPTIONS = [
  { value: 'default', label: 'Workspace default scope' },
  { value: 'pkms', label: 'Personal knowledge space' },
  { value: 'team', label: 'Team workspace' },
];

interface StrandDraft {
  strandType: string;
  noteType: string;
  scopeId: string;
  title: string;
  summary: string;
  content: string;
  datasetId: string;
  tags: string[];
  license: string;
  references: string;
  allowStructureRequests: boolean;
}

interface WizardState {
  draft: StrandDraft;
  verification: StrandVerificationResult | null;
  acknowledged: boolean;
  forceDuplicate: boolean;
  verifying: boolean;
  publishing: boolean;
}

const DEFAULT_STATE: WizardState = {
  draft: {
    strandType: 'note',
    noteType: 'main',
    scopeId: 'default',
    title: '',
    summary: '',
    content: '',
    datasetId: '',
    tags: [],
    license: 'CC-BY-4.0',
    references: '',
    allowStructureRequests: true,
  },
  verification: null,
  acknowledged: false,
  forceDuplicate: false,
  verifying: false,
  publishing: false,
};

type WizardAction =
  | { type: 'UPDATE_DRAFT'; payload: Partial<StrandDraft> }
  | { type: 'SET_TAGS'; tags: string[] }
  | { type: 'SET_VERIFICATION'; verification: StrandVerificationResult | null }
  | { type: 'SET_ACKNOWLEDGED'; value: boolean }
  | { type: 'SET_FORCE_DUPLICATE'; value: boolean }
  | { type: 'SET_VERIFYING'; value: boolean }
  | { type: 'SET_PUBLISHING'; value: boolean }
  | { type: 'RESET' };

function reducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case 'UPDATE_DRAFT':
      return { ...state, draft: { ...state.draft, ...action.payload } };
    case 'SET_TAGS':
      return { ...state, draft: { ...state.draft, tags: action.tags } };
    case 'SET_VERIFICATION':
      return {
        ...state,
        verification: action.verification,
        acknowledged: false,
        forceDuplicate: action.verification?.status === 'duplicate' ? state.forceDuplicate : false,
      };
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

export function StrandUploadWizard(): JSX.Element {
  const router = useRouter();
  const { mode } = useAppMode();
  const [state, dispatch] = useReducer(reducer, DEFAULT_STATE);
  const [stepIndex, setStepIndex] = useState(0);

  const currentStep = STEPS[stepIndex];
  const canBack = stepIndex > 0;

  // Compute policy note and dataset hint based on mode
  const policyNote = mode === 'cloud'
    ? 'Cloud review enforces duplicate detection by default, with per-strand overrides logged for audit.'
    : mode === 'team'
    ? 'Team spaces can toggle moderation, enforce duplicate removal, or allow trusted overrides in settings.'
    : 'Offline mode keeps hashes locally. Enforce authorship policies manually.';

  const handleNext = useCallback(() => {
    if (currentStep.id === 'basics') {
      if (!state.draft.title.trim()) {
        toast.error('Provide a title for the strand.');
        return;
      }
      setStepIndex(1);
      return;
    }

    if (currentStep.id === 'content') {
      if (!state.draft.content.trim()) {
        toast.error('Add content or summary before continuing.');
        return;
      }
      setStepIndex(2);
      return;
    }

    if (currentStep.id === 'metadata') {
      setStepIndex(3);
      return;
    }

    if (currentStep.id === 'verification') {
      if (!state.verification) {
        toast.error('Run verification before publishing.');
        return;
      }
      setStepIndex(4);
      return;
    }
  }, [currentStep.id, state.draft.content, state.draft.title, state.verification]);

  const handleBack = useCallback(() => {
    if (!canBack) return;
    setStepIndex((value) => Math.max(0, value - 1));
  }, [canBack]);

  const runVerification = useCallback(async () => {
    try {
      dispatch({ type: 'SET_VERIFYING', value: true });
      const verification = await api.verifyStrandDraft({
        strandType: state.draft.strandType,
        noteType: state.draft.noteType,
        title: state.draft.title,
        content: state.draft.content,
        tags: state.draft.tags,
        license: state.draft.license,
      });
      dispatch({ type: 'SET_VERIFICATION', verification });
      if (verification.status === 'ok') {
        toast.success('Strand verification passed.');
      } else if (verification.status === 'duplicate') {
        toast('Possible duplicate strands detected. Review before publishing.', { icon: '⚠️' });
      } else {
        toast.error('Policy issues detected. Resolve before publishing.');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Verification failed.';
      toast.error(message);
    } finally {
      dispatch({ type: 'SET_VERIFYING', value: false });
    }
  }, [state.draft.content, state.draft.license, state.draft.noteType, state.draft.strandType, state.draft.tags, state.draft.title]);

  const publish = useCallback(async () => {
    if (state.verification && state.verification.status !== 'ok' && !state.acknowledged) {
      toast.error('Acknowledge the verification warnings to continue.');
      return;
    }
    if (state.verification && state.verification.status === 'duplicate' && !state.forceDuplicate) {
      toast.error('Enable "Create duplicate strand" to override deduplication.');
      return;
    }

    try {
      dispatch({ type: 'SET_PUBLISHING', value: true });
      const response = await api.createStrand({
        strandType: state.draft.strandType,
        noteType: state.draft.noteType,
        scopeId: state.draft.scopeId,
        title: state.draft.title,
        summary: state.draft.summary,
        content: state.draft.content,
        datasetId: state.draft.datasetId || undefined,
        tags: state.draft.tags,
        license: state.draft.license,
        references: state.draft.references,
        allowStructureRequests: state.draft.allowStructureRequests,
        forceDuplicate: state.forceDuplicate,
      });
      toast.success('Strand published.');
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
  }, [router, state.acknowledged, state.draft.allowStructureRequests, state.draft.content, state.draft.datasetId, state.draft.license, state.draft.noteType, state.draft.references, state.draft.scopeId, state.draft.strandType, state.draft.summary, state.draft.tags, state.draft.title, state.forceDuplicate, state.verification]);

  const datasetHint = state.draft.strandType === 'dataset';

  const content = useMemo(() => (
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
                  onValueChange={(value) =>
                    dispatch({ type: 'UPDATE_DRAFT', payload: { strandType: value } })
                  }
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
              <div className="space-y-3">
                <label className="text-xs font-semibold uppercase text-muted-foreground">Note type</label>
                <Select
                  value={state.draft.noteType}
                  onValueChange={(value) =>
                    dispatch({ type: 'UPDATE_DRAFT', payload: { noteType: value } })
                  }
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
              <div className="space-y-3 md:col-span-2">
                <label className="text-xs font-semibold uppercase text-muted-foreground">Scope</label>
                <Select
                  value={state.draft.scopeId}
                  onValueChange={(value) =>
                    dispatch({ type: 'UPDATE_DRAFT', payload: { scopeId: value } })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SCOPE_OPTIONS.map((scope) => (
                      <SelectItem key={scope.value} value={scope.value}>
                        {scope.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Workspace scopes control approvals and visibility cascades. Choose a scope with editors who can review this strand.
                </p>
              </div>
              <div className="space-y-3 md:col-span-2">
                <Input
                  placeholder="Strand title"
                  value={state.draft.title}
                  onChange={(event) =>
                    dispatch({ type: 'UPDATE_DRAFT', payload: { title: event.target.value } })
                  }
                />
                <Textarea
                  placeholder="Optional summary or abstract"
                  className="min-h-[90px]"
                  value={state.draft.summary}
                  onChange={(event) =>
                    dispatch({ type: 'UPDATE_DRAFT', payload: { summary: event.target.value } })
                  }
                />
              </div>
            </div>
          )}

          {currentStep.id === 'content' && (
            <div className="space-y-4">
              <Textarea
                placeholder="Compose the strand body. Markdown is supported."
                className="min-h-[220px]"
                value={state.draft.content}
                onChange={(event) =>
                  dispatch({ type: 'UPDATE_DRAFT', payload: { content: event.target.value } })
                }
              />
              <p className="text-xs text-muted-foreground">
                Attachments and embeds can be added after publishing via the strand composer.
              </p>
              {datasetHint && (
                <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm">
                  <div className="flex items-start gap-3">
                    <Sparkles className="mt-0.5 h-4 w-4 text-primary" />
                    <div>
                      <p className="font-semibold text-primary">Dataset-backed strand</p>
                      <p className="text-muted-foreground text-xs mt-1">
                        Link an existing dataset submission or create one now. Dataset strands surface schema insights and reuse catalog provenance.
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Input
                          placeholder="Optional catalog dataset ID"
                          value={state.draft.datasetId}
                          onChange={(event) =>
                            dispatch({
                              type: 'UPDATE_DRAFT',
                              payload: { datasetId: event.target.value },
                            })
                          }
                        />
                        <Button variant="outline" size="sm" asChild>
                          <Link href="/catalogs/submit">Submit a dataset first</Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {currentStep.id === 'metadata' && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <label className="text-xs font-semibold uppercase text-muted-foreground">Tags</label>
                <Input
                  placeholder="knowledge graph, approvals, roadmap"
                  value={state.draft.tags.join(', ')}
                  onChange={(event) =>
                    dispatch({
                      type: 'SET_TAGS',
                      tags: event.target.value
                        .split(',')
                        .map((tag) => tag.trim())
                        .filter(Boolean),
                    })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Tags drive scope-level recommendations and strand search filters.
                </p>
              </div>
              <div className="space-y-3">
                <label className="text-xs font-semibold uppercase text-muted-foreground">License</label>
                <Select
                  value={state.draft.license}
                  onValueChange={(value) =>
                    dispatch({ type: 'UPDATE_DRAFT', payload: { license: value } })
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
              <div className="space-y-3 md:col-span-2">
                <label className="text-xs font-semibold uppercase text-muted-foreground">References</label>
                <Textarea
                  placeholder="List citations, URLs, or strand IDs that inform this strand."
                  className="min-h-[80px]"
                  value={state.draft.references}
                  onChange={(event) =>
                    dispatch({ type: 'UPDATE_DRAFT', payload: { references: event.target.value } })
                  }
                />
              </div>
              <label className="md:col-span-2 flex items-start gap-3 rounded-xl border border-border/70 bg-muted/10 p-3 text-sm">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 rounded border-border/70"
                  checked={state.draft.allowStructureRequests}
                  onChange={(event) =>
                    dispatch({
                      type: 'UPDATE_DRAFT',
                      payload: { allowStructureRequests: event.target.checked },
                    })
                  }
                />
                <span>
                  Allow structure requests for this strand. Reviewers can propose hierarchy changes that go through approvals.
                </span>
              </label>
            </div>
          )}

          {currentStep.id === 'verification' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase text-muted-foreground">
                  Deduplication & policy checks
                </h3>
                <Button size="sm" variant="outline" onClick={runVerification} disabled={state.verifying}>
                  Run verification
                </Button>
              </div>

              {state.verifying && (
                <div className="rounded-xl border border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground">
                  Computing strand hashes and similarity metrics...
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
                          Related strands
                        </h4>
                        <div className="grid gap-2">
                          {state.verification.duplicates.map((dup) => (
                            <div
                              key={dup.id}
                              className="flex items-center justify-between rounded-lg border border-border/60 bg-background/80 px-3 py-2"
                            >
                              <div>
                                <p className="font-medium">{dup.title}</p>
                                <p className="text-xs text-muted-foreground">
                                  Similarity {Math.round(dup.similarity * 100)}%
                                </p>
                              </div>
                              <Badge variant="outline">Inspect</Badge>
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
                  I confirm that I hold the rights to publish this strand and understand that non-compliant uploads may be removed.
                </span>
              </label>
              {state.verification?.status === 'duplicate' && (
                <label className="flex items-start gap-3 rounded-xl border border-border/70 bg-muted/10 p-3 text-sm">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 rounded border-border/70"
                    checked={state.forceDuplicate}
                    onChange={(event) =>
                      dispatch({ type: 'SET_FORCE_DUPLICATE', value: event.target.checked })
                    }
                  />
                  <span>
                    Create a duplicate strand anyway. This clone receives a new ID while the original hash is retained for provenance.
                  </span>
                </label>
              )}
            )}

              {!state.verification && !state.verifying && (
                <div className="rounded-xl border border-dashed border-border/60 bg-muted/10 p-4 text-sm text-muted-foreground">
                  Run verification to compute hashes, similarity scores, and license checks before publishing.
                </div>
              )}
            </div>
          )}

          {currentStep.id === 'publish' && (
            <div className="space-y-4">
              <Card className="border-border/60">
                <CardHeader>
                  <CardTitle className="text-base">Review summary</CardTitle>
                  <CardDescription>Double-check scope, licensing, and metadata.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 text-sm md:grid-cols-2">
                  <div>
                    <p className="text-muted-foreground">Strand type</p>
                    <p className="font-medium">{state.draft.strandType}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Scope</p>
                    <p className="font-medium">{state.draft.scopeId}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">License</p>
                    <p className="font-medium">{state.draft.license}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Title</p>
                    <p className="font-medium">{state.draft.title}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-muted-foreground">Tags</p>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {state.draft.tags.length > 0 ? (
                        state.draft.tags.map((tag) => <Badge key={tag}>{tag}</Badge>)
                      ) : (
                        <span className="text-muted-foreground/70">No tags provided</span>
                      )}
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-muted-foreground">Summary</p>
                    <p className="whitespace-pre-line">{state.draft.summary || '-'}</p>
                  </div>
                  {state.draft.datasetId && (
                    <div className="md:col-span-2 rounded-xl border border-primary/40 bg-primary/5 p-3 text-xs text-primary">
                      Linked dataset: {state.draft.datasetId}
                    </div>
                  )}
                  {state.forceDuplicate && (
                    <div className="md:col-span-2 rounded-xl border border-amber-400/60 bg-amber-50/80 p-3 text-xs text-amber-700">
                      Intentional clone enabled. This strand will be recorded as a duplicate with a new identifier.
                    </div>
                  )}
                </CardContent>
              </Card>
              <div className="rounded-xl border border-dashed border-border/60 bg-muted/10 p-4 text-xs text-muted-foreground">
                By publishing you agree to the OpenStrand terms and certify authorship. Strands inherit workspace retention and approval policies.
              </div>
            </div>
          )}
        </CardContent>

        <footer className="flex flex-col gap-3 border-t border-border/60 bg-muted/30 px-6 py-4 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <span>
              Strand hashes are stored for provenance. <Link href="/compliance" className="font-semibold text-primary underline-offset-4 hover:underline">Learn more</Link>
            </span>
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              disabled={!canBack || state.verifying || state.publishing}
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Back
            </Button>
            {currentStep.id !== 'publish' ? (
              <Button
                size="sm"
                onClick={handleNext}
                disabled={
                  state.verifying ||
                  (currentStep.id === 'basics' && !state.draft.title.trim()) ||
                  (currentStep.id === 'content' && !state.draft.content.trim())
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
                    Publish strand
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </>
                )}
              </Button>
            )}
          </div>
        </footer>
      </Card>
    </div>
  ), [policyNote, currentStep, stepIndex, canBack, state, datasetHint, handleNext, handleBack, runVerification, publish]);

  return content;
}



