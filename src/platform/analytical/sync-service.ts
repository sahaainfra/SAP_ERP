/**
 * Part 15 — Offline Sync Service
 * 
 * Handles offline sync with conflict resolution:
 * - Idempotency (duplicate detection)
 * - Allow-list enforcement
 * - Permission re-check at sync time
 * - Per-entity conflict resolvers
 * - Clock skew recording
 */

import {
  OfflineBatch,
  OfflineRecord,
  SyncResult,
  SyncResolution,
  SyncResolver,
  OFFLINE_ALLOWED,
  OFFLINE_PERMISSION,
} from './types';

export class SyncService {
  private resolvers: Map<string, SyncResolver> = new Map();
  private syncLog: Map<string, SyncResult> = new Map(); // localId -> result

  constructor() {
    this.registerDefaultResolvers();
  }

  /**
   * Register a conflict resolver for an entity type
   */
  registerResolver(entityType: string, resolver: SyncResolver): void {
    this.resolvers.set(entityType, resolver);
  }

  /**
   * Submit an offline batch for sync
   */
  async submit(ctx: any, batch: OfflineBatch): Promise<SyncResult[]> {
    const results: SyncResult[] = [];

    // Sort by capture time to maintain order
    const sorted = [...batch.records].sort(
      (a, b) => new Date(a.capturedAt).getTime() - new Date(b.capturedAt).getTime()
    );

    for (const record of sorted) {
      const result = await this.processRecord(ctx, record, batch.userId);
      results.push(result);
    }

    return results;
  }

  /**
   * Process a single offline record
   */
  private async processRecord(
    ctx: any,
    record: OfflineRecord,
    userId: number
  ): Promise<SyncResult> {
    // 1. Idempotency check
    const prior = this.syncLog.get(record.localId);
    if (prior) {
      return {
        localId: record.localId,
        status: 'DUPLICATE',
        serverId: prior.serverId,
      };
    }

    // 2. Allow-list enforcement
    if (!OFFLINE_ALLOWED.has(record.entityType)) {
      return {
        localId: record.localId,
        status: 'REJECTED',
        error: 'ENTITY_NOT_OFFLINE_CAPABLE',
        message: `Entity type ${record.entityType} does not support offline capture`,
      };
    }

    // 3. Permission re-check at sync time
    const requiredPermission = OFFLINE_PERMISSION[record.entityType];
    if (!ctx.actor.can(requiredPermission, record.projectId)) {
      return {
        localId: record.localId,
        status: 'REJECTED',
        error: 'PERMISSION_REVOKED_SINCE_CAPTURE',
        message: `Permission ${requiredPermission} revoked since capture`,
      };
    }

    // 4. Record clock skew
    const skew = this.calculateClockSkew(ctx.now, record.capturedAt);

    // 5. Business-level conflict resolution
    const resolver = this.resolvers.get(record.entityType);
    if (!resolver) {
      return {
        localId: record.localId,
        status: 'REJECTED',
        error: 'NO_RESOLVER',
        message: `No conflict resolver registered for ${record.entityType}`,
      };
    }

    const resolution = await resolver.resolve(ctx, record);

    // 6. Apply resolution
    switch (resolution.kind) {
      case 'ACCEPT':
        const serverId = await this.applyRecord(ctx, record);
        const result: SyncResult = {
          localId: record.localId,
          status: 'ACCEPTED',
          serverId,
          documentNumber: resolution.documentNumber,
        };
        this.syncLog.set(record.localId, result);
        return result;

      case 'CONFLICT':
        return {
          localId: record.localId,
          status: 'CONFLICT',
          error: resolution.code,
          message: resolution.message,
          serverState: resolution.serverState,
          resolutionOptions: resolution.options,
        };

      case 'REJECT':
        return {
          localId: record.localId,
          status: 'REJECTED',
          error: resolution.code,
          message: resolution.message,
        };
    }
  }

  /**
   * Apply a record to the server (mock implementation)
   */
  private async applyRecord(ctx: any, record: OfflineRecord): Promise<number> {
    // In production, would insert into database
    // For demo, return mock server ID
    return Math.floor(Math.random() * 1000000);
  }

  /**
   * Calculate clock skew in seconds
   */
  private calculateClockSkew(serverTime: Date, clientTime: string): number {
    const client = new Date(clientTime);
    return Math.floor((serverTime.getTime() - client.getTime()) / 1000);
  }

  /**
   * Get sync history for a user
   */
  getSyncHistory(userId: number): SyncResult[] {
    return Array.from(this.syncLog.values());
  }

  /**
   * Clear sync history (for testing)
   */
  clearSyncHistory(): void {
    this.syncLog.clear();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DEFAULT RESOLVERS
  // ═══════════════════════════════════════════════════════════════════════════

  private registerDefaultResolvers(): void {
    // Attendance resolver
    this.registerResolver('attendance', {
      resolve: async (ctx, record) => {
        // Check for duplicate attendance
        const existing = await this.findExistingAttendance(
          ctx,
          record.payload.workforceId,
          record.payload.date
        );

        if (!existing) {
          return { kind: 'ACCEPT' };
        }

        // Different project = fraud signal
        if (existing.projectId !== record.projectId) {
          return {
            kind: 'CONFLICT',
            code: 'ATTENDANCE_DUPLICATE_OTHER_PROJECT',
            message: 'Attendance already marked for different project',
            serverState: existing,
            options: ['KEEP_EXISTING', 'ESCALATE_TO_SUPERVISOR'],
          };
        }

        // Same project - check for out-punch
        if (!existing.outTime && record.payload.outTime) {
          return {
            kind: 'ACCEPT',
            mode: 'MERGE_OUT_PUNCH',
          };
        }

        return {
          kind: 'REJECT',
          code: 'ATTENDANCE_ALREADY_RECORDED',
          message: `Already marked ${existing.status} at ${existing.inTime}`,
        };
      },
    });

    // Measurement Book resolver
    this.registerResolver('measurement_book', {
      resolve: async (ctx, record) => {
        const existing = await this.findExistingMB(ctx, record.payload.mbId);

        if (!existing) {
          return { kind: 'ACCEPT' };
        }

        // Already certified
        if (existing.lockedAt) {
          return {
            kind: 'REJECT',
            code: 'MB_ALREADY_CERTIFIED',
            message: 'This MB was certified while you were offline. Create a revised MB.',
          };
        }

        // Content changed
        if (existing.contentHash !== record.payload.baseHash) {
          return {
            kind: 'CONFLICT',
            code: 'MB_CHANGED_SINCE_CAPTURE',
            message: 'MB was modified by another user',
            serverState: existing,
            options: ['MERGE_LINES', 'DISCARD_MINE', 'SAVE_AS_NEW_MB'],
          };
        }

        return { kind: 'ACCEPT' };
      },
    });

    // DPR resolver
    this.registerResolver('dpr', {
      resolve: async (ctx, record) => {
        const existing = await this.findExistingDPR(
          ctx,
          record.projectId,
          record.payload.date
        );

        if (!existing) {
          return { kind: 'ACCEPT' };
        }

        return {
          kind: 'CONFLICT',
          code: 'DPR_ALREADY_SUBMITTED',
          message: 'DPR already submitted for this date',
          serverState: existing,
          options: ['OVERWRITE', 'KEEP_EXISTING'],
        };
      },
    });
  }

  // Mock database queries
  private async findExistingAttendance(ctx: any, workforceId: number, date: string): Promise<any> {
    return null; // Mock
  }

  private async findExistingMB(ctx: any, mbId: number): Promise<any> {
    return null; // Mock
  }

  private async findExistingDPR(ctx: any, projectId: number, date: string): Promise<any> {
    return null; // Mock
  }
}

export const syncService = new SyncService();
