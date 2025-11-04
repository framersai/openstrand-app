import type { ReactNode } from 'react';

import './globals.scss';

/**
 * Root layout simply delegates to the locale-aware layout at app/[locale].
 * All actual HTML/body markup lives in the nested layout so we can set lang/dir dynamically.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}

