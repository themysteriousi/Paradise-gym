import { describe, it, expect, beforeEach } from 'vitest';
import {
  queueOfflineAction,
  getPendingOfflineQueue,
  processOfflineSync,
  resetOfflineTestQueue,
} from '@/services/offlineSyncService';
import { useOfflineStore } from '@/stores/offlineStore';
import { useDemoStore } from '@/stores/demoStore';

describe('IndexedDB Offline Queue & Auto-Sync Engine', () => {
  beforeEach(() => {
    useDemoStore.getState().resetToDefault();
    resetOfflineTestQueue();
  });

  it('queues an offline attendance check-in when disconnected', async () => {
    useOfflineStore.getState().setOnlineStatus(false);

    const queueItem = await queueOfflineAction({
      type: 'attendance_checkin',
      payload: {
        gym_id: 'demo-gym-001',
        member_id: 'demo-member-1',
        method: 'qr_scan',
        checked_in_at: new Date().toISOString(),
      },
    });

    expect(queueItem.id).toBeDefined();
    expect(queueItem.status).toBe('pending');

    const pending = await getPendingOfflineQueue();
    expect(pending.length).toBeGreaterThan(0);
    expect(pending[0].payload.member_id).toBe('demo-member-1');
    expect(useOfflineStore.getState().pendingQueueCount).toBe(pending.length);
  });

  it('automatically processes and syncs queued items when network is restored', async () => {
    // 1. Queue two items offline
    useOfflineStore.getState().setOnlineStatus(false);
    await queueOfflineAction({
      type: 'attendance_checkin',
      payload: {
        gym_id: 'demo-gym-001',
        member_id: 'demo-member-2',
        method: 'qr_scan',
        checked_in_at: new Date().toISOString(),
      },
    });
    await queueOfflineAction({
      type: 'attendance_checkin',
      payload: {
        gym_id: 'demo-gym-001',
        member_id: 'demo-member-3',
        method: 'manual',
        checked_in_at: new Date().toISOString(),
      },
    });

    const pendingBefore = await getPendingOfflineQueue();
    expect(pendingBefore.length).toBe(2);

    // 2. Network restored
    useOfflineStore.getState().setOnlineStatus(true);
    const syncResult = await processOfflineSync();

    expect(syncResult.syncedCount).toBe(2);
    expect(syncResult.failedCount).toBe(0);

    // 3. Queue is now cleared
    const pendingAfter = await getPendingOfflineQueue();
    expect(pendingAfter.length).toBe(0);
    expect(useOfflineStore.getState().pendingQueueCount).toBe(0);
  });

  it('safely deduplicates identical check-ins during offline sync', async () => {
    const timestamp = '2026-02-10T12:00:00.000Z';
    // Queue identical checkin twice
    await queueOfflineAction({
      id: 'fixed-dedup-id-1',
      type: 'attendance_checkin',
      payload: {
        gym_id: 'demo-gym-001',
        member_id: 'demo-member-4',
        method: 'qr_scan',
        checked_in_at: timestamp,
      },
    });

    await queueOfflineAction({
      id: 'fixed-dedup-id-1', // same ID / duplicate
      type: 'attendance_checkin',
      payload: {
        gym_id: 'demo-gym-001',
        member_id: 'demo-member-4',
        method: 'qr_scan',
        checked_in_at: timestamp,
      },
    });

    const syncResult = await processOfflineSync();
    expect(syncResult.syncedCount).toBe(1); // deduplicated
  });
});
