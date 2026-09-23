/**
 * Part 13 — Connection Status Indicator Component
 * 
 * Visual indicator showing WebSocket connection status:
 * - Live (green dot)
 * - Reconnecting (amber, animated)
 * - Offline (grey) with timestamp of last data
 */

import React from 'react';
import { ConnectionState, ConnectionStatus } from '../platform/realtime/types';

export interface ConnectionStatusIndicatorProps {
  state: ConnectionState;
  showTimestamp?: boolean;
  className?: string;
}

export const ConnectionStatusIndicator: React.FC<ConnectionStatusIndicatorProps> = ({
  state,
  showTimestamp = true,
  className = '',
}) => {
  const getStatusInfo = (status: ConnectionStatus) => {
    switch (status) {
      case 'connected':
        return {
          color: 'bg-green-500',
          label: 'Live',
          animated: false,
        };
      case 'connecting':
      case 'reconnecting':
        return {
          color: 'bg-amber-500',
          label: 'Reconnecting',
          animated: true,
        };
      case 'offline':
        return {
          color: 'bg-gray-400',
          label: 'Offline',
          animated: false,
        };
      case 'failed':
        return {
          color: 'bg-red-500',
          label: 'Connection Failed',
          animated: false,
        };
      default:
        return {
          color: 'bg-gray-400',
          label: 'Unknown',
          animated: false,
        };
    }
  };

  const statusInfo = getStatusInfo(state.status);

  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Status dot */}
      <div className="relative">
        <div
          className={`w-2.5 h-2.5 rounded-full ${statusInfo.color}`}
          title={statusInfo.label}
        />
        {statusInfo.animated && (
          <div
            className={`absolute inset-0 w-2.5 h-2.5 rounded-full ${statusInfo.color} animate-ping opacity-75`}
          />
        )}
      </div>

      {/* Status label */}
      <span className="text-sm font-medium text-gray-700">
        {statusInfo.label}
      </span>

      {/* Timestamp for offline state */}
      {showTimestamp && state.status === 'offline' && state.lastDisconnectedAt && (
        <span className="text-xs text-gray-500">
          since {formatTimestamp(state.lastDisconnectedAt)}
        </span>
      )}

      {/* Reconnect attempts */}
      {state.status === 'reconnecting' && state.reconnectAttempts > 0 && (
        <span className="text-xs text-gray-500">
          (attempt {state.reconnectAttempts})
        </span>
      )}

      {/* Missed events indicator */}
      {state.missedEvents > 0 && (
        <span className="text-xs text-amber-600 font-medium">
          {state.missedEvents} missed
        </span>
      )}
    </div>
  );
};

export default ConnectionStatusIndicator;
