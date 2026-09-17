/**
 * Real-time Connection Indicator - Part 4
 * 
 * Shows WebSocket connection status: Live, Reconnecting, Offline
 */

import type { ConnectionStatus } from '../types/realtime';

interface RealtimeIndicatorProps {
  status: ConnectionStatus;
  lastUpdate?: string;
}

export default function RealtimeIndicator({ status, lastUpdate }: RealtimeIndicatorProps) {
  const statusConfig = {
    connected: {
      label: 'Live',
      color: 'bg-green-500',
      textColor: 'text-green-700 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      animate: true,
    },
    reconnecting: {
      label: 'Reconnecting',
      color: 'bg-yellow-500',
      textColor: 'text-yellow-700 dark:text-yellow-400',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      animate: true,
    },
    offline: {
      label: 'Offline',
      color: 'bg-gray-400',
      textColor: 'text-gray-700 dark:text-gray-400',
      bgColor: 'bg-gray-50 dark:bg-gray-800/50',
      animate: false,
    },
  };

  const config = statusConfig[status];

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${config.bgColor}`}>
      <div className="relative">
        <div className={`w-2 h-2 rounded-full ${config.color}`} />
        {config.animate && (
          <div className={`absolute inset-0 w-2 h-2 rounded-full ${config.color} animate-ping opacity-75`} />
        )}
      </div>
      <span className={`text-xs font-medium ${config.textColor}`}>
        {config.label}
      </span>
      {lastUpdate && status === 'connected' && (
        <span className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
          • Updated {lastUpdate}
        </span>
      )}
    </div>
  );
}
