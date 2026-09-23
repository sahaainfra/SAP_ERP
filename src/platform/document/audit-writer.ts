/**
 * Part 09 — Audit Writer
 * 
 * Implements hash-chained audit logging with:
 * - SHA-256 hash chain for tamper detection
 * - Append-only enforcement
 * - Nightly chain verification
 */

import { AuditLogEntry } from './types';
import { UowContext } from '../uow/UnitOfWork';

const GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

export class AuditWriter {
  private entries: AuditLogEntry[] = [];
  private lastHash: string = GENESIS_HASH;
  private nextId = 1;

  /**
   * Flush audit entries (called by UnitOfWork)
   */
  async flush(ctx: UowContext): Promise<void> {
    const entries = ctx.audit.getEntries();
    if (entries.length === 0) return;

    for (const entry of entries) {
      const auditEntry = await this.createEntry(ctx, entry);
      this.entries.push(auditEntry);
    }

    ctx.audit.clear();
  }

  /**
   * Create audit entry with hash chain
   */
  private async createEntry(ctx: UowContext, entry: any): Promise<AuditLogEntry> {
    const canonical = this.canonicalize({
      entity: entry.entity,
      entityId: entry.entityId,
      action: entry.action,
      fieldName: entry.fieldName,
      oldValue: entry.oldValue,
      newValue: entry.newValue,
      documentType: entry.documentType,
      projectId: entry.projectId,
      companyId: entry.companyId,
      actorUserId: Number(ctx.actor.userId),
      impersonatedBy: ctx.actor.impersonatedBy ? Number(ctx.actor.impersonatedBy) : undefined,
      correlationId: ctx.correlationId,
      ipAddress: (ctx.actor as any).ipAddress,
      userAgent: (ctx.actor as any).userAgent,
      deviceClass: (ctx.actor as any).deviceClass,
      reason: entry.reason,
      occurredAt: ctx.now.toISOString(),
      prevHash: this.lastHash,
    });

    const rowHash = await this.sha256(canonical);
    
    const auditEntry: AuditLogEntry = {
      id: this.nextId++,
      entity: entry.entity,
      entityId: entry.entityId,
      action: entry.action,
      fieldName: entry.fieldName,
      oldValue: entry.oldValue ? JSON.stringify(entry.oldValue) : undefined,
      newValue: entry.newValue ? JSON.stringify(entry.newValue) : undefined,
      documentType: entry.documentType,
      projectId: entry.projectId,
      companyId: entry.companyId,
      actorUserId: Number(ctx.actor.userId),
      impersonatedBy: ctx.actor.impersonatedBy ? Number(ctx.actor.impersonatedBy) : undefined,
      correlationId: ctx.correlationId,
      ipAddress: (ctx.actor as any).ipAddress,
      userAgent: (ctx.actor as any).userAgent,
      deviceClass: (ctx.actor as any).deviceClass,
      reason: entry.reason,
      occurredAt: ctx.now.toISOString(),
      prevHash: this.lastHash,
      rowHash,
    };

    this.lastHash = rowHash;
    return auditEntry;
  }

  /**
   * Canonicalize object for hashing
   */
  private canonicalize(obj: any): string {
    return JSON.stringify(obj, Object.keys(obj).sort());
  }

  /**
   * SHA-256 hash
   */
  private async sha256(message: string): Promise<string> {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Verify audit chain
   */
  async verifyChain(): Promise<{ valid: boolean; firstInvalidId?: number }> {
    let prevHash = GENESIS_HASH;

    for (const entry of this.entries) {
      if (entry.prevHash !== prevHash) {
        return { valid: false, firstInvalidId: entry.id };
      }

      const canonical = this.canonicalize({
        entity: entry.entity,
        entityId: entry.entityId,
        action: entry.action,
        fieldName: entry.fieldName,
        oldValue: entry.oldValue,
        newValue: entry.newValue,
        documentType: entry.documentType,
        projectId: entry.projectId,
        companyId: entry.companyId,
        actorUserId: entry.actorUserId,
        impersonatedBy: entry.impersonatedBy,
        correlationId: entry.correlationId,
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
        deviceClass: entry.deviceClass,
        reason: entry.reason,
        occurredAt: entry.occurredAt,
        prevHash: entry.prevHash,
      });

      const expectedHash = await this.sha256(canonical);
      if (entry.rowHash !== expectedHash) {
        return { valid: false, firstInvalidId: entry.id };
      }

      prevHash = entry.rowHash;
    }

    return { valid: true };
  }

  /**
   * Get audit entries
   */
  getEntries(): AuditLogEntry[] {
    return [...this.entries];
  }

  /**
   * Get entries for an entity
   */
  getEntityEntries(entity: string, entityId: number): AuditLogEntry[] {
    return this.entries.filter(e => e.entity === entity && e.entityId === entityId);
  }

  /**
   * Get entries for an actor
   */
  getActorEntries(actorUserId: number): AuditLogEntry[] {
    return this.entries.filter(e => e.actorUserId === actorUserId);
  }

  /**
   * Get entries by correlation ID
   */
  getCorrelationEntries(correlationId: string): AuditLogEntry[] {
    return this.entries.filter(e => e.correlationId === correlationId);
  }
}

export const auditWriter = new AuditWriter();
