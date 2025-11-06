/**
 * Custom Language Switcher Icon
 * A beautiful multilingual icon representing global language capabilities
 * Design: Interconnected speech bubbles with language symbols
 */

import { cn } from '@/lib/utils';

interface LanguageIconProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

export function LanguageIcon({ className, size = 'md' }: LanguageIconProps) {
  const sizeMap = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
    xl: 'h-8 w-8'
  };

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={cn(sizeMap[size], 'language-icon', className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Globe outline */}
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="opacity-30"
      />

      {/* Language characters arranged around the globe */}
      {/* A (Latin) */}
      <text
        x="7"
        y="10"
        fontSize="6"
        fill="currentColor"
        fontWeight="600"
        className="opacity-90"
      >
        A
      </text>

      {/* 文 (Chinese/Japanese) */}
      <text
        x="15"
        y="10"
        fontSize="5"
        fill="currentColor"
        fontWeight="600"
        className="opacity-90"
      >
        文
      </text>

      {/* ع (Arabic) */}
      <text
        x="5"
        y="17"
        fontSize="6"
        fill="currentColor"
        fontWeight="600"
        className="opacity-90"
      >
        ع
      </text>

      {/* अ (Hindi/Devanagari) */}
      <text
        x="11"
        y="15"
        fontSize="5"
        fill="currentColor"
        fontWeight="600"
        className="opacity-90"
      >
        अ
      </text>

      {/* Connecting lines forming a network */}
      <path
        d="M8 10 L12 14 M12 14 L16 10 M8 10 L16 10 M7 16 L12 14"
        stroke="currentColor"
        strokeWidth="0.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="opacity-40"
      />

      {/* Central dot representing connection */}
      <circle
        cx="12"
        cy="12"
        r="1"
        fill="currentColor"
        className="opacity-60"
      />
    </svg>
  );
}

/**
 * Animated Language Icon with hover effects
 */
export function AnimatedLanguageIcon({ className, size = 'md' }: LanguageIconProps) {
  const sizeMap = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
    xl: 'h-8 w-8'
  };

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={cn(sizeMap[size], 'language-icon-animated group', className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="langGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" className="text-blue-500" stopColor="currentColor" />
          <stop offset="100%" className="text-purple-500" stopColor="currentColor" />
        </linearGradient>
      </defs>

      {/* Animated globe */}
      <g className="transition-transform group-hover:rotate-12">
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="url(#langGradient)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="opacity-50 transition-opacity group-hover:opacity-70"
        />

        {/* Meridian lines */}
        <ellipse
          cx="12"
          cy="12"
          rx="4"
          ry="10"
          stroke="currentColor"
          strokeWidth="0.5"
          fill="none"
          className="opacity-20"
        />
        <path
          d="M2 12 L22 12"
          stroke="currentColor"
          strokeWidth="0.5"
          className="opacity-20"
        />
      </g>

      {/* Floating language symbols with animation */}
      <g className="animate-pulse">
        {/* Speech bubble 1 */}
        <g transform="translate(6, 7)">
          <rect
            x="0"
            y="0"
            width="5"
            height="4"
            rx="1"
            stroke="currentColor"
            strokeWidth="0.5"
            fill="none"
            className="opacity-60"
          />
          <text
            x="2.5"
            y="3"
            fontSize="3"
            fill="currentColor"
            textAnchor="middle"
            className="opacity-80 font-semibold"
          >
            Hi
          </text>
        </g>

        {/* Speech bubble 2 */}
        <g transform="translate(13, 8)">
          <rect
            x="0"
            y="0"
            width="5"
            height="4"
            rx="1"
            stroke="currentColor"
            strokeWidth="0.5"
            fill="none"
            className="opacity-60"
          />
          <text
            x="2.5"
            y="3"
            fontSize="3"
            fill="currentColor"
            textAnchor="middle"
            className="opacity-80 font-semibold"
          >
            你好
          </text>
        </g>

        {/* Speech bubble 3 */}
        <g transform="translate(10, 14)">
          <rect
            x="0"
            y="0"
            width="5"
            height="4"
            rx="1"
            stroke="currentColor"
            strokeWidth="0.5"
            fill="none"
            className="opacity-60"
          />
          <text
            x="2.5"
            y="3"
            fontSize="3"
            fill="currentColor"
            textAnchor="middle"
            className="opacity-80 font-semibold"
          >
            Olá
          </text>
        </g>
      </g>

      {/* Central connection point */}
      <circle
        cx="12"
        cy="12"
        r="1.5"
        fill="currentColor"
        className="opacity-50 transition-all group-hover:opacity-80 group-hover:r-2"
      />
    </svg>
  );
}

/**
 * Simplified Language Icon for compact spaces
 */
export function CompactLanguageIcon({ className, size = 'sm' }: LanguageIconProps) {
  const sizeMap = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
    xl: 'h-8 w-8'
  };

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={cn(sizeMap[size], className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* World representation with language symbols */}
      <path
        d="M3 12C3 7.029 7.029 3 12 3C16.971 3 21 7.029 21 12C21 16.971 16.971 21 12 21C7.029 21 3 16.971 3 12Z"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />

      {/* Language wave pattern */}
      <path
        d="M5 12C5 12 8 8 12 8C16 8 19 12 19 12C19 12 16 16 12 16C8 16 5 12 5 12Z"
        stroke="currentColor"
        strokeWidth="1"
        fill="none"
        strokeLinecap="round"
        className="opacity-60"
      />

      {/* Center dot array representing multiple languages */}
      <circle cx="9" cy="12" r="0.5" fill="currentColor" />
      <circle cx="12" cy="12" r="0.5" fill="currentColor" />
      <circle cx="15" cy="12" r="0.5" fill="currentColor" />
    </svg>
  );
}