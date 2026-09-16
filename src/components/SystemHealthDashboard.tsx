/**
 * System Health Dashboard - Part 10
 * 
 * Real-time monitoring dashboard for system health, performance, and operational metrics
 */

import { useState, useEffect } from 'react';
import { 
  Activity, Server, Database, Clock, AlertTriangle, CheckCircle2, 
  XCircle, TrendingUp, TrendingDown, Users, HardDrive, Cpu, 
  Wifi, Bell, Shield, RefreshCw
} from 'lucide-react';
import { formatDuration } from '../utils/formatting';

interface SystemMetrics {
  uptime: {
    days: number;
    hours: number;
    minutes: number;
    percentage: number;
  };
  responseTimes: {
    api: number;
    dashboard: number;
    search: number;
  };
  errorRate: {
    percentage: number;
    count: number;
  };
  activeSessions: number;
  queueDepth: number;
  relayLag: number;
  backgroundJobs: {
    running: number;
    queued: number;
    failed: number;
  };
  database: {
    sizeGB: number;
    connections: number;
    maxConnections: number;
    slowQueries: number;
  };
  cache: {
    hitRate: number;
    size: number;
    maxSize: number;
  };
  storage: {
    usedGB: number;
    totalGB: number;
    backups: number;
  };
  websockets: {
    connected: number;
    maxCapacity: number;
  };
  security: {
    failedLogins: number;
    blockedAttempts: number;
    activeThreats: number;
  };
  lastBackup: {
    timestamp: string;
    status: 'success' | 'failed' | 'pending';
    age: string;
  };
}

interface Alert {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  timestamp: string;
  acknowledged: boolean;
}

export default function SystemHealthDashboard() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Simulate fetching metrics
  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchMetrics = () => {
    // Simulated metrics - in production, this would call /api/dx/v1/system/health
    const mockMetrics: SystemMetrics = {
      uptime: {
        days: 45,
        hours: 12,
        minutes: 34,
        percentage: 99.98,
      },
      responseTimes: {
        api: 145,
        dashboard: 1200,
        search: 320,
      },
      errorRate: {
        percentage: 0.12,
        count: 23,
      },
      activeSessions: 127,
      queueDepth: 12,
      relayLag: 45,
      backgroundJobs: {
        running: 3,
        queued: 8,
        failed: 0,
      },
      database: {
        sizeGB: 245.7,
        connections: 45,
        maxConnections: 100,
        slowQueries: 2,
      },
      cache: {
        hitRate: 94.5,
        size: 2.1,
        maxSize: 4.0,
      },
      storage: {
        usedGB: 847,
        totalGB: 2000,
        backups: 247,
      },
      websockets: {
        connected: 89,
        maxCapacity: 500,
      },
      security: {
        failedLogins: 12,
        blockedAttempts: 3,
        activeThreats: 0,
      },
      lastBackup: {
        timestamp: '2026-02-10T02:00:00Z',
        status: 'success',
        age: '14h ago',
      },
    };

    const mockAlerts: Alert[] = [
      {
        id: '1',
        severity: 'warning',
        message: 'Database connections at 45% capacity',
        timestamp: '2026-02-10T15:30:00Z',
        acknowledged: false,
      },
      {
        id: '2',
        severity: 'info',
        message: 'Cache hit rate below 95% threshold',
        timestamp: '2026-02-10T14:15:00Z',
        acknowledged: false,
      },
    ];

    setTimeout(() => {
      setMetrics(mockMetrics);
      setAlerts(mockAlerts);
      setLoading(false);
      setLastRefresh(new Date());
    }, 500);
  };

  const getStatusColor = (value: number, warningThreshold: number, criticalThreshold: number) => {
    if (value >= criticalThreshold) return 'var(--sapNegativeColor)';
    if (value >= warningThreshold) return 'var(--sapCriticalColor)';
    return 'var(--sapPositiveColor)';
  };

  const getInverseStatusColor = (value: number, warningThreshold: number, criticalThreshold: number) => {
    if (value <= criticalThreshold) return 'var(--sapNegativeColor)';
    if (value <= warningThreshold) return 'var(--sapCriticalColor)';
    return 'var(--sapPositiveColor)';
  };

  if (loading || !metrics) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--sapBackgroundColor)' }}>
        <div className="text-center">
          <RefreshCw size={48} className="animate-spin mx-auto mb-4" style={{ color: 'var(--sapBrandColor)' }} />
          <p style={{ color: 'var(--sapTextColor)' }}>Loading system metrics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6" style={{ background: 'var(--sapBackgroundColor)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--sapTextColor)' }}>
            System Health Dashboard
          </h1>
          <p className="text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>
            Real-time monitoring and operational metrics
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>Last Refresh</div>
            <div className="text-sm font-medium" style={{ color: 'var(--sapTextColor)' }}>
              {lastRefresh.toLocaleTimeString()}
            </div>
          </div>
          <button
            onClick={fetchMetrics}
            className="p-2 rounded hover:bg-[var(--sapButton_Hover_Background)]"
            style={{ color: 'var(--sapButton_TextColor)' }}
          >
            <RefreshCw size={20} />
          </button>
        </div>
      </div>

      {/* Critical Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Uptime */}
        <div className="sap-card p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Activity size={20} style={{ color: 'var(--sapBrandColor)' }} />
              <span className="text-sm font-medium" style={{ color: 'var(--sapContent_LabelColor)' }}>
                System Uptime
              </span>
            </div>
            <CheckCircle2 size={16} style={{ color: 'var(--sapPositiveColor)' }} />
          </div>
          <div className="text-2xl font-bold mb-1" style={{ color: 'var(--sapTextColor)' }}>
            {metrics.uptime.percentage}%
          </div>
          <div className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
            {metrics.uptime.days}d {metrics.uptime.hours}h {metrics.uptime.minutes}m
          </div>
        </div>

        {/* API Response Time */}
        <div className="sap-card p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Clock size={20} style={{ color: 'var(--sapBrandColor)' }} />
              <span className="text-sm font-medium" style={{ color: 'var(--sapContent_LabelColor)' }}>
                API Response (p95)
              </span>
            </div>
            {metrics.responseTimes.api < 500 ? (
              <CheckCircle2 size={16} style={{ color: 'var(--sapPositiveColor)' }} />
            ) : (
              <AlertTriangle size={16} style={{ color: 'var(--sapCriticalColor)' }} />
            )}
          </div>
          <div className="text-2xl font-bold mb-1" style={{ color: 'var(--sapTextColor)' }}>
            {metrics.responseTimes.api}ms
          </div>
          <div className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
            Target: &lt; 500ms
          </div>
        </div>

        {/* Error Rate */}
        <div className="sap-card p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <AlertTriangle size={20} style={{ color: 'var(--sapBrandColor)' }} />
              <span className="text-sm font-medium" style={{ color: 'var(--sapContent_LabelColor)' }}>
                Error Rate
              </span>
            </div>
            {metrics.errorRate.percentage < 1 ? (
              <CheckCircle2 size={16} style={{ color: 'var(--sapPositiveColor)' }} />
            ) : (
              <XCircle size={16} style={{ color: 'var(--sapNegativeColor)' }} />
            )}
          </div>
          <div className="text-2xl font-bold mb-1" style={{ color: 'var(--sapTextColor)' }}>
            {metrics.errorRate.percentage}%
          </div>
          <div className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
            {metrics.errorRate.count} errors (24h)
          </div>
        </div>

        {/* Active Sessions */}
        <div className="sap-card p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Users size={20} style={{ color: 'var(--sapBrandColor)' }} />
              <span className="text-sm font-medium" style={{ color: 'var(--sapContent_LabelColor)' }}>
                Active Sessions
              </span>
            </div>
            <CheckCircle2 size={16} style={{ color: 'var(--sapPositiveColor)' }} />
          </div>
          <div className="text-2xl font-bold mb-1" style={{ color: 'var(--sapTextColor)' }}>
            {metrics.activeSessions}
          </div>
          <div className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
            {metrics.websockets.connected} WebSocket connections
          </div>
        </div>
      </div>

      {/* Infrastructure Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Database Health */}
        <div className="sap-card p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--sapTextColor)' }}>
            <Database size={20} style={{ color: 'var(--sapBrandColor)' }} />
            Database Health
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>Size</span>
                <span className="text-sm font-medium" style={{ color: 'var(--sapTextColor)' }}>
                  {metrics.database.sizeGB} GB
                </span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--sapProgress_Background)' }}>
                <div 
                  className="h-full rounded-full"
                  style={{ 
                    width: `${(metrics.database.sizeGB / 500) * 100}%`,
                    background: 'var(--sapProgress_Value_InformationBackground)'
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>Connections</span>
                <span className="text-sm font-medium" style={{ color: 'var(--sapTextColor)' }}>
                  {metrics.database.connections} / {metrics.database.maxConnections}
                </span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--sapProgress_Background)' }}>
                <div 
                  className="h-full rounded-full"
                  style={{ 
                    width: `${(metrics.database.connections / metrics.database.maxConnections) * 100}%`,
                    background: getStatusColor(
                      (metrics.database.connections / metrics.database.maxConnections) * 100,
                      70,
                      90
                    )
                  }}
                />
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: 'var(--sapList_BorderColor)' }}>
              <span className="text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>Slow Queries</span>
              <span className="text-sm font-medium" style={{ 
                color: metrics.database.slowQueries > 0 ? 'var(--sapCriticalColor)' : 'var(--sapPositiveColor)'
              }}>
                {metrics.database.slowQueries}
              </span>
            </div>
          </div>
        </div>

        {/* Cache Performance */}
        <div className="sap-card p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--sapTextColor)' }}>
            <Cpu size={20} style={{ color: 'var(--sapBrandColor)' }} />
            Cache Performance
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>Hit Rate</span>
                <span className="text-sm font-medium" style={{ color: 'var(--sapTextColor)' }}>
                  {metrics.cache.hitRate}%
                </span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--sapProgress_Background)' }}>
                <div 
                  className="h-full rounded-full"
                  style={{ 
                    width: `${metrics.cache.hitRate}%`,
                    background: getInverseStatusColor(metrics.cache.hitRate, 90, 80)
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>Memory Usage</span>
                <span className="text-sm font-medium" style={{ color: 'var(--sapTextColor)' }}>
                  {metrics.cache.size} GB / {metrics.cache.maxSize} GB
                </span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--sapProgress_Background)' }}>
                <div 
                  className="h-full rounded-full"
                  style={{ 
                    width: `${(metrics.cache.size / metrics.cache.maxSize) * 100}%`,
                    background: getStatusColor(
                      (metrics.cache.size / metrics.cache.maxSize) * 100,
                      70,
                      90
                    )
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Storage & Backup */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Storage */}
        <div className="sap-card p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--sapTextColor)' }}>
            <HardDrive size={20} style={{ color: 'var(--sapBrandColor)' }} />
            Storage
          </h3>
          <div className="text-3xl font-bold mb-2" style={{ color: 'var(--sapTextColor)' }}>
            {metrics.storage.usedGB} GB
          </div>
          <div className="text-sm mb-3" style={{ color: 'var(--sapContent_LabelColor)' }}>
            of {metrics.storage.totalGB} GB used
          </div>
          <div className="h-2 rounded-full overflow-hidden mb-2" style={{ background: 'var(--sapProgress_Background)' }}>
            <div 
              className="h-full rounded-full"
              style={{ 
                width: `${(metrics.storage.usedGB / metrics.storage.totalGB) * 100}%`,
                background: getStatusColor(
                  (metrics.storage.usedGB / metrics.storage.totalGB) * 100,
                  70,
                  90
                )
              }}
            />
          </div>
          <div className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
            {metrics.storage.backups} backups stored
          </div>
        </div>

        {/* Background Jobs */}
        <div className="sap-card p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--sapTextColor)' }}>
            <Server size={20} style={{ color: 'var(--sapBrandColor)' }} />
            Background Jobs
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>Running</span>
              <span className="text-lg font-bold" style={{ color: 'var(--sapTextColor)' }}>
                {metrics.backgroundJobs.running}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>Queued</span>
              <span className="text-lg font-bold" style={{ color: 'var(--sapTextColor)' }}>
                {metrics.backgroundJobs.queued}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>Failed</span>
              <span className="text-lg font-bold" style={{ 
                color: metrics.backgroundJobs.failed > 0 ? 'var(--sapNegativeColor)' : 'var(--sapPositiveColor)'
              }}>
                {metrics.backgroundJobs.failed}
              </span>
            </div>
          </div>
        </div>

        {/* Last Backup */}
        <div className="sap-card p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--sapTextColor)' }}>
            <Shield size={20} style={{ color: 'var(--sapBrandColor)' }} />
            Last Backup
          </h3>
          <div className="flex items-center gap-3 mb-3">
            {metrics.lastBackup.status === 'success' ? (
              <CheckCircle2 size={32} style={{ color: 'var(--sapPositiveColor)' }} />
            ) : metrics.lastBackup.status === 'failed' ? (
              <XCircle size={32} style={{ color: 'var(--sapNegativeColor)' }} />
            ) : (
              <Clock size={32} style={{ color: 'var(--sapCriticalColor)' }} />
            )}
            <div>
              <div className="text-lg font-bold" style={{ color: 'var(--sapTextColor)' }}>
                {metrics.lastBackup.age}
              </div>
              <div className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
                {new Date(metrics.lastBackup.timestamp).toLocaleString()}
              </div>
            </div>
          </div>
          <div className="text-xs p-2 rounded" style={{ 
            background: metrics.lastBackup.status === 'success' ? 'var(--sapSuccessBackground)' : 'var(--sapErrorBackground)',
            color: metrics.lastBackup.status === 'success' ? 'var(--sapPositiveTextColor)' : 'var(--sapNegativeTextColor)'
          }}>
            {metrics.lastBackup.status === 'success' ? '✓ Backup successful' : '✗ Backup failed'}
          </div>
        </div>
      </div>

      {/* Security & Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Security Metrics */}
        <div className="sap-card p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--sapTextColor)' }}>
            <Shield size={20} style={{ color: 'var(--sapBrandColor)' }} />
            Security
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded" style={{ background: 'var(--sapList_Background)' }}>
              <span className="text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>Failed Logins (24h)</span>
              <span className="text-lg font-bold" style={{ 
                color: metrics.security.failedLogins > 50 ? 'var(--sapCriticalColor)' : 'var(--sapTextColor)'
              }}>
                {metrics.security.failedLogins}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded" style={{ background: 'var(--sapList_Background)' }}>
              <span className="text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>Blocked Attempts</span>
              <span className="text-lg font-bold" style={{ color: 'var(--sapTextColor)' }}>
                {metrics.security.blockedAttempts}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded" style={{ background: 'var(--sapList_Background)' }}>
              <span className="text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>Active Threats</span>
              <span className="text-lg font-bold" style={{ 
                color: metrics.security.activeThreats > 0 ? 'var(--sapNegativeColor)' : 'var(--sapPositiveColor)'
              }}>
                {metrics.security.activeThreats}
              </span>
            </div>
          </div>
        </div>

        {/* Queue & Relay */}
        <div className="sap-card p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--sapTextColor)' }}>
            <Wifi size={20} style={{ color: 'var(--sapBrandColor)' }} />
            Event Queue & Relay
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>Queue Depth</span>
                <span className="text-sm font-medium" style={{ color: 'var(--sapTextColor)' }}>
                  {metrics.queueDepth}
                </span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--sapProgress_Background)' }}>
                <div 
                  className="h-full rounded-full"
                  style={{ 
                    width: `${Math.min(metrics.queueDepth * 5, 100)}%`,
                    background: getStatusColor(metrics.queueDepth, 50, 100)
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>Relay Lag</span>
                <span className="text-sm font-medium" style={{ color: 'var(--sapTextColor)' }}>
                  {metrics.relayLag}ms
                </span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--sapProgress_Background)' }}>
                <div 
                  className="h-full rounded-full"
                  style={{ 
                    width: `${Math.min(metrics.relayLag / 2, 100)}%`,
                    background: getStatusColor(metrics.relayLag, 100, 200)
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>WebSocket Connections</span>
                <span className="text-sm font-medium" style={{ color: 'var(--sapTextColor)' }}>
                  {metrics.websockets.connected} / {metrics.websockets.maxCapacity}
                </span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--sapProgress_Background)' }}>
                <div 
                  className="h-full rounded-full"
                  style={{ 
                    width: `${(metrics.websockets.connected / metrics.websockets.maxCapacity) * 100}%`,
                    background: getStatusColor(
                      (metrics.websockets.connected / metrics.websockets.maxCapacity) * 100,
                      70,
                      90
                    )
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Active Alerts */}
      <div className="sap-card p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--sapTextColor)' }}>
          <Bell size={20} style={{ color: 'var(--sapBrandColor)' }} />
          Active Alerts
        </h3>
        {alerts.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle2 size={48} className="mx-auto mb-3" style={{ color: 'var(--sapPositiveColor)' }} />
            <p style={{ color: 'var(--sapContent_LabelColor)' }}>No active alerts</p>
          </div>
        ) : (
          <div className="space-y-2">
            {alerts.map(alert => (
              <div
                key={alert.id}
                className="flex items-start gap-3 p-3 rounded"
                style={{
                  background: alert.severity === 'critical' ? 'var(--sapErrorBackground)' :
                             alert.severity === 'warning' ? 'var(--sapWarningBackground)' :
                             'var(--sapInformationBackground)',
                  borderLeft: `4px solid ${
                    alert.severity === 'critical' ? 'var(--sapNegativeColor)' :
                    alert.severity === 'warning' ? 'var(--sapCriticalColor)' :
                    'var(--sapInformativeColor)'
                  }`
                }}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold uppercase" style={{
                      color: alert.severity === 'critical' ? 'var(--sapNegativeTextColor)' :
                             alert.severity === 'warning' ? 'var(--sapCriticalTextColor)' :
                             'var(--sapInformativeTextColor)'
                    }}>
                      {alert.severity}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
                      {new Date(alert.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm" style={{ color: 'var(--sapTextColor)' }}>
                    {alert.message}
                  </p>
                </div>
                {!alert.acknowledged && (
                  <button
                    className="px-3 py-1 rounded text-xs font-medium"
                    style={{
                      background: 'var(--sapButton_Background)',
                      color: 'var(--sapButton_TextColor)',
                      border: '1px solid var(--sapButton_BorderColor)'
                    }}
                  >
                    Acknowledge
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
