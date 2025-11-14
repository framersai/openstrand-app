'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Search,
  FileText,
  Settings,
  HelpCircle,
  Book,
  Users,
  BarChart3,
  Command,
  ArrowRight,
  History,
  Star,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';

import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

/**
 * Command item in the palette
 */
export interface CommandItem {
  /** Unique identifier */
  id: string;
  /** Display title */
  title: string;
  /** Optional subtitle/description */
  subtitle?: string;
  /** Icon */
  icon: LucideIcon;
  /** Action to perform */
  action: () => void;
  /** Category for grouping */
  category: string;
  /** Keywords for search */
  keywords?: string[];
  /** Keyboard shortcut */
  shortcut?: string;
  /** Badge text */
  badge?: string;
  /** Extended description shown in preview/tooltips */
  description?: string;
  /** Optional tags for quick context */
  tags?: string[];
}

/**
 * Command category
 */
interface CommandCategory {
  id: string;
  label: string;
  icon?: LucideIcon;
}

const CATEGORIES: CommandCategory[] = [
  { id: 'navigation', label: 'Navigation', icon: ArrowRight },
  { id: 'actions', label: 'Actions', icon: Sparkles },
  { id: 'recent', label: 'Recent', icon: History },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'help', label: 'Help', icon: HelpCircle },
];

interface CommandPaletteProps {
  /** Whether the palette is open */
  isOpen: boolean;
  /** Callback when palette is closed */
  onClose: () => void;
  /** Additional custom commands */
  customCommands?: CommandItem[];
}

/**
 * CommandPalette
 * 
 * A powerful command palette for quick navigation and actions.
 * Accessible via Cmd+K (Mac) or Ctrl+K (Windows/Linux).
 * 
 * Features:
 * - Fuzzy search across all commands
 * - Keyboard navigation (Arrow keys, Enter, Escape)
 * - Recent commands tracking
 * - Categorized commands
 * - Custom command support
 * - Keyboard shortcuts display
 * - `/` key support for instant search focus/opening
 * - Full ARIA support
 * - Dark mode compatible
 * 
 * @example
 * ```tsx
 * function App() {
 *   const [isPaletteOpen, setIsPaletteOpen] = useState(false);
 * 
 *   useEffect(() => {
 *     const down = (e: KeyboardEvent) => {
 *       if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
 *         e.preventDefault();
 *         setIsPaletteOpen(true);
 *       }
 *     };
 *     document.addEventListener('keydown', down);
 *     return () => document.removeEventListener('keydown', down);
 *   }, []);
 * 
 *   return (
 *     <CommandPalette
 *       isOpen={isPaletteOpen}
 *       onClose={() => setIsPaletteOpen(false)}
 *     />
 *   );
 * }
 * ```
 */
export function CommandPalette({
  isOpen,
  onClose,
  customCommands = [],
}: CommandPaletteProps) {
  const router = useRouter();
  const t = useTranslations('keyboard');
  const tCommands = useTranslations('keyboard.commands');
  const tCategories = useTranslations('keyboard.categories');
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentCommands, setRecentCommands] = useState<string[]>([]);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  /**
   * Default navigation commands
   */
  const defaultCommands: CommandItem[] = useMemo(() => [
    // Navigation
    {
      id: 'nav-dashboard',
      title: tCommands('dashboard.title'),
      subtitle: tCommands('dashboard.subtitle'),
      description: tCommands('dashboard.subtitle'),
      icon: BarChart3,
      action: () => router.push('/'),
      category: 'navigation',
      keywords: ['home', 'dashboard', 'main'],
      shortcut: 'G D',
      tags: ['analytics', 'overview'],
    },
    {
      id: 'nav-strands',
      title: tCommands('strands.title'),
      subtitle: tCommands('strands.subtitle'),
      description: tCommands('strands.subtitle'),
      icon: FileText,
      action: () => router.push('/pkms/strands'),
      category: 'navigation',
      keywords: ['strands', 'notes', 'documents'],
      shortcut: 'G S',
      tags: ['knowledge', 'content'],
    },
    {
      id: 'nav-tutorials',
      title: tCommands('tutorials.title'),
      subtitle: tCommands('tutorials.subtitle'),
      description: tCommands('tutorials.subtitle'),
      icon: Book,
      action: () => router.push('/tutorials'),
      category: 'navigation',
      keywords: ['tutorials', 'learn', 'help', 'guides'],
      shortcut: 'G T',
      tags: ['learning'],
    },
    {
      id: 'nav-profile',
      title: tCommands('profile.title'),
      subtitle: tCommands('profile.subtitle'),
      description: tCommands('profile.subtitle'),
      icon: Users,
      action: () => router.push('/profile'),
      category: 'navigation',
      keywords: ['profile', 'account', 'settings'],
      shortcut: 'G P',
      tags: ['account'],
    },

    // Actions
    {
      id: 'action-new-strand',
      title: tCommands('createStrand.title'),
      subtitle: tCommands('createStrand.subtitle'),
      description: tCommands('createStrand.subtitle'),
      icon: Sparkles,
      action: () => {
        router.push('/pkms/strands');
        // Trigger create modal
      },
      category: 'actions',
      keywords: ['create', 'new', 'strand', 'note'],
      shortcut: 'C',
      tags: ['creation'],
    },

    // Settings
    {
      id: 'settings-preferences',
      title: tCommands('preferences.title'),
      subtitle: tCommands('preferences.subtitle'),
      description: tCommands('preferences.subtitle'),
      icon: Settings,
      action: () => router.push('/profile?tab=preferences'),
      category: 'settings',
      keywords: ['settings', 'preferences', 'options'],
      tags: ['settings'],
    },

    // Help
    {
      id: 'help-docs',
      title: tCommands('documentation.title'),
      subtitle: tCommands('documentation.subtitle'),
      description: tCommands('documentation.subtitle'),
      icon: HelpCircle,
      action: () => window.open('https://docs.openstrand.ai', '_blank'),
      category: 'help',
      keywords: ['help', 'docs', 'documentation'],
      shortcut: '?',
      tags: ['support'],
    },
  ], [router, tCommands]);

  /**
   * Combine default and custom commands
   */
  const allCommands = useMemo(() => {
    return [...defaultCommands, ...customCommands];
  }, [defaultCommands, customCommands]);

  const categoryLookup = useMemo(
    () =>
      CATEGORIES.reduce<Record<string, CommandCategory>>((acc, category) => {
        acc[category.id] = category;
        return acc;
      }, {}),
    []
  );

  /**
   * Filter and search commands
   */
  const filteredCommands = useMemo(() => {
    if (!query) {
      // Show recent commands first, then all commands
      const recent = allCommands.filter((cmd) => recentCommands.includes(cmd.id));
      const others = allCommands.filter((cmd) => !recentCommands.includes(cmd.id));
      return [...recent, ...others];
    }

    const lowerQuery = query.toLowerCase();
    return allCommands.filter((cmd) => {
      const titleMatch = cmd.title.toLowerCase().includes(lowerQuery);
      const subtitleMatch = cmd.subtitle?.toLowerCase().includes(lowerQuery);
      const keywordMatch = cmd.keywords?.some((k) => k.toLowerCase().includes(lowerQuery));
      return titleMatch || subtitleMatch || keywordMatch;
    });
  }, [query, allCommands, recentCommands]);

  /**
   * Group commands by category
   */
  const groupedCommands = useMemo(() => {
    const groups = new Map<string, CommandItem[]>();

    filteredCommands.forEach((cmd) => {
      const existing = groups.get(cmd.category) || [];
      groups.set(cmd.category, [...existing, cmd]);
    });

    return Array.from(groups.entries()).map(([category, commands]) => ({
      category: CATEGORIES.find((c) => c.id === category) || { id: category, label: category },
      commands,
    }));
  }, [filteredCommands]);

  /**
   * Execute a command
   */
  const executeCommand = useCallback((command: CommandItem) => {
    // Track in recent commands
    setRecentCommands((prev) => {
      const filtered = prev.filter((id) => id !== command.id);
      return [command.id, ...filtered].slice(0, 5); // Keep last 5
    });

    // Execute action
    command.action();

    // Close palette
    onClose();
  }, [onClose]);

  /**
   * Handle keyboard navigation
   */
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isSlashKey(e)) {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => 
            prev < filteredCommands.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => 
            prev > 0 ? prev - 1 : filteredCommands.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            executeCommand(filteredCommands[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, executeCommand, onClose]);

  /**
   * Keep selected index within bounds
   */
  useEffect(() => {
    if (selectedIndex > filteredCommands.length - 1) {
      setSelectedIndex(filteredCommands.length > 0 ? filteredCommands.length - 1 : 0);
    }
  }, [filteredCommands.length, selectedIndex]);

  /**
   * Reset state when opening
   */
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      const frame = requestAnimationFrame(() => searchInputRef.current?.focus());
      return () => cancelAnimationFrame(frame);
    }
  }, [isOpen]);

  /**
   * Load recent commands from localStorage
   */
  useEffect(() => {
    try {
      const saved = localStorage.getItem('openstrand-recent-commands');
      if (saved) {
        setRecentCommands(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Failed to load recent commands:', error);
    }
  }, []);

  /**
   * Save recent commands to localStorage
   */
  useEffect(() => {
    try {
      localStorage.setItem('openstrand-recent-commands', JSON.stringify(recentCommands));
    } catch (error) {
      console.error('Failed to save recent commands:', error);
    }
  }, [recentCommands]);

  const selectedCommand = filteredCommands[selectedIndex];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl p-0 gap-0" aria-labelledby="command-palette-title">
        <TooltipProvider delayDuration={120}>
          {/* Search Input */}
          <div className="flex items-center border-b px-4 py-3">
            <Search className="h-5 w-5 text-muted-foreground mr-3 shrink-0" />
            <Input
              ref={searchInputRef}
              placeholder={t('commandPalette.placeholder')}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              className="border-0 shadow-none focus-visible:ring-0 text-base"
              aria-label={t('commandPalette.placeholder')}
            />
            <kbd className="hidden sm:flex h-6 items-center gap-1 rounded border bg-muted px-2 font-mono text-xs text-muted-foreground">
              <span>ESC</span>
            </kbd>
          </div>

          {/* Content area */}
          <div className="md:grid md:grid-cols-[minmax(0,1fr)_minmax(280px,0.7fr)] md:divide-x" role="listbox" id="command-palette-title">
            {/* Command List */}
            <div className="max-h-[26rem] overflow-y-auto p-2">
              {filteredCommands.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-sm text-muted-foreground">{t('commandPalette.noResults')}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('commandPalette.tryDifferentKeywords')}
                  </p>
                </div>
              ) : (
                groupedCommands.map(({ category, commands }, groupIndex) => (
                  <div key={category.id} className={groupIndex > 0 ? 'mt-4' : ''}>
                {/* Category Header */}
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  {category.icon && <category.icon className="h-3 w-3" />}
                  {tCategories(category.id)}
                </div>

                    {/* Commands in this category */}
                    <div className="mt-1 space-y-1">
                      {commands.map((command) => {
                        const globalIndex = filteredCommands.indexOf(command);
                        const isSelected = globalIndex === selectedIndex;
                        const Icon = command.icon;

                        return (
                          <Tooltip key={command.id}>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() => executeCommand(command)}
                                onMouseEnter={() => setSelectedIndex(globalIndex)}
                                className={cn(
                                  'flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors',
                                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                                  isSelected
                                    ? 'bg-accent text-accent-foreground'
                                    : 'hover:bg-accent/50'
                                )}
                                role="option"
                                aria-selected={isSelected}
                              >
                                {/* Icon */}
                                <div className={cn(
                                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-md',
                                  isSelected ? 'bg-primary/10' : 'bg-muted'
                                )}>
                                  <Icon className={cn(
                                    'h-4 w-4',
                                    isSelected ? 'text-primary' : 'text-muted-foreground'
                                  )} />
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-sm truncate">
                                    {command.title}
                                  </div>
                                  {(command.subtitle || command.description) && (
                                    <div className="text-xs text-muted-foreground truncate">
                                      {command.subtitle ?? command.description}
                                    </div>
                                  )}
                                </div>

                                {/* Badge and Shortcut */}
                                <div className="flex items-center gap-2 shrink-0">
                                  {command.badge && (
                                    <Badge variant="secondary" className="text-xs">
                                      {command.badge}
                                    </Badge>
                                  )}
                                  {command.shortcut && (
                                    <kbd className="hidden sm:flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-xs text-muted-foreground">
                                      {command.shortcut.split(' ').map((key, i) => (
                                        <React.Fragment key={i}>
                                          {i > 0 && <span className="text-muted-foreground/50">+</span>}
                                          <span>{key}</span>
                                        </React.Fragment>
                                      ))}
                                    </kbd>
                                  )}
                                </div>
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="right" align="center" className="max-w-xs">
                              <p className="text-sm font-medium">{command.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {command.description ?? command.subtitle ?? 'Run command'}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                    </div>

                    {groupIndex < groupedCommands.length - 1 && (
                      <Separator className="my-2" />
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Preview Panel */}
            <CommandPreviewPanel
              command={selectedCommand}
              categoryLabel={selectedCommand ? (categoryLookup[selectedCommand.category]?.label ?? selectedCommand.category) : undefined}
            />
          </div>

          {/* Footer with hint */}
          <div className="border-t px-4 py-2 text-xs text-muted-foreground">
            <div className="flex flex-wrap items-center gap-4 justify-between">
              <div className="flex flex-wrap items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="h-4 rounded border bg-muted px-1 font-mono">↑↓</kbd>
                  {t('commandPalette.footer.navigate')}
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="h-4 rounded border bg-muted px-1 font-mono">↵</kbd>
                  {t('commandPalette.footer.select')}
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="h-4 rounded border bg-muted px-1 font-mono">ESC</kbd>
                  {t('commandPalette.footer.close')}
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="h-4 rounded border bg-muted px-1 font-mono">/</kbd>
                  {t('commandPalette.searchHint')}
                </span>
              </div>
              <span className="hidden sm:block">
                {t('commandPalette.commandsCount', { count: filteredCommands.length })}
              </span>
            </div>
          </div>
        </TooltipProvider>
      </DialogContent>
    </Dialog>
  );
}

/**
 * useCommandPalette Hook
 * 
 * Provides command palette functionality with keyboard shortcut
 * 
 * @example
 * ```tsx
 * function App() {
 *   const { CommandPaletteComponent, openCommandPalette } = useCommandPalette();
 * 
 *   return (
 *     <>
 *       <Button onClick={openCommandPalette}>Open Commands</Button>
 *       {CommandPaletteComponent}
 *     </>
 *   );
 * }
 * ```
 */
export function useCommandPalette(customCommands?: CommandItem[]) {
  const [isOpen, setIsOpen] = useState(false);

  /**
   * Setup global keyboard shortcut (Cmd+K / Ctrl+K / /)
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isPaletteShortcut = e.key === 'k' && (e.metaKey || e.ctrlKey);
      const isSlashShortcut =
        e.key === '/' &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey &&
        !isEditableElement(e.target);

      if (isPaletteShortcut || isSlashShortcut) {
        e.preventDefault();
        setIsOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const CommandPaletteComponent = (
    <CommandPalette
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      customCommands={customCommands}
    />
  );

  return {
    CommandPaletteComponent,
    isOpen,
    openCommandPalette: () => setIsOpen(true),
    closeCommandPalette: () => setIsOpen(false),
  };
}

/**
 * CommandPaletteButton
 * 
 * A button that opens the command palette
 * Shows the keyboard shortcut hint
 */
export function CommandPaletteButton({ onClick }: { onClick: () => void }) {
  const isMac = typeof window !== 'undefined' && navigator.platform.includes('Mac');

  return (
    <Button
      variant="outline"
      onClick={onClick}
      className="relative w-full justify-start text-sm text-muted-foreground sm:w-64"
      aria-label="Open command palette"
    >
      <Search className="mr-2 h-4 w-4" />
      <span className="flex-1 text-left">Search...</span>
      <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-xs font-medium opacity-100 sm:flex">
        <span className="text-xs">{isMac ? '⌘' : 'Ctrl'}</span>
        <span>K</span>
      </kbd>
    </Button>
  );
}

/**
 * Helper to determine if an element is editable
 */
function isEditableElement(target: EventTarget | null): target is HTMLElement {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const tagName = target.tagName;
  return (
    target.isContentEditable ||
    tagName === 'INPUT' ||
    tagName === 'TEXTAREA' ||
    tagName === 'SELECT'
  );
}

function isSlashKey(event: KeyboardEvent) {
  return (
    event.key === '/' &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.altKey &&
    !isEditableElement(event.target)
  );
}

function CommandPreviewPanel({
  command,
  categoryLabel,
}: {
  command?: CommandItem;
  categoryLabel?: string;
}) {
  if (!command) {
    return (
      <div className="hidden max-h-[26rem] min-h-[18rem] flex-col justify-center gap-4 p-4 text-sm text-muted-foreground md:flex">
        <div className="rounded-lg border border-dashed border-border/60 p-4">
          <p className="font-semibold text-foreground mb-1">Command palette tips</p>
          <ul className="list-disc pl-4 space-y-1 text-muted-foreground/80">
            <li>Press <kbd className="rounded border bg-muted px-1 font-mono text-[11px]">/</kbd> anywhere to jump into search.</li>
            <li>Use keywords like “theme”, “invite”, or “settings”.</li>
            <li>Hover a command to preview full details.</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="hidden max-h-[26rem] min-h-[18rem] flex-col gap-4 p-4 md:flex">
      <div className="space-y-1">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">
          {categoryLabel ?? 'Command'}
        </span>
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-foreground">{command.title}</h3>
          {command.shortcut && (
            <kbd className="flex h-6 items-center gap-1 rounded border bg-muted px-2 font-mono text-xs text-muted-foreground">
              {command.shortcut}
            </kbd>
          )}
        </div>
        {command.subtitle && (
          <p className="text-sm text-muted-foreground">{command.subtitle}</p>
        )}
        {command.description && (
          <p className="text-sm text-muted-foreground/90 leading-relaxed">{command.description}</p>
        )}
      </div>

      {command.tags && command.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {command.tags.map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      <div className="rounded-lg border border-dashed border-border/60 bg-muted/40 p-3 text-xs leading-relaxed text-muted-foreground">
        Tip: Use <kbd className="mx-1 rounded border bg-background px-1 font-mono text-[10px]">Tab</kbd> to jump into filters, or <kbd className="mx-1 rounded border bg-background px-1 font-mono text-[10px]">/</kbd> to refocus this search.
      </div>
    </div>
  );
}

