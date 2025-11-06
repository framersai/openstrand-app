import { useCallback, useMemo, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

export interface TagsChipInputProps {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  maxTags?: number;
}

export function TagsChipInput({ value, onChange, placeholder = 'Add tag and press Enter', disabled, maxTags }: TagsChipInputProps) {
  const [inputValue, setInputValue] = useState('');
  const containerRef = useRef<HTMLDivElement | null>(null);

  const normalized = useMemo(() => (Array.isArray(value) ? value : []).map((t) => t.trim()).filter(Boolean), [value]);

  const addTag = useCallback((raw: string) => {
    const pieces = raw
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);
    if (pieces.length === 0) return;
    const existing = new Set(normalized.map((t) => t.toLowerCase()));
    const next: string[] = [...normalized];
    for (const p of pieces) {
      if (maxTags && next.length >= maxTags) break;
      if (!existing.has(p.toLowerCase())) {
        next.push(p);
        existing.add(p.toLowerCase());
      }
    }
    onChange(next);
  }, [normalized, onChange, maxTags]);

  const removeTag = useCallback((tag: string) => {
    const next = normalized.filter((t) => t.toLowerCase() !== tag.toLowerCase());
    onChange(next);
  }, [normalized, onChange]);

  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (event) => {
    if (disabled) return;
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      if (inputValue.trim()) {
        addTag(inputValue);
        setInputValue('');
      }
      return;
    }
    if (event.key === 'Backspace' && inputValue.length === 0 && normalized.length > 0) {
      removeTag(normalized[normalized.length - 1]);
    }
  };

  const handlePaste: React.ClipboardEventHandler<HTMLInputElement> = (event) => {
    if (disabled) return;
    const text = event.clipboardData.getData('text');
    if (text && text.includes(',')) {
      event.preventDefault();
      addTag(text);
      setInputValue('');
    }
  };

  return (
    <div
      ref={containerRef}
      className="flex min-h-10 w-full flex-wrap items-center gap-2 rounded-md border border-input bg-background px-2 py-1.5"
    >
      {normalized.map((tag) => (
        <Badge key={tag} variant="secondary" className="flex items-center gap-1">
          <span className="text-xs">{tag}</span>
          <button
            type="button"
            onClick={() => removeTag(tag)}
            className="-mr-1 inline-flex h-4 w-4 items-center justify-center rounded hover:bg-muted"
            aria-label={`Remove ${tag}`}
            disabled={disabled}
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      <Input
        className="h-7 flex-1 border-none px-1 py-0 focus-visible:ring-0"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onBlur={() => {
          if (inputValue.trim()) {
            addTag(inputValue);
            setInputValue('');
          }
        }}
        placeholder={normalized.length === 0 ? placeholder : ''}
        disabled={disabled || (maxTags ? normalized.length >= maxTags : false)}
      />
    </div>
  );
}


