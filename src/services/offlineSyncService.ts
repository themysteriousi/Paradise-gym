import {
  idbSaveQueueItem,
  idbGetQueueItems,
  idbDeleteQueueItem,
  clearMemoryStore,
  type OfflineQueueItem,
} from '@/lib/db/indexedDB';
import { useOfflineStore } from '@/stores/offlineStore';
import { useDemoStore } from '@/stores/demoStore';
import { supabase } from '@/lib/supabase';
import type { DbAttendance } from '@/types/database';

export type { OfflineQueueItem };

export interface QueueActionInput {
  id?: string;
  type: 'attendance_checkin' | 'payment_record' | 'member_create';
  payload: Record<string, any>;
}

export interface SyncResult {
  syncedCount: number;
  failedCount: number;
  errors: string[];
}

/**
 * Queue an operation when the client is offline or in flight
 */
export async function queueOfflineAction(
  input: QueueActionInput
): Promise<OfflineQueueItem> {
  const item: OfflineQueueItem = {
    id: input.id || `queue-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    type: input.type,
    payload: input.payload,
    status: 'pending',
    created_at: new Date().toISOString(),
    retry_count: 0,
  };

  await idbSaveQueueItem(item);

  const allItems = await idbGetQueueItems();
  useOfflineStore.getState().updateQueueCount(allItems.length);

  return item;
}

/**
 * Get all pending queue items
 */
export async function getPendingOfflineQueue(): Promise<OfflineQueueItem[]> {
  const items = await idbGetQueueItems();
  return items.filter((i) => i.status === 'pending');
}

/**
 * Process and sync queued offline items to cloud database or demo store
 */
export async function processOfflineSync(): Promise<SyncResult> {
  const offlineStore = useOfflineStore.getState();
  const isDemoMode = !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL.includes('placeholder');

  offlineStore.setIsSyncing(true);

  const pendingItems = await getPendingOfflineQueue();
  let syncedCount = 0;
  let failedCount = 0;
  const errors: string[] = [];

  // Track synced payloads in this run for deduplication
  const seenAttendanceKeys = new Set<string>();

  for (const item of pendingItems) {
    try {
      if (item.type === 'attendance_checkin') {
        const payload = item.payload;
        // Composite deduplication key: member_id + timestamp
        const dedupKey = `${payload.member_id}-${payload.checked_in_at}`;

        if (seenAttendanceKeys.has(dedupKey)) {
          // Already synced in this batch, safely drop duplicate
          await idbDeleteQueueItem(item.id);
          continue;
        }

        seenAttendanceKeys.add(dedupKey);

        if (isDemoMode) {
          const demoStore = useDemoStore.getState();
          // Check if already in demo attendance
          const exists = demoStore.attendance.some(
            (a) => a.member_id === payload.member_id && a.checked_in_at === payload.checked_in_at
          );

          if (!exists) {
            const newRecord: DbAttendance = {
              id: item.id.startsWith('att-') ? item.id : `att-${Date.now()}-${syncedCount}`,
              gym_id: payload.gym_id || 'demo-gym-001',
              member_id: payload.member_id,
              membership_id: 'plan-monthly',
              method: payload.method || 'qr_scan',
              checked_in_at: payload.checked_in_at || new Date().toISOString(),
              checked_in_by: payload.checked_in_by || null,
              device_id: payload.device_id || 'offline-device',
              note: '[Synced from offline queue]',
              is_correction: false,
              original_id: null,
              corrected_by: null,
              corrected_at: null,
              correction_reason: null,
            };
            demoStore.recordAttendance(newRecord);
          }
        } else {
          // Live Supabase sync
          const { error } = await supabase.from('attendance').upsert({
            gym_id: payload.gym_id,
            member_id: payload.member_id,
            membership_id: 'plan-monthly',
            method: payload.method || 'qr_scan',
            checked_in_at: payload.checked_in_at,
            device_id: payload.device_id || 'offline-device',
            note: '[Synced from offline queue]',
          });

          if (error) throw error;
        }

        // Successfully synced, remove from queue
        await idbDeleteQueueItem(item.id);
        syncedCount++;
      }
    } catch (err: unknown) {
      failedCount++;
      errors.push(err instanceof Error ? err.message : 'Unknown sync error');
    }
  }

  const remaining = await idbGetQueueItems();
  offlineStore.updateQueueCount(remaining.length);
  offlineStore.setIsSyncing(false);
  offlineStore.setLastSyncedAt(new Date().toISOString());

  return { syncedCount, failedCount, errors };
}

/**
 * Initialize automatic network listeners for online/offline events
 */
export function initNetworkListeners(): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleOnline = () => {
    useOfflineStore.getState().setOnlineStatus(true);
    processOfflineSync();
  };

  const handleOffline = () => {
    useOfflineStore.getState().setOnlineStatus(false);
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

/**
 * Clear test data helper
 */
export function resetOfflineTestQueue(): void {
  clearMemoryStore();
  useOfflineStore.getState().resetQueue();
}

