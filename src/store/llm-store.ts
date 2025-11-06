'use client';

/**
 * @module store/llm-store
 * @description Zustand store for LLM provider configuration and cost tracking.
 * Manages provider selection, API keys, and usage statistics.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { StateStorage } from 'zustand/middleware';
import type { LLMProvider, CostBreakdown, CostStatistics } from '@/types';

export const LLM_PROVIDER_KEYS = ['openrouter', 'openai', 'anthropic'] as const;

const ENV_API_KEYS: Record<LLMProvider, string | undefined> = {
  openrouter: process.env.NEXT_PUBLIC_OPENROUTER_API_KEY,
  openai: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  anthropic: process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY,
};

export type ProviderSource = 'byok' | 'env' | 'none';

export interface ResolvedProviderAuth {
  apiKey?: string;
  source: ProviderSource;
  envDetected: boolean;
}

const createLocalStorage = (): StateStorage => {
  if (typeof window === 'undefined') {
    return {
      getItem: () => null,
      setItem: () => undefined,
      removeItem: () => undefined,
    };
  }
  return window.localStorage;
};

interface LLMStore {
  /** Current LLM provider */
  provider: LLMProvider;
  
  /** Available providers with configuration */
  providers: Record<LLMProvider, {
    enabled: boolean;
    apiKey?: string;
    model?: string;
  }>;
  
  /** Use heuristic parsing before LLM */
  useHeuristics: boolean;
  
  /** Cost tracking */
  costs: CostBreakdown[];
  
  /** Set active provider */
  setProvider: (provider: LLMProvider) => void;
  
  /** Configure provider */
  configureProvider: (provider: LLMProvider, config: {
    enabled?: boolean;
    apiKey?: string;
    model?: string;
  }) => void;
  
  /** Set heuristic usage */
  setUseHeuristics: (value: boolean) => void;
  
  /** Toggle heuristics */
  toggleHeuristics: () => void;
  
  /** Add cost record */
  addCost: (cost: CostBreakdown) => void;
  
  /** Get cost statistics */
  getCostStats: () => CostStatistics;
  
  /** Clear cost history */
  clearCosts: () => void;

  /** Whether BYOK keys should always override detected environment keys */
  preferByok: boolean;

  /** Toggle or set BYOK preference */
  setPreferByok: (value: boolean) => void;

  /** Resolve the effective API key for a provider */
  getResolvedApiKey: (provider: LLMProvider) => ResolvedProviderAuth;
}

/**
 * Create the LLM configuration store with persistence
 */
export const useLLMStore = create<LLMStore>()(
  persist(
    (set, get) => ({
      provider: 'openrouter',
      
      providers: {
        openrouter: {
          enabled: true,
          model: 'openai/gpt-3.5-turbo',
        },
        openai: {
          enabled: false,
          model: 'gpt-3.5-turbo',
        },
        anthropic: {
          enabled: false,
          model: 'claude-3-sonnet',
        },
      },
      
      useHeuristics: false,
      
      costs: [],

      preferByok: false,
      
      setProvider: (provider) => {
        const state = get();
        const { providers, preferByok } = state;
        const envKeyDetected = Boolean(ENV_API_KEYS[provider]?.trim());
        if (providers[provider]?.enabled || (!preferByok && envKeyDetected)) {
          set({ provider });
        }
      },
      
      configureProvider: (provider, config) => {
        set((state) => ({
          providers: {
            ...state.providers,
            [provider]: {
              ...state.providers[provider],
              ...config,
            },
          },
        }));
      },
      
      setUseHeuristics: (value) => {
        set({ useHeuristics: value });
      },
      
      toggleHeuristics: () => {
        set((state) => ({ useHeuristics: !state.useHeuristics }));
      },
      
      addCost: (cost) => {
        set((state) => ({
          costs: [...state.costs, cost],
        }));
      },
      
      getCostStats: () => {
        const { costs } = get();
        const emptyProviders: Record<LLMProvider, number> = {
          openrouter: 0,
          openai: 0,
          anthropic: 0,
        };

        if (costs.length === 0) {
          return {
            sessionTotal: 0,
            byProvider: { ...emptyProviders },
            byVisualization: {},
            requestCount: 0,
            averageCost: 0,
          };
        }

        const sessionTotal = costs.reduce((sum, c) => sum + c.totalCost, 0);
        const byProvider: Record<LLMProvider, number> = { ...emptyProviders };
        const byVisualization: Record<string, number> = {};
        
        costs.forEach((cost) => {
          byProvider[cost.provider] += cost.totalCost;
          // Note: visualization ID would need to be added to CostBreakdown type
        });
        
        return {
          sessionTotal,
          byProvider,
          byVisualization,
          requestCount: costs.length,
          averageCost: sessionTotal / costs.length,
        };
      },
      
      clearCosts: () => {
        set({ costs: [] });
      },

      setPreferByok: (value) => {
        set({ preferByok: value });
      },

      getResolvedApiKey: (provider) => {
        const state = get();
        const storedKey = state.providers[provider]?.apiKey?.trim();
        const envKey = ENV_API_KEYS[provider]?.trim();
        const envDetected = Boolean(envKey);

        if (storedKey) {
          return {
            apiKey: storedKey,
            source: 'byok',
            envDetected,
          };
        }

        if (!state.preferByok && envKey) {
          return {
            apiKey: envKey,
            source: 'env',
            envDetected,
          };
        }

        return {
          apiKey: undefined,
          source: 'none',
          envDetected,
        };
      },
    }),
    {
      name: 'llm-config-storage',
      storage: createJSONStorage(createLocalStorage),
      partialize: (state) => ({
        provider: state.provider,
        providers: state.providers,
        useHeuristics: state.useHeuristics,
        preferByok: state.preferByok,
      }),
    }
  )
);
