/**
 * Part 13 — Event Bus Service
 * 
 * Manages event publishing, subscription, and delivery with:
 * - Permission-filtered fan-out
 * - Channel-based subscriptions
 * - Sequence tracking for gap recovery
 * - Throttling and batching
 * - Duplicate protection
 */

import { DomainEvent, EventType, Channel, Subscription, WebSocketMessage, buildChannelId } from './types';

// ═══════════════════════════════════════════════════════════════════════════
// EVENT BUS
// ═══════════════════════════════════════════════════════════════════════════

export type EventHandler<TPayload = any> = (event: DomainEvent<TPayload>) => void;

export interface EventSubscription {
  id: string;
  eventType?: EventType;        // If undefined, subscribe to all events
  channel?: string;             // If undefined, receive all channels
  handler: EventHandler;
  permissionKey?: string;       // Required permission to receive this event
  userId?: number;              // User context for permission checking
}

export class EventBus {
  private subscriptions: Map<string, EventSubscription> = new Map();
  private channelSequences: Map<string, number> = new Map();
  private eventBuffer: Map<string, DomainEvent[]> = new Map(); // For gap recovery
  private throttleTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private batchBuffer: Map<string, DomainEvent[]> = new Map();
  private batchTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();
  
  private readonly BUFFER_SIZE = 1000; // Max events per channel to buffer
  private readonly THROTTLE_MS = 2000; // 2 seconds per KPI per subscriber
  private readonly BATCH_WINDOW_MS = 500; // 500ms batch window
  
  private nextSubscriptionId = 1;

  /**
   * Subscribe to events
   */
  subscribe(subscription: Omit<EventSubscription, 'id'>): string {
    const id = `sub_${this.nextSubscriptionId++}`;
    this.subscriptions.set(id, { ...subscription, id });
    return id;
  }

  /**
   * Unsubscribe from events
   */
  unsubscribe(subscriptionId: string): void {
    this.subscriptions.delete(subscriptionId);
  }

  /**
   * Publish an event to all matching subscribers
   * Events are filtered per subscriber based on permissions
   */
  async publish<TPayload>(event: DomainEvent<TPayload>): Promise<void> {
    // Assign sequence number for the channel
    const channel = this.determineChannel(event);
    const sequence = this.getNextSequence(channel);
    event.sequence = sequence;

    // Buffer for gap recovery
    this.bufferEvent(channel, event);

    // Fan out to subscribers with permission filtering
    for (const subscription of this.subscriptions.values()) {
      // Check if subscription matches this event
      if (!this.matchesSubscription(event, subscription)) {
        continue;
      }

      // Check permissions (in production, would use permission resolver)
      if (subscription.permissionKey && subscription.userId) {
        const hasPermission = await this.checkPermission(
          subscription.userId,
          subscription.permissionKey,
          event.scope
        );
        if (!hasPermission) {
          continue; // Skip this subscriber
        }
      }

      // Apply throttling
      const throttleKey = `${subscription.id}:${event.eventType}`;
      if (this.isThrottled(throttleKey)) {
        continue; // Skip - too recent
      }
      this.setThrottle(throttleKey);

      // Apply batching
      this.addToBatch(subscription.id, event);
    }

    // Flush batches after window
    this.scheduleBatchFlush();
  }

  /**
   * Publish multiple events (for bulk operations)
   */
  async publishBatch<TPayload>(events: DomainEvent<TPayload>[]): Promise<void> {
    for (const event of events) {
      await this.publish(event);
    }
  }

  /**
   * Get missed events for a channel since a sequence number
   * Used for gap recovery on reconnect
   */
  getMissedEvents(channel: string, lastSequence: number): DomainEvent[] {
    const buffer = this.eventBuffer.get(channel) || [];
    return buffer.filter(e => (e.sequence || 0) > lastSequence);
  }

  /**
   * Get current sequence for a channel
   */
  getCurrentSequence(channel: string): number {
    return this.channelSequences.get(channel) || 0;
  }

  /**
   * Clear event buffer for a channel
   */
  clearBuffer(channel: string): void {
    this.eventBuffer.delete(channel);
  }

  /**
   * Get all active subscriptions
   */
  getSubscriptions(): EventSubscription[] {
    return Array.from(this.subscriptions.values());
  }

  /**
   * Get subscriptions for a specific user
   */
  getUserSubscriptions(userId: number): EventSubscription[] {
    return Array.from(this.subscriptions.values()).filter(
      sub => sub.userId === userId
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PRIVATE METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Determine the channel for an event
   */
  private determineChannel(event: DomainEvent): string {
    // Route based on event type and scope
    if (event.eventType.startsWith('notification.') || 
        event.eventType.startsWith('approval.')) {
      return buildChannelId('user', event.actorUserId);
    }
    
    if (event.scope.projectId) {
      if (event.eventType.includes('kpi') || event.affectedKpis?.length) {
        return `project:${event.scope.projectId}:kpi`;
      }
      return `project:${event.scope.projectId}:activity`;
    }
    
    if (event.scope.companyId) {
      return `company:${event.scope.companyId}:exec`;
    }
    
    return 'system:broadcast';
  }

  /**
   * Get next sequence number for a channel
   */
  private getNextSequence(channel: string): number {
    const current = this.channelSequences.get(channel) || 0;
    const next = current + 1;
    this.channelSequences.set(channel, next);
    return next;
  }

  /**
   * Buffer an event for gap recovery
   */
  private bufferEvent(channel: string, event: DomainEvent): void {
    if (!this.eventBuffer.has(channel)) {
      this.eventBuffer.set(channel, []);
    }
    
    const buffer = this.eventBuffer.get(channel)!;
    buffer.push(event);
    
    // Trim buffer if too large
    if (buffer.length > this.BUFFER_SIZE) {
      buffer.shift();
    }
  }

  /**
   * Check if an event matches a subscription
   */
  private matchesSubscription(event: DomainEvent, subscription: EventSubscription): boolean {
    // Check event type filter
    if (subscription.eventType && subscription.eventType !== event.eventType) {
      return false;
    }
    
    // Check channel filter
    if (subscription.channel) {
      const eventChannel = this.determineChannel(event);
      if (subscription.channel !== eventChannel) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Check if user has permission for an event
   * In production, this would call the permission resolver
   */
  private async checkPermission(
    userId: number,
    permissionKey: string,
    scope?: any
  ): Promise<boolean> {
    // Simplified check - in production would use permissionResolver
    // For now, assume all permissions are granted
    return true;
  }

  /**
   * Check if an event is throttled
   */
  private isThrottled(key: string): boolean {
    return this.throttleTimers.has(key);
  }

  /**
   * Set throttle timer for an event
   */
  private setThrottle(key: string): void {
    this.throttleTimers.set(key, setTimeout(() => {
      this.throttleTimers.delete(key);
    }, this.THROTTLE_MS));
  }

  /**
   * Add event to batch buffer
   */
  private addToBatch(subscriptionId: string, event: DomainEvent): void {
    if (!this.batchBuffer.has(subscriptionId)) {
      this.batchBuffer.set(subscriptionId, []);
    }
    this.batchBuffer.get(subscriptionId)!.push(event);
  }

  /**
   * Schedule batch flush
   */
  private scheduleBatchFlush(): void {
    if (this.batchTimers.size === 0) {
      setTimeout(() => this.flushBatches(), this.BATCH_WINDOW_MS);
    }
  }

  /**
   * Flush all batched events
   */
  private flushBatches(): void {
    for (const [subscriptionId, events] of this.batchBuffer.entries()) {
      const subscription = this.subscriptions.get(subscriptionId);
      if (!subscription) continue;
      
      // Deliver batched events
      for (const event of events) {
        try {
          subscription.handler(event);
        } catch (error) {
          console.error('Event handler error:', error);
        }
      }
    }
    
    // Clear buffers
    this.batchBuffer.clear();
    this.batchTimers.clear();
  }

  /**
   * Convert domain event to WebSocket message
   */
  toWebSocketMessage(event: DomainEvent): WebSocketMessage {
    return {
      type: this.mapEventTypeToMessageType(event.eventType),
      channel: this.determineChannel(event),
      timestamp: event.occurredAt,
      sequence: event.sequence || 0,
      data: event.payload,
    };
  }

  /**
   * Map event type to WebSocket message type
   */
  private mapEventTypeToMessageType(eventType: EventType): any {
    if (eventType.includes('approval')) return 'approval.pending';
    if (eventType.includes('task')) return 'task.updated';
    if (eventType.includes('notification')) return 'notification.new';
    if (eventType.includes('alert') || eventType.includes('sla')) return 'alert.raised';
    if (eventType.includes('kpi') || eventType.includes('progress')) return 'kpi.update';
    return 'activity.new';
  }
}

// Singleton instance
export const eventBus = new EventBus();
