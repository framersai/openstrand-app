'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, Sparkles, Loader2, X, MessageSquare } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface AskBarProps {
  loomId: string;
  onSubmit: (question: string) => void;
  loading?: boolean;
  recentQuestions?: string[];
  className?: string;
  placeholder?: string;
}

/**
 * AskBar Component
 * 
 * Quick question input for RAG queries.
 * Shows recent questions and loading state.
 * 
 * @example
 * ```tsx
 * <AskBar
 *   loomId="loom-123"
 *   onSubmit={(q) => handleAsk(q)}
 *   recentQuestions={['What is...', 'Explain...']}
 * />
 * ```
 */
export function AskBar({
  loomId,
  onSubmit,
  loading = false,
  recentQuestions = [],
  className,
  placeholder = 'Ask a question about this loom...',
}: AskBarProps) {
  const [question, setQuestion] = useState('');
  const [showRecent, setShowRecent] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (question.trim() && !loading) {
      onSubmit(question.trim());
      setQuestion('');
      setShowRecent(false);
    }
  };

  const handleSelectRecent = (q: string) => {
    setQuestion(q);
    setShowRecent(false);
    inputRef.current?.focus();
  };

  // Show recent on focus if available
  useEffect(() => {
    const handleFocus = () => {
      if (recentQuestions.length > 0) {
        setShowRecent(true);
      }
    };

    const input = inputRef.current;
    input?.addEventListener('focus', handleFocus);
    return () => input?.removeEventListener('focus', handleFocus);
  }, [recentQuestions.length]);

  return (
    <div className={cn('relative', className)}>
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={inputRef}
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={placeholder}
            disabled={loading}
            className="pl-10 pr-24"
          />
          {loading ? (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            </div>
          ) : question ? (
            <div className="absolute right-3 top-1/2 flex -translate-y-1/2 gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2"
                onClick={() => setQuestion('')}
              >
                <X className="h-3 w-3" />
              </Button>
              <Button
                type="submit"
                size="sm"
                className="h-7 gap-1 px-2"
              >
                <Sparkles className="h-3 w-3" />
                Ask
              </Button>
            </div>
          ) : null}
        </div>
      </form>

      {/* Recent questions dropdown */}
      {showRecent && recentQuestions.length > 0 && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowRecent(false)}
          />
          <Card className="absolute top-full z-20 mt-2 w-full border-border/60 bg-background/95 p-2 shadow-lg backdrop-blur-sm">
            <div className="mb-2 flex items-center gap-2 px-2 text-xs font-medium text-muted-foreground">
              <MessageSquare className="h-3 w-3" />
              Recent questions
            </div>
            <div className="space-y-1">
              {recentQuestions.slice(0, 5).map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleSelectRecent(q)}
                  className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-muted/50 transition-colors"
                >
                  <div className="truncate">{q}</div>
                </button>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

