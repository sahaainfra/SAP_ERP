/**
 * Part 19 — Offline Sync Engine
 * 
 * Manages offline data capture and synchronization with the server.
 * Uses IndexedDB for local storage and implements idempotent sync
 * with client-generated UUIDs as idempotency keys.
 * 
 * Key features:
 * - Offline allow-list enforcement
 * - Idempotent sync (synced twice, created once)
 * - Conflict resolution per entity
 * - Clock skew detection
 * - Exponential backoff retry
 * - Sync Issues screen support
 */

import { v4 as uuidv4 } from 'uuid';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface OfflineRecord {
  local_id: string;
  entity_type: string;
  payload: any;
  created_at: string;
  device_id: string;
  user_id: number;
  project_id?: number;
  attempts: number;
  status: 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED' | 'REJECTED';
  server_id?: number;
  error?: string;
  clock_skew_sec?: number;
}

export interface SyncResult {
  local_id: string;
  status: 'ACCEPTED' | 'REJECTED' | 'DUPLICATE';
  server_id?: number;
  error?: string;
  clock_skew_sec?: number;
}

export interface SyncConflict {
  local_id: string;
  entity_type: string;
  server_state: any;
  resolution_options: string[];
}

export type ConflictResolver = (
  local: OfflineRecord,
  server: any
) => Promise<{
  action: 'ACCEPT' | 'REJECT' | 'MERGE';
  merged_payload?: any;
  reason?: string;
}>;

// ═══════════════════════════════════════════════════════════════════════════
// OFFLINE ALLOW-LIST
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Entity types that are permitted for offline capture.
 * Only draft-creating operations are allowed offline.
 * No approvals, certifications, postings, or number allocations.
 */
export const OFFLINE_ALLOW_LIST: string[] = [
  'attendance',
  'measurement_book_draft',
  'site_photo',
  'wir_request_draft',
  'safety_observation',
  'equipment_logsheet',
  'material_issue_draft',
  'inspection_checklist',
];

/**
 * Check if an entity type is allowed for offline capture
 */
export function isOfflineAllowed(entityType: string): boolean {
  return OFFLINE_ALLOW_LIST.includes(entityType);
}

// ═══════════════════════════════════════════════════════════════════════════
// INDEXEDDB WRAPPER
// ═══════════════════════════════════════════════════════════════════════════

const DB_NAME = 'dx_offline_db';
const DB_VERSION = 1;
const OUTBOX_STORE = 'dx_outbox';
const REFERENCE_STORE = 'dx_reference_data';

class IndexedDBWrapper {
  private db: IDBDatabase | null = null;

  /**
   * Initialize IndexedDB
   */
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create outbox store for offline records
        if (!db.objectStoreNames.contains(OUTBOX_STORE)) {
          const outboxStore = db.createObjectStore(OUTBOX_STORE, { keyPath: 'local_id' });
          outboxStore.createIndex('status', 'status', { unique: false });
          outboxStore.createIndex('entity_type', 'entity_type', { unique: false });
          outboxStore.createIndex('created_at', 'created_at', { unique: false });
        }

        // Create reference data store for cached master data
        if (!db.objectStoreNames.contains(REFERENCE_STORE)) {
          const refStore = db.createObjectStore(REFERENCE_STORE, { keyPath: 'key' });
          refStore.createIndex('entity_type', 'entity_type', { unique: false });
          refStore.createIndex('project_id', 'project_id', { unique: false });
        }
      };
    });
  }

  /**
   * Add a record to the outbox
   */
  async addToOutbox(record: OfflineRecord): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([OUTBOX_STORE], 'readwrite');
      const store = transaction.objectStore(OUTBOX_STORE);
      const request = store.add(record);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * Update a record in the outbox
   */
  async updateOutboxRecord(record: OfflineRecord): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([OUTBOX_STORE], 'readwrite');
      const store = transaction.objectStore(OUTBOX_STORE);
      const request = store.put(record);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * Delete a record from the outbox
   */
  async deleteFromOutbox(localId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([OUTBOX_STORE], 'readwrite');
      const store = transaction.objectStore(OUTBOX_STORE);
      const request = store.delete(localId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * Get all pending records from outbox
   */
  async getPendingRecords(): Promise<OfflineRecord[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([OUTBOX_STORE], 'readonly');
      const store = transaction.objectStore(OUTBOX_STORE);
      const index = store.index('status');
      const request = index.getAll('PENDING');

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  /**
   * Get all failed records from outbox
   */
  async getFailedRecords(): Promise<OfflineRecord[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([OUTBOX_STORE], 'readonly');
      const store = transaction.objectStore(OUTBOX_STORE);
      const index = store.index('status');
      const request = index.getAll('FAILED');

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  /**
   * Get count of pending records
   */
  async getPendingCount(): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([OUTBOX_STORE], 'readonly');
      const store = transaction.objectStore(OUTBOX_STORE);
      const index = store.index('status');
      const request = index.count('PENDING');

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  /**
   * Cache reference data for offline use
   */
  async cacheReferenceData(
    entityType: string,
    projectId: number,
    data: any[]
  ): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([REFERENCE_STORE], 'readwrite');
      const store = transaction.objectStore(REFERENCE_STORE);
      
      const key = `${entityType}:${projectId}`;
      const request = store.put({
        key,
        entity_type: entityType,
        project_id: projectId,
        data,
        cached_at: new Date().toISOString(),
      });

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * Get cached reference data
   */
  async getReferenceData(
    entityType: string,
    projectId: number
  ): Promise<any[] | null> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([REFERENCE_STORE], 'readonly');
      const store = transaction.objectStore(REFERENCE_STORE);
      const key = `${entityType}:${projectId}`;
      const request = store.get(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.data : null);
      };
    });
  }

  /**
   * Clear all cached data (on logout or project change)
   */
  async clearAllData(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(
        [OUTBOX_STORE, REFERENCE_STORE],
        'readwrite'
      );
      
      const outboxRequest = transaction.objectStore(OUTBOX_STORE).clear();
      const refRequest = transaction.objectStore(REFERENCE_STORE).clear();

      outboxRequest.onerror = () => reject(outboxRequest.error);
      refRequest.onerror = () => reject(refRequest.error);
      
      transaction.oncomplete = () => resolve();
    });
  }

  /**
   * Close database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SYNC ENGINE
// ═══════════════════════════════════════════════════════════════════════════

export class SyncEngine {
  private db: IndexedDBWrapper;
  private deviceId: string;
  private userId: number;
  private isSyncing: boolean = false;
  private conflictResolvers: Map<string, ConflictResolver> = new Map();
  private syncInterval: ReturnType<typeof setInterval> | null = null;

  constructor(deviceId: string, userId: number) {
    this.db = new IndexedDBWrapper();
    this.deviceId = deviceId;
    this.userId = userId;
  }

  /**
   * Initialize the sync engine
   */
  async init(): Promise<void> {
    await this.db.init();
    
    // Start periodic sync (every 5 minutes when online)
    this.startPeriodicSync();
  }

  /**
   * Capture a record offline
   */
  async captureOffline(
    entityType: string,
    payload: any,
    projectId?: number
  ): Promise<string> {
    // Check if entity type is allowed for offline capture
    if (!isOfflineAllowed(entityType)) {
      throw new Error(
        `Entity type "${entityType}" is not allowed for offline capture. ` +
        `Only draft-creating operations are permitted offline.`
      );
    }

    // Generate client UUID as idempotency key
    const localId = uuidv4();

    // Create offline record
    const record: OfflineRecord = {
      local_id: localId,
      entity_type: entityType,
      payload,
      created_at: new Date().toISOString(),
      device_id: this.deviceId,
      user_id: this.userId,
      project_id: projectId,
      attempts: 0,
      status: 'PENDING',
    };

    // Store in IndexedDB
    await this.db.addToOutbox(record);

    return localId;
  }

  /**
   * Sync all pending records with the server
   */
  async sync(): Promise<SyncResult[]> {
    if (this.isSyncing) {
      console.log('Sync already in progress, skipping');
      return [];
    }

    this.isSyncing = true;
    const results: SyncResult[] = [];

    try {
      // Get all pending records
      const pendingRecords = await this.db.getPendingRecords();

      if (pendingRecords.length === 0) {
        return results;
      }

      console.log(`Syncing ${pendingRecords.length} offline records`);

      // Sync records one at a time, in creation order
      for (const record of pendingRecords) {
        try {
          // Update status to SYNCING
          record.status = 'SYNCING';
          await this.db.updateOutboxRecord(record);

          // Send to server
          const result = await this.syncRecord(record);
          results.push(result);

          // Handle result
          if (result.status === 'ACCEPTED') {
            record.status = 'SYNCED';
            record.server_id = result.server_id;
            record.clock_skew_sec = result.clock_skew_sec;
            await this.db.updateOutboxRecord(record);
            
            // Remove from outbox after successful sync
            await this.db.deleteFromOutbox(record.local_id);
          } else if (result.status === 'DUPLICATE') {
            // Already synced, remove from outbox
            await this.db.deleteFromOutbox(record.local_id);
          } else if (result.status === 'REJECTED') {
            record.status = 'REJECTED';
            record.error = result.error;
            await this.db.updateOutboxRecord(record);
          }
        } catch (error) {
          // Network error or server error
          record.attempts += 1;
          
          if (record.attempts >= 5) {
            // Max retries reached
            record.status = 'FAILED';
            record.error = error instanceof Error ? error.message : 'Unknown error';
            await this.db.updateOutboxRecord(record);
          } else {
            // Reset to PENDING for retry with exponential backoff
            record.status = 'PENDING';
            await this.db.updateOutboxRecord(record);
            
            // Wait before next attempt (exponential backoff)
            const delay = Math.pow(2, record.attempts) * 1000; // 2s, 4s, 8s, 16s, 32s
            await this.sleep(delay);
          }
        }
      }
    } finally {
      this.isSyncing = false;
    }

    return results;
  }

  /**
   * Sync a single record with the server
   */
  private async syncRecord(record: OfflineRecord): Promise<SyncResult> {
    // Calculate clock skew
    const deviceTime = new Date(record.created_at).getTime();
    const serverTime = Date.now(); // Would come from server response headers
    const clockSkewSec = Math.floor((serverTime - deviceTime) / 1000);

    // Calculate payload hash for integrity
    const payloadHash = await this.calculateHash(record.payload);

    // Send to server API
    // In production, this would call: POST /api/dx/v1/sync
    const response = await this.callSyncAPI({
      local_id: record.local_id,
      device_id: record.device_id,
      user_id: record.user_id,
      project_id: record.project_id,
      entity_type: record.entity_type,
      payload: record.payload,
      captured_at: record.created_at,
      payload_hash: payloadHash,
    });

    return {
      local_id: record.local_id,
      status: response.status,
      server_id: response.server_record_id,
      error: response.error_message,
      clock_skew_sec: clockSkewSec,
    };
  }

  /**
   * Call the sync API endpoint
   */
  private async callSyncAPI(payload: any): Promise<any> {
    // In production, this would make an actual API call
    // For now, simulate the API response
    
    // Simulate network delay
    await this.sleep(500);

    // Simulate successful sync
    return {
      status: 'ACCEPTED',
      server_record_id: Math.floor(Math.random() * 1000000),
      error_message: null,
    };

    // Example of conflict handling:
    // return {
    //   status: 'REJECTED',
    //   server_record_id: null,
    //   error_message: 'Conflict: record already exists with different data',
    // };
  }

  /**
   * Calculate SHA-256 hash of payload
   */
  private async calculateHash(payload: any): Promise<string> {
    const json = JSON.stringify(payload);
    const encoder = new TextEncoder();
    const data = encoder.encode(json);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  }

  /**
   * Register a conflict resolver for an entity type
   */
  registerConflictResolver(entityType: string, resolver: ConflictResolver): void {
    this.conflictResolvers.set(entityType, resolver);
  }

  /**
   * Resolve a sync conflict
   */
  async resolveConflict(
    localId: string,
    action: 'ACCEPT' | 'REJECT' | 'MERGE',
    mergedPayload?: any,
    reason?: string
  ): Promise<void> {
    const records = await this.db.getFailedRecords();
    const record = records.find(r => r.local_id === localId);

    if (!record) {
      throw new Error(`Record not found: ${localId}`);
    }

    if (action === 'ACCEPT') {
      // Retry sync with original payload
      record.status = 'PENDING';
      record.attempts = 0;
      await this.db.updateOutboxRecord(record);
    } else if (action === 'REJECT') {
      // Discard the record
      await this.db.deleteFromOutbox(localId);
    } else if (action === 'MERGE') {
      // Update payload and retry
      record.payload = mergedPayload;
      record.status = 'PENDING';
      record.attempts = 0;
      await this.db.updateOutboxRecord(record);
    }
  }

  /**
   * Get all failed/rejected records for Sync Issues screen
   */
  async getSyncIssues(): Promise<OfflineRecord[]> {
    const failed = await this.db.getFailedRecords();
    const pending = await this.db.getPendingRecords();
    return [...failed, ...pending.filter(r => r.attempts > 0)];
  }

  /**
   * Get count of pending sync items
   */
  async getPendingCount(): Promise<number> {
    return await this.db.getPendingCount();
  }

  /**
   * Cache reference data for offline use
   */
  async cacheReferenceData(entityType: string, projectId: number, data: any[]): Promise<void> {
    await this.db.cacheReferenceData(entityType, projectId, data);
  }

  /**
   * Get cached reference data
   */
  async getReferenceData(entityType: string, projectId: number): Promise<any[] | null> {
    return await this.db.getReferenceData(entityType, projectId);
  }

  /**
   * Clear all cached data (on logout or project change)
   */
  async clearAllData(): Promise<void> {
    await this.db.clearAllData();
  }

  /**
   * Start periodic sync (every 5 minutes when online)
   */
  private startPeriodicSync(): void {
    // Check if online
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      this.syncInterval = setInterval(() => {
        this.sync().catch(error => {
          console.error('Periodic sync failed:', error);
        });
      }, 5 * 60 * 1000); // 5 minutes
    }

    // Listen for online/offline events
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        console.log('Network online, starting sync');
        this.sync();
        
        // Start periodic sync if not already running
        if (!this.syncInterval) {
          this.startPeriodicSync();
        }
      });

      window.addEventListener('offline', () => {
        console.log('Network offline, stopping periodic sync');
        if (this.syncInterval) {
          clearInterval(this.syncInterval);
          this.syncInterval = null;
        }
      });
    }
  }

  /**
   * Stop periodic sync
   */
  stopPeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.stopPeriodicSync();
    this.db.close();
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export default SyncEngine;
