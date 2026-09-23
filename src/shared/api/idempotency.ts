/**
 * Part 05 — Idempotency
 * 
 * Ensures that POST requests are idempotent — replaying the same request
 * with the same Idempotency-Key returns the same response without re-executing.
 * 
 * Table structure:
 * ```sql
 * CREATE TABLE dx_idempotency (
 *   key VARCHAR(120) PRIMARY KEY,
 *   actor_user_id BIGINT NOT NULL,
 *   endpoint VARCHAR(200) NOT NULL,
 *   request_hash CHAR(64) NOT NULL,
 *   status VARCHAR(20) NOT NULL,  -- IN_PROGRESS|COMPLETED|FAILED
 *   response_status INTEGER,
 *   response_body JSONB,
 *   created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 *   completed_at TIMESTAMPTZ,
 *   expires_at TIMESTAMPTZ NOT NULL
 * );
 * 
 * CREATE INDEX idx_idempotency_expires ON dx_idempotency(expires_at);
 * ```
 */

import { IdempotencyError } from '../errors/catalogue';

// ─── Types ────────────────────────────────────────────────────────────────────

export type IdempotencyStatus = 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';

export interface IdempotencyRecord {
  key: string;
  actorUserId: string;
  endpoint: string;
  requestHash: string;
  status: IdempotencyStatus;
  responseStatus?: number;
  responseBody?: unknown;
  createdAt: Date;
  completedAt?: Date;
  expiresAt: Date;
}

// ─── Request Hash ─────────────────────────────────────────────────────────────

/**
 * Generate a hash of the request body for idempotency validation
 */
export async function hashRequestBody(body: unknown): Promise<string> {
  const json = JSON.stringify(body, Object.keys(body as object).sort());
  const encoder = new TextEncoder();
  const data = encoder.encode(json);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// ─── Idempotency Service ──────────────────────────────────────────────────────

/**
 * IdempotencyService — manages idempotency records
 * 
 * In production, this would be backed by the dx_idempotency table.
 * For now, we use an in-memory store for demonstration.
 */
export class IdempotencyService {
  private records = new Map<string, IdempotencyRecord>();

  /**
   * Check if an idempotency key exists and handle accordingly
   * 
   * Returns:
   * - null if key doesn't exist (proceed with request)
   * - IdempotencyRecord if key exists and is COMPLETED (return cached response)
   * - Throws IdempotencyError if key exists and is IN_PROGRESS
   * - Throws IdempotencyError if key exists with different request hash
   */
  async check(
    key: string,
    actorUserId: string,
    endpoint: string,
    requestHash: string
  ): Promise<IdempotencyRecord | null> {
    const record = this.records.get(key);

    if (!record) {
      return null;
    }

    // Check if expired
    if (record.expiresAt < new Date()) {
      this.records.delete(key);
      return null;
    }

    // Check if in progress
    if (record.status === 'IN_PROGRESS') {
      throw new IdempotencyError('REQUEST_IN_PROGRESS', key);
    }

    // Check if request hash matches
    if (record.requestHash !== requestHash) {
      throw new IdempotencyError('IDEMPOTENCY_KEY_REUSED', key);
    }

    // Return cached response
    return record;
  }

  /**
   * Create an IN_PROGRESS record
   */
  async create(
    key: string,
    actorUserId: string,
    endpoint: string,
    requestHash: string,
    ttlHours: number = 24
  ): Promise<void> {
    const record: IdempotencyRecord = {
      key,
      actorUserId,
      endpoint,
      requestHash,
      status: 'IN_PROGRESS',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + ttlHours * 60 * 60 * 1000),
    };

    this.records.set(key, record);
  }

  /**
   * Mark request as COMPLETED with response
   */
  async complete(
    key: string,
    responseStatus: number,
    responseBody: unknown
  ): Promise<void> {
    const record = this.records.get(key);
    if (!record) {
      throw new Error(`Idempotency record not found: ${key}`);
    }

    record.status = 'COMPLETED';
    record.responseStatus = responseStatus;
    record.responseBody = responseBody;
    record.completedAt = new Date();
  }

  /**
   * Mark request as FAILED
   */
  async fail(key: string, responseStatus: number, responseBody: unknown): Promise<void> {
    const record = this.records.get(key);
    if (!record) {
      throw new Error(`Idempotency record not found: ${key}`);
    }

    record.status = 'FAILED';
    record.responseStatus = responseStatus;
    record.responseBody = responseBody;
    record.completedAt = new Date();
  }

  /**
   * Clean up expired records
   */
  async cleanup(): Promise<number> {
    const now = new Date();
    let count = 0;

    for (const [key, record] of this.records.entries()) {
      if (record.expiresAt < now) {
        this.records.delete(key);
        count++;
      }
    }

    return count;
  }
}

export const idempotencyService = new IdempotencyService();

// ─── Idempotency Middleware ───────────────────────────────────────────────────

/**
 * Middleware wrapper for idempotent endpoints
 * 
 * Usage:
 * ```typescript
 * @Post()
 * @Idempotent()
 * async create(@Body() dto: CreateDto, @Headers('Idempotency-Key') key: string) {
 *   // ...
 * }
 * ```
 */
export async function withIdempotency<T>(
  key: string | undefined,
  actorUserId: string,
  endpoint: string,
  requestBody: unknown,
  handler: () => Promise<{ status: number; body: T }>
): Promise<{ status: number; body: T; replayed: boolean }> {
  // If no idempotency key, just execute
  if (!key) {
    const result = await handler();
    return { ...result, replayed: false };
  }

  // Hash the request body
  const requestHash = await hashRequestBody(requestBody);

  // Check for existing record
  const existing = await idempotencyService.check(
    key,
    actorUserId,
    endpoint,
    requestHash
  );

  if (existing && existing.status === 'COMPLETED') {
    // Return cached response
    return {
      status: existing.responseStatus!,
      body: existing.responseBody as T,
      replayed: true,
    };
  }

  // Create IN_PROGRESS record
  await idempotencyService.create(key, actorUserId, endpoint, requestHash);

  try {
    // Execute the handler
    const result = await handler();

    // Mark as COMPLETED
    await idempotencyService.complete(key, result.status, result.body);

    return { ...result, replayed: false };
  } catch (error) {
    // Mark as FAILED
    const status = error instanceof Error && 'httpStatus' in error ? (error as any).httpStatus : 500;
    const body = error instanceof Error ? { error: error.message } : { error: 'Unknown error' };
    await idempotencyService.fail(key, status, body);
    throw error;
  }
}
