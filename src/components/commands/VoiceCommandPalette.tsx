/**
 * Voice Command Palette
 * 
 * Global Command-K launcher with voice input support.
 * Keyword spotting for common commands:
 * - "create flashcard"
 * - "next card"
 * - "start pomodoro"
 * - "show settings"
 * - etc.
 * 
 * @example
 * ```tsx
 * <VoiceCommandPalette />
 * // User presses Cmd+K, speaks "create flashcard"
 * // → Navigates to flashcard creation
 * ```
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Mic, 
  MicOff, 
  Search, 
  Plus, 
  Brain, 
  ClipboardCheck, 
  Timer, 
  Settings, 
  Book,
  FileText,
  Trophy
} from 'lucide-react';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface VoiceCommand {
  id: string;
  label: string;
  keywords: string[];
  icon: React.ReactNode;
  action: () => void;
  group: string;
}

export function VoiceCommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const router = useRouter();
  const { toast } = useToast();

  const {
    transcript,
    isListening,
    isSupported,
    start: startListening,
    stop: stopListening,
    reset: resetTranscript,
  } = useSpeechRecognition({
    continuous: false,
    onFinalize: (text) => {
      setQuery(text);
      matchAndExecuteCommand(text);
    },
  });

  // Define voice commands
  const commands: VoiceCommand[] = [
    // Learning commands
    {
      id: 'create-flashcard',
      label: 'Create Flashcard',
      keywords: ['create flashcard', 'new flashcard', 'add flashcard', 'make flashcard'],
      icon: <Brain className="h-4 w-4" />,
      action: () => router.push('/flashcards/create'),
      group: 'Learning',
    },
    {
      id: 'study-flashcards',
      label: 'Study Flashcards',
      keywords: ['study', 'study flashcards', 'review cards', 'start study'],
      icon: <Brain className="h-4 w-4" />,
      action: () => router.push('/flashcards/study'),
      group: 'Learning',
    },
    {
      id: 'create-quiz',
      label: 'Create Quiz',
      keywords: ['create quiz', 'new quiz', 'make quiz'],
      icon: <ClipboardCheck className="h-4 w-4" />,
      action: () => router.push('/quizzes/create'),
      group: 'Learning',
    },
    {
      id: 'take-quiz',
      label: 'Take Quiz',
      keywords: ['take quiz', 'start quiz', 'quiz'],
      icon: <ClipboardCheck className="h-4 w-4" />,
      action: () => router.push('/quizzes'),
      group: 'Learning',
    },

    // Productivity commands
    {
      id: 'start-pomodoro',
      label: 'Start Pomodoro',
      keywords: ['start pomodoro', 'pomodoro', 'timer', 'focus'],
      icon: <Timer className="h-4 w-4" />,
      action: () => router.push('/productivity/pomodoro'),
      group: 'Productivity',
    },

    // Content commands
    {
      id: 'new-strand',
      label: 'New Strand',
      keywords: ['new strand', 'create strand', 'add strand'],
      icon: <FileText className="h-4 w-4" />,
      action: () => router.push('/strands/create'),
      group: 'Content',
    },
    {
      id: 'new-note',
      label: 'New Note',
      keywords: ['new note', 'create note', 'write note'],
      icon: <Plus className="h-4 w-4" />,
      action: () => router.push('/notes/create'),
      group: 'Content',
    },

    // Navigation commands
    {
      id: 'dashboard',
      label: 'Dashboard',
      keywords: ['dashboard', 'home', 'overview'],
      icon: <Book className="h-4 w-4" />,
      action: () => router.push('/dashboard'),
      group: 'Navigation',
    },
    {
      id: 'settings',
      label: 'Settings',
      keywords: ['settings', 'preferences', 'options'],
      icon: <Settings className="h-4 w-4" />,
      action: () => router.push('/settings'),
      group: 'Navigation',
    },
    {
      id: 'leaderboard',
      label: 'Leaderboard',
      keywords: ['leaderboard', 'rankings', 'stats'],
      icon: <Trophy className="h-4 w-4" />,
      action: () => router.push('/leaderboard'),
      group: 'Gamification',
    },
  ];

  // Keyboard shortcut: Cmd/Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const matchAndExecuteCommand = useCallback((voiceInput: string) => {
    const lowercaseInput = voiceInput.toLowerCase().trim();

    for (const command of commands) {
      for (const keyword of command.keywords) {
        if (lowercaseInput.includes(keyword)) {
          toast({
            title: `Executing: ${command.label}`,
            description: `Matched voice command: "${keyword}"`,
          });
          command.action();
          setOpen(false);
          return;
        }
      }
    }

    // No match found
    toast({
      title: 'Command not recognized',
      description: `"${voiceInput}" didn't match any commands. Try "create flashcard" or "start pomodoro"`,
      variant: 'destructive',
    });
  }, [commands, toast, router]);

  const handleCommandSelect = useCallback((commandId: string) => {
    const command = commands.find((c) => c.id === commandId);
    if (command) {
      command.action();
      setOpen(false);
    }
  }, [commands]);

  const toggleVoiceInput = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      resetTranscript();
      startListening();
      toast({
        title: 'Listening...',
        description: 'Speak your command now',
      });
    }
  }, [isListening, startListening, stopListening, resetTranscript, toast]);

  // Filter commands by query
  const filteredCommands = commands.filter((cmd) =>
    cmd.label.toLowerCase().includes(query.toLowerCase()) ||
    cmd.keywords.some((kw) => kw.toLowerCase().includes(query.toLowerCase()))
  );

  const groupedCommands = filteredCommands.reduce((acc, cmd) => {
    if (!acc[cmd.group]) {
      acc[cmd.group] = [];
    }
    acc[cmd.group].push(cmd);
    return acc;
  }, {} as Record<string, VoiceCommand[]>);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <div className="flex items-center border-b px-3">
        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
        <CommandInput
          placeholder="Type a command or use voice..."
          value={query}
          onValueChange={setQuery}
        />
        {isSupported && (
          <Button
            variant={isListening ? 'destructive' : 'ghost'}
            size="icon"
            className="ml-2"
            onClick={toggleVoiceInput}
          >
            {isListening ? (
              <MicOff className="h-4 w-4 animate-pulse" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>

      {isListening && (
        <div className="px-3 py-2 bg-primary/10 border-b">
          <Badge variant="default" className="animate-pulse">
            <Mic className="h-3 w-3 mr-1" />
            Listening... {transcript || 'Speak now'}
          </Badge>
        </div>
      )}

      <CommandList>
        <CommandEmpty>
          No commands found.
          {isSupported && (
            <div className="mt-2">
              <Button variant="outline" size="sm" onClick={toggleVoiceInput}>
                <Mic className="h-4 w-4 mr-2" />
                Try voice command
              </Button>
            </div>
          )}
        </CommandEmpty>

        {Object.entries(groupedCommands).map(([group, groupCommands]) => (
          <CommandGroup key={group} heading={group}>
            {groupCommands.map((cmd) => (
              <CommandItem
                key={cmd.id}
                value={cmd.id}
                onSelect={() => handleCommandSelect(cmd.id)}
              >
                {cmd.icon}
                <span className="ml-2">{cmd.label}</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  "{cmd.keywords[0]}"
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>

      <div className="border-t px-3 py-2 text-xs text-muted-foreground">
        <p>
          Press <kbd className="px-2 py-1 bg-muted rounded">Cmd</kbd>+
          <kbd className="px-2 py-1 bg-muted rounded">K</kbd> to toggle
          {isSupported && ' • Click mic for voice command'}
        </p>
      </div>
    </CommandDialog>
  );
}

