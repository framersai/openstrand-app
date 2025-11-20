'use client';

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { api } from '@/services/api';
import { toast } from 'react-hot-toast';
import { appEvents } from '@/lib/events';

// Types matching the API response
export interface ResolvedPlugin {
  id: string;
  packageId: string;
  name: string;
  version: string;
  enabled: boolean;
  settings: Record<string, any>;
  scope: 'instance' | 'team' | 'user';
  locked: boolean;
  manifestUrl?: string;
  entryUrl?: string;
  permissions: string[];
}

interface PluginRuntimeContextValue {
  plugins: ResolvedPlugin[];
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  
  // Override Registry
  // Key: Extension Point ID (e.g., 'layout.header.right')
  // Value: Array of components/configs from plugins
  getExtensions: (pointId: string) => Array<{ component: any, plugin: ResolvedPlugin }>;

  // Event Bus
  emit: (event: string, data: any) => Promise<void>;
}

const PluginRuntimeContext = createContext<PluginRuntimeContextValue | undefined>(undefined);

export function PluginRuntimeProvider({ children }: { children: React.ReactNode }) {
  const [plugins, setPlugins] = useState<ResolvedPlugin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Registry for loaded module exports
  // pluginName -> module exports
  const [loadedModules, setLoadedModules] = useState<Map<string, any>>(new Map());

  const emit = useCallback(async (event: string, data: any) => {
    const promises: Promise<void>[] = [];
    
    loadedModules.forEach((module, name) => {
      const hooks = module.default?.hooks || module.hooks;
      if (hooks && typeof hooks[event] === 'function') {
        promises.push(
          Promise.resolve(hooks[event]({ 
            plugin: { name }, 
            settings: plugins.find(p => p.name === name)?.settings || {},
            api
          }, data)).catch(err => {
            console.error(`Error in plugin ${name} hook ${event}:`, err);
          })
        );
      }
    });

    await Promise.all(promises);
  }, [loadedModules, plugins]);

  // Listen to global app events and forward to plugins
  useEffect(() => {
    const onStrandCreated = (data: any) => emit('strand.created', data);
    appEvents.on('strand.created', onStrandCreated);
    
    return () => {
      appEvents.off('strand.created', onStrandCreated);
    };
  }, [emit]);

  const loadPluginModule = async (plugin: ResolvedPlugin) => {
    if (!plugin.entryUrl) return;

    try {
      // Dynamic import from URL
      // Note: In production, this should go through a proxy to ensure CORS/types
      // For now, we assume direct access or local dev URL
      const module = await import(/* @vite-ignore */ plugin.entryUrl);
      
      // Create context
      const context = {
        plugin: { name: plugin.name, version: plugin.version },
        api: api, // Expose API client (permission wrapping would happen here)
        ui: {
          showNotification: (msg: string, type: any) => {
            if (type === 'error') toast.error(msg);
            else if (type === 'success') toast.success(msg);
            else toast(msg);
          }
        },
        settings: plugin.settings
      };

      // Activate
      if (module.default && typeof module.default.activate === 'function') {
        await module.default.activate(context);
      } else if (typeof module.activate === 'function') {
        await module.activate(context);
      }

      setLoadedModules(prev => new Map(prev).set(plugin.name, module));
      console.log(`[PluginRuntime] Loaded ${plugin.name} v${plugin.version}`);
    } catch (err) {
      console.error(`[PluginRuntime] Failed to load ${plugin.name}:`, err);
      toast.error(`Failed to load plugin: ${plugin.displayName || plugin.name}`);
    }
  };

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.listPlugins();
      setPlugins(data);
      
      // Load enabled plugins
      const enabled = data.filter(p => p.enabled && p.entryUrl);
      
      // Load in parallel
      await Promise.all(enabled.map(p => {
        if (!loadedModules.has(p.name)) {
          return loadPluginModule(p);
        }
        return Promise.resolve();
      }));
      
    } catch (err: any) {
      console.error('[PluginRuntime] Failed to load plugins:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [loadedModules]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Helper to get extensions for a specific point
  const getExtensions = useCallback((pointId: string) => {
    const extensions: Array<{ component: any, plugin: ResolvedPlugin }> = [];
    
    loadedModules.forEach((module, name) => {
      const plugin = plugins.find(p => p.name === name);
      if (!plugin) return;

      // Check if module contributes to this point
      // Standard pattern: export const contributions = { "pointId": Component }
      // OR manifest-based contributions mapped to exports
      
      // Simplified check for default export having a contributions map
      const contribs = module.default?.contributions || module.contributions;
      if (contribs && contribs[pointId]) {
        extensions.push({
          component: contribs[pointId],
          plugin
        });
      }
    });
    
    return extensions;
  }, [loadedModules, plugins]);

  const value = useMemo(() => ({
    plugins,
    loading,
    error,
    refresh,
    getExtensions,
    emit
  }), [plugins, loading, error, refresh, getExtensions, emit]);

  return (
    <PluginRuntimeContext.Provider value={value}>
      {children}
    </PluginRuntimeContext.Provider>
  );
}

export function usePluginRuntime() {
  const context = useContext(PluginRuntimeContext);
  if (!context) {
    throw new Error('usePluginRuntime must be used within a PluginRuntimeProvider');
  }
  return context;
}
