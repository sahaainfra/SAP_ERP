/**
 * Part 05 — Concurrency Control
 * 
 * Implements optimistic concurrency control using ETags.
 * - dx_ tables carry row_version BIGINT
 * - Existing tables use content hash (SHA-256)
 * - GET returns ETag header
 * - PATCH/action calls must send If-Match header
 * - Mismatch returns 409 CONFLICT with current server state
 */

import { ConcurrencyError } from '../errors/catalogue';

// ─── ETag Generation ──────────────────────────────────────────────────────────

/**
 * Generate ETag from row_version (for dx_ tables)
 */
export function generateETagFromVersion(version: number): string {
  return `"${version}"`;
}

/**
 * Generate ETag from content hash (for existing tables without row_version)
 */
export async function generateETagFromContent(
  row: Record<string, unknown>
): Promise<string> {
  // Create a deterministic string from all mapped column values
  const sorted = Object.keys(row)
    .sort()
    .map((key) => `${key}:${String(row[key] ?? '')}`)
    .join('|');

  // Use SubtleCrypto for hashing (works in browser and Node.js 18+)
  const encoder = new TextEncoder();
  const data = encoder.encode(sorted);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

  // Return first 16 chars as ETag
  return `"${hashHex.substring(0, 16)}"`;
}

/**
 * Strip quotes from ETag header value
 */
export function stripETagQuotes(etag: string): string {
  return etag.replace(/^"|"$/g, '');
}

// ─── Concurrency Guard ────────────────────────────────────────────────────────

export interface ConcurrencyCheckResult {
  matches: boolean;
  currentVersion: string;
}

/**
 * ConcurrencyGuard — validates If-Match header against current version
 * 
 * Usage:
 * ```typescript
 * const guard = new ConcurrencyGuard(versionReader);
 * await guard.assert(ctx, 'purchase_order', 123, ifMatchHeader);
 * ```
 */
export class ConcurrencyGuard {
  constructor(
    private versionReader: (
      entity: string,
      id: string | number
    ) => Promise<string>
  ) {}

  /**
   * Assert that the If-Match header matches the current version
   * Throws ConcurrencyError if mismatch
   */
  async assert(
    entity: string,
    id: string | number,
    ifMatch: string | undefined
  ): Promise<void> {
    if (!ifMatch) {
      throw new ConcurrencyError(entity, id, '', '', undefined);
    }

    const currentVersion = await this.versionReader(entity, id);
    const expected = stripETagQuotes(ifMatch);
    const actual = stripETagQuotes(currentVersion);

    if (expected !== actual) {
      throw new ConcurrencyError(entity, id, ifMatch, currentVersion, undefined);
    }
  }

  /**
   * Check if If-Match matches without throwing
   */
  async check(
    entity: string,
    id: string | number,
    ifMatch: string | undefined
  ): Promise<ConcurrencyCheckResult> {
    const currentVersion = await this.versionReader(entity, id);

    if (!ifMatch) {
      return { matches: false, currentVersion };
    }

    const expected = stripETagQuotes(ifMatch);
    const actual = stripETagQuotes(currentVersion);

    return {
      matches: expected === actual,
      currentVersion,
    };
  }
}

// ─── Edit Lock (Advisory) ─────────────────────────────────────────────────────

/**
 * EditLock — advisory lock for long-running edits
 * 
 * This is NOT a substitute for ETag checks. It provides a visible indicator
 * that another user is editing a document, with a request-takeover action.
 * 
 * Table structure (to be created in migration):
 * ```sql
 * CREATE TABLE dx_edit_lock (
 *   entity VARCHAR(100) NOT NULL,
 *   entity_id BIGINT NOT NULL,
 *   user_id BIGINT NOT NULL,
 *   acquired_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 *   expires_at TIMESTAMPTZ NOT NULL,
 *   heartbeat_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 *   PRIMARY KEY (entity, entity_id)
 * );
 * ```
 */
export interface EditLock {
  entity: string;
  entityId: string | number;
  userId: string;
  acquiredAt: Date;
  expiresAt: Date;
  heartbeatAt: Date;
}

export class EditLockService {
  private locks = new Map<string, EditLock>();

  /**
   * Acquire an edit lock
   */
  async acquire(
    entity: string,
    entityId: string | number,
    userId: string,
    durationMinutes: number = 30
  ): Promise<EditLock | null> {
    const key = `${entity}:${entityId}`;
    const existing = this.locks.get(key);

    // Check if lock exists and is not expired
    if (existing && existing.expiresAt > new Date()) {
      // Lock is held by another user
      if (existing.userId !== userId) {
        return null;
      }
      // Lock is held by same user, extend it
      existing.expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000);
      existing.heartbeatAt = new Date();
      return existing;
    }

    // Acquire new lock
    const lock: EditLock = {
      entity,
      entityId,
      userId,
      acquiredAt: new Date(),
      expiresAt: new Date(Date.now() + durationMinutes * 60 * 1000),
      heartbeatAt: new Date(),
    };

    this.locks.set(key, lock);
    return lock;
  }

  /**
   * Release an edit lock
   */
  async release(
    entity: string,
    entityId: string | number,
    userId: string
  ): Promise<void> {
    const key = `${entity}:${entityId}`;
    const existing = this.locks.get(key);

    if (existing && existing.userId === userId) {
      this.locks.delete(key);
    }
  }

  /**
   * Get current lock holder
   */
  async getLock(
    entity: string,
    entityId: string | number
  ): Promise<EditLock | null> {
    const key = `${entity}:${entityId}`;
    const lock = this.locks.get(key);

    if (!lock || lock.expiresAt <= new Date()) {
      this.locks.delete(key);
      return null;
    }

    return lock;
  }

  /**
   * Update heartbeat (extend lock)
   */
  async heartbeat(
    entity: string,
    entityId: string | number,
    userId: string
  ): Promise<EditLock | null> {
    const key = `${entity}:${entityId}`;
    const lock = this.locks.get(key);

    if (!lock || lock.userId !== userId || lock.expiresAt <= new Date()) {
      return null;
    }

    lock.heartbeatAt = new Date();
    lock.expiresAt = new Date(Date.now() + 30 * 60 * 1000); // Extend by 30 minutes
    return lock;
  }
}

export const editLockService = new EditLockService();
