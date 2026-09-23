/**
 * Part 23 — Approval Centre Component
 * 
 * Unified approval queue where users decide everything awaiting them.
 * Features:
 * - Queue with grouping, sorting, filtering
 * - Detail pane with full decision context
 * - Six decision actions
 * - Bulk approval with safeguards
 * - Real-time counts
 */

import React, { useState, useEffect } from 'react';
import {
  ApprovalQueueItem,
  ApprovalDetail,
  ApprovalDecision,
  ApprovalGroupBy,
  ApprovalSortBy,
} from '../../platform/approval/types';
import { approvalCentreService } from '../../platform/approval/approval-centre-service';
import { Actor } from '../../platform/permission/actor';

interface ApprovalCentreProps {
  actor: Actor;
}

export const ApprovalCentre: React.FC<ApprovalCentreProps> = ({ actor }) => {
  const [queue, setQueue] = useState<ApprovalQueueItem[]>([]);
  const [selectedTask, setSelectedTask] = useState<ApprovalQueueItem | null>(null);
  const [detail, setDetail] = useState<ApprovalDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [groupBy, setGroupBy] = useState<ApprovalGroupBy>('urgency');
  const [sortBy, setSortBy] = useState<ApprovalSortBy>('sla_state');
  const [filters, setFilters] = useState<any>({});
  const [selectedForBulk, setSelectedForBulk] = useState<Set<number>>(new Set());
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [decisionDialog, setDecisionDialog] = useState<{
    task: ApprovalQueueItem;
    decision: ApprovalDecision;
  } | null>(null);

  useEffect(() => {
    loadQueue();
  }, [actor, groupBy, sortBy, filters]);

  useEffect(() => {
    if (selectedTask) {
      loadDetail(selectedTask.taskId);
    }
  }, [selectedTask]);

  const loadQueue = async () => {
    setLoading(true);
    try {
      const items = await approvalCentreService.getApprovalQueue(actor, filters, groupBy, sortBy);
      setQueue(items);
    } catch (error) {
      console.error('Failed to load approval queue:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDetail = async (taskId: number) => {
    setDetailLoading(true);
    try {
      const approvalDetail = await approvalCentreService.getApprovalDetail(taskId, actor);
      setDetail(approvalDetail);
    } catch (error) {
      console.error('Failed to load approval detail:', error);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleDecision = async (decision: ApprovalDecision) => {
    if (!selectedTask) return;

    try {
      await approvalCentreService.decide(selectedTask.taskId, decision, actor);
      setDecisionDialog(null);
      setSelectedTask(null);
      setDetail(null);
      await loadQueue();
    } catch (error) {
      console.error('Failed to process decision:', error);
      alert(error instanceof Error ? error.message : 'Failed to process decision');
    }
  };

  const handleBulkApprove = async () => {
    if (selectedForBulk.size === 0) return;

    try {
      const result = await approvalCentreService.bulkDecide(
        {
          taskIds: Array.from(selectedForBulk),
          decision: { type: 'APPROVE' },
          batchComment: 'Bulk approval',
        },
        actor
      );

      alert(`Bulk approval complete: ${result.successCount} succeeded, ${result.failureCount} failed`);
      setSelectedForBulk(new Set());
      setShowBulkDialog(false);
      await loadQueue();
    } catch (error) {
      console.error('Failed to bulk approve:', error);
      alert(error instanceof Error ? error.message : 'Failed to bulk approve');
    }
  };

  const toggleBulkSelect = (taskId: number) => {
    const newSelected = new Set(selectedForBulk);
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId);
    } else {
      newSelected.add(taskId);
    }
    setSelectedForBulk(newSelected);
  };

  const getSLAColor = (slaState: string): string => {
    switch (slaState) {
      case 'OVERDUE': return 'var(--sapNegativeColor, #bb0000)';
      case 'AT_RISK': return 'var(--sapCriticalColor, #e9730c)';
      case 'ON_TRACK': return 'var(--sapPositiveColor, #107e3e)';
      default: return 'var(--sapNeutralColor, #6a6d70)';
    }
  };

  const getPriorityIcon = (priority: string): string => {
    switch (priority) {
      case 'CRITICAL': return '🔴';
      case 'HIGH': return '🟠';
      case 'MEDIUM': return '🟡';
      case 'LOW': return '🟢';
      default: return '⚪';
    }
  };

  const formatValue = (value?: number, currency: string = 'INR'): string => {
    if (!value) return '—';
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(2)} L`;
    return `₹${value.toLocaleString('en-IN')}`;
  };

  return (
    <div className="approval-centre">
      {/* Header */}
      <div className="approval-header">
        <h1>Approval Centre</h1>
        <div className="approval-actions">
          <button
            className="bulk-approve-btn"
            onClick={() => setShowBulkDialog(true)}
            disabled={selectedForBulk.size === 0}
          >
            Bulk Approve ({selectedForBulk.size})
          </button>
          <button className="export-btn">Export</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="approval-tabs">
        <button className="tab active">
          Pending <span className="tab-count">{queue.filter(q => q.slaState !== 'OVERDUE').length}</span>
        </button>
        <button className="tab">
          At Risk <span className="tab-count">{queue.filter(q => q.slaState === 'AT_RISK').length}</span>
        </button>
        <button className="tab">
          Overdue <span className="tab-count">{queue.filter(q => q.slaState === 'OVERDUE').length}</span>
        </button>
        <button className="tab">History</button>
      </div>

      {/* Filters */}
      <div className="approval-filters">
        <select value={groupBy} onChange={(e) => setGroupBy(e.target.value as ApprovalGroupBy)}>
          <option value="urgency">Group by Urgency</option>
          <option value="document_type">Group by Document Type</option>
          <option value="project">Group by Project</option>
          <option value="value">Group by Value</option>
          <option value="requester">Group by Requester</option>
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as ApprovalSortBy)}>
          <option value="sla_state">Sort by SLA State</option>
          <option value="value">Sort by Value</option>
          <option value="age">Sort by Age</option>
          <option value="priority">Sort by Priority</option>
        </select>
      </div>

      {/* Main Content */}
      <div className="approval-content">
        {/* Queue List */}
        <div className="approval-queue">
          {loading ? (
            <div className="loading">Loading approvals...</div>
          ) : queue.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">✓</div>
              <div className="empty-text">No pending approvals</div>
            </div>
          ) : (
            queue.map((item) => (
              <div
                key={item.taskId}
                className={`queue-item ${selectedTask?.taskId === item.taskId ? 'selected' : ''}`}
                onClick={() => setSelectedTask(item)}
              >
                <div className="queue-item-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedForBulk.has(item.taskId)}
                    onChange={(e) => {
                      e.stopPropagation();
                      toggleBulkSelect(item.taskId);
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                <div className="queue-item-icon">
                  {getPriorityIcon(item.priority)}
                </div>
                <div className="queue-item-content">
                  <div className="queue-item-header">
                    <span className="document-number">{item.documentNumber}</span>
                    <span className="sla-indicator" style={{ color: getSLAColor(item.slaState) }}>
                      {item.slaState === 'OVERDUE' ? '⚠️ Overdue' : item.slaState === 'AT_RISK' ? '⏰ At Risk' : '✓ On Track'}
                    </span>
                  </div>
                  <div className="queue-item-title">{item.documentTitle}</div>
                  <div className="queue-item-meta">
                    <span>{item.projectName}</span>
                    {item.siteName && <span>• {item.siteName}</span>}
                    <span>• {item.value ? formatValue(item.value, item.currency) : '—'}</span>
                  </div>
                  <div className="queue-item-footer">
                    <span className="age">Age: {item.age}</span>
                    <span className="step">Step {item.stepNo}/{item.totalSteps}: {item.stepName}</span>
                  </div>
                  {item.riskFlags.length > 0 && (
                    <div className="risk-flags">
                      {item.riskFlags.map((flag, idx) => (
                        <span key={idx} className={`risk-flag risk-${flag.severity.toLowerCase()}`}>
                          {flag.message}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Detail Pane */}
        <div className="approval-detail">
          {!selectedTask ? (
            <div className="detail-empty">
              <div className="empty-icon">📋</div>
              <div className="empty-text">Select an approval to view details</div>
            </div>
          ) : detailLoading ? (
            <div className="loading">Loading details...</div>
          ) : detail ? (
            <>
              {/* Document Header */}
              <div className="detail-header">
                <h2>{detail.documentNumber}</h2>
                <div className="detail-title">{detail.documentTitle}</div>
                <div className="detail-meta">
                  <div>Project: {detail.projectName}</div>
                  {detail.siteName && <div>Site: {detail.siteName}</div>}
                  <div>Submitted by: {detail.submittedByName}</div>
                  <div>Submitted: {new Date(detail.submittedAt).toLocaleString()}</div>
                  {detail.dueAt && <div>Due: {new Date(detail.dueAt).toLocaleString()}</div>}
                </div>
              </div>

              {/* Budget Impact */}
              {detail.budgetImpact && (
                <div className="detail-section">
                  <h3>Budget Impact</h3>
                  <div className="budget-impact">
                    <div className="budget-row">
                      <span>Cost Code:</span>
                      <span>{detail.budgetImpact.costCode}</span>
                    </div>
                    <div className="budget-row">
                      <span>Budget:</span>
                      <span>{formatValue(detail.budgetImpact.budget)}</span>
                    </div>
                    <div className="budget-row">
                      <span>Committed:</span>
                      <span>{formatValue(detail.budgetImpact.committed)}</span>
                    </div>
                    <div className="budget-row">
                      <span>Actual:</span>
                      <span>{formatValue(detail.budgetImpact.actual)}</span>
                    </div>
                    <div className="budget-row">
                      <span>Available:</span>
                      <span>{formatValue(detail.budgetImpact.available)}</span>
                    </div>
                    <div className="budget-row highlight">
                      <span>After This:</span>
                      <span className={detail.budgetImpact.status === 'EXCEEDED' ? 'negative' : ''}>
                        {formatValue(detail.budgetImpact.afterThis)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Risk Flags */}
              {detail.riskFlags.length > 0 && (
                <div className="detail-section">
                  <h3>Risk Flags</h3>
                  <div className="risk-flags-list">
                    {detail.riskFlags.map((flag, idx) => (
                      <div key={idx} className={`risk-flag risk-${flag.severity.toLowerCase()}`}>
                        <span className="risk-severity">{flag.severity}</span>
                        <span className="risk-message">{flag.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Overrides Applied */}
              {detail.overridesApplied.length > 0 && (
                <div className="detail-section">
                  <h3>Overrides Applied</h3>
                  <div className="overrides-list">
                    {detail.overridesApplied.map((override, idx) => (
                      <div key={idx} className="override-item">
                        <div className="override-rule">{override.ruleCode}</div>
                        <div className="override-reason">{override.reason}</div>
                        <div className="override-by">By: {override.by}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Prior Decisions */}
              {detail.priorDecisions.length > 0 && (
                <div className="detail-section">
                  <h3>Approval History</h3>
                  <div className="approval-history">
                    {detail.priorDecisions.map((decision, idx) => (
                      <div key={idx} className="history-item">
                        <div className="history-step">{decision.step}</div>
                        <div className="history-by">{decision.by}</div>
                        <div className="history-date">{new Date(decision.at).toLocaleString()}</div>
                        <div className="history-decision">{decision.decision}</div>
                        {decision.note && <div className="history-note">{decision.note}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Requester Note */}
              {detail.requesterNote && (
                <div className="detail-section">
                  <h3>Requester's Note</h3>
                  <div className="requester-note">{detail.requesterNote}</div>
                </div>
              )}

              {/* Decision Panel */}
              <div className="decision-panel">
                <h3>Decision</h3>
                <div className="decision-actions">
                  {detail.allowedActions.map((action) => (
                    <button
                      key={action}
                      className={`decision-btn decision-${action.toLowerCase()}`}
                      onClick={() => setDecisionDialog({ task: detail, decision: { type: action } })}
                    >
                      {action.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>

      {/* Decision Dialog */}
      {decisionDialog && (
        <div className="dialog-overlay">
          <div className="dialog">
            <h3>{decisionDialog.decision.type.replace('_', ' ')}</h3>
            <div className="dialog-content">
              <p>
                {decisionDialog.decision.type === 'APPROVE' && 'Approve this document?'}
                {decisionDialog.decision.type === 'REJECT' && 'Reject this document? A reason is required.'}
                {decisionDialog.decision.type === 'RETURN' && 'Return for correction? A reason is required.'}
                {decisionDialog.decision.type === 'FORWARD' && 'Forward to another approver?'}
                {decisionDialog.decision.type === 'APPROVE_WITH_CONDITIONS' && 'Approve with conditions?'}
                {decisionDialog.decision.type === 'REQUEST_INFO' && 'Request additional information?'}
              </p>
              <textarea
                placeholder="Comment (required for reject/return)"
                value={decisionDialog.decision.note || ''}
                onChange={(e) => setDecisionDialog({
                  ...decisionDialog,
                  decision: { ...decisionDialog.decision, note: e.target.value }
                })}
              />
            </div>
            <div className="dialog-actions">
              <button onClick={() => setDecisionDialog(null)}>Cancel</button>
              <button
                className="primary"
                onClick={() => handleDecision(decisionDialog.decision)}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Approval Dialog */}
      {showBulkDialog && (
        <div className="dialog-overlay">
          <div className="dialog">
            <h3>Bulk Approval</h3>
            <div className="dialog-content">
              <p>You are about to approve {selectedForBulk.size} items.</p>
              <div className="bulk-list">
                {Array.from(selectedForBulk).map(taskId => {
                  const item = queue.find(q => q.taskId === taskId);
                  return item ? (
                    <div key={taskId} className="bulk-item">
                      <span>{item.documentNumber}</span>
                      <span>{item.documentTitle}</span>
                      <span>{item.value ? formatValue(item.value, item.currency) : '—'}</span>
                    </div>
                  ) : null;
                })}
              </div>
              <textarea
                placeholder="Batch comment (required)"
                onChange={(e) => {
                  // Store comment for bulk approval
                }}
              />
            </div>
            <div className="dialog-actions">
              <button onClick={() => setShowBulkDialog(false)}>Cancel</button>
              <button className="primary" onClick={handleBulkApprove}>
                Approve All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApprovalCentre;
