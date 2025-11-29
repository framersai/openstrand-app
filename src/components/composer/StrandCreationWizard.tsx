'use client';

/**
 * @module StrandCreationWizard
 * @description Smart strand/folder creation wizard with tooltips and auto-fill
 * 
 * Features:
 * - Step-by-step wizard flow
 * - Smart suggestions from Spiral Path API
 * - Contextual tooltips explaining each field
 * - Prerequisite detection
 * - Difficulty recommendations
 * - Tag autocomplete with AI suggestions
 */

import { useState, useCallback, useEffect } from 'react';
import { 
  ArrowRight, 
  ArrowLeft,
  FileText, 
  FolderPlus, 
  Sparkles, 
  Tag, 
  GraduationCap,
  Clock,
  Link2,
  CheckCircle,
  Loader2,
  HelpCircle,
  Brain,
  AlertCircle
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { InfoTooltip, STRAND_TOOLTIPS, LabelWithTooltip } from '@/components/ui/info-tooltip';
import { SmartTagInput } from './SmartTagInput';
import { useSmartSuggestions, useAvailableTags } from '@/hooks/useSmartSuggestions';

// ============================================================================
// Types
// ============================================================================

export type CreationType = 'strand' | 'folder';

export interface StrandCreationWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type?: CreationType;
  parentId?: string | null;
  parentTitle?: string;
  onSubmit: (data: StrandCreationData) => Promise<void>;
}

export interface StrandCreationData {
  type: CreationType;
  title: string;
  summary: string;
  difficulty: string;
  tags: string[];
  prerequisites: string[];
  estimatedTime: number;
  visibility: 'private' | 'public' | 'unlisted' | 'team';
}

type WizardStep = 'basics' | 'metadata' | 'learning' | 'review';

// ============================================================================
// Constants
// ============================================================================

const STEPS: { id: WizardStep; title: string; description: string }[] = [
  { id: 'basics', title: 'Basics', description: 'Name and describe your content' },
  { id: 'metadata', title: 'Metadata', description: 'Tags and categorization' },
  { id: 'learning', title: 'Learning', description: 'Difficulty and prerequisites' },
  { id: 'review', title: 'Review', description: 'Confirm and create' },
];

const DIFFICULTY_OPTIONS = [
  { value: 'beginner', label: 'Beginner', description: 'No prior knowledge required' },
  { value: 'intermediate', label: 'Intermediate', description: 'Some foundational knowledge needed' },
  { value: 'advanced', label: 'Advanced', description: 'Significant prior knowledge required' },
  { value: 'expert', label: 'Expert', description: 'Deep expertise assumed' },
];

// ============================================================================
// Component
// ============================================================================

export function StrandCreationWizard({
  open,
  onOpenChange,
  type: initialType = 'strand',
  parentId,
  parentTitle,
  onSubmit,
}: StrandCreationWizardProps) {
  // Form state
  const [type, setType] = useState<CreationType>(initialType);
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [difficulty, setDifficulty] = useState('beginner');
  const [tags, setTags] = useState('');
  const [prerequisites, setPrerequisites] = useState<string[]>([]);
  const [estimatedTime, setEstimatedTime] = useState(15);
  const [visibility, setVisibility] = useState<'private' | 'public' | 'unlisted' | 'team'>('private');
  
  // Wizard state
  const [currentStep, setCurrentStep] = useState<WizardStep>('basics');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Smart suggestions
  const { 
    suggestions, 
    loading: suggestionsLoading, 
    fetchSuggestions 
  } = useSmartSuggestions({
    parentId,
    title,
    autoFetch: true,
    debounceMs: 800,
  });

  const { tags: availableTags } = useAvailableTags();

  // Apply suggestions when available
  useEffect(() => {
    if (suggestions && !difficulty) {
      setDifficulty(suggestions.difficulty.level);
    }
    if (suggestions && estimatedTime === 15) {
      setEstimatedTime(suggestions.estimatedTime);
    }
  }, [suggestions, difficulty, estimatedTime]);

  // Navigation
  const stepIndex = STEPS.findIndex(s => s.id === currentStep);
  const progress = ((stepIndex + 1) / STEPS.length) * 100;

  const canProceed = useCallback(() => {
    switch (currentStep) {
      case 'basics':
        return title.trim().length > 0;
      case 'metadata':
        return true; // Tags are optional
      case 'learning':
        return difficulty !== '';
      case 'review':
        return true;
      default:
        return false;
    }
  }, [currentStep, title, difficulty]);

  const goNext = useCallback(() => {
    const idx = STEPS.findIndex(s => s.id === currentStep);
    if (idx < STEPS.length - 1) {
      setCurrentStep(STEPS[idx + 1].id);
    }
  }, [currentStep]);

  const goPrev = useCallback(() => {
    const idx = STEPS.findIndex(s => s.id === currentStep);
    if (idx > 0) {
      setCurrentStep(STEPS[idx - 1].id);
    }
  }, [currentStep]);

  const handleSubmit = useCallback(async () => {
    setSubmitting(true);
    setError(null);
    
    try {
      const data: StrandCreationData = {
        type,
        title: title.trim(),
        summary: summary.trim(),
        difficulty,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        prerequisites,
        estimatedTime,
        visibility,
      };
      
      await onSubmit(data);
      
      // Reset form
      setTitle('');
      setSummary('');
      setDifficulty('beginner');
      setTags('');
      setPrerequisites([]);
      setEstimatedTime(15);
      setCurrentStep('basics');
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create');
    } finally {
      setSubmitting(false);
    }
  }, [type, title, summary, difficulty, tags, prerequisites, estimatedTime, visibility, onSubmit, onOpenChange]);

  // Reset when dialog closes
  useEffect(() => {
    if (!open) {
      setCurrentStep('basics');
      setError(null);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {type === 'folder' ? (
              <FolderPlus className="h-5 w-5 text-primary" />
            ) : (
              <FileText className="h-5 w-5 text-primary" />
            )}
            Create New {type === 'folder' ? 'Folder' : 'Strand'}
          </DialogTitle>
          <DialogDescription>
            {parentTitle && (
              <span className="text-xs">
                Inside: <span className="font-medium">{parentTitle}</span>
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            {STEPS.map((step, idx) => (
              <span 
                key={step.id}
                className={cn(
                  "transition-colors",
                  idx <= stepIndex && "text-primary font-medium"
                )}
              >
                {step.title}
              </span>
            ))}
          </div>
          <Progress value={progress} className="h-1" />
        </div>

        {/* Error display */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        {/* Step Content */}
        <div className="py-4 space-y-4">
          {/* Step 1: Basics */}
          {currentStep === 'basics' && (
            <>
              {/* Type selector */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={type === 'strand' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setType('strand')}
                  className="flex-1"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Strand
                </Button>
                <Button
                  type="button"
                  variant={type === 'folder' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setType('folder')}
                  className="flex-1"
                >
                  <FolderPlus className="h-4 w-4 mr-2" />
                  Folder
                </Button>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <LabelWithTooltip label="Title" tooltipKey="strand-title" required />
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={type === 'folder' ? 'e.g., Machine Learning Fundamentals' : 'e.g., Introduction to Neural Networks'}
                  autoFocus
                />
              </div>

              {/* Summary */}
              <div className="space-y-2">
                <LabelWithTooltip label="Summary" tooltipKey="strand-summary" />
                <Textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="A brief description for quick scanning..."
                  rows={2}
                />
              </div>

              {/* Visibility */}
              <div className="space-y-2">
                <LabelWithTooltip label="Visibility" tooltipKey="strand-visibility" />
                <Select value={visibility} onValueChange={(v) => setVisibility(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="private">Private - Only you</SelectItem>
                    <SelectItem value="team">Team - Your team members</SelectItem>
                    <SelectItem value="unlisted">Unlisted - Anyone with link</SelectItem>
                    <SelectItem value="public">Public - Discoverable</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Folder hierarchy tip */}
              {type === 'folder' && (
                <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                  <div className="flex gap-2">
                    <Brain className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <p className="font-medium text-primary mb-1">Spiral Curriculum Tip</p>
                      <p className="text-muted-foreground">
                        Subfolders are <strong>subtopics</strong> of their parent. 
                        Content becomes more specific as you go deeper. 
                        This structure powers the Spiral Path learning system.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Step 2: Metadata */}
          {currentStep === 'metadata' && (
            <>
              {/* Tags */}
              <div className="space-y-2">
                <LabelWithTooltip label="Tags" tooltipKey="strand-tags" />
                <SmartTagInput
                  value={tags}
                  onChange={setTags}
                  suggestions={suggestions?.tags}
                  availableTags={availableTags}
                  loading={suggestionsLoading}
                  placeholder="Add tags..."
                />
              </div>

              {/* Suggestions info */}
              {suggestionsLoading && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Analyzing content for suggestions...
                </div>
              )}

              {suggestions && !suggestionsLoading && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                    <Sparkles className="h-3 w-3 text-primary" />
                    AI analyzed your title and parent context
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.tags.slice(0, 3).map((t, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {t.tag} ({Math.round(t.confidence * 100)}%)
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Step 3: Learning */}
          {currentStep === 'learning' && (
            <>
              {/* Difficulty */}
              <div className="space-y-2">
                <LabelWithTooltip label="Difficulty" tooltipKey="strand-difficulty" required />
                <div className="grid grid-cols-2 gap-2">
                  {DIFFICULTY_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setDifficulty(opt.value)}
                      className={cn(
                        "p-3 rounded-lg border text-left transition-all",
                        difficulty === opt.value
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <div className="font-medium text-sm">{opt.label}</div>
                      <div className="text-xs text-muted-foreground">{opt.description}</div>
                    </button>
                  ))}
                </div>
                {suggestions?.difficulty && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Sparkles className="h-3 w-3 text-primary" />
                    Suggested: {suggestions.difficulty.level} ({suggestions.difficulty.reason})
                  </div>
                )}
              </div>

              {/* Estimated Time */}
              <div className="space-y-2">
                <LabelWithTooltip label="Estimated Time (minutes)" tooltipKey="strand-estimated-time" />
                <div className="flex items-center gap-4">
                  <Input
                    type="number"
                    min={1}
                    max={480}
                    value={estimatedTime}
                    onChange={(e) => setEstimatedTime(parseInt(e.target.value) || 15)}
                    className="w-24"
                  />
                  <div className="flex gap-2">
                    {[5, 15, 30, 60].map((mins) => (
                      <Button
                        key={mins}
                        type="button"
                        variant={estimatedTime === mins ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setEstimatedTime(mins)}
                      >
                        {mins}m
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Prerequisites info */}
              {suggestions?.prerequisites && suggestions.prerequisites.length > 0 && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5 text-xs font-medium uppercase text-muted-foreground">
                    <Link2 className="h-3.5 w-3.5" />
                    Detected Prerequisites
                    <InfoTooltip data={STRAND_TOOLTIPS['strand-prerequisites']} size="sm" />
                  </Label>
                  <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                    {suggestions.prerequisites.map((p, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <span>{p.title}</span>
                        <Badge variant="outline" className="text-xs">
                          {Math.round(p.confidence * 100)}% confident
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Step 4: Review */}
          {currentStep === 'review' && (
            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                <div className="flex items-center gap-2">
                  {type === 'folder' ? (
                    <FolderPlus className="h-5 w-5 text-primary" />
                  ) : (
                    <FileText className="h-5 w-5 text-primary" />
                  )}
                  <span className="font-semibold">{title}</span>
                </div>
                
                {summary && (
                  <p className="text-sm text-muted-foreground">{summary}</p>
                )}

                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Difficulty</div>
                    <Badge variant="secondary">{difficulty}</Badge>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Est. Time</div>
                    <Badge variant="secondary">{estimatedTime} min</Badge>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Visibility</div>
                    <Badge variant="secondary">{visibility}</Badge>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Tags</div>
                    <div className="flex flex-wrap gap-1">
                      {tags.split(',').filter(t => t.trim()).map((t, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {t.trim()}
                        </Badge>
                      ))}
                      {!tags.trim() && <span className="text-xs text-muted-foreground">None</span>}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-green-500/10 text-green-600 rounded-lg text-sm">
                <CheckCircle className="h-4 w-4" />
                Ready to create! Click "Create" to finish.
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-4 border-t">
          <Button
            type="button"
            variant="ghost"
            onClick={goPrev}
            disabled={stepIndex === 0}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          {currentStep === 'review' ? (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Create {type === 'folder' ? 'Folder' : 'Strand'}
                </>
              )}
            </Button>
          ) : (
            <Button
              type="button"
              onClick={goNext}
              disabled={!canProceed()}
            >
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default StrandCreationWizard;

