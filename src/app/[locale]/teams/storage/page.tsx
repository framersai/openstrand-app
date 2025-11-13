'use client';

import { useState, useEffect } from 'react';
import { 
  Shield, 
  Users, 
  HardDrive, 
  GitBranch, 
  Check, 
  X,
  RefreshCw,
  AlertTriangle,
  Info,
  Lock,
  Unlock
} from 'lucide-react';
import { PageLayout } from '@/components/layouts/PageLayout';
import { useToast } from '@/hooks/use-toast';

interface TeamStoragePolicy {
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
  allowOverride: boolean;
  allowOptOut: boolean;
}

interface MemberOverride {
  userId: string;
  username: string;
  displayName?: string;
  hasOverride: boolean;
  policy?: Partial<TeamStoragePolicy>;
}

/**
 * Admin storage settings for Teams Edition.
 * Allows configuration of team-wide default policy, override controls, and member audit.
 */
export default function TeamStorageAdminPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [policy, setPolicy] = useState<Partial<TeamStoragePolicy>>({});
  const [members, setMembers] = useState<MemberOverride[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPolicy();
  }, []);

  const loadPolicy = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('auth_token');
      const backendUrl = localStorage.getItem('backend_url') || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      
      const response = await fetch(`${backendUrl}/api/v1/admin/storage/policy`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load team storage policy');
      }

      const data = await response.json();
      setPolicy(data.data.policy);
      setMembers(data.data.members || []);
    } catch (err) {
      setError((err as Error).message);
      toast({
        title: 'Error',
        description: 'Failed to load team storage settings',
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
      
      const response = await fetch(`${backendUrl}/api/v1/admin/storage/policy`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(policy),
      });

      if (!response.ok) {
        throw new Error('Failed to save team storage policy');
      }

      toast({
        title: 'Success',
        description: 'Team storage policy saved successfully',
      });

      await loadPolicy();
    } catch (err) {
      setError((err as Error).message);
      toast({
        title: 'Error',
        description: 'Failed to save team storage policy',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEnforceNow = async () => {
    if (!confirm('This will apply the team policy to all members and remove individual overrides. Continue?')) {
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      const backendUrl = localStorage.getItem('backend_url') || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      
      const response = await fetch(`${backendUrl}/api/v1/admin/storage/enforce`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to enforce policy');
      }

      toast({
        title: 'Policy Enforced',
        description: 'Team policy has been applied to all members',
      });

      await loadPolicy();
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to enforce policy',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <PageLayout>
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary" />
            Team Storage Policy
          </h1>
          <p className="text-muted-foreground">
            Configure default storage settings for all team members. Control overrides and enforce compliance.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Settings */}
          <div className="lg:col-span-2 space-y-6">
            {/* Default Policy */}
            <div className="border rounded-lg p-6 bg-card">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <HardDrive className="w-5 h-5" />
                Default Team Policy
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Storage Provider
                  </label>
                  <select
                    value={policy.provider || 'local'}
                    onChange={(e) => setPolicy({ ...policy, provider: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-md bg-background"
                  >
                    <option value="local">Local Filesystem</option>
                    <option value="s3">S3-Compatible (Linode, AWS, etc.)</option>
                  </select>
                </div>

                {policy.provider === 'local' && (
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Default Content Root Path
                    </label>
                    <input
                      type="text"
                      value={policy.contentRootPath || ''}
                      onChange={(e) => setPolicy({ ...policy, contentRootPath: e.target.value })}
                      placeholder="/opt/openstrand/data"
                      className="w-full px-3 py-2 border rounded-md bg-background"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Suggested for team members (they can override if allowed)
                    </p>
                  </div>
                )}

                {policy.provider === 's3' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        S3 Bucket Name
                      </label>
                      <input
                        type="text"
                        value={policy.bucket || ''}
                        onChange={(e) => setPolicy({ ...policy, bucket: e.target.value })}
                        placeholder="openstrand-team-backups"
                        className="w-full px-3 py-2 border rounded-md bg-background"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Prefix (optional)
                      </label>
                      <input
                        type="text"
                        value={policy.prefix || ''}
                        onChange={(e) => setPolicy({ ...policy, prefix: e.target.value })}
                        placeholder="team-data/"
                        className="w-full px-3 py-2 border rounded-md bg-background"
                      />
                    </div>
                  </>
                )}

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="teamMirrorEnabled"
                    checked={policy.mirrorMode === 'mirror'}
                    onChange={(e) => setPolicy({ ...policy, mirrorMode: e.target.checked ? 'mirror' : 'off' })}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <label htmlFor="teamMirrorEnabled" className="text-sm font-medium">
                    Enable mirroring by default
                  </label>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="teamGitEnabled"
                    checked={policy.gitEnabled || false}
                    onChange={(e) => setPolicy({ ...policy, gitEnabled: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <label htmlFor="teamGitEnabled" className="text-sm font-medium flex items-center gap-2">
                    <GitBranch className="w-4 h-4" />
                    Enable Git by default
                  </label>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="teamDedupe"
                    checked={policy.dedupe !== false}
                    onChange={(e) => setPolicy({ ...policy, dedupe: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <label htmlFor="teamDedupe" className="text-sm font-medium">
                    Enable deduplication
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
                    className="w-full px-3 py-2 border rounded-md bg-background"
                  >
                    <option value="confirm">Ask before deleting</option>
                    <option value="trash">Move to .trash/</option>
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
                    min="1"
                    max="10240"
                    className="w-full px-3 py-2 border rounded-md bg-background"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Compression
                  </label>
                  <select
                    value={policy.compression || 'lossless'}
                    onChange={(e) => setPolicy({ ...policy, compression: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md bg-background"
                  >
                    <option value="lossless">Lossless</option>
                    <option value="lossy">Lossy</option>
                    <option value="none">None</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleSave}
                disabled={saving}
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
                    Save Team Policy
                  </>
                )}
              </button>

              <button
                onClick={handleEnforceNow}
                className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors flex items-center gap-2"
              >
                <AlertTriangle className="w-4 h-4" />
                Enforce Now
              </button>

              <button
                onClick={loadPolicy}
                className="px-4 py-2 border rounded-md hover:bg-accent transition-colors flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>

          {/* Sidebar Controls */}
          <div className="space-y-6">
            {/* Override Controls */}
            <div className="border rounded-lg p-6 bg-card">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Override Controls
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="allowOverride"
                    checked={policy.allowOverride !== false}
                    onChange={(e) => setPolicy({ ...policy, allowOverride: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 mt-1"
                  />
                  <div>
                    <label htmlFor="allowOverride" className="text-sm font-medium block">
                      Allow member overrides
                    </label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Members can customize their own storage settings
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="allowOptOut"
                    checked={policy.allowOptOut !== false}
                    onChange={(e) => setPolicy({ ...policy, allowOptOut: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 mt-1"
                  />
                  <div>
                    <label htmlFor="allowOptOut" className="text-sm font-medium block">
                      Allow opt-out
                    </label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Members can disable mirroring entirely
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Member Audit */}
            <div className="border rounded-lg p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Member Overrides ({members.filter(m => m.hasOverride).length})
              </h3>
              
              {members.length === 0 ? (
                <p className="text-sm text-muted-foreground">No team members found</p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {members.map((member) => (
                    <div
                      key={member.userId}
                      className="flex items-center justify-between p-2 rounded border text-sm"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {member.displayName || member.username}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          @{member.username}
                        </p>
                      </div>
                      {member.hasOverride ? (
                        <Unlock className="w-4 h-4 text-orange-600 flex-shrink-0" title="Has custom settings" />
                      ) : (
                        <Lock className="w-4 h-4 text-green-600 flex-shrink-0" title="Using team defaults" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-blue-900 dark:text-blue-200">
                  <strong>Tip:</strong> Use "Enforce Now" to immediately apply team policy to all members
                  and remove individual overrides. This is useful for compliance requirements.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

