'use client';

/**
 * @module PomodoroWidget
 * @description Sleek, minimal Pomodoro timer widget with overlay modal
 * 
 * Features:
 * - Circular progress indicator
 * - Multiple presets (Classic 25min, Short 15min, Long 50min, Custom)
 * - Sound effects with mute toggle
 * - Pause/resume/cancel
 * - Session context (label, strand, category)
 * - Tracks productivity automatically
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Clock,
  Play,
  Pause,
  X,
  Check,
  Settings,
  Volume2,
  VolumeX,
  Tag,
  FileText,
  Hourglass,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

// Preset configurations
const PRESETS = {
  classic: { name: 'Classic', duration: 1500, break: 300, color: 'text-blue-500' }, // 25min
  short: { name: 'Short', duration: 900, break: 180, color: 'text-green-500' }, // 15min
  long: { name: 'Long', duration: 3000, break: 600, color: 'text-purple-500' }, // 50min
  custom: { name: 'Custom', duration: 1500, break: 300, color: 'text-orange-500' },
};

type PresetType = keyof typeof PRESETS;

interface PomodoroSession {
  id: string;
  startedAt: Date;
  durationSec: number;
  status: 'active' | 'paused';
  actualTimeMs: number;
  label?: string;
}

interface PomodoroWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  strandId?: string; // Auto-context when opened from strand
}

export function PomodoroWidget({ isOpen, onClose, strandId }: PomodoroWidgetProps) {
  const [preset, setPreset] = useState<PresetType>('classic');
  const [customMinutes, setCustomMinutes] = useState(25);
  const [label, setLabel] = useState('');
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [volume, setVolume] = useState(0.5);
  const [showSettings, setShowSettings] = useState(false);
  const [viewMode, setViewMode] = useState<'radial' | 'hourglass'>('radial');
  
  // Session state
  const [session, setSession] = useState<PomodoroSession | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize audio context
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return () => {
      audioContextRef.current?.close();
    };
  }, []);

  // Timer countdown
  useEffect(() => {
    if (!isRunning || !session) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) {
          completeSession();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, session]);

  // Load active session on mount
  useEffect(() => {
    if (isOpen) {
      loadActiveSession();
    }
  }, [isOpen]);

  const loadActiveSession = async () => {
    try {
      const response = await fetch('/api/v1/pomodoro/active', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.data) {
          const activeSession = data.data;
          setSession(activeSession);
          
          // Calculate time left
          const elapsed = Math.floor(activeSession.actualTimeMs / 1000);
          const remaining = activeSession.durationSec - elapsed;
          setTimeLeft(Math.max(0, remaining));
          setIsRunning(activeSession.status === 'active');
          setLabel(activeSession.label || '');
        }
      }
    } catch (error) {
      console.error('Failed to load active session:', error);
    }
  };

  const startSession = async () => {
    const duration = preset === 'custom' ? customMinutes * 60 : PRESETS[preset].duration;

    try {
      const response = await fetch('/api/v1/pomodoro/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          preset: preset === 'custom' ? 'custom' : preset,
          durationSec: duration,
          label,
          strandId,
          soundEnabled: isSoundEnabled,
          volume,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSession(data.data);
        setTimeLeft(duration);
        setIsRunning(true);
        playSound('start');
      }
    } catch (error) {
      console.error('Failed to start session:', error);
    }
  };

  const pauseSession = async () => {
    if (!session) return;

    try {
      await fetch(`/api/v1/pomodoro/${session.id}/pause`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      setIsRunning(false);
      playSound('pause');
    } catch (error) {
      console.error('Failed to pause session:', error);
    }
  };

  const resumeSession = async () => {
    if (!session) return;

    try {
      await fetch(`/api/v1/pomodoro/${session.id}/resume`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      setIsRunning(true);
      playSound('resume');
    } catch (error) {
      console.error('Failed to resume session:', error);
    }
  };

  const completeSession = async () => {
    if (!session) return;

    try {
      await fetch(`/api/v1/pomodoro/${session.id}/complete`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      playSound('complete');
      setSession(null);
      setIsRunning(false);
      setTimeLeft(0);
    } catch (error) {
      console.error('Failed to complete session:', error);
    }
  };

  const cancelSession = async () => {
    if (!session) return;

    try {
      await fetch(`/api/v1/pomodoro/${session.id}/cancel`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      setSession(null);
      setIsRunning(false);
      setTimeLeft(0);
    } catch (error) {
      console.error('Failed to cancel session:', error);
    }
  };

  // Simple Web Audio API sound synthesis
  const playSound = (type: 'start' | 'pause' | 'resume' | 'complete') => {
    if (!isSoundEnabled || !audioContextRef.current) return;

    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    gainNode.gain.value = volume;

    // Different frequencies for different sounds
    const frequencies = {
      start: [440, 550], // A-C#
      pause: [440], // A
      resume: [550], // C#
      complete: [440, 550, 660], // A-C#-E (chord)
    };

    const freq = frequencies[type];
    oscillator.frequency.value = freq[0];

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.1);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgress = (): number => {
    if (!session) return 0;
    return ((session.durationSec - timeLeft) / session.durationSec) * 100;
  };

  const currentPreset = PRESETS[preset];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className={cn('h-5 w-5', currentPreset.color)} />
              <span>Pomodoro Timer</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setViewMode((prev) => (prev === 'radial' ? 'hourglass' : 'radial'))
                }
                className="h-8 w-8 p-0"
                title={viewMode === 'radial' ? 'Switch to hourglass view' : 'Switch to radial view'}
              >
                {viewMode === 'radial' ? (
                  <Hourglass className="h-4 w-4" />
                ) : (
                  <Clock className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
                className="h-8 w-8 p-0"
              >
                <Settings className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsSoundEnabled(!isSoundEnabled)}
                className="h-8 w-8 p-0"
              >
                {isSoundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Settings Panel */}
        {showSettings && !session && (
          <div className="px-6 pb-4 space-y-4 border-b border-border">
            {/* Preset Selection */}
            <div className="space-y-2">
              <Label>Preset</Label>
              <div className="grid grid-cols-4 gap-2">
                {(Object.keys(PRESETS) as PresetType[]).map((p) => (
                  <Button
                    key={p}
                    variant={preset === p ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPreset(p)}
                    className="capitalize"
                  >
                    {PRESETS[p].name}
                  </Button>
                ))}
              </div>
            </div>

            {/* Custom Duration */}
            {preset === 'custom' && (
              <div className="space-y-2">
                <Label>Duration (minutes)</Label>
                <Input
                  type="number"
                  min={1}
                  max={120}
                  value={customMinutes}
                  onChange={(e) => setCustomMinutes(parseInt(e.target.value) || 25)}
                  className="w-full"
                />
              </div>
            )}

            {/* Volume Control */}
            <div className="space-y-2">
              <Label>Volume</Label>
              <Slider
                value={[volume]}
                onValueChange={([v]) => setVolume(v)}
                max={1}
                step={0.1}
                className="w-full"
              />
            </div>

            {/* Label */}
            <div className="space-y-2">
              <Label>Label (optional)</Label>
              <div className="flex gap-2">
                <Tag className="h-4 w-4 text-muted-foreground mt-3" />
                <Input
                  placeholder="What are you working on?"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        )}

        {/* Timer Display */}
        <div className="p-8 flex flex-col items-center justify-center space-y-6">
          {/* Timer Visualization */}
          {viewMode === 'radial' ? (
            <div className="relative w-64 h-64">
              <svg className="w-full h-full -rotate-90">
                <defs>
                  <linearGradient id="pomodoroGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#38bdf8" />
                    <stop offset="50%" stopColor="#a855f7" />
                    <stop offset="100%" stopColor="#f97316" />
                  </linearGradient>
                </defs>
                {/* Background circle */}
                <circle
                  cx="128"
                  cy="128"
                  r="112"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-muted/20"
                />
                {/* Progress circle with neon-like glow */}
                <circle
                  cx="128"
                  cy="128"
                  r="112"
                  stroke="url(#pomodoroGradient)"
                  strokeWidth="10"
                  fill="none"
                  strokeLinecap="round"
                  style={{
                    strokeDasharray: `${2 * Math.PI * 112}`,
                    strokeDashoffset: `${2 * Math.PI * 112 * (1 - getProgress() / 100)}`,
                    transition: 'stroke-dashoffset 0.4s ease-out',
                    filter: 'drop-shadow(0 0 12px rgba(56,189,248,0.6))',
                  }}
                />
              </svg>

              {/* Time Display */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div
                  className={cn(
                    'text-5xl font-bold tabular-nums tracking-tight',
                    currentPreset.color,
                  )}
                >
                  {session
                    ? formatTime(timeLeft)
                    : formatTime(
                        preset === 'custom' ? customMinutes * 60 : currentPreset.duration,
                      )}
                </div>
                {label && session && (
                  <div className="text-sm text-muted-foreground mt-3 max-w-[200px] text-center line-clamp-2">
                    {label}
                  </div>
                )}
              </div>
            </div>
          ) : (
            // Hourglass / sand timer view
            <div className="flex flex-col items-center gap-4">
              <div className="relative w-24 h-40 flex items-center justify-center">
                <div className="relative w-20 h-36 flex items-center justify-center">
                  {/* Glass outline */}
                  <svg viewBox="0 0 64 128" className="w-full h-full">
                    <defs>
                      <linearGradient id="glassGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#1e293b" />
                        <stop offset="100%" stopColor="#020617" />
                      </linearGradient>
                      <linearGradient id="sandGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#f59e0b" />
                        <stop offset="100%" stopColor="#f97316" />
                      </linearGradient>
                    </defs>
                    {/* Glass body */}
                    <path
                      d="M16 8 H48 C52 8 56 12 56 16 V20 C56 26 52 30 48 34 L38 42 C35 44 33 47 33 50 V78 C33 81 35 84 38 86 L48 94 C52 98 56 102 56 108 V112 C56 116 52 120 48 120 H16 C12 120 8 116 8 112 V108 C8 102 12 98 16 94 L26 86 C29 84 31 81 31 78 V50 C31 47 29 44 26 42 L16 34 C12 30 8 26 8 20 V16 C8 12 12 8 16 8 Z"
                      fill="url(#glassGradient)"
                      stroke="rgba(148,163,184,0.5)"
                      strokeWidth="2"
                    />
                    {/* Sand top and bottom */}
                    {(() => {
                      const progress = getProgress();
                      const topHeight = Math.max(0, 100 - progress);
                      const bottomHeight = Math.min(100, progress);
                      return (
                        <>
                          {/* Top sand */}
                          <rect
                            x="20"
                            y={18 + (100 - topHeight) * 0.16}
                            width="24"
                            height={topHeight * 0.16}
                            fill="url(#sandGradient)"
                            rx="4"
                            opacity={topHeight > 1 ? 0.9 : 0}
                          />
                          {/* Falling sand */}
                          {progress < 100 && (
                            <rect
                              x="30"
                              y="56"
                              width="4"
                              height="16"
                              fill="url(#sandGradient)"
                              opacity="0.9"
                            />
                          )}
                          {/* Bottom sand */}
                          <rect
                            x="20"
                            y={88 - bottomHeight * 0.16}
                            width="24"
                            height={bottomHeight * 0.16}
                            fill="url(#sandGradient)"
                            rx="4"
                            opacity={bottomHeight > 0 ? 0.95 : 0}
                          />
                        </>
                      );
                    })()}
                  </svg>
                </div>
              </div>

              {/* Time + label under hourglass */}
              <div className="flex flex-col items-center gap-1">
                <div
                  className={cn(
                    'text-4xl font-semibold tabular-nums tracking-tight',
                    currentPreset.color,
                  )}
                >
                  {session
                    ? formatTime(timeLeft)
                    : formatTime(
                        preset === 'custom' ? customMinutes * 60 : currentPreset.duration,
                      )}
                </div>
                {label && session && (
                  <div className="text-xs text-muted-foreground max-w-[220px] text-center line-clamp-2">
                    {label}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center gap-3">
            {!session ? (
              <Button
                size="lg"
                onClick={startSession}
                className="px-8"
              >
                <Play className="h-5 w-5 mr-2" />
                Start
              </Button>
            ) : (
              <>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={cancelSession}
                >
                  <X className="h-5 w-5" />
                </Button>

                {isRunning ? (
                  <Button
                    size="lg"
                    onClick={pauseSession}
                    className="px-8"
                  >
                    <Pause className="h-5 w-5 mr-2" />
                    Pause
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    onClick={resumeSession}
                    className="px-8"
                  >
                    <Play className="h-5 w-5 mr-2" />
                    Resume
                  </Button>
                )}

                <Button
                  size="lg"
                  variant="outline"
                  onClick={completeSession}
                >
                  <Check className="h-5 w-5" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Footer Info */}
        {!showSettings && !session && (
          <div className="px-6 pb-6 text-center text-sm text-muted-foreground">
            {currentPreset.name} session: {Math.floor((preset === 'custom' ? customMinutes * 60 : currentPreset.duration) / 60)} minutes
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

