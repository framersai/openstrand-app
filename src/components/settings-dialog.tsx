'use client';

/**
 * @module components/settings-dialog
 * @description Settings dialog for configuring LLM providers, API keys, and preferences.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  X,
  Save,
  Eye,
  EyeOff,
  Copy,
  Database,
  Sparkles,
  BadgeCheck,
  AlertTriangle,
  KeyRound,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLLMStore, LLM_PROVIDER_KEYS } from '@/store/llm-store';
import { toast } from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { useOpenStrandStore } from '@/store/openstrand.store';
import { platformStorage, type LocalSyncStatus } from '@/services/platform/storage.service';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { TeamApiTokenManager } from '@/features/teams/components/TeamApiTokenManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import { useProductTour } from '@/providers/ProductTourProvider';

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const PROVIDER_KEYS = LLM_PROVIDER_KEYS;
type ProviderKey = (typeof LLM_PROVIDER_KEYS)[number];

const PROVIDER_LABELS: Record<ProviderKey, string> = {
  openrouter: 'OpenRouter',
  openai: 'OpenAI',
  anthropic: 'Anthropic',
};

const PROVIDER_META: Record<ProviderKey, {
  description: string;
  docsHref: string;
  docsLabel: string;
  modelOptions: { value: string; label: string }[];
}> = {
  openrouter: {
    description: 'Multi-model router with generous free plan and unified billing.',
    docsHref: 'https://openrouter.ai',
    docsLabel: 'openrouter.ai',
    modelOptions: [
      { value: 'openai/gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
      { value: 'openai/gpt-4', label: 'GPT-4' },
      { value: 'anthropic/claude-3-sonnet', label: 'Claude 3 Sonnet' },
      { value: 'google/gemini-pro', label: 'Gemini Pro' },
    ],
  },
  openai: {
    description: 'Direct access to GPT-3.5, GPT-4, and GPT-4 Turbo endpoints.',
    docsHref: 'https://platform.openai.com',
    docsLabel: 'platform.openai.com',
    modelOptions: [
      { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
      { value: 'gpt-4', label: 'GPT-4' },
      { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
    ],
  },
  anthropic: {
    description: 'Claude 3 family with best-in-class long context support.',
    docsHref: 'https://console.anthropic.com',
    docsLabel: 'console.anthropic.com',
    modelOptions: [
      { value: 'claude-3-opus', label: 'Claude 3 Opus' },
      { value: 'claude-3-sonnet', label: 'Claude 3 Sonnet' },
      { value: 'claude-3-haiku', label: 'Claude 3 Haiku' },
    ],
  },
};

const formatQuotaReset = (iso?: string) => {
  if (!iso) {
    return '';
  }
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    return '';
  }
  return `on ${parsed.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })}`;
};

/**
 * SettingsDialog component for app configuration
 */
export const SettingsDialog: React.FC<SettingsDialogProps> = ({ isOpen, onClose }) => {
  const {
    provider,
    providers,
    useHeuristics,
    setProvider,
    configureProvider,
    setUseHeuristics,
    preferByok,
    setPreferByok,
    getResolvedApiKey,
  } = useLLMStore((state) => ({
    provider: state.provider,
    providers: state.providers,
    useHeuristics: state.useHeuristics,
    setProvider: state.setProvider,
    configureProvider: state.configureProvider,
    setUseHeuristics: state.setUseHeuristics,
    preferByok: state.preferByok,
    setPreferByok: state.setPreferByok,
    getResolvedApiKey: state.getResolvedApiKey,
  }));
  const capabilities = useOpenStrandStore(state => state.capabilities);
  const artisanQuota = useOpenStrandStore(state => state.artisanQuota);
  const loadCapabilities = useOpenStrandStore(state => state.loadCapabilities);
  const loadArtisanQuota = useOpenStrandStore(state => state.loadArtisanQuota);
  const requestedCapabilitiesRef = useRef(false);
  const requestedQuotaRef = useRef(false);
  
  const [apiKeys, setApiKeys] = useState({
    openrouter: '',
    openai: '',
    anthropic: '',
  });
  
  const [showKeys, setShowKeys] = useState({
    openrouter: false,
    openai: false,
    anthropic: false,
  });
  
  const [selectedModels, setSelectedModels] = useState({
    openrouter: providers.openrouter.model || 'openai/gpt-3.5-turbo',
    openai: providers.openai.model || 'gpt-3.5-turbo',
    anthropic: providers.anthropic.model || 'claude-3-sonnet',
  });

  const storagePath = capabilities?.storage?.path ?? 'sqlite:./openstrand.db';
  const storageInfo = capabilities?.storage;
  const storagePolicy = (capabilities as any)?.storage?.policy as
    | { enforced?: boolean; teamId?: string; reason?: string }
    | undefined;
  const storageEnforced = Boolean(storagePolicy?.enforced);
  const storageNotes = capabilities?.notes ?? [];
  const environmentMode = capabilities?.environment?.mode ?? 'cloud';
  const syncEnabled = Boolean(storageInfo?.syncEnabled);
  const [syncStatus, setSyncStatus] = useState<LocalSyncStatus | null>(null);
  const [syncing, setSyncing] = useState(false);
  const { openTour } = useProductTour();
  const swaggerUrl = useMemo(() => {
    const base = process.env.NEXT_PUBLIC_API_URL || '';
    if (!base) return '/docs';
    try {
      return base.replace(/\/api\/v1\/?$/, '') + '/docs';
    } catch {
      return '/docs';
    }
  }, []);

  useEffect(() => {
    if (!isOpen || !storageInfo) {
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
        console.warn('[settings-dialog] Failed to load sync status', error);
      }
    };

    loadStatus();
    return () => {
      cancelled = true;
    };
  }, [isOpen, storageInfo]);

  // Storage & Backups (app-level) — persisted locally; admin can override org defaults
  type BackupSchedule = 'manual' | 'hourly' | 'daily' | 'weekly';
  type RemoteProvider = 'none' | 'linode' | 'aws_s3';
  const BACKUP_SETTINGS_KEY = 'openstrand.backup.settings.v1';
  const defaultTimezone = typeof Intl !== 'undefined' && Intl.DateTimeFormat ? (Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC') : 'UTC';
  const [backupSettings, setBackupSettings] = useState({
    localPaths: '',
    includeGlobs: '*.md,*.json,*.png,*.jpg,*.jpeg,*.svg',
    excludeGlobs: 'node_modules/**,.next/**,dist/**,build/**,out/**,.cache/**',
    remoteProvider: 'none' as RemoteProvider,
    s3Endpoint: 'https://us-east-1.linodeobjects.com',
    s3Region: 'us-east-1',
    s3Bucket: '',
    s3AccessKeyId: '',
    s3SecretAccessKey: '',
    s3Prefix: 'backups/',
    schedule: 'manual' as BackupSchedule,
    scheduleTime: '02:00',
    timezone: defaultTimezone,
    batchSize: 200,
    concurrency: 3,
    retentionDays: 30,
    autoSync: false,
  });

  useEffect(() => {
    if (!isOpen) return;
    try {
      const raw = localStorage.getItem(BACKUP_SETTINGS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setBackupSettings((prev) => ({ ...prev, ...parsed }));
      }
    } catch {
      // ignore
    }
  }, [isOpen]);

  const saveBackupSettings = () => {
    try {
      localStorage.setItem(BACKUP_SETTINGS_KEY, JSON.stringify(backupSettings));
      toast.success('Backup settings saved. Restart may be required to apply.');
    } catch {
      toast.error('Failed to save backup settings');
    }
  };

  const handleCopyStoragePath = async () => {
    try {
      await navigator.clipboard.writeText(storagePath);
      toast.success('SQLite path copied to clipboard');
    } catch (error) {
      console.error('Failed to copy storage path', error);
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
      console.error('[settings-dialog] Manual sync failed', error);
      toast.error('Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const providerCards = useMemo(() => {
    return PROVIDER_KEYS.map((key) => {
      const providerConfig = providers[key];
      const storedKey = providerConfig.apiKey?.trim() ?? '';
      const pendingKey = apiKeys[key].trim();
      const resolved = getResolvedApiKey(key);
      const envDetected = resolved.envDetected;
      const hasPendingKey = Boolean(pendingKey);
      const hasUnsavedChanges = hasPendingKey && pendingKey !== storedKey;
      const hasEffectiveKey = Boolean(resolved.apiKey);
      const enabled = providerConfig.enabled !== false || (!preferByok && envDetected);
      const ready = enabled && hasEffectiveKey;
      const active = provider === key;
      const statusVariant = active
        ? 'default'
        : ready
          ? 'secondary'
          : hasUnsavedChanges
            ? 'secondary'
            : envDetected && !preferByok
              ? 'secondary'
              : 'outline';
      const statusLabel = active
        ? 'Active'
        : ready
          ? 'Ready'
          : hasUnsavedChanges
            ? 'Unsaved'
            : envDetected && !preferByok
              ? 'Available (.env)'
              : 'Not configured';
      const sourceLabel = resolved.source === 'byok'
        ? 'Using BYOK key saved in settings.'
        : resolved.source === 'env'
          ? 'Using .env key detected at build time.'
          : envDetected && preferByok
            ? 'Detected .env key (BYOK override active).'
            : 'No key detected yet.';
      const sourceTone = resolved.source === 'byok'
        ? 'text-emerald-500'
        : resolved.source === 'env'
          ? 'text-sky-500'
          : envDetected
            ? 'text-amber-600'
            : 'text-destructive';

      return {
        key,
        label: PROVIDER_LABELS[key],
        storedKey,
        pendingKey,
        hasUnsavedChanges,
        envDetected,
        hasEffectiveKey,
        ready,
        active,
        statusVariant,
        statusLabel,
        sourceLabel,
        sourceTone,
        resolved,
        enabled,
      };
    });
  }, [apiKeys, getResolvedApiKey, preferByok, provider, providers]);

  const artisanStatus = useMemo(() => {
    if (!capabilities) {
      return {
        badge: 'Checking',
        badgeVariant: 'outline' as const,
        helper: 'Fetching workspace capabilities...',
      };
    }
    if (!capabilities.aiArtisan) {
      return {
        badge: 'Disabled',
        badgeVariant: 'outline' as const,
        helper: 'AI Artisan is turned off on this deployment. Enable BYOK or allow provider access to unlock it.',
      };
    }

    const activeCard = providerCards.find((card) => card.key === provider);
    if (activeCard && !activeCard.hasEffectiveKey) {
      const helper = activeCard.envDetected && preferByok
        ? `Disable "Always use BYOK keys" or add a ${activeCard.label} key below to unlock AI Artisan.`
        : `Add a ${activeCard.label} API key or supply a .env key to unlock AI Artisan.`;
      return {
        badge: 'Action needed',
        badgeVariant: 'outline' as const,
        helper,
      };
    }

    if (!artisanQuota) {
      return {
        badge: 'BYOK',
        badgeVariant: 'secondary' as const,
        helper: 'Bring your own API key for unlimited AI Artisan generations. Shared OpenStrand keys remain metered.',
      };
    }

    if (artisanQuota.limit <= 0) {
      return {
        badge: 'Unlimited BYOK',
        badgeVariant: 'secondary' as const,
        helper: 'AI Artisan generations are unlimited when you supply your own keys. Shared OpenStrand keys remain metered.',
      };
    }

    const resetLabel = formatQuotaReset(artisanQuota.resets_at);
    return {
      badge: `${artisanQuota.remaining} / ${artisanQuota.limit}`,
      badgeVariant: artisanQuota.remaining > 0 ? ('secondary' as const) : ('destructive' as const),
      helper: resetLabel ? `Quota resets ${resetLabel}.` : 'Quota resets soon.',
    };
  }, [artisanQuota, capabilities, provider, providerCards, preferByok]);

  const handleProviderSelect = (providerKey: ProviderKey) => {
    const card = providerCards.find((item) => item.key === providerKey);
    if (!card) {
      return;
    }
    if (!card.hasEffectiveKey) {
      const message = card.envDetected && preferByok
        ? `Disable "Always use BYOK keys" or add a ${card.label} key below to activate this provider.`
        : `Add your ${card.label} API key in the form below to activate this provider.`;
      toast.error(message);
      return;
    }
    setProvider(providerKey);
  };
  
  useEffect(() => {
    if (!isOpen) {
      requestedCapabilitiesRef.current = false;
      requestedQuotaRef.current = false;
      return;
    }

    setApiKeys((prev) => {
      const next = {
        openrouter: providers.openrouter.apiKey ?? '',
        openai: providers.openai.apiKey ?? '',
        anthropic: providers.anthropic.apiKey ?? '',
      };
      if (
        prev.openrouter === next.openrouter &&
        prev.openai === next.openai &&
        prev.anthropic === next.anthropic
      ) {
        return prev;
      }
      return next;
    });

    setSelectedModels((prev) => {
      const next = {
        openrouter: providers.openrouter.model || 'openai/gpt-3.5-turbo',
        openai: providers.openai.model || 'gpt-3.5-turbo',
        anthropic: providers.anthropic.model || 'claude-3-sonnet',
      };
      if (
        prev.openrouter === next.openrouter &&
        prev.openai === next.openai &&
        prev.anthropic === next.anthropic
      ) {
        return prev;
      }
      return next;
    });

    if (!capabilities) {
      if (!requestedCapabilitiesRef.current) {
        requestedCapabilitiesRef.current = true;
        void loadCapabilities();
      }
      return;
    }

    requestedCapabilitiesRef.current = false;

    const providerKey = provider as ProviderKey;
    const activeCard = providerCards.find((item) => item.key === providerKey);
    const providerReady = Boolean(activeCard?.hasEffectiveKey);

    if (capabilities.aiArtisan && providerReady && !requestedQuotaRef.current) {
      requestedQuotaRef.current = true;
      void loadArtisanQuota();
    } else if (!capabilities.aiArtisan) {
      requestedQuotaRef.current = false;
    }
  }, [isOpen, providers, capabilities, loadCapabilities, loadArtisanQuota, provider, providerCards]);
  
  if (!isOpen) return null;
  
  const handleSave = async () => {
    const trimmedKeys = PROVIDER_KEYS.reduce((acc, key) => {
      acc[key] = apiKeys[key].trim();
      return acc;
    }, {} as Record<ProviderKey, string>);

    setApiKeys(trimmedKeys);

    PROVIDER_KEYS.forEach((providerKey) => {
      const trimmedKey = trimmedKeys[providerKey];
      const model = selectedModels[providerKey];
      const enabled = Boolean(trimmedKey);

      configureProvider(providerKey, {
        enabled,
        apiKey: enabled ? trimmedKey : undefined,
        model,
      });
    });

    const availableProviders = PROVIDER_KEYS.filter((key) => {
      if (trimmedKeys[key]) {
        return true;
      }
      const resolved = getResolvedApiKey(key);
      return !preferByok && resolved.envDetected;
    });

    if (availableProviders.length === 0) {
      useOpenStrandStore.setState({ artisanQuota: null });
    } else if (!availableProviders.includes(provider as ProviderKey)) {
      setProvider(availableProviders[0]);
    }

    toast.success('Settings saved successfully');

    const capabilitiesSnapshot = await loadCapabilities();
    if (capabilitiesSnapshot?.aiArtisan && availableProviders.length > 0) {
      await loadArtisanQuota();
    }

    onClose();
  };
  
  return (
    <TooltipProvider>
      <div className="fixed inset-0 z-[80] flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto border-border/60 shadow-2xl">
          <CardHeader className="flex flex-col gap-2 border-b border-border/60 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Settings</CardTitle>
              <CardDescription>Configure LLM providers, appearance, and workspace preferences.</CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>

          <CardContent className="space-y-6 pt-6 pb-6">
            <Tabs defaultValue="general" className="w-full">
              <TabsList className="mb-2">
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="ai">AI providers</TabsTrigger>
                <TabsTrigger value="storage">Storage & backups</TabsTrigger>
                <TabsTrigger value="integrations">Integrations</TabsTrigger>
                <TabsTrigger value="docs">Docs</TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="space-y-8">
                {storageInfo && (
                  <div className="space-y-4 rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="uppercase tracking-wide">
                    {environmentMode === 'offline' ? 'Offline mode' : 'Storage'}
                  </Badge>
                  {storageInfo.kind && <Badge variant="outline">{storageInfo.kind}</Badge>}
                    {storageEnforced && (
                      <Badge variant="outline" className="border-amber-400 text-amber-700">Admin enforced</Badge>
                    )}
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
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Database className="mt-0.5 h-4 w-4 text-primary" />
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Local workspace storage</p>
                      <p className="text-xs text-muted-foreground">
                        Everything stays on your device. Connect to Teams or Supabase when you're ready to enable managed renderers and cloud backups.
                      </p>
                      <div className="rounded-md border border-border/60 bg-background/80 px-3 py-2 text-xs font-mono break-all">
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
                    </div>
                  </div>
                  {syncStatus ? (
                    <div className="grid gap-3 text-xs text-muted-foreground sm:grid-cols-2">
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
                      {syncStatus.conflicts.length > 0 && (
                        <div className="sm:col-span-2 flex items-center gap-2 text-destructive">
                          <AlertTriangle className="h-3 w-3" />
                          {syncStatus.conflicts.join(', ')}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">Checking sync status...</p>
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
                </div>
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
                  </div>
                )}

                <section className="space-y-3">
              <div>
                <h3 className="text-sm font-semibold">Theme & appearance</h3>
                <p className="text-xs text-muted-foreground">
                  Choose a base theme and toggle light, dark, or system mode. Changes apply immediately across the app.
                </p>
              </div>
              <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
                <ThemeSwitcher
                  buttonVariant="outline"
                  buttonSize="sm"
                  showLabel
                  tooltip="Open theme palette"
                />
                <div className="text-xs text-muted-foreground sm:max-w-[55%]">
                  Use the palette menu to preview branded presets, then switch between light, dark, or system modes without leaving the dialog.
                </div>
              </div>
                </section>

                <section className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-sm font-semibold">AI Artisan status</h3>
                  <p className="text-xs text-muted-foreground">{artisanStatus.helper}</p>
                  {artisanQuota?.plan && (
                    <p className="mt-1 text-xs text-muted-foreground">Plan allowance: {artisanQuota.plan}</p>
                  )}
                </div>
                <Badge variant={artisanStatus.badgeVariant} className="self-start uppercase">
                  {artisanStatus.badge}
                </Badge>
              </div>
                </section>
              </TabsContent>

              <TabsContent value="ai" className="space-y-6">
                <section className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-sm font-semibold">LLM providers</h3>
                  <p className="text-xs text-muted-foreground">
                    Bring your own keys or rely on detected .env defaults. We fall back to environment keys automatically unless you force BYOK mode.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-muted-foreground">Always use BYOK keys</span>
                  <Switch
                    checked={preferByok}
                    onCheckedChange={(value) => setPreferByok(value)}
                    aria-label="Toggle BYOK preference"
                  />
                </div>
              </div>

              <div className="space-y-3 rounded-2xl border border-border/60 bg-muted/20 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">Environment detection</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {providerCards.map((card) => (
                    <div
                      key={`${card.key}-env`}
                      className="flex items-center justify-between rounded-lg border border-border/50 bg-background/80 px-3 py-2 text-xs"
                    >
                      <div className="flex items-center gap-2 font-medium">
                        {card.envDetected ? (
                          <BadgeCheck className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-amber-600" />
                        )}
                        {card.label}
                      </div>
                      <span className={cn('font-semibold', card.envDetected ? 'text-emerald-500' : 'text-amber-600')}>
                        {card.envDetected ? 'Detected' : 'Missing'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4">
                {providerCards.map((card) => {
                  const meta = PROVIDER_META[card.key];
                  return (
                    <div
                      key={card.key}
                      className={cn(
                        'rounded-2xl border bg-background/95 p-4 shadow-sm transition',
                        card.active ? 'border-primary/50 shadow-lg' : 'border-border/60 hover:border-primary/40'
                      )}
                    >
                      <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold">{card.label}</span>
                              <Badge variant={card.statusVariant} className="text-[10px] uppercase tracking-wide">
                                {card.statusLabel}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">{meta.description}</p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleProviderSelect(card.key)}
                            disabled={!card.hasEffectiveKey || card.active}
                          >
                            {card.active ? 'Current provider' : 'Set active'}
                          </Button>
                        </div>

                        <div className="grid gap-3 rounded-xl border border-border/60 bg-muted/20 p-3 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-2 font-medium text-muted-foreground">
                              <BadgeCheck className={cn('h-4 w-4', card.envDetected ? 'text-emerald-500' : 'text-amber-600')} />
                              .env detection
                            </span>
                            <span className={cn('font-semibold', card.envDetected ? 'text-emerald-500' : 'text-amber-600')}>
                              {card.envDetected ? 'Detected' : 'Missing'}
                            </span>
                          </div>
                          <Separator />
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-2 font-medium text-muted-foreground">
                              <KeyRound className={cn('h-4 w-4', card.hasEffectiveKey ? 'text-emerald-500' : 'text-amber-600')} />
                              Key source
                            </span>
                            <span className={cn('font-semibold', card.sourceTone)}>{card.sourceLabel}</span>
                          </div>
                          {preferByok && card.envDetected && card.resolved.source === 'none' && (
                            <div className="flex items-start gap-2 text-amber-600">
                              <AlertTriangle className="mt-0.5 h-3.5 w-3.5" />
                              <span>
                                Disable "Always use BYOK keys" to fall back to the detected .env key for {card.label}.
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="space-y-3 rounded-xl border border-border/60 bg-background/80 p-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-xs font-semibold uppercase tracking-[0.3em]">
                              BYOK API key
                            </span>
                            <a
                              href={meta.docsHref}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-xs font-medium text-primary"
                            >
                              <Shield className="h-3.5 w-3.5" />
                              {meta.docsLabel}
                            </a>
                          </div>
                          <div className="flex flex-col gap-2 sm:flex-row">
                            <div className="relative flex-1">
                              <input
                                type={showKeys[card.key] ? 'text' : 'password'}
                                value={apiKeys[card.key]}
                                onChange={(e) => setApiKeys((prev) => ({ ...prev, [card.key]: e.target.value }))}
                                placeholder={card.key === 'openrouter' ? 'sk-or-...' : card.key === 'anthropic' ? 'sk-ant-...' : 'sk-...'}
                                className="w-full rounded-md border border-border/60 bg-background px-3 py-2"
                              />
                              <button
                                onClick={() => setShowKeys((prev) => ({ ...prev, [card.key]: !prev[card.key] }))}
                                className="absolute right-2 top-2.5 text-muted-foreground hover:text-foreground"
                                type="button"
                              >
                                {showKeys[card.key] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}                    
                              </button>
                            </div>
                            <select
                              value={selectedModels[card.key]}
                              onChange={(e) => setSelectedModels((prev) => ({ ...prev, [card.key]: e.target.value }))}
                              className="rounded-md border border-border/60 bg-background px-3 py-2 text-sm"
                            >
                              {meta.modelOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {card.hasUnsavedChanges
                              ? 'Unsaved changes detected. Save settings to apply your BYOK key.'
                              : 'Leave blank to rely on detected .env keys when available.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-sm font-semibold">Docs & maintenance</h3>
                  <p className="text-xs text-muted-foreground">Quick links to environment, billing, storage and API reference.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <a className="text-xs text-primary hover:underline" href={swaggerUrl} target="_blank" rel="noreferrer">API Docs (Swagger)</a>
                  <a className="text-xs text-primary hover:underline" href="https://github.com/framersai/openstrand/tree/main/docs/BILLING_AND_RATE_LIMITS.md" target="_blank" rel="noreferrer">Billing & limits</a>
                  <a className="text-xs text-primary hover:underline" href="https://github.com/framersai/openstrand/tree/main/docs/STORAGE_AND_BACKUPS.md" target="_blank" rel="noreferrer">Storage & backups</a>
                  <a className="text-xs text-primary hover:underline" href="https://github.com/framersai/openstrand/tree/main/docs/ENVIRONMENT.md" target="_blank" rel="noreferrer">Environment</a>
                </div>
              </div>
              <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 text-xs text-muted-foreground">
                For team admins, the administrative APIs are visible in Swagger. Use Team API tokens (below) to integrate CI and notebooks.
              </div>
            </section>

            <section className="space-y-3">
              <div>
                <h3 className="text-sm font-semibold">Prompt parsing mode</h3>
                <p className="text-xs text-muted-foreground">
                  By default every prompt flows directly to your selected LLM. Enable Heuristic Assist for quick, local interpretations before falling back to the model.
                </p>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-muted/20 p-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    {useHeuristics ? 'Heuristic Assist (enabled)' : 'LLM-first (default)'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {useHeuristics
                      ? 'Common patterns are fulfilled locally and only novel prompts hit the LLM.'
                      : 'Every request uses your configured model, ideal for richer schema intelligence.'}
                  </p>
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setUseHeuristics(!useHeuristics)}
                      className={cn(
                        'relative h-6 w-12 rounded-full transition-colors',
                        useHeuristics ? 'bg-primary' : 'bg-muted'
                      )}
                      aria-label="Toggle heuristic assist"
                      type="button"
                    >
                      <span
                        className={cn(
                          'absolute top-0.5 h-5 w-5 rounded-full bg-background shadow-sm transition-transform',
                          useHeuristics ? 'translate-x-6' : 'translate-x-1'
                        )}
                      />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    Heuristic Assist runs lightweight heuristics and static analysis before falling back to the LLM.
                  </TooltipContent>
                </Tooltip>
              </div>
                </section>
              </TabsContent>

              <TabsContent value="storage" className="space-y-6">
                <section className="space-y-3">
                  <div>
                    <h3 className="text-sm font-semibold">Storage & backups</h3>
                    <p className="text-xs text-muted-foreground">
                      Configure local folders, remote destination, schedule, filters and retention.
                      {storageEnforced && (
                        <span className="ml-2 text-amber-600">Team admin has enforced a storage policy; personal overrides are disabled.</span>
                      )}
                    </p>
                  </div>
                  <div className="grid gap-4 rounded-2xl border border-border/60 bg-muted/20 p-4">
                    <div className="grid gap-2">
                      <label className="text-xs font-medium">Local folders (comma-separated)</label>
                      <input
                        className="w-full rounded-md border border-border/60 bg-background px-3 py-2 text-sm"
                        placeholder="C:/Users/johnn/Documents|~/OpenStrand"
                        value={backupSettings.localPaths}
                        onChange={(e) => setBackupSettings((s) => ({ ...s, localPaths: e.target.value }))}
                        disabled={storageEnforced}
                      />
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div className="grid gap-2">
                        <label className="text-xs font-medium">Include globs</label>
                        <input
                          className="w-full rounded-md border border-border/60 bg-background px-3 py-2 text-sm"
                          value={backupSettings.includeGlobs}
                          onChange={(e) => setBackupSettings((s) => ({ ...s, includeGlobs: e.target.value }))}
                          disabled={storageEnforced}
                        />
                      </div>
                      <div className="grid gap-2">
                        <label className="text-xs font-medium">Exclude globs</label>
                        <input
                          className="w-full rounded-md border border-border/60 bg-background px-3 py-2 text-sm"
                          value={backupSettings.excludeGlobs}
                          onChange={(e) => setBackupSettings((s) => ({ ...s, excludeGlobs: e.target.value }))}
                          disabled={storageEnforced}
                        />
                      </div>
                    </div>
                    <Separator />
                    <div className="grid gap-4">
                      <div className="grid gap-2 sm:grid-cols-2">
                        <div className="grid gap-2">
                          <label className="text-xs font-medium">Remote provider</label>
                          <select
                            className="rounded-md border border-border/60 bg-background px-3 py-2 text-sm"
                            value={backupSettings.remoteProvider}
                            onChange={(e) => setBackupSettings((s) => ({ ...s, remoteProvider: e.target.value as RemoteProvider }))}
                            disabled={storageEnforced}
                          >
                            <option value="none">None (local only)</option>
                            <option value="linode">Linode Object Storage (S3-compatible)</option>
                            <option value="aws_s3">AWS S3</option>
                          </select>
                        </div>
                        <div className="grid gap-2">
                          <label className="text-xs font-medium">Endpoint (S3-compatible)</label>
                          <input
                            className="w-full rounded-md border border-border/60 bg-background px-3 py-2 text-sm"
                            value={backupSettings.s3Endpoint}
                            onChange={(e) => setBackupSettings((s) => ({ ...s, s3Endpoint: e.target.value }))}
                            disabled={storageEnforced}
                          />
                        </div>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-3">
                        <div className="grid gap-2">
                          <label className="text-xs font-medium">Region</label>
                          <input
                            className="w-full rounded-md border border-border/60 bg-background px-3 py-2 text-sm"
                            value={backupSettings.s3Region}
                            onChange={(e) => setBackupSettings((s) => ({ ...s, s3Region: e.target.value }))}
                            disabled={storageEnforced}
                          />
                        </div>
                        <div className="grid gap-2">
                          <label className="text-xs font-medium">Bucket</label>
                          <input
                            className="w-full rounded-md border border-border/60 bg-background px-3 py-2 text-sm"
                            value={backupSettings.s3Bucket}
                            onChange={(e) => setBackupSettings((s) => ({ ...s, s3Bucket: e.target.value }))}
                            disabled={storageEnforced}
                          />
                        </div>
                        <div className="grid gap-2">
                          <label className="text-xs font-medium">Key prefix</label>
                          <input
                            className="w-full rounded-md border border-border/60 bg-background px-3 py-2 text-sm"
                            value={backupSettings.s3Prefix}
                            onChange={(e) => setBackupSettings((s) => ({ ...s, s3Prefix: e.target.value }))}
                            disabled={storageEnforced}
                          />
                        </div>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <div className="grid gap-2">
                          <label className="text-xs font-medium">Access key ID</label>
                          <input
                            className="w-full rounded-md border border-border/60 bg-background px-3 py-2 text-sm"
                            value={backupSettings.s3AccessKeyId}
                            onChange={(e) => setBackupSettings((s) => ({ ...s, s3AccessKeyId: e.target.value }))}
                            disabled={storageEnforced}
                          />
                        </div>
                        <div className="grid gap-2">
                          <label className="text-xs font-medium">Secret access key</label>
                          <input
                            type="password"
                            className="w-full rounded-md border border-border/60 bg-background px-3 py-2 text-sm"
                            value={backupSettings.s3SecretAccessKey}
                            onChange={(e) => setBackupSettings((s) => ({ ...s, s3SecretAccessKey: e.target.value }))}
                            disabled={storageEnforced}
                          />
                        </div>
                      </div>
                    </div>
                    <Separator />
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="grid gap-2">
                        <label className="text-xs font-medium">Schedule</label>
                        <select
                          className="rounded-md border border-border/60 bg-background px-3 py-2 text-sm"
                          value={backupSettings.schedule}
                          onChange={(e) => setBackupSettings((s) => ({ ...s, schedule: e.target.value as BackupSchedule }))}
                          disabled={storageEnforced}
                        >
                          <option value="manual">Manual</option>
                          <option value="hourly">Hourly</option>
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                        </select>
                      </div>
                      <div className="grid gap-2">
                        <label className="text-xs font-medium">Time (HH:MM)</label>
                        <input
                          className="w-full rounded-md border border-border/60 bg-background px-3 py-2 text-sm"
                          value={backupSettings.scheduleTime}
                          onChange={(e) => setBackupSettings((s) => ({ ...s, scheduleTime: e.target.value }))}
                          disabled={storageEnforced}
                        />
                      </div>
                      <div className="grid gap-2">
                        <label className="text-xs font-medium">Timezone</label>
                        <input
                          className="w-full rounded-md border border-border/60 bg-background px-3 py-2 text-sm"
                          value={backupSettings.timezone}
                          onChange={(e) => setBackupSettings((s) => ({ ...s, timezone: e.target.value }))}
                          disabled={storageEnforced}
                        />
                      </div>
                      <div className="grid gap-2">
                        <label className="text-xs font-medium">Batch size</label>
                        <input
                          type="number"
                          className="w-full rounded-md border border-border/60 bg-background px-3 py-2 text-sm"
                          value={backupSettings.batchSize}
                          onChange={(e) => setBackupSettings((s) => ({ ...s, batchSize: Number(e.target.value || 0) }))}
                          disabled={storageEnforced}
                        />
                      </div>
                      <div className="grid gap-2">
                        <label className="text-xs font-medium">Concurrency</label>
                        <input
                          type="number"
                          className="w-full rounded-md border border-border/60 bg-background px-3 py-2 text-sm"
                          value={backupSettings.concurrency}
                          onChange={(e) => setBackupSettings((s) => ({ ...s, concurrency: Number(e.target.value || 0) }))}
                          disabled={storageEnforced}
                        />
                      </div>
                      <div className="grid gap-2">
                        <label className="text-xs font-medium">Retention (days)</label>
                        <input
                          type="number"
                          className="w-full rounded-md border border-border/60 bg-background px-3 py-2 text-sm"
                          value={backupSettings.retentionDays}
                          onChange={(e) => setBackupSettings((s) => ({ ...s, retentionDays: Number(e.target.value || 0) }))}
                          disabled={storageEnforced}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={backupSettings.autoSync}
                          onCheckedChange={(v) => setBackupSettings((s) => ({ ...s, autoSync: v }))}
                          aria-label="Toggle autosync"
                          disabled={storageEnforced}
                        />
                        <span className="text-xs text-muted-foreground">Auto-sync in background</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={saveBackupSettings} disabled={storageEnforced}>
                        Save backup settings
                      </Button>
                      <Button variant="ghost" size="sm" onClick={handleManualSync} disabled={syncing || !syncEnabled}>
                        {syncing ? 'Running…' : 'Run backup now'}
                      </Button>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      These settings are stored locally for this device. Admin org defaults can override in the Admin dashboard.
                    </p>
                  </div>
                </section>

                <section className="space-y-3">
                  <div>
                    <h3 className="text-sm font-semibold">Prompt parsing mode</h3>
                    <p className="text-xs text-muted-foreground">
                      By default every prompt flows directly to your selected LLM. Enable Heuristic Assist for quick, local interpretations before falling back to the model.
                    </p>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-muted/20 p-4">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">
                        {useHeuristics ? 'Heuristic Assist (enabled)' : 'LLM-first (default)'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {useHeuristics
                          ? 'Common patterns are fulfilled locally and only novel prompts hit the LLM.'
                          : 'Every request uses your configured model, ideal for richer schema intelligence.'}
                      </p>
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => setUseHeuristics(!useHeuristics)}
                          className={cn(
                            'relative h-6 w-12 rounded-full transition-colors',
                            useHeuristics ? 'bg-primary' : 'bg-muted'
                          )}
                          aria-label="Toggle heuristic assist"
                          type="button"
                        >
                          <span
                            className={cn(
                              'absolute top-0.5 h-5 w-5 rounded-full bg-background shadow-sm transition-transform',
                              useHeuristics ? 'translate-x-6' : 'translate-x-1'
                            )}
                          />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        Heuristic Assist runs lightweight heuristics and static analysis before falling back to the LLM.
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </section>
              </TabsContent>

              <TabsContent value="integrations" className="space-y-3">
              <div>
                <h3 className="text-sm font-semibold">Integrations & API tokens</h3>
                <p className="text-xs text-muted-foreground">Generate scoped tokens for automation. Tokens inherit team plan limits and appear in audit logs.</p>
              </div>
              <TeamApiTokenManager />
              </TabsContent>

              <TabsContent value="docs" className="space-y-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-sm font-semibold">Docs & maintenance</h3>
                    <p className="text-xs text-muted-foreground">Quick links to environment, billing, storage and API reference.</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <a className="text-xs text-primary hover:underline" href={swaggerUrl} target="_blank" rel="noreferrer">API Docs (Swagger)</a>
                    <a className="text-xs text-primary hover:underline" href="https://github.com/framersai/openstrand/tree/main/docs/BILLING_AND_RATE_LIMITS.md" target="_blank" rel="noreferrer">Billing & limits</a>
                    <a className="text-xs text-primary hover:underline" href="https://github.com/framersai/openstrand/tree/main/docs/STORAGE_AND_BACKUPS.md" target="_blank" rel="noreferrer">Storage & backups</a>
                    <a className="text-xs text-primary hover:underline" href="https://github.com/framersai/openstrand/tree/main/docs/ENVIRONMENT.md" target="_blank" rel="noreferrer">Environment</a>
                  </div>
                </div>
                <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 text-xs text-muted-foreground">
                  For team admins, the administrative APIs are visible in Swagger. Use Team API tokens (Integrations) to integrate CI and notebooks.
                </div>
              </TabsContent>

            </Tabs>

            <div className="flex justify-end gap-2 border-t border-border/60 pt-4">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                <Save className="mr-2 h-4 w-4" />
                Save settings
              </Button>
            </div>
          </CardContent>
      </Card>
      </div>
    </TooltipProvider>
  );
};
