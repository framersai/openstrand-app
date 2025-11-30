/**
 * QAOracle Component
 *
 * Inline Q&A interface for contextual querying within strands/tags explorer.
 * Features real-time streaming, citations, and Socratic follow-ups.
 *
 * @module components/oracle
 * @author OpenStrand <team@frame.dev>
 * @since 2.0.0
 */

'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Search,
  Sparkles,
  MessageSquare,
  BookOpen,
  ChevronRight,
  Loader2,
  AlertCircle,
  X,
  Lightbulb,
  ExternalLink,
  Copy,
  Check,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useOracle, useOracleWithContext } from '@/hooks/use-oracle';
import type { Citation, SocraticQuestion } from '@/types/oracle';

// ============================================================================
// Types
// ============================================================================

export interface QAOracleProps {
  /** Context for scoped queries */
  context?: {
    strandId?: string;
    loomId?: string;
    weaveId?: string;
    tags?: string[];
  };
  /** Placeholder text */
  placeholder?: string;
  /** Auto-focus on mount */
  autoFocus?: boolean;
  /** Compact mode */
  compact?: boolean;
  /** Show suggested questions */
  showSuggestions?: boolean;
  /** Custom suggestions */
  suggestions?: string[];
  /** Callback when a strand is clicked */
  onStrandClick?: (strandId: string) => void;
  /** Callback when query completes */
  onQueryComplete?: (answer: string) => void;
  /** Additional class names */
  className?: string;
}

// ============================================================================
// Suggested Questions
// ============================================================================

const DEFAULT_SUGGESTIONS = [
  'What are the key concepts here?',
  'How does this relate to other topics?',
  'What are the prerequisites?',
  'Can you summarize this?',
];

// ============================================================================
// Component
// ============================================================================

export function QAOracle({
  context,
  placeholder = 'Ask a question about your knowledge base...',
  autoFocus = false,
  compact = false,
  showSuggestions = true,
  suggestions = DEFAULT_SUGGESTIONS,
  onStrandClick,
  onQueryComplete,
  className,
}: QAOracleProps) {
  // State
  const [question, setQuestion] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [speakEnabled, setSpeakEnabled] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const answerRef = useRef<HTMLDivElement>(null);

  // Oracle hook
  const oracle = context
    ? useOracleWithContext(context, { streaming: true })
    : useOracle({ streaming: true });

  // Handle submit
  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      if (!question.trim() || oracle.isQuerying) return;

      setExpanded(true);

      await oracle.queryStream(question, undefined, {
        onDone: (response) => {
          if (response.answer) {
            onQueryComplete?.(response.answer);
          }
        },
      });
    },
    [question, oracle, onQueryComplete]
  );

  // Handle suggestion click
  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      setQuestion(suggestion);
      setExpanded(true);
      oracle.queryStream(suggestion);
    },
    [oracle]
  );

  // Copy answer
  const handleCopy = useCallback(() => {
    if (oracle.answer) {
      navigator.clipboard.writeText(oracle.answer);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [oracle.answer]);

  // Text-to-speech
  const handleSpeak = useCallback(() => {
    if (speakEnabled && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setSpeakEnabled(false);
    } else if (oracle.answer && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(oracle.answer);
      utterance.onend = () => setSpeakEnabled(false);
      window.speechSynthesis.speak(utterance);
      setSpeakEnabled(true);
    }
  }, [oracle.answer, speakEnabled]);

  // Auto-scroll to answer
  useEffect(() => {
    if (oracle.answer && answerRef.current) {
      answerRef.current.scrollTop = answerRef.current.scrollHeight;
    }
  }, [oracle.answer]);

  // Auto-focus
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  return (
    <div
      className={cn(
        'relative rounded-xl border border-border/50 bg-card transition-all duration-300',
        expanded && 'shadow-lg',
        compact ? 'p-3' : 'p-4',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-sm">Oracle</h3>
          <p className="text-xs text-muted-foreground">
            {oracle.isReady ? 'Ask anything about your knowledge' : 'Initializing...'}
          </p>
        </div>
        {expanded && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => {
              setExpanded(false);
              oracle.clear();
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Search Input */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={placeholder}
            disabled={!oracle.isReady || oracle.isQuerying}
            className={cn(
              'pl-9 pr-12 bg-muted/30 border-0 focus-visible:ring-1 focus-visible:ring-primary/50',
              compact ? 'h-9 text-sm' : 'h-10'
            )}
          />
          <Button
            type="submit"
            size="icon"
            variant="ghost"
            disabled={!question.trim() || !oracle.isReady || oracle.isQuerying}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
          >
            {oracle.isQuerying ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </div>
      </form>

      {/* Suggestions */}
      {showSuggestions && !expanded && !oracle.answer && (
        <div className="mt-3 flex flex-wrap gap-2">
          {suggestions.slice(0, compact ? 2 : 4).map((suggestion) => (
            <Badge
              key={suggestion}
              variant="secondary"
              className="cursor-pointer hover:bg-primary/10 transition-colors text-xs"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <Lightbulb className="h-3 w-3 mr-1 opacity-50" />
              {suggestion}
            </Badge>
          ))}
        </div>
      )}

      {/* Error */}
      {oracle.error && (
        <div className="mt-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
          <p className="text-sm text-destructive">{oracle.error}</p>
        </div>
      )}

      {/* Answer */}
      {(expanded || oracle.answer) && !oracle.error && (
        <div className="mt-4 space-y-4">
          {/* Answer Content */}
          <div
            ref={answerRef}
            className={cn(
              'prose prose-sm dark:prose-invert max-w-none',
              'max-h-64 overflow-y-auto',
              compact && 'max-h-48'
            )}
          >
            {oracle.isStreaming && !oracle.answer && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Thinking...</span>
              </div>
            )}
            {oracle.answer && (
              <div className="whitespace-pre-wrap">{oracle.answer}</div>
            )}
          </div>

          {/* Answer Actions */}
          {oracle.answer && !oracle.isStreaming && (
            <div className="flex items-center gap-2 pt-2 border-t border-border/30">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={handleCopy}
                  >
                    {copied ? (
                      <Check className="h-3.5 w-3.5 text-green-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Copy answer</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={handleSpeak}
                  >
                    {speakEnabled ? (
                      <VolumeX className="h-3.5 w-3.5" />
                    ) : (
                      <Volume2 className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{speakEnabled ? 'Stop' : 'Read aloud'}</TooltipContent>
              </Tooltip>
              {oracle.metadata && (
                <span className="text-xs text-muted-foreground ml-auto">
                  {oracle.metadata.durationMs}ms •{' '}
                  {oracle.metadata.resultsRetrieved} sources
                </span>
              )}
            </div>
          )}

          {/* Citations */}
          {oracle.citations.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <BookOpen className="h-3 w-3" />
                Sources
              </h4>
              <div className="grid gap-2">
                {oracle.citations.map((citation) => (
                  <CitationCard
                    key={citation.index}
                    citation={citation}
                    compact={compact}
                    onClick={() => onStrandClick?.(citation.strandId)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Socratic Questions */}
          {oracle.socraticQuestions.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                Keep exploring
              </h4>
              <div className="flex flex-wrap gap-2">
                {oracle.socraticQuestions.map((sq, i) => (
                  <SocraticQuestionBadge
                    key={i}
                    question={sq}
                    onClick={() => {
                      setQuestion(sq.question);
                      handleSubmit();
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Status Indicator */}
      {!oracle.isReady && (
        <div className="absolute inset-0 bg-background/80 rounded-xl flex items-center justify-center">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">{oracle.state.statusMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Sub-Components
// ============================================================================

function CitationCard({
  citation,
  compact,
  onClick,
}: {
  citation: Citation;
  compact?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors',
        'border border-border/30',
        'group'
      )}
    >
      <div className="flex items-start gap-2">
        <Badge variant="outline" className="text-xs font-mono">
          [{citation.index}]
        </Badge>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">
            {citation.title}
          </p>
          {!compact && (
            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
              {citation.text}
            </p>
          )}
        </div>
        <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
      </div>
      <div className="flex items-center gap-2 mt-1">
        <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary/50 rounded-full"
            style={{ width: `${citation.score * 100}%` }}
          />
        </div>
        <span className="text-[10px] text-muted-foreground">
          {Math.round(citation.score * 100)}%
        </span>
      </div>
    </button>
  );
}

function SocraticQuestionBadge({
  question,
  onClick,
}: {
  question: SocraticQuestion;
  onClick?: () => void;
}) {
  const typeColors = {
    clarifying: 'bg-blue-500/10 text-blue-600 hover:bg-blue-500/20',
    deepening: 'bg-purple-500/10 text-purple-600 hover:bg-purple-500/20',
    challenging: 'bg-orange-500/10 text-orange-600 hover:bg-orange-500/20',
    connecting: 'bg-green-500/10 text-green-600 hover:bg-green-500/20',
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        'px-2.5 py-1 rounded-full text-xs transition-colors',
        typeColors[question.type]
      )}
    >
      {question.question}
    </button>
  );
}

export default QAOracle;

