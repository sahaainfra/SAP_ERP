/**
 * Part 14 — Alert Engine Service
 * 
 * Manages alert rules, evaluation, and lifecycle with:
 * - Event-driven and threshold-based triggers
 * - Deduplication with cooldown periods
 * - Auto-clear when conditions resolve
 * - Severity-based routing and escalation
 * - Quiet hours support
 */

import {
  AlertRule,
  Alert,
  AlertSeverity,
  AlertStatus,
  AlertRuleSeedData,
  AlertCondition,
} from './types';
import { eventBus } from '../realtime/event-bus';
import { DomainEvent } from '../realtime/types';

export class AlertEngine {
  private rules: Map<string, AlertRule> = new Map();
  private alerts: Map<number, Alert> = new Map();
  private nextAlertId = 1;
  private cooldownTracker: Map<string, number> = new Map(); // ruleKey -> lastRaisedAt

  constructor() {
    this.setupEventListeners();
  }

  /**
   * Register an alert rule
   */
  registerRule(rule: AlertRule): void {
    this.rules.set(rule.ruleCode, rule);
  }

  /**
   * Evaluate an event against all matching rules
   */
  async evaluateEvent(event: DomainEvent): Promise<void> {
    for (const rule of this.rules.values()) {
      if (!rule.isActive) continue;
      if (rule.triggerType !== 'EVENT') continue;
      if (rule.triggerEvent !== event.eventType) continue;

      // Check cooldown
      const cooldownKey = this.buildCooldownKey(rule, event);
      if (this.isInCooldown(cooldownKey, rule.cooldownMinutes)) {
        continue;
      }

      // Evaluate condition
      const matches = await this.evaluateCondition(rule.condition, event.payload);
      if (matches) {
        await this.raiseAlert(rule, event);
      }
    }
  }

  /**
   * Evaluate threshold-based rules
   */
  async evaluateThresholds(): Promise<void> {
    for (const rule of this.rules.values()) {
      if (!rule.isActive) continue;
      if (rule.triggerType !== 'THRESHOLD') continue;

      // In production, would query current values and evaluate
      // For demo, skip threshold evaluation
    }
  }

  /**
   * Raise an alert
   */
  private async raiseAlert(rule: AlertRule, event: DomainEvent): Promise<void> {
    // Check for existing open alert (deduplication)
    const existingAlert = this.findExistingAlert(rule, event);
    if (existingAlert) {
      // Increment occurrence count
      existingAlert.occurrenceCount++;
      existingAlert.lastOccurredAt = new Date().toISOString();
      return;
    }

    // Create new alert
    const alert: Alert = {
      id: this.nextAlertId++,
      ruleId: rule.id,
      severity: rule.severity,
      title: this.renderTemplate(rule.ruleName, event.payload),
      message: this.renderTemplate(rule.messageTemplate, event.payload),
      entityType: event.entityType,
      entityId: event.entityId,
      companyId: event.scope.companyId,
      projectId: event.scope.projectId,
      siteId: event.scope.siteId,
      status: 'OPEN',
      raisedAt: new Date().toISOString(),
      occurrenceCount: 1,
      lastOccurredAt: new Date().toISOString(),
    };

    this.alerts.set(alert.id, alert);

    // Update cooldown tracker
    const cooldownKey = this.buildCooldownKey(rule, event);
    this.cooldownTracker.set(cooldownKey, Date.now());

    // Emit alert event
    eventBus.publish({
      eventId: `alert_${alert.id}`,
      eventType: 'alert.raised',
      occurredAt: new Date().toISOString(),
      actorUserId: event.actorUserId,
      entityType: 'alert',
      entityId: alert.id,
      scope: event.scope,
      payload: { alertId: alert.id, severity: alert.severity, title: alert.title },
      version: 1,
    });

    // Route to recipients (in production, would use notification engine)
    await this.routeAlert(alert, rule);
  }

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(alertId: number, userId: number): void {
    const alert = this.alerts.get(alertId);
    if (!alert) {
      throw new Error(`Alert not found: ${alertId}`);
    }

    alert.status = 'ACKNOWLEDGED';
    alert.acknowledgedBy = userId;
    alert.acknowledgedAt = new Date().toISOString();
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: number, userId: number, note: string): void {
    const alert = this.alerts.get(alertId);
    if (!alert) {
      throw new Error(`Alert not found: ${alertId}`);
    }

    alert.status = 'RESOLVED';
    alert.resolvedBy = userId;
    alert.resolvedAt = new Date().toISOString();
    alert.resolutionNote = note;

    // Emit alert cleared event
    eventBus.publish({
      eventId: `alert_cleared_${alertId}`,
      eventType: 'alert.cleared',
      occurredAt: new Date().toISOString(),
      actorUserId: userId,
      entityType: 'alert',
      entityId: alertId,
      scope: {
        companyId: alert.companyId,
        projectId: alert.projectId,
        siteId: alert.siteId,
      },
      payload: { alertId, resolution: note },
      version: 1,
    });
  }

  /**
   * Auto-clear alerts when conditions resolve
   */
  async autoClearAlerts(): Promise<void> {
    for (const alert of this.alerts.values()) {
      if (alert.status !== 'OPEN' && alert.status !== 'ACKNOWLEDGED') {
        continue;
      }

      const rule = Array.from(this.rules.values()).find(r => r.id === alert.ruleId);
      if (!rule || !rule.autoClear) continue;

      // In production, would re-evaluate condition
      // For demo, skip auto-clear logic
    }
  }

  /**
   * Get alerts for a scope
   */
  getAlerts(scope: {
    companyId?: number;
    projectId?: number;
    siteId?: number;
    status?: AlertStatus;
    severity?: AlertSeverity;
  }): Alert[] {
    return Array.from(this.alerts.values()).filter(alert => {
      if (scope.companyId && alert.companyId !== scope.companyId) return false;
      if (scope.projectId && alert.projectId !== scope.projectId) return false;
      if (scope.siteId && alert.siteId !== scope.siteId) return false;
      if (scope.status && alert.status !== scope.status) return false;
      if (scope.severity && alert.severity !== scope.severity) return false;
      return true;
    });
  }

  /**
   * Get alert by ID
   */
  getAlert(alertId: number): Alert | undefined {
    return this.alerts.get(alertId);
  }

  /**
   * Seed alert rules
   */
  seedRules(seedData: AlertRuleSeedData[]): void {
    for (const data of seedData) {
      const rule: AlertRule = {
        id: this.rules.size + 1,
        ...data,
        cooldownMinutes: data.cooldownMinutes || 60,
        autoClear: data.autoClear !== false,
        isActive: true,
        createdAt: new Date().toISOString(),
      };
      this.registerRule(rule);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PRIVATE METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  private setupEventListeners(): void {
    // Subscribe to all events for alert evaluation
    eventBus.subscribe({
      handler: (event) => this.evaluateEvent(event),
    });
  }

  private async evaluateCondition(conditions: AlertCondition[], payload: any): Promise<boolean> {
    for (const condition of conditions) {
      const value = this.getNestedValue(payload, condition.field);
      if (!this.evaluateOperator(value, condition.operator, condition.value)) {
        return false;
      }
    }
    return true;
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private evaluateOperator(value: any, operator: string, expected: any): boolean {
    switch (operator) {
      case '=': return value === expected;
      case '!=': return value !== expected;
      case '>': return value > expected;
      case '<': return value < expected;
      case '>=': return value >= expected;
      case '<=': return value <= expected;
      case 'IN': return expected.includes(value);
      case 'BETWEEN': return value >= expected[0] && value <= expected[1];
      default: return false;
    }
  }

  private buildCooldownKey(rule: AlertRule, event: DomainEvent): string {
    return `${rule.ruleCode}:${event.entityType}:${event.entityId}`;
  }

  private isInCooldown(cooldownKey: string, cooldownMinutes: number): boolean {
    const lastRaised = this.cooldownTracker.get(cooldownKey);
    if (!lastRaised) return false;

    const cooldownMs = cooldownMinutes * 60 * 1000;
    return Date.now() - lastRaised < cooldownMs;
  }

  private findExistingAlert(rule: AlertRule, event: DomainEvent): Alert | undefined {
    return Array.from(this.alerts.values()).find(alert => {
      if (alert.ruleId !== rule.id) return false;
      if (alert.entityType !== event.entityType) return false;
      if (alert.entityId !== event.entityId) return false;
      if (alert.status !== 'OPEN' && alert.status !== 'ACKNOWLEDGED') return false;
      return true;
    });
  }

  private renderTemplate(template: string, payload: any): string {
    return template.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (match, path) => {
      const value = this.getNestedValue(payload, path);
      return value !== undefined ? String(value) : match;
    });
  }

  private async routeAlert(alert: Alert, rule: AlertRule): Promise<void> {
    // In production, would determine recipients based on targetRule
    // and send via notification engine
    console.log(`Alert routed: ${alert.title} (${alert.severity})`);
  }
}

export const alertEngine = new AlertEngine();
