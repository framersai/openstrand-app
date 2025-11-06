'use client';

import { cn } from '@/lib/utils';

interface IconProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12',
};

// Knowledge Weaving Icon - Interconnected nodes forming a strand pattern
export function KnowledgeWeavingIcon({ className, size = 'md' }: IconProps) {
  return (
    <svg
      className={cn(sizeClasses[size], className)}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="weave-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.8" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.3" />
        </linearGradient>
      </defs>

      {/* Central node */}
      <circle cx="12" cy="12" r="3" fill="currentColor" opacity="0.9" />

      {/* Orbital nodes */}
      <circle cx="6" cy="8" r="2" fill="url(#weave-gradient)" />
      <circle cx="18" cy="8" r="2" fill="url(#weave-gradient)" />
      <circle cx="6" cy="16" r="2" fill="url(#weave-gradient)" />
      <circle cx="18" cy="16" r="2" fill="url(#weave-gradient)" />

      {/* Weaving connections */}
      <path d="M12 12L6 8M12 12L18 8M12 12L6 16M12 12L18 16"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeOpacity="0.4"
            strokeDasharray="2 2" />

      {/* Curved strands */}
      <path d="M6 8Q12 6 18 8M6 16Q12 18 18 16"
            stroke="currentColor"
            strokeWidth="1"
            strokeOpacity="0.3"
            fill="none" />
    </svg>
  );
}

// Data Ocean Icon - Flowing data waves
export function DataOceanIcon({ className, size = 'md' }: IconProps) {
  return (
    <svg
      className={cn(sizeClasses[size], className)}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="ocean-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.1" />
          <stop offset="50%" stopColor="currentColor" stopOpacity="0.5" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.9" />
        </linearGradient>
      </defs>

      {/* Data waves */}
      <path d="M2 8C4 6 6 6 8 8S12 10 14 8S18 6 20 8S22 10 22 10"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeOpacity="0.8"
            fill="none" />
      <path d="M2 12C4 10 6 10 8 12S12 14 14 12S18 10 20 12S22 14 22 14"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeOpacity="0.6"
            fill="none" />
      <path d="M2 16C4 14 6 14 8 16S12 18 14 16S18 14 20 16S22 18 22 18"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeOpacity="0.4"
            fill="none" />

      {/* Data points */}
      <circle cx="6" cy="7" r="1" fill="currentColor" opacity="0.8" />
      <circle cx="12" cy="11" r="1" fill="currentColor" opacity="0.8" />
      <circle cx="18" cy="15" r="1" fill="currentColor" opacity="0.8" />

      {/* Fill area */}
      <path d="M2 20L2 16C4 14 6 14 8 16S12 18 14 16S18 14 20 16S22 18 22 18L22 20Z"
            fill="url(#ocean-gradient)" />
    </svg>
  );
}

// Neural Strand Icon - Brain-like neural network forming strands
export function NeuralStrandIcon({ className, size = 'md' }: IconProps) {
  return (
    <svg
      className={cn(sizeClasses[size], className)}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Neural connections */}
      <path d="M5 5L12 12L19 5M5 19L12 12L19 19M5 5L5 19M19 5L19 19"
            stroke="currentColor"
            strokeWidth="1"
            strokeOpacity="0.3"
            strokeDasharray="1 2" />

      {/* Primary nodes */}
      <circle cx="12" cy="12" r="2.5" fill="currentColor" opacity="0.9" />
      <circle cx="5" cy="5" r="2" fill="currentColor" opacity="0.7" />
      <circle cx="19" cy="5" r="2" fill="currentColor" opacity="0.7" />
      <circle cx="5" cy="19" r="2" fill="currentColor" opacity="0.7" />
      <circle cx="19" cy="19" r="2" fill="currentColor" opacity="0.7" />

      {/* Secondary nodes */}
      <circle cx="8.5" cy="8.5" r="1" fill="currentColor" opacity="0.4" />
      <circle cx="15.5" cy="8.5" r="1" fill="currentColor" opacity="0.4" />
      <circle cx="8.5" cy="15.5" r="1" fill="currentColor" opacity="0.4" />
      <circle cx="15.5" cy="15.5" r="1" fill="currentColor" opacity="0.4" />
    </svg>
  );
}

// Visualization Tier Icon - Three-tier system representation
export function VisualizationTierIcon({ className, size = 'md' }: IconProps) {
  return (
    <svg
      className={cn(sizeClasses[size], className)}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Tier 1 - Basic */}
      <rect x="3" y="16" width="6" height="5" rx="1"
            fill="currentColor" opacity="0.4" />

      {/* Tier 2 - Dynamic */}
      <rect x="9" y="11" width="6" height="10" rx="1"
            fill="currentColor" opacity="0.6" />

      {/* Tier 3 - AI Artisan */}
      <rect x="15" y="3" width="6" height="18" rx="1"
            fill="currentColor" opacity="0.9" />

      {/* Sparkle effect for AI */}
      <circle cx="18" cy="7" r="0.5" fill="currentColor" />
      <circle cx="17" cy="9" r="0.5" fill="currentColor" />
      <circle cx="19" cy="9" r="0.5" fill="currentColor" />
    </svg>
  );
}

// Schema Intelligence Icon - Smart data analysis
export function SchemaIntelligenceIcon({ className, size = 'md' }: IconProps) {
  return (
    <svg
      className={cn(sizeClasses[size], className)}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Database layers */}
      <ellipse cx="12" cy="6" rx="7" ry="2.5"
               stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.8" />
      <ellipse cx="12" cy="12" rx="7" ry="2.5"
               stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.6" />
      <ellipse cx="12" cy="18" rx="7" ry="2.5"
               stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.4" />

      {/* Intelligence connections */}
      <path d="M5 6L5 18M19 6L19 18"
            stroke="currentColor" strokeWidth="1.5" opacity="0.3" />

      {/* AI brain overlay */}
      <circle cx="12" cy="12" r="3" fill="currentColor" opacity="0.7" />
      <circle cx="10" cy="11" r="0.5" fill="white" />
      <circle cx="14" cy="11" r="0.5" fill="white" />
      <path d="M10 13Q12 14 14 13"
            stroke="white" strokeWidth="0.5" fill="none" />
    </svg>
  );
}

// Local First Icon - Computer with shield
export function LocalFirstIcon({ className, size = 'md' }: IconProps) {
  return (
    <svg
      className={cn(sizeClasses[size], className)}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Computer screen */}
      <rect x="3" y="4" width="18" height="12" rx="2"
            stroke="currentColor" strokeWidth="1.5" fill="none" />
      <path d="M8 20L16 20" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 16L12 20" stroke="currentColor" strokeWidth="1.5" />

      {/* Shield */}
      <path d="M12 7L14 8L14 11C14 12.5 13 13.5 12 14C11 13.5 10 12.5 10 11L10 8L12 7Z"
            fill="currentColor" opacity="0.8" />

      {/* Lock icon */}
      <circle cx="12" cy="10.5" r="0.5" fill="white" />
      <path d="M11.5 10.5L11.5 12L12.5 12L12.5 10.5"
            stroke="white" strokeWidth="0.5" />
    </svg>
  );
}

// Admin Console Icon - Dashboard tiles with shield overlay
export function AdminConsoleIcon({ className, size = 'md' }: IconProps) {
  return (
    <svg
      className={cn(sizeClasses[size], className)}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Grid panels */}
      <rect x="3" y="4" width="8" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.2" opacity="0.7" />
      <rect x="3" y="12" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2" opacity="0.5" />
      <rect x="13" y="4" width="8" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.2" opacity="0.5" />

      {/* Shield */}
      <path
        d="M17 12.5C18.933 12.5 20.5 11.548 20.5 10.375V8.25C20.5 7.895 20.276 7.57 19.953 7.44L17 6.25L14.047 7.44C13.724 7.57 13.5 7.895 13.5 8.25V10.375C13.5 11.548 15.067 12.5 17 12.5Z"
        stroke="currentColor"
        strokeWidth="1.2"
        fill="currentColor"
        opacity="0.25"
      />
      <path
        d="M17 9.25V11.25"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path
        d="M16 10.25H18"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

// TypeScript Monorepo Icon
export function TypeScriptMonorepoIcon({ className, size = 'md' }: IconProps) {
  return (
    <svg
      className={cn(sizeClasses[size], className)}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Package boxes */}
      <rect x="3" y="3" width="7" height="7" rx="1"
            fill="currentColor" opacity="0.7" />
      <rect x="14" y="3" width="7" height="7" rx="1"
            fill="currentColor" opacity="0.7" />
      <rect x="3" y="14" width="7" height="7" rx="1"
            fill="currentColor" opacity="0.7" />
      <rect x="14" y="14" width="7" height="7" rx="1"
            fill="currentColor" opacity="0.7" />

      {/* Connection lines */}
      <path d="M10 6.5L14 6.5M10 17.5L14 17.5M6.5 10L6.5 14M17.5 10L17.5 14"
            stroke="currentColor" strokeWidth="1" opacity="0.4" strokeDasharray="2 1" />

      {/* TS letters */}
      <text x="6.5" y="7.5" fontSize="4" fill="white" textAnchor="middle">T</text>
      <text x="17.5" y="7.5" fontSize="4" fill="white" textAnchor="middle">S</text>
    </svg>
  );
}

// Community Graph Icon
export function CommunityGraphIcon({ className, size = 'md' }: IconProps) {
  return (
    <svg
      className={cn(sizeClasses[size], className)}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* User nodes */}
      <circle cx="12" cy="7" r="2" fill="currentColor" opacity="0.8" />
      <circle cx="7" cy="14" r="2" fill="currentColor" opacity="0.6" />
      <circle cx="17" cy="14" r="2" fill="currentColor" opacity="0.6" />
      <circle cx="5" cy="19" r="1.5" fill="currentColor" opacity="0.4" />
      <circle cx="12" cy="20" r="1.5" fill="currentColor" opacity="0.4" />
      <circle cx="19" cy="19" r="1.5" fill="currentColor" opacity="0.4" />

      {/* Connections */}
      <path d="M12 7L7 14M12 7L17 14M7 14L5 19M7 14L12 20M17 14L19 19M17 14L12 20"
            stroke="currentColor" strokeWidth="1" opacity="0.3" />
    </svg>
  );
}

// Export Format Icon - Multiple file types
export function ExportFormatIcon({ className, size = 'md' }: IconProps) {
  return (
    <svg
      className={cn(sizeClasses[size], className)}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Main document */}
      <path d="M6 2L14 2L20 8L20 22L6 22Z"
            stroke="currentColor" strokeWidth="1.5" fill="none" />
      <path d="M14 2L14 8L20 8"
            stroke="currentColor" strokeWidth="1.5" fill="none" />

      {/* Export arrow */}
      <path d="M12 12L12 18M9 15L12 18L15 15"
            stroke="currentColor" strokeWidth="2" />

      {/* Format indicators */}
      <circle cx="4" cy="4" r="1.5" fill="currentColor" opacity="0.6" />
      <circle cx="4" cy="8" r="1.5" fill="currentColor" opacity="0.6" />
      <circle cx="4" cy="12" r="1.5" fill="currentColor" opacity="0.6" />
    </svg>
  );
}

// Privacy Shield Icon with lock
export function PrivacyShieldIcon({ className, size = 'md' }: IconProps) {
  return (
    <svg
      className={cn(sizeClasses[size], className)}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="shield-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.9" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.6" />
        </linearGradient>
      </defs>

      {/* Shield shape */}
      <path d="M12 2L4 7L4 13C4 17 8 20.5 12 22C16 20.5 20 17 20 13L20 7L12 2Z"
            fill="url(#shield-gradient)" />

      {/* Lock icon */}
      <rect x="9" y="11" width="6" height="5" rx="1" fill="white" opacity="0.9" />
      <path d="M10 11L10 9C10 7.9 10.9 7 12 7C13.1 7 14 7.9 14 9L14 11"
            stroke="white" strokeWidth="1.5" fill="none" />
      <circle cx="12" cy="13.5" r="0.5" fill="currentColor" />
    </svg>
  );
}

// Interactive Demo Icon
export function InteractiveDemoIcon({ className, size = 'md' }: IconProps) {
  return (
    <svg
      className={cn(sizeClasses[size], className)}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Play button circle */}
      <circle cx="12" cy="12" r="10"
              stroke="currentColor" strokeWidth="1.5" fill="none" />

      {/* Play triangle */}
      <path d="M10 8L16 12L10 16Z" fill="currentColor" opacity="0.8" />

      {/* Interactive cursor */}
      <path d="M18 16L20 18L19 20L17 19Z"
            fill="currentColor" />

      {/* Click ripple */}
      <circle cx="18.5" cy="18.5" r="2"
              stroke="currentColor" strokeWidth="0.5" fill="none" opacity="0.4" />
    </svg>
  );
}