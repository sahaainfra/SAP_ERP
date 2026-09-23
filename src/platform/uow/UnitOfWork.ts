/**
 * Part 04 — Unit of Work
 * 
 * Every state change runs inside exactly one database transaction.
 * Everything that must be consistent with it runs inside the same transaction:
 * - Audit rows (hash-chained, append-only)
 * - Outbox events (published only after commit)
 * 
 * Rules enforced:
 * - No repository method accepts a connection other than ctx.tx
 * - No external HTTP call inside a transaction
 * - No notification/email/push awaited inside a transaction
 * - Long-running work runs as batch job, not request transaction
 */

// Browser-compatible UUID generator
function randomUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface Actor {
  userId: string;
  roles: string[];
  permissions: string[];
  ipAddress: string;
  userAgent: string;
  impersonatedBy?: string;
}

export interface AuditEntry {
  entity: string;
  entityId: string | number;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'STATE_CHANGE';
  before?: any;
  after?: any;
  permissionKey?: string;
  reason?: string;
}

export interface OutboxEvent {
  eventType: string;
  aggregateId: string | number;
  payload: any;
  occurredAt: Date;
}

export interface UowContext {
  tx: any; // QueryRunner or transaction object
  actor: Actor;
  correlationId: string;
  now: Date;
  audit: AuditCollector;
  outbox: OutboxCollector;
}

// ═══════════════════════════════════════════════════════════════════════════
// AUDIT COLLECTOR
// ═══════════════════════════════════════════════════════════════════════════

export class AuditCollector {
  private entries: AuditEntry[] = [];

  record(entry: AuditEntry): void {
    this.entries.push(entry);
  }

  getEntries(): AuditEntry[] {
    return [...this.entries];
  }

  clear(): void {
    this.entries = [];
  }

  /**
   * Flush audit entries to dx_audit_log table
   * Called inside the same transaction
   */
  async flush(ctx: UowContext): Promise<void> {
    if (this.entries.length === 0) return;

    // In production, this would insert into dx_audit_log
    // For now, log to console
    console.log(`[AUDIT] Flushing ${this.entries.length} entries`);
    for (const entry of this.entries) {
      console.log(`[AUDIT] ${entry.action} ${entry.entity}:${entry.entityId}`, {
        before: entry.before,
        after: entry.after,
        actor: ctx.actor.userId,
        correlationId: ctx.correlationId,
      });
    }

    this.clear();
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// OUTBOX COLLECTOR
// ═══════════════════════════════════════════════════════════════════════════

export class OutboxCollector {
  private events: OutboxEvent[] = [];

  publish(event: OutboxEvent): void {
    this.events.push(event);
  }

  getEvents(): OutboxEvent[] {
    return [...this.events];
  }

  clear(): void {
    this.events = [];
  }

  /**
   * Flush outbox events to dx_event_outbox table
   * Called inside the same transaction
   * Events are published only after commit (by relay service)
   */
  async flush(ctx: UowContext): Promise<void> {
    if (this.events.length === 0) return;

    // In production, this would insert into dx_event_outbox
    // For now, log to console
    console.log(`[OUTBOX] Flushing ${this.events.length} events`);
    for (const event of this.events) {
      console.log(`[OUTBOX] ${event.eventType}`, {
        aggregateId: event.aggregateId,
        payload: event.payload,
        correlationId: ctx.correlationId,
      });
    }

    this.clear();
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// UNIT OF WORK
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Unit of Work — single transaction scope
 * 
 * Usage:
 * ```typescript
 * const result = await uow.run(actor, async (ctx) => {
 *   const po = await poRepo.create(ctx, { ... });
 *   ctx.audit.record({ entity: 'po', entityId: po.id, action: 'CREATE', after: po });
 *   ctx.outbox.publish({ eventType: 'procure.po.created', aggregateId: po.id, payload: po });
 *   return po;
 * });
 * ```
 */
export class UnitOfWork {
  /**
   * Execute a function within a transaction
   * 
   * In production, this would:
   * 1. Create a transaction/query runner
   * 2. Start transaction with READ COMMITTED isolation
   * 3. Execute the function with UowContext
   * 4. Flush audit entries (inside tx)
   * 5. Flush outbox events (inside tx)
   * 6. Commit transaction
   * 7. On error, rollback transaction
   */
  async run<T>(actor: Actor, fn: (ctx: UowContext) => Promise<T>): Promise<T> {
    // Simulate transaction (in production, use actual DB transaction)
    const ctx: UowContext = {
      tx: null, // Would be QueryRunner in production
      actor,
      correlationId: randomUUID(),
      now: new Date(),
      audit: new AuditCollector(),
      outbox: new OutboxCollector(),
    };

    try {
      // Execute business logic
      const result = await fn(ctx);

      // Flush audit and outbox inside transaction
      await ctx.audit.flush(ctx);
      await ctx.outbox.flush(ctx);

      // Commit (simulated)
      console.log(`[UOW] Transaction committed: ${ctx.correlationId}`);

      return result;
    } catch (error) {
      // Rollback (simulated)
      console.error(`[UOW] Transaction rolled back: ${ctx.correlationId}`, error);
      throw error;
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SINGLETON INSTANCE
// ═══════════════════════════════════════════════════════════════════════════

export const unitOfWork = new UnitOfWork();
