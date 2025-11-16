/**
 * Quick Voice Capture
 * 
 * Mobile-optimized hold-to-talk capture button.
 * Creates strands titled with first sentence of transcript.
 * 
 * Features:
 * - Hold-to-record (long-press)
 * - Visual feedback (pulsing, waveform animation)
 * - Auto-title from first sentence
 * - Optional strand creation
 * - Haptic feedback (on mobile)
 */

'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Mic, MicOff, Check, Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useToast } from '@/hooks/use-toast';

export interface QuickVoiceCaptureProps {
  onCapture?: (transcript: string) => void;
  onSaveStrand?: (title: string, content: string) => Promise<void>;
  autoCreateStrand?: boolean;
  className?: string;
}

export function QuickVoiceCapture({
  onCapture,
  onSaveStrand,
  autoCreateStrand = true,
  className,
}: QuickVoiceCaptureProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [savedTranscript, setSavedTranscript] = useState('');
  const [saving, setSaving] = useState(false);
  const [holding, setHolding] = useState(false);

  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const {
    transcript,
    interimTranscript,
    isListening,
    isSupported,
    start: startListening,
    stop: stopListening,
    reset: resetTranscript,
  } = useSpeechRecognition({
    continuous: true,
    interimResults: true,
    language: 'en-US',
    onFinalize: async (text) => {
      setSavedTranscript(text);
      onCapture?.(text);

      if (autoCreateStrand && onSaveStrand) {
        await createStrandFromTranscript(text);
      }
    },
    onError: (error) => {
      toast({
        title: 'Recording failed',
        description: error,
        variant: 'destructive',
      });
    },
  });

  useEffect(() => {
    setIsRecording(isListening);
  }, [isListening]);

  const createStrandFromTranscript = async (text: string) => {
    if (!text || !onSaveStrand) return;

    try {
      setSaving(true);

      // Extract first sentence as title
      const firstSentence = text.split(/[.!?]/)[0].trim();
      const title = firstSentence.length > 60 
        ? firstSentence.substring(0, 57) + '...'
        : firstSentence;

      await onSaveStrand(title, text);

      toast({
        title: 'Voice note saved',
        description: `Created strand: "${title}"`,
      });

      resetTranscript();
      setSavedTranscript('');
    } catch (error: any) {
      toast({
        title: 'Save failed',
        description: error.message || 'Could not save voice note',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleMouseDown = useCallback(() => {
    if (!isSupported) {
      toast({
        title: 'Not supported',
        description: 'Voice capture is not available in this browser',
        variant: 'destructive',
      });
      return;
    }

    setHolding(true);

    // Haptic feedback (mobile)
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }

    // Start after 300ms hold (prevents accidental triggers)
    holdTimerRef.current = setTimeout(() => {
      resetTranscript();
      startListening();
      toast({
        title: 'Recording...',
        description: 'Release to stop',
      });

      // Long vibration on start
      if ('vibrate' in navigator) {
        navigator.vibrate(200);
      }
    }, 300);
  }, [isSupported, resetTranscript, startListening, toast]);

  const handleMouseUp = useCallback(() => {
    setHolding(false);

    // Cancel short press
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }

    // Stop recording
    if (isListening) {
      stopListening();

      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(100);
      }
    }
  }, [isListening, stopListening]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    handleMouseDown();
  }, [handleMouseDown]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    handleMouseUp();
  }, [handleMouseUp]);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Hold-to-Talk Button */}
      <div className="flex justify-center">
        <Button
          variant={isRecording ? 'destructive' : 'default'}
          size="lg"
          className={cn(
            'h-24 w-24 rounded-full shadow-lg transition-all duration-200',
            holding && 'scale-95',
            isRecording && 'animate-pulse shadow-destructive/50',
            !isSupported && 'opacity-50 cursor-not-allowed'
          )}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          disabled={!isSupported || saving}
        >
          {saving ? (
            <Loader2 className="h-10 w-10 animate-spin" />
          ) : isRecording ? (
            <MicOff className="h-10 w-10" />
          ) : (
            <Mic className="h-10 w-10" />
          )}
        </Button>
      </div>

      <div className="text-center space-y-1">
        <p className="text-sm font-medium">
          {isRecording ? 'Recording... (release to stop)' : 'Hold to record voice note'}
        </p>
        {!isSupported && (
          <p className="text-xs text-destructive">Voice capture not supported in this browser</p>
        )}
      </div>

      {/* Interim Transcript */}
      {isRecording && (transcript || interimTranscript) && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-2">
              <Mic className="h-4 w-4 text-primary mt-1 shrink-0 animate-pulse" />
              <div className="flex-1">
                <p className="text-sm text-foreground">
                  {transcript}
                  {interimTranscript && (
                    <span className="text-muted-foreground italic"> {interimTranscript}</span>
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Saved Transcript */}
      {savedTranscript && !isRecording && (
        <Card className="border-green-500/50 bg-green-50 dark:bg-green-950">
          <CardContent className="p-4">
            <div className="flex items-start gap-2">
              <Check className="h-4 w-4 text-green-600 mt-1 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-600">Captured:</p>
                <p className="text-sm text-foreground mt-1">{savedTranscript}</p>
              </div>
              {!autoCreateStrand && onSaveStrand && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => createStrandFromTranscript(savedTranscript)}
                  disabled={saving}
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

