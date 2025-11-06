'use client';

import { cn } from '@/lib/utils';

interface IllustrationProps {
  className?: string;
  animated?: boolean;
}

// Empty Dataset Illustration
export function EmptyDatasetIllustration({ className, animated = true }: IllustrationProps) {
  return (
    <svg
      className={cn('w-64 h-64', className)}
      viewBox="0 0 400 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background circles */}
      <circle cx="200" cy="200" r="180" fill="url(#gradient1)" opacity="0.1" />
      <circle cx="200" cy="200" r="140" fill="url(#gradient1)" opacity="0.1" />

      {/* Data nodes floating */}
      <g className={animated ? 'animate-float' : ''}>
        <rect x="120" y="140" width="60" height="60" rx="8" fill="#06b6d4" opacity="0.2" />
        <rect x="220" y="100" width="60" height="60" rx="8" fill="#14b8a6" opacity="0.2" />
        <rect x="170" y="220" width="60" height="60" rx="8" fill="#10b981" opacity="0.2" />
      </g>

      {/* Central upload area */}
      <rect x="150" y="150" width="100" height="100" rx="12" stroke="#06b6d4" strokeWidth="2" strokeDasharray="8 4" fill="none" />

      {/* Upload icon */}
      <g transform="translate(200, 200)">
        <path
          d="M-20 5 L-20 15 L20 15 L20 5"
          stroke="#06b6d4"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M0 10 L0 -10 M-8 -2 L0 -10 L8 -2"
          stroke="#06b6d4"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={animated ? 'animate-pulse' : ''}
        />
      </g>

      {/* Floating dots */}
      {animated && (
        <>
          <circle cx="100" cy="100" r="3" fill="#06b6d4" className="animate-pulse" />
          <circle cx="300" cy="120" r="3" fill="#14b8a6" className="animate-pulse delay-100" />
          <circle cx="320" cy="280" r="3" fill="#10b981" className="animate-pulse delay-200" />
          <circle cx="80" cy="300" r="3" fill="#06b6d4" className="animate-pulse delay-300" />
        </>
      )}

      {/* Gradients */}
      <defs>
        <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#14b8a6" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// No Visualizations Illustration
export function NoVisualizationsIllustration({ className, animated = true }: IllustrationProps) {
  return (
    <svg
      className={cn('w-64 h-64', className)}
      viewBox="0 0 400 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background pattern */}
      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e5e5e5" strokeWidth="1" opacity="0.3" />
      </pattern>
      <rect width="400" height="400" fill="url(#grid)" />

      {/* Chart placeholders */}
      <g className={animated ? 'animate-fade-in-scale' : ''}>
        {/* Bar chart */}
        <g transform="translate(80, 150)">
          <rect x="0" y="20" width="15" height="40" fill="#06b6d4" opacity="0.3" />
          <rect x="20" y="10" width="15" height="50" fill="#06b6d4" opacity="0.4" />
          <rect x="40" y="25" width="15" height="35" fill="#06b6d4" opacity="0.3" />
          <rect x="60" y="15" width="15" height="45" fill="#06b6d4" opacity="0.4" />
        </g>

        {/* Line chart */}
        <g transform="translate(250, 150)">
          <polyline
            points="0,40 20,20 40,30 60,10"
            stroke="#14b8a6"
            strokeWidth="2"
            fill="none"
            opacity="0.5"
          />
          <circle cx="0" cy="40" r="3" fill="#14b8a6" opacity="0.6" />
          <circle cx="20" cy="20" r="3" fill="#14b8a6" opacity="0.6" />
          <circle cx="40" cy="30" r="3" fill="#14b8a6" opacity="0.6" />
          <circle cx="60" cy="10" r="3" fill="#14b8a6" opacity="0.6" />
        </g>

        {/* Pie chart */}
        <g transform="translate(200, 250)">
          <circle cx="0" cy="0" r="35" fill="none" stroke="#10b981" strokeWidth="30" opacity="0.2" strokeDasharray="70 140" />
          <circle cx="0" cy="0" r="35" fill="none" stroke="#06b6d4" strokeWidth="30" opacity="0.2" strokeDasharray="50 160" strokeDashoffset="-70" />
          <circle cx="0" cy="0" r="35" fill="none" stroke="#14b8a6" strokeWidth="30" opacity="0.2" strokeDasharray="20 190" strokeDashoffset="-120" />
        </g>
      </g>

      {/* Sparkles */}
      <g className={animated ? 'animate-sparkle' : ''}>
        <path d="M150 100 L155 105 L150 110 L145 105 Z" fill="#fbbf24" opacity="0.8" />
        <path d="M300 200 L305 205 L300 210 L295 205 Z" fill="#fbbf24" opacity="0.8" />
        <path d="M100 280 L105 285 L100 290 L95 285 Z" fill="#fbbf24" opacity="0.8" />
      </g>
    </svg>
  );
}

// Knowledge Graph Illustration
export function KnowledgeGraphIllustration({ className, animated = true }: IllustrationProps) {
  return (
    <svg
      className={cn('w-64 h-64', className)}
      viewBox="0 0 400 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Connection lines */}
      <g opacity="0.3">
        <line x1="100" y1="100" x2="200" y2="150" stroke="#06b6d4" strokeWidth="1" />
        <line x1="200" y1="150" x2="300" y2="100" stroke="#06b6d4" strokeWidth="1" />
        <line x1="200" y1="150" x2="150" y2="250" stroke="#14b8a6" strokeWidth="1" />
        <line x1="200" y1="150" x2="250" y2="250" stroke="#14b8a6" strokeWidth="1" />
        <line x1="150" y1="250" x2="250" y2="250" stroke="#10b981" strokeWidth="1" />
        <line x1="100" y1="100" x2="150" y2="250" stroke="#10b981" strokeWidth="1" strokeDasharray="4 2" />
        <line x1="300" y1="100" x2="250" y2="250" stroke="#10b981" strokeWidth="1" strokeDasharray="4 2" />
      </g>

      {/* Main nodes */}
      <g className={animated ? 'animate-pulse' : ''}>
        <circle cx="200" cy="150" r="20" fill="#06b6d4" opacity="0.8" />
      </g>

      {/* Secondary nodes */}
      <circle cx="100" cy="100" r="15" fill="#14b8a6" opacity="0.6" />
      <circle cx="300" cy="100" r="15" fill="#14b8a6" opacity="0.6" />
      <circle cx="150" cy="250" r="15" fill="#10b981" opacity="0.6" />
      <circle cx="250" cy="250" r="15" fill="#10b981" opacity="0.6" />

      {/* Small connection nodes */}
      <circle cx="150" cy="125" r="5" fill="#06b6d4" opacity="0.4" />
      <circle cx="250" cy="125" r="5" fill="#06b6d4" opacity="0.4" />
      <circle cx="175" cy="200" r="5" fill="#14b8a6" opacity="0.4" />
      <circle cx="225" cy="200" r="5" fill="#14b8a6" opacity="0.4" />

      {/* Animated particles along paths */}
      {animated && (
        <>
          <circle r="3" fill="#06b6d4">
            <animateMotion dur="3s" repeatCount="indefinite">
              <mpath href="#path1" />
            </animateMotion>
          </circle>
          <circle r="3" fill="#14b8a6">
            <animateMotion dur="4s" repeatCount="indefinite">
              <mpath href="#path2" />
            </animateMotion>
          </circle>
        </>
      )}

      {/* Hidden paths for animation */}
      <defs>
        <path id="path1" d="M100,100 L200,150 L300,100" />
        <path id="path2" d="M150,250 L200,150 L250,250" />
      </defs>
    </svg>
  );
}

// Processing Animation
export function ProcessingIllustration({ className, animated = true }: IllustrationProps) {
  return (
    <svg
      className={cn('w-64 h-64', className)}
      viewBox="0 0 400 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Central processor */}
      <rect x="150" y="150" width="100" height="100" rx="8" fill="#06b6d4" opacity="0.2" />
      <rect x="160" y="160" width="80" height="80" rx="4" fill="#06b6d4" opacity="0.3" />

      {/* Processing lines */}
      <g className={animated ? 'animate-pulse' : ''}>
        <rect x="50" y="195" width="100" height="10" rx="5" fill="#14b8a6" opacity="0.6" />
        <rect x="250" y="195" width="100" height="10" rx="5" fill="#14b8a6" opacity="0.6" />
        <rect x="195" y="50" width="10" height="100" rx="5" fill="#10b981" opacity="0.6" />
        <rect x="195" y="250" width="10" height="100" rx="5" fill="#10b981" opacity="0.6" />
      </g>

      {/* Data particles */}
      {animated && (
        <g>
          <circle cx="50" cy="200" r="4" fill="#06b6d4" className="animate-slide-in-right" />
          <circle cx="350" cy="200" r="4" fill="#06b6d4" className="animate-slide-in-left" />
          <circle cx="200" cy="50" r="4" fill="#14b8a6" className="animate-fade-in" />
          <circle cx="200" cy="350" r="4" fill="#14b8a6" className="animate-fade-in delay-200" />
        </g>
      )}

      {/* Central icon */}
      <g transform="translate(200, 200)">
        <circle
          cx="0"
          cy="0"
          r="15"
          fill="none"
          stroke="#06b6d4"
          strokeWidth="2"
          strokeDasharray="4 2"
          className={animated ? 'animate-spin' : ''}
          style={{ transformOrigin: '0 0' }}
        />
      </g>
    </svg>
  );
}

// Success Illustration
export function SuccessIllustration({ className, animated = true }: IllustrationProps) {
  return (
    <svg
      className={cn('w-64 h-64', className)}
      viewBox="0 0 400 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background celebration */}
      <g className={animated ? 'animate-fade-in' : ''}>
        <circle cx="200" cy="200" r="100" fill="#10b981" opacity="0.1" />
        <circle cx="200" cy="200" r="80" fill="#10b981" opacity="0.1" />
      </g>

      {/* Checkmark circle */}
      <circle cx="200" cy="200" r="60" fill="none" stroke="#10b981" strokeWidth="4" />

      {/* Checkmark */}
      <path
        d="M170 200 L190 220 L230 180"
        stroke="#10b981"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={animated ? 'animate-fade-in-scale' : ''}
      />

      {/* Confetti */}
      {animated && (
        <g className="animate-float">
          <rect x="120" y="100" width="10" height="20" rx="2" fill="#fbbf24" transform="rotate(25 125 110)" />
          <rect x="270" y="120" width="10" height="20" rx="2" fill="#f87171" transform="rotate(-30 275 130)" />
          <rect x="150" y="280" width="10" height="20" rx="2" fill="#06b6d4" transform="rotate(45 155 290)" />
          <rect x="280" y="270" width="10" height="20" rx="2" fill="#14b8a6" transform="rotate(-20 285 280)" />
        </g>
      )}
    </svg>
  );
}