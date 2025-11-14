/**
 * @module components/theme-switcher
 * @description Advanced theme switcher component with multiple theme options and dark mode support
 */

'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun, Smartphone, Monitor, Palette } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Theme {
  id: string;
  name: string;
  description: string;
  preview?: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

interface IconProps {
  className?: string;
}

const ThemeGlyph = ({ className }: IconProps) => {
  const gradientId = React.useMemo(
    () => `theme-gradient-${Math.random().toString(36).slice(2)}`,
    []
  );
  const maskId = React.useMemo(
    () => `theme-mask-${Math.random().toString(36).slice(2)}`,
    []
  );

  return (
    <svg
      viewBox="0 0 28 28"
      fill="none"
      className={cn(
        'h-5 w-5 transition-all duration-500 ease-out group-hover:-rotate-6 group-hover:scale-[1.03]',
        className
      )}
    >
      <defs>
        <linearGradient id={gradientId} x1="5" y1="5" x2="23" y2="23" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#f8fafc" />
          <stop offset="45%" stopColor="#94a3b8" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
        <mask id={maskId} maskUnits="userSpaceOnUse">
          <rect width="28" height="28" fill="white" rx="14" />
          <circle cx="19" cy="9" r="7" fill="black" />
        </mask>
      </defs>

      <circle
        cx="14"
        cy="14"
        r="11"
        fill={`url(#${gradientId})`}
        stroke="currentColor"
        strokeWidth="1.1"
        opacity="0.95"
      />
      <circle cx="10.5" cy="10" r="5" fill="#fff8dc" mask={`url(#${maskId})`} />
      <path
        d="M6.5 18.5c2.2-1.4 4.6-2.1 7.1-2.1 2.5 0 4.9 0.7 7.2 2"
        stroke="rgba(255,255,255,0.55)"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
      <path
        d="M7.5 9.5c1.8 1.6 3.9 2.4 6.1 2.4 2.2 0 4.6-0.9 6.6-2.6"
        stroke="rgba(15,23,42,0.45)"
        strokeWidth="1.05"
        strokeLinecap="round"
      />
      <g className="origin-center transition-transform duration-500 group-hover:rotate-12">
        <circle cx="18.5" cy="17.5" r="1.2" fill="#facc15" />
        <circle cx="20.8" cy="15" r="0.8" fill="#fbbf24" opacity="0.8" />
        <circle cx="16.8" cy="15.8" r="0.6" fill="#fde68a" opacity="0.7" />
      </g>
      <path
        d="M9.2 20c-0.6 0.8-1 1.7-1 2.7 0 0.5 0.1 1.1 0.3 1.5"
        stroke="rgba(15,23,42,0.4)"
        strokeWidth="1.05"
        strokeLinecap="round"
      />
    </svg>
  );
};

const THEME_BASE_KEY = 'openstrand-theme-base';
const THEME_COLORBLIND_KEY = 'openstrand-theme-colorblind';

const COLORBLIND_MODES = [
  { id: 'normal', name: 'Normal vision', description: 'Default palette' },
  { id: 'protanopia', name: 'Protanopia', description: 'Red-blind friendly' },
  { id: 'deuteranopia', name: 'Deuteranopia', description: 'Green-blind friendly' },
  { id: 'tritanopia', name: 'Tritanopia', description: 'Blue-blind friendly' },
] as const;

const themes: Theme[] = [
  {
    id: 'aurora-light',
    name: 'Aurora',
    description: 'Northern lights with flowing gradients',
    preview: {
      primary: '#3b82f6',
      secondary: '#a855f7',
      accent: '#10b981',
    },
  },
  {
    id: 'modern-light',
    name: 'Modern',
    description: 'Clean, minimalist design with gradients',
    preview: {
      primary: '#3b82f6',
      secondary: '#8b5cf6',
      accent: '#f59e0b',
    },
  },
  {
    id: 'classic-light',
    name: 'Classic',
    description: 'Professional with navy and gold',
    preview: {
      primary: '#1e3a8a',
      secondary: '#b8860b',
      accent: '#8b4513',
    },
  },
  {
    id: 'vintage-light',
    name: 'Vintage',
    description: 'Retro design with warm colors',
    preview: {
      primary: '#8b4513',
      secondary: '#cd853f',
      accent: '#b22222',
    },
  },
  {
    id: 'paper-light',
    name: 'Paper',
    description: 'Clean document-like aesthetic',
    preview: {
      primary: '#000000',
      secondary: '#666666',
      accent: '#cc0000',
    },
  },
  {
    id: 'cyberpunk-light',
    name: 'Cyberpunk',
    description: 'Futuristic neon with glow effects',
    preview: {
      primary: '#00ffff',
      secondary: '#ff00ff',
      accent: '#00ff00',
    },
  },
  {
    id: 'ocean-light',
    name: 'Ocean',
    description: 'Calming sea blues with crest highlights',
    preview: {
      primary: '#0ea5e9',
      secondary: '#14b8a6',
      accent: '#f97316',
    },
  },
  {
    id: 'forest-light',
    name: 'Forest',
    description: 'Organic greens with natural textures',
    preview: {
      primary: '#2f855a',
      secondary: '#a3e635',
      accent: '#d97706',
    },
  },
  {
    id: 'space-light',
    name: 'Space',
    description: 'Cosmic purples with luminous stars',
    preview: {
      primary: '#6366f1',
      secondary: '#f472b6',
      accent: '#facc15',
    },
  },
  {
    id: 'minimal-light',
    name: 'Minimal',
    description: 'Ultra-clean, whitespace-focused',
    preview: {
      primary: '#000000',
      secondary: '#808080',
      accent: '#0000ff',
    },
  },
];

type ButtonVariant = React.ComponentProps<typeof Button>['variant'];
type ButtonSize = React.ComponentProps<typeof Button>['size'];

interface ThemeSwitcherProps {
  tooltip?: string;
  buttonVariant?: ButtonVariant;
  buttonSize?: ButtonSize;
  showLabel?: boolean;
  className?: string;
}

export function ThemeSwitcher({
  tooltip = 'Open theme switcher',
  buttonVariant = 'outline',
  buttonSize = 'icon',
  showLabel = false,
  className,
}: ThemeSwitcherProps) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [currentThemeBase, setCurrentThemeBase] = React.useState('modern-light');
  const [isDarkMode, setIsDarkMode] = React.useState(false);
  const [isAutoMode, setIsAutoMode] = React.useState<boolean>(true);
  const [colorblindMode, setColorblindMode] =
    React.useState<(typeof COLORBLIND_MODES)[number]['id']>('normal');
  
  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!mounted) return;
    setIsAutoMode(theme === 'system');
  }, [mounted, theme]);

  React.useEffect(() => {
    setIsDarkMode(resolvedTheme === 'dark');
  }, [resolvedTheme]);

  React.useEffect(() => {
    if (mounted) {
      try {
        const stored = window.localStorage.getItem(THEME_BASE_KEY);
        if (stored && themes.some((t) => t.id === stored)) {
          setCurrentThemeBase(stored);
        }
        const storedColorblind = window.localStorage.getItem(
          THEME_COLORBLIND_KEY
        ) as (typeof COLORBLIND_MODES)[number]['id'] | null;
        if (
          storedColorblind &&
          COLORBLIND_MODES.some((mode) => mode.id === storedColorblind)
        ) {
          setColorblindMode(storedColorblind);
        }
      } catch {
        // ignore storage errors (private mode, etc.)
      }
    }
  }, [mounted]);

  React.useEffect(() => {
    // Apply theme to document
    if (currentThemeBase && mounted) {
      document.documentElement.setAttribute('data-theme', currentThemeBase);
      document.documentElement.setAttribute('data-colorblind-mode', colorblindMode);

      // Apply dark mode class if needed
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }

      try {
        window.localStorage.setItem(THEME_BASE_KEY, currentThemeBase);
        window.localStorage.setItem(THEME_COLORBLIND_KEY, colorblindMode);
      } catch {
        // ignore storage errors
      }
    }
  }, [currentThemeBase, isDarkMode, mounted, colorblindMode]);

  if (!mounted) {
    return null;
  }

  const showAccentDot = isDarkMode && buttonSize === 'icon';

  const triggerButton = (
    <Button
      variant={buttonVariant}
      size={buttonSize}
      className={cn(
        'group relative overflow-hidden rounded-full border border-border/60 bg-background/90 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/60 focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1',
        showLabel && 'gap-2 px-3',
        className
      )}
      aria-label="Theme switcher"
      title={tooltip}
    >
      <span className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ background: 'radial-gradient(circle at 20% 20%, rgba(59,130,246,0.15), transparent 60%)' }} />
      <ThemeGlyph className="h-[1.2rem] w-[1.2rem]" />
      {showLabel && <span className="text-xs font-medium leading-none">Theme</span>}
      {showAccentDot && (
        <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full border border-background bg-sky-400 shadow" />
      )}
    </Button>
  );

  const handleThemeChange = (themeId: string) => {
    setCurrentThemeBase(themeId);
    setIsAutoMode(false);

    // Update next-themes for compatibility
    if (isDarkMode) {
      setTheme('dark');
    } else {
      setTheme('light');
    }
  };

  const handleAppearanceChange = (mode: 'system' | 'light' | 'dark') => {
    if (mode === 'system') {
      setIsAutoMode(true);
      setTheme('system');
      return;
    }

    setIsAutoMode(false);
    setTheme(mode);
  };

  const isModeActive = (mode: 'system' | 'light' | 'dark') => {
    if (mode === 'system') {
      return isAutoMode;
    }
    if (mode === 'dark') {
      return !isAutoMode && isDarkMode;
    }
    return !isAutoMode && !isDarkMode;
  };

  const getCurrentTheme = () => {
    return themes.find(t => t.id === currentThemeBase) || themes[0];
  };

  const handleColorblindModeChange = (
    mode: (typeof COLORBLIND_MODES)[number]['id']
  ) => {
    setColorblindMode(mode);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{triggerButton}</DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[240px]">
        <DropdownMenuLabel className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Appearance
        </DropdownMenuLabel>
        <DropdownMenuItem
          onClick={() => handleAppearanceChange('system')}
          className={cn('cursor-pointer gap-2', isModeActive('system') && 'text-primary')}
        >
          <Monitor className="h-4 w-4" />
          <span className="flex-1 text-sm">System (auto)</span>
          {isModeActive('system') && <span className="text-xs font-semibold">Active</span>}
        </DropdownMenuItem>
        <DropdownMenuSeparator />

        <DropdownMenuLabel className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Theme palettes
        </DropdownMenuLabel>

        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Current: {getCurrentTheme().name} {isDarkMode ? '(Dark)' : '(Light)'}
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {themes.map((theme) => (
          <DropdownMenuItem
            key={theme.id}
            onClick={() => handleThemeChange(theme.id)}
            className="cursor-pointer"
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex-1">
                <div className="font-medium">{theme.name}</div>
                <div className="text-xs text-muted-foreground">
                  {theme.description}
                </div>
              </div>
              {theme.preview && (
                <div className="flex gap-1 ml-2">
                  <div
                    className="w-3 h-3 rounded-full border"
                    style={{ backgroundColor: theme.preview.primary }}
                  />
                  <div
                    className="w-3 h-3 rounded-full border"
                    style={{ backgroundColor: theme.preview.secondary }}
                  />
                  <div
                    className="w-3 h-3 rounded-full border"
                    style={{ backgroundColor: theme.preview.accent }}
                  />
                </div>
              )}
            </div>
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />

        <DropdownMenuLabel className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
          <Palette className="h-3 w-3" />
          Accessibility
        </DropdownMenuLabel>
        {COLORBLIND_MODES.map((mode) => (
          <DropdownMenuItem
            key={mode.id}
            onClick={() => handleColorblindModeChange(mode.id)}
            className={cn(
              'cursor-pointer flex flex-col items-start gap-1',
              colorblindMode === mode.id && 'text-primary'
            )}
          >
            <div className="flex w-full items-center justify-between">
              <span className="text-sm font-medium">{mode.name}</span>
              {colorblindMode === mode.id && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                  Active
                </span>
              )}
            </div>
            <span className="text-xs text-muted-foreground">
              {mode.description}
            </span>
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />

        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Smartphone className="mr-2 h-4 w-4" />
            <span>Mobile Preview</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem onClick={() => window.innerWidth = 375}>
              iPhone SE (375px)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => window.innerWidth = 390}>
              iPhone 14 (390px)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => window.innerWidth = 412}>
              Pixel 7 (412px)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => window.innerWidth = 768}>
              iPad Mini (768px)
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuItem
          onClick={() => window.location.href = '/design-system'}
          className="cursor-pointer"
        >
          View Design System -&gt;
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Export a simplified version for the header
export function ThemeToggleSimple() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
    >
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
