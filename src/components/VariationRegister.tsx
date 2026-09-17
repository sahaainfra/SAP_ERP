/**
 * Part 18 — Variation Register Component
 * Manage variations/change orders with approval workflow
 */

import React, { useState } from 'react';
import { 
  FileText, CheckCircle, Clock, AlertTriangle, 
  Eye, Edit2, Plus, Filter, Download, TrendingUp
} from 'lucide-react';
import { variations } from '../data/billingData';
import type { Variation, VariationStatus, VariationType } from '../types/billing';
import { formatCurrency, formatDate } from '../utils/formatting';

export function VariationRegister() {
  const [selectedVariation, setSelectedVariation] = useState<Variation | null>(null);
  const [filterStatus, setFilterStatus] = useState<VariationStatus | 'ALL'>('ALL');
  const [filterType, setFilterType] = useState<VariationType | 'ALL'>('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const filteredVariations = variations.filter(v => {
    if (filterStatus !== 'ALL' && v.status !== filterStatus) return false;
    if (filterType !== 'ALL' && v.variationType !== filterType) return false;
    return true;
  });

  const getStatusColor = (status: VariationStatus) => {
    switch (status) {
      case 'PROPOSED': return 'var(--sapNeutralColor)';
      case 'SUBMITTED': return 'var(--sapInformativeColor)';
      case 'CLIENT_APPROVED': return 'var(--sapPositiveColor)';
      case 'CLIENT_REJECTED': return 'var(--sapNegativeColor)';
      case 'INCORPORATED': return 'var(--sapPositiveColor)';
      default: return 'var(--sapContent_LabelColor)';
    }
  };

  const getTypeLabel = (type: VariationType) => {
    const labels: Record<VariationType, string> = {
      'ADDITION': 'Addition',
      'OMISSION': 'Omission',
      'SUBSTITUTION': 'Substitution',
      'RATE_CHANGE': 'Rate Change',
      'TIME': 'Time Extension',
    };
    return labels[type] || type;
  };

  const totalApproved = filteredVariations
    .filter(v => v.status === 'CLIENT_APPROVED' || v.status === 'INCORPORATED')
    .reduce((sum, v) => sum + (v.approvedValue || 0), 0);

  const totalPending = filteredVariations
    .filter(v => v.status === 'PROPOSED' || v.status === 'SUBMITTED')
    .reduce((sum, v) => sum + (v.estimatedValue || 0), 0);

  const totalBilled = filteredVariations.reduce((sum, v) => sum + (v.billedValue || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--sapTextColor)' }}>
            Variation Register
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
            Manage scope changes, additions, omissions, and rate changes
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
          New Variation
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="sap-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
              Total Variations
            </span>
            <FileText size={16} style={{ color: 'var(--sapAccentColor6)' }} />
          </div>
          <div className="text-2xl font-bold" style={{ color: 'var(--sapTextColor)' }}>
            {filteredVariations.length}
          </div>
        </div>

        <div className="sap-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
              Approved Value
            </span>
            <CheckCircle size={16} style={{ color: 'var(--sapPositiveColor)' }} />
          </div>
          <div className="text-2xl font-bold" style={{ color: 'var(--sapPositiveColor)' }}>
            {formatCurrency(totalApproved, { compact: true })}
          </div>
        </div>

        <div className="sap-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
              Pending Approval
            </span>
            <Clock size={16} style={{ color: 'var(--sapCriticalColor)' }} />
          </div>
          <div className="text-2xl font-bold" style={{ color: 'var(--sapCriticalColor)' }}>
            {formatCurrency(totalPending, { compact: true })}
          </div>
        </div>

        <div className="sap-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
              Billed Value
            </span>
            <TrendingUp size={16} style={{ color: 'var(--sapInformativeColor)' }} />
          </div>
          <div className="text-2xl font-bold" style={{ color: 'var(--sapTextColor)' }}>
            {formatCurrency(totalBilled, { compact: true })}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter size={16} style={{ color: 'var(--sapContent_LabelColor)' }} />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as VariationStatus | 'ALL')}
            className="px-3 py-2 rounded border text-sm"
            style={{
              background: 'var(--sapField_Background)',
              borderColor: 'var(--sapField_BorderColor)',
              color: 'var(--sapField_TextColor)',
            }}
          >
            <option value="ALL">All Status</option>
            <option value="PROPOSED">Proposed</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="CLIENT_APPROVED">Client Approved</option>
            <option value="CLIENT_REJECTED">Client Rejected</option>
            <option value="INCORPORATED">Incorporated</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as VariationType | 'ALL')}
            className="px-3 py-2 rounded border text-sm"
            style={{
              background: 'var(--sapField_Background)',
              borderColor: 'var(--sapField_BorderColor)',
              color: 'var(--sapField_TextColor)',
            }}
          >
            <option value="ALL">All Types</option>
            <option value="ADDITION">Addition</option>
            <option value="OMISSION">Omission</option>
            <option value="SUBSTITUTION">Substitution</option>
            <option value="RATE_CHANGE">Rate Change</option>
            <option value="TIME">Time Extension</option>
          </select>
        </div>
      </div>

      {/* Variation List */}
      <div className="sap-card overflow-hidden">
        <table className="w-full">
          <thead style={{ background: 'var(--sapList_HeaderBackground)' }}>
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>
                Variation No
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>
                Title
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>
                Type
              </th>
              <th className="text-right px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>
                Estimated
              </th>
              <th className="text-right px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>
                Approved
              </th>
              <th className="text-right px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>
                Billed
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>
                Status
              </th>
              <th className="text-center px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>
                Risk
              </th>
              <th className="text-center px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredVariations.map((variation, idx) => (
              <tr
                key={variation.id}
                className="cursor-pointer hover:bg-[var(--sapList_Hover_Background)]"
                style={{
                  borderBottom: '1px solid var(--sapList_BorderColor)',
                  background: idx % 2 === 0 ? 'var(--sapList_Background)' : 'var(--sapList_AlternatingBackground)',
                }}
                onClick={() => setSelectedVariation(variation)}
              >
                <td className="px-4 py-3 text-sm font-mono" style={{ color: 'var(--sapTextColor)' }}>
                  {variation.variationNo}
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm font-medium" style={{ color: 'var(--sapTextColor)' }}>
                    {variation.title}
                  </div>
                  {variation.clientInstructionRef && (
                    <div className="text-xs mt-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
                      Client Ref: {variation.clientInstructionRef}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-sm" style={{ color: 'var(--sapTextColor)' }}>
                  {getTypeLabel(variation.variationType)}
                </td>
                <td className="px-4 py-3 text-sm text-right" style={{ color: 'var(--sapTextColor)' }}>
                  {variation.estimatedValue ? formatCurrency(variation.estimatedValue) : '—'}
                </td>
                <td className="px-4 py-3 text-sm text-right" style={{ color: 'var(--sapTextColor)' }}>
                  {variation.approvedValue ? formatCurrency(variation.approvedValue) : '—'}
                </td>
                <td className="px-4 py-3 text-sm text-right font-semibold" style={{ color: 'var(--sapTextColor)' }}>
                  {variation.billedValue ? formatCurrency(variation.billedValue) : '—'}
                </td>
                <td className="px-4 py-3">
                  <span
                    className="text-xs px-2 py-1 rounded font-medium"
                    style={{
                      background: `${getStatusColor(variation.status)}20`,
                      color: getStatusColor(variation.status),
                    }}
                  >
                    {variation.status.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  {variation.isAtRisk && (
                    <span title="Billed before client approval">
                      <AlertTriangle size={16} style={{ color: 'var(--sapNegativeColor)' }} />
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      className="p-1 rounded hover:bg-[var(--sapButton_Hover_Background)]"
                      title="View"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedVariation(variation);
                      }}
                    >
                      <Eye size={16} style={{ color: 'var(--sapButton_TextColor)' }} />
                    </button>
                    {(variation.status === 'PROPOSED' || variation.status === 'SUBMITTED') && (
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

      {/* Variation Detail Modal */}
      {selectedVariation && (
        <VariationDetailModal variation={selectedVariation} onClose={() => setSelectedVariation(null)} />
      )}

      {/* Create Variation Modal */}
      {showCreateModal && (
        <CreateVariationModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  );
}

// ─── Variation Detail Modal ──────────────────────────────────────────────────

function VariationDetailModal({ variation, onClose }: { variation: Variation; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="sap-card max-w-4xl w-full max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b" style={{ borderColor: 'var(--sapList_BorderColor)' }}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold" style={{ color: 'var(--sapTextColor)' }}>
                {variation.variationNo}
              </h3>
              <p className="text-sm mt-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
                {variation.title}
              </p>
            </div>
            <button onClick={onClose} className="p-2 rounded hover:bg-[var(--sapButton_Hover_Background)]">×</button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Status & Risk */}
          <div className="flex items-center gap-4">
            <span
              className="text-sm px-3 py-1 rounded font-medium"
              style={{
                background: `${variation.isAtRisk ? 'var(--sapErrorBackground)' : 'var(--sapSuccessBackground)'}20`,
                color: variation.isAtRisk ? 'var(--sapNegativeTextColor)' : 'var(--sapPositiveTextColor)',
              }}
            >
              {variation.isAtRisk ? '⚠ At Risk - Billed Before Approval' : '✓ Normal Billing'}
            </span>
            <span
              className="text-sm px-3 py-1 rounded font-medium"
              style={{
                background: 'var(--sapInformationBackground)',
                color: 'var(--sapInformativeTextColor)',
              }}
            >
              {variation.variationType.replace(/_/g, ' ')}
            </span>
          </div>

          {/* Description */}
          {variation.description && (
            <div>
              <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--sapTextColor)' }}>
                Description
              </h4>
              <div className="p-3 rounded text-sm" style={{ background: 'var(--sapList_Background)', color: 'var(--sapTextColor)' }}>
                {variation.description}
              </div>
            </div>
          )}

          {/* Financial Summary */}
          <div>
            <h4 className="text-sm font-semibold mb-3" style={{ color: 'var(--sapTextColor)' }}>
              Financial Summary
            </h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded" style={{ background: 'var(--sapList_Background)' }}>
                <div className="text-xs mb-1" style={{ color: 'var(--sapContent_LabelColor)' }}>Estimated Value</div>
                <div className="text-xl font-bold" style={{ color: 'var(--sapTextColor)' }}>
                  {variation.estimatedValue ? formatCurrency(variation.estimatedValue) : '—'}
                </div>
              </div>
              <div className="p-4 rounded" style={{ background: 'var(--sapSuccessBackground)' }}>
                <div className="text-xs mb-1" style={{ color: 'var(--sapPositiveTextColor)' }}>Approved Value</div>
                <div className="text-xl font-bold" style={{ color: 'var(--sapPositiveTextColor)' }}>
                  {variation.approvedValue ? formatCurrency(variation.approvedValue) : '—'}
                </div>
              </div>
              <div className="p-4 rounded" style={{ background: 'var(--sapInformationBackground)' }}>
                <div className="text-xs mb-1" style={{ color: 'var(--sapInformativeTextColor)' }}>Billed Value</div>
                <div className="text-xl font-bold" style={{ color: 'var(--sapInformativeTextColor)' }}>
                  {variation.billedValue ? formatCurrency(variation.billedValue) : '—'}
                </div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div>
            <h4 className="text-sm font-semibold mb-3" style={{ color: 'var(--sapTextColor)' }}>
              Timeline
            </h4>
            <div className="space-y-2">
              {variation.instructionDate && (
                <div className="flex items-center gap-3 p-3 rounded" style={{ background: 'var(--sapList_Background)' }}>
                  <FileText size={16} style={{ color: 'var(--sapContent_LabelColor)' }} />
                  <div className="flex-1">
                    <div className="text-sm font-medium" style={{ color: 'var(--sapTextColor)' }}>
                      Client Instruction
                    </div>
                    <div className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
                      {formatDate(variation.instructionDate)} • Ref: {variation.clientInstructionRef}
                    </div>
                  </div>
                </div>
              )}
              {variation.submittedAt && (
                <div className="flex items-center gap-3 p-3 rounded" style={{ background: 'var(--sapList_Background)' }}>
                  <Clock size={16} style={{ color: 'var(--sapInformativeColor)' }} />
                  <div className="flex-1">
                    <div className="text-sm font-medium" style={{ color: 'var(--sapTextColor)' }}>
                      Submitted for Approval
                    </div>
                    <div className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
                      {formatDate(variation.submittedAt)}
                    </div>
                  </div>
                </div>
              )}
              {variation.clientApprovedAt && (
                <div className="flex items-center gap-3 p-3 rounded" style={{ background: 'var(--sapSuccessBackground)' }}>
                  <CheckCircle size={16} style={{ color: 'var(--sapPositiveColor)' }} />
                  <div className="flex-1">
                    <div className="text-sm font-medium" style={{ color: 'var(--sapPositiveTextColor)' }}>
                      Client Approved
                    </div>
                    <div className="text-xs" style={{ color: 'var(--sapPositiveTextColor)' }}>
                      {formatDate(variation.clientApprovedAt)} • Ref: {variation.approvalRef}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Time Impact */}
          {variation.timeImpactDays && (
            <div className="p-4 rounded" style={{ background: 'var(--sapWarningBackground)' }}>
              <div className="flex items-start gap-2">
                <Clock size={16} style={{ color: 'var(--sapCriticalColor)' }} />
                <div className="flex-1">
                  <div className="text-sm font-semibold mb-1" style={{ color: 'var(--sapCriticalTextColor)' }}>
                    Time Impact: {variation.timeImpactDays > 0 ? '+' : ''}{variation.timeImpactDays} days
                  </div>
                  <div className="text-xs" style={{ color: 'var(--sapCriticalTextColor)' }}>
                    This variation impacts the project completion date
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Supporting Documents */}
          {variation.supportingDocuments && variation.supportingDocuments.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--sapTextColor)' }}>
                Supporting Documents ({variation.supportingDocuments.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {variation.supportingDocuments.map((docId, idx) => (
                  <div key={idx} className="px-3 py-2 rounded text-xs" style={{ background: 'var(--sapList_Background)', color: 'var(--sapTextColor)' }}>
                    Document #{docId}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-4 border-t" style={{ borderColor: 'var(--sapList_BorderColor)' }}>
            {variation.status === 'PROPOSED' && (
              <button className="px-4 py-2 rounded text-sm font-medium" style={{
                background: 'var(--sapButton_Emphasized_Background)',
                color: 'var(--sapButton_Emphasized_TextColor)',
              }}>
                Submit for Approval
              </button>
            )}
            {variation.status === 'SUBMITTED' && (
              <button className="px-4 py-2 rounded text-sm font-medium" style={{
                background: 'var(--sapButton_Accept_Background)',
                color: 'var(--sapButton_Accept_TextColor)',
                border: '1px solid var(--sapButton_Accept_BorderColor)',
              }}>
                Record Client Approval
              </button>
            )}
            {variation.status === 'CLIENT_APPROVED' && (
              <button className="px-4 py-2 rounded text-sm font-medium" style={{
                background: 'var(--sapButton_Emphasized_Background)',
                color: 'var(--sapButton_Emphasized_TextColor)',
              }}>
                Incorporate into BOQ
              </button>
            )}
            <button className="px-4 py-2 rounded text-sm font-medium" style={{
              background: 'var(--sapButton_Background)',
              color: 'var(--sapButton_TextColor)',
              border: '1px solid var(--sapButton_BorderColor)',
            }}>
              View BOQ Impact
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Create Variation Modal ──────────────────────────────────────────────────

function CreateVariationModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="sap-card max-w-3xl w-full max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b" style={{ borderColor: 'var(--sapList_BorderColor)' }}>
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold" style={{ color: 'var(--sapTextColor)' }}>
              Create New Variation
            </h3>
            <button onClick={onClose} className="p-2 rounded hover:bg-[var(--sapButton_Hover_Background)]">×</button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--sapTextColor)' }}>
              Variation Type <span style={{ color: 'var(--sapField_RequiredColor)' }}>*</span>
            </label>
            <select
              className="w-full px-3 py-2 rounded border text-sm"
              style={{
                background: 'var(--sapField_Background)',
                borderColor: 'var(--sapField_BorderColor)',
                color: 'var(--sapField_TextColor)',
              }}
            >
              <option value="ADDITION">Addition</option>
              <option value="OMISSION">Omission</option>
              <option value="SUBSTITUTION">Substitution</option>
              <option value="RATE_CHANGE">Rate Change</option>
              <option value="TIME">Time Extension</option>
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
              placeholder="Enter variation title..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--sapTextColor)' }}>
              Description
            </label>
            <textarea
              rows={4}
              className="w-full px-3 py-2 rounded border text-sm"
              style={{
                background: 'var(--sapField_Background)',
                borderColor: 'var(--sapField_BorderColor)',
                color: 'var(--sapField_TextColor)',
              }}
              placeholder="Describe the variation..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--sapTextColor)' }}>
                Client Instruction Ref
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 rounded border text-sm"
                style={{
                  background: 'var(--sapField_Background)',
                  borderColor: 'var(--sapField_BorderColor)',
                  color: 'var(--sapField_TextColor)',
                }}
                placeholder="e.g., CI/2026/025"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--sapTextColor)' }}>
                Instruction Date
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--sapTextColor)' }}>
                Estimated Value
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
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--sapTextColor)' }}>
                Time Impact (days)
              </label>
              <input
                type="number"
                className="w-full px-3 py-2 rounded border text-sm"
                style={{
                  background: 'var(--sapField_Background)',
                  borderColor: 'var(--sapField_BorderColor)',
                  color: 'var(--sapField_TextColor)',
                }}
                placeholder="0"
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
              Create Variation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
