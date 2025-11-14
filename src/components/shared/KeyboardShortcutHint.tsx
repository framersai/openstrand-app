'use client';

/**
 * Keyboard Shortcut Hint Component
 * Shows a dismissible hint about the command palette on first visit
 */

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Command, X, Keyboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface KeyboardShortcutHintProps {
  /** Additional CSS classes */
  className?: string;
  /** Auto-dismiss after N seconds */
  autoDismissAfter?: number;
}

export function KeyboardShortcutHint({ 
  className,
  autoDismissAfter,
}: KeyboardShortcutHintProps) {
  const t = useTranslations('keyboard.shortcuts.hint');
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if user has seen this hint before
    const hasSeenHint = localStorage.getItem('keyboard-hint-dismissed');
    
    if (!hasSeenHint) {
      // Show hint after a short delay (so page loads first)
      const timer = setTimeout(() => {
        setVisible(true);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (visible && autoDismissAfter) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, autoDismissAfter);
      
      return () => clearTimeout(timer);
    }
  }, [visible, autoDismissAfter]);

  const handleDismiss = () => {
    setVisible(false);
    setDismissed(true);
    localStorage.setItem('keyboard-hint-dismissed', 'true');
  };

  if (!visible || dismissed) {
    return null;
  }

  const isMac = typeof navigator !== 'undefined' && navigator.platform.includes('Mac');

  return (
    <Card
      className={cn(
        'fixed bottom-4 right-4 z-50 w-80 p-4 shadow-2xl border-2 border-primary/30 bg-card/95 backdrop-blur-sm',
        'animate-in slide-in-from-bottom-4 fade-in duration-500',
        className
      )}
      role="status"
      aria-live="polite"
    >
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted transition-colors"
        aria-label="Dismiss hint"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-start gap-3 pr-6">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Keyboard className="h-5 w-5 text-primary" />
        </div>

        <div className="flex-1 space-y-2">
          <div className="font-semibold text-foreground">
            {t('title')}
          </div>
          
          <p className="text-sm text-muted-foreground">
            {t.rich('description', {
              slash: () => (
                <kbd className="px-2 py-1 bg-muted rounded font-mono text-xs">
                  /
                </kbd>
              ),
              cmdK: () => (
                <kbd className="px-2 py-1 bg-muted rounded font-mono text-xs">
                  {isMac ? '⌘' : 'Ctrl'}+K
                </kbd>
              ),
            })}
          </p>

          <div className="flex items-center gap-2 pt-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                // Trigger command palette
                const event = new KeyboardEvent('keydown', {
                  key: 'k',
                  metaKey: isMac,
                  ctrlKey: !isMac,
                });
                document.dispatchEvent(event);
                handleDismiss();
              }}
              className="h-8 text-xs"
            >
              <Command className="h-3 w-3 mr-1" />
              {t('tryNow')}
            </Button>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDismiss}
              className="h-8 text-xs"
            >
              {t('gotIt')}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

/**
 * Inline keyboard shortcut badge for showing hints
 */
export function KeyboardShortcut({ 
  keys,
  className 
}: { 
  keys: string | string[];
  className?: string;
}) {
  const keyArray = Array.isArray(keys) ? keys : [keys];
  
  return (
    <span className={cn('inline-flex items-center gap-1', className)}>
      {keyArray.map((key, index) => (
        <kbd
          key={index}
          className="inline-flex h-5 items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground"
        >
          {key}
        </kbd>
      ))}
    </span>
  );
}

/**
 * Tooltip with keyboard shortcut
 */
export function ShortcutTooltip({
  shortcut,
  description,
  className,
}: {
  shortcut: string;
  description: string;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center justify-between gap-3 text-xs', className)}>
      <span className="text-muted-foreground">{description}</span>
      <KeyboardShortcut keys={shortcut} />
    </div>
  );
}

