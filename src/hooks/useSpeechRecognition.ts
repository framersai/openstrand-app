/**
 * useSpeechRecognition Hook
 * 
 * React hook for speech-to-text using Web Speech API (browser) or server fallback.
 * Provides real-time transcription with interim results.
 * 
 * @example
 * ```tsx
 * function QuizAnswer() {
 *   const { isListening, transcript, start, stop } = useSpeechRecognition({
 *     onFinalize: (text) => submitAnswer(text)
 *   });
 *   
 *   return (
 *     <button onClick={isListening ? stop : start}>
 *       {isListening ? '🔴 Stop' : '🎤 Start'}
 *     </button>
 *   );
 * }
 * ```
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from './use-toast';

export interface UseSpeechRecognitionOptions {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  onFinalize?: (text: string) => void;
  onInterim?: (text: string) => void;
  onError?: (error: string) => void;
  useServerFallback?: boolean;
}

export interface SpeechRecognitionResult {
  transcript: string;
  interimTranscript: string;
  isListening: boolean;
  isSupported: boolean;
  start: () => void;
  stop: () => void;
  reset: () => void;
}

export function useSpeechRecognition(
  options: UseSpeechRecognitionOptions = {}
): SpeechRecognitionResult {
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  const recognitionRef = useRef<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Check browser support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition);

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = options.language || 'en-US';
      recognition.continuous = options.continuous ?? false;
      recognition.interimResults = options.interimResults ?? true;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let finalText = '';
        let interimText = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const text = event.results[i][0].transcript;

          if (event.results[i].isFinal) {
            finalText += text + ' ';
          } else {
            interimText += text;
          }
        }

        if (finalText) {
          setTranscript((prev) => prev + finalText);
        }

        if (interimText) {
          setInterimTranscript(interimText);
          if (options.onInterim) {
            options.onInterim(interimText);
          }
        }
      };

      recognition.onerror = (event: any) => {
        const errorMsg = `Speech recognition error: ${event.error}`;
        console.error(errorMsg);

        if (options.onError) {
          options.onError(errorMsg);
        }

        toast({
          title: 'Speech recognition error',
          description: errorMsg,
          variant: 'destructive',
        });

        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        setInterimTranscript('');

        if (options.onFinalize && transcript) {
          options.onFinalize(transcript);
        }
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [options.language, options.continuous, options.interimResults]);

  const start = useCallback(() => {
    if (!isSupported) {
      toast({
        title: 'Not supported',
        description: 'Speech recognition is not supported in this browser.',
        variant: 'destructive',
      });
      return;
    }

    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
      } catch (error: any) {
        if (!error.message.includes('already started')) {
          console.error('Failed to start recognition:', error);
        }
      }
    }
  }, [isSupported, isListening, toast]);

  const stop = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  }, [isListening]);

  const reset = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
  }, []);

  return {
    transcript,
    interimTranscript,
    isListening,
    isSupported,
    start,
    stop,
    reset,
  };
}

