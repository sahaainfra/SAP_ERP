/**
 * Part 05 — Pagination Utilities
 * 
 * Implements both offset and keyset pagination.
 * Keyset pagination is mandatory for any collection that can exceed 10,000 rows.
 */

import { PageMeta } from './envelope';

// ─── Offset Pagination ────────────────────────────────────────────────────────

export interface OffsetPaginationParams {
  $skip?: number;
  $top?: number;
}

export function parseOffsetPagination(params: OffsetPaginationParams): {
  skip: number;
  top: number;
} {
  const skip = Math.max(0, params.$skip ?? 0);
  const top = Math.min(200, Math.max(1, params.$top ?? 50));
  return { skip, top };
}

export function createOffsetPageMeta(
  skip: number,
  top: number,
  total: number
): PageMeta {
  return {
    skip,
    top,
    total,
    hasMore: skip + top < total,
  };
}

// ─── Keyset Pagination ────────────────────────────────────────────────────────

export interface KeysetPaginationParams {
  $cursor?: string;
  $top?: number;
}

export interface OrderSpec {
  field: string;
  direction: 'asc' | 'desc';
}

export function parseKeysetPagination(params: KeysetPaginationParams): {
  cursor: Record<string, unknown> | null;
  top: number;
} {
  const top = Math.min(200, Math.max(1, params.$top ?? 50));

  if (!params.$cursor) {
    return { cursor: null, top };
  }

  try {
    // Use atob for browser compatibility
    const decoded = atob(params.$cursor.replace(/-/g, '+').replace(/_/g, '/'));
    const cursor = JSON.parse(decoded);
    return { cursor, top };
  } catch {
    throw new Error('Invalid cursor');
  }
}

export function encodeCursor(
  row: Record<string, unknown>,
  orderBy: OrderSpec[]
): string {
  const values = orderBy.map((o) => row[o.field]);
  const json = JSON.stringify(values);
  // Use btoa for browser compatibility
  return btoa(json).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

export function buildKeysetWhereClause(
  cursor: Record<string, unknown>,
  orderBy: OrderSpec[],
  paramOffset: number
): { sql: string; params: unknown[] } {
  if (!cursor || Object.keys(cursor).length === 0) {
    return { sql: '', params: [] };
  }

  const conditions: string[] = [];
  const params: unknown[] = [];
  let paramIndex = paramOffset;

  // Build tuple comparison: (field1, field2, ...) > ($1, $2, ...)
  // For descending order, we use < instead of >
  const fields = orderBy.map((o) => o.field);
  const directions = orderBy.map((o) => o.direction);

  // Build the comparison
  const leftSide = fields.map((f) => `"${f}"`).join(', ');
  const rightSide: string[] = [];

  for (const field of fields) {
    params.push(cursor[field]);
    rightSide.push(`$${++paramIndex}`);
  }

  const operator = directions[0] === 'desc' ? '<' : '>';
  conditions.push(`(${leftSide}) ${operator} (${rightSide.join(', ')})`);

  return {
    sql: conditions.join(' AND '),
    params,
  };
}

// ─── Entities Requiring Keyset Pagination ─────────────────────────────────────

export const KEYSET_REQUIRED_ENTITIES = [
  'stock_ledger',
  'attendance',
  'voucher_line',
  'mb_line',
  'audit_log',
  'notification',
  'event_outbox',
] as const;

export function requiresKeysetPagination(entity: string): boolean {
  return (KEYSET_REQUIRED_ENTITIES as readonly string[]).includes(entity);
}
