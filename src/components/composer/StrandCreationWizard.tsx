'use client';

/**
 * @module StrandCreationWizard
 * @description Comprehensive strand/folder creation wizard with multiple source types
 * 
 * Features:
 * - Multiple source types: blank, URL scraping, file upload, media, markdown
 * - Tree navigation for organizing content
 * - AI-powered analysis and suggestions
 * - Deduplication detection
 * - Smart tag suggestions
 * - Prerequisite detection
 * - Rich markdown editor with templates
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { 
  ArrowRight, 
  ArrowLeft,
  Plus,
  FileText, 
  FolderTree,
  Tags,
  Brain,
  CheckCircle,
  Loader2,
  AlertCircle,
  X
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

// Import wizard subcomponents
import {
  SourceSelector,
  UrlScraper,
  MediaUploader,
  MarkdownEditor,
  TreeNavigator,
  AIAnalysisStep,
  WIZARD_STEPS,
  DIFFICULTY_OPTIONS,
  type CreationType,
  type SourceType,
  type WizardStep,
  type StrandCreationData,
  type UrlMetadata,
  type MediaFile,
  type AIAnalysis,
} from './wizard';

import { SmartTagInput } from './SmartTagInput';
import { useSmartSuggestions, useAvailableTags } from '@/hooks/useSmartSuggestions';

// ============================================================================
// Step Icons
// ============================================================================

const STEP_ICONS: Record<string, React.ElementType> = {
  Plus,
  FileText,
  FolderTree,
  Tags,
  Brain,
  CheckCircle,
};

// ============================================================================
// Props
// ============================================================================

export interface StrandCreationWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type?: CreationType;
  parentId?: string | null;
  parentTitle?: string;
  parentPath?: string[];
  onSubmit: (data: StrandCreationData) => Promise<void>;
}

// ============================================================================
// Component
// ============================================================================

export function StrandCreationWizard({
  open,
  onOpenChange,
  type: initialType = 'strand',
  parentId: initialParentId = null,
  parentTitle,
  parentPath: initialParentPath = [],
  onSubmit,
}: StrandCreationWizardProps) {
  // ============================================================================
  // Form State
  // ============================================================================
  
  const [creationType, setCreationType] = useState<CreationType>(initialType);
  const [sourceType, setSourceType] = useState<SourceType>('blank');
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [difficulty, setDifficulty] = useState('beginner');
  const [tags, setTags] = useState<string[]>([]);
  const [tagsInput, setTagsInput] = useState('');
  const [prerequisites, setPrerequisites] = useState<string[]>([]);
  const [estimatedTime, setEstimatedTime] = useState(15);
  const [visibility, setVisibility] = useState<'private' | 'public' | 'unlisted' | 'team'>('private');
  const [parentId, setParentId] = useState<string | null>(initialParentId);
  const [parentPath, setParentPath] = useState<string[]>(initialParentPath);
  
  // Source-specific state
  const [sourceUrl, setSourceUrl] = useState('');
  const [urlMetadata, setUrlMetadata] = useState<UrlMetadata | null>(null);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  
  // AI Analysis state
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // ============================================================================
  // Wizard State
  // ============================================================================
  
  const [currentStep, setCurrentStep] = useState<WizardStep>('source');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [skippedSteps, setSkippedSteps] = useState<Set<WizardStep>>(new Set());

  // ============================================================================
  // Smart Suggestions
  // ============================================================================
  
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

  const { tags: availableTags, loading: tagsLoading } = useAvailableTags();

  // Apply suggestions when available
  useEffect(() => {
    if (suggestions && !aiAnalysis) {
      if (difficulty === 'beginner') {
        setDifficulty(suggestions.difficulty.level);
      }
      if (estimatedTime === 15 && suggestions.estimatedTime) {
        setEstimatedTime(suggestions.estimatedTime);
      }
    }
  }, [suggestions, difficulty, estimatedTime, aiAnalysis]);

  // ============================================================================
  // Step Configuration
  // ============================================================================
  
  const activeSteps = useMemo(() => {
    return WIZARD_STEPS.filter(step => {
      // Skip analysis step if user chose to skip it
      if (step.id === 'analysis' && skippedSteps.has('analysis')) {
        return false;
      }
      // Conditionally show steps based on source type
      if (step.condition) {
        return step.condition({ sourceType, title, content });
      }
      return true;
    });
  }, [sourceType, title, content, skippedSteps]);

  const stepIndex = activeSteps.findIndex(s => s.id === currentStep);
  const progress = ((stepIndex + 1) / activeSteps.length) * 100;

  // ============================================================================
  // Navigation
  // ============================================================================
  
  const canProceed = useCallback(() => {
    switch (currentStep) {
      case 'source':
        return true; // Source is always selected
      case 'input':
        if (sourceType === 'blank') return title.trim().length > 0;
        if (sourceType === 'url') return urlMetadata !== null || title.trim().length > 0;
        if (sourceType === 'media') return mediaFiles.length > 0 || title.trim().length > 0;
        if (sourceType === 'markdown') return title.trim().length > 0;
        if (sourceType === 'file') return title.trim().length > 0;
        return title.trim().length > 0;
      case 'location':
        return true; // Location can be root
      case 'metadata':
        return true; // Tags are optional
      case 'analysis':
        return true; // Analysis is optional
      case 'review':
        return true;
      default:
        return false;
    }
  }, [currentStep, sourceType, title, urlMetadata, mediaFiles]);

  const goNext = useCallback(() => {
    const idx = activeSteps.findIndex(s => s.id === currentStep);
    if (idx < activeSteps.length - 1) {
      setCurrentStep(activeSteps[idx + 1].id);
    }
  }, [currentStep, activeSteps]);

  const goPrev = useCallback(() => {
    const idx = activeSteps.findIndex(s => s.id === currentStep);
    if (idx > 0) {
      setCurrentStep(activeSteps[idx - 1].id);
    }
  }, [currentStep, activeSteps]);

  const goToStep = useCallback((step: WizardStep) => {
    const targetIdx = activeSteps.findIndex(s => s.id === step);
    const currentIdx = activeSteps.findIndex(s => s.id === currentStep);
    
    // Only allow going to previous steps or current step
    if (targetIdx <= currentIdx) {
      setCurrentStep(step);
    }
  }, [activeSteps, currentStep]);

  const skipAnalysis = useCallback(() => {
    setSkippedSteps(prev => new Set(prev).add('analysis'));
    goNext();
  }, [goNext]);

  // ============================================================================
  // AI Analysis
  // ============================================================================
  
  const runAnalysis = useCallback(async () => {
    setIsAnalyzing(true);
    setError(null);
    
    try {
      // Simulate API call - replace with actual backend call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock analysis result
      const mockAnalysis: AIAnalysis = {
        suggestedTags: [
          { tag: 'documentation', confidence: 0.9 },
          { tag: 'tutorial', confidence: 0.8 },
          { tag: 'getting-started', confidence: 0.7 },
        ],
        suggestedDifficulty: {
          level: 'intermediate',
          reason: 'Content complexity suggests intermediate level based on terminology and concepts used.',
        },
        suggestedPrerequisites: [
          { id: 'prereq-1', title: 'Basic Programming Concepts', confidence: 0.85 },
        ],
        suggestedLocation: parentId ? null : {
          id: 'folder-1',
          path: ['Work', 'Projects'],
          reason: 'Content appears to be project-related documentation.',
        },
        duplicates: [],
        contentSummary: title ? `This strand covers ${title.toLowerCase()} with practical examples and explanations.` : undefined,
        estimatedReadTime: Math.ceil(content.split(' ').length / 200),
        keyTopics: ['introduction', 'setup', 'configuration'],
      };
      
      setAiAnalysis(mockAnalysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  }, [title, content, parentId]);

  const handleApplySuggestion = useCallback((field: string, value: any) => {
    switch (field) {
      case 'tags':
        setTags(value);
        break;
      case 'difficulty':
        setDifficulty(value);
        break;
      case 'prerequisites':
        setPrerequisites(value);
        break;
      case 'parentId':
        setParentId(value);
        break;
      case 'parentPath':
        setParentPath(value);
        break;
    }
  }, []);

  // ============================================================================
  // Submit
  // ============================================================================
  
  const handleSubmit = useCallback(async () => {
    setSubmitting(true);
    setError(null);
    
    try {
      const data: StrandCreationData = {
        type: creationType,
        sourceType,
        title: title.trim(),
        summary: summary.trim(),
        content: content.trim(),
        difficulty,
        tags: [...tags, ...tagsInput.split(',').map(t => t.trim()).filter(Boolean)],
        prerequisites,
        estimatedTime,
        visibility,
        parentId,
        parentPath,
        sourceUrl: sourceType === 'url' ? sourceUrl : undefined,
        sourceMetadata: sourceType === 'url' ? urlMetadata || undefined : undefined,
        mediaFiles: sourceType === 'media' ? mediaFiles : undefined,
      };
      
      await onSubmit(data);
      
      // Reset form
      resetForm();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create');
    } finally {
      setSubmitting(false);
    }
  }, [
    creationType, sourceType, title, summary, content, difficulty, tags, tagsInput,
    prerequisites, estimatedTime, visibility, parentId, parentPath,
    sourceUrl, urlMetadata, mediaFiles, onSubmit, onOpenChange
  ]);

  const resetForm = useCallback(() => {
    setCreationType(initialType);
    setSourceType('blank');
    setTitle('');
    setSummary('');
    setContent('');
    setDifficulty('beginner');
    setTags([]);
    setTagsInput('');
    setPrerequisites([]);
    setEstimatedTime(15);
    setVisibility('private');
    setParentId(initialParentId);
    setParentPath(initialParentPath);
    setSourceUrl('');
    setUrlMetadata(null);
    setMediaFiles([]);
    setAiAnalysis(null);
    setCurrentStep('source');
    setError(null);
    setSkippedSteps(new Set());
  }, [initialType, initialParentId, initialParentPath]);

  // Reset when dialog closes
  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open, resetForm]);

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-full sm:max-w-[700px] h-[100dvh] sm:h-auto sm:max-h-[90vh] overflow-hidden flex flex-col rounded-none sm:rounded-lg m-0 sm:m-auto">
        <DialogHeader className="flex-shrink-0 px-4 sm:px-6 pt-4 sm:pt-6">
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Plus className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            Create New {creationType === 'folder' ? 'Folder' : 'Strand'}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            {parentTitle ? (
              <span className="text-xs">
                Inside: <span className="font-medium">{parentTitle}</span>
              </span>
            ) : (
              <span className="text-xs">Choose a source and configure your new content</span>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex-shrink-0 space-y-2 sm:space-y-3 py-2 px-4 sm:px-6 border-b border-border">
          {/* Mobile: Compact step indicator */}
          <div className="flex sm:hidden items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">
              Step {stepIndex + 1} of {activeSteps.length}
            </span>
            <span className="text-sm font-medium text-primary">
              {activeSteps[stepIndex]?.title}
            </span>
          </div>
          
          {/* Desktop: Full step navigation */}
          <div className="hidden sm:flex items-center justify-between gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {activeSteps.map((step, idx) => {
              const Icon = STEP_ICONS[step.icon] || FileText;
              const isActive = step.id === currentStep;
              const isCompleted = idx < stepIndex;
              const isClickable = idx <= stepIndex;
              
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => isClickable && goToStep(step.id)}
                  disabled={!isClickable}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all whitespace-nowrap min-h-[44px]",
                    isActive && "bg-primary/10 text-primary",
                    isCompleted && "text-primary",
                    !isActive && !isCompleted && "text-muted-foreground",
                    isClickable && "hover:bg-accent cursor-pointer",
                    !isClickable && "cursor-default opacity-50"
                  )}
                >
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium",
                    isActive && "bg-primary text-primary-foreground",
                    isCompleted && "bg-primary/20 text-primary",
                    !isActive && !isCompleted && "bg-muted text-muted-foreground"
                  )}>
                    {isCompleted ? (
                      <CheckCircle className="h-3.5 w-3.5" />
                    ) : (
                      idx + 1
                    )}
                  </div>
                  <span className="text-sm font-medium">{step.title}</span>
                </button>
              );
            })}
          </div>
          <Progress value={progress} className="h-1" />
        </div>

        {/* Error Display */}
        {error && (
          <div className="flex-shrink-0 flex items-center gap-2 p-3 mx-4 sm:mx-6 bg-destructive/10 text-destructive rounded-lg text-xs sm:text-sm">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span className="flex-1">{error}</span>
            <button onClick={() => setError(null)} className="p-1 hover:bg-destructive/20 rounded min-h-[44px] min-w-[44px] flex items-center justify-center -mr-1">
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto py-4 px-4 sm:px-6 -webkit-overflow-scrolling-touch">
          {/* Step 1: Source Selection */}
          {currentStep === 'source' && (
            <SourceSelector
              selectedSource={sourceType}
              onSourceChange={setSourceType}
              creationType={creationType}
              onCreationTypeChange={setCreationType}
            />
          )}

          {/* Step 2: Input based on source */}
          {currentStep === 'input' && (
            <div className="space-y-6">
              {/* Title - always shown */}
              <div className="space-y-2">
                <Label htmlFor="title">Title <span className="text-destructive">*</span></Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={creationType === 'folder' ? 'e.g., Machine Learning Fundamentals' : 'e.g., Introduction to Neural Networks'}
                  autoFocus
                />
              </div>

              {/* Summary - always shown */}
              <div className="space-y-2">
                <Label htmlFor="summary">Summary</Label>
                <Textarea
                  id="summary"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="A brief description for quick scanning..."
                  rows={2}
                />
              </div>

              {/* Source-specific inputs */}
              {sourceType === 'url' && (
                <UrlScraper
                  url={sourceUrl}
                  onUrlChange={setSourceUrl}
                  metadata={urlMetadata}
                  onMetadataChange={setUrlMetadata}
                  onTitleChange={setTitle}
                  onSummaryChange={setSummary}
                  onContentChange={setContent}
                />
              )}

              {sourceType === 'media' && (
                <MediaUploader
                  files={mediaFiles}
                  onFilesChange={setMediaFiles}
                  maxFiles={10}
                  maxSizeMb={50}
                />
              )}

              {sourceType === 'markdown' && (
                <MarkdownEditor
                  content={content}
                  onContentChange={setContent}
                  title={title}
                  summary={summary}
                  difficulty={difficulty}
                  estimatedTime={estimatedTime}
                />
              )}

              {(sourceType === 'blank' || sourceType === 'file') && (
                <div className="space-y-2">
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Write your content here..."
                    rows={6}
                  />
                </div>
              )}
            </div>
          )}

          {/* Step 3: Location */}
          {currentStep === 'location' && (
            <TreeNavigator
              selectedPath={parentPath}
              selectedId={parentId}
              onSelect={(id, path) => {
                setParentId(id);
                setParentPath(path);
              }}
            />
          )}

          {/* Step 4: Metadata */}
          {currentStep === 'metadata' && (
            <div className="space-y-6">
              {/* Tags */}
              <div className="space-y-2">
                <Label>Tags</Label>
                <SmartTagInput
                  value={tagsInput}
                  onChange={setTagsInput}
                  suggestions={suggestions?.tags}
                  availableTags={availableTags}
                  loading={suggestionsLoading || tagsLoading}
                  placeholder="Add tags..."
                />
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {tags.map((tag, i) => (
                      <Badge key={i} variant="secondary" className="gap-1">
                        {tag}
                        <button
                          type="button"
                          onClick={() => setTags(tags.filter((_, j) => j !== i))}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Difficulty */}
              <div className="space-y-2">
                <Label>Difficulty</Label>
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
              </div>

              {/* Estimated Time */}
              <div className="space-y-2">
                <Label>Estimated Time (minutes)</Label>
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

              {/* Visibility */}
              <div className="space-y-2">
                <Label>Visibility</Label>
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
            </div>
          )}

          {/* Step 5: AI Analysis */}
          {currentStep === 'analysis' && (
            <AIAnalysisStep
              data={{
                sourceType,
                title,
                summary,
                content,
                tags,
                difficulty,
                prerequisites,
                parentId,
                parentPath,
              }}
              analysis={aiAnalysis}
              onAnalysisChange={setAiAnalysis}
              onApplySuggestion={handleApplySuggestion}
              isAnalyzing={isAnalyzing}
              onRunAnalysis={runAnalysis}
            />
          )}

          {/* Step 6: Review */}
          {currentStep === 'review' && (
            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-xl space-y-4">
                {/* Title & Type */}
                <div className="flex items-start gap-3">
                  {creationType === 'folder' ? (
                    <FolderTree className="h-6 w-6 text-primary flex-shrink-0" />
                  ) : (
                    <FileText className="h-6 w-6 text-primary flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg">{title || 'Untitled'}</h3>
                    {summary && (
                      <p className="text-sm text-muted-foreground mt-1">{summary}</p>
                    )}
                  </div>
                </div>

                {/* Location */}
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Location:</span>
                  <span className="font-medium">
                    {parentPath.length > 0 ? parentPath.join(' / ') : 'Root'}
                  </span>
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 border-t border-border">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Source</div>
                    <Badge variant="secondary" className="capitalize">{sourceType}</Badge>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Difficulty</div>
                    <Badge variant="secondary" className="capitalize">{difficulty}</Badge>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Est. Time</div>
                    <Badge variant="secondary">{estimatedTime} min</Badge>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Visibility</div>
                    <Badge variant="secondary" className="capitalize">{visibility}</Badge>
                  </div>
                </div>

                {/* Tags */}
                {(tags.length > 0 || tagsInput) && (
                  <div className="pt-3 border-t border-border">
                    <div className="text-xs text-muted-foreground mb-2">Tags</div>
                    <div className="flex flex-wrap gap-1">
                      {[...tags, ...tagsInput.split(',').map(t => t.trim()).filter(Boolean)].map((t, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {t}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Source-specific info */}
                {sourceType === 'url' && urlMetadata && (
                  <div className="pt-3 border-t border-border">
                    <div className="text-xs text-muted-foreground mb-2">Source URL</div>
                    <a 
                      href={urlMetadata.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline truncate block"
                    >
                      {urlMetadata.url}
                    </a>
                  </div>
                )}

                {sourceType === 'media' && mediaFiles.length > 0 && (
                  <div className="pt-3 border-t border-border">
                    <div className="text-xs text-muted-foreground mb-2">
                      {mediaFiles.length} file{mediaFiles.length !== 1 ? 's' : ''} attached
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 p-3 bg-green-500/10 text-green-600 dark:text-green-400 rounded-lg text-sm">
                <CheckCircle className="h-4 w-4 flex-shrink-0" />
                Ready to create! Click "Create" to finish.
              </div>
            </div>
          )}
        </div>

        {/* Navigation - Fixed bottom on mobile */}
        <div className="flex-shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 pt-4 px-4 sm:px-6 pb-4 sm:pb-6 border-t border-border bg-background safe-area-bottom">
          <Button
            type="button"
            variant="ghost"
            onClick={goPrev}
            disabled={stepIndex === 0}
            className="order-2 sm:order-1 min-h-[48px] sm:min-h-[40px]"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <div className="flex items-center gap-2 order-1 sm:order-2">
            {/* Skip analysis option */}
            {currentStep === 'analysis' && !isAnalyzing && (
              <Button
                type="button"
                variant="ghost"
                onClick={skipAnalysis}
                className="text-muted-foreground min-h-[48px] sm:min-h-[40px]"
              >
                Skip
              </Button>
            )}
            
            {currentStep === 'review' ? (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 sm:flex-initial min-w-[120px] min-h-[48px] sm:min-h-[40px]"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    <span className="hidden sm:inline">Creating...</span>
                    <span className="sm:hidden">...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Create {creationType === 'folder' ? 'Folder' : 'Strand'}</span>
                    <span className="sm:hidden">Create</span>
                  </>
                )}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={goNext}
                disabled={!canProceed()}
                className="flex-1 sm:flex-initial min-h-[48px] sm:min-h-[40px]"
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default StrandCreationWizard;

// Re-export types for convenience
export type { StrandCreationData, CreationType, SourceType } from './wizard/types';
