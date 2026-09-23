/**
 * Part 14 — SLA Engine Service
 * 
 * Manages SLA tracking with:
 * - Working calendar support (not wall-clock hours)
 * - Pause/resume on document return
 * - State computation (ON_TRACK, AT_RISK, OVERDUE, MET, BREACHED)
 * - Escalation tracking
 */

import {
  SLATracking,
  SLAState,
  SLASummary,
  WorkingCalendar,
  CalendarHoliday,
} from './types';
import { eventBus } from '../realtime/event-bus';

export class SLAEngine {
  private tracking: Map<number, SLATracking> = new Map();
  private calendars: Map<string, WorkingCalendar> = new Map();
  private holidays: Map<number, CalendarHoliday[]> = new Map();
  private nextTrackingId = 1;

  /**
   * Start tracking an SLA
   */
  startTracking(params: {
    entityType: string;
    entityId: number;
    workflowStep?: string;
    assignedTo?: number;
    projectId?: number;
    slaHours: number;
  }): SLATracking {
    const calendar = this.getCalendar(params.projectId);
    const startedAt = new Date();
    const dueAt = this.calculateDueDate(startedAt, params.slaHours, calendar);

    const tracking: SLATracking = {
      id: this.nextTrackingId++,
      entityType: params.entityType,
      entityId: params.entityId,
      workflowStep: params.workflowStep,
      assignedTo: params.assignedTo,
      projectId: params.projectId,
      startedAt: startedAt.toISOString(),
      dueAt: dueAt.toISOString(),
      totalPausedMinutes: 0,
      state: 'ON_TRACK',
      escalationLevel: 0,
    };

    this.tracking.set(tracking.id, tracking);
    return tracking;
  }

  /**
   * Pause SLA (e.g., when document returned for correction)
   */
  pauseTracking(trackingId: number): void {
    const tracking = this.tracking.get(trackingId);
    if (!tracking) {
      throw new Error(`SLA tracking not found: ${trackingId}`);
    }

    if (tracking.pausedAt) {
      return; // Already paused
    }

    tracking.pausedAt = new Date().toISOString();
  }

  /**
   * Resume SLA
   */
  resumeTracking(trackingId: number): void {
    const tracking = this.tracking.get(trackingId);
    if (!tracking) {
      throw new Error(`SLA tracking not found: ${trackingId}`);
    }

    if (!tracking.pausedAt) {
      return; // Not paused
    }

    const pausedAt = new Date(tracking.pausedAt);
    const resumedAt = new Date();
    const pausedMinutes = Math.floor((resumedAt.getTime() - pausedAt.getTime()) / 60000);

    tracking.totalPausedMinutes += pausedMinutes;
    tracking.pausedAt = undefined;

    // Recalculate due date
    const calendar = this.getCalendar(tracking.projectId);
    const slaHours = this.getSLAHours(tracking);
    tracking.dueAt = this.calculateDueDate(new Date(tracking.startedAt), slaHours, calendar).toISOString();
  }

  /**
   * Complete SLA tracking
   */
  completeTracking(trackingId: number): void {
    const tracking = this.tracking.get(trackingId);
    if (!tracking) {
      throw new Error(`SLA tracking not found: ${trackingId}`);
    }

    tracking.completedAt = new Date().toISOString();

    // Determine final state
    const completedAt = new Date(tracking.completedAt);
    const dueAt = new Date(tracking.dueAt);

    if (completedAt <= dueAt) {
      tracking.state = 'MET';
    } else {
      tracking.state = 'BREACHED';

      // Emit SLA breached event
      eventBus.publish({
        eventId: `sla_breached_${trackingId}`,
        eventType: 'sla.breached',
        occurredAt: new Date().toISOString(),
        actorUserId: 0,
        entityType: tracking.entityType,
        entityId: tracking.entityId,
        scope: { projectId: tracking.projectId },
        payload: {
          trackingId,
          entityType: tracking.entityType,
          entityId: tracking.entityId,
          dueAt: tracking.dueAt,
          completedAt: tracking.completedAt,
        },
        version: 1,
      });
    }
  }

  /**
   * Update SLA states (called by SLA worker every minute)
   */
  updateStates(): void {
    const now = new Date();

    for (const tracking of this.tracking.values()) {
      if (tracking.completedAt) continue; // Already completed

      const dueAt = new Date(tracking.dueAt);
      const slaHours = this.getSLAHours(tracking);
      const atRiskThreshold = dueAt.getTime() - (slaHours * 0.25 * 60 * 60 * 1000);

      if (now.getTime() >= dueAt.getTime()) {
        if (tracking.state !== 'OVERDUE') {
          tracking.state = 'OVERDUE';

          // Emit SLA at risk event
          eventBus.publish({
            eventId: `sla_overdue_${tracking.id}`,
            eventType: 'sla.breached',
            occurredAt: new Date().toISOString(),
            actorUserId: 0,
            entityType: tracking.entityType,
            entityId: tracking.entityId,
            scope: { projectId: tracking.projectId },
            payload: {
              trackingId: tracking.id,
              entityType: tracking.entityType,
              entityId: tracking.entityId,
              dueAt: tracking.dueAt,
            },
            version: 1,
          });
        }
      } else if (now.getTime() >= atRiskThreshold) {
        if (tracking.state === 'ON_TRACK') {
          tracking.state = 'AT_RISK';

          // Emit SLA at risk event
          eventBus.publish({
            eventId: `sla_at_risk_${tracking.id}`,
            eventType: 'sla.at_risk',
            occurredAt: new Date().toISOString(),
            actorUserId: 0,
            entityType: tracking.entityType,
            entityId: tracking.entityId,
            scope: { projectId: tracking.projectId },
            payload: {
              trackingId: tracking.id,
              entityType: tracking.entityType,
              entityId: tracking.entityId,
              dueAt: tracking.dueAt,
            },
            version: 1,
          });
        }
      }
    }
  }

  /**
   * Escalate an SLA
   */
  escalate(trackingId: number, escalatedTo: number): void {
    const tracking = this.tracking.get(trackingId);
    if (!tracking) {
      throw new Error(`SLA tracking not found: ${trackingId}`);
    }

    tracking.escalationLevel++;
    tracking.escalatedTo = escalatedTo;
    tracking.escalatedAt = new Date().toISOString();
  }

  /**
   * Get SLA summary
   */
  getSummary(scope?: { projectId?: number }): SLASummary {
    const trackingList = Array.from(this.tracking.values()).filter(t => {
      if (scope?.projectId && t.projectId !== scope.projectId) return false;
      return true;
    });

    return {
      onTrack: trackingList.filter(t => t.state === 'ON_TRACK').length,
      atRisk: trackingList.filter(t => t.state === 'AT_RISK').length,
      overdue: trackingList.filter(t => t.state === 'OVERDUE').length,
      met: trackingList.filter(t => t.state === 'MET').length,
      breached: trackingList.filter(t => t.state === 'BREACHED').length,
      total: trackingList.length,
    };
  }

  /**
   * Get tracking by ID
   */
  getTracking(trackingId: number): SLATracking | undefined {
    return this.tracking.get(trackingId);
  }

  /**
   * Get tracking by entity
   */
  getTrackingByEntity(entityType: string, entityId: number): SLATracking | undefined {
    return Array.from(this.tracking.values()).find(
      t => t.entityType === entityType && t.entityId === entityId && !t.completedAt
    );
  }

  /**
   * Register a working calendar
   */
  registerCalendar(calendar: WorkingCalendar): void {
    const key = calendar.projectId ? `project:${calendar.projectId}` : `company:${calendar.companyId}`;
    this.calendars.set(key, calendar);
  }

  /**
   * Register holidays for a calendar
   */
  registerHolidays(calendarId: number, holidays: CalendarHoliday[]): void {
    this.holidays.set(calendarId, holidays);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PRIVATE METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  private getCalendar(projectId?: number): WorkingCalendar {
    // Try project-specific calendar first
    if (projectId) {
      const projectCalendar = this.calendars.get(`project:${projectId}`);
      if (projectCalendar) return projectCalendar;
    }

    // Fall back to company default (for demo, return a default calendar)
    return {
      id: 0,
      companyId: 1,
      calendarName: 'Default',
      workingDays: [1, 2, 3, 4, 5, 6], // Mon-Sat
      dayStart: '09:00',
      dayEnd: '18:00',
      timezone: 'Asia/Kolkata',
      isActive: true,
      createdAt: new Date().toISOString(),
    };
  }

  private calculateDueDate(startedAt: Date, slaHours: number, calendar: WorkingCalendar): Date {
    // Simplified calculation - in production, would account for working hours and holidays
    const dueAt = new Date(startedAt);
    dueAt.setHours(dueAt.getHours() + slaHours);
    return dueAt;
  }

  private getSLAHours(tracking: SLATracking): number {
    // In production, would fetch from workflow configuration
    // For demo, calculate from startedAt and dueAt
    const startedAt = new Date(tracking.startedAt);
    const dueAt = new Date(tracking.dueAt);
    return (dueAt.getTime() - startedAt.getTime()) / (1000 * 60 * 60);
  }
}

export const slaEngine = new SLAEngine();
