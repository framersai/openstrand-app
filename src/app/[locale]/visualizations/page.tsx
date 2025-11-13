'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { UnifiedHeader } from '@/components/navigation/UnifiedHeader';
import { SiteFooter } from '@/components/site-footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLocalizedPath } from '@/hooks/useLocalizedPath';
import { openstrandAPI } from '@/store/openstrand.store' as any;

export default function VisualizationsPage() {
  const t = useTranslations('common');
  const localizePath = useLocalizedPath();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        // Fallback to empty list if API not available
        if (!openstrandAPI?.visualizations?.list) {
          setItems([]);
          return;
        }
        const result = await openstrandAPI.visualizations.list({ page: 1, pageSize: 20 });
        const list = Array.isArray((result as any)?.items) ? (result as any).items : [];
        if (mounted) setItems(list);
      } catch (e) {
        if (mounted) setError((e as Error).message);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <>
      <UnifiedHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">{t('navigation.visualizations')}</h1>
          <Button asChild variant="outline" size="sm">
            <Link href={localizePath('/')} aria-label="Back to Dashboard">
              {t('navigation.feed')}
            </Link>
          </Button>
        </div>

        {loading ? (
          <div className="rounded-xl border border-border/60 bg-background/50 p-6">
            <p className="text-sm text-muted-foreground">Loading visualizations…</p>
          </div>
        ) : error ? (
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-6 text-destructive">
            <p className="text-sm">Failed to load visualizations: {error}</p>
          </div>
        ) : items.length === 0 ? (
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>No visualizations yet</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Generate a visualization from the dashboard Upload/Visualize tabs, then return here to see it in your list.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {items.map((viz) => (
              <Card key={viz.id} className="glass-card">
                <CardHeader>
                  <CardTitle className="text-base">
                    {viz.title || viz.metadata?.suggestedApproach || viz.type || 'Visualization'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  <div className="flex flex-col gap-1">
                    <div>
                      <span className="font-medium">ID:</span> {viz.id}
                    </div>
                    {viz.datasetId ? (
                      <div>
                        <span className="font-medium">Dataset:</span> {viz.datasetId}
                      </div>
                    ) : null}
                    {viz.createdAt || viz.created ? (
                      <div>
                        <span className="font-medium">Created:</span>{' '}
                        {new Date(viz.createdAt ?? viz.created).toLocaleString()}
                      </div>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </>
  );
}


