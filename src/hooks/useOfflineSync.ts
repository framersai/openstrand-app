'use client';

import { useState, useEffect, useCallback } from 'react';
import { OpenStrandSDK } from '@openstrand/sdk';

interface QueuedWrite {
  id: string;
  timestamp: number;
  endpoint: string;
  method: string;
  body: any;
}

interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  queueSize: number;
  lastSync: Date | null;
  error: string | null;
}

const QUEUE_KEY = 'openstrand_offline_queue';

export function useOfflineSync() {
  const [status, setStatus] = useState<SyncStatus>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isSyncing: false,
    queueSize: 0,
    lastSync: null,
    error: null,
  });

  const getQueue = useCallback((): QueuedWrite[] => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(QUEUE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }, []);

  const saveQueue = useCallback((queue: QueuedWrite[]) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    setStatus((prev) => ({ ...prev, queueSize: queue.length }));
  }, []);

  const enqueueWrite = useCallback(
    (endpoint: string, method: string, body: any) => {
      const queue = getQueue();
      queue.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        timestamp: Date.now(),
        endpoint,
        method,
        body,
      });
      saveQueue(queue);
    },
    [getQueue, saveQueue]
  );

  const syncQueue = useCallback(async () => {
    const queue = getQueue();
    if (queue.length === 0) return;

    setStatus((prev) => ({ ...prev, isSyncing: true, error: null }));

    try {
      const apiUrl = localStorage.getItem('backend_url') || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const token = localStorage.getItem('auth_token');
      const apiKey = localStorage.getItem('api_key');

      const sdk = new OpenStrandSDK({
        apiUrl,
        token,
        apiKey,
      });

      // Send batch to sync endpoint
      const response = await fetch(`${apiUrl}/api/v1/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(apiKey ? { 'x-api-key': apiKey } : {}),
        },
        body: JSON.stringify({ operations: queue }),
      });

      if (response.ok) {
        // Clear queue on success
        saveQueue([]);
        setStatus((prev) => ({
          ...prev,
          isSyncing: false,
          lastSync: new Date(),
          error: null,
        }));
      } else {
        throw new Error('Sync failed');
      }
    } catch (err) {
      setStatus((prev) => ({
        ...prev,
        isSyncing: false,
        error: (err as Error).message,
      }));
    }
  }, [getQueue, saveQueue]);

  // Listen for online/offline events
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      setStatus((prev) => ({ ...prev, isOnline: true }));
      // Auto-sync when coming online
      syncQueue();
    };

    const handleOffline = () => {
      setStatus((prev) => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initialize queue size
    setStatus((prev) => ({ ...prev, queueSize: getQueue().length }));

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncQueue, getQueue]);

  return {
    status,
    enqueueWrite,
    syncQueue,
  };
}

