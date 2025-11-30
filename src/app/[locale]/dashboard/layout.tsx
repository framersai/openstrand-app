import type { ReactNode } from 'react';

/**
 * Dashboard Layout
 * Full-screen app layout without the site footer
 * The dashboard has its own header and takes up the full viewport
 */
export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Dashboard renders its own full-screen layout
  // No additional wrapper needed - just pass through children
  return <>{children}</>;
}

