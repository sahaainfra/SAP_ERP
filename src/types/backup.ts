/**
 * Backup & Restore Types - Part 9
 * 
 * Type definitions for backup operations, restore workflows, schedules, and audit
 */

// ─── Backup Types ────────────────────────────────────────────────────────────

export type BackupType = 
  | 'full'
  | 'database'
  | 'files'
  | 'config'
  | 'project'
  | 'module'
  | 'incremental'
  | 'differential';

export type BackupTriggerType = 'manual' | 'scheduled' | 'pre_restore' | 'pre_upgrade' | 'api';

export type BackupStatus = 
  | 'queued'
  | 'running'
  | 'validating'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'expired'
  | 'deleted';

export type ValidationStatus = 'pending' | 'passed' | 'failed';

export interface Backup {
  id: number;
  backupCode: string;
  backupType: BackupType;
  triggerType: BackupTriggerType;
  scheduleId?: number;
  scopeJson?: any;
  companyId?: number;
  status: BackupStatus;
  progressPercent: number;
  currentStage?: string;
  startedAt?: string;
  completedAt?: string;
  durationSeconds?: number;
  filePath?: string;
  fileName?: string;
  fileSizeBytes?: number;
  compressedSizeBytes?: number;
  compressionRatio?: number;
  checksumSha256?: string;
  encryptionAlgorithm?: string;
  encryptionKeyId?: string;
  tableCount?: number;
  rowCount?: number;
  fileCount?: number;
  schemaVersion?: string;
  appVersion?: string;
  dbEngineVersion?: string;
  manifestJson?: any;
  validationStatus?: ValidationStatus;
  validationDetails?: any;
  validatedAt?: string;
  retentionUntil?: string;
  isLocked: boolean;
  lockReason?: string;
  errorMessage?: string;
  errorStack?: string;
  createdBy: number;
  createdByName: string;
  createdAt: string;
  notes?: string;
}

// ─── Backup Schedule ─────────────────────────────────────────────────────────

export type StorageTarget = 'local' | 's3' | 'azure' | 'gcs' | 'sftp';

export interface BackupSchedule {
  id: number;
  scheduleName: string;
  backupType: BackupType;
  scopeJson?: any;
  cronExpression: string;
  timezone: string;
  retentionDays: number;
  retentionCount?: number;
  storageTarget: StorageTarget;
  storageConfigId?: number;
  notifyOnSuccess: boolean;
  notifyOnFailure: boolean;
  notifyUserIds?: number[];
  isActive: boolean;
  lastRunAt?: string;
  lastRunStatus?: BackupStatus;
  nextRunAt?: string;
  consecutiveFailures: number;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Backup Download ─────────────────────────────────────────────────────────

export type DownloadStatus = 'pending' | 'approved' | 'downloaded' | 'expired' | 'revoked' | 'denied';

export interface BackupDownload {
  id: number;
  backupId: number;
  token: string;
  requestedBy: number;
  requestedByName: string;
  requestedAt: string;
  expiresAt: string;
  reason: string;
  approvedBy?: number;
  approvedAt?: string;
  downloadedAt?: string;
  downloadIp?: string;
  downloadAgent?: string;
  bytesServed?: number;
  status: DownloadStatus;
}

// ─── Restore ─────────────────────────────────────────────────────────────────

export type RestoreType = 'full' | 'project' | 'module' | 'table' | 'point_in_time';

export type TargetEnvironment = 'production' | 'staging' | 'sandbox';

export type RestoreStatus = 
  | 'requested'
  | 'approved'
  | 'rejected'
  | 'validating'
  | 'safety_backup'
  | 'running'
  | 'verifying'
  | 'completed'
  | 'failed'
  | 'rolled_back'
  | 'cancelled';

export interface Restore {
  id: number;
  restoreCode: string;
  backupId: number;
  backupCode: string;
  restoreType: RestoreType;
  scopeJson?: any;
  targetEnvironment: TargetEnvironment;
  status: RestoreStatus;
  progressPercent: number;
  currentStage?: string;
  requestedBy: number;
  requestedByName: string;
  requestedAt: string;
  justification: string;
  approvedBy?: number;
  approvedAt?: string;
  approvalNote?: string;
  rejectedBy?: number;
  rejectedAt?: string;
  rejectionReason?: string;
  preRestoreBackupId?: number;
  validationReport?: any;
  startedAt?: string;
  completedAt?: string;
  durationSeconds?: number;
  rowsRestored?: number;
  tablesRestored?: number;
  verificationReport?: any;
  errorMessage?: string;
  rollbackPerformed: boolean;
  rollbackAt?: string;
  createdAt: string;
}

// ─── Storage Target ──────────────────────────────────────────────────────────

export interface StorageTargetConfig {
  id: number;
  targetName: string;
  targetType: StorageTarget;
  configJson: any;
  credentialRef: string;
  isPrimary: boolean;
  isActive: boolean;
  lastTestedAt?: string;
  lastTestOk?: boolean;
  createdAt: string;
}

// ─── Backup Audit ────────────────────────────────────────────────────────────

export type BackupAuditAction = 
  | 'created'
  | 'started'
  | 'completed'
  | 'failed'
  | 'validated'
  | 'download_requested'
  | 'download_approved'
  | 'download_denied'
  | 'downloaded'
  | 'deleted'
  | 'locked'
  | 'unlocked'
  | 'restore_requested'
  | 'restore_approved'
  | 'restore_rejected'
  | 'restore_completed'
  | 'restore_failed'
  | 'rolled_back'
  | 'schedule_changed'
  | 'access_denied';

export type AuditResult = 'success' | 'failure' | 'denied';

export interface BackupAudit {
  id: number;
  backupId?: number;
  restoreId?: number;
  action: BackupAuditAction;
  performedBy: number;
  performedByName: string;
  performedAt: string;
  ipAddress?: string;
  userAgent?: string;
  detailsJson?: any;
  result: AuditResult;
}

// ─── Dashboard KPIs ──────────────────────────────────────────────────────────

export interface BackupDashboardKPIs {
  lastSuccessfulBackup: {
    date: string;
    ageHours: number;
    status: 'good' | 'warning' | 'critical';
  };
  totalBackups: number;
  storageUsedGB: number;
  storageRemainingGB: number;
  nextScheduledBackup: string;
  lastRestoreTest: {
    date: string;
    status: 'passed' | 'failed' | 'never';
  };
  failedBackupsLast30Days: number;
  backupsPendingValidation: number;
}

// ─── API Request/Response Types ──────────────────────────────────────────────

export interface CreateBackupRequest {
  backupType: BackupType;
  scopeJson?: any;
  storageTarget?: StorageTarget;
  retentionDays?: number;
  notes?: string;
}

export interface RequestDownloadRequest {
  backupId: number;
  reason: string;
}

export interface RequestRestoreRequest {
  backupId: number;
  restoreType: RestoreType;
  scopeJson?: any;
  targetEnvironment: TargetEnvironment;
  justification: string;
}

export interface ApproveRestoreRequest {
  restoreId: number;
  approvalNote?: string;
}

export interface ExecuteRestoreRequest {
  restoreId: number;
  confirmationCode: string;
  confirmationPhrase: string;
}
