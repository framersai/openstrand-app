'use client';

/**
 * Plugin Manager Component
 * 
 * Manage installed plugins, resolve conflicts, and toggle enable/disable
 * 
 * @module components/plugins
 */

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import {
  Puzzle,
  ToggleLeft,
  ToggleRight,
  Trash2,
  AlertTriangle,
  Shield,
  ShieldCheck,
  Loader2,
  Settings,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useFeatureFlags } from '@/lib/feature-flags';

interface Plugin {
  id: string;
  name: string;
  version: string;
  displayName?: string;
  description?: string;
  author?: string;
  source?: string;
  enabled: boolean;
  isSigned: boolean;
  signedBy?: string;
  loadOrder: number;
  permissions: string[];
  installed: string;
  updated: string;
}

interface PluginConflict {
  selector: string;
  type: string;
  plugins: string[];
}

/**
 * Plugin Manager Component
 */
export function PluginManager() {
  const { isTeamEdition } = useFeatureFlags();
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [conflicts, setConflicts] = useState<PluginConflict[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pluginToUninstall, setPluginToUninstall] = useState<Plugin | null>(null);

  useEffect(() => {
    loadPlugins();
    loadConflicts();
  }, []);

  /**
   * Load plugins from API
   */
  const loadPlugins = async () => {
    setIsLoading(true);

    try {
      const token = localStorage.getItem('auth_token');
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

      const response = await fetch(`${backendUrl}/api/plugins`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPlugins(data);
      } else {
        toast.error('Failed to load plugins');
      }
    } catch (error) {
      console.error('Failed to load plugins:', error);
      toast.error('Failed to load plugins');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Load conflicts
   */
  const loadConflicts = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

      const response = await fetch(`${backendUrl}/api/plugins/conflicts`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setConflicts(data.conflicts || []);
      }
    } catch (error) {
      console.error('Failed to load conflicts:', error);
    }
  };

  /**
   * Toggle plugin enable/disable
   */
  const handleToggle = async (plugin: Plugin) => {
    try {
      const token = localStorage.getItem('auth_token');
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

      const response = await fetch(`${backendUrl}/api/plugins/${plugin.name}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          enabled: !plugin.enabled,
        }),
      });

      if (response.ok) {
        setPlugins((prev) =>
          prev.map((p) =>
            p.id === plugin.id ? { ...p, enabled: !p.enabled } : p
          )
        );
        toast.success(`Plugin ${plugin.enabled ? 'disabled' : 'enabled'}`);
      } else {
        toast.error('Failed to update plugin');
      }
    } catch (error) {
      console.error('Failed to toggle plugin:', error);
      toast.error('Failed to update plugin');
    }
  };

  /**
   * Uninstall plugin
   */
  const handleUninstall = async () => {
    if (!pluginToUninstall) return;

    try {
      const token = localStorage.getItem('auth_token');
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

      const response = await fetch(`${backendUrl}/api/plugins/${pluginToUninstall.name}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setPlugins((prev) => prev.filter((p) => p.id !== pluginToUninstall.id));
        toast.success('Plugin uninstalled');
      } else {
        toast.error('Failed to uninstall plugin');
      }
    } catch (error) {
      console.error('Failed to uninstall plugin:', error);
      toast.error('Failed to uninstall plugin');
    } finally {
      setPluginToUninstall(null);
    }
  };

  /**
   * Get conflict for a plugin
   */
  const getConflict = (pluginName: string): PluginConflict | undefined => {
    return conflicts.find((c) => c.plugins.includes(pluginName));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Plugin Manager</h2>
          <p className="text-sm text-muted-foreground">
            Manage installed plugins and resolve conflicts
          </p>
        </div>

        {isTeamEdition && (
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Admin Settings
          </Button>
        )}
      </div>

      {/* Conflicts Banner */}
      {conflicts.length > 0 && (
        <Card className="border-yellow-500/50 bg-yellow-500/10">
          <CardHeader>
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
              <div className="flex-1">
                <CardTitle className="text-base">
                  {conflicts.length} Plugin Conflict{conflicts.length > 1 ? 's' : ''} Detected
                </CardTitle>
                <CardDescription>
                  Multiple plugins are trying to use the same commands or resources. Disable one to resolve.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Plugin List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : plugins.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="rounded-full bg-muted p-4">
              <Puzzle className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="text-center space-y-1">
              <p className="font-medium">No plugins installed</p>
              <p className="text-sm text-muted-foreground">
                Install plugins to extend OpenStrand's functionality
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {plugins.map((plugin) => {
            const conflict = getConflict(plugin.name);

            return (
              <Card key={plugin.id} className={conflict ? 'border-yellow-500/50' : ''}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base">
                          {plugin.displayName || plugin.name}
                        </CardTitle>
                        <Badge variant="outline" className="text-xs">
                          v{plugin.version}
                        </Badge>
                        {plugin.isSigned && (
                          <Badge variant="secondary" className="text-xs gap-1">
                            <ShieldCheck className="h-3 w-3" />
                            Verified
                          </Badge>
                        )}
                      </div>

                      {plugin.description && (
                        <CardDescription>{plugin.description}</CardDescription>
                      )}

                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        {plugin.author && <span>by {plugin.author}</span>}
                        {plugin.source && (
                          <Badge variant="outline" className="text-xs">
                            {plugin.source}
                          </Badge>
                        )}
                      </div>

                      {plugin.permissions.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {plugin.permissions.map((perm) => (
                            <Badge key={perm} variant="secondary" className="text-xs">
                              {perm}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {conflict && (
                        <div className="flex items-start gap-2 p-2 rounded bg-yellow-500/10 border border-yellow-500/50">
                          <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
                          <div className="flex-1 text-xs">
                            <p className="font-medium">Conflict detected</p>
                            <p className="text-muted-foreground">
                              Conflicts with: {conflict.plugins.filter((p) => p !== plugin.name).join(', ')}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Switch
                        checked={plugin.enabled}
                        onCheckedChange={() => handleToggle(plugin)}
                      />
                      {isTeamEdition && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setPluginToUninstall(plugin)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      )}

      {/* Uninstall Confirmation Dialog */}
      <AlertDialog open={!!pluginToUninstall} onOpenChange={(open) => !open && setPluginToUninstall(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Uninstall Plugin?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to uninstall "{pluginToUninstall?.displayName || pluginToUninstall?.name}"? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleUninstall} className="bg-destructive">
              Uninstall
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

