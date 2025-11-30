/**
 * QAOraclePage Component
 *
 * Full-page Q&A Oracle interface with chat-like experience.
 * Features conversation history, streaming, and comprehensive results.
 *
 * @module components/oracle
 * @author OpenStrand <team@frame.dev>
 * @since 2.0.0
 */

'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Search,
  Sparkles,
  MessageSquare,
  BookOpen,
  ChevronRight,
  Loader2,
  AlertCircle,
  Lightbulb,
  ExternalLink,
  Copy,
  Check,
  Volume2,
  VolumeX,
  Settings2,
  Trash2,
  RefreshCw,
  Database,
  Cpu,
  Wifi,
  WifiOff,
  User,
  Bot,
  History,
  CornerDownLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useOracle } from '@/hooks/use-oracle';
import type { Citation, SocraticQuestion, OracleQueryResponse } from '@/types/oracle';

// ============================================================================
// Types
// ============================================================================

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  socraticQuestions?: SocraticQuestion[];
  metadata?: OracleQueryResponse['metadata'];
  timestamp: Date;
  isStreaming?: boolean;
}

export interface QAOraclePageProps {
  /** Callback when a strand is clicked */
  onStrandClick?: (strandId: string) => void;
  /** Additional class names */
  className?: string;
}

// ============================================================================
// Suggested Questions
// ============================================================================

const STARTER_QUESTIONS = [
  { question: 'What are the main topics in my knowledge base?', icon: Database },
  { question: 'What connections exist between my strands?', icon: Sparkles },
  { question: 'What should I learn next?', icon: Lightbulb },
  { question: 'Summarize recent additions', icon: History },
];

// ============================================================================
// Component
// ============================================================================

export function QAOraclePage({
  onStrandClick,
  className,
}: QAOraclePageProps) {
  // State
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [settings, setSettings] = useState({
    mode: 'hybrid' as 'extractive' | 'generative' | 'hybrid',
    includeCitations: true,
    includeSocratic: true,
    streaming: true,
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Oracle hook
  const oracle = useOracle({
    streaming: settings.streaming,
    includeSocratic: settings.includeSocratic,
    answerMode: settings.mode,
  });

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, oracle.answer, scrollToBottom]);

  // Handle submit
  const handleSubmit = useCallback(
    async (questionText?: string) => {
      const text = questionText || input.trim();
      if (!text || oracle.isQuerying) return;

      const userMessage: Message = {
        id: `msg_${Date.now()}_user`,
        type: 'user',
        content: text,
        timestamp: new Date(),
      };

      const assistantMessage: Message = {
        id: `msg_${Date.now()}_assistant`,
        type: 'assistant',
        content: '',
        timestamp: new Date(),
        isStreaming: true,
      };

      setMessages((prev) => [...prev, userMessage, assistantMessage]);
      setInput('');

      if (settings.streaming) {
        await oracle.queryStream(text, undefined, {
          onText: (chunk) => {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMessage.id
                  ? { ...msg, content: msg.content + chunk }
                  : msg
              )
            );
          },
          onCitation: (citation) => {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMessage.id
                  ? {
                      ...msg,
                      citations: [...(msg.citations || []), citation],
                    }
                  : msg
              )
            );
          },
          onSocratic: (sq) => {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMessage.id
                  ? {
                      ...msg,
                      socraticQuestions: [...(msg.socraticQuestions || []), sq],
                    }
                  : msg
              )
            );
          },
          onDone: (response) => {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMessage.id
                  ? {
                      ...msg,
                      isStreaming: false,
                      metadata: response.metadata,
                    }
                  : msg
              )
            );
          },
        });
      } else {
        const response = await oracle.query(text);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessage.id
              ? {
                  ...msg,
                  content: response.answer,
                  citations: response.citations,
                  socraticQuestions: response.socraticQuestions,
                  metadata: response.metadata,
                  isStreaming: false,
                }
              : msg
          )
        );
      }
    },
    [input, oracle, settings.streaming]
  );

  // Handle key press
  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  // Clear conversation
  const clearConversation = useCallback(() => {
    setMessages([]);
    oracle.clear();
  }, [oracle]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        200
      )}px`;
    }
  }, [input]);

  return (
    <div
      className={cn(
        'flex flex-col h-full bg-background',
        className
      )}
    >
      {/* Header */}
      <header className="flex-shrink-0 border-b border-border/50 px-4 py-3">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="font-semibold text-lg">Oracle</h1>
              <p className="text-xs text-muted-foreground flex items-center gap-2">
                {oracle.isReady ? (
                  <>
                    <span className="inline-flex items-center gap-1">
                      <Wifi className="h-3 w-3 text-green-500" />
                      {oracle.isBackendAvailable() ? 'Connected' : 'Offline'}
                    </span>
                    <span>•</span>
                    <span>{oracle.state.embeddingCount} documents</span>
                  </>
                ) : (
                  <span className="flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    {oracle.state.statusMessage}
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={clearConversation}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Clear conversation</TooltipContent>
              </Tooltip>
            )}
            <SettingsSheet settings={settings} onSettingsChange={setSettings} />
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {messages.length === 0 ? (
            // Empty state with starter questions
            <EmptyState
              onQuestionClick={handleSubmit}
              backendStatus={oracle.state.backendStatus}
            />
          ) : (
            // Message list
            <div className="space-y-6">
              {messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  onStrandClick={onStrandClick}
                  onFollowUpClick={handleSubmit}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <footer className="flex-shrink-0 border-t border-border/50 px-4 py-4 bg-card/50">
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Ask anything about your knowledge base..."
              disabled={!oracle.isReady || oracle.isQuerying}
              rows={1}
              className={cn(
                'pr-12 resize-none',
                'min-h-[52px] max-h-[200px]',
                'bg-muted/30 border-border/50',
                'focus-visible:ring-1 focus-visible:ring-primary/50'
              )}
            />
            <Button
              type="submit"
              size="icon"
              onClick={() => handleSubmit()}
              disabled={!input.trim() || !oracle.isReady || oracle.isQuerying}
              className="absolute right-2 bottom-2 h-8 w-8"
            >
              {oracle.isQuerying ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CornerDownLeft className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </footer>
    </div>
  );
}

// ============================================================================
// Sub-Components
// ============================================================================

function EmptyState({
  onQuestionClick,
  backendStatus,
}: {
  onQuestionClick: (question: string) => void;
  backendStatus: any;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
      <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-6">
        <Sparkles className="h-8 w-8 text-primary" />
      </div>
      <h2 className="text-2xl font-semibold mb-2">Ask Oracle</h2>
      <p className="text-muted-foreground max-w-md mb-8">
        Get intelligent answers from your knowledge base with citations, follow-up questions, and
        contextual exploration.
      </p>

      {/* Starter questions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl w-full">
        {STARTER_QUESTIONS.map(({ question, icon: Icon }) => (
          <button
            key={question}
            onClick={() => onQuestionClick(question)}
            className={cn(
              'flex items-center gap-3 p-4 rounded-xl',
              'bg-muted/30 hover:bg-muted/50 transition-colors',
              'border border-border/30 text-left'
            )}
          >
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <span className="text-sm">{question}</span>
          </button>
        ))}
      </div>

      {/* Backend status */}
      {backendStatus && (
        <div className="mt-8 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Cpu className="h-3 w-3" />
            {backendStatus.active || 'No backend'}
          </span>
          <span className="flex items-center gap-1">
            <Database className="h-3 w-3" />
            {backendStatus.available?.length || 0} available
          </span>
        </div>
      )}
    </div>
  );
}

function MessageBubble({
  message,
  onStrandClick,
  onFollowUpClick,
}: {
  message: Message;
  onStrandClick?: (strandId: string) => void;
  onFollowUpClick?: (question: string) => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={cn(
        'flex gap-3',
        message.type === 'user' ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0',
          message.type === 'user'
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted'
        )}
      >
        {message.type === 'user' ? (
          <User className="h-4 w-4" />
        ) : (
          <Bot className="h-4 w-4" />
        )}
      </div>

      {/* Content */}
      <div
        className={cn(
          'flex-1 space-y-3',
          message.type === 'user' ? 'items-end' : 'items-start'
        )}
      >
        <div
          className={cn(
            'rounded-2xl px-4 py-3 max-w-[85%]',
            message.type === 'user'
              ? 'bg-primary text-primary-foreground ml-auto'
              : 'bg-muted'
          )}
        >
          <p className="whitespace-pre-wrap">{message.content}</p>
          {message.isStreaming && (
            <span className="inline-block w-2 h-4 ml-1 bg-current animate-pulse" />
          )}
        </div>

        {/* Citations */}
        {message.citations && message.citations.length > 0 && (
          <div className="space-y-2 max-w-[85%]">
            <h4 className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <BookOpen className="h-3 w-3" />
              Sources
            </h4>
            <div className="grid gap-2">
              {message.citations.map((citation) => (
                <button
                  key={citation.index}
                  onClick={() => onStrandClick?.(citation.strandId)}
                  className="flex items-start gap-2 p-2 rounded-lg bg-card hover:bg-muted/50 transition-colors text-left border border-border/30"
                >
                  <Badge variant="outline" className="text-xs font-mono">
                    [{citation.index}]
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {citation.title}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {citation.text}
                    </p>
                  </div>
                  <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Socratic Questions */}
        {message.socraticQuestions && message.socraticQuestions.length > 0 && (
          <div className="space-y-2 max-w-[85%]">
            <h4 className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              Continue exploring
            </h4>
            <div className="flex flex-wrap gap-2">
              {message.socraticQuestions.map((sq, i) => (
                <button
                  key={i}
                  onClick={() => onFollowUpClick?.(sq.question)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs transition-colors',
                    'bg-primary/10 text-primary hover:bg-primary/20'
                  )}
                >
                  {sq.question}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message actions */}
        {message.type === 'assistant' && message.content && !message.isStreaming && (
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-green-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Copy</TooltipContent>
            </Tooltip>
            {message.metadata && (
              <span className="text-xs text-muted-foreground">
                {message.metadata.durationMs}ms •{' '}
                {message.metadata.llmModel || 'extractive'}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function SettingsSheet({
  settings,
  onSettingsChange,
}: {
  settings: any;
  onSettingsChange: (settings: any) => void;
}) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon">
          <Settings2 className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Oracle Settings</SheetTitle>
          <SheetDescription>
            Configure how Oracle answers your questions.
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-6 py-6">
          {/* Answer Mode */}
          <div className="space-y-2">
            <Label>Answer Mode</Label>
            <Select
              value={settings.mode}
              onValueChange={(value) =>
                onSettingsChange({ ...settings, mode: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="extractive">Extractive (fast, no LLM)</SelectItem>
                <SelectItem value="generative">Generative (LLM synthesis)</SelectItem>
                <SelectItem value="hybrid">Hybrid (best of both)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Extractive is fastest but less fluent. Generative uses LLM for better answers.
            </p>
          </div>

          <Separator />

          {/* Streaming */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Streaming</Label>
              <p className="text-xs text-muted-foreground">
                See answers as they're generated
              </p>
            </div>
            <Switch
              checked={settings.streaming}
              onCheckedChange={(checked) =>
                onSettingsChange({ ...settings, streaming: checked })
              }
            />
          </div>

          {/* Citations */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Citations</Label>
              <p className="text-xs text-muted-foreground">
                Show source references
              </p>
            </div>
            <Switch
              checked={settings.includeCitations}
              onCheckedChange={(checked) =>
                onSettingsChange({ ...settings, includeCitations: checked })
              }
            />
          </div>

          {/* Socratic Questions */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Socratic Questions</Label>
              <p className="text-xs text-muted-foreground">
                Suggest follow-up questions
              </p>
            </div>
            <Switch
              checked={settings.includeSocratic}
              onCheckedChange={(checked) =>
                onSettingsChange({ ...settings, includeSocratic: checked })
              }
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default QAOraclePage;

