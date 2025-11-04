import type { SVGProps } from 'react';

export function MoonIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 28 28" fill="none" {...props}>
      <defs>
        <radialGradient id="moon-glow" cx="50%" cy="50%" r="65%">
          <stop offset="0%" stopColor="#fefce8" stopOpacity="0.9" />
          <stop offset="70%" stopColor="#f8fafc" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#1e293b" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="14" cy="14" r="11" fill="url(#moon-glow)" opacity="0.6" />
      <path
        d="M18.5 5.6c.3.6.5 1.4.5 2.1 0 3.9-3.2 7-7.2 7-1.6 0-3.1-.5-4.3-1.5a8.5 8.5 0 0 0 7.7 5.1c4.7 0 8.5-3.7 8.5-8.2 0-1.7-.5-3.3-1.4-4.6-.8-.3-1.7.1-3.8 0Z"
        fill="#fff9ec"
        stroke="#e2e8f0"
        strokeWidth="0.8"
      />
      <circle cx="11" cy="9.5" r="0.7" fill="#f1f5f9" />
      <circle cx="9.5" cy="12" r="0.5" fill="#f1f5f9" />
      <circle cx="13" cy="16" r="0.6" fill="#e2e8f0" />
    </svg>
  );
}


