/**
 * Part 15 — Real-Time Fan-Out Service
 * 
 * Handles per-subscriber event distribution with:
 * - Permission-filtered payload construction (never broadcast to rooms)
 * - Throttling and coalescing (device-specific)
 * - Backpressure handling
 * - Gap recovery support
 */

import {
  RealtimeEnvelope,
  RealtimeSession,
  RealtimeAffects,
  EventSpec,
  DeviceClass,
  COALESCE_MS,
  MAX_BATCH,
  URGENT_EVENTS,
} from './types';
import { DomainEvent } from '../realtime/types';

interface BufferedEvent {
  envelope: RealtimeEnvelope;
  timestamp: number;
}

interface UserBuffer {
  events: BufferedEvent[];
  affects: RealtimeAffects;
  timer?: ReturnType<typeof setTimeout>;
  deviceClass: DeviceClass;
}

export class RealtimeFanout {
  private eventSpecs: Map<string, EventSpec> = new Map();
  private sessions: Map<string, RealtimeSession> = new Map(); // socketId -> session
  private userSessions: Map<number, Set<string>> = new Map(); // userId -> socketIds
  private buffers: Map<number, UserBuffer> = new Map(); // userId -> buffer
  private deliveryTracking: Map<string, number> = new Map(); // `${userId}:${deviceClass}` -> lastEventId

  /**
   * Register an event specification
   */
  registerEventSpec(eventType: string, spec: EventSpec): void {
    this.eventSpecs.set(eventType, spec);
  }

  /**
   * Register a connected session
   */
  registerSession(session: RealtimeSession): void {
    this.sessions.set(session.socketId, session);
    
    if (!this.userSessions.has(session.userId)) {
      this.userSessions.set(session.userId, new Set());
    }
    this.userSessions.get(session.userId)!.add(session.socketId);
  }

  /**
   * Unregister a disconnected session
   */
  unregisterSession(socketId: string): void {
    const session = this.sessions.get(socketId);
    if (!session) return;

    this.sessions.delete(socketId);
    const userSockets = this.userSessions.get(session.userId);
    if (userSockets) {
      userSockets.delete(socketId);
      if (userSockets.size === 0) {
        this.userSessions.delete(session.userId);
      }
    }
  }

  /**
   * Dispatch an event to all eligible subscribers
   * This is the core fan-out logic - per-subscriber payload construction
   */
  async dispatch(event: DomainEvent): Promise<void> {
    const spec = this.eventSpecs.get(event.eventType);
    if (!spec || !spec.realtime) return;

    // 1. Get candidate recipients
    const candidateUserIds = await spec.recipients(event);
    if (candidateUserIds.length === 0) return;

    // 2. Filter to connected sessions
    const connectedSessions = this.getConnectedSessions(candidateUserIds);
    if (connectedSessions.length === 0) return;

    // 3. Per-subscriber: resolve permissions, build payload, send
    const uniqueUsers = this.dedupeByUser(connectedSessions);
    
    await Promise.all(
      uniqueUsers.map(async (session) => {
        try {
          await this.dispatchToUser(session, event, spec);
        } catch (error) {
          console.error(`Failed to dispatch to user ${session.userId}:`, error);
        }
      })
    );

    // 4. Track delivery for gap recovery
    for (const session of uniqueUsers) {
      this.updateDeliveryTracking(session.userId, session.deviceClass, event.sequence || 0);
    }
  }

  /**
   * Dispatch to a specific user with permission filtering
   */
  private async dispatchToUser(
    session: RealtimeSession,
    event: DomainEvent,
    spec: EventSpec
  ): Promise<void> {
    // Resolve permissions (cached, 300s TTL in production)
    const perms = await this.resolvePermissions(session.userId);

    // Check visibility
    if (!spec.isVisibleTo(event, perms)) {
      return; // User not entitled to see this event
    }

    // Build payload with field masking
    const payload = spec.buildPayload(event, perms);
    const affects = spec.affects(event);

    const envelope: RealtimeEnvelope = {
      id: event.sequence || 0,
      type: event.eventType,
      at: event.occurredAt,
      projectId: event.scope.projectId,
      payload,
      affects,
    };

    // Buffer or send immediately
    await this.bufferOrSend(session.userId, envelope, session.deviceClass);
  }

  /**
   * Buffer event or send immediately based on urgency
   */
  private async bufferOrSend(
    userId: number,
    envelope: RealtimeEnvelope,
    deviceClass: DeviceClass
  ): Promise<void> {
    // Urgent events bypass buffering
    if (URGENT_EVENTS.has(envelope.type)) {
      await this.flushNow(userId, [envelope]);
      return;
    }

    // Get or create buffer
    let buffer = this.buffers.get(userId);
    if (!buffer) {
      buffer = {
        events: [],
        affects: {},
        deviceClass,
      };
      this.buffers.set(userId, buffer);
    }

    // Add to buffer
    buffer.events.push({ envelope, timestamp: Date.now() });
    buffer.affects = this.mergeAffects(buffer.affects, envelope.affects);

    // Set coalesce timer if not already set
    if (!buffer.timer) {
      const coalesceMs = COALESCE_MS[deviceClass];
      buffer.timer = setTimeout(async () => {
        await this.flush(userId);
      }, coalesceMs);
    }

    // Flush if buffer is full
    if (buffer.events.length >= MAX_BATCH) {
      clearTimeout(buffer.timer);
      buffer.timer = undefined;
      await this.flush(userId);
    }
  }

  /**
   * Flush buffered events to user
   */
  private async flush(userId: number): Promise<void> {
    const buffer = this.buffers.get(userId);
    if (!buffer || buffer.events.length === 0) return;

    const envelopes = buffer.events.map(e => e.envelope);
    buffer.events = [];
    buffer.affects = {};
    buffer.timer = undefined;

    await this.flushNow(userId, envelopes);
  }

  /**
   * Send envelopes immediately (no buffering)
   */
  private async flushNow(userId: number, envelopes: RealtimeEnvelope[]): Promise<void> {
    const userSockets = this.userSessions.get(userId);
    if (!userSockets || userSockets.size === 0) return;

    // In production, would send via WebSocket
    // For demo, just log
    for (const envelope of envelopes) {
      console.log(`[Realtime] → User ${userId}: ${envelope.type}`, envelope.payload);
    }
  }

  /**
   * Merge affects from multiple envelopes
   */
  private mergeAffects(existing: RealtimeAffects, incoming: RealtimeAffects): RealtimeAffects {
    return {
      kpis: this.mergeArrays(existing.kpis, incoming.kpis),
      lists: this.mergeArrays(existing.lists, incoming.lists),
      badges: this.mergeArrays(existing.badges, incoming.badges),
      documents: this.mergeDocumentArrays(existing.documents, incoming.documents),
    };
  }

  private mergeArrays<T>(a?: T[], b?: T[]): T[] | undefined {
    if (!a && !b) return undefined;
    const merged = [...(a || []), ...(b || [])];
    return [...new Set(merged)];
  }

  private mergeDocumentArrays(
    a?: Array<{ type: string; id: number }>,
    b?: Array<{ type: string; id: number }>
  ): Array<{ type: string; id: number }> | undefined {
    if (!a && !b) return undefined;
    const merged = [...(a || []), ...(b || [])];
    const unique = new Map<string, { type: string; id: number }>();
    for (const doc of merged) {
      unique.set(`${doc.type}:${doc.id}`, doc);
    }
    return Array.from(unique.values());
  }

  /**
   * Get connected sessions for a list of user IDs
   */
  private getConnectedSessions(userIds: number[]): RealtimeSession[] {
    const sessions: RealtimeSession[] = [];
    for (const userId of userIds) {
      const socketIds = this.userSessions.get(userId);
      if (socketIds) {
        for (const socketId of socketIds) {
          const session = this.sessions.get(socketId);
          if (session) {
            sessions.push(session);
          }
        }
      }
    }
    return sessions;
  }

  /**
   * Deduplicate sessions by user ID
   */
  private dedupeByUser(sessions: RealtimeSession[]): RealtimeSession[] {
    const seen = new Set<number>();
    return sessions.filter(s => {
      if (seen.has(s.userId)) return false;
      seen.add(s.userId);
      return true;
    });
  }

  /**
   * Resolve permissions for a user (cached in production)
   */
  private async resolvePermissions(userId: number): Promise<any> {
    // In production, would call permission resolver with caching
    // For demo, return mock permissions
    return { userId, permissions: new Set(['*']) };
  }

  /**
   * Update delivery tracking for gap recovery
   */
  private updateDeliveryTracking(userId: number, deviceClass: DeviceClass, eventId: number): void {
    const key = `${userId}:${deviceClass}`;
    const current = this.deliveryTracking.get(key) || 0;
    if (eventId > current) {
      this.deliveryTracking.set(key, eventId);
    }
  }

  /**
   * Get last delivered event ID for gap recovery
   */
  getLastDeliveredEventId(userId: number, deviceClass: DeviceClass): number {
    const key = `${userId}:${deviceClass}`;
    return this.deliveryTracking.get(key) || 0;
  }

  /**
   * Mark KPIs as stale (called by ReadModelUpdater)
   */
  async markKpisStale(kpiCodes: string[], projectId?: number): Promise<void> {
    // In production, would invalidate KPI cache
    console.log(`[Realtime] Marking KPIs stale:`, kpiCodes, projectId);
  }
}

export const realtimeFanout = new RealtimeFanout();
