import { useEffect, useCallback, useRef } from 'react';

export interface KeyBinding {
  key: string;
  ctrl?: boolean;
  cmd?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description: string;
  category?: string;
  enabled?: boolean;
}

interface UseKeyboardNavigationProps {
  bindings: KeyBinding[];
  enabled?: boolean;
}

export function useKeyboardNavigation({ bindings, enabled = true }: UseKeyboardNavigationProps) {
  const bindingsRef = useRef(bindings);

  // Update ref when bindings change
  useEffect(() => {
    bindingsRef.current = bindings;
  }, [bindings]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled) return;

    // Don't trigger if user is typing in an input
    const target = e.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.contentEditable === 'true'
    ) {
      // Allow some global shortcuts even in inputs
      const allowedInInputs = ['Escape', 'F1'];
      if (!allowedInInputs.includes(e.key)) {
        return;
      }
    }

    for (const binding of bindingsRef.current) {
      if (!binding.enabled && binding.enabled !== undefined) continue;

      const matchesKey = e.key.toLowerCase() === binding.key.toLowerCase();
      const matchesCtrl = binding.ctrl ? (e.ctrlKey || e.metaKey) : !binding.ctrl || (!e.ctrlKey && !e.metaKey);
      const matchesCmd = binding.cmd ? e.metaKey : !binding.cmd || !e.metaKey;
      const matchesShift = binding.shift ? e.shiftKey : !binding.shift || !e.shiftKey;
      const matchesAlt = binding.alt ? e.altKey : !binding.alt || !e.altKey;

      if (matchesKey && matchesCtrl && matchesCmd && matchesShift && matchesAlt) {
        e.preventDefault();
        e.stopPropagation();
        binding.action();
        break;
      }
    }
  }, [enabled]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

// Default keyboard shortcuts for dashboard
export const defaultKeyboardBindings: KeyBinding[] = [
  // Navigation
  {
    key: 'h',
    description: 'Go to Home',
    category: 'Navigation',
    action: () => console.log('Navigate to home')
  },
  {
    key: 'd',
    description: 'Focus Dashboard',
    category: 'Navigation',
    action: () => console.log('Focus dashboard')
  },
  {
    key: '/',
    description: 'Focus Search',
    category: 'Navigation',
    action: () => {
      const searchInput = document.querySelector('[data-search-input]') as HTMLInputElement;
      searchInput?.focus();
    }
  },

  // Actions
  {
    key: 'n',
    ctrl: true,
    description: 'New Visualization',
    category: 'Actions',
    action: () => console.log('New visualization')
  },
  {
    key: 'u',
    ctrl: true,
    description: 'Upload Dataset',
    category: 'Actions',
    action: () => console.log('Upload dataset')
  },
  {
    key: 'i',
    ctrl: true,
    description: 'Run Auto Insights',
    category: 'Actions',
    action: () => console.log('Auto insights')
  },

  // View
  {
    key: '1',
    alt: true,
    description: 'Single Column Layout',
    category: 'View',
    action: () => console.log('Single column')
  },
  {
    key: '2',
    alt: true,
    description: 'Two Column Layout',
    category: 'View',
    action: () => console.log('Two columns')
  },
  {
    key: '3',
    alt: true,
    description: 'Three Column Layout',
    category: 'View',
    action: () => console.log('Three columns')
  },
  {
    key: 'f',
    description: 'Toggle Fullscreen',
    category: 'View',
    action: () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
    }
  },
  {
    key: 'b',
    ctrl: true,
    description: 'Toggle Sidebar',
    category: 'View',
    action: () => console.log('Toggle sidebar')
  },

  // Panels
  {
    key: '[',
    description: 'Previous Panel',
    category: 'Panels',
    action: () => console.log('Previous panel')
  },
  {
    key: ']',
    description: 'Next Panel',
    category: 'Panels',
    action: () => console.log('Next panel')
  },
  {
    key: 'Enter',
    description: 'Expand/Collapse Panel',
    category: 'Panels',
    action: () => console.log('Toggle panel')
  },

  // Selection
  {
    key: 'a',
    ctrl: true,
    description: 'Select All',
    category: 'Selection',
    action: () => console.log('Select all')
  },
  {
    key: 'Escape',
    description: 'Clear Selection',
    category: 'Selection',
    action: () => console.log('Clear selection')
  },

  // Help
  {
    key: '?',
    shift: true,
    description: 'Show Keyboard Shortcuts',
    category: 'Help',
    action: () => console.log('Show help')
  },
  {
    key: 'F1',
    description: 'Open Documentation',
    category: 'Help',
    action: () => window.open('/docs', '_blank')
  }
];

// Hook for focus management
export function useFocusManagement() {
  const focusableElements = useRef<HTMLElement[]>([]);
  const currentFocusIndex = useRef(0);

  const registerFocusable = useCallback((element: HTMLElement) => {
    if (!focusableElements.current.includes(element)) {
      focusableElements.current.push(element);
    }
  }, []);

  const unregisterFocusable = useCallback((element: HTMLElement) => {
    const index = focusableElements.current.indexOf(element);
    if (index > -1) {
      focusableElements.current.splice(index, 1);
    }
  }, []);

  const focusNext = useCallback(() => {
    if (focusableElements.current.length === 0) return;

    currentFocusIndex.current = (currentFocusIndex.current + 1) % focusableElements.current.length;
    focusableElements.current[currentFocusIndex.current]?.focus();
  }, []);

  const focusPrevious = useCallback(() => {
    if (focusableElements.current.length === 0) return;

    currentFocusIndex.current =
      currentFocusIndex.current === 0
        ? focusableElements.current.length - 1
        : currentFocusIndex.current - 1;
    focusableElements.current[currentFocusIndex.current]?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        if (e.shiftKey) {
          focusPrevious();
        } else {
          focusNext();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusNext, focusPrevious]);

  return {
    registerFocusable,
    unregisterFocusable,
    focusNext,
    focusPrevious
  };
}