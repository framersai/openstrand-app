'use client';

import { useCallback, useEffect, useState } from 'react';

const CONSENT_STORAGE_KEY = 'openstrand-gdpr-consent';

type ConsentStatus = 'granted' | 'denied' | 'unknown';

export function useGdprConsent(isEnabled: boolean) {
  const [status, setStatus] = useState<ConsentStatus>('unknown');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!isEnabled) {
      setStatus('granted');
      setIsLoaded(true);
      return;
    }

    const stored =
      typeof window !== 'undefined' ? window.localStorage.getItem(CONSENT_STORAGE_KEY) : null;
    if (stored === 'granted' || stored === 'denied') {
      setStatus(stored);
    } else {
      setStatus('unknown');
    }
    setIsLoaded(true);
  }, [isEnabled]);

  const grant = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(CONSENT_STORAGE_KEY, 'granted');
    }
    setStatus('granted');
  }, []);

  const deny = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(CONSENT_STORAGE_KEY, 'denied');
    }
    setStatus('denied');
  }, []);

  return {
    consentStatus: status,
    isLoaded,
    grantConsent: grant,
    denyConsent: deny,
  };
}
