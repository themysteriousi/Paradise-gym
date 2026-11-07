import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

export interface OfflineQueueItem {
  id: string;
  type: 'attendance_checkin' | 'payment_record' | 'member_create';
  payload: Record<string, any>;
  status: 'pending' | 'syncing' | 'failed';
  created_at: string;
  retry_count: number;
}

export interface CachedMember {
  id: string;
  gym_id: string;
  full_name: string;
  phone: string;
  status: string;
  updated_at: string;
}

export interface CachedToken {
  token: string;
  member_id: string;
  expires_at: string | null;
  revoked_at: string | null;
}

interface ParadiseDB extends DBSchema {
  offline_queue: {
    key: string;
    value: OfflineQueueItem;
    indexes: { 'by-status': string; 'by-created': string };
  };
  cached_members: {
    key: string;
    value: CachedMember;
    indexes: { 'by-phone': string };
  };
  cached_tokens: {
    key: string;
    value: CachedToken;
    indexes: { 'by-member': string };
  };
}

const DB_NAME = 'ParadiseGymDB';
const DB_VERSION = 1;

// In-memory fallback for SSR and test environments without native IndexedDB
const memoryStore = new Map<string, OfflineQueueItem>();

export async function getDb(): Promise<IDBPDatabase<ParadiseDB> | null> {
  if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
    return null;
  }

  try {
    return await openDB<ParadiseDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('offline_queue')) {
          const queueStore = db.createObjectStore('offline_queue', { keyPath: 'id' });
          queueStore.createIndex('by-status', 'status');
          queueStore.createIndex('by-created', 'created_at');
        }

        if (!db.objectStoreNames.contains('cached_members')) {
          const memberStore = db.createObjectStore('cached_members', { keyPath: 'id' });
          memberStore.createIndex('by-phone', 'phone');
        }

        if (!db.objectStoreNames.contains('cached_tokens')) {
          const tokenStore = db.createObjectStore('cached_tokens', { keyPath: 'token' });
          tokenStore.createIndex('by-member', 'member_id');
        }
      },
    });
  } catch (err) {
    console.warn('Failed to open IndexedDB, using memory fallback:', err);
    return null;
  }
}

/**
 * Save item into offline queue
 */
export async function idbSaveQueueItem(item: OfflineQueueItem): Promise<void> {
  const db = await getDb();
  if (db) {
    await db.put('offline_queue', item);
  } else {
    memoryStore.set(item.id, item);
  }
}

/**
 * Retrieve all items from offline queue
 */
export async function idbGetQueueItems(): Promise<OfflineQueueItem[]> {
  const db = await getDb();
  if (db) {
    return await db.getAll('offline_queue');
  } else {
    return Array.from(memoryStore.values());
  }
}

/**
 * Delete item from offline queue
 */
export async function idbDeleteQueueItem(id: string): Promise<void> {
  const db = await getDb();
  if (db) {
    await db.delete('offline_queue', id);
  } else {
    memoryStore.delete(id);
  }
}

/**
 * Clear memory store (for testing)
 */
export function clearMemoryStore(): void {
  memoryStore.clear();
}

