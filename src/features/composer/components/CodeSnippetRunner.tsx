'use client';

/**
 * CodeSnippetRunner
 * Lightweight client-only snippet runner for TypeScript/JavaScript and Python (Pyodide).
 * - Executes in Web Workers for safety (no eval on main thread).
 * - Captures stdout/stderr as logs and exposes a simple API via onReady.
 * - UI includes language selector, editor textarea, and output panel with copy.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { Play, StopCircle, Copy, Code2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type Language = 'ts' | 'js' | 'py';

export function CodeSnippetRunner({
  className,
  defaultLanguage = 'ts',
  defaultCode = '',
  onReady,
  hideControls = false,
}: {
  className?: string;
  defaultLanguage?: Language;
  defaultCode?: string;
  onReady?: (api: {
    runWith: (code: string, language: Language) => void;
    getLastLogs: () => string[];
    getLastError: () => string | null;
  }) => void;
  hideControls?: boolean;
}) {
  const [language, setLanguage] = useState<Language>(defaultLanguage);
  const [code, setCode] = useState<string>(defaultCode);
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const workerRef = useRef<Worker | null>(null);

  const workerUrl = useMemo(() => {
    if (language === 'py') return '/workers/py-runner.js';
    return '/workers/ts-runner.js';
  }, [language]);

  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  const run = () => {
    try {
      setRunning(true);
      setLogs([]);
      setError(null);

      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }

      const worker = new Worker(workerUrl);
      workerRef.current = worker;
      worker.onmessage = (ev: MessageEvent) => {
        const { ok, logs: out, error: err } = ev.data || {};
        setLogs(Array.isArray(out) ? out : []);
        if (!ok && err) setError(String(err));
        setRunning(false);
        worker.terminate();
        workerRef.current = null;
      };
      worker.onerror = (e) => {
        setError(e.message || 'Worker error');
        setRunning(false);
        worker.terminate();
        workerRef.current = null;
      };

      const payload: any = { code, timeoutMs: language === 'py' ? 3000 : 2000 };
      if (language === 'py') {
        payload.indexURL = '/pyodide'; // adjust when bundling pyodide assets
      }
      worker.postMessage(payload);
    } catch (e) {
      setError((e as Error).message);
      setRunning(false);
    }
  };

  const stop = () => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    setRunning(false);
  };

  const copyLogs = async () => {
    try {
      await navigator.clipboard.writeText(logs.join('\n'));
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    if (onReady) {
      onReady({
        runWith: (source: string, lang: Language) => {
          setLanguage(lang);
          setCode(source);
          // defer to ensure state updates propagate
          setTimeout(run, 0);
        },
        getLastLogs: () => logs,
        getLastError: () => error,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onReady, workerUrl, logs, error]);

  return (
    <Card className={cn('glass-card', className)}>
      {!hideControls && (
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Code2 className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">Runnable snippet</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Select value={language} onValueChange={(v) => setLanguage(v as Language)}>
              <SelectTrigger className="h-8 w-[120px]">
                <SelectValue placeholder="Language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ts">TypeScript</SelectItem>
                <SelectItem value="js">JavaScript</SelectItem>
                <SelectItem value="py">Python</SelectItem>
              </SelectContent>
            </Select>
            {running ? (
              <Button size="sm" variant="outline" onClick={stop} className="gap-1">
                <StopCircle className="h-4 w-4" />
                Stop
              </Button>
            ) : (
              <Button size="sm" onClick={run} className="gap-1">
                <Play className="h-4 w-4" />
                Run
              </Button>
            )}
          </div>
        </CardHeader>
      )}
      <CardContent className="space-y-3">
        {!hideControls && (
          <Textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={language === 'py' ? 'print("hello from python")' : 'console.log("hello from js")'}
            rows={8}
            className="font-mono text-sm"
          />
        )}
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">{running ? 'Running…' : error ? 'Error' : 'Output'}</div>
          <Button size="icon" variant="ghost" onClick={copyLogs} title="Copy output">
            <Copy className="h-4 w-4" />
          </Button>
        </div>
        <pre className="max-h-56 overflow-auto rounded-md border border-border/60 bg-background/70 p-3 text-xs">
{logs.join('\n')}
        </pre>
        {error ? (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive">{error}</div>
        ) : null}
      </CardContent>
    </Card>
  );
}


