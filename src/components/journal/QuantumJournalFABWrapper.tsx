'use client';

import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { useSupabase } from '@/features/auth';

// Dynamic import to avoid SSR issues with animations
const QuantumJournalFAB = dynamic(
  () => import('./QuantumJournalFAB').then(mod => mod.QuantumJournalFAB),
  { ssr: false }
);

export function QuantumJournalFABWrapper() {
  const { isAuthenticated } = useSupabase();
  const pathname = usePathname();
  
  // Don't show FAB on auth pages or landing page
  const isAuthPage = pathname.includes('/auth');
  const isLandingPage = pathname.endsWith('/landing');
  
  // Only show for authenticated users on app pages
  if (!isAuthenticated || isAuthPage || isLandingPage) {
    return null;
  }
  
  return <QuantumJournalFAB />;
}
