/**
 * Part 15 — Situation / Exception Engine
 * 
 * Detects conditions and creates actionable situations with:
 * - Event-driven and scheduled detection
 * - Responsible party assignment (via Part 10 approver rules)
 * - Context building for decision-making
 * - Proposed actions with permissions
 * - Auto-resolve when conditions clear
 * - Escalation on timeout
 * - Duplicate suppression
 */

import {
  SituationDefinition,
  Situation,
  SituationStatus,
  SituationSeverity,
} from './types';
import { eventBus } from '../realtime/event-bus';
import { DomainEvent } from '../realtime/types';

export class SituationEngine {
  private definitions: Map<string, SituationDefinition> = new Map();
  private situations: Map<number, Situation> = new Map();
  private nextSituationId = 1;
  private suppressTracker: Map<string, number> = new Map(); // `${code}:${entityId}` -> raisedAt

  constructor() {
    this.setupEventListeners();
  }

  /**
   * Register a situation definition
   */
  registerDefinition(definition: SituationDefinition): void {
    this.definitions.set(definition.code, definition);
  }

  /**
   * Get situation definition by code
   */
  getDefinition(code: string): SituationDefinition | undefined {
    return this.definitions.get(code);
  }

  /**
   * Get all registered definitions
   */
  getAllDefinitions(): SituationDefinition[] {
    return Array.from(this.definitions.values());
  }

  /**
   * Evaluate an event against all situation definitions
   */
  async evaluateEvent(event: DomainEvent): Promise<void> {
    for (const def of this.definitions.values()) {
      if (def.detection.kind !== 'EVENT') continue;
      if (def.detection.eventType !== event.eventType) continue;

      // Check suppression
      if (this.isSuppressed(def, event)) continue;

      // Evaluate condition
      const matches = await this.evaluateCondition(def.detection.condition, event.payload);
      if (!matches) continue;

      // Create situation
      await this.createSituation(def, event);
    }
  }

  /**
   * Create a situation from a definition and event
   */
  private async createSituation(def: SituationDefinition, event: DomainEvent): Promise<void> {
    // Resolve responsible party
    const responsibleUserId = await this.resolveResponsible(def.responsibleRule, event);

    // Build context
    const context = await this.buildContext(def.contextBuilder, event);

    const situation: Situation = {
      id: this.nextSituationId++,
      definitionCode: def.code,
      status: 'OPEN',
      severity: def.severity,
      title: def.label,
      message: this.buildMessage(def, event),
      context,
      responsibleUserId,
      projectId: event.scope.projectId,
      entityType: event.entityType,
      entityId: event.entityId,
      raisedAt: new Date().toISOString(),
      occurrenceCount: 1,
      lastOccurredAt: new Date().toISOString(),
    };

    this.situations.set(situation.id, situation);

    // Track for suppression
    if (def.suppressDuplicateHours) {
      const key = `${def.code}:${event.entityId}`;
      this.suppressTracker.set(key, Date.now());
    }

    // Emit situation event
    eventBus.publish({
      eventId: `situation_${situation.id}`,
      eventType: 'situation.raised',
      occurredAt: new Date().toISOString(),
      actorUserId: event.actorUserId,
      entityType: 'situation',
      entityId: situation.id,
      scope: event.scope,
      payload: {
        situationId: situation.id,
        code: def.code,
        severity: def.severity,
        responsibleUserId,
      },
      version: 1,
    });
  }

  /**
   * Acknowledge a situation
   */
  acknowledge(situationId: number, userId: number): void {
    const situation = this.situations.get(situationId);
    if (!situation) {
      throw new Error(`Situation not found: ${situationId}`);
    }

    situation.status = 'ACKNOWLEDGED';
    situation.acknowledgedAt = new Date().toISOString();
    situation.acknowledgedBy = userId;
  }

  /**
   * Resolve a situation
   */
  resolve(situationId: number, userId: number, note: string): void {
    const situation = this.situations.get(situationId);
    if (!situation) {
      throw new Error(`Situation not found: ${situationId}`);
    }

    situation.status = 'RESOLVED';
    situation.resolvedAt = new Date().toISOString();
    situation.resolvedBy = userId;
    situation.resolutionNote = note;
  }

  /**
   * Escalate a situation
   */
  escalate(situationId: number, escalatedTo: number): void {
    const situation = this.situations.get(situationId);
    if (!situation) {
      throw new Error(`Situation not found: ${situationId}`);
    }

    situation.status = 'ESCALATED';
    situation.escalatedAt = new Date().toISOString();
    situation.escalatedTo = escalatedTo;
  }

  /**
   * Get situations by status
   */
  getSituations(status?: SituationStatus, userId?: number): Situation[] {
    let situations = Array.from(this.situations.values());

    if (status) {
      situations = situations.filter(s => s.status === status);
    }

    if (userId) {
      situations = situations.filter(s => s.responsibleUserId === userId);
    }

    return situations.sort((a, b) => 
      new Date(b.raisedAt).getTime() - new Date(a.raisedAt).getTime()
    );
  }

  /**
   * Get situation by ID
   */
  getSituation(id: number): Situation | undefined {
    return this.situations.get(id);
  }

  /**
   * Check for auto-resolve conditions
   */
  async checkAutoResolve(): Promise<void> {
    for (const situation of this.situations.values()) {
      if (situation.status === 'RESOLVED') continue;

      const def = this.definitions.get(situation.definitionCode);
      if (!def || !def.autoResolveWhen) continue;

      const shouldResolve = await this.evaluateCondition(def.autoResolveWhen, situation.context);
      if (shouldResolve) {
        situation.status = 'RESOLVED';
        situation.resolvedAt = new Date().toISOString();
        situation.resolutionNote = 'Auto-resolved: condition cleared';
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PRIVATE METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  private setupEventListeners(): void {
    eventBus.subscribe({
      handler: (event) => this.evaluateEvent(event),
    });
  }

  private isSuppressed(def: SituationDefinition, event: DomainEvent): boolean {
    if (!def.suppressDuplicateHours) return false;

    const key = `${def.code}:${event.entityId}`;
    const lastRaised = this.suppressTracker.get(key);
    if (!lastRaised) return false;

    const suppressMs = def.suppressDuplicateHours * 60 * 60 * 1000;
    return Date.now() - lastRaised < suppressMs;
  }

  private async evaluateCondition(condition: string, payload: any): Promise<boolean> {
    // In production, would use expression evaluator
    // For demo, simple evaluation
    try {
      const func = new Function('payload', `return ${condition}`);
      return func(payload);
    } catch {
      return false;
    }
  }

  private async resolveResponsible(rule: any, event: DomainEvent): Promise<number> {
    // In production, would use Part 10 approver resolver
    // For demo, return mock user
    return event.actorUserId;
  }

  private async buildContext(builder: string, event: DomainEvent): Promise<Record<string, any>> {
    // In production, would call context builder function
    // For demo, return event payload
    return event.payload;
  }

  private buildMessage(def: SituationDefinition, event: DomainEvent): string {
    return `${def.label} detected for ${event.entityType} #${event.entityId}`;
  }
}

export const situationEngine = new SituationEngine();
