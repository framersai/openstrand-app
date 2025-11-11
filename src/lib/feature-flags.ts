/**
 * @module FeatureFlags
 * @description Feature flag system for controlling personal vs team edition features
 */

import { createElement, useMemo } from 'react';
import type { ComponentType, ReactNode } from 'react';

import { useSupabase } from '@/features/auth';
import { useOpenStrandStore } from '@/store/openstrand.store';
import { normalizePlanTier } from '@/lib/plan-info';

/** Application deployment variant */
export type AppVariant = 'personal' | 'team';

/** User subscription plans */
export type UserPlan = 'free' | 'cloud' | 'pro' | 'team' | 'enterprise';

/** Feature availability configuration */
export interface FeatureConfig {
  coreKnowledgeManagement: boolean;
  basicVisualizations: boolean;
  importExport: boolean;
  offlineMode: boolean;

  teamWorkspaces: boolean;
  collaboration: boolean;
  sharedKnowledgeBases: boolean;
  teamAnalytics: boolean;
  realTimePresence: boolean;
  domainManagement: boolean;
  storageAdapters: boolean;

  aiArtisan: boolean;
  schemaIntelligence: boolean;
  publisher: boolean;
  customPipelines: boolean;
  promptChaining: boolean;

  externalIntegrations: boolean;
  supabaseSync: boolean;
  advancedImport: boolean;

  voiceNotes: boolean;
  multimediaAttachments: boolean;
  attachmentTranscription: boolean;
}

/** Feature flag configuration mapped by variant + plan. */
const FEATURE_CONFIG: Record<AppVariant, Record<UserPlan, FeatureConfig>> = {
  personal: {
    free: {
      coreKnowledgeManagement: true,
      basicVisualizations: true,
      importExport: true,
      offlineMode: true,

      teamWorkspaces: false,
      collaboration: false,
      sharedKnowledgeBases: false,
      teamAnalytics: false,
      realTimePresence: false,
      domainManagement: false,
      storageAdapters: false,

      aiArtisan: true,
      schemaIntelligence: true,
      publisher: false,
      customPipelines: false,
      promptChaining: false,

      externalIntegrations: false,
      supabaseSync: false,
      advancedImport: true,

      voiceNotes: true,
      multimediaAttachments: true,
      attachmentTranscription: true,
    },
    cloud: {
      coreKnowledgeManagement: true,
      basicVisualizations: true,
      importExport: true,
      offlineMode: true,

      teamWorkspaces: false,
      collaboration: false,
      sharedKnowledgeBases: false,
      teamAnalytics: false,
      realTimePresence: false,
      domainManagement: false,
      storageAdapters: true,

      aiArtisan: true,
      schemaIntelligence: true,
      publisher: true,
      customPipelines: false,
      promptChaining: true,

      externalIntegrations: true,
      supabaseSync: true,
      advancedImport: true,

      voiceNotes: true,
      multimediaAttachments: true,
      attachmentTranscription: true,
    },
    pro: {
      coreKnowledgeManagement: true,
      basicVisualizations: true,
      importExport: true,
      offlineMode: true,

      teamWorkspaces: false,
      collaboration: false,
      sharedKnowledgeBases: false,
      teamAnalytics: false,
      realTimePresence: false,
      domainManagement: false,
      storageAdapters: true,

      aiArtisan: true,
      schemaIntelligence: true,
      publisher: true,
      customPipelines: false,
      promptChaining: true,

      externalIntegrations: true,
      supabaseSync: true,
      advancedImport: true,

      voiceNotes: true,
      multimediaAttachments: true,
      attachmentTranscription: true,
    },
    team: {
      coreKnowledgeManagement: true,
      basicVisualizations: true,
      importExport: true,
      offlineMode: true,

      teamWorkspaces: true,
      collaboration: true,
      sharedKnowledgeBases: true,
      teamAnalytics: true,
      realTimePresence: true,
      domainManagement: true,
      storageAdapters: true,

      aiArtisan: true,
      schemaIntelligence: true,
      publisher: true,
      customPipelines: true,
      promptChaining: true,

      externalIntegrations: true,
      supabaseSync: true,
      advancedImport: true,

      voiceNotes: true,
      multimediaAttachments: true,
      attachmentTranscription: true,
    },
    enterprise: {
      coreKnowledgeManagement: true,
      basicVisualizations: true,
      importExport: true,
      offlineMode: true,

      teamWorkspaces: true,
      collaboration: true,
      sharedKnowledgeBases: true,
      teamAnalytics: true,
      realTimePresence: true,
      domainManagement: true,
      storageAdapters: true,

      aiArtisan: true,
      schemaIntelligence: true,
      publisher: true,
      customPipelines: true,
      promptChaining: true,

      externalIntegrations: true,
      supabaseSync: true,
      advancedImport: true,

      voiceNotes: true,
      multimediaAttachments: true,
      attachmentTranscription: true,
    },
  },
  team: {
    free: {
      coreKnowledgeManagement: true,
      basicVisualizations: true,
      importExport: true,
      offlineMode: true,

      teamWorkspaces: true,
      collaboration: true,
      sharedKnowledgeBases: true,
      teamAnalytics: false,
      realTimePresence: true,
      domainManagement: true,
      storageAdapters: true,

      aiArtisan: true,
      schemaIntelligence: true,
      publisher: true,
      customPipelines: false,
      promptChaining: true,

      externalIntegrations: true,
      supabaseSync: true,
      advancedImport: true,

      voiceNotes: true,
      multimediaAttachments: true,
      attachmentTranscription: true,
    },
    cloud: {
      coreKnowledgeManagement: true,
      basicVisualizations: true,
      importExport: true,
      offlineMode: true,

      teamWorkspaces: true,
      collaboration: true,
      sharedKnowledgeBases: true,
      teamAnalytics: true,
      realTimePresence: true,
      domainManagement: true,
      storageAdapters: true,

      aiArtisan: true,
      schemaIntelligence: true,
      publisher: true,
      customPipelines: true,
      promptChaining: true,

      externalIntegrations: true,
      supabaseSync: true,
      advancedImport: true,

      voiceNotes: true,
      multimediaAttachments: true,
      attachmentTranscription: true,
    },
    pro: {
      coreKnowledgeManagement: true,
      basicVisualizations: true,
      importExport: true,
      offlineMode: true,

      teamWorkspaces: true,
      collaboration: true,
      sharedKnowledgeBases: true,
      teamAnalytics: true,
      realTimePresence: true,
      domainManagement: true,
      storageAdapters: true,

      aiArtisan: true,
      schemaIntelligence: true,
      publisher: true,
      customPipelines: true,
      promptChaining: true,

      externalIntegrations: true,
      supabaseSync: true,
      advancedImport: true,

      voiceNotes: true,
      multimediaAttachments: true,
      attachmentTranscription: true,
    },
    team: {
      coreKnowledgeManagement: true,
      basicVisualizations: true,
      importExport: true,
      offlineMode: true,

      teamWorkspaces: true,
      collaboration: true,
      sharedKnowledgeBases: true,
      teamAnalytics: true,
      realTimePresence: true,
      domainManagement: true,
      storageAdapters: true,

      aiArtisan: true,
      schemaIntelligence: true,
      publisher: true,
      customPipelines: true,
      promptChaining: true,

      externalIntegrations: true,
      supabaseSync: true,
      advancedImport: true,

      voiceNotes: true,
      multimediaAttachments: true,
      attachmentTranscription: true,
    },
    enterprise: {
      coreKnowledgeManagement: true,
      basicVisualizations: true,
      importExport: true,
      offlineMode: true,

      teamWorkspaces: true,
      collaboration: true,
      sharedKnowledgeBases: true,
      teamAnalytics: true,
      realTimePresence: true,
      domainManagement: true,
      storageAdapters: true,

      aiArtisan: true,
      schemaIntelligence: true,
      publisher: true,
      customPipelines: true,
      promptChaining: true,

      externalIntegrations: true,
      supabaseSync: true,
      advancedImport: true,

      voiceNotes: true,
      multimediaAttachments: true,
      attachmentTranscription: true,
    },
  },
};

function normalizeUserPlan(value?: string | null): UserPlan {
  const normalized = normalizePlanTier(value ?? undefined);
  switch (normalized) {
    case 'free':
    case 'cloud':
    case 'pro':
    case 'team':
    case 'enterprise':
      return normalized;
    case 'basic' as PlanTier:
      return 'cloud';
    default:
      return 'free';
  }
}

/** Environment controls for selecting variant */
export function getAppVariant(): AppVariant {
  if (process.env.NEXT_PUBLIC_APP_VARIANT === 'team') {
    return 'team';
  }
  return 'personal';
}

/** Retrieve feature config based on variant & plan */
export function getFeatureConfig(variant: AppVariant, plan: UserPlan): FeatureConfig {
  return FEATURE_CONFIG[variant][plan];
}

/** React hook for accessing feature flags */
export function useFeatureFlags() {
  const { planTier } = useSupabase();
  const capabilities = useOpenStrandStore((state) => state.capabilities);

  const variant = useMemo<AppVariant>(() => {
    const envVariant = getAppVariant();
    const environmentMode = capabilities?.environment?.mode;
    if (envVariant === 'team' && environmentMode === 'offline') {
      return 'personal';
    }
    return envVariant;
  }, [capabilities?.environment?.mode]);

  const capabilityPlan = (capabilities?.environment as { plan?: string | null } | undefined)?.plan;
  const resolvedPlan = useMemo<UserPlan>(
    () => normalizeUserPlan(capabilityPlan ?? planTier ?? 'free'),
    [capabilityPlan, planTier],
  );

  const features = useMemo(() => {
    const base = getFeatureConfig(variant, resolvedPlan);
    if (typeof capabilities?.aiArtisan === 'boolean') {
      return {
        ...base,
        aiArtisan: capabilities.aiArtisan,
      };
    }
    return base;
  }, [variant, resolvedPlan, capabilities?.aiArtisan]);

  return {
    variant,
    userPlan: resolvedPlan,
    features,
    isTeamEdition: variant === 'team',
    isPersonalEdition: variant === 'personal',
    canUseAI: features.aiArtisan,
    canCollaborate: features.collaboration,
    hasTeamFeatures: features.teamWorkspaces,
  };
}

/** Component wrapper that conditionally renders based on features */
export function FeatureFlag({
  feature,
  children,
  fallback = null,
}: {
  feature: keyof FeatureConfig;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { features } = useFeatureFlags();

  return features[feature] ? children ?? null : fallback ?? null;
}

/** HOC for feature-gated components */
export function withFeatureFlag<P extends object>(
  Component: ComponentType<P>,
  feature: keyof FeatureConfig,
  Fallback?: ComponentType<P>
) {
  return function FeatureGatedComponent(props: P) {
    const { features } = useFeatureFlags();

    if (features[feature]) {
      return createElement(Component, props);
    }

    if (Fallback) {
      return createElement(Fallback, props);
    }

    return null;
  };
}

/** Utility to check if a feature should be visible in navigation */
export function shouldShowInNav(feature: keyof FeatureConfig): boolean {
  const alwaysShow: Array<keyof FeatureConfig> = [
    'coreKnowledgeManagement',
    'basicVisualizations',
    'importExport',
  ];

  if (alwaysShow.includes(feature)) {
    return true;
  }

  if (isTeamEdition()) {
    const teamUpsellFeatures: Array<keyof FeatureConfig> = [
      'teamWorkspaces',
      'collaboration',
      'sharedKnowledgeBases',
      'teamAnalytics',
      'realTimePresence',
    ];

    if (teamUpsellFeatures.includes(feature)) {
      return true;
    }
  }

  return false;
}

/** Helper functions */
export function isTeamEdition(): boolean {
  return getAppVariant() === 'team';
}

export function isPersonalEdition(): boolean {
  return getAppVariant() === 'personal';
}

export function getDefaultFeatureConfig(plan: UserPlan = 'free', variant: AppVariant = getAppVariant()): FeatureConfig {
  return FEATURE_CONFIG[variant][plan];
}

export function canUseAIStatic(plan: UserPlan = 'free', variant: AppVariant = getAppVariant()): boolean {
  return getFeatureConfig(variant, plan).aiArtisan;
}

export function canCollaborateStatic(plan: UserPlan = 'free', variant: AppVariant = getAppVariant()): boolean {
  return getFeatureConfig(variant, plan).collaboration;
}

export function hasTeamFeaturesStatic(plan: UserPlan = 'free', variant: AppVariant = getAppVariant()): boolean {
  return getFeatureConfig(variant, plan).teamWorkspaces;
}

export function useCanUseAI(): boolean {
  const { canUseAI } = useFeatureFlags();
  return canUseAI;
}

export function useCanCollaborate(): boolean {
  const { canCollaborate } = useFeatureFlags();
  return canCollaborate;
}

export function useHasTeamFeatures(): boolean {
  const { hasTeamFeatures } = useFeatureFlags();
  return hasTeamFeatures;
}
