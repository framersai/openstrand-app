'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCcw, Server, Database, Timer } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface SystemStatusResponse {
  cache: {
    enabled: boolean;
    redis: boolean;
  };
  queue: {
    enabled: boolean;
    redis: boolean;
    importMetrics: Record<string, number> | null;
  };
  timestamp: string;
}

export function SystemStatusPanel() {
  const [status, setStatus] = useState<SystemStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/v1/meta/system', {
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const data = (await response.json()) as SystemStatusResponse;
      setStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchStatus();
    const interval = setInterval(() => {
      void fetchStatus();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchStatus]);

  const importMetrics = useMemo(() => {
    if (!status?.queue.importMetrics) {
      return null;
    }

    const entries = Object.entries(status.queue.importMetrics).filter(([, value]) => typeof value === 'number');
    return entries.sort((a, b) => a[0].localeCompare(b[0]));
  }, [status]);

  const lastUpdated = status
    ? new Date(status.timestamp).toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : null;

  return ( 
    <Card className="border-primary/20 bg-gradient-to-br from-background/80 via-background/90 to-primary/5"> 
      <CardHeader className="space-y-2"> 
        <div className="flex items-center justify-between gap-2"> 
          <CardTitle className="text-base font-semibold">Infrastructure Status</CardTitle> 
          <Button variant="ghost" size="icon" onClick={() => fetchStatus()} disabled={isLoading} aria-label="Refresh system status"> 
            <RefreshCcw className={cn('h-4 w-4 transition-transform', isLoading && 'animate-spin')} /> 
          </Button> 
        </div> 
        <p className="text-xs text-muted-foreground">Monitor cache and job queue health for the Team backend.</p> 
      </CardHeader> 
      <CardContent className="space-y-4"> 
        {error ? ( 
          <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"> 
            Failed to load status: {error} 
          </div> 
        ) : null} 

        <section className="rounded-md border border-primary/10 bg-background/80 p-3"> 
          <div className="flex items-center justify-between"> 
            <div className="flex items-center gap-2"> 
              <Server className="h-4 w-4 text-primary" /> 
              <span className="text-sm font-medium">Cache Layer</span> 
            </div> 
            <Badge variant={status?.cache.redis ? 'default' : 'secondary'} className="uppercase"> 
              {status?.cache.enabled ? (status.cache.redis ? 'Redis' : 'Memory') : 'Disabled'} 
            </Badge> 
          </div> 
          <p className="mt-2 text-xs text-muted-foreground"> 
            Adaptive cache with automatic Redis detection and in-memory fallback. 
          </p> 
        </section> 

        <section className="rounded-md border border-primary/10 bg-background/80 p-3"> 
          <div className="flex items-center justify-between"> 
            <div className="flex items-center gap-2"> 
              <Database className="h-4 w-4 text-primary" /> 
              <span className="text-sm font-medium">Job Queue</span> 
            </div> 
            <Badge variant={status?.queue.redis ? 'default' : 'secondary'} className="uppercase"> 
              {status?.queue.enabled ? (status.queue.redis ? 'BullMQ' : 'In-memory') : 'Disabled'} 
            </Badge> 
          </div> 
          <p className="mt-2 text-xs text-muted-foreground"> 
            Handles high-volume background imports with retries and backoff. 
          </p> 

          {importMetrics && importMetrics.length > 0 ? ( 
            <> 
              <Separator className="my-3" /> 
              <div className="grid grid-cols-2 gap-2 text-xs"> 
                {importMetrics.map(([key, value]) => ( 
                  <div key={key} className="flex items-center justify-between rounded-md bg-primary/5 px-2 py-1"> 
                    <span className="font-medium capitalize">{key}</span> 
                    <span className="font-mono text-sm">{value}</span> 
                  </div> 
                ))} 
              </div> 
            </> 
          ) : null} 
        </section> 

        <div className="flex items-center gap-2 text-xs text-muted-foreground"> 
          <Timer className="h-3.5 w-3.5" /> 
          <span>Last updated: {lastUpdated ?? '—'}</span> 
        </div> 
      </CardContent> 
    </Card> 
  );
}
