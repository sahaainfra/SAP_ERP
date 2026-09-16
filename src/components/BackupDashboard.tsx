/**
 * Backup Dashboard Component - Part 9
 * 
 * Main dashboard showing backup KPIs, history, schedules, and restore operations
 */

import { useState } from 'react';
import { 
  Database, Download, Upload, Shield, Clock, CheckCircle2, 
  XCircle, AlertTriangle, Lock, Unlock, Trash2, Eye, 
  Calendar, Play, Pause, Plus, Settings, FileText
} from 'lucide-react';
import type { Backup, BackupSchedule, Restore } from '../types/backup';
import { 
  backupDashboardKPIs, 
  backupHistory, 
  backupSchedules, 
  restoreHistory 
} from '../data/backupData';
import { formatCurrency, formatDate, formatDuration } from '../utils/formatting';
import { StatusChip } from './SupportingComponents';

type DashboardTab = 'overview' | 'history' | 'schedules' | 'restore' | 'audit';

export default function BackupDashboard() {
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [showCreateBackupModal, setShowCreateBackupModal] = useState(false);
  const [showRestoreWizard, setShowRestoreWizard] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<Backup | null>(null);

  const tabs = [
    { key: 'overview', label: 'Overview', icon: Database },
    { key: 'history', label: 'Backup History', icon: FileText },
    { key: 'schedules', label: 'Schedules', icon: Calendar },
    { key: 'restore', label: 'Restore', icon: Upload },
    { key: 'audit', label: 'Audit Trail', icon: Shield }
  ];

  return (
    <div className="min-h-screen" style={{ background: 'var(--sapBackgroundColor)' }}>
      {/* Header */}
      <div className="sap-card p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--sapTextColor)' }}>
              Backup & Restore
            </h1>
            <p className="text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>
              Manage system backups, schedules, and restore operations
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCreateBackupModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium"
              style={{
                background: 'var(--sapButton_Emphasized_Background)',
                color: 'var(--sapButton_Emphasized_TextColor)'
              }}
            >
              <Plus size={16} />
              Create Backup
            </button>
            <button
              onClick={() => setShowRestoreWizard(true)}
              className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium"
              style={{
                background: 'var(--sapButton_Background)',
                color: 'var(--sapButton_TextColor)',
                border: '1px solid var(--sapButton_BorderColor)'
              }}
            >
              <Upload size={16} />
              Restore
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="sap-card mb-6">
        <div className="flex border-b" style={{ borderColor: 'var(--sapList_BorderColor)' }}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as DashboardTab)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'border-[var(--sapSelectedColor)]'
                    : 'border-transparent hover:border-[var(--sapContent_BorderColor)]'
                }`}
                style={{
                  color: activeTab === tab.key ? 'var(--sapSelectedColor)' : 'var(--sapContent_LabelColor)'
                }}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="sap-card p-6">
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'history' && <HistoryTab />}
        {activeTab === 'schedules' && <SchedulesTab />}
        {activeTab === 'restore' && <RestoreTab />}
        {activeTab === 'audit' && <AuditTab />}
      </div>

      {/* Modals */}
      {showCreateBackupModal && (
        <CreateBackupModal onClose={() => setShowCreateBackupModal(false)} />
      )}
      {showRestoreWizard && (
        <RestoreWizard onClose={() => setShowRestoreWizard(false)} />
      )}
    </div>
  );
}

// ─── Overview Tab ────────────────────────────────────────────────────────────

function OverviewTab() {
  const kpis = backupDashboardKPIs;

  const getStatusColor = (status: 'good' | 'warning' | 'critical') => {
    switch (status) {
      case 'good': return 'var(--sapPositiveColor)';
      case 'warning': return 'var(--sapCriticalColor)';
      case 'critical': return 'var(--sapNegativeColor)';
    }
  };

  return (
    <div className="space-y-6">
      {/* KPI Strip */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="sap-card p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded" style={{ background: 'var(--sapAccentColor7)' }}>
              <CheckCircle2 size={20} style={{ color: 'white' }} />
            </div>
            <div>
              <div className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
                Last Successful Backup
              </div>
              <div className="text-lg font-bold" style={{ color: getStatusColor(kpis.lastSuccessfulBackup.status) }}>
                {kpis.lastSuccessfulBackup.ageHours}h ago
              </div>
            </div>
          </div>
          <div className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
            {formatDate(kpis.lastSuccessfulBackup.date)}
          </div>
        </div>

        <div className="sap-card p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded" style={{ background: 'var(--sapAccentColor6)' }}>
              <Database size={20} style={{ color: 'white' }} />
            </div>
            <div>
              <div className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
                Total Backups
              </div>
              <div className="text-lg font-bold" style={{ color: 'var(--sapTextColor)' }}>
                {kpis.totalBackups}
              </div>
            </div>
          </div>
          <div className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
            {kpis.storageUsedGB.toFixed(1)} GB used
          </div>
        </div>

        <div className="sap-card p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded" style={{ background: 'var(--sapAccentColor1)' }}>
              <Clock size={20} style={{ color: 'white' }} />
            </div>
            <div>
              <div className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
                Next Scheduled
              </div>
              <div className="text-lg font-bold" style={{ color: 'var(--sapTextColor)' }}>
                {formatDate(kpis.nextScheduledBackup)}
              </div>
            </div>
          </div>
          <div className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
            Daily database backup
          </div>
        </div>

        <div className="sap-card p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded" style={{ background: 'var(--sapAccentColor8)' }}>
              <Shield size={20} style={{ color: 'white' }} />
            </div>
            <div>
              <div className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
                Last Restore Test
              </div>
              <div className="text-lg font-bold" style={{ 
                color: kpis.lastRestoreTest.status === 'passed' 
                  ? 'var(--sapPositiveColor)' 
                  : kpis.lastRestoreTest.status === 'failed'
                  ? 'var(--sapNegativeColor)'
                  : 'var(--sapContent_LabelColor)'
              }}>
                {kpis.lastRestoreTest.status === 'never' ? 'Never' : formatDate(kpis.lastRestoreTest.date)}
              </div>
            </div>
          </div>
          <div className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
            {kpis.lastRestoreTest.status === 'passed' ? '✓ Passed' : kpis.lastRestoreTest.status === 'failed' ? '✗ Failed' : 'Not tested'}
          </div>
        </div>
      </div>

      {/* Storage & Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="sap-card p-4">
          <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--sapTextColor)' }}>
            Storage Usage
          </h3>
          <div className="mb-2">
            <div className="flex items-center justify-between text-xs mb-1">
              <span style={{ color: 'var(--sapContent_LabelColor)' }}>Used</span>
              <span style={{ color: 'var(--sapTextColor)' }}>
                {kpis.storageUsedGB.toFixed(1)} GB / {(kpis.storageUsedGB + kpis.storageRemainingGB).toFixed(1)} GB
              </span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--sapProgress_Background)' }}>
              <div 
                className="h-full rounded-full"
                style={{ 
                  width: `${(kpis.storageUsedGB / (kpis.storageUsedGB + kpis.storageRemainingGB)) * 100}%`,
                  background: 'var(--sapProgress_Value_InformationBackground)'
                }}
              />
            </div>
          </div>
          <div className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
            {kpis.storageRemainingGB.toFixed(1)} GB remaining
          </div>
        </div>

        <div className="sap-card p-4">
          <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--sapTextColor)' }}>
            Alerts
          </h3>
          <div className="space-y-2">
            {kpis.failedBackupsLast30Days > 0 && (
              <div className="flex items-center gap-2 p-2 rounded" style={{ background: 'var(--sapErrorBackground)' }}>
                <XCircle size={16} style={{ color: 'var(--sapNegativeColor)' }} />
                <span className="text-xs" style={{ color: 'var(--sapNegativeTextColor)' }}>
                  {kpis.failedBackupsLast30Days} failed backup{kpis.failedBackupsLast30Days > 1 ? 's' : ''} in last 30 days
                </span>
              </div>
            )}
            {kpis.backupsPendingValidation > 0 && (
              <div className="flex items-center gap-2 p-2 rounded" style={{ background: 'var(--sapWarningBackground)' }}>
                <AlertTriangle size={16} style={{ color: 'var(--sapCriticalColor)' }} />
                <span className="text-xs" style={{ color: 'var(--sapCriticalTextColor)' }}>
                  {kpis.backupsPendingValidation} backup{kpis.backupsPendingValidation > 1 ? 's' : ''} pending validation
                </span>
              </div>
            )}
            {kpis.failedBackupsLast30Days === 0 && kpis.backupsPendingValidation === 0 && (
              <div className="flex items-center gap-2 p-2 rounded" style={{ background: 'var(--sapSuccessBackground)' }}>
                <CheckCircle2 size={16} style={{ color: 'var(--sapPositiveColor)' }} />
                <span className="text-xs" style={{ color: 'var(--sapPositiveTextColor)' }}>
                  All systems operational
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="sap-card p-4">
        <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--sapTextColor)' }}>
          Recent Activity
        </h3>
        <div className="space-y-2">
          {backupHistory.slice(0, 5).map((backup) => (
            <div key={backup.id} className="flex items-center justify-between p-3 rounded" style={{ background: 'var(--sapList_Background)' }}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded" style={{ 
                  background: backup.status === 'completed' ? 'var(--sapSuccessBackground)' : 
                             backup.status === 'failed' ? 'var(--sapErrorBackground)' : 
                             'var(--sapNeutralBackground)'
                }}>
                  {backup.status === 'completed' ? <CheckCircle2 size={16} style={{ color: 'var(--sapPositiveColor)' }} /> :
                   backup.status === 'failed' ? <XCircle size={16} style={{ color: 'var(--sapNegativeColor)' }} /> :
                   <Clock size={16} style={{ color: 'var(--sapNeutralColor)' }} />}
                </div>
                <div>
                  <div className="text-sm font-medium" style={{ color: 'var(--sapTextColor)' }}>
                    {backup.backupCode}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
                    {backup.backupType} • {backup.createdByName} • {formatDate(backup.createdAt)}
                  </div>
                </div>
              </div>
              <StatusChip 
                status={backup.status} 
                type={
                  backup.status === 'completed' ? 'success' :
                  backup.status === 'failed' ? 'error' :
                  backup.status === 'running' ? 'info' : 'neutral'
                }
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── History Tab ─────────────────────────────────────────────────────────────

function HistoryTab() {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--sapTextColor)' }}>
        Backup History
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr style={{ background: 'var(--sapList_HeaderBackground)' }}>
              <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>
                Code
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>
                Type
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>
                Status
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>
                Created
              </th>
              <th className="text-right px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>
                Size
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>
                Validation
              </th>
              <th className="text-center px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {backupHistory.map((backup, index) => (
              <tr 
                key={backup.id}
                style={{ 
                  background: index % 2 === 0 ? 'var(--sapList_Background)' : 'var(--sapList_AlternatingBackground)',
                  borderBottom: '1px solid var(--sapList_BorderColor)'
                }}
              >
                <td className="px-4 py-3 text-sm font-mono" style={{ color: 'var(--sapList_TextColor)' }}>
                  {backup.backupCode}
                </td>
                <td className="px-4 py-3 text-sm" style={{ color: 'var(--sapList_TextColor)' }}>
                  {backup.backupType}
                </td>
                <td className="px-4 py-3">
                  <StatusChip 
                    status={backup.status} 
                    type={
                      backup.status === 'completed' ? 'success' :
                      backup.status === 'failed' ? 'error' :
                      backup.status === 'running' ? 'info' : 'neutral'
                    }
                  />
                </td>
                <td className="px-4 py-3 text-sm" style={{ color: 'var(--sapList_TextColor)' }}>
                  {formatDate(backup.createdAt)}
                </td>
                <td className="px-4 py-3 text-sm text-right" style={{ color: 'var(--sapList_TextColor)' }}>
                  {backup.fileSizeBytes ? `${(backup.fileSizeBytes / 1024 / 1024 / 1024).toFixed(2)} GB` : '—'}
                </td>
                <td className="px-4 py-3">
                  {backup.validationStatus ? (
                    <StatusChip 
                      status={backup.validationStatus} 
                      type={
                        backup.validationStatus === 'passed' ? 'success' :
                        backup.validationStatus === 'failed' ? 'error' : 'info'
                      }
                    />
                  ) : (
                    <span className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-2">
                    <button className="p-1 rounded hover:bg-[var(--sapButton_Hover_Background)]" title="View details">
                      <Eye size={16} style={{ color: 'var(--sapButton_TextColor)' }} />
                    </button>
                    <button className="p-1 rounded hover:bg-[var(--sapButton_Hover_Background)]" title="Download">
                      <Download size={16} style={{ color: 'var(--sapButton_TextColor)' }} />
                    </button>
                    {backup.isLocked ? (
                      <Lock size={16} style={{ color: 'var(--sapCriticalColor)' }} />
                    ) : (
                      <button className="p-1 rounded hover:bg-[var(--sapButton_Hover_Background)]" title="Lock">
                        <Unlock size={16} style={{ color: 'var(--sapButton_TextColor)' }} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Schedules Tab ───────────────────────────────────────────────────────────

function SchedulesTab() {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold" style={{ color: 'var(--sapTextColor)' }}>
          Backup Schedules
        </h3>
        <button
          className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium"
          style={{
            background: 'var(--sapButton_Emphasized_Background)',
            color: 'var(--sapButton_Emphasized_TextColor)'
          }}
        >
          <Plus size={16} />
          Add Schedule
        </button>
      </div>
      <div className="space-y-3">
        {backupSchedules.map((schedule) => (
          <div key={schedule.id} className="sap-card p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="text-sm font-semibold" style={{ color: 'var(--sapTextColor)' }}>
                    {schedule.scheduleName}
                  </h4>
                  {schedule.isActive ? (
                    <StatusChip status="Active" type="success" />
                  ) : (
                    <StatusChip status="Inactive" type="neutral" />
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div>
                    <div style={{ color: 'var(--sapContent_LabelColor)' }}>Type</div>
                    <div style={{ color: 'var(--sapTextColor)' }}>{schedule.backupType}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--sapContent_LabelColor)' }}>Schedule</div>
                    <div style={{ color: 'var(--sapTextColor)' }}>{schedule.cronExpression}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--sapContent_LabelColor)' }}>Retention</div>
                    <div style={{ color: 'var(--sapTextColor)' }}>{schedule.retentionDays} days</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--sapContent_LabelColor)' }}>Last Run</div>
                    <div style={{ color: 'var(--sapTextColor)' }}>
                      {schedule.lastRunAt ? formatDate(schedule.lastRunAt) : 'Never'}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 rounded hover:bg-[var(--sapButton_Hover_Background)]" title="Edit">
                  <Settings size={16} style={{ color: 'var(--sapButton_TextColor)' }} />
                </button>
                <button className="p-2 rounded hover:bg-[var(--sapButton_Hover_Background)]" title="Toggle">
                  {schedule.isActive ? (
                    <Pause size={16} style={{ color: 'var(--sapButton_TextColor)' }} />
                  ) : (
                    <Play size={16} style={{ color: 'var(--sapButton_TextColor)' }} />
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Restore Tab ─────────────────────────────────────────────────────────────

function RestoreTab() {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--sapTextColor)' }}>
        Restore History
      </h3>
      <div className="space-y-3">
        {restoreHistory.map((restore) => (
          <div key={restore.id} className="sap-card p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="text-sm font-semibold" style={{ color: 'var(--sapTextColor)' }}>
                    {restore.restoreCode}
                  </h4>
                  <StatusChip 
                    status={restore.status} 
                    type={
                      restore.status === 'completed' ? 'success' :
                      restore.status === 'failed' ? 'error' :
                      restore.status === 'running' ? 'info' : 'neutral'
                    }
                  />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div>
                    <div style={{ color: 'var(--sapContent_LabelColor)' }}>Backup</div>
                    <div style={{ color: 'var(--sapTextColor)' }}>{restore.backupCode}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--sapContent_LabelColor)' }}>Type</div>
                    <div style={{ color: 'var(--sapTextColor)' }}>{restore.restoreType}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--sapContent_LabelColor)' }}>Requested By</div>
                    <div style={{ color: 'var(--sapTextColor)' }}>{restore.requestedByName}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--sapContent_LabelColor)' }}>Date</div>
                    <div style={{ color: 'var(--sapTextColor)' }}>{formatDate(restore.requestedAt)}</div>
                  </div>
                </div>
                <div className="mt-2 text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
                  <strong>Justification:</strong> {restore.justification}
                </div>
              </div>
              <button className="p-2 rounded hover:bg-[var(--sapButton_Hover_Background)]" title="View details">
                <Eye size={16} style={{ color: 'var(--sapButton_TextColor)' }} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Audit Tab ───────────────────────────────────────────────────────────────

function AuditTab() {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--sapTextColor)' }}>
        Audit Trail
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr style={{ background: 'var(--sapList_HeaderBackground)' }}>
              <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>
                Action
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>
                Performed By
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>
                Date
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>
                Result
              </th>
            </tr>
          </thead>
          <tbody>
            {backupHistory.slice(0, 10).map((backup, index) => (
              <tr 
                key={index}
                style={{ 
                  background: index % 2 === 0 ? 'var(--sapList_Background)' : 'var(--sapList_AlternatingBackground)',
                  borderBottom: '1px solid var(--sapList_BorderColor)'
                }}
              >
                <td className="px-4 py-3 text-sm" style={{ color: 'var(--sapList_TextColor)' }}>
                  Backup {backup.status}
                </td>
                <td className="px-4 py-3 text-sm" style={{ color: 'var(--sapList_TextColor)' }}>
                  {backup.createdByName}
                </td>
                <td className="px-4 py-3 text-sm" style={{ color: 'var(--sapList_TextColor)' }}>
                  {formatDate(backup.createdAt)}
                </td>
                <td className="px-4 py-3">
                  <StatusChip 
                    status={backup.status === 'completed' ? 'Success' : backup.status === 'failed' ? 'Failure' : 'Pending'} 
                    type={
                      backup.status === 'completed' ? 'success' :
                      backup.status === 'failed' ? 'error' : 'neutral'
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Create Backup Modal ─────────────────────────────────────────────────────

function CreateBackupModal({ onClose }: { onClose: () => void }) {
  const [backupType, setBackupType] = useState<string>('database');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="sap-card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--sapTextColor)' }}>
            Create Backup
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--sapTextColor)' }}>
                Backup Type
              </label>
              <select
                value={backupType}
                onChange={(e) => setBackupType(e.target.value)}
                className="w-full px-3 py-2 rounded border"
                style={{
                  background: 'var(--sapField_Background)',
                  borderColor: 'var(--sapField_BorderColor)',
                  color: 'var(--sapField_TextColor)'
                }}
              >
                <option value="full">Full System</option>
                <option value="database">Database Only</option>
                <option value="files">Files Only</option>
                <option value="config">Configuration Only</option>
                <option value="project">Project-wise</option>
                <option value="module">Module-wise</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--sapTextColor)' }}>
                Notes (Optional)
              </label>
              <textarea
                rows={3}
                className="w-full px-3 py-2 rounded border"
                style={{
                  background: 'var(--sapField_Background)',
                  borderColor: 'var(--sapField_BorderColor)',
                  color: 'var(--sapField_TextColor)'
                }}
                placeholder="Add notes about this backup..."
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded text-sm font-medium"
              style={{
                background: 'var(--sapButton_Background)',
                color: 'var(--sapButton_TextColor)',
                border: '1px solid var(--sapButton_BorderColor)'
              }}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 rounded text-sm font-medium"
              style={{
                background: 'var(--sapButton_Emphasized_Background)',
                color: 'var(--sapButton_Emphasized_TextColor)'
              }}
            >
              Create Backup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Restore Wizard ──────────────────────────────────────────────────────────

function RestoreWizard({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(1);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="sap-card max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--sapTextColor)' }}>
            Restore Wizard
          </h2>

          {/* Step Indicator */}
          <div className="flex items-center justify-between mb-6">
            {[1, 2, 3, 4, 5].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{
                    background: step >= s ? 'var(--sapSelectedColor)' : 'var(--sapNeutralBackground)',
                    color: step >= s ? 'white' : 'var(--sapNeutralTextColor)'
                  }}
                >
                  {s}
                </div>
                {s < 5 && (
                  <div
                    className="w-12 h-0.5 mx-2"
                    style={{
                      background: step > s ? 'var(--sapSelectedColor)' : 'var(--sapNeutralBackground)'
                    }}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step Content */}
          {step === 1 && (
            <div>
              <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--sapTextColor)' }}>
                Select Backup
              </h3>
              <div className="space-y-2">
                {backupHistory.filter(b => b.status === 'completed').slice(0, 5).map((backup) => (
                  <div key={backup.id} className="p-3 rounded border cursor-pointer hover:bg-[var(--sapList_Hover_Background)]" style={{ borderColor: 'var(--sapField_BorderColor)' }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium" style={{ color: 'var(--sapTextColor)' }}>
                          {backup.backupCode}
                        </div>
                        <div className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
                          {backup.backupType} • {formatDate(backup.createdAt)}
                        </div>
                      </div>
                      <input type="radio" name="backup" className="rounded" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--sapTextColor)' }}>
                Review Impact
              </h3>
              <div className="p-4 rounded" style={{ background: 'var(--sapWarningBackground)' }}>
                <div className="flex items-start gap-2">
                  <AlertTriangle size={20} style={{ color: 'var(--sapCriticalColor)' }} />
                  <div>
                    <div className="text-sm font-semibold mb-1" style={{ color: 'var(--sapCriticalTextColor)' }}>
                      Warning: Data Loss
                    </div>
                    <div className="text-xs" style={{ color: 'var(--sapTextColor)' }}>
                      This restore will overwrite current data with data from the selected backup. 
                      All changes made after the backup date will be lost.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--sapTextColor)' }}>
                Justification
              </h3>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--sapTextColor)' }}>
                  Reason for Restore <span style={{ color: 'var(--sapField_RequiredColor)' }}>*</span>
                </label>
                <textarea
                  rows={4}
                  className="w-full px-3 py-2 rounded border"
                  style={{
                    background: 'var(--sapField_Background)',
                    borderColor: 'var(--sapField_BorderColor)',
                    color: 'var(--sapField_TextColor)'
                  }}
                  placeholder="Provide a detailed justification for this restore..."
                />
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--sapTextColor)' }}>
                Approval Required
              </h3>
              <div className="p-4 rounded" style={{ background: 'var(--sapInformationBackground)' }}>
                <div className="text-sm" style={{ color: 'var(--sapTextColor)' }}>
                  This restore requires approval from a second Super Admin. The request will be sent 
                  for approval after submission.
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div>
              <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--sapTextColor)' }}>
                Confirmation
              </h3>
              <div className="p-4 rounded mb-4" style={{ background: 'var(--sapErrorBackground)' }}>
                <div className="text-sm font-semibold mb-2" style={{ color: 'var(--sapNegativeTextColor)' }}>
                  Final Confirmation Required
                </div>
                <div className="text-xs mb-3" style={{ color: 'var(--sapTextColor)' }}>
                  Type the restore code and the phrase "RESTORE PRODUCTION" to confirm:
                </div>
                <input
                  type="text"
                  className="w-full px-3 py-2 rounded border mb-2"
                  style={{
                    background: 'var(--sapField_Background)',
                    borderColor: 'var(--sapField_BorderColor)',
                    color: 'var(--sapField_TextColor)'
                  }}
                  placeholder="Enter restore code"
                />
                <input
                  type="text"
                  className="w-full px-3 py-2 rounded border"
                  style={{
                    background: 'var(--sapField_Background)',
                    borderColor: 'var(--sapField_BorderColor)',
                    color: 'var(--sapField_TextColor)'
                  }}
                  placeholder="Type RESTORE PRODUCTION"
                />
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6">
            <button
              onClick={step > 1 ? () => setStep(step - 1) : onClose}
              className="px-4 py-2 rounded text-sm font-medium"
              style={{
                background: 'var(--sapButton_Background)',
                color: 'var(--sapButton_TextColor)',
                border: '1px solid var(--sapButton_BorderColor)'
              }}
            >
              {step > 1 ? 'Back' : 'Cancel'}
            </button>
            <button
              onClick={() => step < 5 ? setStep(step + 1) : onClose()}
              className="px-4 py-2 rounded text-sm font-medium"
              style={{
                background: 'var(--sapButton_Emphasized_Background)',
                color: 'var(--sapButton_Emphasized_TextColor)'
              }}
            >
              {step < 5 ? 'Next' : 'Submit Restore Request'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
