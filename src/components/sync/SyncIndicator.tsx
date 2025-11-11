'use client';

import { Cloud, CloudOff, RefreshCw, Check, AlertCircle } from 'lucide-react';
import { useOfflineSync } from '@/hooks/useOfflineSync';

export function SyncIndicator() {
  const { status, syncQueue } = useOfflineSync();

  if (!status.isOnline && status.queueSize === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <CloudOff className="w-4 h-4" />
        <span>Offline</span>
      </div>
    );
  }

  if (status.isSyncing) {
    return (
      <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
        <RefreshCw className="w-4 h-4 animate-spin" />
        <span>Syncing...</span>
      </div>
    );
  }

  if (status.queueSize > 0) {
    return (
      <button
        onClick={syncQueue}
        className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
      >
        <AlertCircle className="w-4 h-4" />
        <span>{status.queueSize} pending</span>
      </button>
    );
  }

  if (status.lastSync) {
    return (
      <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
        <Check className="w-4 h-4" />
        <span>Synced</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Cloud className="w-4 h-4" />
      <span>Online</span>
    </div>
  );
}

