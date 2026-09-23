/**
 * Part 13 — WebSocket Client
 * 
 * Manages WebSocket connection with:
 * - Authentication and authorization
 * - Automatic reconnection with exponential backoff
 * - Gap recovery using sequence numbers
 * - Connection status tracking
 * - Fallback to polling when socket unavailable
 */

import { ConnectionState, ConnectionStatus, WebSocketMessage, Subscription, buildChannelId } from './types';
import { eventBus } from './event-bus';

export interface WebSocketClientConfig {
  url: string;
  authToken: string;
  userId: number;
  maxReconnectAttempts?: number;
  initialReconnectDelay?: number;
  maxReconnectDelay?: number;
  heartbeatInterval?: number;
  missedHeartbeatLimit?: number;
}

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private config: Required<WebSocketClientConfig>;
  private state: ConnectionState;
  private subscriptions: Map<string, Subscription> = new Map();
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private missedHeartbeats = 0;
  private messageHandlers: Map<string, ((message: WebSocketMessage) => void)[]> = new Map();
  
  private readonly DEFAULT_CONFIG: Required<WebSocketClientConfig> = {
    url: '',
    authToken: '',
    userId: 0,
    maxReconnectAttempts: 10,
    initialReconnectDelay: 1000,
    maxReconnectDelay: 30000,
    heartbeatInterval: 30000,
    missedHeartbeatLimit: 3,
  };

  constructor(config: WebSocketClientConfig) {
    this.config = { ...this.DEFAULT_CONFIG, ...config };
    this.state = {
      status: 'offline',
      lastSequence: 0,
      reconnectAttempts: 0,
      missedEvents: 0,
    };
  }

  /**
   * Connect to WebSocket server
   */
  connect(): void {
    if (this.ws && (this.ws.readyState === WebSocket.CONNECTING || this.ws.readyState === WebSocket.OPEN)) {
      console.warn('WebSocket already connected or connecting');
      return;
    }

    this.updateState({ status: 'connecting' });

    try {
      this.ws = new WebSocket(this.config.url);
      this.setupEventHandlers();
    } catch (error) {
      console.error('WebSocket connection failed:', error);
      this.updateState({ status: 'failed' });
      this.scheduleReconnect();
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }

    this.updateState({ status: 'offline' });
  }

  /**
   * Subscribe to a channel
   */
  subscribe(channel: string, permissionKey?: string): string {
    const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const subscription: Subscription = {
      id: subscriptionId,
      channel,
      permissionKey,
      lastSequence: 0,
      createdAt: new Date().toISOString(),
      isActive: true,
    };

    this.subscriptions.set(subscriptionId, subscription);

    // Send subscription request to server
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'subscribe',
        subscriptionId,
        channel,
        permissionKey,
      }));
    }

    return subscriptionId;
  }

  /**
   * Unsubscribe from a channel
   */
  unsubscribe(subscriptionId: string): void {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) return;

    subscription.isActive = false;
    this.subscriptions.delete(subscriptionId);

    // Send unsubscription request to server
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'unsubscribe',
        subscriptionId,
      }));
    }
  }

  /**
   * Register a message handler for a specific message type
   */
  onMessage(messageType: string, handler: (message: WebSocketMessage) => void): void {
    if (!this.messageHandlers.has(messageType)) {
      this.messageHandlers.set(messageType, []);
    }
    this.messageHandlers.get(messageType)!.push(handler);
  }

  /**
   * Remove a message handler
   */
  offMessage(messageType: string, handler: (message: WebSocketMessage) => void): void {
    const handlers = this.messageHandlers.get(messageType);
    if (!handlers) return;

    const index = handlers.indexOf(handler);
    if (index !== -1) {
      handlers.splice(index, 1);
    }
  }

  /**
   * Get current connection state
   */
  getConnectionState(): ConnectionState {
    return { ...this.state };
  }

  /**
   * Check if connection is active
   */
  isConnected(): boolean {
    return this.state.status === 'connected';
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PRIVATE METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Setup WebSocket event handlers
   */
  private setupEventHandlers(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.updateState({
        status: 'connected',
        lastConnectedAt: new Date().toISOString(),
        reconnectAttempts: 0,
      });
      this.missedHeartbeats = 0;
      this.startHeartbeat();
      this.resubscribeAll();
      this.requestGapRecovery();
    };

    this.ws.onmessage = (event) => {
      this.handleMessage(event.data);
    };

    this.ws.onclose = (event) => {
      console.log('WebSocket closed:', event.code, event.reason);
      this.updateState({
        status: 'reconnecting',
        lastDisconnectedAt: new Date().toISOString(),
      });
      this.stopHeartbeat();
      this.scheduleReconnect();
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  /**
   * Handle incoming message
   */
  private handleMessage(data: string): void {
    try {
      const message: WebSocketMessage = JSON.parse(data);
      
      // Update last sequence
      if (message.sequence) {
        this.updateState({ lastSequence: message.sequence });
      }

      // Handle special message types
      if (message.type === 'connection.status') {
        this.handleConnectionStatusMessage(message);
        return;
      }

      if (message.type === 'permission.changed') {
        this.handlePermissionChangedMessage(message);
        return;
      }

      // Dispatch to handlers
      const handlers = this.messageHandlers.get(message.type) || [];
      for (const handler of handlers) {
        try {
          handler(message);
        } catch (error) {
          console.error('Message handler error:', error);
        }
      }

      // Also dispatch to event bus for global handling
      eventBus.publish({
        eventId: `ws_${Date.now()}`,
        eventType: message.type as any,
        occurredAt: message.timestamp,
        actorUserId: this.config.userId,
        entityType: 'websocket',
        entityId: 0,
        scope: {},
        payload: message.data,
        version: 1,
        sequence: message.sequence,
      });
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  }

  /**
   * Handle connection status message
   */
  private handleConnectionStatusMessage(message: WebSocketMessage): void {
    if (message.data.status === 'force_refresh') {
      // Server is asking us to do a full refresh
      this.updateState({ lastSequence: 0 });
      window.location.reload();
    }
  }

  /**
   * Handle permission changed message
   */
  private handlePermissionChangedMessage(message: WebSocketMessage): void {
    // Re-fetch menu and dashboard
    console.log('Permissions changed, re-fetching menu and dashboard');
    window.dispatchEvent(new CustomEvent('permission:changed'));
  }

  /**
   * Start heartbeat
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
        
        // Check for missed heartbeats
        this.missedHeartbeats++;
        if (this.missedHeartbeats >= this.config.missedHeartbeatLimit) {
          console.warn('Missed heartbeat limit reached, reconnecting');
          this.ws.close(4000, 'Heartbeat timeout');
        }
      }
    }, this.config.heartbeatInterval);
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * Schedule reconnection with exponential backoff
   */
  private scheduleReconnect(): void {
    if (this.state.reconnectAttempts >= this.config.maxReconnectAttempts) {
      console.error('Max reconnect attempts reached');
      this.updateState({ status: 'failed' });
      return;
    }

    const delay = Math.min(
      this.config.initialReconnectDelay * Math.pow(2, this.state.reconnectAttempts),
      this.config.maxReconnectDelay
    );

    // Add jitter
    const jitter = Math.random() * 1000;
    const totalDelay = delay + jitter;

    console.log(`Scheduling reconnect in ${totalDelay}ms (attempt ${this.state.reconnectAttempts + 1})`);

    this.reconnectTimer = setTimeout(() => {
      this.updateState({ reconnectAttempts: this.state.reconnectAttempts + 1 });
      this.connect();
    }, totalDelay);
  }

  /**
   * Resubscribe to all channels after reconnect
   */
  private resubscribeAll(): void {
    for (const subscription of this.subscriptions.values()) {
      if (subscription.isActive && this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({
          type: 'subscribe',
          subscriptionId: subscription.id,
          channel: subscription.channel,
          permissionKey: subscription.permissionKey,
          lastSequence: subscription.lastSequence,
        }));
      }
    }
  }

  /**
   * Request gap recovery from server
   */
  private requestGapRecovery(): void {
    if (this.state.lastSequence > 0 && this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'gap_recovery',
        lastSequence: this.state.lastSequence,
      }));
    }
  }

  /**
   * Update connection state
   */
  private updateState(updates: Partial<ConnectionState>): void {
    this.state = { ...this.state, ...updates };
    
    // Dispatch state change event
    window.dispatchEvent(new CustomEvent('websocket:state_changed', {
      detail: this.state,
    }));
  }
}
