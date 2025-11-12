'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { openstrandAPI } from '@/services/openstrand.api';
import { useLocalizedPath } from '@/hooks/useLocalizedPath';
import { useTranslations } from 'next-intl';

const WeaveViewer = dynamic(() => import('@/components/weave/WeaveViewer'), { ssr: false });

export function WeavePreviewCard() {
  const t = useTranslations('pkms');
  const localizePath = useLocalizedPath();
  const [data, setData] = useState<{ nodes: any[]; edges: any[] } | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const weave = await openstrandAPI.weave.get({ maxNodes: 60 });
      setData({ nodes: weave.nodes, edges: weave.edges });
    } catch {
      setData({ nodes: [], edges: [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">{t('weave.title')}</CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => void load()} aria-label="Refresh weave">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button asChild size="sm">
            <a href={localizePath('/weave')}>{t('weave.open')}</a>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64 overflow-hidden rounded-md border border-border/60 bg-muted/20">
          {data ? <WeaveViewer data={data as any} /> : null}
          {loading ? <div className="p-2 text-xs text-muted-foreground">{t('list.loading')}</div> : null}
        </div>
      </CardContent>
    </Card>
  );
}


