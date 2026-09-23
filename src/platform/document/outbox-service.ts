/**
 * Part 09 — Outbox Service
 * 
 * Implements transactional outbox pattern for reliable event delivery.
 * Events are written inside the transaction and relayed asynchronously.
 */

import { OutboxEvent, OutboxStatus } from './types';
import { UowContext } from '../uow/UnitOfWork';

export class OutboxService {
  private events: OutboxEvent[] = [];
  private nextId = 1;

  /**
   * Publish event (called inside transaction)
   */
  publish(event: {
    eventType: string;
    aggregateId: number;
    payload: any;
    occurredAt: Date;
  }): void {
    // This is called via ctx.outbox.publish in UowContext
    // The actual implementation is in UnitOfWork
  }

  /**
   * Flush outbox events (called by UnitOfWork)
   */
  async flush(ctx: UowContext): Promise<void> {
    const events = ctx.outbox.getEvents();
    if (events.length === 0) return;

    for (const event of events) {
      const outboxEvent: OutboxEvent = {
        id: this.nextId++,
        eventType: event.eventType,
        aggregateType: 'DOCUMENT',
        aggregateId: Number(event.aggregateId),
        payload: event.payload,
        correlationId: ctx.correlationId,
        actorUserId: Number(ctx.actor.userId),
        occurredAt: event.occurredAt.toISOString(),
        status: 'PENDING',
        attempts: 0,
      };
      this.events.push(outboxEvent);
    }

    ctx.outbox.clear();
  }

  /**
   * Get pending events
   */
  getPendingEvents(limit: number = 100): OutboxEvent[] {
    return this.events
      .filter(e => e.status === 'PENDING' || (e.status === 'FAILED' && e.attempts < 10))
      .slice(0, limit);
  }

  /**
   * Mark event as processing
   */
  markProcessing(eventId: number): void {
    const event = this.events.find(e => e.id === eventId);
    if (event) {
      event.status = 'PROCESSING';
      event.attempts++;
    }
  }

  /**
   * Mark event as done
   */
  markDone(eventId: number): void {
    const event = this.events.find(e => e.id === eventId);
    if (event) {
      event.status = 'DONE';
      event.processedAt = new Date().toISOString();
    }
  }

  /**
   * Mark event as failed
   */
  markFailed(eventId: number, error: string): void {
    const event = this.events.find(e => e.id === eventId);
    if (event) {
      event.status = event.attempts >= 10 ? 'DEAD' : 'FAILED';
      event.lastError = error;
      
      // Exponential backoff
      const backoff = Math.min(Math.pow(2, event.attempts), 3600);
      const nextAttempt = new Date();
      nextAttempt.setSeconds(nextAttempt.getSeconds() + backoff);
      event.nextAttemptAt = nextAttempt.toISOString();
    }
  }

  /**
   * Get all events
   */
  getAllEvents(): OutboxEvent[] {
    return [...this.events];
  }

  /**
   * Get events by aggregate
   */
  getAggregateEvents(aggregateType: string, aggregateId: number): OutboxEvent[] {
    return this.events.filter(
      e => e.aggregateType === aggregateType && e.aggregateId === aggregateId
    );
  }

  /**
   * Get dead events
   */
  getDeadEvents(): OutboxEvent[] {
    return this.events.filter(e => e.status === 'DEAD');
  }

  /**
   * Get outbox lag (oldest pending event age in seconds)
   */
  getLag(): number {
    const pending = this.events.filter(e => e.status === 'PENDING');
    if (pending.length === 0) return 0;

    const oldest = pending.reduce((min, e) => {
      const age = Date.now() - new Date(e.occurredAt).getTime();
      return age < min ? age : min;
    }, Infinity);

    return Math.floor(oldest / 1000);
  }
}

export const outboxService = new OutboxService();
