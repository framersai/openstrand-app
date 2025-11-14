'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTranslations } from 'next-intl';
import { openstrandAPI } from '@/services/openstrand.api';
import { useFeatureFlags } from '@/lib/feature-flags';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Sparkles } from 'lucide-react';

type Thread = { id: string; title?: string; description?: string; strandIds?: string[] };

export function LoomsPanel() {
  const t = useTranslations('pkms');
  const { isTeamEdition } = useFeatureFlags();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const items = await openstrandAPI.threads.list();
        const th = Array.isArray(items) ? (items as any as Thread[]) : [];
        setThreads(th);
      } catch {
        setThreads([]);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">{t('looms.title')}</CardTitle>
        <div className="flex items-center gap-2">
          {!isTeamEdition && (
            <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
              Community
            </Badge>
          )}
          <Button variant="outline" size="sm" onClick={() => window.location.assign('/patterns')}>
            {t('looms.open')}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!isTeamEdition && (
          <Alert className="mb-3 border-primary/20 bg-primary/5">
            <Sparkles className="h-4 w-4 text-primary" />
            <AlertDescription className="text-xs">
              <strong>Community Edition:</strong> You have one global Loom for all strands.{' '}
              <a href="/pricing" className="underline hover:text-primary">
                Upgrade to Teams
              </a>{' '}
              to manage multiple projects (storytelling, world-building, research, etc.).
            </AlertDescription>
          </Alert>
        )}
        {loading ? <div className="text-sm text-muted-foreground">{t('list.loading')}</div> : null}
        {!loading && threads.length === 0 ? (
          <div className="text-sm text-muted-foreground">{t('looms.empty')}</div>
        ) : (
          <div className="space-y-2">
            {threads.slice(0, 6).map((th) => (
              <div key={th.id} className="flex items-center justify-between rounded-md border border-border/60 bg-muted/20 p-2">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{th.title ?? th.id}</div>
                  {th.description ? <div className="truncate text-xs text-muted-foreground">{th.description}</div> : null}
                </div>
                <Badge variant="secondary" className="text-[10px]">
                  {(th.strandIds?.length ?? 0)} {t('looms.items')}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}


