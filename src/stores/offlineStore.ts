import { create } from 'zustand';

interface OfflineState {
  isOnline: boolean;
  pendingQueueCount: number;
  isSyncing: boolean;
  lastSyncedAt: string | null;
  setOnlineStatus: (status: boolean) => void;
  updateQueueCount: (count: number) => void;
  setIsSyncing: (syncing: boolean) => void;
  setLastSyncedAt: (timestamp: string) => void;
  resetQueue: () => void;
}

export const useOfflineStore = create<OfflineState>((set) => ({
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  pendingQueueCount: 0,
  isSyncing: false,
  lastSyncedAt: null,

  setOnlineStatus: (status: boolean) => set({ isOnline: status }),
  updateQueueCount: (count: number) => set({ pendingQueueCount: count }),
  setIsSyncing: (syncing: boolean) => set({ isSyncing: syncing }),
  setLastSyncedAt: (timestamp: string) => set({ lastSyncedAt: timestamp }),
  resetQueue: () => set({ pendingQueueCount: 0, isSyncing: false }),
}));
