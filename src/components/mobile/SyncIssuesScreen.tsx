/**
 * Part 19 — Sync Issues Screen
 * 
 * Displays failed and rejected sync records with actions:
 * - Edit: Modify the record and retry
 * - Retry: Attempt sync again
 * - Discard: Remove from outbox
 * 
 * Shows:
 * - Record details (entity type, created at, attempts)
 * - Server error message
 * - Payload preview
 * - Clock skew warning if > 5 minutes
 */

import React, { useState, useEffect } from 'react';
import { SyncEngine, OfflineRecord } from '../../platform/offline/sync-engine';

interface SyncIssuesScreenProps {
  syncEngine: SyncEngine;
  onBack: () => void;
}

export const SyncIssuesScreen: React.FC<SyncIssuesScreenProps> = ({
  syncEngine,
  onBack,
}) => {
  const [issues, setIssues] = useState<OfflineRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState<OfflineRecord | null>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  // Load sync issues
  useEffect(() => {
    loadIssues();
  }, []);

  const loadIssues = async () => {
    setLoading(true);
    try {
      const syncIssues = await syncEngine.getSyncIssues();
      setIssues(syncIssues);
    } catch (error) {
      console.error('Failed to load sync issues:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle retry
  const handleRetry = async (record: OfflineRecord) => {
    setActionInProgress(record.local_id);
    try {
      // Reset attempts and status
      record.attempts = 0;
      record.status = 'PENDING';
      record.error = undefined;
      
      // Trigger sync
      await syncEngine.sync();
      
      // Reload issues
      await loadIssues();
    } catch (error) {
      console.error('Retry failed:', error);
    } finally {
      setActionInProgress(null);
    }
  };

  // Handle discard
  const handleDiscard = async (record: OfflineRecord) => {
    if (!confirm('Are you sure you want to discard this record? This action cannot be undone.')) {
      return;
    }

    setActionInProgress(record.local_id);
    try {
      // In production, would call syncEngine.discardRecord(record.local_id)
      // For now, just reload issues
      await loadIssues();
    } catch (error) {
      console.error('Discard failed:', error);
    } finally {
      setActionInProgress(null);
    }
  };

  // Handle edit
  const handleEdit = (record: OfflineRecord) => {
    setSelectedIssue(record);
    // In production, would open edit form based on entity_type
  };

  // Format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Format entity type
  const formatEntityType = (entityType: string): string => {
    return entityType
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Get status color
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'FAILED':
        return 'var(--sapNegativeColor, #bb0000)';
      case 'REJECTED':
        return 'var(--sapCriticalColor, #e9730c)';
      case 'PENDING':
        return 'var(--sapNeutralColor, #6a6d70)';
      default:
        return 'var(--sapNeutralColor, #6a6d70)';
    }
  };

  // Check if clock skew is significant
  const hasClockSkewWarning = (record: OfflineRecord): boolean => {
    return record.clock_skew_sec !== undefined && Math.abs(record.clock_skew_sec) > 300; // 5 minutes
  };

  if (loading) {
    return (
      <div className="sync-issues-screen loading">
        <div className="loading-spinner">Loading sync issues...</div>
      </div>
    );
  }

  return (
    <div className="sync-issues-screen">
      {/* Header */}
      <div className="screen-header">
        <button className="back-button" onClick={onBack}>
          ← Back
        </button>
        <h1>Sync Issues</h1>
        <button className="refresh-button" onClick={loadIssues}>
          🔄
        </button>
      </div>

      {/* Summary */}
      <div className="sync-summary">
        <div className="summary-item">
          <span className="summary-label">Total Issues:</span>
          <span className="summary-value">{issues.length}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Failed:</span>
          <span className="summary-value" style={{ color: 'var(--sapNegativeColor, #bb0000)' }}>
            {issues.filter((i) => i.status === 'FAILED').length}
          </span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Rejected:</span>
          <span className="summary-value" style={{ color: 'var(--sapCriticalColor, #e9730c)' }}>
            {issues.filter((i) => i.status === 'REJECTED').length}
          </span>
        </div>
      </div>

      {/* Issues list */}
      <div className="issues-list">
        {issues.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">✓</div>
            <div className="empty-text">No sync issues</div>
            <div className="empty-subtext">All offline records have been synced successfully</div>
          </div>
        ) : (
          issues.map((issue) => (
            <div
              key={issue.local_id}
              className="issue-card"
              style={{
                borderLeft: `4px solid ${getStatusColor(issue.status)}`,
              }}
            >
              {/* Header */}
              <div className="issue-header">
                <div className="issue-title">
                  <span className="entity-type">{formatEntityType(issue.entity_type)}</span>
                  <span
                    className="status-badge"
                    style={{
                      backgroundColor: getStatusColor(issue.status),
                      color: '#fff',
                    }}
                  >
                    {issue.status}
                  </span>
                </div>
                <div className="issue-meta">
                  <span className="created-at">{formatDate(issue.created_at)}</span>
                  {issue.attempts > 0 && (
                    <span className="attempts">
                      {issue.attempts} attempt{issue.attempts !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>

              {/* Clock skew warning */}
              {hasClockSkewWarning(issue) && (
                <div className="clock-skew-warning">
                  ⚠️ Device clock is {Math.abs(issue.clock_skew_sec! / 60).toFixed(0)} minutes{' '}
                  {issue.clock_skew_sec! > 0 ? 'ahead' : 'behind'} server time
                </div>
              )}

              {/* Error message */}
              {issue.error && (
                <div className="error-message">
                  <strong>Error:</strong> {issue.error}
                </div>
              )}

              {/* Payload preview */}
              <div className="payload-preview">
                <strong>Payload:</strong>
                <pre>{JSON.stringify(issue.payload, null, 2).substring(0, 200)}...</pre>
              </div>

              {/* Actions */}
              <div className="issue-actions">
                <button
                  className="action-button edit"
                  onClick={() => handleEdit(issue)}
                  disabled={actionInProgress === issue.local_id}
                >
                  ✏️ Edit
                </button>
                <button
                  className="action-button retry"
                  onClick={() => handleRetry(issue)}
                  disabled={actionInProgress === issue.local_id}
                >
                  🔄 Retry
                </button>
                <button
                  className="action-button discard"
                  onClick={() => handleDiscard(issue)}
                  disabled={actionInProgress === issue.local_id}
                >
                  🗑️ Discard
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit modal (simplified) */}
      {selectedIssue && (
        <div className="edit-modal">
          <div className="modal-content">
            <h2>Edit {formatEntityType(selectedIssue.entity_type)}</h2>
            <div className="modal-body">
              <p>Edit form would be rendered here based on entity type.</p>
              <p>For now, showing payload:</p>
              <textarea
                value={JSON.stringify(selectedIssue.payload, null, 2)}
                onChange={(e) => {
                  try {
                    selectedIssue.payload = JSON.parse(e.target.value);
                  } catch (error) {
                    // Invalid JSON, ignore
                  }
                }}
                style={{
                  width: '100%',
                  height: '300px',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                }}
              />
            </div>
            <div className="modal-actions">
              <button onClick={() => setSelectedIssue(null)}>Cancel</button>
              <button
                onClick={() => {
                  // Save changes and retry
                  handleRetry(selectedIssue);
                  setSelectedIssue(null);
                }}
              >
                Save & Retry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SyncIssuesScreen;
