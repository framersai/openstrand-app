import { useState, useEffect } from 'react';

export type LayoutPreset = 'focused' | 'balanced' | 'overview' | 'zen' | 'custom';

export interface LayoutConfig {
  preset: LayoutPreset;
  showSidebar: boolean;
  sidebarPosition: 'left' | 'right';
  showStatusBar: boolean;
  showActionBar: boolean;
  panelsCollapsed: Record<string, boolean>;
  gridColumns: number;
  compactMode: boolean;
}

const layoutPresets: Record<LayoutPreset, Partial<LayoutConfig>> = {
  focused: {
    showSidebar: false,
    showStatusBar: true,
    showActionBar: true,
    gridColumns: 1,
    compactMode: false,
    panelsCollapsed: {
      insights: true,
      activity: true,
      feedback: true,
      system: true
    }
  },
  balanced: {
    showSidebar: true,
    sidebarPosition: 'left',
    showStatusBar: true,
    showActionBar: true,
    gridColumns: 2,
    compactMode: false,
    panelsCollapsed: {
      insights: false,
      activity: false,
      feedback: true,
      system: true
    }
  },
  overview: {
    showSidebar: true,
    sidebarPosition: 'right',
    showStatusBar: true,
    showActionBar: true,
    gridColumns: 3,
    compactMode: true,
    panelsCollapsed: {
      insights: false,
      activity: false,
      feedback: false,
      system: false
    }
  },
  zen: {
    showSidebar: false,
    showStatusBar: false,
    showActionBar: false,
    gridColumns: 1,
    compactMode: false,
    panelsCollapsed: {
      insights: true,
      activity: true,
      feedback: true,
      system: true
    }
  },
  custom: {} // User customized
};

export function useLayoutPresets() {
  const [currentLayout, setCurrentLayout] = useState<LayoutConfig>(() => {
    // Check if we're in the browser
    if (typeof window !== 'undefined') {
      // Try to load from localStorage
      const saved = localStorage.getItem('dashboard-layout');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // Invalid JSON, use default
        }
      }
    }

    // Default to balanced layout
    return {
      preset: 'balanced',
      showSidebar: true,
      sidebarPosition: 'left',
      showStatusBar: true,
      showActionBar: true,
      panelsCollapsed: {
        insights: false,
        activity: false,
        feedback: true,
        system: true
      },
      gridColumns: 2,
      compactMode: false
    };
  });

  // Save to localStorage whenever layout changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('dashboard-layout', JSON.stringify(currentLayout));
    }
  }, [currentLayout]);

  const applyPreset = (preset: LayoutPreset) => {
    const presetConfig = layoutPresets[preset];
    setCurrentLayout(prev => ({
      ...prev,
      preset,
      ...presetConfig
    }));
  };

  const updateLayout = (updates: Partial<LayoutConfig>) => {
    setCurrentLayout(prev => ({
      ...prev,
      ...updates,
      preset: 'custom' // Switch to custom when user makes changes
    }));
  };

  const togglePanel = (panelId: string) => {
    setCurrentLayout(prev => ({
      ...prev,
      panelsCollapsed: {
        ...prev.panelsCollapsed,
        [panelId]: !prev.panelsCollapsed[panelId]
      },
      preset: 'custom'
    }));
  };

  const toggleSidebar = () => {
    setCurrentLayout(prev => ({
      ...prev,
      showSidebar: !prev.showSidebar,
      preset: 'custom'
    }));
  };

  const toggleStatusBar = () => {
    setCurrentLayout(prev => ({
      ...prev,
      showStatusBar: !prev.showStatusBar,
      preset: 'custom'
    }));
  };

  const cycleGridColumns = () => {
    setCurrentLayout(prev => ({
      ...prev,
      gridColumns: prev.gridColumns >= 3 ? 1 : prev.gridColumns + 1,
      preset: 'custom'
    }));
  };

  return {
    currentLayout,
    applyPreset,
    updateLayout,
    togglePanel,
    toggleSidebar,
    toggleStatusBar,
    cycleGridColumns
  };
}