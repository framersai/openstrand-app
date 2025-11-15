'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { useEffect, useState, useCallback } from 'react';
import { X, Send, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AssistantModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AssistantModal({ open, onOpenChange }: AssistantModalProps) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Array<{ role: 'assistant' | 'user'; text: string }>>([]);

  const send = useCallback(() => {
    const text = input.trim();
    if (!text) return;
    setMessages((prev) => [...prev, { role: 'user', text }]);
    setInput('');
    // Placeholder: real implementation will call assistant orchestrator
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: 'Thanks — I’ll factor this into your current weave. Check the feed for any relevant nudges.',
        },
      ]);
    }, 300);
  }, [input]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        send();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [send]);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[60] bg-background/30 backdrop-blur-sm" />
        <Dialog.Content
          className={cn(
            'fixed inset-x-3 bottom-6 z-[61] mx-auto max-w-3xl rounded-2xl border',
            'bg-background/95 shadow-2xl transition-all',
          )}
        >
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div className="text-sm font-semibold">OS Assistant (Weaver)</div>
            </div>
            <Dialog.Close className="rounded-md p-1.5 text-muted-foreground hover:bg-muted">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>
          <div className="max-h-[50vh] overflow-y-auto px-4 py-3">
            {messages.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                Ask anything. The assistant adapts to your current weave/loom and recent activity.
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((m, i) => (
                  <div
                    key={i}
                    className={cn(
                      'rounded-md px-3 py-2 text-sm',
                      m.role === 'assistant'
                        ? 'bg-muted/60 text-foreground'
                        : 'ml-auto bg-primary text-primary-foreground',
                      m.role === 'user' ? 'w-fit' : '',
                    )}
                  >
                    {m.text}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 border-t px-4 py-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask OS (Weaver)…"
              className="flex-1 rounded-md border bg-background px-3 py-2 text-sm outline-none"
            />
            <button
              type="button"
              onClick={send}
              className="inline-flex items-center gap-2 rounded-md border bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:shadow"
            >
              <Send className="h-4 w-4" />
              Send
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}


