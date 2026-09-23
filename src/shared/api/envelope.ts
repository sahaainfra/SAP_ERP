/**
 * Part 05 — API Response Envelope
 * 
 * Every response, success or failure, has the same top-level shape.
 * This ensures consistency across all endpoints and makes error handling
 * predictable for both the UI and API consumers.
 */

// ─── Success Response ─────────────────────────────────────────────────────────

export interface ApiSuccess<T> {
  ok: true;
  data: T;
  meta?: {
    page?: {
      skip: number;
      top: number;
      total: number;
      hasMore: boolean;
      cursor?: string; // keyset pagination token
    };
    totals?: Record<string, string | number>; // server-computed aggregates
    masked?: string[]; // field paths withheld by permission
    warnings?: ApiIssue[]; // non-blocking validation results
    generatedAt: string; // ISO timestamp
    correlationId: string;
  };
}

// ─── Failure Response ─────────────────────────────────────────────────────────

export interface ApiFailure {
  ok: false;
  error: {
    code: string; // stable, catalogued, never localised
    message: string; // human text, localised
    severity: 'ERROR' | 'WARNING';
    target?: string; // JSON pointer to the offending field
    details?: ApiIssue[]; // per-field issues
    remediation?: string; // what the user can do
    correlationId: string;
  };
}

// ─── Issue (for validation errors, warnings, etc.) ────────────────────────────

export interface ApiIssue {
  code: string;
  message: string;
  target?: string; // JSON pointer to the field
  severity: 'ERROR' | 'WARNING' | 'INFO';
  context?: Record<string, unknown>; // actual numbers for UI rendering
}

// ─── Helper Functions ─────────────────────────────────────────────────────────

export function ok<T>(
  data: T,
  meta?: Partial<ApiSuccess<T>['meta']>
): ApiSuccess<T> {
  return {
    ok: true,
    data,
    meta: meta
      ? {
          generatedAt: new Date().toISOString(),
          correlationId: crypto.randomUUID(),
          ...meta,
        }
      : undefined,
  };
}

export function fail(
  code: string,
  message: string,
  options?: {
    severity?: 'ERROR' | 'WARNING';
    target?: string;
    details?: ApiIssue[];
    remediation?: string;
    correlationId?: string;
    context?: Record<string, unknown>;
  }
): ApiFailure {
  return {
    ok: false,
    error: {
      code,
      message,
      severity: options?.severity ?? 'ERROR',
      target: options?.target,
      details: options?.details,
      remediation: options?.remediation,
      correlationId: options?.correlationId ?? crypto.randomUUID(),
    },
  };
}

// ─── Pagination Metadata ──────────────────────────────────────────────────────

export interface PageMeta {
  skip: number;
  top: number;
  total: number;
  hasMore: boolean;
  cursor?: string;
}

export function createPageMeta(
  skip: number,
  top: number,
  total: number,
  cursor?: string
): PageMeta {
  return {
    skip,
    top,
    total,
    hasMore: skip + top < total,
    cursor,
  };
}
