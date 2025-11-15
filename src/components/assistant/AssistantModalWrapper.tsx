'use client';

import { useEffect, useState, useCallback } from 'react';
import { AssistantModal } from './AssistantModal';
import { useSupabase } from '@/features/auth';
import { usePathname } from 'next/navigation';

export function AssistantModalWrapper() {
  const { isAuthenticated } = useSupabase();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const toggle = useCallback(() => setOpen((p) => !p), []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Shift + O opens assistant
      const isMac = navigator.platform.toLowerCase().includes('mac');
      const cmd = isMac ? e.metaKey : e.ctrlKey;
      if (cmd && e.shiftKey && (e.key === 'o' || e.key === 'O')) {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [toggle]);

  // Hide on auth pages and landing
  const isAuthPage = pathname.includes('/auth');
  const isLandingPage = pathname.endsWith('/landing');
  if (!isAuthenticated || isAuthPage || isLandingPage) {
    return null;
  }

  return <AssistantModal open={open} onOpenChange={setOpen} />;
}


