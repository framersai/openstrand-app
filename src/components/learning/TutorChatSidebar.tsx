/**
 * AI Tutor Chat Sidebar
 * 
 * Context-aware AI assistant for study sessions.
 * Knows current flashcard/quiz/strand and can:
 * - Explain concepts
 * - Provide mnemonics
 * - Link related strands
 * - Answer follow-up questions
 * - Generate practice problems
 * 
 * @example
 * ```tsx
 * <TutorChatSidebar
 *   context={{ type: 'flashcard', id: 'card-123', content: card.front.text }}
 *   isOpen={showTutor}
 *   onClose={() => setShowTutor(false)}
 * />
 * ```
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Bot, 
  Send, 
  X, 
  Lightbulb, 
  Link as LinkIcon, 
  BookOpen, 
  Sparkles,
  Loader2,
  Volume2,
  Mic
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';

export interface TutorContext {
  type: 'flashcard' | 'quiz' | 'strand' | 'loom' | 'weave';
  id: string;
  content: string;
  metadata?: Record<string, any>;
}

export interface TutorMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestions?: string[];
}

export interface TutorChatSidebarProps {
  context: TutorContext;
  isOpen: boolean;
  onClose: () => void;
}

export function TutorChatSidebar({ context, isOpen, onClose }: TutorChatSidebarProps) {
  const [messages, setMessages] = useState<TutorMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { speak, playing } = useTextToSpeech();
  const { transcript, isListening, start: startListening, stop: stopListening, reset } = useSpeechRecognition({
    onFinalize: (text) => {
      setInput(text);
      reset();
    },
  });

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Initial greeting
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const greeting: TutorMessage = {
        id: '0',
        role: 'assistant',
        content: `Hi! I'm your AI tutor. I can help you understand this ${context.type}. Ask me anything!`,
        timestamp: new Date(),
        suggestions: [
          'Explain this concept',
          'Give me a mnemonic',
          'Show related topics',
          'Create a practice problem',
        ],
      };
      setMessages([greeting]);
    }
  }, [isOpen, context.type]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: TutorMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/tutor/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          context,
          messages: messages.concat(userMessage).map((m) => ({
            role: m.role,
            content: m.content,
          })),
          query: input,
        }),
      });

      if (!response.ok) {
        throw new Error('Tutor request failed');
      }

      const data = await response.json();

      const assistantMessage: TutorMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        suggestions: data.suggestions,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      toast({
        title: 'Tutor unavailable',
        description: error.message || 'Could not get response from AI tutor',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
  };

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        'fixed right-0 top-0 h-full w-96 bg-background border-l shadow-2xl z-50',
        'transition-transform duration-300 ease-in-out',
        isOpen ? 'translate-x-0' : 'translate-x-full'
      )}
    >
      <Card className="h-full rounded-none border-0">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              AI Tutor
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline">
              {context.type}
            </Badge>
            <p className="text-xs text-muted-foreground truncate">
              {context.content.substring(0, 50)}...
            </p>
          </div>
        </CardHeader>

        <CardContent className="p-0 flex flex-col h-[calc(100%-140px)]">
          {/* Messages */}
          <ScrollArea ref={scrollRef} className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    'flex gap-2',
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  {message.role === 'assistant' && (
                    <div className="shrink-0">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                    </div>
                  )}

                  <div
                    className={cn(
                      'max-w-[80%] rounded-lg p-3 space-y-2',
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    )}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>

                    {message.role === 'assistant' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => speak(message.content)}
                      >
                        <Volume2 className="h-3 w-3" />
                      </Button>
                    )}

                    {message.suggestions && message.suggestions.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {message.suggestions.map((sugg, idx) => (
                          <Button
                            key={idx}
                            variant="outline"
                            size="sm"
                            className="text-xs h-7"
                            onClick={() => handleSuggestionClick(sugg)}
                          >
                            {sugg}
                          </Button>
                        ))}
                      </div>
                    )}

                    <p className="text-xs opacity-70">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Loader2 className="h-4 w-4 text-primary animate-spin" />
                  </div>
                  <div className="max-w-[80%] rounded-lg p-3 bg-muted">
                    <p className="text-sm text-muted-foreground">Thinking...</p>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Quick Actions */}
          <div className="border-t p-3 flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setInput('Explain this concept')}
              disabled={loading}
            >
              <Lightbulb className="h-3 w-3 mr-1" />
              Explain
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setInput('Give me a mnemonic')}
              disabled={loading}
            >
              <Sparkles className="h-3 w-3 mr-1" />
              Mnemonic
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setInput('Show related topics')}
              disabled={loading}
            >
              <LinkIcon className="h-3 w-3 mr-1" />
              Related
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setInput('Create a practice problem')}
              disabled={loading}
            >
              <BookOpen className="h-3 w-3 mr-1" />
              Practice
            </Button>
          </div>

          {/* Input */}
          <div className="border-t p-4">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder="Ask the tutor..."
                disabled={loading}
              />
              <Button
                variant={isListening ? 'destructive' : 'ghost'}
                size="icon"
                onClick={isListening ? stopListening : startListening}
              >
                {isListening ? <Mic className="h-4 w-4 animate-pulse" /> : <Mic className="h-4 w-4" />}
              </Button>
              <Button onClick={sendMessage} disabled={loading || !input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
            {transcript && (
              <p className="text-xs text-muted-foreground mt-2">Voice: {transcript}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

