/**
 * Part 18 — Claims Register Component
 * Manage claims with notice deadline tracking and settlement workflow
 */

import React, { useState } from 'react';
import { 
  AlertTriangle, Clock, CheckCircle, FileText, 
  Eye, Edit2, Plus, Filter, Bell, TrendingUp
} from 'lucide-react';
import { claims } from '../data/billingData';
import type { Claim, ClaimType, ClaimStatus } from '../types/billing';
import { formatCurrency, formatDate } from '../utils/formatting';

export function ClaimsRegister() {
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [filterStatus, setFilterStatus] = useState<ClaimStatus | 'ALL'>('ALL');
  const [filterType, setFilterType] = useState<ClaimType | 'ALL'>('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const filteredClaims = claims.filter(claim => {
    if (filterStatus !== 'ALL' && claim.status !== filterStatus) return false;
    if (filterType !== 'ALL' && claim.claimType !== filterType) return false;
    return true;
  });

  const getStatusColor = (status: ClaimStatus) => {
    switch (status) {
      case 'DRAFT': return 'var(--sapNeutralColor)';
      case 'NOTICE_ISSUED': return 'var(--sapInformativeColor)';
      case 'CLAIM_SUBMITTED': return 'var(--sapCriticalColor)';
      case 'UNDER_NEGOTIATION': return 'var(--sapCriticalColor)';
      case 'SETTLED': return 'var(--sapPositiveColor)';
      case 'REJECTED': return 'var(--sapNegativeColor)';
      case 'ADJUDICATION': return 'var(--sapAccentColor1)';
      case 'ARBITRATION': return 'var(--sapAccentColor2)';
      default: return 'var(--sapContent_LabelColor)';
    }
  };

  const getTypeLabel = (type: ClaimType) => {
    const labels: Record<ClaimType, string> = {
      'EOT': 'Extension of Time',
      'PROLONGATION_COST': 'Prolongation Cost',
      'IDLING': 'Idling Charges',
      'ACCELERATION': 'Acceleration Cost',
      'CHANGE_IN_LAW': 'Change in Law',
      'PRICE_ESCALATION_DISPUTE': 'Price Escalation Dispute',
      'DISPUTED_QUANTITY': 'Disputed Quantity',
      'DISPUTED_RATE': 'Disputed Rate',
    };
    return labels[type] || type;
  };

  const totalClaimed = filteredClaims.reduce((sum, c) => sum + c.quantum, 0);
  const totalSettled = filteredClaims
    .filter(c => c.status === 'SETTLED')
    .reduce((sum, c) => sum + (c.settledAmount || 0), 0);
  const overdueNotices = filteredClaims.filter(c => c.noticeOverdue).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--sapTextColor)' }}>
            Claims Register
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
            Track claims with notice deadlines and settlement workflow
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium"
          style={{
            background: 'var(--sapButton_Emphasized_Background)',
            color: 'var(--sapButton_Emphasized_TextColor)',
          }}
        >
          <Plus size={16} />
          New Claim
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="sap-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
              Total Claims
            </span>
            <FileText size={16} style={{ color: 'var(--sapAccentColor6)' }} />
          </div>
          <div className="text-2xl font-bold" style={{ color: 'var(--sapTextColor)' }}>
            {filteredClaims.length}
          </div>
        </div>

        <div className="sap-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
              Total Claimed
            </span>
            <TrendingUp size={16} style={{ color: 'var(--sapInformativeColor)' }} />
          </div>
          <div className="text-2xl font-bold" style={{ color: 'var(--sapTextColor)' }}>
            {formatCurrency(totalClaimed, { compact: true })}
          </div>
        </div>

        <div className="sap-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
              Total Settled
            </span>
            <CheckCircle size={16} style={{ color: 'var(--sapPositiveColor)' }} />
          </div>
          <div className="text-2xl font-bold" style={{ color: 'var(--sapPositiveColor)' }}>
            {formatCurrency(totalSettled, { compact: true })}
          </div>
        </div>

        <div className="sap-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
              Overdue Notices
            </span>
            <Bell size={16} style={{ color: overdueNotices > 0 ? 'var(--sapNegativeColor)' : 'var(--sapPositiveColor)' }} />
          </div>
          <div className="text-2xl font-bold" style={{ 
            color: overdueNotices > 0 ? 'var(--sapNegativeColor)' : 'var(--sapPositiveColor)' 
          }}>
            {overdueNotices}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter size={16} style={{ color: 'var(--sapContent_LabelColor)' }} />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as ClaimStatus | 'ALL')}
            className="px-3 py-2 rounded border text-sm"
            style={{
              background: 'var(--sapField_Background)',
              borderColor: 'var(--sapField_BorderColor)',
              color: 'var(--sapField_TextColor)',
            }}
          >
            <option value="ALL">All Status</option>
            <option value="DRAFT">Draft</option>
            <option value="NOTICE_ISSUED">Notice Issued</option>
            <option value="CLAIM_SUBMITTED">Claim Submitted</option>
            <option value="UNDER_NEGOTIATION">Under Negotiation</option>
            <option value="SETTLED">Settled</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as ClaimType | 'ALL')}
            className="px-3 py-2 rounded border text-sm"
            style={{
              background: 'var(--sapField_Background)',
              borderColor: 'var(--sapField_BorderColor)',
              color: 'var(--sapField_TextColor)',
            }}
          >
            <option value="ALL">All Types</option>
            <option value="EOT">Extension of Time</option>
            <option value="PROLONGATION_COST">Prolongation Cost</option>
            <option value="IDLING">Idling Charges</option>
            <option value="DISPUTED_QUANTITY">Disputed Quantity</option>
            <option value="DISPUTED_RATE">Disputed Rate</option>
          </select>
        </div>
      </div>

      {/* Claims List */}
      <div className="sap-card overflow-hidden">
        <table className="w-full">
          <thead style={{ background: 'var(--sapList_HeaderBackground)' }}>
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>
                Claim No
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>
                Type
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>
                Title
              </th>
              <th className="text-right px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>
                Quantum
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>
                Notice Due
              </th>
              <th className="text-center px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>
                Notice Status
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>
                Status
              </th>
              <th className="text-center px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredClaims.map((claim, idx) => (
              <tr
                key={claim.id}
                className="cursor-pointer hover:bg-[var(--sapList_Hover_Background)]"
                style={{
                  borderBottom: '1px solid var(--sapList_BorderColor)',
                  background: idx % 2 === 0 ? 'var(--sapList_Background)' : 'var(--sapList_AlternatingBackground)',
                }}
                onClick={() => setSelectedClaim(claim)}
              >
                <td className="px-4 py-3 text-sm font-mono" style={{ color: 'var(--sapTextColor)' }}>
                  {claim.claimNo}
                </td>
                <td className="px-4 py-3 text-sm" style={{ color: 'var(--sapTextColor)' }}>
                  {getTypeLabel(claim.claimType)}
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm font-medium" style={{ color: 'var(--sapTextColor)' }}>
                    {claim.title}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-right font-semibold" style={{ color: 'var(--sapTextColor)' }}>
                  {claim.quantum > 0 ? formatCurrency(claim.quantum) : '—'}
                </td>
                <td className="px-4 py-3 text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>
                  {formatDate(claim.noticeDueDate)}
                </td>
                <td className="px-4 py-3 text-center">
                  {claim.noticeOverdue ? (
                    <span className="text-xs px-2 py-1 rounded" style={{
                      background: 'var(--sapErrorBackground)',
                      color: 'var(--sapNegativeTextColor)',
                    }}>
                      OVERDUE
                    </span>
                  ) : claim.noticeIssuedAt ? (
                    <span className="text-xs px-2 py-1 rounded" style={{
                      background: 'var(--sapSuccessBackground)',
                      color: 'var(--sapPositiveTextColor)',
                    }}>
                      ISSUED
                    </span>
                  ) : (
                    <span className="text-xs px-2 py-1 rounded" style={{
                      background: 'var(--sapWarningBackground)',
                      color: 'var(--sapCriticalTextColor)',
                    }}>
                      PENDING
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span
                    className="text-xs px-2 py-1 rounded font-medium"
                    style={{
                      background: `${getStatusColor(claim.status)}20`,
                      color: getStatusColor(claim.status),
                    }}
                  >
                    {claim.status.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      className="p-1 rounded hover:bg-[var(--sapButton_Hover_Background)]"
                      title="View"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedClaim(claim);
                      }}
                    >
                      <Eye size={16} style={{ color: 'var(--sapButton_TextColor)' }} />
                    </button>
                    {(claim.status === 'DRAFT' || claim.status === 'NOTICE_ISSUED') && (
                      <button
                        className="p-1 rounded hover:bg-[var(--sapButton_Hover_Background)]"
                        title="Edit"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Edit2 size={16} style={{ color: 'var(--sapButton_TextColor)' }} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Claim Detail Modal */}
      {selectedClaim && (
        <ClaimDetailModal claim={selectedClaim} onClose={() => setSelectedClaim(null)} />
      )}

      {/* Create Claim Modal */}
      {showCreateModal && (
        <CreateClaimModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  );
}

// ─── Claim Detail Modal ──────────────────────────────────────────────────────

function ClaimDetailModal({ claim, onClose }: { claim: Claim; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="sap-card max-w-4xl w-full max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b" style={{ borderColor: 'var(--sapList_BorderColor)' }}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold" style={{ color: 'var(--sapTextColor)' }}>
                {claim.claimNo}
              </h3>
              <p className="text-sm mt-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
                {claim.title}
              </p>
            </div>
            <button onClick={onClose} className="p-2 rounded hover:bg-[var(--sapButton_Hover_Background)]">×</button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Notice Deadline Alert */}
          {(claim.daysToNoticeDeadline !== undefined && claim.daysToNoticeDeadline <= 7 && !claim.noticeIssuedAt) && (
            <div className="p-4 rounded" style={{ background: 'var(--sapErrorBackground)' }}>
              <div className="flex items-start gap-2">
                <AlertTriangle size={20} style={{ color: 'var(--sapNegativeColor)' }} />
                <div className="flex-1">
                  <div className="text-sm font-semibold mb-1" style={{ color: 'var(--sapNegativeTextColor)' }}>
                    Notice Deadline Approaching
                  </div>
                  <div className="text-xs" style={{ color: 'var(--sapNegativeTextColor)' }}>
                    {claim.daysToNoticeDeadline === 0 
                      ? 'Notice is due today!' 
                      : claim.daysToNoticeDeadline < 0
                      ? `Notice is ${Math.abs(claim.daysToNoticeDeadline)} days overdue!`
                      : `Notice due in ${claim.daysToNoticeDeadline} days`
                    }
                    {' '}Most claims fail on notice timing. Issue notice immediately.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Claim Details */}
          <div>
            <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--sapTextColor)' }}>
              Claim Details
            </h4>
            <div className="p-3 rounded text-sm" style={{ background: 'var(--sapList_Background)', color: 'var(--sapTextColor)' }}>
              {claim.description}
            </div>
          </div>

          {/* Contractual Reference */}
          <div>
            <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--sapTextColor)' }}>
              Contractual Clause
            </h4>
            <div className="p-3 rounded text-sm font-mono" style={{ background: 'var(--sapNeutralBackground)', color: 'var(--sapTextColor)' }}>
              {claim.contractualClause}
            </div>
          </div>

          {/* Financial Summary */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded" style={{ background: 'var(--sapInformationBackground)' }}>
              <div className="text-xs mb-1" style={{ color: 'var(--sapInformativeTextColor)' }}>Claimed Amount</div>
              <div className="text-xl font-bold" style={{ color: 'var(--sapInformativeTextColor)' }}>
                {claim.quantum > 0 ? formatCurrency(claim.quantum) : 'Non-monetary (EOT)'}
              </div>
            </div>
            {claim.settledAmount !== undefined && (
              <div className="p-4 rounded" style={{ background: 'var(--sapSuccessBackground)' }}>
                <div className="text-xs mb-1" style={{ color: 'var(--sapPositiveTextColor)' }}>Settled Amount</div>
                <div className="text-xl font-bold" style={{ color: 'var(--sapPositiveTextColor)' }}>
                  {formatCurrency(claim.settledAmount)}
                </div>
              </div>
            )}
          </div>

          {/* Timeline */}
          <div>
            <h4 className="text-sm font-semibold mb-3" style={{ color: 'var(--sapTextColor)' }}>
              Timeline
            </h4>
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-3 rounded" style={{ background: 'var(--sapList_Background)' }}>
                <AlertTriangle size={16} style={{ color: 'var(--sapCriticalColor)' }} />
                <div className="flex-1">
                  <div className="text-sm font-medium" style={{ color: 'var(--sapTextColor)' }}>
                    Event Occurred
                  </div>
                  <div className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
                    {formatDate(claim.eventDate)}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded" style={{ 
                background: claim.noticeOverdue ? 'var(--sapErrorBackground)' : 'var(--sapWarningBackground)'
              }}>
                <Clock size={16} style={{ color: claim.noticeOverdue ? 'var(--sapNegativeColor)' : 'var(--sapCriticalColor)' }} />
                <div className="flex-1">
                  <div className="text-sm font-medium" style={{ 
                    color: claim.noticeOverdue ? 'var(--sapNegativeTextColor)' : 'var(--sapCriticalTextColor)'
                  }}>
                    Notice Due Date
                  </div>
                  <div className="text-xs" style={{ 
                    color: claim.noticeOverdue ? 'var(--sapNegativeTextColor)' : 'var(--sapCriticalTextColor)'
                  }}>
                    {formatDate(claim.noticeDueDate)} ({claim.noticePeriodDays} days from event)
                    {claim.noticeOverdue && ' — OVERDUE'}
                  </div>
                </div>
              </div>

              {claim.noticeIssuedAt && (
                <div className="flex items-center gap-3 p-3 rounded" style={{ background: 'var(--sapSuccessBackground)' }}>
                  <CheckCircle size={16} style={{ color: 'var(--sapPositiveColor)' }} />
                  <div className="flex-1">
                    <div className="text-sm font-medium" style={{ color: 'var(--sapPositiveTextColor)' }}>
                      Notice Issued
                    </div>
                    <div className="text-xs" style={{ color: 'var(--sapPositiveTextColor)' }}>
                      {formatDate(claim.noticeIssuedAt)} • Ref: {claim.noticeRef}
                    </div>
                  </div>
                </div>
              )}

              {claim.claimSubmittedAt && (
                <div className="flex items-center gap-3 p-3 rounded" style={{ background: 'var(--sapInformationBackground)' }}>
                  <FileText size={16} style={{ color: 'var(--sapInformativeColor)' }} />
                  <div className="flex-1">
                    <div className="text-sm font-medium" style={{ color: 'var(--sapInformativeTextColor)' }}>
                      Claim Submitted
                    </div>
                    <div className="text-xs" style={{ color: 'var(--sapInformativeTextColor)' }}>
                      {formatDate(claim.claimSubmittedAt)} • Ref: {claim.claimRef}
                    </div>
                  </div>
                </div>
              )}

              {claim.settledAt && (
                <div className="flex items-center gap-3 p-3 rounded" style={{ background: 'var(--sapSuccessBackground)' }}>
                  <CheckCircle size={16} style={{ color: 'var(--sapPositiveColor)' }} />
                  <div className="flex-1">
                    <div className="text-sm font-medium" style={{ color: 'var(--sapPositiveTextColor)' }}>
                      Claim Settled
                    </div>
                    <div className="text-xs" style={{ color: 'var(--sapPositiveTextColor)' }}>
                      {formatDate(claim.settledAt)} • Ref: {claim.settlementRef}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Supporting Evidence */}
          {claim.supportingEvidence && claim.supportingEvidence.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--sapTextColor)' }}>
                Supporting Evidence ({claim.supportingEvidence.length} documents)
              </h4>
              <div className="flex flex-wrap gap-2">
                {claim.supportingEvidence.map((docId, idx) => (
                  <div key={idx} className="px-3 py-2 rounded text-xs" style={{ background: 'var(--sapList_Background)', color: 'var(--sapTextColor)' }}>
                    Document #{docId}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-4 border-t" style={{ borderColor: 'var(--sapList_BorderColor)' }}>
            {claim.status === 'DRAFT' && !claim.noticeIssuedAt && (
              <button className="px-4 py-2 rounded text-sm font-medium" style={{
                background: 'var(--sapButton_Emphasized_Background)',
                color: 'var(--sapButton_Emphasized_TextColor)',
              }}>
                Issue Notice
              </button>
            )}
            {claim.status === 'NOTICE_ISSUED' && (
              <button className="px-4 py-2 rounded text-sm font-medium" style={{
                background: 'var(--sapButton_Emphasized_Background)',
                color: 'var(--sapButton_Emphasized_TextColor)',
              }}>
                Submit Claim
              </button>
            )}
            {claim.status === 'UNDER_NEGOTIATION' && (
              <button className="px-4 py-2 rounded text-sm font-medium" style={{
                background: 'var(--sapButton_Accept_Background)',
                color: 'var(--sapButton_Accept_TextColor)',
                border: '1px solid var(--sapButton_Accept_BorderColor)',
              }}>
                Record Settlement
              </button>
            )}
            <button className="px-4 py-2 rounded text-sm font-medium" style={{
              background: 'var(--sapButton_Background)',
              color: 'var(--sapButton_TextColor)',
              border: '1px solid var(--sapButton_BorderColor)',
            }}>
              View Correspondence
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Create Claim Modal ──────────────────────────────────────────────────────

function CreateClaimModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="sap-card max-w-3xl w-full max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b" style={{ borderColor: 'var(--sapList_BorderColor)' }}>
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold" style={{ color: 'var(--sapTextColor)' }}>
              Create New Claim
            </h3>
            <button onClick={onClose} className="p-2 rounded hover:bg-[var(--sapButton_Hover_Background)]">×</button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="p-4 rounded" style={{ background: 'var(--sapWarningBackground)' }}>
            <div className="flex items-start gap-2">
              <AlertTriangle size={16} style={{ color: 'var(--sapCriticalColor)' }} />
              <div className="flex-1">
                <div className="text-sm font-semibold mb-1" style={{ color: 'var(--sapCriticalTextColor)' }}>
                  Critical: Notice Timing
                </div>
                <div className="text-xs" style={{ color: 'var(--sapCriticalTextColor)' }}>
                  Most claims fail due to late notice. Issue notice within the contractual period (typically 7-14 days from the event). The system will track the deadline and alert you.
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--sapTextColor)' }}>
              Claim Type <span style={{ color: 'var(--sapField_RequiredColor)' }}>*</span>
            </label>
            <select
              className="w-full px-3 py-2 rounded border text-sm"
              style={{
                background: 'var(--sapField_Background)',
                borderColor: 'var(--sapField_BorderColor)',
                color: 'var(--sapField_TextColor)',
              }}
            >
              <option value="EOT">Extension of Time</option>
              <option value="PROLONGATION_COST">Prolongation Cost</option>
              <option value="IDLING">Idling Charges</option>
              <option value="ACCELERATION">Acceleration Cost</option>
              <option value="CHANGE_IN_LAW">Change in Law</option>
              <option value="DISPUTED_QUANTITY">Disputed Quantity</option>
              <option value="DISPUTED_RATE">Disputed Rate</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--sapTextColor)' }}>
              Title <span style={{ color: 'var(--sapField_RequiredColor)' }}>*</span>
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 rounded border text-sm"
              style={{
                background: 'var(--sapField_Background)',
                borderColor: 'var(--sapField_BorderColor)',
                color: 'var(--sapField_TextColor)',
              }}
              placeholder="Enter claim title..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--sapTextColor)' }}>
              Description <span style={{ color: 'var(--sapField_RequiredColor)' }}>*</span>
            </label>
            <textarea
              rows={4}
              className="w-full px-3 py-2 rounded border text-sm"
              style={{
                background: 'var(--sapField_Background)',
                borderColor: 'var(--sapField_BorderColor)',
                color: 'var(--sapField_TextColor)',
              }}
              placeholder="Describe the claim in detail..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--sapTextColor)' }}>
              Contractual Clause <span style={{ color: 'var(--sapField_RequiredColor)' }}>*</span>
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 rounded border text-sm"
              style={{
                background: 'var(--sapField_Background)',
                borderColor: 'var(--sapField_BorderColor)',
                color: 'var(--sapField_TextColor)',
              }}
              placeholder="e.g., Clause 12.3 - Force Majeure"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--sapTextColor)' }}>
                Event Date <span style={{ color: 'var(--sapField_RequiredColor)' }}>*</span>
              </label>
              <input
                type="date"
                className="w-full px-3 py-2 rounded border text-sm"
                style={{
                  background: 'var(--sapField_Background)',
                  borderColor: 'var(--sapField_BorderColor)',
                  color: 'var(--sapField_TextColor)',
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--sapTextColor)' }}>
                Quantum (if monetary)
              </label>
              <input
                type="number"
                className="w-full px-3 py-2 rounded border text-sm"
                style={{
                  background: 'var(--sapField_Background)',
                  borderColor: 'var(--sapField_BorderColor)',
                  color: 'var(--sapField_TextColor)',
                }}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t" style={{ borderColor: 'var(--sapList_BorderColor)' }}>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded text-sm font-medium"
              style={{
                background: 'var(--sapButton_Background)',
                color: 'var(--sapButton_TextColor)',
                border: '1px solid var(--sapButton_BorderColor)',
              }}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 rounded text-sm font-medium"
              style={{
                background: 'var(--sapButton_Emphasized_Background)',
                color: 'var(--sapButton_Emphasized_TextColor)',
              }}
            >
              Create Claim
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
