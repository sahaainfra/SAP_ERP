/**
 * Part 02 — Audit Foundation Service
 * 
 * Establishes the audit foundation that every later part writes through.
 * Extend or reuse the existing audit log — do not create a second one.
 * 
 * Every audited event records:
 * - timestamp (UTC)
 * - user id
 * - impersonated-by (if applicable)
 * - session id
 * - IP
 * - user agent
 * - module
 * - entity type
 * - entity id
 * - action
 * - before-value
 * - after-value
 * - company/project/site scope
 * - permission key used
 * - result (allowed/denied)
 * 
 * Audit rows are append-only. No UPDATE, no DELETE, enforced by database
 * permissions on the application's database user.
 */

export interface AuditEvent {
  id: string;
  timestamp: string; // ISO 8601 UTC
  userId: string;
  impersonatedBy?: string;
  sessionId: string;
  ipAddress: string;
  userAgent: string;
  module: string;
  entityType: string;
  entityId: string;
  action: string;
  beforeValue?: any;
  afterValue?: any;
  companyId?: string;
  projectId?: string;
  siteId?: string;
  permissionKey: string;
  result: 'allowed' | 'denied';
  reason?: string;
  correlationId?: string;
}

export interface AuditLog {
  events: AuditEvent[];
  totalCount: number;
}

/**
 * Audit Foundation Service
 * 
 * In a real implementation, this would write to dx_audit_log table.
 * For this fresh workspace, we maintain an in-memory audit log for
 * demonstration purposes.
 * 
 * IMPORTANT: In production, this service writes to the database and
 * the database enforces append-only (no UPDATE/DELETE permissions).
 */
class AuditFoundationService {
  private events: AuditEvent[] = [];
  private maxEvents = 1000; // Prevent memory issues in demo

  /**
   * Record an audit event
   * Append-only — events cannot be modified or deleted
   */
  record(event: Omit<AuditEvent, 'id' | 'timestamp'>): AuditEvent {
    const auditEvent: AuditEvent = {
      ...event,
      id: this.generateId(),
      timestamp: new Date().toISOString(),
    };

    this.events.push(auditEvent);

    // Prevent memory issues in demo
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    return auditEvent;
  }

  /**
   * Record a successful action
   */
  recordSuccess(params: {
    userId: string;
    sessionId: string;
    ipAddress: string;
    userAgent: string;
    module: string;
    entityType: string;
    entityId: string;
    action: string;
    permissionKey: string;
    beforeValue?: any;
    afterValue?: any;
    companyId?: string;
    projectId?: string;
    siteId?: string;
    impersonatedBy?: string;
    correlationId?: string;
  }): AuditEvent {
    return this.record({
      ...params,
      result: 'allowed',
    });
  }

  /**
   * Record a denied action (permission violation)
   */
  recordDenied(params: {
    userId: string;
    sessionId: string;
    ipAddress: string;
    userAgent: string;
    module: string;
    entityType: string;
    entityId: string;
    action: string;
    permissionKey: string;
    reason: string;
    companyId?: string;
    projectId?: string;
    siteId?: string;
    impersonatedBy?: string;
    correlationId?: string;
  }): AuditEvent {
    return this.record({
      ...params,
      result: 'denied',
    });
  }

  /**
   * Get all audit events
   */
  getAll(): AuditLog {
    return {
      events: [...this.events],
      totalCount: this.events.length,
    };
  }

  /**
   * Get audit events by user
   */
  getByUser(userId: string): AuditLog {
    const filtered = this.events.filter(e => e.userId === userId);
    return {
      events: filtered,
      totalCount: filtered.length,
    };
  }

  /**
   * Get audit events by entity
   */
  getByEntity(entityType: string, entityId: string): AuditLog {
    const filtered = this.events.filter(
      e => e.entityType === entityType && e.entityId === entityId
    );
    return {
      events: filtered,
      totalCount: filtered.length,
    };
  }

  /**
   * Get audit events by date range
   */
  getByDateRange(from: string, to: string): AuditLog {
    const fromDate = new Date(from);
    const toDate = new Date(to);
    
    const filtered = this.events.filter(e => {
      const eventDate = new Date(e.timestamp);
      return eventDate >= fromDate && eventDate <= toDate;
    });
    
    return {
      events: filtered,
      totalCount: filtered.length,
    };
  }

  /**
   * Get denied actions (security audit)
   */
  getDeniedActions(): AuditLog {
    const filtered = this.events.filter(e => e.result === 'denied');
    return {
      events: filtered,
      totalCount: filtered.length,
    };
  }

  /**
   * Clear audit log (for testing only)
   * In production, this would be disabled by database permissions
   */
  clear(): void {
    this.events = [];
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Singleton instance
export const auditFoundation = new AuditFoundationService();

/**
 * Audit event types
 */
export const AUDIT_ACTIONS = {
  // Document actions
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  SUBMIT: 'submit',
  APPROVE: 'approve',
  REJECT: 'reject',
  CANCEL: 'cancel',
  
  // Permission actions
  LOGIN: 'login',
  LOGOUT: 'logout',
  PERMISSION_CHECK: 'permission_check',
  
  // Data actions
  VIEW: 'view',
  EXPORT: 'export',
  IMPORT: 'import',
  
  // Configuration actions
  CONFIGURE: 'configure',
  MIGRATE: 'migrate',
} as const;

export type AuditAction = typeof AUDIT_ACTIONS[keyof typeof AUDIT_ACTIONS];
