"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { CheckCircle, Cloud, Copy, Database, Shield, Sparkles, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useOpenStrandStore } from '@/store/openstrand.store';

interface LocalOnboardingProps {
  onOpenSettings: () => void;
}

export function LocalOnboarding({ onOpenSettings }: LocalOnboardingProps) {
  const capabilities = useOpenStrandStore((state) => state.capabilities);
  const localOnboardingComplete = useOpenStrandStore((state) => state.localOnboardingComplete);
  const completeLocalOnboarding = useOpenStrandStore((state) => state.completeLocalOnboarding);

  const [open, setOpen] = useState(false);

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

  const openSettingsAndDismiss = () => {
    setOpen(false);
    onOpenSettings();
  };

  if (!open) {
    return null;
  }

  const storagePath = capabilities?.storage?.path ?? 'sqlite:./openstrand.db';

  const handleCopyPath = async () => {
    try {
      await navigator.clipboard.writeText(storagePath);
      toast.success('SQLite path copied to clipboard');
    } catch (error) {
      console.error('Failed to copy path', error);
      toast.error('Unable to copy path');
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
                  Offline mode
                </Badge>
                <Badge variant="outline">SQLite</Badge>
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
                    Local deployments can run with a default account. Head to Settings → Authentication to set your own username and password, or keep the default for single-user notebooks.
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
