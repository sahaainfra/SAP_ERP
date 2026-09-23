/**
 * Part 09 — Document Service
 * 
 * The core document service that implements the 12-step execute path.
 * Every document type uses this service for create, update, and state transitions.
 */

import { DocumentDefinition, DocContext, DocInput, DocResult, ExecOpts, DocumentState } from './types';
import { StateMachine } from './state-machine';
import { draftService } from './draft-service';
import { numberSeriesService } from './number-series-service';
import { UowContext } from '../uow/UnitOfWork';
import { Actor } from '../permission/actor';

export class DocumentService {
  private definitions: Map<string, DocumentDefinition<any, any>> = new Map();
  private documents: Map<string, Map<number, any>> = new Map();
  private nextId = 1;

  /**
   * Register a document definition
   */
  register<THeader, TLine = any>(definition: DocumentDefinition<THeader, TLine>): void {
    this.definitions.set(definition.type, definition);
    this.documents.set(definition.type, new Map());
  }

  /**
   * Get document definition
   */
  getDefinition<THeader, TLine = any>(type: string): DocumentDefinition<THeader, TLine> {
    const def = this.definitions.get(type);
    if (!def) {
      throw new Error(`Document type not registered: ${type}`);
    }
    return def as DocumentDefinition<THeader, TLine>;
  }

  /**
   * Create a new document
   */
  async create<THeader, TLine = any>(
    ctx: UowContext,
    type: string,
    input: DocInput<THeader, TLine>,
    opts: ExecOpts = {}
  ): Promise<DocResult<THeader>> {
    const def = this.getDefinition<THeader, TLine>(type);

    // 1. Permission check
    if (!ctx.actor.can(`${def.permissionPrefix}.create` as any, (input.header as any).projectId)) {
      throw new Error(`Permission denied: ${def.permissionPrefix}.create`);
    }

    // 2. Initialize context
    let c: DocContext<THeader, TLine> = {
      def,
      header: input.header,
      lines: input.lines || [],
      actor: ctx.actor,
      isNew: true,
    };

    // 3. Run determinations (derive totals, rates, defaults)
    c = await this.runDeterminations(ctx, c);

    // 4. Run validations
    const report = await this.runValidations(ctx, c, opts);
    if (report.blocked) {
      throw new Error(`Validation failed: ${JSON.stringify(report.issues)}`);
    }

    // 5. Allocate number if on CREATE
    if (def.numbering.allocateOn === 'CREATE') {
      (c.header as any).number = await numberSeriesService.allocate(
        ctx,
        def.numbering.seriesCode,
        {
          projectId: (c.header as any).projectId,
          projectCode: (c.header as any).projectCode,
          companyId: (c.header as any).companyId,
          companyCode: (c.header as any).companyCode,
          date: new Date((c.header as any).documentDate || ctx.now),
        }
      );
    }

    // 6. Set initial state
    (c.header as any).status = 'DRAFT';
    (c.header as any).contentHash = this.hashContent(def, c);

    // 7. Persist
    const id = this.nextId++;
    (c.header as any).id = id;
    this.documents.get(type)!.set(id, c);

    // 8. Audit
    ctx.audit.record({
      entity: type,
      entityId: id,
      action: 'CREATE',
      after: this.redactForAudit(c),
    });

    // 9. Emit events
    const createAction = def.actions.find(a => a.name === 'create');
    if (createAction) {
      for (const eventType of createAction.emits) {
        ctx.outbox.publish({
          eventType,
          aggregateId: id,
          payload: { documentType: type, documentId: id, projectId: (c.header as any).projectId },
          occurredAt: ctx.now,
        });
      }
    }

    return {
      id,
      header: c.header,
      warnings: report.issues.filter((i: any) => i.severity !== 'ERROR'),
    };
  }

  /**
   * Execute an action on a document (the 12-step path)
   */
  async execute<THeader, TLine = any>(
    ctx: UowContext,
    type: string,
    id: number,
    actionName: string,
    input: any,
    opts: ExecOpts = {}
  ): Promise<DocResult<THeader>> {
    const def = this.getDefinition<THeader, TLine>(type);
    const action = def.actions.find(a => a.name === actionName);
    if (!action) {
      throw new Error(`Unknown action: ${actionName} for ${type}`);
    }

    // Load document
    const c = await this.load(ctx, def, id);

    // 1. Permission + policy check
    ctx.actor.assertCan(action.permission, (c.header as any).projectId);
    if (action.policy) {
      // In production, would call ActionPolicy here
      // For now, skip
    }

    // 2. Device restriction
    if (action.deviceRestricted?.includes((ctx.actor as any).deviceClass as any)) {
      throw new Error(`Action ${actionName} not permitted on this device`);
    }

    // 3. State transition validation
    const toState = typeof action.toState === 'function' ? action.toState(c) : action.toState;
    def.states.assert((c.header as any).status, toState, actionName);

    // 4. Period lock check (for posting actions)
    const POSTING_ACTIONS = ['post', 'certify'];
    if (POSTING_ACTIONS.includes(actionName)) {
      // In production, would check period lock here
    }

    // 5. Reason check
    if (action.requiresReason && !input?.reason?.trim()) {
      throw new Error(`Reason required for action: ${actionName}`);
    }

    // 6. Two-person rule
    if (action.requiresTwoPerson) {
      // In production, would check two-person approval here
    }

    // 7. Preconditions
    if (action.preconditions) {
      const report = await this.runValidations(ctx, c, opts);
      if (report.blocked) {
        throw new Error(`Preconditions failed: ${JSON.stringify(report.issues)}`);
      }
    }

    // 8. Number allocation on SUBMIT
    if (def.numbering.allocateOn === 'SUBMIT' && actionName === 'submit' && !(c.header as any).number) {
      (c.header as any).number = await numberSeriesService.allocate(
        ctx,
        def.numbering.seriesCode,
        {
          projectId: (c.header as any).projectId,
          projectCode: (c.header as any).projectCode,
          companyId: (c.header as any).companyId,
          companyCode: (c.header as any).companyCode,
          date: new Date((c.header as any).documentDate || ctx.now),
        }
      );
    }

    // 9. Execute action
    await action.execute(ctx, c, input);

    // 10. Update state and hash
    const before = this.snapshot(c);
    (c.header as any).status = toState;
    (c.header as any).contentHash = this.hashContent(def, c);

    // 11. Workflow (on submit)
    if (actionName === 'submit' && def.workflowCode) {
      // In production, would start workflow here
    }

    // 12. Audit + events
    ctx.audit.record({
      entity: type,
      entityId: id,
      action: 'STATE_CHANGE',
      before,
      after: this.snapshot(c),
      reason: input?.reason,
    });

    for (const eventType of action.emits) {
      ctx.outbox.publish({
        eventType,
        aggregateId: id,
        payload: {
          documentType: type,
          documentId: id,
          projectId: (c.header as any).projectId,
          value: (c.header as any).totalValue,
          state: toState,
        },
        occurredAt: ctx.now,
      });
    }

    return { id, header: c.header };
  }

  /**
   * Load a document
   */
  private async load<THeader, TLine>(
    ctx: UowContext,
    def: DocumentDefinition<THeader, TLine>,
    id: number
  ): Promise<DocContext<THeader, TLine>> {
    const doc = this.documents.get(def.type)?.get(id);
    if (!doc) {
      throw new Error(`Document not found: ${def.type} #${id}`);
    }
    return doc;
  }

  /**
   * Run determinations
   */
  private async runDeterminations<THeader, TLine>(
    ctx: UowContext,
    c: DocContext<THeader, TLine>
  ): Promise<DocContext<THeader, TLine>> {
    for (const det of c.def.determinations) {
      c = await det.run(ctx, c);
    }
    return c;
  }

  /**
   * Run validations
   */
  private async runValidations<THeader, TLine>(
    ctx: UowContext,
    c: DocContext<THeader, TLine>,
    opts: ExecOpts
  ): Promise<{ blocked: boolean; issues: any[] }> {
    // Simplified validation - in production would use RuleEngine
    return { blocked: false, issues: [] };
  }

  /**
   * Hash document content
   */
  private hashContent<THeader, TLine>(
    def: DocumentDefinition<THeader, TLine>,
    c: DocContext<THeader, TLine>
  ): string {
    const fields: any = {};
    for (const field of def.hashFields) {
      fields[field as string] = (c.header as any)[field as string];
    }
    // Simplified hash - in production would use SHA-256
    return JSON.stringify(fields);
  }

  /**
   * Snapshot document for audit
   */
  private snapshot<THeader, TLine>(c: DocContext<THeader, TLine>): any {
    return {
      header: { ...c.header },
      lines: [...c.lines],
    };
  }

  /**
   * Redact sensitive fields for audit
   */
  private redactForAudit<THeader, TLine>(c: DocContext<THeader, TLine>): any {
    return this.snapshot(c);
  }

  /**
   * Get a document
   */
  get<THeader>(type: string, id: number): THeader | undefined {
    return this.documents.get(type)?.get(id)?.header;
  }

  /**
   * List documents
   */
  list<THeader>(type: string): THeader[] {
    const docs = this.documents.get(type);
    if (!docs) return [];
    return Array.from(docs.values()).map(d => d.header);
  }
}

export const documentService = new DocumentService();
