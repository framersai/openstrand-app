"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { AlertCircle, CheckCircle, Cloud, Copy, Database, Shield, Sparkles, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useOpenStrandStore } from '@/store/openstrand.store';
import { platformStorage, type LocalSyncStatus } from '@/services/platform/storage.service';
import { useProductTour } from '@/providers/ProductTourProvider';

interface LocalOnboardingProps {
  onOpenSettings: () => void;
}

export function LocalOnboarding({ onOpenSettings }: LocalOnboardingProps) {
  const capabilities = useOpenStrandStore((state) => state.capabilities);
  const localOnboardingComplete = useOpenStrandStore((state) => state.localOnboardingComplete);
  const completeLocalOnboarding = useOpenStrandStore((state) => state.completeLocalOnboarding);
  const { openTour } = useProductTour();

  const [open, setOpen] = useState(false);
  const storageInfo = capabilities?.storage;
  const storageNotes = capabilities?.notes ?? [];
  const environmentMode = capabilities?.environment?.mode ?? 'cloud';
  const storagePath = storageInfo?.path ?? 'sqlite:./openstrand.db';
  const syncEnabled = Boolean(storageInfo?.syncEnabled);
  const [syncStatus, setSyncStatus] = useState<LocalSyncStatus | null>(null);
  const [syncing, setSyncing] = useState(false);

  /**
   * Automatically opens the onboarding dialog when offline mode is detected and the checklist is incomplete.
   */
  useEffect(() => {
    if (!capabilities) {
      return;
    }
    const isOffline = capabilities.environment?.mode === 'offline';
    if (isOffline && !localOnboardingComplete) {
      setOpen(true);
    } else {
      setOpen(false);
    }
  }, [capabilities, localOnboardingComplete]);

  /**
   * Enables closing the onboarding dialog with the Escape key for accessibility and convenience.
   */
  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    if (!storageInfo) {
      setSyncStatus(null);
      return;
    }

    let cancelled = false;

    const loadStatus = async () => {
      try {
        const status = await platformStorage.getSyncStatus();
        if (!cancelled) {
          setSyncStatus(status);
        }
      } catch (error) {
        console.warn('[local-onboarding] Failed to load sync status', error);
      }
    };

    loadStatus();
    return () => {
      cancelled = true;
    };
  }, [open, storageInfo]);

  const openSettingsAndDismiss = () => {
    setOpen(false);
    onOpenSettings();
  };

  if (!open) {
    return null;
  }

  const handleCopyPath = async () => {
    try {
      await navigator.clipboard.writeText(storagePath);
      toast.success('SQLite path copied to clipboard');
    } catch (error) {
      console.error('Failed to copy path', error);
      toast.error('Unable to copy path');
    }
  };

  const handleManualSync = async () => {
    if (!syncEnabled) {
      toast.error('Cloud sync is disabled.');
      return;
    }

    setSyncing(true);
    try {
      await platformStorage.sync();
      const status = await platformStorage.getSyncStatus();
      setSyncStatus(status);
      toast.success('Workspace synced');
    } catch (error) {
      console.error('[local-onboarding] Manual sync failed', error);
      toast.error('Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const handleComplete = async () => {
    try {
      await completeLocalOnboarding(true);
      toast.success('Local workspace ready');
    } finally {
      setOpen(false);
    }
  };

  const handleDismiss = () => setOpen(false);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-background/80 backdrop-blur-sm px-4 py-10"
      role="dialog"
      aria-modal="true"
      aria-label="Local workspace onboarding"
      onClick={handleDismiss}
    >
      <Card
        className="w-full max-w-2xl border-border/60 shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(event) => event.stopPropagation()}
      >
        <CardHeader className="space-y-3 border-b border-border/60 pb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="uppercase tracking-wide">
                  {environmentMode === 'offline' ? 'Offline mode' : 'Workspace'}
                </Badge>
                <Badge variant="outline">{storageInfo?.kind ?? storageInfo?.driver ?? 'SQLite'}</Badge>
              </div>
              <CardTitle className="text-2xl">Welcome to the local OpenStrand workspace</CardTitle>
              <CardDescription>
                Follow these quick steps to finish configuring your offline environment. You can update these settings later from the main menu.
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDismiss}
              aria-label="Close onboarding"
              className="mt-1 h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="space-y-4 rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-5">
            <div className="flex items-start gap-3">
              <Sparkles className="mt-0.5 h-4 w-4 text-primary" />
              <p className="text-sm text-primary">
                Local mode keeps everything on your device. You can sync or upgrade to the cloud deployment whenever you need premium renderers.
              </p>
            </div>
            <Separator />
            <div className="grid gap-3 text-xs text-muted-foreground sm:grid-cols-2">
              <div className="flex items-start gap-2">
                <Cloud className="mt-0.5 h-3.5 w-3.5 text-primary" />
                <span>Connect to the Teams backend to unlock managed AI renderers, RBAC, and live collaboration.</span>
              </div>
              <div className="flex items-start gap-2">
                <Shield className="mt-0.5 h-3.5 w-3.5 text-primary" />
                <span>Enable optional cloud sync when you&apos;re ready to combine offline authoring with managed AI pipelines.</span>
              </div>
            </div>
          </div>

          {storageInfo && (
            <div className="space-y-3 rounded-2xl border border-border/60 bg-background/80 p-5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="uppercase tracking-wide">
                  {environmentMode === 'offline' ? 'Offline mode' : 'Storage'}
                </Badge>
                {storageInfo.kind && <Badge variant="outline">{storageInfo.kind}</Badge>}
                <Badge
                  variant="outline"
                  className={
                    syncEnabled
                      ? 'text-emerald-700 border-emerald-300 bg-emerald-50'
                      : 'text-muted-foreground'
                  }
                >
                  {syncEnabled ? 'Sync enabled' : 'Sync disabled'}
                </Badge>
              </div>
              <div className="space-y-2">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-3">
                    <Database className="mt-0.5 h-4 w-4 text-muted-foreground" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium">SQLite workspace path</p>
                      <div className="rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-xs font-mono break-all">
                        {storagePath}
                      </div>
                      <p className="text-xs text-muted-foreground">Use this path for manual backups or to inspect the dataset with SQLite tooling.</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleCopyPath} className="self-start">
                    <Copy className="mr-2 h-3 w-3" />
                    Copy path
                  </Button>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {syncEnabled && (
                    <Button variant="outline" size="sm" onClick={handleManualSync} disabled={syncing}>
                      {syncing ? 'Syncing...' : (
                        <>
                          <Sparkles className="mr-2 h-3 w-3" />
                          Sync now
                        </>
                      )}
                    </Button>
                  )}
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => openTour({ sectionId: 'onboarding-wizards' })}
                    className="px-0 text-xs font-medium"
                  >
                    Open product tour
                  </Button>
                </div>
                {syncStatus ? (
                  <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                    <div>
                      <p className="uppercase tracking-[0.3em]">Last sync</p>
                      <p className="text-sm text-foreground">
                        {syncStatus.lastSync ? formatDistanceToNow(syncStatus.lastSync, { addSuffix: true }) : 'Never'}
                      </p>
                    </div>
                    <div>
                      <p className="uppercase tracking-[0.3em]">Pending changes</p>
                      <p className="text-sm text-foreground">{syncStatus.pendingChanges}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Checking sync status...</p>
                )}
                {syncStatus && syncStatus.conflicts.length > 0 && (
                  <div className="flex items-center gap-2 text-xs text-destructive">
                    <AlertCircle className="h-3 w-3" />
                    {syncStatus.conflicts.join(', ')}
                  </div>
                )}
                {storageInfo.capabilities && storageInfo.capabilities.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {storageInfo.capabilities.map((capability) => (
                      <Badge key={capability} variant="outline" className="text-xs">
                        {capability}
                      </Badge>
                    ))}
                  </div>
                )}
                {storageNotes.length > 0 && (
                  <ul className="list-disc pl-5 text-xs text-muted-foreground space-y-1">
                    {storageNotes.map((note) => (
                      <li key={note}>{note}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          <div className="divide-y divide-border/60 rounded-2xl border border-border/60 bg-background/80">
            <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3">
                <Database className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div className="space-y-2">
                  <p className="text-sm font-medium">Locate the local SQLite workspace</p>
                  <div className="rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-xs font-mono break-all">
                    {storagePath}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Use this path for manual backups or to inspect the dataset with SQLite tooling.
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={handleCopyPath} className="self-start">
                <Copy className="mr-2 h-3 w-3" />
                Copy path
              </Button>
            </div>

            <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3">
                <Cloud className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div className="space-y-2">
                  <p className="text-sm font-medium">Enable optional cloud backup &amp; sync</p>
                  <p className="text-xs text-muted-foreground">
                    When you&apos;re ready to collaborate, connect this workspace to the Teams backend or Supabase. These guides walk through provisioning cloud resources and mapping your local content.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href="/tutorials/dx-ux-blueprint">Cloud onboarding guide</Link>
                    </Button>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href="/tutorials/metadata-playbook">Metadata &amp; RBAC checklist</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3">
                <Shield className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div className="space-y-2">
                  <p className="text-sm font-medium">Set offline credentials (optional)</p>
                  <p className="text-xs text-muted-foreground">
                    Local deployments can run with a default account. Head to Settings -> Authentication to set your own username and password, or keep the default for single-user notebooks.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3">
                <CheckCircle className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div className="space-y-2">
                  <p className="text-sm font-medium">Generate tier 2 &amp; tier 3 previews</p>
                  <p className="text-xs text-muted-foreground">
                    Offline mode unlocks dynamic and AI Artisan previews using placeholder templates. Connect to the cloud backend to access full production renderers when you&apos;re ready to publish.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border/60 pt-4">
            <Button variant="ghost" size="sm" onClick={handleDismiss}>
              Remind me later
            </Button>
            <Button variant="ghost" size="sm" onClick={openSettingsAndDismiss}>
              <Shield className="mr-2 h-3 w-3" />
              Open settings
            </Button>
            <Button variant="default" size="sm" onClick={handleComplete}>
              Mark setup complete
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
