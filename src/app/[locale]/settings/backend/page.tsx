'use client';

import { useState, useEffect } from 'react';
import { Check, AlertCircle, RefreshCw, Server } from 'lucide-react';
import { PageLayout } from '@/components/layouts/PageLayout';

interface Capabilities {
  edition: 'community' | 'team';
  rbac: boolean;
  offline_sync: boolean;
  version: string;
  publicLinks?: {
    enabled: boolean;
    maxTTL: number;
  };
}

export default function BackendSettingsPage() {
  const [backendUrl, setBackendUrl] = useState('');
  const [currentUrl, setCurrentUrl] = useState('');
  const [validating, setValidating] = useState(false);
  const [capabilities, setCapabilities] = useState<Capabilities | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('backend_url') || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    setCurrentUrl(stored);
    setBackendUrl(stored);
    validateBackend(stored);
  }, []);

  const validateBackend = async (url: string) => {
    setValidating(true);
    setError(null);
    try {
      const response = await fetch(`${url}/api/v1/meta/capabilities`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Backend not reachable');
      }

      const data = await response.json();
      setCapabilities(data);
    } catch (err) {
      setError((err as Error).message);
      setCapabilities(null);
    } finally {
      setValidating(false);
    }
  };

  const handleSave = async () => {
    await validateBackend(backendUrl);
    if (!error) {
      localStorage.setItem('backend_url', backendUrl);
      setCurrentUrl(backendUrl);
      // Reload to apply new backend
      window.location.reload();
    }
  };

  const handleReset = () => {
    const defaultUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    setBackendUrl(defaultUrl);
    validateBackend(defaultUrl);
  };

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Backend Configuration</h1>
          <p className="text-muted-foreground">
            Configure which OpenStrand backend to connect to. Switch between local, cloud, or self-hosted instances.
          </p>
        </div>

        <div className="space-y-6">
          {/* Current Backend */}
          <div className="border rounded-lg p-6 bg-card">
            <div className="flex items-start gap-4">
              <Server className="w-6 h-6 text-primary mt-1" />
              <div className="flex-1">
                <h3 className="font-semibold mb-2">Current Backend</h3>
                <p className="text-sm text-muted-foreground mb-4">{currentUrl}</p>
                
                {capabilities && (
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <span>Edition: <strong>{capabilities.edition}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <span>Version: {capabilities.version}</span>
                    </div>
                    {capabilities.rbac && (
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-600" />
                        <span>RBAC enabled</span>
                      </div>
                    )}
                    {capabilities.offline_sync && (
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-600" />
                        <span>Offline sync supported</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Change Backend */}
          <div className="border rounded-lg p-6">
            <h3 className="font-semibold mb-4">Change Backend URL</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Backend URL
                </label>
                <input
                  type="url"
                  value={backendUrl}
                  onChange={(e) => setBackendUrl(e.target.value)}
                  placeholder="https://api.openstrand.ai"
                  className="w-full px-3 py-2 border rounded-md bg-background"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-sm text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => validateBackend(backendUrl)}
                  disabled={validating}
                  className="px-4 py-2 border rounded-md hover:bg-accent transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${validating ? 'animate-spin' : ''}`} />
                  Validate
                </button>
                <button
                  onClick={handleSave}
                  disabled={validating || !!error || backendUrl === currentUrl}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  Save & Reload
                </button>
                <button
                  onClick={handleReset}
                  className="px-4 py-2 border rounded-md hover:bg-accent transition-colors"
                >
                  Reset to Default
                </button>
              </div>
            </div>
          </div>

          {/* Presets */}
          <div className="border rounded-lg p-6">
            <h3 className="font-semibold mb-4">Quick Presets</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                onClick={() => setBackendUrl('http://localhost:8000')}
                className="p-3 border rounded-md hover:bg-accent transition-colors text-left"
              >
                <p className="font-medium text-sm">Local</p>
                <p className="text-xs text-muted-foreground">localhost:8000</p>
              </button>
              <button
                onClick={() => setBackendUrl('https://api.openstrand.ai')}
                className="p-3 border rounded-md hover:bg-accent transition-colors text-left"
              >
                <p className="font-medium text-sm">Cloud (Production)</p>
                <p className="text-xs text-muted-foreground">api.openstrand.ai</p>
              </button>
              <button
                onClick={() => setBackendUrl('https://staging-api.openstrand.ai')}
                className="p-3 border rounded-md hover:bg-accent transition-colors text-left"
              >
                <p className="font-medium text-sm">Staging</p>
                <p className="text-xs text-muted-foreground">staging-api.openstrand.ai</p>
              </button>
            </div>
          </div>

          {/* Info */}
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-4">
            <p className="text-sm text-blue-900 dark:text-blue-200">
              <strong>Note:</strong> Changing the backend URL will reload the app. Make sure you have
              valid credentials for the target backend. Your local data will remain intact.
            </p>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

