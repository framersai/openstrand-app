/**
 * useTextToSpeech Hook
 * 
 * React hook for text-to-speech synthesis.
 * Streams audio from server and manages playback state.
 * 
 * @example
 * ```tsx
 * function FlashcardReader() {
 *   const { speak, playing, stop } = useTextToSpeech();
 *   
 *   return (
 *     <button onClick={() => speak(flashcard.front.text)}>
 *       {playing ? '⏸️ Pause' : '▶️ Read Aloud'}
 *     </button>
 *   );
 * }
 * ```
 */

import { useState, useCallback, useRef } from 'react';
import { useToast } from './use-toast';

export interface UseTextToSpeechOptions {
  voice?: string;
  speed?: number;
  language?: string;
  autoplay?: boolean;
  onEnd?: () => void;
  onError?: (error: string) => void;
}

export interface TextToSpeechResult {
  speak: (text: string, options?: UseTextToSpeechOptions) => Promise<void>;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  playing: boolean;
  loading: boolean;
  progress: number;
}

export function useTextToSpeech(
  defaultOptions: UseTextToSpeechOptions = {}
): TextToSpeechResult {
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  const speak = useCallback(async (text: string, options: UseTextToSpeechOptions = {}) => {
    if (!text) {
      toast({
        title: 'No text provided',
        description: 'Please provide text to speak',
        variant: 'destructive',
      });
      return;
    }

    const mergedOptions = { ...defaultOptions, ...options };

    try {
      setLoading(true);

      // Get token from localStorage or context
      const token = localStorage.getItem('authToken');

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/voice/tts/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({
          text,
          voice: mergedOptions.voice,
          speed: mergedOptions.speed || 1.0,
          language: mergedOptions.language,
        }),
      });

      if (!response.ok) {
        throw new Error('TTS request failed');
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      // Create and play audio
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onplay = () => {
        setPlaying(true);
        setLoading(false);
      };

      audio.ontimeupdate = () => {
        if (audio.duration) {
          setProgress((audio.currentTime / audio.duration) * 100);
        }
      };

      audio.onended = () => {
        setPlaying(false);
        setProgress(0);
        URL.revokeObjectURL(audioUrl);

        if (mergedOptions.onEnd) {
          mergedOptions.onEnd();
        }
      };

      audio.onerror = (error) => {
        const errorMsg = 'Audio playback error';
        console.error(errorMsg, error);
        setPlaying(false);
        setLoading(false);

        if (mergedOptions.onError) {
          mergedOptions.onError(errorMsg);
        }

        toast({
          title: 'Playback error',
          description: errorMsg,
          variant: 'destructive',
        });
      };

      if (mergedOptions.autoplay !== false) {
        await audio.play();
      }
    } catch (error: any) {
      setLoading(false);
      setPlaying(false);

      const errorMsg = error.message || 'Failed to synthesize speech';
      console.error('TTS error:', errorMsg);

      if (options.onError) {
        options.onError(errorMsg);
      }

      toast({
        title: 'Speech synthesis failed',
        description: errorMsg,
        variant: 'destructive',
      });
    }
  }, [defaultOptions, toast]);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setPlaying(false);
      setProgress(0);
    }
  }, []);

  const pause = useCallback(() => {
    if (audioRef.current && playing) {
      audioRef.current.pause();
      setPlaying(false);
    }
  }, [playing]);

  const resume = useCallback(() => {
    if (audioRef.current && !playing) {
      audioRef.current.play();
      setPlaying(true);
    }
  }, [playing]);

  return {
    speak,
    stop,
    pause,
    resume,
    playing,
    loading,
    progress,
  };
}

