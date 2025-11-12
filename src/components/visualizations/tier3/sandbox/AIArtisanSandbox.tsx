'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AIArtisanResult } from '@/lib/visualization/types';
import { AlertCircle } from 'lucide-react';

interface AIArtisanSandboxProps {
  code: AIArtisanResult['code'];
  data: unknown;
  sandboxConfig?: AIArtisanResult['sandboxConfig'];
  onError?: (error: Error) => void;
  className?: string;
}

const DEFAULT_LIBRARIES = [
  'https://d3js.org/d3.v7.min.js',
  'https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.min.js',
];

const DEFAULT_SANDBOX_FLAGS = ['allow-scripts', 'allow-same-origin'];

const escapeAttribute = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;');

export default function AIArtisanSandbox({
  code,
  data,
  sandboxConfig,
  onError,
  className = '',
}: AIArtisanSandboxProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const serializedData = useMemo(() => {
    try {
      return JSON.stringify(data ?? null).replace(/</g, '\\u003C');
    } catch (serializationError) {
      console.error('Failed to serialize AI Artisan data payload', serializationError);
      onError?.(new Error('Failed to serialize data for AI Artisan sandbox'));
      return 'null';
    }
  }, [data, onError]);

  useEffect(() => {
    if (!iframeRef.current) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const iframeDoc =
        iframeRef.current.contentDocument || iframeRef.current.contentWindow?.document;

      if (!iframeDoc) {
        throw new Error('Cannot access iframe document');
      }

      const libraryScripts = (sandboxConfig?.libraries?.length
        ? sandboxConfig.libraries
        : DEFAULT_LIBRARIES
      )
        .map((src) => `<script src="${src}"></script>`)
        .join('\n');

      const cspMeta = sandboxConfig?.csp
        ? `<meta http-equiv="Content-Security-Policy" content="${escapeAttribute(sandboxConfig.csp)}">`
        : '';

      // Build the complete HTML document
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          ${cspMeta}

          <!-- External Libraries -->
          ${libraryScripts}

          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: system-ui, -apple-system, sans-serif;
              background: white;
              overflow: hidden;
            }
            #viz-container {
              width: 100vw;
              height: 100vh;
              position: relative;
            }
            ${code.css || ''}
          </style>
        </head>
        <body>
          ${code.html || '<div id="viz-container"></div>'}

          <script>
            // Make data available globally
            window.vizData = ${serializedData};

            // Error handling
            window.addEventListener('error', function(e) {
              console.error('AI Artisan Error:', e);
              window.parent.postMessage({
                type: 'ai-artisan-error',
                error: e.message
              }, '*');
            });

            // Execute the AI Artisan code
            try {
              ${code.js}
            } catch (e) {
              console.error('AI Artisan execution error:', e);
              window.parent.postMessage({
                type: 'ai-artisan-error',
                error: e.message
              }, '*');
            }

            // Signal that loading is complete
            window.parent.postMessage({ type: 'ai-artisan-ready' }, '*');
          </script>
        </body>
        </html>
      `;

      // Write the content to the iframe
      iframeDoc.open();
      iframeDoc.write(htmlContent);
      iframeDoc.close();

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to render AI Artisan code';
      setError(errorMessage);
      onError?.(new Error(errorMessage));
    }
  }, [code, serializedData, sandboxConfig, onError]);

  // Listen for messages from the iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent<{ type?: string; error?: string }>) => {
      if (!event.data || typeof event.data !== 'object') {
        return;
      }
      if (event.data.type === 'ai-artisan-ready') {
        setIsLoading(false);
      } else if (event.data.type === 'ai-artisan-error') {
        const msg = event.data.error ?? 'Unknown error';
        setError(msg);
        setIsLoading(false);
        onError?.(new Error(msg));
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onError]);

  const sandboxAttributes = sandboxConfig?.sandbox?.length
    ? sandboxConfig.sandbox
    : DEFAULT_SANDBOX_FLAGS;

  return (
    <div className={`relative bg-white dark:bg-gray-900 rounded-lg overflow-hidden ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 z-10 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Loading AI Artisan visualization...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 bg-white dark:bg-gray-900 z-20 flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">AI Artisan Error</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{error}</p>
            <button
              onClick={() => {
                setError(null);
                setIsLoading(true);
              }}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      <iframe
        ref={iframeRef}
        sandbox={sandboxAttributes.join(' ')}
        className="w-full h-full border-0"
        style={{ minHeight: '600px' }}
        title="AI Artisan Visualization"
      />
    </div>
  );
}
