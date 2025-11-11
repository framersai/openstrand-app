'use client';

import { useState, useEffect, useCallback } from 'react';
import { Copy, RefreshCw, Key, Eye, EyeOff, ExternalLink } from 'lucide-react';
import { PageLayout } from '@/components/layouts/PageLayout';

interface ApiKey {
  id: string;
  name: string;
  key: string;
  scopes: string[];
  lastUsed: string | null;
  expiresAt: string | null;
  created: string;
}

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [rotating, setRotating] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  const fetchApiKeys = useCallback(async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/v1/user/api-keys`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setApiKeys(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch API keys:', error);
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL]);

  useEffect(() => {
    fetchApiKeys();
  }, [fetchApiKeys]);

  const rotateKey = async () => {
    setRotating(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE_URL}/api/v1/user/api-keys/rotate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        await fetchApiKeys();
      }
    } catch (error) {
      console.error('Failed to rotate key:', error);
    } finally {
      setRotating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const maskKey = (key: string) => {
    if (!key) return '';
    return `${key.slice(0, 12)}${'•'.repeat(20)}${key.slice(-4)}`;
  };

  if (loading) {
    return (
      <PageLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">Loading API keys...</div>
        </div>
      </PageLayout>
    );
  }

  const primaryKey = apiKeys[0];

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Developer API</h1>
          <p className="text-muted-foreground">
            Your personal API key for programmatic access to OpenStrand.
          </p>
        </div>

        {!primaryKey ? (
          <div className="border border-dashed rounded-lg p-8 text-center">
            <Key className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">No API key found.</p>
            <p className="text-sm text-muted-foreground">
              API keys are auto-generated on first login. Try refreshing or logging out and back in.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* API Key Card */}
            <div className="border rounded-lg p-6 bg-card">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg mb-1">{primaryKey.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    Created {new Date(primaryKey.created).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowKey(!showKey)}
                    className="p-2 hover:bg-accent rounded-md transition-colors"
                    title={showKey ? 'Hide key' : 'Show key'}
                  >
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => copyToClipboard(primaryKey.key)}
                    className="p-2 hover:bg-accent rounded-md transition-colors"
                    title="Copy to clipboard"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={rotateKey}
                    disabled={rotating}
                    className="p-2 hover:bg-accent rounded-md transition-colors disabled:opacity-50"
                    title="Rotate key"
                  >
                    <RefreshCw className={`w-4 h-4 ${rotating ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              <div className="bg-muted/50 rounded-md p-4 font-mono text-sm break-all">
                {showKey ? primaryKey.key : maskKey(primaryKey.key)}
              </div>

              {copied && (
                <p className="text-sm text-green-600 mt-2">Copied to clipboard!</p>
              )}

              <div className="mt-4 flex gap-4 text-sm text-muted-foreground">
                <div>
                  <span className="font-medium">Scopes:</span> {primaryKey.scopes.join(', ')}
                </div>
                {primaryKey.lastUsed && (
                  <div>
                    <span className="font-medium">Last used:</span>{' '}
                    {new Date(primaryKey.lastUsed).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>

            {/* Usage Examples */}
            <div className="border rounded-lg p-6">
              <h3 className="font-semibold mb-4">Usage Examples</h3>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-2">cURL</p>
                  <pre className="bg-muted/50 rounded-md p-3 text-xs overflow-x-auto">
{`curl -H "x-api-key: ${showKey ? primaryKey.key : 'YOUR_API_KEY'}" \\
  ${API_BASE_URL}/api/v1/strands`}
                  </pre>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">TypeScript SDK</p>
                  <pre className="bg-muted/50 rounded-md p-3 text-xs overflow-x-auto">
{`import { OpenStrandSDK } from '@framers/openstrand-sdk';

const sdk = new OpenStrandSDK({
  apiUrl: '${API_BASE_URL}',
  apiKey: '${showKey ? primaryKey.key : 'YOUR_API_KEY'}'
});

const strands = await sdk.strands.list();`}
                  </pre>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">Python</p>
                  <pre className="bg-muted/50 rounded-md p-3 text-xs overflow-x-auto">
{`import requests

headers = {"x-api-key": "${showKey ? primaryKey.key : 'YOUR_API_KEY'}"}
response = requests.get("${API_BASE_URL}/api/v1/strands", headers=headers)
print(response.json())`}
                  </pre>
                </div>
              </div>
            </div>

            {/* Documentation Links */}
            <div className="border rounded-lg p-6">
              <h3 className="font-semibold mb-4">Documentation</h3>
              <div className="space-y-2">
                <a
                  href="/docs/api"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <ExternalLink className="w-4 h-4" />
                  REST API Reference
                </a>
                <a
                  href="/docs/sdk"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <ExternalLink className="w-4 h-4" />
                  TypeScript SDK Documentation
                </a>
                <a
                  href="https://github.com/framersai/openstrand-monorepo/tree/master/packages/openstrand-sdk"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <ExternalLink className="w-4 h-4" />
                  SDK Source Code
                </a>
              </div>
            </div>

            {/* Security Notice */}
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg p-4">
              <p className="text-sm text-amber-900 dark:text-amber-200">
                <strong>Security:</strong> Keep your API key secret. Rotating the key will invalidate
                the old one immediately. Never commit keys to version control.
              </p>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
}

