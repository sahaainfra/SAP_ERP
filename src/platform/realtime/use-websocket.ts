/**
 * Part 13 — useWebSocket Hook
 * 
 * React hook for WebSocket connection management with:
 * - Automatic connection lifecycle
 * - Subscription management
 * - Connection status tracking
 * - Event handling
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { WebSocketClient, WebSocketClientConfig } from './websocket-client';
import { ConnectionState, ConnectionStatus, WebSocketMessage } from './types';

export interface UseWebSocketOptions extends Omit<WebSocketClientConfig, 'userId'> {
  userId: number;
  autoConnect?: boolean;
  channels?: string[];
  onMessage?: (message: WebSocketMessage) => void;
  onStateChange?: (state: ConnectionState) => void;
}

export interface UseWebSocketReturn {
  connectionState: ConnectionState;
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
  subscribe: (channel: string, permissionKey?: string) => string;
  unsubscribe: (subscriptionId: string) => void;
  onMessage: (type: string, handler: (message: WebSocketMessage) => void) => void;
  offMessage: (type: string, handler: (message: WebSocketMessage) => void) => void;
}

export function useWebSocket(options: UseWebSocketOptions): UseWebSocketReturn {
  const {
    url,
    authToken,
    userId,
    autoConnect = true,
    channels = [],
    onMessage,
    onStateChange,
    ...config
  } = options;

  const clientRef = useRef<WebSocketClient | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    status: 'offline',
    lastSequence: 0,
    reconnectAttempts: 0,
    missedEvents: 0,
  });

  // Initialize WebSocket client
  useEffect(() => {
    const client = new WebSocketClient({
      url,
      authToken,
      userId,
      ...config,
    });

    clientRef.current = client;

    // Listen for state changes
    const handleStateChange = (event: CustomEvent<ConnectionState>) => {
      setConnectionState(event.detail);
      onStateChange?.(event.detail);
    };

    window.addEventListener('websocket:state_changed', handleStateChange as EventListener);

    // Auto-connect if enabled
    if (autoConnect) {
      client.connect();
    }

    // Subscribe to initial channels
    channels.forEach(channel => {
      client.subscribe(channel);
    });

    // Cleanup on unmount
    return () => {
      window.removeEventListener('websocket:state_changed', handleStateChange as EventListener);
      client.disconnect();
    };
  }, [url, authToken, userId, autoConnect]);

  // Handle incoming messages
  useEffect(() => {
    if (!clientRef.current || !onMessage) return;

    const handler = (message: WebSocketMessage) => {
      onMessage(message);
    };

    // Subscribe to all message types
    const messageTypes = [
      'kpi.update',
      'alert.raised',
      'alert.cleared',
      'notification.new',
      'approval.pending',
      'approval.resolved',
      'task.assigned',
      'task.updated',
      'activity.new',
      'sla.warning',
      'sla.breached',
      'presence.changed',
      'permission.changed',
      'system.message',
    ];

    messageTypes.forEach(type => {
      clientRef.current?.onMessage(type, handler);
    });

    return () => {
      messageTypes.forEach(type => {
        clientRef.current?.offMessage(type, handler);
      });
    };
  }, [onMessage]);

  const connect = useCallback(() => {
    clientRef.current?.connect();
  }, []);

  const disconnect = useCallback(() => {
    clientRef.current?.disconnect();
  }, []);

  const subscribe = useCallback((channel: string, permissionKey?: string): string => {
    if (!clientRef.current) {
      throw new Error('WebSocket client not initialized');
    }
    return clientRef.current.subscribe(channel, permissionKey);
  }, []);

  const unsubscribe = useCallback((subscriptionId: string) => {
    clientRef.current?.unsubscribe(subscriptionId);
  }, []);

  const onMessageHandler = useCallback((type: string, handler: (message: WebSocketMessage) => void) => {
    clientRef.current?.onMessage(type, handler);
  }, []);

  const offMessageHandler = useCallback((type: string, handler: (message: WebSocketMessage) => void) => {
    clientRef.current?.offMessage(type, handler);
  }, []);

  return {
    connectionState,
    isConnected: connectionState.status === 'connected',
    connect,
    disconnect,
    subscribe,
    unsubscribe,
    onMessage: onMessageHandler,
    offMessage: offMessageHandler,
  };
}
