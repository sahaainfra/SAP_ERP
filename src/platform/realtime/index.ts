/**
 * Part 13 — Real-Time Engine Exports
 * 
 * Exports all real-time engine components for use by other parts.
 */

// Types
export * from './types';

// Services
export { EventBus, eventBus } from './event-bus';
export type { EventHandler, EventSubscription } from './event-bus';

export { WebSocketClient } from './websocket-client';
export type { WebSocketClientConfig } from './websocket-client';

export { ChannelManager, channelManager } from './channel-manager';
export type { ChannelSubscription } from './channel-manager';

export { OutboxRelay, outboxRelay } from './outbox-relay';
export type { OutboxRow, OutboxRelayConfig } from './outbox-relay';

// React Hooks
export { useWebSocket } from './use-websocket';
export type { UseWebSocketOptions, UseWebSocketReturn } from './use-websocket';
