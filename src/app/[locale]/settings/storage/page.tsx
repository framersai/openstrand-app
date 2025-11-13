'use client';

import { useState, useEffect } from 'react';
import { 
  HardDrive, 
  FolderOpen, 
  GitBranch, 
  Check, 
  AlertCircle, 
  RefreshCw,
  Trash2,
  Info,
  ExternalLink
} from 'lucide-react';
import { PageLayout } from '@/components/layouts/PageLayout';
import { useToast } from '@/hooks/use-toast';

interface StoragePolicy {
  provider: 'local' | 's3';
  contentRootPath?: string;
  bucket?: string;
  prefix?: string;
  mirrorMode: 'off' | 'mirror' | 'twoway';
  gitEnabled: boolean;
  pruneBehavior: 'confirm' | 'trash' | 'immediate';
  maxAssetSizeMB: number;
  compression: string;
  dedupe: boolean;
  isLockedByTeam: boolean;
}

interface StorageStatus {
  policy: StoragePolicy;
  gitStatus?: {
    initialized: boolean;
    lastCommit?: string;
    commitCount?: number;
  };
  stats?: {
    notesCount: number;
    assetsCount: number;
    totalSizeMB: number;
  };
}

/**
 * Storage settings page for Community Edition users.
 * Allows configuration of local backup mirroring, Git integration, and prune behavior.
 */
export default function StorageSettingsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [status, setStatus] = useState<StorageStatus | null>(null);
  const [policy, setPolicy] = useState<Partial<StoragePolicy>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('auth_token');
      const backendUrl = localStorage.getItem('backend_url') || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      
      const response = await fetch(`${backendUrl}/api/v1/storage/status`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load storage status');
      }

      const data = await response.json();
      setStatus(data.data);
      setPolicy(data.data.policy);
    } catch (err) {
      setError((err as Error).message);
      toast({
        title: 'Error',
        description: 'Failed to load storage settings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const token = localStorage.getItem('auth_token');
      const backendUrl = localStorage.getItem('backend_url') || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      
      const response = await fetch(`${backendUrl}/api/v1/storage/policy`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(policy),
      });

      if (!response.ok) {
        throw new Error('Failed to save storage policy');
      }

      toast({
        title: 'Success',
        description: 'Storage settings saved successfully',
      });

      await loadStatus();
    } catch (err) {
      setError((err as Error).message);
      toast({
        title: 'Error',
        description: 'Failed to save storage settings',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const token = localStorage.getItem('auth_token');
      const backendUrl = localStorage.getItem('backend_url') || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      
      const response = await fetch(`${backendUrl}/api/v1/storage/sync`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Sync failed');
      }

      toast({
        title: 'Sync Started',
        description: 'Your content is being mirrored to local storage',
      });

      // Reload status after a delay
      setTimeout(loadStatus, 2000);
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to start sync',
        variant: 'destructive',
      });
    } finally {
      setSyncing(false);
    }
  };

  const openInExplorer = () => {
    if (!status?.policy.contentRootPath) {
      toast({
        title: 'No Path Set',
        description: 'Please configure a content root path first',
        variant: 'destructive',
      });
      return;
    }

    // For Electron/desktop, we'd use IPC to open the folder
    // For web, show a message
    toast({
      title: 'Content Root',
      description: status.policy.contentRootPath,
      action: {
        label: 'Copy Path',
        onClick: () => {
          navigator.clipboard.writeText(status.policy.contentRootPath!);
          toast({ title: 'Copied', description: 'Path copied to clipboard' });
        },
      },
    });
  };

  if (loading) {
    return (
      <PageLayout>
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        </div>
      </PageLayout>
    );
  }

  const isLocked = status?.policy.isLockedByTeam;

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Storage & Backup</h1>
          <p className="text-muted-foreground">
            Configure local mirroring, Git integration, and backup behavior for your notes and assets.
          </p>
        </div>

        <div className="space-y-6">
          {/* Locked by Team Notice */}
          {isLocked && (
            <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                <div>
                  <p className="font-semibold text-yellow-900 dark:text-yellow-200">Team Policy Active</p>
                  <p className="text-sm text-yellow-800 dark:text-yellow-300 mt-1">
                    Your team administrator has locked storage settings. Contact your admin to make changes.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Current Status */}
          <div className="border rounded-lg p-6 bg-card">
            <div className="flex items-start gap-4">
              <HardDrive className="w-6 h-6 text-primary mt-1" />
              <div className="flex-1">
                <h3 className="font-semibold mb-2">Current Status</h3>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Mirror Mode:</span>
                    <span className="font-medium capitalize">{status?.policy.mirrorMode || 'off'}</span>
                  </div>
                  
                  {status?.policy.contentRootPath && (
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Content Root:</span>
                      <code className="text-xs bg-muted px-2 py-1 rounded">{status.policy.contentRootPath}</code>
                      <button
                        onClick={openInExplorer}
                        className="text-primary hover:underline flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  {status?.gitStatus?.initialized && (
                    <div className="flex items-center gap-2">
                      <GitBranch className="w-4 h-4 text-green-600" />
                      <span>Git initialized • {status.gitStatus.commitCount || 0} commits</span>
                      {status.gitStatus.lastCommit && (
                        <span className="text-muted-foreground text-xs">
                          (last: {new Date(status.gitStatus.lastCommit).toLocaleString()})
                        </span>
                      )}
                    </div>
                  )}

                  {status?.stats && (
                    <div className="flex items-center gap-4 mt-3 pt-3 border-t">
                      <span className="text-xs text-muted-foreground">
                        {status.stats.notesCount} notes
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {status.stats.assetsCount} assets
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {status.stats.totalSizeMB.toFixed(2)} MB
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Mirror Settings */}
          <div className="border rounded-lg p-6">
            <h3 className="font-semibold mb-4">Mirror Settings</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Content Root Path
                </label>
                <input
                  type="text"
                  value={policy.contentRootPath || ''}
                  onChange={(e) => setPolicy({ ...policy, contentRootPath: e.target.value })}
                  placeholder="/Users/you/Documents/OpenStrand"
                  disabled={isLocked}
                  className="w-full px-3 py-2 border rounded-md bg-background disabled:opacity-50"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Local directory where notes and assets will be mirrored
                </p>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="mirrorEnabled"
                  checked={policy.mirrorMode === 'mirror'}
                  onChange={(e) => setPolicy({ ...policy, mirrorMode: e.target.checked ? 'mirror' : 'off' })}
                  disabled={isLocked}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <label htmlFor="mirrorEnabled" className="text-sm font-medium">
                  Enable mirroring (one-way DB → filesystem)
                </label>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="gitEnabled"
                  checked={policy.gitEnabled || false}
                  onChange={(e) => setPolicy({ ...policy, gitEnabled: e.target.checked })}
                  disabled={isLocked}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <label htmlFor="gitEnabled" className="text-sm font-medium flex items-center gap-2">
                  <GitBranch className="w-4 h-4" />
                  Initialize Git repository and auto-commit changes
                </label>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="dedupe"
                  checked={policy.dedupe !== false}
                  onChange={(e) => setPolicy({ ...policy, dedupe: e.target.checked })}
                  disabled={isLocked}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <label htmlFor="dedupe" className="text-sm font-medium">
                  Enable deduplication (save storage space)
                </label>
              </div>
            </div>
          </div>

          {/* Advanced Settings */}
          <div className="border rounded-lg p-6">
            <h3 className="font-semibold mb-4">Advanced Settings</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Delete Behavior
                </label>
                <select
                  value={policy.pruneBehavior || 'confirm'}
                  onChange={(e) => setPolicy({ ...policy, pruneBehavior: e.target.value as any })}
                  disabled={isLocked}
                  className="w-full px-3 py-2 border rounded-md bg-background disabled:opacity-50"
                >
                  <option value="confirm">Ask before deleting mirrored files</option>
                  <option value="trash">Move to .trash/ folder</option>
                  <option value="immediate">Delete immediately</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Max Asset Size (MB)
                </label>
                <input
                  type="number"
                  value={policy.maxAssetSizeMB || 512}
                  onChange={(e) => setPolicy({ ...policy, maxAssetSizeMB: parseInt(e.target.value) })}
                  disabled={isLocked}
                  min="1"
                  max="10240"
                  className="w-full px-3 py-2 border rounded-md bg-background disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Compression
                </label>
                <select
                  value={policy.compression || 'lossless'}
                  onChange={(e) => setPolicy({ ...policy, compression: e.target.value })}
                  disabled={isLocked}
                  className="w-full px-3 py-2 border rounded-md bg-background disabled:opacity-50"
                >
                  <option value="lossless">Lossless (recommended)</option>
                  <option value="lossy">Lossy (smaller files)</option>
                  <option value="none">None</option>
                </select>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving || isLocked}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Save Settings
                </>
              )}
            </button>

            <button
              onClick={handleSync}
              disabled={syncing || policy.mirrorMode === 'off'}
              className="px-4 py-2 border rounded-md hover:bg-accent transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {syncing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Run Sync Now
                </>
              )}
            </button>

            <button
              onClick={loadStatus}
              className="px-4 py-2 border rounded-md hover:bg-accent transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh Status
            </button>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-4">
            <p className="text-sm text-blue-900 dark:text-blue-200">
              <strong>CLI & AI Tool Compatibility:</strong> With mirroring enabled, your notes and assets
              are stored in a standard directory structure that works with OpenAI Codex, Claude Code, and
              other AI assistants. Git integration allows version control and collaboration.
            </p>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

