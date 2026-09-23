/**
 * Part 23 — Exception Centre Component
 * 
 * Management view of all exceptions across the organization.
 * Features:
 * - Four exception categories (financial, operational, compliance, process)
 * - Ranked by impact, severity, age
 * - Assign, resolve, accept actions
 * - Trend visualization
 */

import React, { useState, useEffect } from 'react';
import {
  Exception,
  ExceptionCategory,
  ExceptionStatus,
  ExceptionTrend,
} from '../../platform/approval/types';
import { exceptionCentreService } from '../../platform/approval/exception-centre-service';
import { Actor } from '../../platform/permission/actor';

interface ExceptionCentreProps {
  actor: Actor;
}

export const ExceptionCentre: React.FC<ExceptionCentreProps> = ({ actor }) => {
  const [exceptions, setExceptions] = useState<Exception[]>([]);
  const [trend, setTrend] = useState<ExceptionTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<{
    category?: ExceptionCategory;
    status?: ExceptionStatus;
    severity?: string;
    projectId?: number;
  }>({});
  const [selectedException, setSelectedException] = useState<Exception | null>(null);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [showResolveDialog, setShowResolveDialog] = useState(false);
  const [showAcceptDialog, setShowAcceptDialog] = useState(false);

  useEffect(() => {
    loadExceptions();
    loadTrend();
  }, [actor, filters]);

  const loadExceptions = async () => {
    setLoading(true);
    try {
      const data = await exceptionCentreService.getExceptions(actor, filters);
      setExceptions(data);
    } catch (error) {
      console.error('Failed to load exceptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTrend = async () => {
    try {
      const data = await exceptionCentreService.getExceptionTrend(actor, 6);
      setTrend(data);
    } catch (error) {
      console.error('Failed to load trend:', error);
    }
  };

  const handleAssign = async (ownerUserId: number, targetDate: string) => {
    if (!selectedException) return;

    try {
      await exceptionCentreService.assignException(
        selectedException.id,
        ownerUserId,
        targetDate,
        actor
      );
      setShowAssignDialog(false);
      setSelectedException(null);
      await loadExceptions();
    } catch (error) {
      console.error('Failed to assign exception:', error);
      alert(error instanceof Error ? error.message : 'Failed to assign exception');
    }
  };

  const handleResolve = async (resolutionNote: string) => {
    if (!selectedException) return;

    try {
      await exceptionCentreService.resolveException(
        selectedException.id,
        resolutionNote,
        actor
      );
      setShowResolveDialog(false);
      setSelectedException(null);
      await loadExceptions();
    } catch (error) {
      console.error('Failed to resolve exception:', error);
      alert(error instanceof Error ? error.message : 'Failed to resolve exception');
    }
  };

  const handleAccept = async (justification: string, expiresAt: string) => {
    if (!selectedException) return;

    try {
      await exceptionCentreService.acceptException(
        selectedException.id,
        justification,
        expiresAt,
        actor
      );
      setShowAcceptDialog(false);
      setSelectedException(null);
      await loadExceptions();
    } catch (error) {
      console.error('Failed to accept exception:', error);
      alert(error instanceof Error ? error.message : 'Failed to accept exception');
    }
  };

  const getCategoryIcon = (category: ExceptionCategory): string => {
    switch (category) {
      case 'FINANCIAL': return '💰';
      case 'OPERATIONAL': return '⚙️';
      case 'COMPLIANCE': return '📋';
      case 'PROCESS': return '🔄';
      default: return '⚠️';
    }
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'CRITICAL': return 'var(--sapNegativeColor, #bb0000)';
      case 'HIGH': return 'var(--sapCriticalColor, #e9730c)';
      case 'MEDIUM': return 'var(--sapNeutralColor, #6a6d70)';
      case 'LOW': return 'var(--sapPositiveColor, #107e3e)';
      default: return 'var(--sapNeutralColor, #6a6d70)';
    }
  };

  const getStatusBadge = (status: ExceptionStatus): string => {
    switch (status) {
      case 'OPEN': return '🔴 Open';
      case 'ASSIGNED': return '🟡 Assigned';
      case 'IN_PROGRESS': return '🔵 In Progress';
      case 'RESOLVED': return '🟢 Resolved';
      case 'ACCEPTED': return '⚪ Accepted';
      case 'ESCALATED': return '🟠 Escalated';
      default: return status;
    }
  };

  const formatImpactValue = (value?: number): string => {
    if (!value) return '—';
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(2)} L`;
    return `₹${value.toLocaleString('en-IN')}`;
  };

  const formatAge = (raisedAt: string): string => {
    const now = new Date();
    const raised = new Date(raisedAt);
    const diffMs = now.getTime() - raised.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffDays > 0) return `${diffDays}d`;
    if (diffHours > 0) return `${diffHours}h`;
    return '< 1h';
  };

  return (
    <div className="exception-centre">
      {/* Header */}
      <div className="exception-header">
        <h1>Exception Centre</h1>
        <div className="exception-summary">
          <div className="summary-item">
            <span className="summary-label">Open:</span>
            <span className="summary-value">{exceptions.filter(e => e.status === 'OPEN').length}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Critical:</span>
            <span className="summary-value critical">{exceptions.filter(e => e.severity === 'CRITICAL').length}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Total Impact:</span>
            <span className="summary-value">
              {formatImpactValue(exceptions.reduce((sum, e) => sum + (e.impactValue || 0), 0))}
            </span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="exception-filters">
        <select
          value={filters.category || ''}
          onChange={(e) => setFilters({ ...filters, category: e.target.value as ExceptionCategory || undefined })}
        >
          <option value="">All Categories</option>
          <option value="FINANCIAL">Financial</option>
          <option value="OPERATIONAL">Operational</option>
          <option value="COMPLIANCE">Compliance</option>
          <option value="PROCESS">Process</option>
        </select>
        <select
          value={filters.status || ''}
          onChange={(e) => setFilters({ ...filters, status: e.target.value as ExceptionStatus || undefined })}
        >
          <option value="">All Statuses</option>
          <option value="OPEN">Open</option>
          <option value="ASSIGNED">Assigned</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="RESOLVED">Resolved</option>
          <option value="ACCEPTED">Accepted</option>
        </select>
        <select
          value={filters.severity || ''}
          onChange={(e) => setFilters({ ...filters, severity: e.target.value || undefined })}
        >
          <option value="">All Severities</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
      </div>

      {/* Main Content */}
      <div className="exception-content">
        {/* Exception List */}
        <div className="exception-list">
          {loading ? (
            <div className="loading">Loading exceptions...</div>
          ) : exceptions.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">✓</div>
              <div className="empty-text">No exceptions found</div>
            </div>
          ) : (
            exceptions.map((exception) => (
              <div
                key={exception.id}
                className={`exception-item ${selectedException?.id === exception.id ? 'selected' : ''}`}
                onClick={() => setSelectedException(exception)}
              >
                <div className="exception-icon">{getCategoryIcon(exception.category)}</div>
                <div className="exception-content">
                  <div className="exception-header-row">
                    <span className="exception-code">{exception.code}</span>
                    <span className="exception-severity" style={{ color: getSeverityColor(exception.severity) }}>
                      {exception.severity}
                    </span>
                    <span className="exception-status">{getStatusBadge(exception.status)}</span>
                  </div>
                  <div className="exception-title">{exception.title}</div>
                  <div className="exception-description">{exception.description}</div>
                  <div className="exception-meta">
                    {exception.projectName && <span>Project: {exception.projectName}</span>}
                    {exception.impactValue && <span>Impact: {formatImpactValue(exception.impactValue)}</span>}
                    <span>Age: {formatAge(exception.raisedAt)}</span>
                    {exception.ownerName && <span>Owner: {exception.ownerName}</span>}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Exception Detail */}
        <div className="exception-detail">
          {!selectedException ? (
            <div className="detail-empty">
              <div className="empty-icon">⚠️</div>
              <div className="empty-text">Select an exception to view details</div>
            </div>
          ) : (
            <>
              <div className="detail-header">
                <div className="detail-icon">{getCategoryIcon(selectedException.category)}</div>
                <div className="detail-info">
                  <h2>{selectedException.title}</h2>
                  <div className="detail-code">{selectedException.code}</div>
                  <div className="detail-badges">
                    <span className="badge severity" style={{ backgroundColor: getSeverityColor(selectedException.severity) }}>
                      {selectedException.severity}
                    </span>
                    <span className="badge status">{getStatusBadge(selectedException.status)}</span>
                    <span className="badge category">{selectedException.category}</span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h3>Description</h3>
                <p>{selectedException.description}</p>
              </div>

              {selectedException.impactDescription && (
                <div className="detail-section">
                  <h3>Impact</h3>
                  <div className="impact-details">
                    {selectedException.impactValue && (
                      <div className="impact-row">
                        <span>Financial Impact:</span>
                        <span className="impact-value">{formatImpactValue(selectedException.impactValue)}</span>
                      </div>
                    )}
                    <div className="impact-row">
                      <span>Description:</span>
                      <span>{selectedException.impactDescription}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="detail-section">
                <h3>Context</h3>
                <div className="context-details">
                  {selectedException.projectName && (
                    <div className="context-row">
                      <span>Project:</span>
                      <span>{selectedException.projectName}</span>
                    </div>
                  )}
                  <div className="context-row">
                    <span>Raised:</span>
                    <span>{new Date(selectedException.raisedAt).toLocaleString()}</span>
                  </div>
                  <div className="context-row">
                    <span>Age:</span>
                    <span>{formatAge(selectedException.raisedAt)}</span>
                  </div>
                  {selectedException.ownerName && (
                    <div className="context-row">
                      <span>Owner:</span>
                      <span>{selectedException.ownerName}</span>
                    </div>
                  )}
                  {selectedException.targetResolutionDate && (
                    <div className="context-row">
                      <span>Target Resolution:</span>
                      <span>{new Date(selectedException.targetResolutionDate).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>

              {selectedException.proposedActions.length > 0 && (
                <div className="detail-section">
                  <h3>Proposed Actions</h3>
                  <div className="actions-list">
                    {selectedException.proposedActions.map((action, idx) => (
                      <button
                        key={idx}
                        className="action-button"
                        onClick={() => {
                          if (action.route) {
                            window.location.href = action.route;
                          }
                        }}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="detail-section">
                <h3>Management Actions</h3>
                <div className="management-actions">
                  <button onClick={() => setShowAssignDialog(true)}>Assign Owner</button>
                  <button onClick={() => setShowResolveDialog(true)}>Resolve</button>
                  <button onClick={() => setShowAcceptDialog(true)}>Accept as Known</button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Trend Chart */}
      <div className="exception-trend">
        <h3>Exception Trend (Last 6 Months)</h3>
        <div className="trend-chart">
          <svg width="100%" height="200" viewBox="0 0 600 200">
            {/* Raised line */}
            <polyline
              fill="none"
              stroke="var(--sapNegativeColor, #bb0000)"
              strokeWidth="2"
              points={trend.map((t, i) => {
                const x = (i / (trend.length - 1)) * 560 + 20;
                const y = 180 - (t.raised / 30) * 160;
                return `${x},${y}`;
              }).join(' ')}
            />
            {/* Resolved line */}
            <polyline
              fill="none"
              stroke="var(--sapPositiveColor, #107e3e)"
              strokeWidth="2"
              points={trend.map((t, i) => {
                const x = (i / (trend.length - 1)) * 560 + 20;
                const y = 180 - (t.resolved / 30) * 160;
                return `${x},${y}`;
              }).join(' ')}
            />
            {/* Labels */}
            {trend.map((t, i) => {
              const x = (i / (trend.length - 1)) * 560 + 20;
              return (
                <text key={i} x={x} y="195" textAnchor="middle" fontSize="10">
                  {t.period}
                </text>
              );
            })}
          </svg>
          <div className="trend-legend">
            <div className="legend-item">
              <span className="legend-color" style={{ backgroundColor: 'var(--sapNegativeColor, #bb0000)' }}></span>
              <span>Raised</span>
            </div>
            <div className="legend-item">
              <span className="legend-color" style={{ backgroundColor: 'var(--sapPositiveColor, #107e3e)' }}></span>
              <span>Resolved</span>
            </div>
          </div>
        </div>
      </div>

      {/* Assign Dialog */}
      {showAssignDialog && selectedException && (
        <div className="dialog-overlay">
          <div className="dialog">
            <h3>Assign Owner</h3>
            <div className="dialog-content">
              <label>
                Owner:
                <input type="number" placeholder="User ID" />
              </label>
              <label>
                Target Resolution Date:
                <input type="date" />
              </label>
            </div>
            <div className="dialog-actions">
              <button onClick={() => setShowAssignDialog(false)}>Cancel</button>
              <button className="primary" onClick={() => handleAssign(1, new Date().toISOString())}>
                Assign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resolve Dialog */}
      {showResolveDialog && selectedException && (
        <div className="dialog-overlay">
          <div className="dialog">
            <h3>Resolve Exception</h3>
            <div className="dialog-content">
              <label>
                Resolution Note:
                <textarea placeholder="Explain how the exception was resolved" rows={4} />
              </label>
            </div>
            <div className="dialog-actions">
              <button onClick={() => setShowResolveDialog(false)}>Cancel</button>
              <button className="primary" onClick={() => handleResolve('Resolved')}>
                Resolve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Accept Dialog */}
      {showAcceptDialog && selectedException && (
        <div className="dialog-overlay">
          <div className="dialog">
            <h3>Accept as Known Exception</h3>
            <div className="dialog-content">
              <label>
                Justification:
                <textarea placeholder="Explain why this exception is accepted" rows={4} />
              </label>
              <label>
                Expires At:
                <input type="date" />
              </label>
            </div>
            <div className="dialog-actions">
              <button onClick={() => setShowAcceptDialog(false)}>Cancel</button>
              <button className="primary" onClick={() => handleAccept('Accepted', new Date().toISOString())}>
                Accept
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExceptionCentre;
