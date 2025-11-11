'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
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
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentCommands, setRecentCommands] = useState<string[]>([]);

  /**
   * Default navigation commands
   */
  const defaultCommands: CommandItem[] = useMemo(() => [
    // Navigation
    {
      id: 'nav-dashboard',
      title: 'Dashboard',
      subtitle: 'Go to main dashboard',
      icon: BarChart3,
      action: () => router.push('/'),
      category: 'navigation',
      keywords: ['home', 'dashboard', 'main'],
      shortcut: 'G D',
    },
    {
      id: 'nav-strands',
      title: 'Strands',
      subtitle: 'View your strands',
      icon: FileText,
      action: () => router.push('/pkms/strands'),
      category: 'navigation',
      keywords: ['strands', 'notes', 'documents'],
      shortcut: 'G S',
    },
    {
      id: 'nav-tutorials',
      title: 'Tutorials',
      subtitle: 'Learn OpenStrand',
      icon: Book,
      action: () => router.push('/tutorials'),
      category: 'navigation',
      keywords: ['tutorials', 'learn', 'help', 'guides'],
      shortcut: 'G T',
    },
    {
      id: 'nav-profile',
      title: 'Profile',
      subtitle: 'View your profile',
      icon: Users,
      action: () => router.push('/profile'),
      category: 'navigation',
      keywords: ['profile', 'account', 'settings'],
      shortcut: 'G P',
    },

    // Actions
    {
      id: 'action-new-strand',
      title: 'Create New Strand',
      subtitle: 'Start a new knowledge strand',
      icon: Sparkles,
      action: () => {
        router.push('/pkms/strands');
        // Trigger create modal
      },
      category: 'actions',
      keywords: ['create', 'new', 'strand', 'note'],
      shortcut: 'C',
    },

    // Settings
    {
      id: 'settings-preferences',
      title: 'Preferences',
      subtitle: 'Manage your preferences',
      icon: Settings,
      action: () => router.push('/profile?tab=preferences'),
      category: 'settings',
      keywords: ['settings', 'preferences', 'options'],
    },

    // Help
    {
      id: 'help-docs',
      title: 'Documentation',
      subtitle: 'Read the docs',
      icon: HelpCircle,
      action: () => window.open('https://docs.openstrand.ai', '_blank'),
      category: 'help',
      keywords: ['help', 'docs', 'documentation'],
      shortcut: '?',
    },
  ], [router]);

  /**
   * Combine default and custom commands
   */
  const allCommands = useMemo(() => {
    return [...defaultCommands, ...customCommands];
  }, [defaultCommands, customCommands]);

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
   * Reset state when opening
   */
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 gap-0" aria-labelledby="command-palette-title">
        {/* Search Input */}
        <div className="flex items-center border-b px-4 py-3">
          <Search className="h-5 w-5 text-muted-foreground mr-3 shrink-0" />
          <Input
            placeholder="Search commands, settings, and more..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            className="border-0 shadow-none focus-visible:ring-0 text-base"
            autoFocus
            aria-label="Search commands"
          />
          <kbd className="hidden sm:flex h-6 items-center gap-1 rounded border bg-muted px-2 font-mono text-xs text-muted-foreground">
            <span>ESC</span>
          </kbd>
        </div>

        {/* Command List */}
        <div className="max-h-96 overflow-y-auto p-2" role="listbox" id="command-palette-title">
          {filteredCommands.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-muted-foreground">No results found</p>
              <p className="text-xs text-muted-foreground mt-1">
                Try different keywords
              </p>
            </div>
          ) : (
            groupedCommands.map(({ category, commands }, groupIndex) => (
              <div key={category.id} className={groupIndex > 0 ? 'mt-4' : ''}>
                {/* Category Header */}
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  {category.icon && <category.icon className="h-3 w-3" />}
                  {category.label}
                </div>

                {/* Commands in this category */}
                <div className="mt-1 space-y-1">
                  {commands.map((command, index) => {
                    const globalIndex = filteredCommands.indexOf(command);
                    const isSelected = globalIndex === selectedIndex;
                    const Icon = command.icon;

                    return (
                      <button
                        key={command.id}
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
                          {command.subtitle && (
                            <div className="text-xs text-muted-foreground truncate">
                              {command.subtitle}
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

        {/* Footer with hint */}
        <div className="border-t px-4 py-2 text-xs text-muted-foreground">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="h-4 rounded border bg-muted px-1 font-mono">↑↓</kbd>
                Navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="h-4 rounded border bg-muted px-1 font-mono">↵</kbd>
                Select
              </span>
              <span className="flex items-center gap-1">
                <kbd className="h-4 rounded border bg-muted px-1 font-mono">ESC</kbd>
                Close
              </span>
            </div>
            <span className="hidden sm:block">
              {filteredCommands.length} command{filteredCommands.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
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
   * Setup global keyboard shortcut (Cmd+K / Ctrl+K)
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
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

