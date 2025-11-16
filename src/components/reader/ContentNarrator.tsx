/**
 * Content Narrator
 * 
 * Floating audio player for narrating long-form content (strands, journals, docs).
 * Supports:
 * - Play/pause/stop controls
 * - Progress bar with seek
 * - Speed controls
 * - Auto-scrolling to current position
 * - Keyboard shortcuts (Space, Arrow keys)
 */

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, StopCircle, SkipForward, SkipBack, Volume2, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export interface ContentNarratorProps {
  content: string;
  title?: string;
  voice?: string;
  onClose?: () => void;
  autoStart?: boolean;
}

export function ContentNarrator({
  content,
  title = 'Content',
  voice = 'alloy',
  onClose,
  autoStart = false,
}: ContentNarratorProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentSpeed, setCurrentSpeed] = useState(1.0);
  const [duration, setDuration] = useState(0);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (autoStart) {
      handlePlay();
    }

    // Keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case ' ':
          e.preventDefault();
          togglePlayPause();
          break;
        case 'ArrowRight':
          e.preventDefault();
          skip(10);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          skip(-10);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const handlePlay = async () => {
    if (audioRef.current && isPaused) {
      // Resume existing audio
      await audioRef.current.play();
      setIsPlaying(true);
      setIsPaused(false);
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/voice/tts/stream`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: JSON.stringify({
            text: content,
            voice,
            speed: currentSpeed,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to synthesize audio');
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      const audio = new Audio(audioUrl);
      audio.playbackRate = currentSpeed;
      audioRef.current = audio;

      audio.onloadedmetadata = () => {
        setDuration(audio.duration);
      };

      audio.ontimeupdate = () => {
        if (audio.duration) {
          setProgress((audio.currentTime / audio.duration) * 100);
        }
      };

      audio.onended = () => {
        setIsPlaying(false);
        setIsPaused(false);
        setProgress(0);
        URL.revokeObjectURL(audioUrl);
      };

      audio.onerror = () => {
        toast({
          title: 'Playback error',
          description: 'Failed to play audio',
          variant: 'destructive',
        });
        setIsPlaying(false);
        setLoading(false);
      };

      await audio.play();
      setIsPlaying(true);
      setLoading(false);
    } catch (error: any) {
      console.error('Narrator error:', error);
      toast({
        title: 'Narration failed',
        description: error.message || 'Could not generate audio',
        variant: 'destructive',
      });
      setLoading(false);
    }
  };

  const togglePlayPause = useCallback(() => {
    if (!audioRef.current) {
      handlePlay();
      return;
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      setIsPaused(true);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
      setIsPaused(false);
    }
  }, [isPlaying, handlePlay]);

  const handleStop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      setIsPaused(false);
      setProgress(0);
    }
  }, []);

  const skip = useCallback((seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(
        0,
        Math.min(audioRef.current.duration, audioRef.current.currentTime + seconds)
      );
    }
  }, []);

  const handleSpeedChange = useCallback((speed: string) => {
    const newSpeed = parseFloat(speed);
    setCurrentSpeed(newSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = newSpeed;
    }
  }, []);

  const handleSeek = useCallback((value: number[]) => {
    if (audioRef.current && duration) {
      audioRef.current.currentTime = (value[0] / 100) * duration;
    }
  }, [duration]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="fixed bottom-4 right-4 w-96 shadow-2xl border-primary/20 z-50">
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Volume2 className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium truncate">{title}</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              handleStop();
              onClose?.();
            }}
            className="h-6 w-6"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
          <Slider
            value={[progress]}
            onValueChange={handleSeek}
            min={0}
            max={100}
            step={0.1}
            className="w-full"
            disabled={!isPlaying && !isPaused}
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {audioRef.current ? formatTime(audioRef.current.currentTime) : '0:00'}
            </span>
            <span>{duration ? formatTime(duration) : '0:00'}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => skip(-10)}
            disabled={!isPlaying && !isPaused}
          >
            <SkipBack className="h-4 w-4" />
          </Button>

          <Button
            variant="default"
            size="icon"
            onClick={togglePlayPause}
            disabled={loading}
            className="h-12 w-12"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : isPlaying ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => skip(10)}
            disabled={!isPlaying && !isPaused}
          >
            <SkipForward className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleStop}
            disabled={!isPlaying && !isPaused}
          >
            <StopCircle className="h-4 w-4" />
          </Button>

          {/* Speed Control */}
          <Select value={String(currentSpeed)} onValueChange={handleSpeedChange}>
            <SelectTrigger className="w-20 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0.5">0.5×</SelectItem>
              <SelectItem value="0.75">0.75×</SelectItem>
              <SelectItem value="1.0">1×</SelectItem>
              <SelectItem value="1.25">1.25×</SelectItem>
              <SelectItem value="1.5">1.5×</SelectItem>
              <SelectItem value="1.75">1.75×</SelectItem>
              <SelectItem value="2.0">2×</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Keyboard Hints */}
        <div className="text-xs text-muted-foreground text-center">
          Space: Play/Pause • ← →: Skip ±10s
        </div>
      </CardContent>
    </Card>
  );
}

