'use client';

/**
 * @module composer/wizard/AIAnalysisStep
 * @description AI analysis, deduplication, and smart suggestions step
 */

import { useState, useCallback, useEffect } from 'react';
import { 
  Brain, 
  Loader2, 
  CheckCircle,
  AlertTriangle,
  Tag,
  Link2,
  FolderTree,
  Copy,
  Merge,
  SkipForward,
  Sparkles,
  RefreshCw,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { AIAnalysis, DuplicateMatch, StrandCreationData } from './types';

interface AIAnalysisStepProps {
  data: Partial<StrandCreationData>;
  analysis: AIAnalysis | null;
  onAnalysisChange: (analysis: AIAnalysis | null) => void;
  onApplySuggestion: (field: string, value: any) => void;
  isAnalyzing: boolean;
  onRunAnalysis: () => void;
}

export function AIAnalysisStep({
  data,
  analysis,
  onAnalysisChange,
  onApplySuggestion,
  isAnalyzing,
  onRunAnalysis,
}: AIAnalysisStepProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['tags', 'duplicates'])
  );
  const [appliedSuggestions, setAppliedSuggestions] = useState<Set<string>>(new Set());

  const toggleSection = useCallback((section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  }, []);

  const handleApply = useCallback((field: string, value: any) => {
    onApplySuggestion(field, value);
    setAppliedSuggestions(prev => new Set(prev).add(field));
  }, [onApplySuggestion]);

  // Auto-run analysis when step is shown
  useEffect(() => {
    if (!analysis && !isAnalyzing && data.title) {
      onRunAnalysis();
    }
  }, [analysis, isAnalyzing, data.title, onRunAnalysis]);

  if (isAnalyzing) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
          <div className="relative p-4 bg-primary/10 rounded-full">
            <Brain className="h-8 w-8 text-primary animate-pulse" />
          </div>
        </div>
        <div className="text-center">
          <p className="font-medium">Analyzing your content...</p>
          <p className="text-sm text-muted-foreground">
            Finding tags, checking for duplicates, and generating suggestions
          </p>
        </div>
        <Progress value={66} className="w-48 h-1" />
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="p-4 bg-muted rounded-full">
          <Brain className="h-8 w-8 text-muted-foreground" />
        </div>
        <div className="text-center">
          <p className="font-medium">AI Analysis Available</p>
          <p className="text-sm text-muted-foreground">
            Get smart suggestions for tags, difficulty, and check for duplicates
          </p>
        </div>
        <Button onClick={onRunAnalysis} className="gap-2">
          <Sparkles className="h-4 w-4" />
          Run Analysis
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-500" />
          <span className="font-medium">Analysis Complete</span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onRunAnalysis}
          className="gap-1 h-7"
        >
          <RefreshCw className="h-3 w-3" />
          Re-analyze
        </Button>
      </div>

      {/* Duplicates Warning */}
      {analysis.duplicates.length > 0 && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
          <button
            type="button"
            onClick={() => toggleSection('duplicates')}
            className="w-full flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              <span className="font-medium text-amber-700 dark:text-amber-300">
                {analysis.duplicates.length} potential duplicate{analysis.duplicates.length !== 1 ? 's' : ''} found
              </span>
            </div>
            {expandedSections.has('duplicates') ? (
              <ChevronUp className="h-4 w-4 text-amber-600" />
            ) : (
              <ChevronDown className="h-4 w-4 text-amber-600" />
            )}
          </button>

          {expandedSections.has('duplicates') && (
            <div className="mt-3 space-y-2">
              {analysis.duplicates.map((dup) => (
                <DuplicateCard key={dup.id} duplicate={dup} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Suggested Tags */}
      <div className="border border-border rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('tags')}
          className="w-full flex items-center justify-between p-4 bg-card hover:bg-accent/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-primary" />
            <span className="font-medium">Suggested Tags</span>
            <Badge variant="secondary" className="text-xs">
              {analysis.suggestedTags.length}
            </Badge>
          </div>
          {expandedSections.has('tags') ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        {expandedSections.has('tags') && (
          <div className="p-4 pt-0 space-y-3">
            <div className="flex flex-wrap gap-2">
              {analysis.suggestedTags.map((tag, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleApply('tags', [...(data.tags || []), tag.tag])}
                  disabled={data.tags?.includes(tag.tag)}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all",
                    data.tags?.includes(tag.tag)
                      ? "bg-primary/20 text-primary cursor-default"
                      : "bg-muted hover:bg-primary/10 hover:text-primary cursor-pointer"
                  )}
                >
                  {tag.tag}
                  <span className="text-xs text-muted-foreground">
                    {Math.round(tag.confidence * 100)}%
                  </span>
                  {data.tags?.includes(tag.tag) && (
                    <CheckCircle className="h-3 w-3 text-primary" />
                  )}
                </button>
              ))}
            </div>
            {analysis.suggestedTags.length > 0 && !appliedSuggestions.has('all-tags') && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const allTags = analysis.suggestedTags.map(t => t.tag);
                  handleApply('tags', [...new Set([...(data.tags || []), ...allTags])]);
                  setAppliedSuggestions(prev => new Set(prev).add('all-tags'));
                }}
                className="w-full gap-2"
              >
                <Sparkles className="h-3 w-3" />
                Apply all suggested tags
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Suggested Difficulty */}
      <div className="border border-border rounded-xl p-4 bg-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" />
            <span className="font-medium">Suggested Difficulty</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge 
              variant="secondary" 
              className={cn(
                "capitalize",
                analysis.suggestedDifficulty.level === 'beginner' && "bg-green-500/10 text-green-600",
                analysis.suggestedDifficulty.level === 'intermediate' && "bg-yellow-500/10 text-yellow-600",
                analysis.suggestedDifficulty.level === 'advanced' && "bg-orange-500/10 text-orange-600",
                analysis.suggestedDifficulty.level === 'expert' && "bg-red-500/10 text-red-600"
              )}
            >
              {analysis.suggestedDifficulty.level}
            </Badge>
            {data.difficulty !== analysis.suggestedDifficulty.level && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleApply('difficulty', analysis.suggestedDifficulty.level)}
                className="h-7 text-xs"
              >
                Apply
              </Button>
            )}
            {data.difficulty === analysis.suggestedDifficulty.level && (
              <CheckCircle className="h-4 w-4 text-green-500" />
            )}
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {analysis.suggestedDifficulty.reason}
        </p>
      </div>

      {/* Prerequisites */}
      {analysis.suggestedPrerequisites.length > 0 && (
        <div className="border border-border rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('prereqs')}
            className="w-full flex items-center justify-between p-4 bg-card hover:bg-accent/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Link2 className="h-4 w-4 text-primary" />
              <span className="font-medium">Suggested Prerequisites</span>
              <Badge variant="secondary" className="text-xs">
                {analysis.suggestedPrerequisites.length}
              </Badge>
            </div>
            {expandedSections.has('prereqs') ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </button>

          {expandedSections.has('prereqs') && (
            <div className="p-4 pt-0 space-y-2">
              {analysis.suggestedPrerequisites.map((prereq) => (
                <div
                  key={prereq.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                >
                  <span className="text-sm">{prereq.title}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {Math.round(prereq.confidence * 100)}%
                    </span>
                    {data.prerequisites?.includes(prereq.id) ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleApply('prerequisites', [...(data.prerequisites || []), prereq.id])}
                        className="h-6 text-xs"
                      >
                        Add
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Suggested Location */}
      {analysis.suggestedLocation && (
        <div className="border border-border rounded-xl p-4 bg-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderTree className="h-4 w-4 text-primary" />
              <span className="font-medium">Suggested Location</span>
            </div>
            {data.parentId !== analysis.suggestedLocation.id && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  handleApply('parentId', analysis.suggestedLocation!.id);
                  handleApply('parentPath', analysis.suggestedLocation!.path);
                }}
                className="h-7 text-xs"
              >
                Apply
              </Button>
            )}
          </div>
          <div className="mt-2">
            <div className="text-sm text-muted-foreground">
              {analysis.suggestedLocation.path.join(' / ') || 'Root'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {analysis.suggestedLocation.reason}
            </p>
          </div>
        </div>
      )}

      {/* Content Summary */}
      {analysis.contentSummary && (
        <div className="border border-border rounded-xl p-4 bg-card">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="font-medium">Content Summary</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {analysis.contentSummary}
          </p>
          {analysis.keyTopics && analysis.keyTopics.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {analysis.keyTopics.map((topic, i) => (
                <Badge key={i} variant="outline" className="text-xs">
                  {topic}
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DuplicateCard({ duplicate }: { duplicate: DuplicateMatch }) {
  return (
    <div className="p-3 bg-card rounded-lg border border-border">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm truncate">{duplicate.title}</span>
            <Badge 
              variant="outline" 
              className={cn(
                "text-[10px]",
                duplicate.matchType === 'exact' && "border-red-500/50 text-red-600",
                duplicate.matchType === 'similar' && "border-amber-500/50 text-amber-600",
                duplicate.matchType === 'related' && "border-blue-500/50 text-blue-600"
              )}
            >
              {duplicate.matchType} · {Math.round(duplicate.similarity * 100)}%
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {duplicate.path.join(' / ') || 'Root'}
          </p>
        </div>
        <div className="flex gap-1">
          <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1">
            <Merge className="h-3 w-3" />
            Merge
          </Button>
          <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1">
            <SkipForward className="h-3 w-3" />
            Skip
          </Button>
        </div>
      </div>
    </div>
  );
}

