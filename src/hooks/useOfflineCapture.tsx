/**
 * Part 11 — Offline Capture System
 * Enables data capture when offline, syncs when connection is restored
 */

import { useState, useEffect, useCallback } from 'react';
import { Wifi, WifiOff, Cloud, RefreshCw } from 'lucide-react';

interface OfflineQueueItem {
  id: string;
  type: string;
  data: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

interface OfflineStatus {
  isOnline: boolean;
  queueLength: number;
  lastSync: number | null;
  isSyncing: boolean;
}

const OFFLINE_QUEUE_KEY = 'construction_erp_offline_queue';
const SYNC_ENDPOINT = '/api/dx/v1/sync';

export function useOfflineCapture() {
  const [status, setStatus] = useState<OfflineStatus>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    queueLength: 0,
    lastSync: null,
    isSyncing: false,
  });

  const [queue, setQueue] = useState<OfflineQueueItem[]>([]);

  // Load queue from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const stored = localStorage.getItem(OFFLINE_QUEUE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setQueue(parsed);
        setStatus(prev => ({ ...prev, queueLength: parsed.length }));
      } catch (e) {
        console.error('Failed to parse offline queue:', e);
      }
    }
  }, []);

  // Save queue to localStorage whenever it changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    setStatus(prev => ({ ...prev, queueLength: queue.length }));
  }, [queue]);

  // Listen for online/offline events
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      setStatus(prev => ({ ...prev, isOnline: true }));
      syncQueue();
    };

    const handleOffline = () => {
      setStatus(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Add item to offline queue
  const addToQueue = useCallback((type: string, data: any) => {
    const item: OfflineQueueItem = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: 3,
    };

    setQueue(prev => [...prev, item]);

    // If online, try to sync immediately
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      syncQueue();
    }
  }, []);

  // Sync queue with server
  const syncQueue = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.onLine || status.isSyncing || queue.length === 0) {
      return;
    }

    setStatus(prev => ({ ...prev, isSyncing: true }));

    const itemsToSync = [...queue];
    const failedItems: OfflineQueueItem[] = [];

    for (const item of itemsToSync) {
      try {
        const response = await fetch(SYNC_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: item.type,
            data: item.data,
            timestamp: item.timestamp,
          }),
        });

        if (!response.ok) {
          throw new Error(`Sync failed: ${response.statusText}`);
        }

        // Successfully synced, remove from queue
        setQueue(prev => prev.filter(q => q.id !== item.id));
      } catch (error) {
        console.error('Failed to sync item:', error);

        // Increment retry count
        const updatedItem = {
          ...item,
          retryCount: item.retryCount + 1,
        };

        if (updatedItem.retryCount < updatedItem.maxRetries) {
          failedItems.push(updatedItem);
        } else {
          console.error('Max retries exceeded for item:', item.id);
        }
      }
    }

    // Update queue with failed items
    if (failedItems.length > 0) {
      setQueue(prev => [
        ...prev.filter(item => !itemsToSync.some(sync => sync.id === item.id)),
        ...failedItems,
      ]);
    }

    setStatus(prev => ({
      ...prev,
      isSyncing: false,
      lastSync: Date.now(),
    }));
  }, [queue, status.isSyncing]);

  // Clear queue (for testing or manual reset)
  const clearQueue = useCallback(() => {
    setQueue([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(OFFLINE_QUEUE_KEY);
    }
    setStatus(prev => ({ ...prev, queueLength: 0 }));
  }, []);

  // Retry failed items
  const retryFailed = useCallback(() => {
    setQueue(prev => prev.map(item => ({ ...item, retryCount: 0 })));
    syncQueue();
  }, [syncQueue]);

  return {
    status,
    addToQueue,
    syncQueue,
    clearQueue,
    retryFailed,
  };
}

// Offline indicator component
export function OfflineIndicator() {
  const { status, syncQueue } = useOfflineCapture();

  if (status.isOnline && status.queueLength === 0) {
    return (
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
        style={{
          background: 'var(--sapSuccessBackground)',
          color: 'var(--sapPositiveTextColor)',
        }}
      >
        <Wifi size={16} />
        <span>Online</span>
      </div>
    );
  }

  if (!status.isOnline) {
    return (
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
        style={{
          background: 'var(--sapWarningBackground)',
          color: 'var(--sapCriticalTextColor)',
        }}
      >
        <WifiOff size={16} />
        <span>Offline — {status.queueLength} pending</span>
      </div>
    );
  }

  if (status.isSyncing) {
    return (
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
        style={{
          background: 'var(--sapInformationBackground)',
          color: 'var(--sapInformativeTextColor)',
        }}
      >
        <RefreshCw size={16} className="animate-spin" />
        <span>Syncing {status.queueLength} items...</span>
      </div>
    );
  }

  if (status.queueLength > 0) {
    return (
      <div className="flex items-center gap-2">
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
          style={{
            background: 'var(--sapWarningBackground)',
            color: 'var(--sapCriticalTextColor)',
          }}
        >
          <Cloud size={16} />
          <span>{status.queueLength} items to sync</span>
        </div>
        <button
          onClick={syncQueue}
          className="px-3 py-2 rounded-lg text-sm font-medium"
          style={{
            background: 'var(--sapButtonBackground)',
            color: 'var(--sapButtonTextColor)',
            border: '1px solid var(--sapButtonBorderColor)',
          }}
        >
          Sync Now
        </button>
      </div>
    );
  }

  return null;
}

// Offline capture form wrapper
interface OfflineCaptureFormProps {
  type: string;
  onSubmit: (data: any) => void;
  children: (props: { submit: (data: any) => void; isOffline: boolean }) => React.ReactNode;
}

export function OfflineCaptureForm({ type, onSubmit, children }: OfflineCaptureFormProps) {
  const { addToQueue, status } = useOfflineCapture();

  const handleSubmit = (data: any) => {
    if (status.isOnline) {
      onSubmit(data);
    } else {
      addToQueue(type, data);
    }
  };

  return <>{children({ submit: handleSubmit, isOffline: !status.isOnline })}</>;
}
