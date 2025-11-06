export enum VisualizationTier {
  Static = 1,
  Dynamic = 2,
  AIArtisan = 3
}

export interface TierClassification {
  tier: VisualizationTier;
  confidence: number;
  reasoning: string;
  suggestedApproach: string;
  estimatedCost: number;
  availableTypes: string[];
}

export interface VisualizationConfig {
  tier: VisualizationTier;
  type: string;
  data: any;
  options?: any;
  theme?: string;
  interactive?: boolean;
  aesthetic?: AestheticMode;
}

export enum AestheticMode {
  CyberpunkNeon = 'cyberpunk_neon',
  MinimalistZen = 'minimalist_zen',
  OrganicFlow = 'organic_flow',
  RetroSynthwave = 'retro_synthwave',
  ScientificPrecision = 'scientific_precision',
  BusinessProfessional = 'business_professional',
  DataArtAbstract = 'data_art',
  CosmicSpace = 'cosmic_space'
}

export interface AIArtisanConfig {
  prompt: string;
  model: 'claude-opus-4.1' | 'gpt-4';
  aestheticMode: AestheticMode;
  animationLevel: 'none' | 'subtle' | 'moderate' | 'intense';
  interactivity: 'static' | 'hover' | 'full';
}

export interface AIArtisanResult {
  code: {
    html?: string;
    css?: string;
    js: string;
  };
  sandboxConfig: SandboxConfig;
  cost: number;
  generationTime: number;
  modelUsed: string;
}

export interface SandboxConfig {
  libraries: string[];
  sandbox: string[];
  csp: string;
}

export interface PlanLimits {
  visualizationsPerDay: number;
  aiArtisanPerDay: number;
  apiCallsPerHour: number;
  maxUploadSizeMB: number;
  datasetsStored: number;
}

export const PLAN_LIMITS: Record<string, PlanLimits> = {
  free: {
    visualizationsPerDay: 10,
    aiArtisanPerDay: -1,
    apiCallsPerHour: 10,
    maxUploadSizeMB: 5,
    datasetsStored: 1
  },
  basic: {
    visualizationsPerDay: 100,
    aiArtisanPerDay: -1,
    apiCallsPerHour: 50,
    maxUploadSizeMB: 50,
    datasetsStored: 10
  },
  pro: {
    visualizationsPerDay: -1, // Unlimited
    aiArtisanPerDay: -1,
    apiCallsPerHour: 100,
    maxUploadSizeMB: 200,
    datasetsStored: -1 // Unlimited
  },
  enterprise: {
    visualizationsPerDay: -1,
    aiArtisanPerDay: -1,
    apiCallsPerHour: -1,
    maxUploadSizeMB: -1,
    datasetsStored: -1
  }
};
