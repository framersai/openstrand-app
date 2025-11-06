'use client';

import { useEffect } from 'react';

interface DashboardShortcutsConfig {
  onToggleCommandPalette: () => void;
  onOpenUpload: () => void;
  onRunAutoInsights: () => void;
  onOpenVisualize: () => void;
  onClearVisualizations: () => void;
  onOpenSettings: () => void;
}

export function useDashboardShortcuts({
  onToggleCommandPalette,
  onOpenUpload,
  onRunAutoInsights,
  onOpenVisualize,
  onClearVisualizations,
  onOpenSettings,
}: DashboardShortcutsConfig) {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const meta = event.metaKey || event.ctrlKey;
      const shift = event.shiftKey;
      const alt = event.altKey;

      if (meta && !alt && key === 'k') {
        event.preventDefault();
        onToggleCommandPalette();
        return;
      }

      if (!shift || meta || alt) {
        return;
      }

      switch (key) {
        case 'u':
          event.preventDefault();
          onOpenUpload();
          break;
        case 'a':
          event.preventDefault();
          onRunAutoInsights();
          break;
        case 'v':
          event.preventDefault();
          onOpenVisualize();
          break;
        case 'c':
          event.preventDefault();
          onClearVisualizations();
          break;
        case 's':
          event.preventDefault();
          onOpenSettings();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handler);

    return () => {
      window.removeEventListener('keydown', handler);
    };
  }, [
    onToggleCommandPalette,
    onOpenUpload,
    onRunAutoInsights,
    onOpenVisualize,
    onClearVisualizations,
    onOpenSettings,
  ]);
}
