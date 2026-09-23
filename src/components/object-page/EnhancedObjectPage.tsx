/**
 * Part 22 — Enhanced Object Page Component
 * 
 * Universal object page for all business entities with:
 * - Collapsible header with key facts
 * - Anchor navigation for sections
 * - Permission-based section visibility
 * - Action toolbar with state-based restrictions
 * - Document chain integration
 * - Confirmation dialogs for irreversible actions
 */

import React, { useState, useEffect } from 'react';
import { ObjectPageConfig, ObjectPageSection, ObjectPageAction } from '../../platform/dashboard/role-dashboard-types';
import { DocumentChain } from '../../platform/dashboard/role-dashboard-types';
import { documentChainService } from '../../platform/dashboard/document-chain-service';
import { DocumentChainGraph } from '../document-chain/DocumentChainGraph';
import { Actor } from '../../platform/permission/actor';

interface EnhancedObjectPageProps {
  entityType: string;
  entityId: number;
  config: ObjectPageConfig;
  actor: Actor;
  data: any;
  onAction: (action: string, confirmation?: string) => Promise<void>;
  onNavigate?: (route: string) => void;
}

export const EnhancedObjectPage: React.FC<EnhancedObjectPageProps> = ({
  entityType,
  entityId,
  config,
  actor,
  data,
  onAction,
  onNavigate,
}) => {
  const [activeSection, setActiveSection] = useState<string>(config.sections[0]?.id || '');
  const [documentChain, setDocumentChain] = useState<DocumentChain | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [confirmationDialog, setConfirmationDialog] = useState<{
    action: ObjectPageAction;
    documentNumber: string;
  } | null>(null);
  const [headerCollapsed, setHeaderCollapsed] = useState(false);

  useEffect(() => {
    loadDocumentChain();
  }, [entityType, entityId, actor]);

  useEffect(() => {
    // Handle scroll to collapse header
    const handleScroll = () => {
      setHeaderCollapsed(window.scrollY > 200);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const loadDocumentChain = async () => {
    try {
      const chain = await documentChainService.getDocumentChain(entityType, entityId, actor);
      setDocumentChain(chain);
    } catch (error) {
      console.error('Failed to load document chain:', error);
    }
  };

  // Filter sections by permission
  const visibleSections = config.sections.filter(section => {
    if (!section.permissionKey) return true;
    return actor.can(section.permissionKey, data.projectId);
  });

  // Filter actions by permission and state
  const visibleActions = config.actions.filter(action => {
    // Check permission
    if (!actor.can(action.permissionKey, data.projectId)) {
      return false;
    }

    // Check state restrictions
    if (action.stateRestrictions && !action.stateRestrictions.includes(data.status)) {
      return false;
    }

    return true;
  });

  // Handle action with confirmation
  const handleAction = async (action: ObjectPageAction) => {
    if (action.requiresConfirmation) {
      if (action.requiresDocumentNumber) {
        setConfirmationDialog({ action, documentNumber: '' });
      } else {
        const confirmed = window.confirm(`Are you sure you want to ${action.label}?`);
        if (confirmed) {
          await onAction(action.name);
        }
      }
    } else {
      await onAction(action.name);
    }
  };

  // Handle confirmation dialog submit
  const handleConfirmationSubmit = async () => {
    if (!confirmationDialog) return;

    const { action, documentNumber } = confirmationDialog;
    
    if (documentNumber !== data.documentNumber) {
      alert('Document number does not match. Please enter the correct document number.');
      return;
    }

    await onAction(action.name, documentNumber);
    setConfirmationDialog(null);
  };

  const getStatusColor = (status: string): string => {
    const statusColors: Record<string, string> = {
      'DRAFT': 'var(--sapNeutralColor, #6a6d70)',
      'SUBMITTED': 'var(--sapInformativeColor, #0a6ed1)',
      'PENDING_APPROVAL': 'var(--sapCriticalColor, #e9730c)',
      'APPROVED': 'var(--sapPositiveColor, #107e3e)',
      'RELEASED': 'var(--sapPositiveColor, #107e3e)',
      'REJECTED': 'var(--sapNegativeColor, #bb0000)',
      'CANCELLED': 'var(--sapNegativeColor, #bb0000)',
      'POSTED': 'var(--sapPositiveColor, #107e3e)',
      'PAID': 'var(--sapPositiveColor, #107e3e)',
    };
    return statusColors[status] || 'var(--sapNeutralColor, #6a6d70)';
  };

  const formatFieldValue = (value: any, type: string): string => {
    if (value === null || value === undefined) return '—';

    switch (type) {
      case 'money':
        return `₹${Number(value).toLocaleString('en-IN')}`;
      case 'date':
        return new Date(value).toLocaleDateString('en-GB');
      case 'status':
        return value;
      case 'reference':
        return value?.name || value?.id || '—';
      default:
        return String(value);
    }
  };

  return (
    <div className="enhanced-object-page">
      {/* Object Header */}
      <div className={`object-header ${headerCollapsed ? 'collapsed' : ''}`}>
        <div className="header-main">
          <div className="header-identity">
            <span className="entity-type">{entityType.toUpperCase()}</span>
            <h1 className="entity-number">{data.documentNumber}</h1>
            {data.title && <div className="entity-title">{data.title}</div>}
          </div>

          <div className={`header-status ${headerCollapsed ? 'compact' : ''}`}>
            <span 
              className="status-chip"
              style={{ 
                backgroundColor: getStatusColor(data.status),
                color: '#fff',
                padding: '4px 12px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: '600'
              }}
            >
              {data.status}
            </span>
          </div>
        </div>

        {!headerCollapsed && (
          <>
            {/* Key Facts */}
            <div className="header-facts">
              {config.headerFields.slice(0, 6).map(field => {
                if (field.permissionKey && !actor.can(field.permissionKey, data.projectId)) {
                  return null;
                }

                return (
                  <div key={field.field} className="fact-item">
                    <div className="fact-label">{field.label}</div>
                    <div className="fact-value">
                      {formatFieldValue(data[field.field], field.type)}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Action Toolbar */}
            <div className="header-actions">
              {visibleActions.slice(0, 3).map(action => (
                <button
                  key={action.name}
                  className={`action-button action-${action.emphasis}`}
                  onClick={() => handleAction(action)}
                  disabled={isEditing && action.name !== 'save'}
                  title={action.stateRestrictions && !action.stateRestrictions.includes(data.status) 
                    ? `Cannot ${action.label} — document is ${data.status}`
                    : undefined}
                >
                  {action.label}
                </button>
              ))}
              
              {visibleActions.length > 3 && (
                <div className="action-overflow">
                  <button className="overflow-button">⋮</button>
                  <div className="overflow-menu">
                    {visibleActions.slice(3).map(action => (
                      <button
                        key={action.name}
                        className="overflow-item"
                        onClick={() => handleAction(action)}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {config.sections.some(s => s.editable) && (
                <button
                  className="edit-toggle"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  {isEditing ? 'Cancel' : 'Edit'}
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {/* Anchor Bar */}
      <div className="anchor-bar">
        {visibleSections.map(section => (
          <button
            key={section.id}
            className={`anchor-item ${activeSection === section.id ? 'active' : ''}`}
            onClick={() => {
              setActiveSection(section.id);
              document.getElementById(section.id)?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            {section.label}
          </button>
        ))}
      </div>

      {/* Sections */}
      <div className="object-sections">
        {visibleSections.map(section => (
          <div key={section.id} id={section.id} className="object-section">
            <div className="section-header">
              <h2 className="section-title">{section.label}</h2>
            </div>
            <div className="section-content">
              {renderSectionContent(section, data, isEditing, actor)}
            </div>
          </div>
        ))}

        {/* Document Chain Section */}
        {documentChain && (
          <div className="object-section" id="document-chain">
            <div className="section-header">
              <h2 className="section-title">Document Chain</h2>
            </div>
            <div className="section-content">
              <DocumentChainGraph chain={documentChain} onNodeClick={(node) => {
                if (node.accessible && node.route && onNavigate) {
                  onNavigate(node.route);
                }
              }} />
            </div>
          </div>
        )}

        {/* Approval History Section */}
        <div className="object-section" id="approval-history">
          <div className="section-header">
            <h2 className="section-title">Approval History</h2>
          </div>
          <div className="section-content">
            <ApprovalHistoryTimeline history={data.approvalHistory || []} />
          </div>
        </div>

        {/* Activity/Audit Section */}
        <div className="object-section" id="activity">
          <div className="section-header">
            <h2 className="section-title">Activity & Audit Log</h2>
          </div>
          <div className="section-content">
            <ActivityLog entries={data.activityLog || []} />
          </div>
        </div>

        {/* Comments Section */}
        <div className="object-section" id="comments">
          <div className="section-header">
            <h2 className="section-title">Comments</h2>
          </div>
          <div className="section-content">
            <CommentsSection
              comments={data.comments || []}
              onAddComment={(comment) => console.log('Add comment:', comment)}
            />
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {confirmationDialog && (
        <div className="confirmation-dialog">
          <div className="dialog-content">
            <h3>Confirm {confirmationDialog.action.label}</h3>
            <p>
              This action is irreversible. Please type the document number to confirm:
            </p>
            <p className="document-number-display">
              <strong>{data.documentNumber}</strong>
            </p>
            <input
              type="text"
              value={confirmationDialog.documentNumber}
              onChange={(e) => setConfirmationDialog({
                ...confirmationDialog,
                documentNumber: e.target.value,
              })}
              placeholder="Enter document number"
              className="confirmation-input"
            />
            <div className="dialog-actions">
              <button onClick={() => setConfirmationDialog(null)}>Cancel</button>
              <button
                onClick={handleConfirmationSubmit}
                disabled={confirmationDialog.documentNumber !== data.documentNumber}
                className="confirm-button"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Section content renderer
function renderSectionContent(
  section: ObjectPageSection,
  data: any,
  isEditing: boolean,
  actor: Actor
): React.ReactNode {
  switch (section.type) {
    case 'general':
      return <GeneralSection data={data} isEditing={isEditing} config={section.config} />;
    
    case 'line_items':
      return <LineItemsSection data={data.lineItems || []} isEditing={isEditing} />;
    
    case 'financial_summary':
      if (!actor.can('finance.amount.view', data.projectId)) {
        return <div className="permission-denied">Financial details restricted</div>;
      }
      return <FinancialSummary data={data} />;
    
    case 'schedule_dates':
      return <ScheduleDates data={data.milestones || []} />;
    
    case 'attachments':
      return <AttachmentsSection data={data.attachments || []} />;
    
    case 'approval_history':
      return <ApprovalHistoryTimeline history={data.approvalHistory || []} />;
    
    case 'related_documents':
      return <RelatedDocuments data={data.relatedDocuments || []} />;
    
    case 'activity_audit':
      return <ActivityLog entries={data.activityLog || []} />;
    
    case 'comments':
      return <CommentsSection comments={data.comments || []} onAddComment={() => {}} />;
    
    default:
      return <div>Unknown section type: {section.type}</div>;
  }
}

// Sub-section components
const GeneralSection: React.FC<{ data: any; isEditing: boolean; config?: any }> = ({
  data,
  isEditing,
  config,
}) => {
  return (
    <div className="general-section">
      <div className="field-grid">
        {config?.fields?.map((field: any) => (
          <div key={field.name} className="field">
            <label>{field.label}</label>
            {isEditing ? (
              <input type="text" defaultValue={data[field.name]} />
            ) : (
              <div className="field-value">{data[field.name]}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const LineItemsSection: React.FC<{ data: any[]; isEditing: boolean }> = ({
  data,
  isEditing,
}) => {
  return (
    <div className="line-items-section">
      <table className="data-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Description</th>
            <th>Quantity</th>
            <th>Rate</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr key={index}>
              <td>{index + 1}</td>
              <td>{item.description}</td>
              <td>{item.quantity}</td>
              <td>{item.rate}</td>
              <td>{item.amount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const FinancialSummary: React.FC<{ data: any }> = ({ data }) => {
  return (
    <div className="financial-summary">
      <div className="summary-grid">
        <div className="summary-item">
          <div className="label">Basic Value</div>
          <div className="value">{data.basicValue}</div>
        </div>
        <div className="summary-item">
          <div className="label">Tax</div>
          <div className="value">{data.taxValue}</div>
        </div>
        <div className="summary-item">
          <div className="label">Total</div>
          <div className="value total">{data.totalValue}</div>
        </div>
      </div>
    </div>
  );
};

const ScheduleDates: React.FC<{ data: any[] }> = ({ data }) => {
  return (
    <div className="schedule-dates">
      <table className="data-table">
        <thead>
          <tr>
            <th>Milestone</th>
            <th>Planned Date</th>
            <th>Actual Date</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {data.map((milestone, index) => (
            <tr key={index}>
              <td>{milestone.name}</td>
              <td>{milestone.plannedDate}</td>
              <td>{milestone.actualDate || '—'}</td>
              <td>{milestone.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const AttachmentsSection: React.FC<{ data: any[] }> = ({ data }) => {
  return (
    <div className="attachments-section">
      {data.length === 0 ? (
        <div className="empty-state">No attachments</div>
      ) : (
        <div className="attachment-list">
          {data.map((attachment, index) => (
            <div key={index} className="attachment-item">
              <span className="attachment-icon">📎</span>
              <span className="attachment-name">{attachment.name}</span>
              <span className="attachment-size">{attachment.size}</span>
              <a href={attachment.url} target="_blank" rel="noopener noreferrer">
                View
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const ApprovalHistoryTimeline: React.FC<{ history: any[] }> = ({ history }) => {
  return (
    <div className="approval-history">
      {history.length === 0 ? (
        <div className="empty-state">No approval history</div>
      ) : (
        <div className="timeline">
          {history.map((entry, index) => (
            <div key={index} className="timeline-item">
              <div className="timeline-marker" />
              <div className="timeline-content">
                <div className="timeline-header">
                  <strong>{entry.approver}</strong>
                  <span className={`timeline-action action-${entry.action.toLowerCase()}`}>
                    {entry.action}
                  </span>
                  <span className="timeline-date">{entry.date}</span>
                </div>
                {entry.comment && (
                  <div className="timeline-comment">{entry.comment}</div>
                )}
                <div className="timeline-meta">
                  Time taken: {entry.timeTaken} | SLA: {entry.slaStatus}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const RelatedDocuments: React.FC<{ data: any[] }> = ({ data }) => {
  return (
    <div className="related-documents">
      {data.length === 0 ? (
        <div className="empty-state">No related documents</div>
      ) : (
        <div className="document-list">
          {data.map((doc, index) => (
            <div key={index} className="document-item">
              <span className="document-type">{doc.type}</span>
              <a href={doc.route} className="document-link">
                {doc.documentNumber}
              </a>
              <span className="document-status">{doc.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const ActivityLog: React.FC<{ entries: any[] }> = ({ entries }) => {
  return (
    <div className="activity-log">
      {entries.length === 0 ? (
        <div className="empty-state">No activity recorded</div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Date/Time</th>
              <th>User</th>
              <th>Action</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, index) => (
              <tr key={index}>
                <td>{entry.timestamp}</td>
                <td>{entry.user}</td>
                <td>{entry.action}</td>
                <td>{entry.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

const CommentsSection: React.FC<{ comments: any[]; onAddComment: (comment: string) => void }> = ({
  comments,
  onAddComment,
}) => {
  const [newComment, setNewComment] = useState('');

  const handleSubmit = () => {
    if (newComment.trim()) {
      onAddComment(newComment);
      setNewComment('');
    }
  };

  return (
    <div className="comments-section">
      <div className="comment-list">
        {comments.map((comment, index) => (
          <div key={index} className="comment-item">
            <div className="comment-header">
              <strong>{comment.author}</strong>
              <span className="comment-date">{comment.date}</span>
            </div>
            <div className="comment-body">{comment.text}</div>
          </div>
        ))}
      </div>
      <div className="comment-input">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment... Use @mention to notify someone"
        />
        <button onClick={handleSubmit}>Post Comment</button>
      </div>
    </div>
  );
};

export default EnhancedObjectPage;
