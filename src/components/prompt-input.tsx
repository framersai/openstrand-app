'use client';

/**
 * @module components/prompt-input
 * @description Natural language prompt input component with suggestions and history.
 * Handles user queries for visualization generation.
 */

import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, History, ChevronDown } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PromptInputProps {
  /** Callback when prompt is submitted */
  onSubmit: (prompt: string) => void;
  /** Whether processing is in progress */
  isProcessing?: boolean;
  /** Suggested prompts */
  suggestions?: string[];
  /** Placeholder text */
  placeholder?: string;
  /** Maximum character limit */
  maxLength?: number;
}

/**
 * PromptInput component for natural language queries
 */
export const PromptInput: React.FC<PromptInputProps> = ({
  onSubmit,
  isProcessing = false,
  suggestions = [],
  placeholder,
  maxLength = 500,
}) => {
  const t = useTranslations('visualizations.create');
  const [prompt, setPrompt] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  /**
   * Auto-resize textarea based on content
   */
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [prompt]);
  
  /**
   * Load history from localStorage
   */
  useEffect(() => {
    const savedHistory = localStorage.getItem('prompt-history');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory).slice(0, 10));
    }
  }, []);
  
  /**
   * Handle form submission
   */
  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!prompt.trim() || isProcessing) {
      return;
    }
    
    // Add to history
    const newHistory = [prompt, ...history.filter(h => h !== prompt)].slice(0, 10);
    setHistory(newHistory);
    localStorage.setItem('prompt-history', JSON.stringify(newHistory));
    
    // Submit
    onSubmit(prompt);
    setPrompt('');
    setShowSuggestions(false);
    setShowHistory(false);
  };
  
  /**
   * Handle suggestion click
   */
  const handleSuggestionClick = (suggestion: string) => {
    setPrompt(suggestion);
    setShowSuggestions(false);
    textareaRef.current?.focus();
  };
  
  /**
   * Handle keyboard shortcuts
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };
  
  const resolvedPlaceholder = placeholder ?? t('placeholder');

  return (
    <div className="relative space-y-2">
      {/* Textarea */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value.slice(0, maxLength))}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowHistory(false)}
          placeholder={resolvedPlaceholder}
          disabled={isProcessing}
          className={cn(
            'w-full min-h-[80px] max-h-[200px] px-4 py-3 pr-12',
            'rounded-lg border bg-background resize-none',
            'placeholder:text-muted-foreground',
            'focus:outline-none focus:ring-2 focus:ring-primary/20',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'transition-all duration-200'
          )}
          rows={3}
        />
        
        {/* Character count */}
        <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
          {prompt.length}/{maxLength}
        </div>
      </div>
      
      {/* Action buttons */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {/* Suggestions toggle */}
          {suggestions.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowSuggestions(!showSuggestions)}
              className="text-xs"
            >
              <Sparkles className="h-3 w-3 mr-1" />
              {t('suggestions')}
              <ChevronDown className={cn(
                'h-3 w-3 ml-1 transition-transform',
                showSuggestions && 'rotate-180'
              )} />
            </Button>
          )}
          
          {/* History toggle */}
          {history.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowHistory(!showHistory)}
              className="text-xs"
            >
              <History className="h-3 w-3 mr-1" />
              {t('history')}
              <ChevronDown className={cn(
                'h-3 w-3 ml-1 transition-transform',
                showHistory && 'rotate-180'
              )} />
            </Button>
          )}
        </div>
        
        {/* Submit button */}
        <Button
          onClick={() => handleSubmit()}
          disabled={!prompt.trim() || isProcessing}
          size="sm"
          className="min-w-[100px]"
        >
          {isProcessing ? (
            <>
              <div className="h-3 w-3 rounded-full border-2 border-background border-t-transparent animate-spin mr-2" />
              {t('processing')}
            </>
          ) : (
            <>
              <Send className="h-3 w-3 mr-2" />
              {t('button')}
            </>
          )}
        </Button>
      </div>
      
      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 p-2 bg-popover rounded-lg border shadow-lg animate-in">
          <p className="text-xs font-medium text-muted-foreground mb-2">
            {t('tryPrompts')}
          </p>
          <div className="space-y-1">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className={cn(
                  'w-full text-left px-3 py-2 rounded text-sm',
                  'hover:bg-muted transition-colors',
                  'focus:outline-none focus:bg-muted'
                )}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* History dropdown */}
      {showHistory && history.length > 0 && (
        <div className="absolute z-10 w-full mt-1 p-2 bg-popover rounded-lg border shadow-lg animate-in">
          <p className="text-xs font-medium text-muted-foreground mb-2">
            {t('recentPrompts')}
          </p>
          <div className="space-y-1 max-h-[200px] overflow-y-auto scrollbar-thin">
            {history.map((item, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(item)}
                className={cn(
                  'w-full text-left px-3 py-2 rounded text-sm',
                  'hover:bg-muted transition-colors',
                  'focus:outline-none focus:bg-muted',
                  'line-clamp-2'
                )}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
