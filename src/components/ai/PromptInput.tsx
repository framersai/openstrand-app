'use client';

import { useState, useEffect, useRef } from 'react';
import { Sparkles, Mic, MicOff, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  disabled?: boolean;
  isLoading?: boolean;
  className?: string;
}

const TYPING_SUGGESTIONS = [
  "Show me trends in...",
  "Visualize the correlation between...",
  "Create a dashboard showing...",
  "Analyze patterns in...",
  "Compare performance across...",
];

export function PromptInput({
  value,
  onChange,
  onSubmit,
  placeholder = "Describe what you want to visualize...",
  disabled = false,
  isLoading = false,
  className,
}: PromptInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [typingSuggestion, setTypingSuggestion] = useState("");
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  
  // Animated placeholder typing effect
  useEffect(() => {
    if (!value && !isLoading) {
      const timer = setTimeout(() => {
        if (charIndex < TYPING_SUGGESTIONS[suggestionIndex].length) {
          setTypingSuggestion(TYPING_SUGGESTIONS[suggestionIndex].substring(0, charIndex + 1));
          setCharIndex(charIndex + 1);
        } else {
          // Wait before moving to next suggestion
          setTimeout(() => {
            setSuggestionIndex((prev) => (prev + 1) % TYPING_SUGGESTIONS.length);
            setCharIndex(0);
            setTypingSuggestion("");
          }, 2000);
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [charIndex, suggestionIndex, value, isLoading]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value]);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  /**
   * Toggle voice recording using Web Speech API
   * Falls back to placeholder if not supported
   */
  const toggleVoiceRecording = () => {
    if (!isRecording) {
      // Start recording
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
        
        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          onChange(value + (value ? ' ' : '') + transcript);
          setIsRecording(false);
        };
        
        recognition.onerror = () => {
          setIsRecording(false);
        };
        
        recognition.onend = () => {
          setIsRecording(false);
        };
        
        recognition.start();
        setIsRecording(true);
      } else {
        // Browser doesn't support speech recognition
        alert('Voice input is not supported in your browser. Try Chrome or Edge.');
      }
    } else {
      // Stop recording - recognition will handle onend
      setIsRecording(false);
    }
  };

  return (
    <div className={cn("relative", className)}>
      <div className="glass-card rounded-xl p-1">
        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={disabled || isLoading}
            className={cn(
              "min-h-[80px] max-h-[200px] resize-none bg-transparent border-0",
              "placeholder:text-muted-foreground/60",
              "focus-visible:ring-0 focus-visible:ring-offset-0",
              "pr-24",
              isRecording && "pl-12"
            )}
          />
          
          {/* Animated typing suggestion */}
          {!value && !isLoading && (
            <div className="absolute top-3 left-3 pointer-events-none">
              <span className="text-muted-foreground/40">
                {typingSuggestion}
                <span className="animate-pulse">|</span>
              </span>
            </div>
          )}
          
          {/* Voice indicator */}
          {isRecording && (
            <div className="absolute left-3 top-3 flex items-center gap-2">
              <div className="relative">
                <div className="absolute inset-0 bg-destructive rounded-full animate-ping opacity-75" />
                <div className="relative w-2 h-2 bg-destructive rounded-full" />
              </div>
              <span className="text-xs text-destructive">Recording...</span>
            </div>
          )}
          
          {/* Action buttons */}
          <div className="absolute right-2 bottom-2 flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={toggleVoiceRecording}
              disabled={disabled || isLoading}
              className="h-8 w-8 p-0"
            >
              {isRecording ? (
                <MicOff className="h-4 w-4" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </Button>
            
            <Button
              size="sm"
              onClick={onSubmit}
              disabled={disabled || isLoading || !value.trim()}
              className={cn(
                "gap-2 btn-neon",
                isLoading && "animate-pulse"
              )}
            >
              {isLoading ? (
                <>
                  <div className="h-3 w-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
                  Processing
                </>
              ) : (
                <>
                  <Wand2 className="h-3.5 w-3.5" />
                  Generate
                </>
              )}
            </Button>
          </div>
        </div>
        
        {/* Smart suggestions */}
        <div className="flex flex-wrap gap-2 px-3 pb-2 pt-1">
          <Badge 
            variant="secondary" 
            className="cursor-pointer hover:bg-secondary/80 transition-colors text-xs"
            onClick={() => onChange("Show me trends in revenue over time")}
          >
            <Sparkles className="mr-1 h-3 w-3" />
            Revenue trends
          </Badge>
          <Badge 
            variant="secondary" 
            className="cursor-pointer hover:bg-secondary/80 transition-colors text-xs"
            onClick={() => onChange("Create a heatmap of user activity")}
          >
            <Sparkles className="mr-1 h-3 w-3" />
            Activity heatmap
          </Badge>
          <Badge 
            variant="secondary" 
            className="cursor-pointer hover:bg-secondary/80 transition-colors text-xs"
            onClick={() => onChange("Analyze customer segments by demographics")}
          >
            <Sparkles className="mr-1 h-3 w-3" />
            Segment analysis
          </Badge>
        </div>
      </div>
      
      {/* Floating particles effect */}
      <div className="absolute -inset-2 -z-10 opacity-30">
        <div className="absolute top-0 left-1/4 w-2 h-2 bg-primary rounded-full animate-float" />
        <div className="absolute bottom-0 right-1/3 w-3 h-3 bg-secondary rounded-full animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 right-1/4 w-2 h-2 bg-accent rounded-full animate-float" style={{ animationDelay: '4s' }} />
      </div>
    </div>
  );
}
