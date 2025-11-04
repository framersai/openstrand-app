'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTheme } from 'next-themes';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

const modes = ['light', 'dark', 'system'] as const;

const SunGlyph = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 28 28" className={cn('h-4 w-4 text-amber-500 transition-transform duration-500 group-hover:rotate-6', className)} fill="none">
    <circle cx="14" cy="14" r="5.5" fill="url(#sun-core)" />
    <g stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" opacity="0.9">
      <line x1="14" y1="4" x2="14" y2="1.5" />
      <line x1="14" y1="26.5" x2="14" y2="24" />
      <line x1="4" y1="14" x2="1.5" y2="14" />
      <line x1="26.5" y1="14" x2="24" y2="14" />
      <line x1="6.4" y1="6.4" x2="4.4" y2="4.4" />
      <line x1="23.6" y1="23.6" x2="21.6" y2="21.6" />
      <line x1="6.4" y1="21.6" x2="4.4" y2="23.6" />
      <line x1="23.6" y1="4.4" x2="21.6" y2="6.4" />
    </g>
    <defs>
      <radialGradient id="sun-core" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(14 14) scale(5.5)">
        <stop offset="0%" stopColor="#fde68a" />
        <stop offset="65%" stopColor="#facc15" />
        <stop offset="100%" stopColor="#f59e0b" />
      </radialGradient>
    </defs>
  </svg>
);

const MoonGlyph = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 28 28" className={cn('h-4 w-4 text-indigo-300 transition-transform duration-500 group-hover:-rotate-6', className)} fill="none">
    <path
      d="M18.5 3.8A9.2 9.2 0 0 0 9 22.7c5.3 0 9.6-4.3 9.6-9.6 0-3-1.4-5.7-3.6-7.3.4-.8.9-1.4 1.4-2z"
      fill="url(#moon-core)"
    />
    <g fill="rgba(255,255,255,0.35)">
      <circle cx="16.5" cy="11" r="1.1" />
      <circle cx="13" cy="16" r="0.8" />
      <circle cx="11" cy="12.5" r="0.6" />
    </g>
    <defs>
      <linearGradient id="moon-core" x1="9" y1="5" x2="19" y2="20" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#6366f1" />
        <stop offset="60%" stopColor="#312e81" />
        <stop offset="100%" stopColor="#0f172a" />
      </linearGradient>
    </defs>
  </svg>
);

const SystemGlyph = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 28 28" className={cn('h-4 w-4 text-slate-500 transition-transform duration-500 group-hover:scale-[1.03]', className)} fill="none">
    <rect x="4" y="6" width="20" height="14" rx="3" fill="rgba(148,163,184,0.15)" stroke="currentColor" strokeWidth="1.1" />
    <path d="M4 10h20" stroke="currentColor" strokeWidth="1" opacity="0.35" />
    <circle cx="9" cy="8" r="0.8" fill="#38bdf8" />
    <circle cx="12" cy="8" r="0.8" fill="#facc15" />
    <circle cx="15" cy="8" r="0.8" fill="#fb7185" />
    <rect x="10" y="21" width="8" height="1.5" rx="0.75" fill="currentColor" opacity="0.4" />
  </svg>
);

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const nextMode = useMemo(() => {
    const current = theme ?? 'system';
    const idx = modes.indexOf(current as (typeof modes)[number]);
    return modes[(idx + 1) % modes.length];
  }, [theme]);

  const label = useMemo(() => {
    if (!mounted) {
      return 'Toggle dark mode';
    }
    const active = theme ?? 'system';
    const formatted = active.charAt(0).toUpperCase() + active.slice(1);
    return `Theme mode: ${formatted}. Click to switch to ${nextMode}.`;
  }, [theme, nextMode, mounted]);

  const activeMode = (resolvedTheme ?? 'system') as (typeof modes)[number];
  const Icon = activeMode === 'dark' ? MoonGlyph : activeMode === 'light' ? SunGlyph : SystemGlyph;

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        aria-label="Toggle dark mode"
        title="Toggle dark mode"
        disabled
        className="h-10 w-10"
      />
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={label}
          title={label}
          onClick={() => setTheme(nextMode)}
          className="group relative h-10 w-10 overflow-hidden rounded-full border border-border/60 bg-background/85 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/60 focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1"
        >
          <span className="absolute inset-0 bg-gradient-to-br from-primary/15 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          <Icon />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
}
