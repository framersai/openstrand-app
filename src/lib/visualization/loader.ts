import { lazy, ComponentType } from 'react';
import { VisualizationTier } from './types';

interface LoaderMap {
  [key: string]: () => Promise<{ default: ComponentType<any> }>;
}

const visualizationComponents: Record<VisualizationTier, LoaderMap> = {
  [VisualizationTier.Static]: {
    'chart': () => import('@/components/visualizations/tier1/ChartDisplay'),
    'table': () => import('@/components/visualizations/tier1/TableDisplay'),
  },
  [VisualizationTier.Dynamic]: {
    'force-graph': () => import('@/components/visualizations/tier2/d3/D3ForceGraph'),
    'd3-force': () => import('@/components/visualizations/tier2/d3/D3ForceGraph'),
    '3d-scatter': () => import('@/components/visualizations/tier2/three/Three3DScatter'),
    'three-scatter': () => import('@/components/visualizations/tier2/three/Three3DScatter'),
  },
  [VisualizationTier.AIArtisan]: {
    'sandbox': () => import('@/components/visualizations/tier3/sandbox/AIArtisanSandbox'),
    'ai_artisan': () => import('@/components/visualizations/tier3/sandbox/AIArtisanSandbox'),
    'custom': () => import('@/components/visualizations/tier3/sandbox/AIArtisanSandbox'),
  }
};

export function loadVisualizationComponent(
  tier: VisualizationTier,
  type: string
): ComponentType<any> {
  const loader = visualizationComponents[tier]?.[type];
  if (!loader) {
    // Fallback to static chart if component not found
    console.warn(`No component found for tier ${tier}, type ${type}. Falling back to static chart.`);
    return lazy(() => import('@/components/visualizations/tier1/ChartDisplay'));
  }
  return lazy(loader);
}

export function getAvailableTypes(tier: VisualizationTier): string[] {
  return Object.keys(visualizationComponents[tier] || {});
}

export function isTypeAvailable(tier: VisualizationTier, type: string): boolean {
  return !!visualizationComponents[tier]?.[type];
}
