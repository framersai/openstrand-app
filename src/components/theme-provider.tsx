/**
 * @module components/theme-provider
 * @description Theme provider component for managing dark/light mode.
 * Uses next-themes for theme persistence and system preference detection.
 */

'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { type ThemeProviderProps } from 'next-themes/dist/types';

/**
 * ThemeProvider component wrapping next-themes provider
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
