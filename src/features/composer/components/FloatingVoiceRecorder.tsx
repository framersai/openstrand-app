'use client';

/**
 * FloatingVoiceRecorder
 *
 * Inline, plan-aware audio recorder overlay for the Strand composer.
 * - Records microphone audio (Web MediaRecorder API)
 * - Previews audio before upload; uploads with metadata to strand attachments
 * - Optionally requests transcription and AI summary server-side
 * - Saves a local copy for offline use via platformStorage
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Mic, MicOff, Pause, Play, RotateCcw, Upload, CheckCircle2, AlertTriangle, Languages } from 'lucide-react';
import { toast } from 'react-hot-toast';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { platformStorage } from '@/services/platform/storage.service';

type RecorderState = 'idle' | 'recording' | 'preview' | 'uploading' | 'uploaded' | 'error';

interface FloatingVoiceRecorderProps {
  strandId?: string;
  planTier: 'free' | 'cloud' | 'pro' | 'team' | 'enterprise';
  onTranscriptReady?: (transcript: string) => void;
}

const FREE_PLAN_LIMIT_SECONDS = 120;
const CLOUD_PLAN_LIMIT_SECONDS = 300;

export function FloatingVoiceRecorder({ strandId, planTier, onTranscriptReady }: FloatingVoiceRecorderProps) {
  const [state, setState] = useState<RecorderState>('idle');
  const [attachTranscript, setAttachTranscript] = useState(true);
  const [generateSummary, setGenerateSummary] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('auto');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const transcriptPollRef = useRef<NodeJS.Timeout | null>(null);

  const limitSeconds = useMemo(() => {
    switch (planTier) {
      case 'pro':
        return null;
      case 'cloud':
      case 'team':
      case 'enterprise':
        return CLOUD_PLAN_LIMIT_SECONDS;
      case 'free':
      default:
        return FREE_PLAN_LIMIT_SECONDS;
    }
  }, [planTier]);

  useEffect(() => () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    if (transcriptPollRef.current) {
      clearInterval(transcriptPollRef.current);
      transcriptPollRef.current = null;
    }
    mediaRecorderRef.current?.stream.getTracks().forEach((track) => track.stop());
    if (audioRef.current) {
      audioRef.current.pause();
    }
  }, []);

  const stopRecordingInternal = useCallback(() => {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current?.stream.getTracks().forEach((track) => track.stop());
    mediaRecorderRef.current = null;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startRecording = useCallback(async () => {
    if (!strandId) {
      toast.error('Provide a strand ID before recording.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);
        setIsPlaying(false);
        setState('preview');
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      startTimeRef.current = Date.now();
      setElapsed(0);
      setState('recording');
      setUploadMessage(null);

      timerRef.current = setInterval(() => {
        const seconds = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setElapsed(seconds);
        if (limitSeconds && seconds >= limitSeconds) {
          stopRecordingInternal();
          toast('Recording stopped at plan limit');
        }
      }, 500);
    } catch (error) {
      setState('error');
      toast.error('Microphone access denied.');
      console.error(error);
    }
  }, [limitSeconds, strandId, stopRecordingInternal]);

  const stopRecording = useCallback(() => {
    if (state !== 'recording') return;
    stopRecordingInternal();
  }, [state, stopRecordingInternal]);

  const reset = useCallback(() => {
    setState('idle');
    setAudioBlob(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setElapsed(0);
    setIsPlaying(false);
    if (transcriptPollRef.current) {
      clearInterval(transcriptPollRef.current);
      transcriptPollRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [audioUrl]);

  const startTranscriptPolling = useCallback((attachmentId: string) => {
    if (!attachmentId) return;
    if (transcriptPollRef.current) {
      clearInterval(transcriptPollRef.current);
    }
    setUploadMessage('Transcribing…');
    transcriptPollRef.current = setInterval(async () => {
      try {
        const resp = await fetch(`/api/v1/attachments/${attachmentId}`, { credentials: 'include' });
        if (!resp.ok) return;
        const payload = await resp.json();
        const att = payload?.data;
        const status = att?.transcriptStatus as string | undefined;
        if (status === 'completed') {
          if (attachTranscript && onTranscriptReady && typeof att?.transcriptText === 'string' && att.transcriptText.trim()) {
            onTranscriptReady(att.transcriptText);
          }
          setUploadMessage('Transcript attached');
          clearInterval(transcriptPollRef.current!);
          transcriptPollRef.current = null;
        } else if (status === 'failed') {
          setUploadMessage('Transcription failed');
          clearInterval(transcriptPollRef.current!);
          transcriptPollRef.current = null;
        }
      } catch {
        // Silent retry on next tick
      }
    }, 2500);
  }, [attachTranscript, onTranscriptReady]);

  const uploadRecording = useCallback(async () => {
    if (!audioBlob || !strandId) {
      toast.error('Nothing to upload yet.');
      return;
    }

    setState('uploading');
    setUploadMessage(null);

    try {
      // Save locally for offline access
      try {
        await platformStorage.saveMedia(`voice-${Date.now()}`, audioBlob, 'audio');
      } catch {}

      const form = new FormData();
      form.append('file', audioBlob, `voice-note-${Date.now()}.webm`);
      form.append('attachTranscript', String(attachTranscript));
      form.append('generateSummary', String(generateSummary));
      if (selectedLanguage !== 'auto') {
        form.append('language', selectedLanguage);
      }
      form.append('durationSeconds', String(elapsed));

      const response = await fetch(`/api/v1/strands/${strandId}/attachments/audio`, {
        method: 'POST',
        body: form,
        credentials: 'include',
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || 'Upload failed');
      }

      const payload = await response.json();
      setState('uploaded');
      setUploadMessage('Voice note uploaded. Transcription will appear shortly.');

      const attachmentId: string | undefined = payload?.data?.id;
      if (attachTranscript && attachmentId) {
        startTranscriptPolling(attachmentId);
      }
    } catch (error) {
      console.error(error);
      setState('error');
      setUploadMessage(error instanceof Error ? error.message : 'Failed to upload');
    }
  }, [audioBlob, strandId, attachTranscript, generateSummary, selectedLanguage, elapsed, onTranscriptReady, startTranscriptPolling]);

  const togglePlayback = useCallback(() => {
    if (!audioRef.current) {
      return;
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch((error) => {
        console.error('Playback failed', error);
        toast.error('Unable to play the recording.');
      });
    }
  }, [isPlaying]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  }, [audioUrl]);

  return (
    <TooltipProvider>
      <div className="pointer-events-none absolute -top-4 right-4 z-20 flex w-[280px] flex-col gap-3">
        <AnimatePresence>
          <motion.div
            key={state}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="pointer-events-auto space-y-3 border-primary/30 bg-background/95 p-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">Voice Notes</div>
                <Badge variant={state === 'recording' ? 'default' : 'outline'} className="capitalize">
                  {state === 'recording' ? 'Recording…' : 'Ready'}
                </Badge>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-mono font-bold">{new Date(elapsed * 1000).toISOString().slice(14, 19)}</span>
                {limitSeconds ? (
                  <span className="text-xs text-muted-foreground">max {Math.floor(limitSeconds / 60)} min</span>
                ) : (
                  <span className="text-xs text-muted-foreground">unlimited</span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {state !== 'recording' ? (
                  <Button size="sm" onClick={startRecording} className="gap-1">
                    <Mic className="h-4 w-4" />
                    Record
                  </Button>
                ) : (
                  <Button size="sm" variant="destructive" onClick={stopRecording} className="gap-1">
                    <MicOff className="h-4 w-4" />
                    Stop
                  </Button>
                )}

                {state === 'preview' && (
                  <>
                    <Button size="sm" variant="outline" onClick={reset} className="gap-1">
                      <RotateCcw className="h-4 w-4" />
                      Reset
                    </Button>
                    <Button size="sm" onClick={uploadRecording} className="gap-1">
                      <Upload className="h-4 w-4" />
                      Upload
                    </Button>
                  </>
                )}

                {state === 'uploaded' && (
                  <Badge variant="default" className="gap-1 bg-emerald-600">
                    <CheckCircle2 className="h-3 w-3" />Attached
                  </Badge>
                )}

                {state === 'error' && (
                  <Badge variant="destructive" className="gap-1">
                    <AlertTriangle className="h-3 w-3" />Error
                  </Badge>
                )}
              </div>

              {audioUrl && state !== 'recording' ? (
                <div className="rounded-md border border-border/70 bg-muted/20 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex flex-col text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">Preview recording</span>
                      <span>{Math.max(elapsed, 1)}s captured</span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={togglePlayback} className="h-8 w-8">
                      {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                  </div>
                  <audio
                    ref={audioRef}
                    src={audioUrl}
                    onEnded={() => setIsPlaying(false)}
                    onPause={() => setIsPlaying(false)}
                    className="hidden"
                  />
                </div>
              ) : null}

              <div className="space-y-3 rounded-md bg-muted/40 p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Switch id="attach-transcript" checked={attachTranscript} onCheckedChange={setAttachTranscript} />
                    <Label htmlFor="attach-transcript" className="text-xs">Attach transcript</Label>
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Languages className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="text-xs">Automatically use detected language or choose one for better accuracy.</TooltipContent>
                  </Tooltip>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Switch id="generate-summary" checked={generateSummary} onCheckedChange={setGenerateSummary} />
                    <Label htmlFor="generate-summary" className="text-xs">Generate summary</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-muted-foreground">Language</Label>
                    <Select value={selectedLanguage} onValueChange={(v) => setSelectedLanguage(v)}>
                      <SelectTrigger className="h-8 w-28">
                        <SelectValue placeholder="Auto" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">Auto</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] uppercase tracking-wide text-muted-foreground">
                  <span>Language: {selectedLanguage === 'auto' ? 'Auto detect' : selectedLanguage.toUpperCase()}</span>
                  <span>Transcript: {attachTranscript ? 'Enabled' : 'Disabled'}</span>
                </div>
              </div>

              {uploadMessage ? (
                <p className={cn('text-xs', state === 'error' ? 'text-destructive' : 'text-muted-foreground')}>{uploadMessage}</p>
              ) : null}
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>
    </TooltipProvider>
  );
}
