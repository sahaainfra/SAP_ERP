/**
 * Part 09 — Draft Service
 * 
 * Implements RAP-style draft/active split for partially entered documents.
 * Solves: partially entered MB on phone, interrupted bill preparation,
 * concurrent edit visibility, and "discard my changes".
 */

import { DocumentDraft, DraftRef, ActivationResult } from './types';
import { UowContext } from '../uow/UnitOfWork';

// Draft TTL per document type (days)
const DRAFT_TTL_DAYS: Record<string, number> = {
  MB: 7,
  CLIENT_BILL: 14,
  PO: 30,
  INDENT: 30,
  default: 30,
};

export class DraftService {
  private drafts: Map<number, DocumentDraft> = new Map();
  private nextId = 1;

  /**
   * Autosave draft (every 10s / on blur)
   * Cheap, no validation
   */
  async save(
    ctx: UowContext,
    documentType: string,
    activeId: number | null,
    payload: any
  ): Promise<DraftRef> {
    const ttlDays = DRAFT_TTL_DAYS[documentType] ?? DRAFT_TTL_DAYS.default;
    const expiresAt = new Date(ctx.now);
    expiresAt.setDate(expiresAt.getDate() + ttlDays);

    // Check if draft already exists
    const existing = Array.from(this.drafts.values()).find(
      d => d.documentType === documentType &&
           d.activeId === activeId &&
           d.ownerUserId === Number(ctx.actor.userId)
    );

    if (existing) {
      existing.payload = payload;
      existing.updatedAt = ctx.now.toISOString();
      existing.expiresAt = expiresAt.toISOString();
      return { id: existing.id, expiresAt: existing.expiresAt };
    }

    // Create new draft
    const draft: DocumentDraft = {
      id: this.nextId++,
      documentType,
      activeId,
      ownerUserId: Number(ctx.actor.userId),
      projectId: (payload as any)?.projectId,
      payload,
      deviceId: (ctx.actor as any).deviceId,
      createdAt: ctx.now.toISOString(),
      updatedAt: ctx.now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    };

    this.drafts.set(draft.id, draft);

    // Audit
    ctx.audit.record({
      entity: 'document_draft',
      entityId: draft.id,
      action: 'CREATE',
      after: { documentType, activeId },
    });

    return { id: draft.id, expiresAt: draft.expiresAt };
  }

  /**
   * Load a draft
   */
  async load(ctx: UowContext, draftId: number): Promise<DocumentDraft | null> {
    const draft = this.drafts.get(draftId);
    if (!draft) return null;

    // Check expiry
    if (new Date(draft.expiresAt) < ctx.now) {
      this.drafts.delete(draftId);
      return null;
    }

    return draft;
  }

  /**
   * Activate draft (validate, write through real service, delete draft)
   * One transaction
   */
  async activate<THeader>(
    ctx: UowContext,
    draftId: number,
    documentService: any,
    opts: { overrides?: any[] } = {}
  ): Promise<ActivationResult<THeader>> {
    const draft = await this.load(ctx, draftId);
    if (!draft) {
      throw new Error('Draft not found or expired');
    }

    if (draft.ownerUserId !== Number(ctx.actor.userId)) {
      throw new Error('Draft not owned by current user');
    }

    let result: ActivationResult<THeader>;

    if (draft.activeId) {
      // Update existing document
      // Check concurrency
      // In production, would check ETag here
      result = await documentService.update(
        ctx,
        draft.documentType,
        draft.activeId,
        draft.payload,
        opts
      );
    } else {
      // Create new document
      result = await documentService.create(
        ctx,
        draft.documentType,
        draft.payload,
        opts
      );
    }

    // Delete draft
    this.drafts.delete(draftId);

    // Audit
    ctx.audit.record({
      entity: 'document_draft',
      entityId: draftId,
      action: 'UPDATE',
      after: { documentId: result.id },
    });

    return result;
  }

  /**
   * Delete a draft (discard changes)
   */
  async delete(ctx: UowContext, draftId: number): Promise<void> {
    const draft = this.drafts.get(draftId);
    if (!draft) return;

    if (draft.ownerUserId !== Number(ctx.actor.userId)) {
      throw new Error('Draft not owned by current user');
    }

    this.drafts.delete(draftId);

    // Audit
    ctx.audit.record({
      entity: 'document_draft',
      entityId: draftId,
      action: 'DELETE',
      before: { documentType: draft.documentType, activeId: draft.activeId },
    });
  }

  /**
   * Get all drafts for a user
   */
  async getUserDrafts(ctx: UowContext): Promise<DocumentDraft[]> {
    const now = ctx.now;
    return Array.from(this.drafts.values())
      .filter(d => d.ownerUserId === Number(ctx.actor.userId) && new Date(d.expiresAt) > now)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  /**
   * Clean up expired drafts
   */
  async cleanupExpired(ctx: UowContext): Promise<number> {
    const now = ctx.now;
    let count = 0;

    for (const [id, draft] of this.drafts.entries()) {
      if (new Date(draft.expiresAt) < now) {
        this.drafts.delete(id);
        count++;
      }
    }

    return count;
  }

  /**
   * Check if a document has an active draft
   */
  async hasActiveDraft(
    ctx: UowContext,
    documentType: string,
    activeId: number
  ): Promise<{ hasDraft: boolean; ownerUserId?: number }> {
    const draft = Array.from(this.drafts.values()).find(
      d => d.documentType === documentType &&
           d.activeId === activeId &&
           new Date(d.expiresAt) > ctx.now
    );

    if (!draft) {
      return { hasDraft: false };
    }

    return { hasDraft: true, ownerUserId: draft.ownerUserId };
  }
}

export const draftService = new DraftService();
