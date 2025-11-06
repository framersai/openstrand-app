'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface AnimatedBackgroundProps {
  variant?: 'ocean' | 'neural' | 'grid' | 'particles' | 'waves';
  className?: string;
  intensity?: 'light' | 'medium' | 'strong';
}

export function AnimatedBackground({
  variant = 'ocean',
  className,
  intensity = 'light'
}: AnimatedBackgroundProps) {
  const intensityOpacity = {
    light: 'opacity-10',
    medium: 'opacity-20',
    strong: 'opacity-30'
  };

  if (variant === 'ocean') {
    return (
      <div className={cn('absolute inset-0 overflow-hidden pointer-events-none', className)}>
        {/* Ocean waves */}
        <svg className={cn('absolute inset-0 w-full h-full', intensityOpacity[intensity])} preserveAspectRatio="none">
          <defs>
            <linearGradient id="ocean-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#14b8a6" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.2" />
            </linearGradient>
          </defs>
          <path
            d="M0,100 C150,120 300,80 450,100 C600,120 750,80 900,100 L900,200 L0,200 Z"
            fill="url(#ocean-gradient)"
            className="animate-ocean-wave"
          >
            <animate
              attributeName="d"
              values="M0,100 C150,120 300,80 450,100 C600,120 750,80 900,100 L900,200 L0,200 Z;
                      M0,100 C150,80 300,120 450,100 C600,80 750,120 900,100 L900,200 L0,200 Z;
                      M0,100 C150,120 300,80 450,100 C600,120 750,80 900,100 L900,200 L0,200 Z"
              dur="6s"
              repeatCount="indefinite"
            />
          </path>
          <path
            d="M0,140 C200,160 400,120 600,140 C800,160 1000,120 1200,140 L1200,200 L0,200 Z"
            fill="url(#ocean-gradient)"
            opacity="0.6"
          >
            <animate
              attributeName="d"
              values="M0,140 C200,160 400,120 600,140 C800,160 1000,120 1200,140 L1200,200 L0,200 Z;
                      M0,140 C200,120 400,160 600,140 C800,120 1000,160 1200,140 L1200,200 L0,200 Z;
                      M0,140 C200,160 400,120 600,140 C800,160 1000,120 1200,140 L1200,200 L0,200 Z"
              dur="8s"
              repeatCount="indefinite"
            />
          </path>
        </svg>

        {/* Floating particles */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className={cn(
                'absolute w-1 h-1 bg-cyan-400 rounded-full animate-float',
                `stagger-${(i % 6) + 1}`
              )}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${5 + Math.random() * 5}s`
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (variant === 'neural') {
    return (
      <div className={cn('absolute inset-0 overflow-hidden pointer-events-none', className)}>
        <svg className={cn('absolute inset-0 w-full h-full', intensityOpacity[intensity])}>
          <defs>
            <linearGradient id="neural-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#14b8a6" stopOpacity="0.1" />
            </linearGradient>
          </defs>

          {/* Neural network connections */}
          {[...Array(8)].map((_, i) => {
            const x1 = 100 + (i % 4) * 200;
            const y1 = 100 + Math.floor(i / 4) * 200;
            const x2 = x1 + 150 + Math.random() * 100;
            const y2 = y1 + 150 + Math.random() * 100;

            return (
              <g key={i}>
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="url(#neural-gradient)"
                  strokeWidth="1"
                  strokeDasharray="5,5"
                  className="animate-pulse"
                  style={{ animationDelay: `${i * 0.2}s` }}
                />
                <circle
                  cx={x1}
                  cy={y1}
                  r="3"
                  fill="#06b6d4"
                  className="animate-pulse"
                  style={{ animationDelay: `${i * 0.2}s` }}
                />
                <circle
                  cx={x2}
                  cy={y2}
                  r="3"
                  fill="#14b8a6"
                  className="animate-pulse"
                  style={{ animationDelay: `${i * 0.2 + 0.5}s` }}
                />
              </g>
            );
          })}
        </svg>
      </div>
    );
  }

  if (variant === 'grid') {
    return (
      <div className={cn('absolute inset-0 overflow-hidden pointer-events-none', className)}>
        <div
          className={cn(
            'absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-teal-500/5',
            intensityOpacity[intensity]
          )}
          style={{
            backgroundImage: `
              linear-gradient(rgba(6, 182, 212, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(6, 182, 212, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background" />
      </div>
    );
  }

  if (variant === 'particles') {
    return (
      <div className={cn('absolute inset-0 overflow-hidden pointer-events-none', className)}>
        {[...Array(50)].map((_, i) => {
          const size = Math.random() * 3 + 1;
          const duration = Math.random() * 20 + 10;
          const delay = Math.random() * 10;

          return (
            <div
              key={i}
              className={cn('absolute rounded-full', intensityOpacity[intensity])}
              style={{
                width: `${size}px`,
                height: `${size}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                background: `radial-gradient(circle, ${
                  i % 3 === 0 ? '#06b6d4' : i % 3 === 1 ? '#14b8a6' : '#10b981'
                }, transparent)`,
                animation: `float ${duration}s ease-in-out ${delay}s infinite`
              }}
            />
          );
        })}
      </div>
    );
  }

  if (variant === 'waves') {
    return (
      <div className={cn('absolute inset-0 overflow-hidden pointer-events-none', className)}>
        <div className="absolute inset-0">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className={cn(
                'absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500 to-transparent',
                intensityOpacity[intensity]
              )}
              style={{
                transform: `translateY(${i * 100}px)`,
                animation: `dataFlow ${3 + i}s linear infinite`,
                animationDelay: `${i * 0.5}s`
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  return null;
}

// Ocean depth indicator component
export function OceanDepthIndicator({ depth = 0 }: { depth?: number }) {
  return (
    <div className="absolute right-8 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2 pointer-events-none">
      <div className="text-xs font-mono text-cyan-600/60 dark:text-cyan-400/60">DEPTH</div>
      <div className="relative h-48 w-1 bg-gradient-to-b from-cyan-200/20 to-cyan-900/40 rounded-full overflow-hidden">
        <div
          className="absolute bottom-0 w-full bg-gradient-to-t from-cyan-600 to-cyan-400 transition-all duration-1000"
          style={{ height: `${Math.min(100, depth)}%` }}
        />
      </div>
      <div className="text-sm font-mono text-cyan-600 dark:text-cyan-400">{depth}m</div>
    </div>
  );
}

// Animated connection lines
export function ConnectionLines() {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
      <defs>
        <linearGradient id="line-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#06b6d4" stopOpacity="0" />
          <stop offset="50%" stopColor="#06b6d4" stopOpacity="1" />
          <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
        </linearGradient>
      </defs>

      {[...Array(5)].map((_, i) => (
        <line
          key={i}
          x1="0"
          y1={100 + i * 100}
          x2="100%"
          y2={150 + i * 80}
          stroke="url(#line-gradient)"
          strokeWidth="0.5"
          strokeDasharray="5,10"
        >
          <animate
            attributeName="stroke-dashoffset"
            values="0;15"
            dur={`${3 + i}s`}
            repeatCount="indefinite"
          />
        </line>
      ))}
    </svg>
  );
}