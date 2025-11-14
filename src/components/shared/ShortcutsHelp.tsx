'use client';

/**
 * Keyboard Shortcuts Help Modal
 * Triggered by pressing "?"
 */

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Keyboard, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { KeyboardShortcut } from './KeyboardShortcutHint';

interface ShortcutGroup {
  title: string;
  shortcuts: Array<{
    keys: string | string[];
    descriptionKey: string;
  }>;
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: 'Universal',
    shortcuts: [
      { keys: ['/'], descriptionKey: 'openPalette' },
      { keys: ['Cmd', 'K'], descriptionKey: 'openPaletteFull' },
      { keys: ['Esc'], descriptionKey: 'closeCancel' },
      { keys: ['?'], descriptionKey: 'showHelp' },
    ],
  },
  {
    title: 'Navigation',
    shortcuts: [
      { keys: ['G', 'H'], descriptionKey: 'home' },
      { keys: ['G', 'D'], descriptionKey: 'dashboard' },
      { keys: ['G', 'S'], descriptionKey: 'strands' },
      { keys: ['G', 'T'], descriptionKey: 'tutorials' },
      { keys: ['G', 'P'], descriptionKey: 'profile' },
    ],
  },
  {
    title: 'Actions',
    shortcuts: [
      { keys: ['C'], descriptionKey: 'create' },
      { keys: ['I'], descriptionKey: 'import' },
      { keys: ['E'], descriptionKey: 'export' },
      { keys: ['A'], descriptionKey: 'aiAssistant' },
      { keys: ['T'], descriptionKey: 'toggleTheme' },
    ],
  },
  {
    title: 'Editing',
    shortcuts: [
      { keys: ['Cmd', 'S'], descriptionKey: 'save' },
      { keys: ['Cmd', 'B'], descriptionKey: 'bold' },
      { keys: ['Cmd', 'I'], descriptionKey: 'italic' },
      { keys: ['Cmd', 'Z'], descriptionKey: 'undo' },
      { keys: ['Cmd', 'Shift', 'Z'], descriptionKey: 'redo' },
    ],
  },
];

export function ShortcutsHelp() {
  const t = useTranslations('keyboard.shortcuts.help');
  const tGroups = useTranslations('keyboard.shortcuts.groups');
  const [open, setOpen] = useState(false);

  // Listen for "?" key to open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only trigger if not in an input/textarea
      if (e.key === '?' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        setOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const isMac = typeof navigator !== 'undefined' && navigator.platform.includes('Mac');

  // Replace Cmd with Ctrl on Windows/Linux
  const adaptShortcut = (keys: string | string[]) => {
    const keyArray = Array.isArray(keys) ? keys : [keys];
    return keyArray.map(key => 
      key === 'Cmd' ? (isMac ? '⌘' : 'Ctrl') : key
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            {t('title')}
          </DialogTitle>
          <DialogDescription>
            {t('description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {SHORTCUT_GROUPS.map((group, index) => (
            <div key={group.title}>
              <h3 className="font-semibold text-sm text-foreground mb-3">
                {tGroups(`${group.title.toLowerCase()}.title`)}
              </h3>
              
              <div className="space-y-2">
                {group.shortcuts.map((shortcut, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <span className="text-sm text-muted-foreground">
                      {tGroups(`${group.title.toLowerCase()}.${shortcut.descriptionKey}`)}
                    </span>
                    <KeyboardShortcut keys={adaptShortcut(shortcut.keys)} />
                  </div>
                ))}
              </div>

              {index < SHORTCUT_GROUPS.length - 1 && (
                <Separator className="mt-4" />
              )}
            </div>
          ))}

          {/* Pro Tip */}
          <div className="mt-6 p-4 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Keyboard className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 space-y-1">
                <div className="font-semibold text-sm">{t('proTip')}</div>
                <p className="text-xs text-muted-foreground">
                  {t.rich('proTipDescription', {
                    slash: () => (
                      <KeyboardShortcut keys="/" className="inline-flex" />
                    ),
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.open('/docs/keyboard-shortcuts', '_blank')}
          >
            {t('viewFullGuide')} →
          </Button>
          
          <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
            {t('close')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

