'use client';

/**
 * Highlights the sandbox constraints applied to AI Artisan visualizations.
 * Communicates allowed libraries, sandbox flags, and CSP guards.
 */

import { Shield, Lock, Code } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { SandboxConfig } from '@/lib/visualization/types';

interface AIArtisanSecurityNoticeProps {
  sandboxConfig?: SandboxConfig | null;
  className?: string;
}

const DEFAULT_SANDBOX_FLAGS = ['allow-scripts', 'allow-same-origin'];
const DEFAULT_LIBRARIES = [
  'https://d3js.org/d3.v7.min.js',
  'https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.min.js',
];
const DEFAULT_CSP = "default-src 'none'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;";

export function AIArtisanSecurityNotice({
  sandboxConfig,
  className,
}: AIArtisanSecurityNoticeProps) {
  const sandboxFlags =
    sandboxConfig?.sandbox && sandboxConfig.sandbox.length > 0
      ? sandboxConfig.sandbox
      : DEFAULT_SANDBOX_FLAGS;
  const libraries = sandboxConfig?.libraries?.length ? sandboxConfig.libraries : DEFAULT_LIBRARIES;
  const csp = sandboxConfig?.csp ?? DEFAULT_CSP;

  return (
    <div
      className={cn(
        'rounded-xl border border-amber-300/60 bg-amber-50/70 p-4 text-sm text-amber-900 shadow-sm dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100',
        className
      )}
    >
      <div className="flex items-center gap-2">
        <Shield className="h-4 w-4" />
        <h3 className="text-sm font-semibold">Sandbox & Security</h3>
      </div>
      <p className="mt-2 text-xs text-amber-900/80 dark:text-amber-100/80">
        AI Artisan runs inside an isolated iframe. Only approved libraries and sandbox permissions are
        enabled, and a strict Content Security Policy prevents external calls.
      </p>

      <div className="mt-3 space-y-3">
        <div>
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-amber-900/80 dark:text-amber-200">
            <Lock className="h-3.5 w-3.5" />
            Sandbox Flags
          </p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {sandboxFlags.map((flag) => (
              <Badge key={flag} variant="outline" className="border-amber-400/60 text-[11px] uppercase">
                {flag}
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-amber-900/80 dark:text-amber-200">
            <Code className="h-3.5 w-3.5" />
            Allowed Libraries
          </p>
          <ul className="mt-1 list-disc space-y-1 pl-4 text-xs text-amber-900/80 dark:text-amber-100/80">
            {libraries.map((library) => (
              <li key={library} className="break-all">
                {library}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-900/80 dark:text-amber-200">
            Content Security Policy
          </p>
          <pre className="mt-1 overflow-auto rounded-lg border border-amber-200/60 bg-amber-100/60 p-2 font-mono text-[11px] leading-snug dark:border-amber-500/40 dark:bg-amber-500/20">
            {csp}
          </pre>
        </div>
      </div>
    </div>
  );
}

