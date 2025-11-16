/**
 * Dictation Editor
 * 
 * Rich text / markdown editor with voice dictation support.
 * Keyboard shortcut: Cmd/Ctrl+Shift+M to toggle dictation.
 * 
 * @example
 * ```tsx
 * <DictationEditor
 *   value={content}
 *   onChange={setContent}
 *   placeholder="Start typing or use voice dictation..."
 * />
 * ```
 */

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Loader2, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { useToast } from '@/hooks/use-toast';

export interface DictationEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
  language?: string;
  showTTS?: boolean;
  disabled?: boolean;
}

export function DictationEditor({
  value,
  onChange,
  placeholder = 'Start typing or press Cmd+Shift+M for dictation...',
  className,
  minHeight = '200px',
  language = 'en-US',
  showTTS = true,
  disabled = false,
}: DictationEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [cursorPosition, setCursorPosition] = useState(0);
  const { toast } = useToast();
  
  const { speak, playing, stop: stopSpeaking } = useTextToSpeech();
  const {
    transcript,
    interimTranscript,
    isListening,
    isSupported,
    start: startListening,
    stop: stopListening,
    reset: resetTranscript,
  } = useSpeechRecognition({
    language,
    continuous: true,
    interimResults: true,
    onInterim: (text) => {
      // Insert interim text at cursor position
      insertTextAtCursor(text, true);
    },
    onFinalize: (text) => {
      // Finalize transcription
      insertTextAtCursor(text, false);
      resetTranscript();
    },
    onError: (error) => {
      toast({
        title: 'Dictation error',
        description: error,
        variant: 'destructive',
      });
    },
  });

  // Keyboard shortcut: Cmd/Ctrl+Shift+M
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'M') {
        e.preventDefault();
        toggleDictation();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isListening]);

  // Track cursor position
  const handleSelectionChange = useCallback(() => {
    if (textareaRef.current) {
      setCursorPosition(textareaRef.current.selectionStart);
    }
  }, []);

  const insertTextAtCursor = useCallback((text: string, interim: boolean) => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = value.substring(0, start);
    const after = value.substring(end);

    const newText = before + text + (interim ? '' : ' ') + after;
    onChange(newText);

    // Move cursor after inserted text
    setTimeout(() => {
      const newCursor = start + text.length + (interim ? 0 : 1);
      textarea.setSelectionRange(newCursor, newCursor);
      textarea.focus();
      setCursorPosition(newCursor);
    }, 10);
  }, [value, onChange]);

  const toggleDictation = useCallback(() => {
    if (!isSupported) {
      toast({
        title: 'Not supported',
        description: 'Voice dictation is not available in this browser. Try Chrome or Edge.',
        variant: 'destructive',
      });
      return;
    }

    if (isListening) {
      stopListening();
    } else {
      resetTranscript();
      startListening();
      toast({
        title: 'Dictation started',
        description: 'Speak now. Press Cmd+Shift+M again to stop.',
      });
    }
  }, [isListening, isSupported, startListening, stopListening, resetTranscript, toast]);

  const readContent = useCallback(() => {
    if (playing) {
      stopSpeaking();
    } else {
      if (!value) {
        toast({
          title: 'No content',
          description: 'Nothing to read',
        });
        return;
      }
      speak(value);
    }
  }, [value, playing, speak, stopSpeaking, toast]);

  return (
    <div className={cn('relative', className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-2 pb-2 border-b">
        <div className="flex items-center gap-2">
          {isListening && (
            <Badge variant="destructive" className="animate-pulse">
              <Mic className="h-3 w-3 mr-1" />
              Listening...
            </Badge>
          )}
          {interimTranscript && (
            <Badge variant="secondary">
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              Transcribing...
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {isSupported ? 'Cmd+Shift+M for dictation' : 'Dictation unavailable'}
          </span>

          {showTTS && (
            <Button
              variant="ghost"
              size="icon"
              onClick={readContent}
              disabled={disabled || !value}
              title="Read content aloud"
            >
              {playing ? <Volume2 className="h-4 w-4 animate-pulse" /> : <Volume2 className="h-4 w-4" />}
            </Button>
          )}

          <Button
            variant={isListening ? 'destructive' : 'default'}
            size="icon"
            onClick={toggleDictation}
            disabled={disabled || !isSupported}
            title="Toggle voice dictation (Cmd+Shift+M)"
          >
            {isListening ? (
              <MicOff className="h-4 w-4 animate-pulse" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Editor */}
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onSelect={handleSelectionChange}
        onClick={handleSelectionChange}
        onKeyUp={handleSelectionChange}
        placeholder={placeholder}
        disabled={disabled}
        className={cn('resize-none font-mono', className)}
        style={{ minHeight }}
      />

      {/* Voice Transcript Preview */}
      {isListening && interimTranscript && (
        <div className="absolute bottom-4 left-4 right-4 p-3 bg-primary/10 border border-primary/30 rounded-md">
          <p className="text-sm text-primary font-medium">Interim transcript:</p>
          <p className="text-sm text-muted-foreground">{interimTranscript}</p>
        </div>
      )}
    </div>
  );
}

