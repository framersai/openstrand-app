'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useLocalizedPath } from '@/hooks/useLocalizedPath';

interface TabItem {
  key: string;
  label: string;
  href: string;
  icon: React.FC<{ className?: string }>;
}

// Custom SVG icons for the tabs
const DailyIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="12" r="5" className="stroke-current stroke-2" />
    <path d="M12 2v5m0 10v5m10-10h-5M7 12H2" className="stroke-current stroke-1.5 opacity-60" />
    <circle cx="12" cy="12" r="2" className="fill-current" />
  </svg>
);

const HistoryIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="12" r="9" className="stroke-current stroke-2" />
    <path d="M12 6v6l4 2" className="stroke-current stroke-2 stroke-linecap-round" />
  </svg>
);

const RecordsIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <rect x="3" y="12" width="4" height="8" rx="1" className="fill-current opacity-60" />
    <rect x="10" y="8" width="4" height="12" rx="1" className="fill-current opacity-80" />
    <rect x="17" y="4" width="4" height="16" rx="1" className="fill-current" />
  </svg>
);

const InboxIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M3 8l9-5 9 5v10c0 1-1 2-2 2H5c-1 0-2-1-2-2V8z" className="stroke-current stroke-2" />
    <path d="M3 8l9 5 9-5" className="stroke-current stroke-2" />
    <path d="M12 13v7" className="stroke-current stroke-2" />
  </svg>
);

// Main FAB icon – simple spiral with CSS-driven rotation
const SpiralIcon: React.FC<{ className?: string; prefersReducedMotion?: boolean }> = ({ 
  className, 
  prefersReducedMotion 
}) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <g className={cn(
      "origin-center transition-transform duration-300",
      !prefersReducedMotion && "group-hover:rotate-45"
    )}>
      <path
        d="M12 3c0 0 0 4.5 4.5 4.5S21 12 21 12s0 4.5-4.5 4.5S12 21 12 21s0-4.5-4.5-4.5S3 12 3 12s0-4.5 4.5-4.5S12 3 12 3z"
        className="stroke-current stroke-2"
      />
      <circle cx="12" cy="12" r="2" className="fill-current" />
    </g>
  </svg>
);

export function QuantumJournalFAB() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const router = useRouter();
  const localizePath = useLocalizedPath();
  const fabRef = useRef<HTMLDivElement>(null);

  // Load last active tab from localStorage
  useEffect(() => {
    const savedTab = localStorage.getItem('fab-last-tab');
    if (savedTab) {
      setActiveTab(savedTab);
    }
  }, []);

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const tabs: TabItem[] = [
    { key: 'daily', label: 'Daily', href: '/daily', icon: DailyIcon },
    { key: 'history', label: 'History', href: '/history', icon: HistoryIcon },
    { key: 'records', label: 'Records', href: '/records', icon: RecordsIcon },
    { key: 'inbox', label: 'Inbox', href: '/inbox', icon: InboxIcon },
  ];

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (fabRef.current && !fabRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
        setActiveTab(null);
      }
    };

    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isExpanded]);

  const handleTabClick = (tab: TabItem) => {
    setActiveTab(tab.key);
    localStorage.setItem('fab-last-tab', tab.key);
    router.push(localizePath(tab.href));
    // Collapse after short delay so navigation feels snappy but not jarring
    setTimeout(() => {
      setIsExpanded(false);
      setActiveTab(null);
    }, 150);
  };

  const radius = 80;

  return (
    <div ref={fabRef} className="fixed bottom-6 right-6 z-50">
      {/* Radial tab menu */}
      <div
        className={cn(
          'pointer-events-none absolute bottom-0 right-0 transition-all duration-200',
          isExpanded ? 'scale-100 opacity-100' : 'scale-0 opacity-0',
        )}
      >
        <div className="relative h-64 w-64">
          {/* Solid dial background */}
          <div className="absolute inset-0 rounded-full border border-border bg-background/95 shadow-2xl" />

          {tabs.map((tab, index) => {
            const angle = (index * 360) / tabs.length - 90; // start from top
            const x = Math.cos((angle * Math.PI) / 180) * radius;
            const y = Math.sin((angle * Math.PI) / 180) * radius;

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => handleTabClick(tab)}
                className={cn(
                  'group absolute flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border text-sm font-medium',
                  'bg-card text-foreground shadow-md transition-transform transition-shadow duration-150',
                  'hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0',
                  activeTab === tab.key ? 'border-primary bg-primary/10' : 'border-border',
                )}
                style={{
                  left: `${128 + x}px`,
                  top: `${128 + y}px`,
                }}
              >
                <tab.icon className="h-6 w-6" />
                <span className="sr-only">{tab.label}</span>
                <span className="pointer-events-none absolute -bottom-7 left-1/2 -translate-x-1/2 rounded-md border border-border bg-background/95 px-2 py-0.5 text-[11px] font-medium text-muted-foreground opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main FAB button – hard, tactile */}
      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        className={cn(
          'group relative flex h-14 w-14 items-center justify-center rounded-full border',
          'bg-primary text-primary-foreground',
          'border-primary/70 shadow-lg transition-transform transition-shadow duration-150',
          !prefersReducedMotion && 'hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0 active:shadow-md',
        )}
        aria-label="Open journaling shortcuts"
        aria-expanded={isExpanded}
      >
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-foreground/10">
          <SpiralIcon className="h-7 w-7" prefersReducedMotion={prefersReducedMotion} />
        </div>
      </button>
    </div>
  );
}

