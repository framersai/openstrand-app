'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { Loader2, Upload, Database } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/services/api';
import type { CatalogEntry, CatalogStatus, CatalogVisibility } from '@/types';
import { useDatasetStore } from '@/store/dataset-store';
import { useSupabase } from '@/features/auth';
import { UnifiedHeader } from '@/components/navigation/UnifiedHeader';
import { SettingsDialog } from '@/components/settings-dialog';
import { useLocalizedPath } from '@/hooks/useLocalizedPath';

const VISIBILITY_LABELS: Record<CatalogVisibility, string> = {
  public: 'Public',
  private: 'Private',
  premium: 'Premium',
};

const STATUS_COLORS: Record<CatalogStatus, string> = {
  approved: 'text-green-600 border-green-200 bg-green-50',
  pending: 'text-amber-600 border-amber-200 bg-amber-50',
  rejected: 'text-red-600 border-red-200 bg-red-50',
  archived: 'text-muted-foreground border-border bg-muted',
};

export default function DatasetCatalogPage() {
  const router = useRouter();
  const { isAuthenticated } = useSupabase();
  const { setDataset } = useDatasetStore();
  const [entries, setEntries] = useState<CatalogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const localizePath = useLocalizedPath();
  const submitDatasetUrl = localizePath('/catalogs/submit');
  const signInUrl = localizePath('/auth?view=sign-in');

  const loadEntries = async () => {
    try {
      setError(null);
      setLoading(true);
      const data = await api.listCatalogEntries();
      setEntries(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load catalog.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadEntries();
  }, []);

  const handleUseDataset = async (entry: CatalogEntry) => {
    try {
      const result = await api.loadCatalogDataset(entry.id);
      setDataset({
        id: result.datasetId,
        file: null,
        metadata: result.metadata,
      });
      toast.success(`Loaded ${entry.name}`);
      router.push('/');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load dataset.';
      toast.error(message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <UnifiedHeader onOpenSettings={() => setShowSettings(true)} />
      <main className="container mx-auto px-4 py-10 space-y-8">
        <div className="flex flex-col gap-3 border rounded-3xl border-border/60 bg-card/70 p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold">Dataset Catalog</h1>
              <p className="text-muted-foreground">
                Explore approved CSV/JSON submissions curated by the community and team.
              </p>
            </div>
            {isAuthenticated ? (
              <Button asChild size="sm">
                <Link href={submitDatasetUrl} className="inline-flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Submit dataset
                </Link>
              </Button>
            ) : (
              <Button asChild variant="outline" size="sm">
                <Link href={signInUrl}>Sign in to submit datasets {'>'}</Link>
              </Button>
            )}
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Loading catalog...
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {entries.map((entry) => (
              <Card key={entry.id} className="border-border/70 bg-card/80">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{entry.name}</CardTitle>
                      <CardDescription>{entry.description || 'No description provided.'}</CardDescription>
                    </div>
                    <span
                      className={`rounded-full border px-3 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${STATUS_COLORS[entry.status]}`}
                    >
                      {entry.status}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Database className="h-4 w-4" />
                    <span>{VISIBILITY_LABELS[entry.visibility]}</span>
                    <span className="text-muted-foreground/60">|</span>
                    <span className="text-primary font-semibold">{entry.plan_required.toUpperCase()}</span>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full"
                    disabled={entry.status !== 'approved'}
                    onClick={() => handleUseDataset(entry)}
                  >
                    Use dataset
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
      {showSettings && (
        <SettingsDialog isOpen={showSettings} onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
}

