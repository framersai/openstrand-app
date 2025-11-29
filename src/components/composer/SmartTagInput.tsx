'use client';

/**
 * @module SmartTagInput
 * @description Tag input with smart suggestions and autocomplete
 * 
 * Features:
 * - Autocomplete from existing tags
 * - AI-powered suggestions based on content
 * - Visual confidence indicators
 * - Keyboard navigation
 */

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { X, Plus, Sparkles, Check, Tag, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { TagSuggestion } from '@/hooks/useSmartSuggestions';

// ============================================================================
// Types
// ============================================================================

export interface SmartTagInputProps {
  /** Current tags (comma-separated string or array) */
  value: string | string[];
  /** Callback when tags change */
  onChange: (tags: string) => void;
  /** Suggested tags from AI */
  suggestions?: TagSuggestion[];
  /** Available tags for autocomplete */
  availableTags?: Array<{ tag: string; count: number }>;
  /** Loading state for suggestions */
  loading?: boolean;
  /** Placeholder text */
  placeholder?: string;
  /** Max number of tags */
  maxTags?: number;
  /** Disabled state */
  disabled?: boolean;
  /** Additional class names */
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

export function SmartTagInput({
  value,
  onChange,
  suggestions = [],
  availableTags = [],
  loading = false,
  placeholder = 'Add tags...',
  maxTags = 20,
  disabled = false,
  className,
}: SmartTagInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse current tags
  const currentTags = useMemo(() => {
    if (Array.isArray(value)) return value;
    return value
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);
  }, [value]);

  // Filter suggestions that aren't already added
  const filteredSuggestions = useMemo(() => {
    const currentSet = new Set(currentTags.map(t => t.toLowerCase()));
    return suggestions.filter(s => !currentSet.has(s.tag.toLowerCase()));
  }, [suggestions, currentTags]);

  // Filter autocomplete options based on input
  const autocompleteOptions = useMemo(() => {
    if (!inputValue.trim()) return [];
    const query = inputValue.toLowerCase();
    const currentSet = new Set(currentTags.map(t => t.toLowerCase()));
    return availableTags
      .filter(t => 
        t.tag.toLowerCase().includes(query) && 
        !currentSet.has(t.tag.toLowerCase())
      )
      .slice(0, 8);
  }, [inputValue, availableTags, currentTags]);

  // Combined dropdown items
  const dropdownItems = useMemo(() => {
    const items: Array<{ type: 'suggestion' | 'autocomplete'; tag: string; confidence?: number; count?: number }> = [];
    
    // Add AI suggestions first
    filteredSuggestions.slice(0, 5).forEach(s => {
      items.push({ type: 'suggestion', tag: s.tag, confidence: s.confidence });
    });
    
    // Add autocomplete options
    autocompleteOptions.forEach(a => {
      if (!items.find(i => i.tag.toLowerCase() === a.tag.toLowerCase())) {
        items.push({ type: 'autocomplete', tag: a.tag, count: a.count });
      }
    });
    
    return items;
  }, [filteredSuggestions, autocompleteOptions]);

  // Add a tag
  const addTag = useCallback((tag: string) => {
    const trimmedTag = tag.trim().toLowerCase();
    if (!trimmedTag || currentTags.length >= maxTags) return;
    if (currentTags.some(t => t.toLowerCase() === trimmedTag)) return;
    
    const newTags = [...currentTags, trimmedTag];
    onChange(newTags.join(', '));
    setInputValue('');
    setHighlightedIndex(-1);
  }, [currentTags, maxTags, onChange]);

  // Remove a tag
  const removeTag = useCallback((tagToRemove: string) => {
    const newTags = currentTags.filter(t => t !== tagToRemove);
    onChange(newTags.join(', '));
  }, [currentTags, onChange]);

  // Handle input keydown
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && dropdownItems[highlightedIndex]) {
        addTag(dropdownItems[highlightedIndex].tag);
      } else if (inputValue.trim()) {
        addTag(inputValue);
      }
    } else if (e.key === 'Backspace' && !inputValue && currentTags.length > 0) {
      removeTag(currentTags[currentTags.length - 1]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => 
        prev < dropdownItems.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setHighlightedIndex(-1);
    }
  }, [highlightedIndex, dropdownItems, inputValue, currentTags, addTag, removeTag]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Tag display and input */}
      <div 
        className={cn(
          "flex flex-wrap gap-1.5 p-2 min-h-[42px] rounded-md border border-input bg-background",
          "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        onClick={() => inputRef.current?.focus()}
      >
        {/* Existing tags */}
        {currentTags.map((tag, idx) => (
          <Badge 
            key={`${tag}-${idx}`} 
            variant="secondary" 
            className="gap-1 pr-1"
          >
            <Tag className="h-3 w-3" />
            {tag}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeTag(tag);
              }}
              className="ml-1 rounded-full hover:bg-muted-foreground/20 p-0.5"
              disabled={disabled}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        
        {/* Input */}
        {currentTags.length < maxTags && (
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={handleKeyDown}
            placeholder={currentTags.length === 0 ? placeholder : ''}
            disabled={disabled}
            className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-sm"
          />
        )}
        
        {loading && (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Dropdown */}
      {showSuggestions && (dropdownItems.length > 0 || filteredSuggestions.length > 0) && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg overflow-hidden">
          {/* AI Suggestions header */}
          {filteredSuggestions.length > 0 && (
            <div className="px-3 py-2 bg-muted/50 border-b border-border">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Sparkles className="h-3 w-3 text-primary" />
                <span>AI Suggestions</span>
              </div>
            </div>
          )}
          
          {/* Dropdown items */}
          <div className="max-h-48 overflow-y-auto">
            {dropdownItems.map((item, idx) => (
              <button
                key={`${item.tag}-${idx}`}
                type="button"
                className={cn(
                  "w-full px-3 py-2 text-left text-sm flex items-center justify-between hover:bg-muted transition-colors",
                  highlightedIndex === idx && "bg-muted"
                )}
                onClick={() => addTag(item.tag)}
              >
                <div className="flex items-center gap-2">
                  {item.type === 'suggestion' ? (
                    <Sparkles className="h-3 w-3 text-primary" />
                  ) : (
                    <Tag className="h-3 w-3 text-muted-foreground" />
                  )}
                  <span>{item.tag}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {item.confidence !== undefined && (
                    <span className={cn(
                      "px-1.5 py-0.5 rounded",
                      item.confidence > 0.7 && "bg-green-500/10 text-green-600",
                      item.confidence > 0.4 && item.confidence <= 0.7 && "bg-yellow-500/10 text-yellow-600",
                      item.confidence <= 0.4 && "bg-muted"
                    )}>
                      {Math.round(item.confidence * 100)}%
                    </span>
                  )}
                  {item.count !== undefined && (
                    <span>used {item.count}x</span>
                  )}
                </div>
              </button>
            ))}
          </div>
          
          {/* Add custom tag hint */}
          {inputValue.trim() && !dropdownItems.find(i => i.tag.toLowerCase() === inputValue.toLowerCase()) && (
            <div className="px-3 py-2 border-t border-border bg-muted/30">
              <button
                type="button"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                onClick={() => addTag(inputValue)}
              >
                <Plus className="h-3 w-3" />
                Create "{inputValue}"
              </button>
            </div>
          )}
        </div>
      )}

      {/* Quick add suggested tags */}
      {filteredSuggestions.length > 0 && !showSuggestions && currentTags.length < maxTags && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            Suggested:
          </span>
          {filteredSuggestions.slice(0, 5).map((s, idx) => (
            <button
              key={`suggested-${s.tag}-${idx}`}
              type="button"
              onClick={() => addTag(s.tag)}
              className={cn(
                "text-xs px-2 py-0.5 rounded-full border transition-colors",
                "hover:bg-primary hover:text-primary-foreground hover:border-primary",
                s.confidence > 0.7 && "border-green-500/50 text-green-600",
                s.confidence > 0.4 && s.confidence <= 0.7 && "border-yellow-500/50 text-yellow-600",
                s.confidence <= 0.4 && "border-border text-muted-foreground"
              )}
            >
              + {s.tag}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default SmartTagInput;

