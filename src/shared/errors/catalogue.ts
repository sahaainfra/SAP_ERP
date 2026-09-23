/**
 * Part 05 — Error Catalogue
 * 
 * Error codes are stable identifiers. The message is localised; the code never is.
 * Every code is registered in one file so the front end can map codes to remediation UI
 * and so support can search by code.
 * 
 * Rule: Stack traces, SQL, table names and internal IDs never appear in API responses.
 * They go to the structured log keyed by correlationId, which is returned to the user.
 */

// ─── Error Code Definitions ───────────────────────────────────────────────────

export interface ErrorCode {
  http: number;
  severity: 'ERROR' | 'WARNING';
  description: string;
  remediation?: string;
}

export const ERRORS = {
  // ─── 400 — Shape Validation ───────────────────────────────────────────────
  VALIDATION_FAILED: {
    http: 400,
    severity: 'ERROR',
    description: 'Request body or query parameters failed validation',
    remediation: 'Check the error details for specific field issues',
  },
  FILTER_UNKNOWN_FIELD: {
    http: 400,
    severity: 'ERROR',
    description: 'Filter references a field that does not exist or is not filterable',
    remediation: 'Check the API documentation for allowed filter fields',
  },
  FILTER_OP_NOT_ALLOWED: {
    http: 400,
    severity: 'ERROR',
    description: 'Filter operation is not allowed for this field',
    remediation: 'Check the API documentation for allowed operators on this field',
  },
  FILTER_BAD_VALUE: {
    http: 400,
    severity: 'ERROR',
    description: 'Filter value is not valid for the field type',
    remediation: 'Ensure the value matches the expected type (string, number, date, etc.)',
  },
  FILTER_FIELD_FORBIDDEN: {
    http: 400,
    severity: 'ERROR',
    description: 'You do not have permission to filter by this field',
    remediation: 'Contact your administrator if you need access to this field',
  },

  // ─── 401 / 403 — Identity and Permission ──────────────────────────────────
  UNAUTHENTICATED: {
    http: 401,
    severity: 'ERROR',
    description: 'Authentication required',
    remediation: 'Please log in to access this resource',
  },
  SESSION_EXPIRED: {
    http: 401,
    severity: 'ERROR',
    description: 'Your session has expired',
    remediation: 'Please log in again',
  },
  MFA_REQUIRED: {
    http: 401,
    severity: 'ERROR',
    description: 'Multi-factor authentication required',
    remediation: 'Complete the MFA challenge to continue',
  },
  PERMISSION_DENIED: {
    http: 403,
    severity: 'ERROR',
    description: 'You do not have permission to perform this action',
    remediation: 'Contact your administrator to request access',
  },
  PROJECT_NOT_ASSIGNED: {
    http: 403,
    severity: 'ERROR',
    description: 'You are not assigned to this project',
    remediation: 'Contact your project manager to be added to the project',
  },
  FIELD_FORBIDDEN: {
    http: 403,
    severity: 'ERROR',
    description: 'You do not have permission to access this field',
    remediation: 'Contact your administrator if you need access to this field',
  },
  SOD_CONFLICT: {
    http: 403,
    severity: 'ERROR',
    description: 'Segregation of duties conflict detected',
    remediation: 'This action conflicts with your other responsibilities. Contact your administrator.',
  },
  APPROVAL_AUTHORITY_EXCEEDED: {
    http: 403,
    severity: 'ERROR',
    description: 'The amount exceeds your approval authority',
    remediation: 'This request must be approved by someone with higher authority',
  },
  OVERRIDE_NOT_PERMITTED: {
    http: 403,
    severity: 'ERROR',
    description: 'You do not have permission to override this rule',
    remediation: 'Contact your administrator if you need override authority',
  },
  DEVICE_NOT_PERMITTED: {
    http: 403,
    severity: 'ERROR',
    description: 'This action is not permitted on this device type',
    remediation: 'Please use a desktop or tablet to perform this action',
  },

  // ─── 404 / 409 / 412 / 428 — Resource State ───────────────────────────────
  NOT_FOUND: {
    http: 404,
    severity: 'ERROR',
    description: 'The requested resource was not found',
    remediation: 'The resource may have been deleted or you may not have access',
  },
  CONCURRENT_MODIFICATION: {
    http: 409,
    severity: 'ERROR',
    description: 'The resource has been modified by another user',
    remediation: 'Reload the resource and merge your changes',
  },
  REQUEST_IN_PROGRESS: {
    http: 409,
    severity: 'ERROR',
    description: 'A previous request with the same idempotency key is still processing',
    remediation: 'Wait for the previous request to complete, or use a different idempotency key',
  },
  STATE_TRANSITION_INVALID: {
    http: 409,
    severity: 'ERROR',
    description: 'The requested state transition is not allowed',
    remediation: 'Check the document status and available actions',
  },
  DOCUMENT_LOCKED: {
    http: 409,
    severity: 'ERROR',
    description: 'The document is currently being edited by another user',
    remediation: 'Wait for the other user to finish, or request to take over the edit',
  },
  PERIOD_CLOSED: {
    http: 409,
    severity: 'ERROR',
    description: 'The accounting period is closed',
    remediation: 'Post to the next open period, or contact finance to reopen the period',
  },
  PRECONDITION_REQUIRED: {
    http: 428,
    severity: 'ERROR',
    description: 'If-Match header is required for this request',
    remediation: 'Include the ETag from the last GET request in the If-Match header',
  },

  // ─── 422 — Business Rule Violations ───────────────────────────────────────
  BUSINESS_RULE_VIOLATION: {
    http: 422,
    severity: 'ERROR',
    description: 'A business rule was violated',
    remediation: 'Review the error details for the specific rule that was violated',
  },
  REFERENCE_INACTIVE: {
    http: 422,
    severity: 'ERROR',
    description: 'The referenced entity is inactive or deleted',
    remediation: 'Use an active entity or reactivate the referenced entity',
  },
  BUDGET_EXCEEDED: {
    http: 422,
    severity: 'ERROR',
    description: 'The requested amount exceeds the available budget',
    remediation: 'Reduce the quantity or request a budget revision',
  },
  QUANTITY_CEILING_EXCEEDED: {
    http: 422,
    severity: 'ERROR',
    description: 'The quantity exceeds the allowed ceiling',
    remediation: 'Reduce the quantity to within the allowed limit',
  },
  INSUFFICIENT_STOCK: {
    http: 422,
    severity: 'ERROR',
    description: 'Insufficient stock available',
    remediation: 'Reduce the quantity or wait for stock to be replenished',
  },
  COMPLIANCE_EXPIRED: {
    http: 422,
    severity: 'ERROR',
    description: 'A required compliance document has expired',
    remediation: 'Renew the compliance document before proceeding',
  },
  DUPLICATE_RECORD: {
    http: 422,
    severity: 'ERROR',
    description: 'A record with the same key fields already exists',
    remediation: 'Check for existing records before creating a new one',
  },
  IDEMPOTENCY_KEY_REUSED: {
    http: 422,
    severity: 'ERROR',
    description: 'The idempotency key has been used with a different request',
    remediation: 'Use a new idempotency key for this request',
  },
  UOM_CONVERSION_MISSING: {
    http: 422,
    severity: 'ERROR',
    description: 'No conversion factor exists between the source and target units',
    remediation: 'Define a conversion factor in the unit of measure master',
  },
  RATE_NOT_FOUND: {
    http: 422,
    severity: 'ERROR',
    description: 'No rate was found for the specified criteria',
    remediation: 'Check the rate master for the correct effective date and conditions',
  },
  OVERRIDE_REASON_REQUIRED: {
    http: 422,
    severity: 'ERROR',
    description: 'A reason is required when overriding this rule',
    remediation: 'Provide a reason for the override',
  },

  // ─── 429 / 5xx — Rate Limiting and Server Errors ──────────────────────────
  RATE_LIMITED: {
    http: 429,
    severity: 'ERROR',
    description: 'Too many requests',
    remediation: 'Wait before retrying the request',
  },
  INTERNAL_ERROR: {
    http: 500,
    severity: 'ERROR',
    description: 'An internal error occurred',
    remediation: 'Please try again later or contact support with the correlation ID',
  },
  INTEGRATION_UNAVAILABLE: {
    http: 503,
    severity: 'ERROR',
    description: 'An external integration is currently unavailable',
    remediation: 'The request has been queued and will be retried automatically',
  },
  CIRCUIT_OPEN: {
    http: 503,
    severity: 'ERROR',
    description: 'The circuit breaker is open due to repeated failures',
    remediation: 'The integration will be retried after the cooldown period',
  },
} as const;

// ─── Error Code Type ──────────────────────────────────────────────────────────

export type ErrorCodeKey = keyof typeof ERRORS;

// ─── Error Classes ────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public code: ErrorCodeKey,
    public context?: Record<string, unknown>,
    public target?: string
  ) {
    super(ERRORS[code].description);
    this.name = 'ApiError';
  }

  get httpStatus(): number {
    return ERRORS[this.code].http;
  }

  get severity(): 'ERROR' | 'WARNING' {
    return ERRORS[this.code].severity;
  }
}

export class ValidationError extends ApiError {
  constructor(
    public issues: Array<{
      code: string;
      message: string;
      target?: string;
      context?: Record<string, unknown>;
    }>
  ) {
    super('VALIDATION_FAILED');
    this.name = 'ValidationError';
  }
}

export class ConcurrencyError extends ApiError {
  constructor(
    public entity: string,
    public id: string | number,
    public expected: string,
    public actual: string,
    public serverState?: unknown
  ) {
    super('CONCURRENT_MODIFICATION', { entity, id, expected, actual });
    this.name = 'ConcurrencyError';
  }
}

export class ForbiddenError extends ApiError {
  constructor(code: ErrorCodeKey, context?: Record<string, unknown>) {
    super(code, context);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends ApiError {
  constructor(entity: string, id: string | number) {
    super('NOT_FOUND', { entity, id });
    this.name = 'NotFoundError';
  }
}

export class IdempotencyError extends ApiError {
  constructor(code: 'REQUEST_IN_PROGRESS' | 'IDEMPOTENCY_KEY_REUSED', key: string) {
    super(code, { idempotencyKey: key });
    this.name = 'IdempotencyError';
  }
}
