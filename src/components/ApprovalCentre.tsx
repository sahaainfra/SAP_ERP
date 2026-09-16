/**
 * Approval Centre Component - Part 7
 * 
 * Centralized approval management interface with queue, detail pane, and decision actions
 */

import { useState } from 'react';
import { 
  CheckCircle2, XCircle, ArrowLeft, Clock, AlertTriangle, 
  Filter, Download, MoreVertical, FileText, ShoppingCart,
  BookOpen, Receipt, TrendingUp, DollarSign, Users,
  ChevronRight, MessageSquare, Forward, AlertCircle
} from 'lucide-react';
import { approvalItems, approvalHistory } from '../data/workflowData';
import type { ApprovalItem, ApprovalDecision, SlaState } from '../types/workflow';
import { formatCurrency, formatDate } from '../utils/formatting';
import { StatusChip, PriorityIndicator } from './SupportingComponents';

type ApprovalTab = 'pending' | 'at_risk' | 'overdue' | 'delegated' | 'history';
type GroupByOption = 'urgency' | 'document_type' | 'project' | 'value' | 'requester';

export default function ApprovalCentre() {
  const [activeTab, setActiveTab] = useState<ApprovalTab>('pending');
  const [selectedItem, setSelectedItem] = useState<ApprovalItem | null>(approvalItems[0]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [groupBy, setGroupBy] = useState<GroupByOption>('urgency');
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [decisionAction, setDecisionAction] = useState<'approve' | 'reject' | 'return' | 'forward'>('approve');

  // Filter items by tab
  const filteredItems = approvalItems.filter(item => {
    if (activeTab === 'pending') return item.status === 'pending';
    if (activeTab === 'at_risk') return item.slaState === 'at_risk';
    if (activeTab === 'overdue') return item.slaState === 'overdue';
    if (activeTab === 'delegated') return false; // Would filter for delegated items
    return false;
  });

  // Sort by SLA state and value
  const sortedItems = [...filteredItems].sort((a, b) => {
    const slaOrder: Record<SlaState, number> = { overdue: 0, at_risk: 1, on_track: 2 };
    if (slaOrder[a.slaState] !== slaOrder[b.slaState]) {
      return slaOrder[a.slaState] - slaOrder[b.slaState];
    }
    return b.amount - a.amount;
  });

  // Tab counts
  const tabCounts = {
    pending: approvalItems.filter(i => i.status === 'pending').length,
    at_risk: approvalItems.filter(i => i.slaState === 'at_risk').length,
    overdue: approvalItems.filter(i => i.slaState === 'overdue').length,
    delegated: 0,
    history: 0
  };

  const handleSelectItem = (item: ApprovalItem) => {
    setSelectedItem(item);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === sortedItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sortedItems.map(i => i.id)));
    }
  };

  const handleToggleSelect = (id: number) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleBulkApprove = () => {
    // Filter out items above authority limit or with risk flags
    const approvableItems = sortedItems.filter(item => 
      selectedIds.has(item.id) && 
      !item.riskFlags.some(f => f.severity === 'high')
    );
    
    console.log('Bulk approving:', approvableItems);
    setSelectedIds(new Set());
  };

  const handleDecision = (action: 'approve' | 'reject' | 'return' | 'forward') => {
    setDecisionAction(action);
    setShowDecisionModal(true);
  };

  const submitDecision = (decision: ApprovalDecision) => {
    console.log('Decision:', decision);
    setShowDecisionModal(false);
  };

  const getEntityIcon = (entityType: string) => {
    switch (entityType) {
      case 'purchase_order': return <ShoppingCart size={16} />;
      case 'purchase_requisition': return <FileText size={16} />;
      case 'measurement_book': return <BookOpen size={16} />;
      case 'ra_bill': return <Receipt size={16} />;
      default: return <FileText size={16} />;
    }
  };

  const getSlaColor = (slaState: SlaState) => {
    switch (slaState) {
      case 'overdue': return 'var(--sapNegativeColor)';
      case 'at_risk': return 'var(--sapCriticalColor)';
      case 'on_track': return 'var(--sapPositiveColor)';
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--sapTextColor)' }}>
          Approval Centre
        </h1>
        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <button
              onClick={handleBulkApprove}
              className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium"
              style={{
                background: 'var(--sapButton_Emphasized_Background)',
                color: 'var(--sapButton_Emphasized_TextColor)'
              }}
            >
              <CheckCircle2 size={16} />
              Bulk Approve ({selectedIds.size})
            </button>
          )}
          <button
            className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium"
            style={{
              background: 'var(--sapButton_Background)',
              color: 'var(--sapButton_TextColor)',
              border: '1px solid var(--sapButton_BorderColor)'
            }}
          >
            <Download size={16} />
            Export
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b" style={{ borderColor: 'var(--sapList_BorderColor)' }}>
        {[
          { key: 'pending', label: 'Pending', count: tabCounts.pending },
          { key: 'at_risk', label: 'At Risk', count: tabCounts.at_risk },
          { key: 'overdue', label: 'Overdue', count: tabCounts.overdue },
          { key: 'delegated', label: 'Delegated to Me', count: tabCounts.delegated },
          { key: 'history', label: 'History', count: tabCounts.history }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as ApprovalTab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key ? 'border-[var(--sapSelectedColor)]' : 'border-transparent'
            }`}
            style={{
              color: activeTab === tab.key ? 'var(--sapSelectedColor)' : 'var(--sapContent_LabelColor)'
            }}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className="ml-2 px-2 py-0.5 rounded-full text-xs" style={{
                background: tab.key === 'overdue' ? 'var(--sapErrorBackground)' : 'var(--sapNeutralBackground)',
                color: tab.key === 'overdue' ? 'var(--sapNegativeTextColor)' : 'var(--sapNeutralTextColor)'
              }}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className="flex gap-4 flex-1 min-h-0">
        {/* Queue */}
        <div className="w-1/3 flex flex-col sap-card overflow-hidden">
          {/* Queue Header */}
          <div className="flex items-center justify-between p-3 border-b" style={{ borderColor: 'var(--sapList_BorderColor)' }}>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedIds.size === sortedItems.length && sortedItems.length > 0}
                onChange={handleSelectAll}
                className="rounded"
              />
              <span className="text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>
                {sortedItems.length} items
              </span>
            </div>
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as GroupByOption)}
              className="text-sm px-2 py-1 rounded border"
              style={{
                background: 'var(--sapField_Background)',
                borderColor: 'var(--sapField_BorderColor)',
                color: 'var(--sapField_TextColor)'
              }}
            >
              <option value="urgency">Group by Urgency</option>
              <option value="document_type">Group by Type</option>
              <option value="project">Group by Project</option>
              <option value="value">Group by Value</option>
              <option value="requester">Group by Requester</option>
            </select>
          </div>

          {/* Queue List */}
          <div className="flex-1 overflow-y-auto">
            {sortedItems.map(item => (
              <div
                key={item.id}
                onClick={() => handleSelectItem(item)}
                className={`p-3 border-b cursor-pointer transition-colors ${
                  selectedItem?.id === item.id ? 'bg-[var(--sapList_SelectionBackgroundColor)]' : 'hover:bg-[var(--sapList_Hover_Background)]'
                }`}
                style={{ borderColor: 'var(--sapList_BorderColor)' }}
              >
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(item.id)}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleToggleSelect(item.id);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="mt-1 rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span style={{ color: 'var(--sapContent_IconColor)' }}>
                        {getEntityIcon(item.entityType)}
                      </span>
                      <span className="text-sm font-semibold truncate" style={{ color: 'var(--sapTextColor)' }}>
                        {item.entityNumber}
                      </span>
                      {item.riskFlags.length > 0 && (
                        <AlertTriangle size={14} style={{ color: 'var(--sapCriticalColor)' }} />
                      )}
                    </div>
                    <div className="text-xs mb-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
                      {item.requester} • {formatCurrency(item.amount, { compact: true })}
                    </div>
                    <div className="text-xs mb-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
                      {item.project}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <Clock size={12} style={{ color: getSlaColor(item.slaState) }} />
                        <span className="text-xs" style={{ color: getSlaColor(item.slaState) }}>
                          {item.slaState === 'overdue' ? 'Overdue' : 
                           item.slaState === 'at_risk' ? 'Due soon' : 
                           'On track'}
                        </span>
                      </div>
                      <PriorityIndicator level={item.priority} showLabel={false} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Detail Pane */}
        <div className="flex-1 sap-card overflow-y-auto">
          {selectedItem ? (
            <div className="p-6">
              {/* Header */}
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <span style={{ color: 'var(--sapContent_IconColor)' }}>
                    {getEntityIcon(selectedItem.entityType)}
                  </span>
                  <h2 className="text-xl font-bold" style={{ color: 'var(--sapTextColor)' }}>
                    {selectedItem.entityNumber}
                  </h2>
                  <StatusChip status={selectedItem.status} type="info" />
                </div>
                <p className="text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>
                  {selectedItem.entityTitle}
                </p>
              </div>

              {/* Key Facts */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 rounded-lg" style={{ background: 'var(--sapGroup_ContentBackground)' }}>
                <div>
                  <div className="text-xs mb-1" style={{ color: 'var(--sapContent_LabelColor)' }}>Requester</div>
                  <div className="text-sm font-semibold" style={{ color: 'var(--sapTextColor)' }}>{selectedItem.requester}</div>
                </div>
                <div>
                  <div className="text-xs mb-1" style={{ color: 'var(--sapContent_LabelColor)' }}>Amount</div>
                  <div className="text-sm font-semibold" style={{ color: 'var(--sapTextColor)' }}>{formatCurrency(selectedItem.amount)}</div>
                </div>
                <div>
                  <div className="text-xs mb-1" style={{ color: 'var(--sapContent_LabelColor)' }}>Project</div>
                  <div className="text-sm font-semibold" style={{ color: 'var(--sapTextColor)' }}>{selectedItem.project}</div>
                </div>
                <div>
                  <div className="text-xs mb-1" style={{ color: 'var(--sapContent_LabelColor)' }}>Due</div>
                  <div className="text-sm font-semibold" style={{ color: getSlaColor(selectedItem.slaState) }}>
                    {formatDate(selectedItem.dueAt)}
                  </div>
                </div>
              </div>

              {/* Risk Flags */}
              {selectedItem.riskFlags.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--sapTextColor)' }}>
                    Risk Flags
                  </h3>
                  <div className="space-y-2">
                    {selectedItem.riskFlags.map((flag, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2 p-3 rounded-lg"
                        style={{
                          background: flag.severity === 'high' ? 'var(--sapErrorBackground)' : 'var(--sapWarningBackground)',
                          border: `1px solid ${flag.severity === 'high' ? 'var(--sapErrorBorderColor)' : 'var(--sapWarningBorderColor)'}`
                        }}
                      >
                        <AlertCircle size={16} style={{ color: flag.severity === 'high' ? 'var(--sapNegativeTextColor)' : 'var(--sapCriticalTextColor)' }} />
                        <div className="flex-1">
                          <div className="text-sm font-semibold" style={{ color: flag.severity === 'high' ? 'var(--sapNegativeTextColor)' : 'var(--sapCriticalTextColor)' }}>
                            {flag.message}
                          </div>
                          {flag.details && (
                            <div className="text-xs mt-1" style={{ color: 'var(--sapTextColor)' }}>
                              {flag.details}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Budget Impact */}
              {selectedItem.budgetImpact && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--sapTextColor)' }}>
                    Budget Impact
                  </h3>
                  <div className="p-4 rounded-lg" style={{ background: 'var(--sapGroup_ContentBackground)' }}>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs mb-1" style={{ color: 'var(--sapContent_LabelColor)' }}>Cost Head</div>
                        <div className="text-sm font-semibold" style={{ color: 'var(--sapTextColor)' }}>
                          {selectedItem.budgetImpact.costHead}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs mb-1" style={{ color: 'var(--sapContent_LabelColor)' }}>After Approval</div>
                        <div className="text-sm font-semibold" style={{ 
                          color: selectedItem.budgetImpact.isOverBudget ? 'var(--sapNegativeTextColor)' : 'var(--sapTextColor)'
                        }}>
                          {selectedItem.budgetImpact.percentageAfter}% of budget
                        </div>
                      </div>
                      <div>
                        <div className="text-xs mb-1" style={{ color: 'var(--sapContent_LabelColor)' }}>Current Spend</div>
                        <div className="text-sm" style={{ color: 'var(--sapTextColor)' }}>
                          {formatCurrency(selectedItem.budgetImpact.currentSpend)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs mb-1" style={{ color: 'var(--sapContent_LabelColor)' }}>Budget</div>
                        <div className="text-sm" style={{ color: 'var(--sapTextColor)' }}>
                          {formatCurrency(selectedItem.budgetImpact.budget)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Comparison Context */}
              {selectedItem.comparisonContext && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--sapTextColor)' }}>
                    Comparison Context
                  </h3>
                  <div className="p-4 rounded-lg" style={{ background: 'var(--sapGroup_ContentBackground)' }}>
                    {selectedItem.comparisonContext.alternatives && (
                      <div className="space-y-2">
                        {selectedItem.comparisonContext.alternatives.map((alt, i) => (
                          <div key={i} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {alt.selected && <CheckCircle2 size={16} style={{ color: 'var(--sapPositiveColor)' }} />}
                              <span className="text-sm" style={{ color: 'var(--sapTextColor)' }}>
                                {alt.vendor}
                              </span>
                            </div>
                            <div className="text-sm font-semibold" style={{ color: 'var(--sapTextColor)' }}>
                              {formatCurrency(alt.amount)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Approval History */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--sapTextColor)' }}>
                  Approval History
                </h3>
                <div className="space-y-3">
                  {approvalHistory.map(item => (
                    <div key={item.id} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: 'var(--sapAccentColor6)', color: 'white' }}>
                        {item.approver.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold" style={{ color: 'var(--sapTextColor)' }}>
                            {item.approver}
                          </span>
                          <StatusChip 
                            status={item.action} 
                            type={
                              (item.action as string) === 'approve' ? 'success' : 
                              (item.action as string) === 'reject' ? 'error' : 
                              'warning'
                            } 
                          />
                        </div>
                        <div className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
                          {formatDate(item.timestamp)} • {Math.floor(item.timeTaken / 60)}h {item.timeTaken % 60}m
                        </div>
                        {item.comment && (
                          <div className="text-sm mt-1" style={{ color: 'var(--sapTextColor)' }}>
                            {item.comment}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Decision Actions */}
              <div className="flex items-center gap-2 pt-4 border-t" style={{ borderColor: 'var(--sapGroup_ContentBorderColor)' }}>
                <button
                  onClick={() => handleDecision('approve')}
                  className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium"
                  style={{
                    background: 'var(--sapButton_Accept_Background)',
                    color: 'var(--sapButton_Accept_TextColor)',
                    border: '1px solid var(--sapButton_Accept_BorderColor)'
                  }}
                >
                  <CheckCircle2 size={16} />
                  Approve
                </button>
                <button
                  onClick={() => handleDecision('return')}
                  className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium"
                  style={{
                    background: 'var(--sapButton_Background)',
                    color: 'var(--sapButton_TextColor)',
                    border: '1px solid var(--sapButton_BorderColor)'
                  }}
                >
                  <ArrowLeft size={16} />
                  Return
                </button>
                <button
                  onClick={() => handleDecision('forward')}
                  className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium"
                  style={{
                    background: 'var(--sapButton_Background)',
                    color: 'var(--sapButton_TextColor)',
                    border: '1px solid var(--sapButton_BorderColor)'
                  }}
                >
                  <Forward size={16} />
                  Forward
                </button>
                <button
                  onClick={() => handleDecision('reject')}
                  className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium"
                  style={{
                    background: 'var(--sapButton_Reject_Background)',
                    color: 'var(--sapButton_Reject_TextColor)',
                    border: '1px solid var(--sapButton_Reject_BorderColor)'
                  }}
                >
                  <XCircle size={16} />
                  Reject
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <FileText size={48} className="mx-auto mb-4" style={{ color: 'var(--sapContent_NonInteractiveIconColor)' }} />
                <p className="text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>
                  Select an item from the queue to view details
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Decision Modal */}
      {showDecisionModal && selectedItem && (
        <DecisionModal
          item={selectedItem}
          action={decisionAction}
          onSubmit={submitDecision}
          onClose={() => setShowDecisionModal(false)}
        />
      )}
    </div>
  );
}

// Decision Modal Component
function DecisionModal({ item, action, onSubmit, onClose }: {
  item: ApprovalItem;
  action: 'approve' | 'reject' | 'return' | 'forward';
  onSubmit: (decision: ApprovalDecision) => void;
  onClose: () => void;
}) {
  const [comment, setComment] = useState('');
  const [forwardTo, setForwardTo] = useState<number | undefined>();
  const [conditions, setConditions] = useState<string[]>([]);

  const actionLabels = {
    approve: 'Approve',
    reject: 'Reject',
    return: 'Return for Correction',
    forward: 'Forward'
  };

  const handleSubmit = () => {
    onSubmit({
      action,
      comment,
      forwardTo,
      conditions: conditions.length > 0 ? conditions : undefined
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="sap-card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--sapTextColor)' }}>
            {actionLabels[action]} - {item.entityNumber}
          </h2>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--sapTextColor)' }}>
              Comment {action !== 'approve' && <span style={{ color: 'var(--sapField_RequiredColor)' }}>*</span>}
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full p-3 rounded border resize-none"
              style={{
                background: 'var(--sapField_Background)',
                borderColor: 'var(--sapField_BorderColor)',
                color: 'var(--sapField_TextColor)'
              }}
              rows={4}
              placeholder={action === 'approve' ? 'Optional comment...' : 'Reason is required...'}
            />
          </div>

          {action === 'forward' && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--sapTextColor)' }}>
                Forward to <span style={{ color: 'var(--sapField_RequiredColor)' }}>*</span>
              </label>
              <select
                value={forwardTo || ''}
                onChange={(e) => setForwardTo(Number(e.target.value))}
                className="w-full p-3 rounded border"
                style={{
                  background: 'var(--sapField_Background)',
                  borderColor: 'var(--sapField_BorderColor)',
                  color: 'var(--sapField_TextColor)'
                }}
              >
                <option value="">Select approver...</option>
                <option value="2">Sarah Chen</option>
                <option value="4">David Park</option>
                <option value="5">Lisa Anderson</option>
              </select>
            </div>
          )}

          {action === 'approve' && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--sapTextColor)' }}>
                Conditions (optional)
              </label>
              <input
                type="text"
                value={conditions[0] || ''}
                onChange={(e) => setConditions([e.target.value])}
                className="w-full p-3 rounded border"
                style={{
                  background: 'var(--sapField_Background)',
                  borderColor: 'var(--sapField_BorderColor)',
                  color: 'var(--sapField_TextColor)'
                }}
                placeholder="Enter condition..."
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-4 border-t" style={{ borderColor: 'var(--sapGroup_ContentBorderColor)' }}>
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
              onClick={handleSubmit}
              disabled={action !== 'approve' && !comment.trim()}
              className="px-4 py-2 rounded text-sm font-medium disabled:opacity-50"
              style={{
                background: action === 'reject' ? 'var(--sapButton_Reject_Background)' : 'var(--sapButton_Emphasized_Background)',
                color: action === 'reject' ? 'var(--sapButton_Reject_TextColor)' : 'var(--sapButton_Emphasized_TextColor)'
              }}
            >
              {actionLabels[action]}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
