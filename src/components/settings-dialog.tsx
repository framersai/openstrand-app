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
  Shield,
  KeyRound,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLLMStore, LLM_PROVIDER_KEYS } from '@/store/llm-store';
import { toast } from 'react-hot-toast';
import { useOpenStrandStore } from '@/store/openstrand.store';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useFeatureFlags } from '@/lib/feature-flags';
import { useSupabase } from '@/features/auth';
import { useDashboardAutoSaveStore } from '@/store/dashboard-autosave-store';
import { Clock, History, Trash2 } from 'lucide-react';

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const AUTO_SAVE_INTERVALS = [
  { value: 15000, label: '15 seconds' },
  { value: 30000, label: '30 seconds' },
  { value: 60000, label: '1 minute' },
  { value: 120000, label: '2 minutes' },
  { value: 300000, label: '5 minutes' },
];

function AutoSaveSettingsSection() {
  const settings = useDashboardAutoSaveStore((state) => state.settings);
  const sessionHistory = useDashboardAutoSaveStore((state) => state.sessionHistory);
  const updateSettings = useDashboardAutoSaveStore((state) => state.updateSettings);
  const clearHistory = useDashboardAutoSaveStore((state) => state.clearHistory);

  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Auto-save & Session Recovery
        </h3>
        <p className="text-xs text-muted-foreground">
          Automatically save your dashboard state and restore previous sessions.
        </p>
      </div>

      <div className="space-y-3 rounded-2xl border border-border/60 bg-muted/20 p-4">
        {/* Enable Auto-save */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-sm font-medium">Enable auto-save</p>
            <p className="text-xs text-muted-foreground">
              Periodically save your dataset and visualizations
            </p>
          </div>
          <Switch
            checked={settings.enabled}
            onCheckedChange={(checked) => updateSettings({ enabled: checked })}
          />
        </div>

        <Separator className="my-2" />

        {/* Auto-save Interval */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-sm font-medium">Save interval</p>
            <p className="text-xs text-muted-foreground">
              How often to auto-save
            </p>
          </div>
          <select
            value={settings.intervalMs}
            onChange={(e) => updateSettings({ intervalMs: Number(e.target.value) })}
            disabled={!settings.enabled}
            className="rounded-md border border-border/60 bg-background px-3 py-1.5 text-sm disabled:opacity-50"
          >
            {AUTO_SAVE_INTERVALS.map((interval) => (
              <option key={interval.value} value={interval.value}>
                {interval.label}
              </option>
            ))}
          </select>
        </div>

        <Separator className="my-2" />

        {/* Show Notifications */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-sm font-medium">Show notifications</p>
            <p className="text-xs text-muted-foreground">
              Toast alerts when saving or restoring
            </p>
          </div>
          <Switch
            checked={settings.showNotifications}
            onCheckedChange={(checked) => updateSettings({ showNotifications: checked })}
          />
        </div>

        <Separator className="my-2" />

        {/* Auto-restore */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-sm font-medium">Auto-restore on load</p>
            <p className="text-xs text-muted-foreground">
              Prompt to restore your last session when you return
            </p>
          </div>
          <Switch
            checked={settings.autoRestore}
            onCheckedChange={(checked) => updateSettings({ autoRestore: checked })}
          />
        </div>

        {/* Session History */}
        {sessionHistory.length > 0 && (
          <>
            <Separator className="my-2" />
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium flex items-center gap-2">
                  <History className="h-4 w-4" />
                  Saved sessions ({sessionHistory.length})
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    clearHistory();
                    toast.success('Session history cleared');
                  }}
                  className="h-7 text-xs text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Clear all
                </Button>
              </div>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {sessionHistory.slice(0, 5).map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between text-xs p-2 rounded-lg bg-background/50"
                  >
                    <div className="truncate flex-1">
                      <span className="font-medium">{session.name}</span>
                      <span className="text-muted-foreground ml-2">
                        {session.visualizationCount} viz
                      </span>
                    </div>
                    <span className="text-muted-foreground text-[10px]">
                      {new Date(session.savedAt).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
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
  const { isTeamEdition } = useFeatureFlags();
  const { user } = useSupabase();
  const isAdmin = useMemo(() => {
    const role =
      ((user as any)?.app_metadata?.role as string | undefined) ||
      ((user as any)?.user_metadata?.role as string | undefined) ||
      '';
    return role === 'admin' || role === 'owner';
  }, [user]);
  const canEditProviderKeys = !isTeamEdition || isAdmin;
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

  const handleCopyStoragePath = async () => {
    try {
      await navigator.clipboard.writeText(storagePath);
      toast.success('SQLite path copied to clipboard');
    } catch (error) {
      console.error('Failed to copy storage path', error);
      toast.error('Unable to copy path');
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
      const statusVariant: 'default' | 'secondary' | 'outline' = active
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
      const envDetected = getResolvedApiKey(providerKey).envDetected;
      const finalApiKey = canEditProviderKeys && trimmedKey ? trimmedKey : undefined;
      const enabled = Boolean(finalApiKey) || (!preferByok && envDetected);

      configureProvider(providerKey, {
        enabled,
        apiKey: finalApiKey,
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
        <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto border-border/60 shadow-2xl">
          <CardHeader className="flex flex-col gap-2 border-b border-border/60 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Settings</CardTitle>
              <CardDescription>Configure LLM providers, appearance, and workspace preferences.</CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>

          <CardContent className="space-y-8 pt-6 pb-6">
            {capabilities?.environment?.mode === 'offline' && (
              <div className="space-y-4 rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="uppercase tracking-wide">
                    Offline mode
                  </Badge>
                  <Badge variant="outline">SQLite</Badge>
                </div>
                <div className="flex items-start gap-3">
                  <Database className="mt-0.5 h-4 w-4 text-primary" />
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Local workspace storage</p>
                    <p className="text-xs text-muted-foreground">
                      Everything stays on your device. Connect to the Teams backend or Supabase when you're ready to sync or unlock managed renderers.
                    </p>
                    <div className="rounded-md border border-border/60 bg-background/80 px-3 py-2 text-xs font-mono break-all">
                      {storagePath}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="ghost" size="sm" onClick={handleCopyStoragePath}>
                        <Copy className="mr-2 h-3 w-3" />
                        Copy path
                      </Button>
                    </div>
                  </div>
                </div>
                <Separator />
                <div className="grid gap-3 text-xs text-muted-foreground sm:grid-cols-2">
                  <div className="flex items-start gap-2">
                    <Sparkles className="mt-0.5 h-3 w-3 text-primary" />
                    <span>
                      Tier 2 and Tier 3 previews use local templates. Connect to the cloud workspace for full fidelity renderers.
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Shield className="mt-0.5 h-3 w-3 text-primary" />
                    <span>Enable optional cloud sync when you're ready to combine offline authoring with managed AI pipelines.</span>
                  </div>
                </div>
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

            <section className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-sm font-semibold">LLM providers</h3>
                  <p className="text-xs text-muted-foreground">
                    Bring your own keys or rely on detected .env defaults. We fall back to environment keys automatically unless you force BYOK mode.
                    {isTeamEdition && !isAdmin && (
                      <>
                        {' '}
                        In Team Edition, BYOK is managed by your workspace admin. Members use managed rotating keys.
                      </>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-muted-foreground">Always use BYOK keys</span>
                  <Switch
                    checked={preferByok}
                    onCheckedChange={(value) => {
                      if (!canEditProviderKeys) return;
                      setPreferByok(value);
                    }}
                    disabled={!canEditProviderKeys}
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
                            BYOK API key{isTeamEdition && !isAdmin ? ' (Admin only)' : ''}
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
                                disabled={!canEditProviderKeys}
                              />
                              <button
                                onClick={() => setShowKeys((prev) => ({ ...prev, [card.key]: !prev[card.key] }))}
                                className="absolute right-2 top-2.5 text-muted-foreground hover:text-foreground"
                                type="button"
                                disabled={!canEditProviderKeys}
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
                            {!canEditProviderKeys
                              ? 'This field is managed by your workspace admin. Contact an admin to update provider keys.'
                              : card.hasUnsavedChanges
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

            <AutoSaveSettingsSection />

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
