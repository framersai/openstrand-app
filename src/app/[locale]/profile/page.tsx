'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import {
  Activity,
  AlertCircle,
  TrendingUp,
  BarChart3,
  Clock,
  Database,
  Copy,
  Download,
  Heart,
  Info,
  LogOut,
  Sparkles,
  Star,
  Upload,
  User,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useProductTour } from '@/providers/ProductTourProvider';

import { useSupabase } from '@/features/auth';
import { useSubscription } from '@/features/billing';
import { guestSessionService } from '@/services/guest-session.service';
import { useOpenStrandStore } from '@/store/openstrand.store';
import { platformStorage, type LocalSyncStatus } from '@/services/platform/storage.service';
import {
  useVisualizationStore,
  useRecentVisualizations,
  useSavedVisualizations,
} from '@/store/visualization-store';
import type { Visualization } from '@/types';
import {
  upsertSavedVisualization,
  removeSavedVisualization,
} from '@/services/saved-visualizations.service';
import { useSavedVisualizationsSync } from '@/hooks/useSavedVisualizationsSync';
import { formatPlanLabel } from '@/lib/plan-info';

interface UserProfile {
  id: string;
  email: string;
  name?: string;
  createdAt: string;
  plan: 'free' | 'cloud' | 'pro' | 'team' | 'enterprise' | 'org';
}

interface PreferencesState {
  emailNotifications: boolean;
  autoInsights: boolean;
  useHeuristics: boolean;
  publicProfile: boolean;
  shareUsageData: boolean;
}

const PreviewBars = ({ seed }: { seed: string }) => {
  const values = useMemo(() => {
    const source = seed && seed.length > 0 ? seed : 'visualization';
    const bars: number[] = [];
    let accumulator = 0;
    for (let i = 0; i < 8; i++) {
      const char = source.charCodeAt(i % source.length);
      accumulator = (accumulator + char * (i + 3)) % 101;
      bars.push(25 + (accumulator % 60));
    }
    return bars;
  }, [seed]);

  return (
    <div className="flex h-12 items-end gap-1 rounded-md bg-primary/5 px-2 py-2">
      {values.map((height, index) => (
        <span
          key={`${seed}-${index}`}
          style={{ height: `${height}%` }}
          className="flex-1 rounded-full bg-gradient-to-t from-primary/30 via-primary/60 to-primary/80"
        />
      ))}
    </div>
  );
};

const formatDate = (value: string | null | undefined) => {
  if (!value) return 'Unknown';
  return new Date(value).toLocaleString();
};

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLocalAuth, planTier, signOut } = useSupabase();
  const [activeTab, setActiveTab] = useState<'overview' | 'usage' | 'preferences' | 'data'>(
    'overview'
  );
  const [isLoading, setIsLoading] = useState(true);
  const [guestSession, setGuestSession] = useState(guestSessionService.getSessionForMigration());
  const [preferences, setPreferences] = useState<PreferencesState>({
    emailNotifications: false,
    autoInsights: guestSession?.preferences.autoInsights ?? false,
    useHeuristics: guestSession?.preferences.useHeuristics ?? true,
    publicProfile: false,
    shareUsageData: false,
  });

  const capabilities = useOpenStrandStore((state) => state.capabilities);
  const storageInfo = capabilities?.storage;
  const storageNotes = capabilities?.notes ?? [];
  const environmentMode = capabilities?.environment?.mode ?? 'cloud';
  const storagePath = storageInfo?.path ?? 'sqlite:./openstrand.db';
  const syncEnabled = Boolean(storageInfo?.syncEnabled);
  const [syncStatus, setSyncStatus] = useState<LocalSyncStatus | null>(null);
  const [syncing, setSyncing] = useState(false);
  const { openTour } = useProductTour();

  const recentVisualizations = useRecentVisualizations();
  const savedVisualizations = useSavedVisualizations();
  const {
    addVisualization: addVisualizationToWorkspace,
    saveVisualization: saveVisualizationToLibrary,
    unsaveVisualization: unsaveVisualizationFromLibrary,
    setSavedVisualizations: setSavedVisualizationsStore,
  } = useVisualizationStore();

  const getLocalSavedVisualizations = useCallback(
    () => savedVisualizations,
    [savedVisualizations]
  );

  const { isSyncing: isSyncingSavedVisualizations, syncNow: syncSavedVisualizations } =
    useSavedVisualizationsSync({
      enabled: isAuthenticated && !isLocalAuth && Boolean(user?.id),
      userId: user?.id ?? null,
      onSynced: setSavedVisualizationsStore,
      getLocalVisualizations: getLocalSavedVisualizations,
    });

  const handleCopyStoragePath = useCallback(async () => {
    if (!storagePath) {
      toast.error('Storage path unavailable.');
      return;
    }

    try {
      if (typeof navigator === 'undefined' || !navigator.clipboard) {
        throw new Error('Clipboard API not available');
      }
      await navigator.clipboard.writeText(storagePath);
      toast.success('SQLite path copied to clipboard');
    } catch (error) {
      console.error('[profile] Failed to copy storage path', error);
      toast.error('Unable to copy storage path');
    }
  }, [storagePath]);

  const {
    subscription,
    invoices,
    loading: subscriptionLoading,
    error: subscriptionError,
    openBillingPortal,
    cancelSubscription,
    refresh: refreshSubscription,
  } = useSubscription({ enabled: isAuthenticated && !isLocalAuth });

  const savedVisualizationIds = useMemo(
    () => new Set(savedVisualizations.map((viz) => viz.id)),
    [savedVisualizations]
  );

  const userProfile: UserProfile | null = user
    ? {
        id: user.id,
        email: user.email ?? 'user@example.com',
        name: user.user_metadata?.full_name ?? user.email ?? 'User',
        createdAt: user.created_at ?? new Date().toISOString(),
        plan: (subscription?.plan ?? planTier ?? 'free'),
      }
    : null;

  const usageStats = useMemo(() => {
    const dailyStats = guestSession?.usage.dailyStats ?? [];
    return {
      visualizations: {
        total: guestSession?.usage.totalVisualizations ?? recentVisualizations.length,
        thisMonth: dailyStats.reduce((sum, stat) => sum + stat.visualizations, 0),
        today: dailyStats[0]?.visualizations ?? 0,
      },
      datasets: {
        total: guestSession?.usage.totalDatasets ?? guestSession?.favorites.datasets.length ?? 0,
        uploaded: guestSession?.usage.totalDatasets ?? 0,
        fromCatalog: guestSession?.favorites.datasets.length ?? 0,
      },
      credits: {
        used: guestSession?.credits.openai.used ?? 0,
        limit: guestSession?.credits.openai.daily ?? 10,
        resetDate: guestSession?.credits.openai.resetAt ?? new Date().toISOString(),
      },
    };
  }, [guestSession, recentVisualizations.length]);

  const subscriptionStatusLabel = subscription?.status ?
    subscription.status.replace(/_/g, ' ').split(' ').map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1)).join(' ')
    : 'Free tier';
  const subscriptionRenewal = subscription?.currentPeriodEnd ? formatDate(subscription.currentPeriodEnd) : 'Not scheduled';
  const subscriptionTrialEnds = subscription?.trialEnd ? formatDate(subscription.trialEnd) : null;
  const latestInvoice = invoices.length > 0 ? invoices[0] : null;

  const handleOpenBillingPortal = useCallback(async () => {
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
      const { portalUrl } = await openBillingPortal(`${origin}/billing`);
      if (portalUrl) {
        window.location.href = portalUrl;
      } else {
        toast.error('Unable to open the billing portal.');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Unable to open the billing portal.');
    }
  }, [openBillingPortal]);

  const handleCancelSubscription = useCallback(async () => {
    if (!subscription) return;
    const confirmed = window.confirm('Cancel this subscription at the end of the current period?');
    if (!confirmed) return;
    try {
      await cancelSubscription(false);
      toast.success('Subscription will cancel at the end of the current period.');
      await refreshSubscription();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Unable to cancel subscription.');
    }
  }, [cancelSubscription, refreshSubscription, subscription]);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      setIsLoading(false);
      return;
    }
    if (isSyncingSavedVisualizations) {
      setIsLoading(true);
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated, user?.id, isSyncingSavedVisualizations]);

  useEffect(() => {
    if (isAuthenticated) {
      return;
    }
    setGuestSession(guestSessionService.getSessionForMigration());
    setIsLoading(false);
  }, [isAuthenticated]);

  useEffect(() => {
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
        if (!cancelled) {
          console.warn('[profile] Failed to load sync status', error);
        }
      }
    };

    loadStatus();

    return () => {
      cancelled = true;
    };
  }, [storageInfo]);

  const handlePreferenceChange = (key: keyof PreferencesState, value: boolean) => {
    setPreferences((prev) => ({ ...prev, [key]: value }));
    guestSessionService.updatePreferences({ [key]: value });
    setGuestSession(guestSessionService.getSessionForMigration());
  };

  const handleManualSync = useCallback(async () => {
    if (!syncEnabled) {
      toast.error('Cloud sync is disabled.');
      return;
    }

    setSyncing(true);
    try {
      await platformStorage.sync();
      if (storageInfo) {
        const status = await platformStorage.getSyncStatus();
        setSyncStatus(status);
      }
      toast.success('Workspace synced');
    } catch (error) {
      console.error('[profile] Manual sync failed', error);
      toast.error('Sync failed');
    } finally {
      setSyncing(false);
    }
  }, [syncEnabled, storageInfo]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const handleOpenVisualization = useCallback(
    (viz: Visualization) => {
      addVisualizationToWorkspace({
        ...viz,
        updatedAt: new Date().toISOString(),
      });
      toast.success('Visualization added to your workspace');
    },
    [addVisualizationToWorkspace]
  );

  const handleSaveVisualization = useCallback(
    async (viz: Visualization) => {
      saveVisualizationToLibrary(viz.id, viz);
      if (isAuthenticated && user?.id) {
        await upsertSavedVisualization(user.id, viz);
        await syncSavedVisualizations();
      } else {
        guestSessionService.addFavorite('visualizations', viz.id);
        setGuestSession(guestSessionService.getSessionForMigration());
      }
      toast.success('Visualization saved to your profile');
    },
    [isAuthenticated, saveVisualizationToLibrary, user?.id, syncSavedVisualizations]
  );

  const handleUnsaveVisualization = useCallback(
    async (viz: Visualization) => {
      unsaveVisualizationFromLibrary(viz.id);
      if (isAuthenticated && user?.id) {
        await removeSavedVisualization(user.id, viz.id);
        await syncSavedVisualizations();
      } else {
        guestSessionService.removeFavorite('visualizations', viz.id);
        setGuestSession(guestSessionService.getSessionForMigration());
      }
      toast.success('Removed from saved visualizations');
    },
    [isAuthenticated, unsaveVisualizationFromLibrary, user?.id, syncSavedVisualizations]
  );

  const renderVisualizationGallery = (
    title: string,
    description: string,
    items: Visualization[],
    emptyMessage: string,
    allowSaveToggle: boolean
  ) => (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((viz) => {
              const isSaved = savedVisualizationIds.has(viz.id);
              return (
                <div
                  key={`${title}-${viz.id}`}
                  className="rounded-lg border border-border/60 bg-card/60 p-3 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{viz.title}</p>
                      <p className="text-xs text-muted-foreground capitalize truncate">{viz.type}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
                      {formatDate(viz.createdAt)}
                    </Badge>
                  </div>
                  <PreviewBars seed={viz.title} />
                  <p className="text-xs text-muted-foreground line-clamp-2">{viz.prompt}</p>
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <Button size="sm" variant="outline" onClick={() => handleOpenVisualization(viz)}>
                      Open
                    </Button>
                    {allowSaveToggle && (
                      <Button
                        size="sm"
                        variant={isSaved ? 'secondary' : 'default'}
                        onClick={() =>
                          isSaved
                            ? handleUnsaveVisualization(viz)
                            : handleSaveVisualization(viz)
                        }
                      >
                        {isSaved ? 'Saved' : 'Save'}
                      </Button>
                    )}
                    {!allowSaveToggle && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleUnsaveVisualization(viz)}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          Loading profile...
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="mx-auto max-w-6xl space-y-6 p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <User className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold">
                {userProfile?.name ?? 'Guest Explorer'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {userProfile
                  ? `Joined ${new Date(userProfile.createdAt).toLocaleDateString()}`
                  : 'Guest session active - create an account to sync your work.'}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              {capabilities?.environment?.mode === 'offline' ? 'Local Mode' : 'Cloud Mode'}
            </Badge>
            {userProfile ? (
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </Button>
            ) : (
              <Button variant="default" size="sm" onClick={() => router.push('/auth')}>
                Create account
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Plan overview</CardTitle>
                <CardDescription>
                  {userProfile ? 'Free tier - upgrade for more features.' : 'Guest session'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Visualizations today</span>
                  <span className="text-sm font-medium">{usageStats.visualizations.today}</span>
                </div>
                <Progress
                  value={
                    Math.min(usageStats.credits.used / Math.max(usageStats.credits.limit, 1), 1) * 100
                  }
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground">
                  {usageStats.credits.limit - usageStats.credits.used} AI credits remaining. Reset{' '}
                  {formatDate(usageStats.credits.resetDate)}.
                </p>
                <Button variant="outline" size="sm" onClick={() => router.push('/pricing')}>
                  Explore plans
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick links</CardTitle>
                <CardDescription>Access common destinations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <Link href="/" className="flex items-center gap-2 text-primary hover:underline">
                  <Sparkles className="h-4 w-4" />
                  Go to dashboard
                </Link>
                <Link
                  href="/docs"
                  className="flex items-center gap-2 text-primary hover:underline"
                >
                  <Info className="h-4 w-4" />
                  Documentation
                </Link>
                <button
                  className="flex items-center gap-2 text-primary hover:underline"
                  onClick={handleCopyStoragePath}
                >
                  <Database className="h-4 w-4" />
                  Copy local storage path
                </button>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="usage">Usage</TabsTrigger>
                <TabsTrigger value="preferences">Preferences</TabsTrigger>
                <TabsTrigger value="data">Data</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4 mt-4">
                <Card>
                  <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <CardTitle className="text-lg">Subscription</CardTitle>
                      <CardDescription>Manage your workspace plan and billing</CardDescription>
                    </div>
                    <Badge variant="secondary" className="capitalize">
                      {subscriptionStatusLabel}
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <p className="text-xs uppercase text-muted-foreground">Plan</p>
                        <p className="text-sm font-semibold text-foreground">
                          {formatPlanLabel(userProfile?.plan ?? 'free')}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase text-muted-foreground">Next renewal</p>
                        <p className="text-sm text-foreground">{subscriptionRenewal}</p>
                      </div>
                      {subscriptionTrialEnds && (
                        <div>
                          <p className="text-xs uppercase text-muted-foreground">Trial ends</p>
                          <p className="text-sm text-foreground">{subscriptionTrialEnds}</p>
                        </div>
                      )}
                      {latestInvoice && (
                        <div>
                          <p className="text-xs uppercase text-muted-foreground">Latest invoice</p>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground">
                              {latestInvoice.paidAt ? formatDate(latestInvoice.paidAt) : latestInvoice.status}
                            </span>
                            {latestInvoice.invoiceUrl || latestInvoice.invoicePdf ? (
                              <a
                                href={latestInvoice.invoiceUrl ?? latestInvoice.invoicePdf ?? '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline"
                              >
                                View
                              </a>
                            ) : null}
                          </div>
                        </div>
                      )}
                    </div>

                    {subscriptionError && (
                      <Alert variant="destructive">
                        <AlertTitle>Billing sync issue</AlertTitle>
                        <AlertDescription>{subscriptionError}</AlertDescription>
                      </Alert>
                    )}

                    <div className="flex flex-wrap gap-3">
                      {isAuthenticated && !isLocalAuth && (
                        <Button size="sm" onClick={handleOpenBillingPortal} disabled={subscriptionLoading}>
                          Manage subscription
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => router.push('/billing')}>
                        View pricing
                      </Button>
                      {subscription && !subscription.cancelAtPeriodEnd && isAuthenticated && !isLocalAuth && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleCancelSubscription}
                          disabled={subscriptionLoading}
                          className="text-destructive hover:text-destructive"
                        >
                          Cancel at period end
                        </Button>
                      )}
                    </div>

                    {subscription?.cancelAtPeriodEnd && (
                      <p className="text-xs text-amber-500">
                        Cancellation is scheduled. You will retain access until {subscriptionRenewal}.
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Daily credits</CardTitle>
                    <CardDescription>
                      {userProfile
                        ? 'Credits refresh daily at midnight.'
                        : 'Create an account to sync credits across devices.'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm">
                        <Sparkles className="h-4 w-4 text-muted-foreground" />
                        <span>AI Credits</span>
                      </div>
                      <Badge variant="outline">
                        {usageStats.credits.used}/{usageStats.credits.limit}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm">
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                        <span>Visualizations</span>
                      </div>
                      <Badge variant="outline">{usageStats.visualizations.total}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm">
                        <Database className="h-4 w-4 text-muted-foreground" />
                        <span>Datasets</span>
                      </div>
                      <Badge variant="outline">{usageStats.datasets.total}</Badge>
                    </div>
                    <div className="flex items-center gap-2 pt-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      Resets at {formatDate(usageStats.credits.resetDate)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Recent activity</CardTitle>
                    <CardDescription>Your latest dataset and visualization activity</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {(guestSession?.usage.dailyStats ?? []).slice(0, 5).map((stat) => (
                      <div
                        key={stat.date}
                        className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <Activity className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-medium">{new Date(stat.date).toLocaleDateString()}</p>
                            <p className="text-xs text-muted-foreground">
                              {stat.visualizations} visualizations and {stat.datasets} datasets
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {stat.openaiCredits} credits
                        </Badge>
                      </div>
                    ))}
                    {(guestSession?.usage.dailyStats?.length ?? 0) === 0 && (
                      <p className="text-sm text-muted-foreground">
                        No activity yet. Generate a visualization to get started!
                      </p>
                    )}
                  </CardContent>
                </Card>

                {renderVisualizationGallery(
                  'Recent visualizations',
                  'Your last generated charts appear here.',
                  recentVisualizations.slice(0, 6),
                  'Generate a visualization to populate this gallery.',
                  true
                )}

                {renderVisualizationGallery(
                  'Saved visualizations',
                  'Pinned charts that stay in sync across sessions.',
                  savedVisualizations.slice(0, 6),
                  'Save a visualization to revisit it later.',
                  false
                )}
              </TabsContent>

              <TabsContent value="usage" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Usage statistics</CardTitle>
                    <CardDescription>Detailed breakdown of your account activity</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2">Visualizations</h4>
                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div>
                          <div className="text-2xl font-semibold">
                            {usageStats.visualizations.total}
                          </div>
                          <p className="text-xs text-muted-foreground">Total</p>
                        </div>
                        <div>
                          <div className="text-2xl font-semibold">
                            {usageStats.visualizations.thisMonth}
                          </div>
                          <p className="text-xs text-muted-foreground">This month</p>
                        </div>
                        <div>
                          <div className="text-2xl font-semibold">
                            {usageStats.visualizations.today}
                          </div>
                          <p className="text-xs text-muted-foreground">Today</p>
                        </div>
                      </div>
                    </div>
                    <Separator />
                    <div>
                      <h4 className="text-sm font-medium mb-2">Datasets</h4>
                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div>
                          <div className="text-2xl font-semibold">{usageStats.datasets.total}</div>
                          <p className="text-xs text-muted-foreground">Total</p>
                        </div>
                        <div>
                          <div className="text-2xl font-semibold">
                            {usageStats.datasets.uploaded}
                          </div>
                          <p className="text-xs text-muted-foreground">Uploaded</p>
                        </div>
                        <div>
                          <div className="text-2xl font-semibold">
                            {usageStats.datasets.fromCatalog}
                          </div>
                          <p className="text-xs text-muted-foreground">From catalog</p>
                        </div>
                      </div>
                    </div>
                    <Separator />
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <TrendingUp className="h-4 w-4" />
                      <span>Your visualization velocity is trending upward.</span>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="preferences" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Feature preferences</CardTitle>
                    <CardDescription>Control how the workspace behaves</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="pref-auto-insights">Auto Insights</Label>
                        <p className="text-xs text-muted-foreground">
                          Automatically generate insights for new datasets
                        </p>
                      </div>
                      <Switch
                        id="pref-auto-insights"
                        checked={preferences.autoInsights}
                        onCheckedChange={(checked) => handlePreferenceChange('autoInsights', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="pref-heuristics">Use heuristics</Label>
                        <p className="text-xs text-muted-foreground">
                          Enable fast local processing for common prompts
                        </p>
                      </div>
                      <Switch
                        id="pref-heuristics"
                        checked={preferences.useHeuristics}
                        onCheckedChange={(checked) =>
                          handlePreferenceChange('useHeuristics', checked)
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="pref-emails">Email notifications</Label>
                        <p className="text-xs text-muted-foreground">
                          Receive product updates and insights
                        </p>
                      </div>
                      <Switch
                        id="pref-emails"
                        checked={preferences.emailNotifications}
                        onCheckedChange={(checked) =>
                          setPreferences((prev) => ({ ...prev, emailNotifications: checked }))
                        }
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Account</CardTitle>
                    <CardDescription>Manage profile details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid gap-3">
                      <div className="grid gap-2">
                        <Label htmlFor="name">Name</Label>
                        <Input id="name" defaultValue={userProfile?.name ?? ''} disabled={!userProfile} />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" defaultValue={userProfile?.email ?? ''} disabled />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" disabled>
                        Save changes
                      </Button>
                      <Button size="sm" variant="outline" disabled>
                        Change password
                      </Button>
                    </div>
                    {!userProfile && (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Guest session</AlertTitle>
                        <AlertDescription>
                          Sign in or create an account to sync preferences and saved visualizations.
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="data" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Local storage</CardTitle>
                    <CardDescription>Inspect your offline workspace data and sync status.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {storageInfo ? (
                      <>
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
                        <div className="rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-xs font-mono break-all">
                          {storagePath}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button variant="ghost" size="sm" onClick={handleCopyStoragePath}>
                            <Copy className="mr-2 h-3 w-3" />
                            Copy path
                          </Button>
                          {syncEnabled && (
                            <Button variant="outline" size="sm" onClick={handleManualSync} disabled={syncing}>
                              {syncing ? (
                                'Syncing...'
                              ) : (
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
                            onClick={() => openTour({ sectionId: 'local-workspace-storage' })}
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
                                {syncStatus.lastSync
                                  ? formatDistanceToNow(syncStatus.lastSync, { addSuffix: true })
                                  : 'Never'}
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
                          <Alert variant="secondary">
                            <AlertTitle>Storage notes</AlertTitle>
                            <AlertDescription>
                              <ul className="list-disc space-y-1 pl-4">
                                {storageNotes.map((note) => (
                                  <li key={note}>{note}</li>
                                ))}
                              </ul>
                            </AlertDescription>
                          </Alert>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Storage capabilities are still loading. Refresh the page to retry.
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Saved items</CardTitle>
                    <CardDescription>Manage your datasets and visualizations</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center justify-between rounded-lg border p-3">
                        <div className="flex items-center gap-2">
                          <Heart className="h-4 w-4 text-muted-foreground" />
                          <span>Favorite datasets</span>
                        </div>
                        <Badge variant="outline">
                          {guestSession?.favorites.datasets.length ?? 0}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between rounded-lg border p-3">
                        <div className="flex items-center gap-2">
                          <Star className="h-4 w-4 text-muted-foreground" />
                          <span>Saved visualizations</span>
                        </div>
                        <Badge variant="outline">{savedVisualizations.length}</Badge>
                      </div>
                    </div>
                    <Separator />
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm">
                        <Download className="mr-2 h-4 w-4" />
                        Export data
                      </Button>
                      <Button variant="outline" size="sm">
                        <Upload className="mr-2 h-4 w-4" />
                        Import settings
                      </Button>
                      {!userProfile && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive"
                          onClick={() => {
                            guestSessionService.clearSessionAfterMigration();
                            setGuestSession(guestSessionService.getSessionForMigration());
                            toast.success('Guest session cleared');
                          }}
                        >
                          <AlertCircle className="mr-2 h-4 w-4" />
                          Clear session
                        </Button>
                      )}
                    </div>
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertTitle>Your data is secure</AlertTitle>
                      <AlertDescription>
                        {userProfile
                          ? 'Saved visualizations are synced to your account and encrypted in transit.'
                          : 'Guest data lives in your browser until you clear it or migrate to an account.'}
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}








