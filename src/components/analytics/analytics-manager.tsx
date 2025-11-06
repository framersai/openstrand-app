'use client';

import { useEffect } from 'react';
import Script from 'next/script';

import { useAppMode } from '@/hooks/useAppMode';
import { useGdprConsent } from '@/hooks/useGdprConsent';
import { useOpenStrandStore } from '@/store/openstrand.store';

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const CLARITY_PROJECT_ID = process.env.NEXT_PUBLIC_CLARITY_ID;

export function AnalyticsManager() {
  const { mode } = useAppMode();
  const capabilities = useOpenStrandStore((state) => state.capabilities);
  const loadCapabilities = useOpenStrandStore((state) => state.loadCapabilities);

  useEffect(() => {
    if (!capabilities) {
      loadCapabilities().catch(() => undefined);
    }
  }, [capabilities, loadCapabilities]);
  const gdprEnabled = capabilities?.compliance?.gdpr ?? false;
  const analyticsCaps = capabilities?.analytics ?? {};

  const { consentStatus, isLoaded } = useGdprConsent(gdprEnabled && mode !== 'offline');

  const allowAnalytics =
    mode !== 'offline' &&
    (gdprEnabled ? consentStatus === 'granted' : true) &&
    isLoaded &&
    (analyticsCaps.googleAnalytics || analyticsCaps.clarity);

  if (!allowAnalytics) {
    return null;
  }

  return (
    <>
      {analyticsCaps.googleAnalytics && GA_MEASUREMENT_ID ? (
        <>
          <Script
            strategy="afterInteractive"
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          />
          <Script
            id="ga-init"
            strategy="afterInteractive"
          >
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_MEASUREMENT_ID}', { anonymize_ip: true });
            `}
          </Script>
        </>
      ) : null}

      {analyticsCaps.clarity && CLARITY_PROJECT_ID ? (
        <Script id="clarity-init" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "${CLARITY_PROJECT_ID}");
          `}
        </Script>
      ) : null}
    </>
  );
}
