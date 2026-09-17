/**
 * Part 18 — Bill Workbench Component
 * Main interface for generating and managing client bills
 */

import React, { useState } from 'react';
import { 
  FileText, CheckCircle, Clock, AlertTriangle, 
  Download, Printer, Eye, Edit2, Plus, Filter,
  TrendingUp, DollarSign, Calendar, Hash
} from 'lucide-react';
import { clientBills, billingKpis } from '../data/billingData';
import type { ClientBill, BillStatus, BillType } from '../types/billing';
import { formatCurrency, formatDate } from '../utils/formatting';

export function BillWorkbench() {
  const [selectedBill, setSelectedBill] = useState<ClientBill | null>(null);
  const [filterStatus, setFilterStatus] = useState<BillStatus | 'ALL'>('ALL');
  const [filterType, setFilterType] = useState<BillType | 'ALL'>('ALL');
  const [showGenerateModal, setShowGenerateModal] = useState(false);

  const filteredBills = clientBills.filter(bill => {
    if (filterStatus !== 'ALL' && bill.status !== filterStatus) return false;
    if (filterType !== 'ALL' && bill.billType !== filterType) return false;
    return true;
  });

  const getStatusColor = (status: BillStatus) => {
    switch (status) {
      case 'DRAFT':
      case 'PREPARED': return 'var(--sapNeutralColor)';
      case 'CHECKED':
      case 'APPROVED': return 'var(--sapInformativeColor)';
      case 'SUBMITTED': return 'var(--sapCriticalColor)';
      case 'CERTIFIED':
      case 'PAID': return 'var(--sapPositiveColor)';
      case 'PARTIALLY_PAID': return 'var(--sapCriticalColor)';
      case 'CANCELLED':
      case 'REJECTED': return 'var(--sapNegativeColor)';
      default: return 'var(--sapContent_LabelColor)';
    }
  };

  const getBillTypeLabel = (type: BillType) => {
    const labels: Record<BillType, string> = {
      'RA': 'RA Bill',
      'MOBILISATION_ADVANCE': 'Mob. Advance',
      'MATERIAL_ADVANCE': 'Mat. Advance',
      'MILESTONE': 'Milestone',
      'SUPPLEMENTARY': 'Supplementary',
      'FINAL': 'Final Bill',
      'DLP_RELEASE': 'DLP Release',
      'ESCALATION': 'Escalation',
      'CLAIM': 'Claim',
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--sapTextColor)' }}>
            Bill Workbench
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
            Generate and manage client bills from certified measurement books
          </p>
        </div>
        <button
          onClick={() => setShowGenerateModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium"
          style={{
            background: 'var(--sapButton_Emphasized_Background)',
            color: 'var(--sapButton_Emphasized_TextColor)',
          }}
        >
          <Plus size={16} />
          Generate Bill
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="sap-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
              Billed This Period
            </span>
            <DollarSign size={16} style={{ color: 'var(--sapAccentColor6)' }} />
          </div>
          <div className="text-2xl font-bold" style={{ color: 'var(--sapTextColor)' }}>
            {formatCurrency(billingKpis.billedThisPeriod, { compact: true })}
          </div>
          <div className="text-xs mt-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
            YTD: {formatCurrency(billingKpis.billedYtd, { compact: true })}
          </div>
        </div>

        <div className="sap-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
              Work Done but Unbilled
            </span>
            <AlertTriangle size={16} style={{ color: 'var(--sapCriticalColor)' }} />
          </div>
          <div className="text-2xl font-bold" style={{ color: 'var(--sapCriticalColor)' }}>
            {formatCurrency(billingKpis.workDoneButUnbilled, { compact: true })}
          </div>
          <div className="text-xs mt-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
            Most important commercial number
          </div>
        </div>

        <div className="sap-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
              Certified vs Billed
            </span>
            <CheckCircle size={16} style={{ color: 'var(--sapPositiveColor)' }} />
          </div>
          <div className="text-2xl font-bold" style={{ color: 'var(--sapPositiveColor)' }}>
            {billingKpis.certifiedVsBilledPct}%
          </div>
          <div className="text-xs mt-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
            Billing efficiency
          </div>
        </div>

        <div className="sap-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
              Days Sales Outstanding
            </span>
            <Clock size={16} style={{ color: 'var(--sapAccentColor1)' }} />
          </div>
          <div className="text-2xl font-bold" style={{ color: 'var(--sapTextColor)' }}>
            {billingKpis.daysSalesOutstanding} days
          </div>
          <div className="text-xs mt-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
            Target: ≤ 45 days
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter size={16} style={{ color: 'var(--sapContent_LabelColor)' }} />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as BillStatus | 'ALL')}
            className="px-3 py-2 rounded border text-sm"
            style={{
              background: 'var(--sapField_Background)',
              borderColor: 'var(--sapField_BorderColor)',
              color: 'var(--sapField_TextColor)',
            }}
          >
            <option value="ALL">All Status</option>
            <option value="DRAFT">Draft</option>
            <option value="PREPARED">Prepared</option>
            <option value="CHECKED">Checked</option>
            <option value="APPROVED">Approved</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="CERTIFIED">Certified</option>
            <option value="PAID">Paid</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as BillType | 'ALL')}
            className="px-3 py-2 rounded border text-sm"
            style={{
              background: 'var(--sapField_Background)',
              borderColor: 'var(--sapField_BorderColor)',
              color: 'var(--sapField_TextColor)',
            }}
          >
            <option value="ALL">All Types</option>
            <option value="RA">RA Bill</option>
            <option value="MILESTONE">Milestone</option>
            <option value="SUPPLEMENTARY">Supplementary</option>
            <option value="FINAL">Final Bill</option>
          </select>
        </div>
      </div>

      {/* Bill List */}
      <div className="sap-card overflow-hidden">
        <table className="w-full">
          <thead style={{ background: 'var(--sapList_HeaderBackground)' }}>
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>
                Bill No
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>
                Type
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>
                Period
              </th>
              <th className="text-right px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>
                Gross Value
              </th>
              <th className="text-right px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>
                Deductions
              </th>
              <th className="text-right px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>
                Net Receivable
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>
                Status
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>
                Submitted
              </th>
              <th className="text-center px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredBills.map((bill, idx) => (
              <tr
                key={bill.id}
                className="cursor-pointer hover:bg-[var(--sapList_Hover_Background)]"
                style={{
                  borderBottom: '1px solid var(--sapList_BorderColor)',
                  background: idx % 2 === 0 ? 'var(--sapList_Background)' : 'var(--sapList_AlternatingBackground)',
                }}
                onClick={() => setSelectedBill(bill)}
              >
                <td className="px-4 py-3 text-sm font-mono" style={{ color: 'var(--sapTextColor)' }}>
                  {bill.billNo}
                </td>
                <td className="px-4 py-3 text-sm" style={{ color: 'var(--sapTextColor)' }}>
                  {getBillTypeLabel(bill.billType)}
                  {bill.raNumber && <span className="text-xs ml-1" style={{ color: 'var(--sapContent_LabelColor)' }}>#{bill.raNumber}</span>}
                </td>
                <td className="px-4 py-3 text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>
                  {bill.periodFrom && bill.periodTo ? (
                    <span>{formatDate(bill.periodFrom)} - {formatDate(bill.periodTo)}</span>
                  ) : (
                    <span>{formatDate(bill.billDate)}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-right" style={{ color: 'var(--sapTextColor)' }}>
                  {formatCurrency(bill.grossValue)}
                </td>
                <td className="px-4 py-3 text-sm text-right" style={{ color: 'var(--sapNegativeColor)' }}>
                  ({formatCurrency(bill.totalDeductions)})
                </td>
                <td className="px-4 py-3 text-sm text-right font-semibold" style={{ color: 'var(--sapTextColor)' }}>
                  {formatCurrency(bill.netReceivable)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className="text-xs px-2 py-1 rounded font-medium"
                    style={{
                      background: `${getStatusColor(bill.status)}20`,
                      color: getStatusColor(bill.status),
                    }}
                  >
                    {bill.status.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>
                  {bill.submittedAt ? formatDate(bill.submittedAt) : '—'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      className="p-1 rounded hover:bg-[var(--sapButton_Hover_Background)]"
                      title="View"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedBill(bill);
                      }}
                    >
                      <Eye size={16} style={{ color: 'var(--sapButton_TextColor)' }} />
                    </button>
                    <button
                      className="p-1 rounded hover:bg-[var(--sapButton_Hover_Background)]"
                      title="Print"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Printer size={16} style={{ color: 'var(--sapButton_TextColor)' }} />
                    </button>
                    <button
                      className="p-1 rounded hover:bg-[var(--sapButton_Hover_Background)]"
                      title="Download Backup Pack"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Download size={16} style={{ color: 'var(--sapButton_TextColor)' }} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Bill Detail Modal */}
      {selectedBill && (
        <BillDetailModal bill={selectedBill} onClose={() => setSelectedBill(null)} />
      )}

      {/* Generate Bill Modal */}
      {showGenerateModal && (
        <GenerateBillModal onClose={() => setShowGenerateModal(false)} />
      )}
    </div>
  );
}

// ─── Bill Detail Modal ───────────────────────────────────────────────────────

function BillDetailModal({ bill, onClose }: { bill: ClientBill; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="sap-card max-w-6xl w-full max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b" style={{ borderColor: 'var(--sapList_BorderColor)' }}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold" style={{ color: 'var(--sapTextColor)' }}>
                {bill.billNo}
              </h3>
              <p className="text-sm mt-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
                Project {bill.projectId} • {bill.periodFrom && bill.periodTo ? `${formatDate(bill.periodFrom)} - ${formatDate(bill.periodTo)}` : formatDate(bill.billDate)}
              </p>
            </div>
            <button onClick={onClose} className="p-2 rounded hover:bg-[var(--sapButton_Hover_Background)]">×</button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Financial Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded" style={{ background: 'var(--sapList_Background)' }}>
              <div className="text-xs mb-1" style={{ color: 'var(--sapContent_LabelColor)' }}>Gross Value</div>
              <div className="text-xl font-bold" style={{ color: 'var(--sapTextColor)' }}>
                {formatCurrency(bill.grossValue)}
              </div>
            </div>
            <div className="p-4 rounded" style={{ background: 'var(--sapErrorBackground)' }}>
              <div className="text-xs mb-1" style={{ color: 'var(--sapNegativeTextColor)' }}>Total Deductions</div>
              <div className="text-xl font-bold" style={{ color: 'var(--sapNegativeTextColor)' }}>
                ({formatCurrency(bill.totalDeductions)})
              </div>
            </div>
            <div className="p-4 rounded" style={{ background: 'var(--sapInformationBackground)' }}>
              <div className="text-xs mb-1" style={{ color: 'var(--sapInformativeTextColor)' }}>Taxable Value</div>
              <div className="text-xl font-bold" style={{ color: 'var(--sapInformativeTextColor)' }}>
                {formatCurrency(bill.taxableValue)}
              </div>
            </div>
            <div className="p-4 rounded" style={{ background: 'var(--sapSuccessBackground)' }}>
              <div className="text-xs mb-1" style={{ color: 'var(--sapPositiveTextColor)' }}>Net Receivable</div>
              <div className="text-xl font-bold" style={{ color: 'var(--sapPositiveTextColor)' }}>
                {formatCurrency(bill.netReceivable)}
              </div>
            </div>
          </div>

          {/* Tax Breakdown */}
          <div>
            <h4 className="text-sm font-semibold mb-3" style={{ color: 'var(--sapTextColor)' }}>
              Tax Breakdown
            </h4>
            <div className="grid grid-cols-4 gap-4">
              <div className="p-3 rounded border" style={{ borderColor: 'var(--sapList_BorderColor)' }}>
                <div className="text-xs mb-1" style={{ color: 'var(--sapContent_LabelColor)' }}>CGST</div>
                <div className="text-lg font-bold" style={{ color: 'var(--sapTextColor)' }}>
                  {formatCurrency(bill.cgst)}
                </div>
              </div>
              <div className="p-3 rounded border" style={{ borderColor: 'var(--sapList_BorderColor)' }}>
                <div className="text-xs mb-1" style={{ color: 'var(--sapContent_LabelColor)' }}>SGST</div>
                <div className="text-lg font-bold" style={{ color: 'var(--sapTextColor)' }}>
                  {formatCurrency(bill.sgst)}
                </div>
              </div>
              <div className="p-3 rounded border" style={{ borderColor: 'var(--sapList_BorderColor)' }}>
                <div className="text-xs mb-1" style={{ color: 'var(--sapContent_LabelColor)' }}>IGST</div>
                <div className="text-lg font-bold" style={{ color: 'var(--sapTextColor)' }}>
                  {formatCurrency(bill.igst)}
                </div>
              </div>
              <div className="p-3 rounded border" style={{ borderColor: 'var(--sapList_BorderColor)' }}>
                <div className="text-xs mb-1" style={{ color: 'var(--sapContent_LabelColor)' }}>Cess</div>
                <div className="text-lg font-bold" style={{ color: 'var(--sapTextColor)' }}>
                  {formatCurrency(bill.cess)}
                </div>
              </div>
            </div>
          </div>

          {/* Certification Trail */}
          <div>
            <h4 className="text-sm font-semibold mb-3" style={{ color: 'var(--sapTextColor)' }}>
              Certification Trail
            </h4>
            <div className="space-y-2">
              {bill.preparedBy && (
                <div className="flex items-center gap-3 p-3 rounded" style={{ background: 'var(--sapList_Background)' }}>
                  <CheckCircle size={16} style={{ color: 'var(--sapPositiveColor)' }} />
                  <div className="flex-1">
                    <div className="text-sm font-medium" style={{ color: 'var(--sapTextColor)' }}>Prepared by User {bill.preparedBy}</div>
                  </div>
                </div>
              )}
              {bill.checkedBy && (
                <div className="flex items-center gap-3 p-3 rounded" style={{ background: 'var(--sapList_Background)' }}>
                  <CheckCircle size={16} style={{ color: 'var(--sapPositiveColor)' }} />
                  <div className="flex-1">
                    <div className="text-sm font-medium" style={{ color: 'var(--sapTextColor)' }}>Checked by User {bill.checkedBy}</div>
                  </div>
                </div>
              )}
              {bill.approvedBy && (
                <div className="flex items-center gap-3 p-3 rounded" style={{ background: 'var(--sapList_Background)' }}>
                  <CheckCircle size={16} style={{ color: 'var(--sapPositiveColor)' }} />
                  <div className="flex-1">
                    <div className="text-sm font-medium" style={{ color: 'var(--sapTextColor)' }}>Approved by User {bill.approvedBy}</div>
                  </div>
                </div>
              )}
              {bill.submittedAt && (
                <div className="flex items-center gap-3 p-3 rounded" style={{ background: 'var(--sapInformationBackground)' }}>
                  <Clock size={16} style={{ color: 'var(--sapInformativeColor)' }} />
                  <div className="flex-1">
                    <div className="text-sm font-medium" style={{ color: 'var(--sapInformativeTextColor)' }}>Submitted on {formatDate(bill.submittedAt)}</div>
                    <div className="text-xs" style={{ color: 'var(--sapInformativeTextColor)' }}>Ref: {bill.submissionRef}</div>
                  </div>
                </div>
              )}
              {bill.certifiedAt && (
                <div className="flex items-center gap-3 p-3 rounded" style={{ background: 'var(--sapSuccessBackground)' }}>
                  <CheckCircle size={16} style={{ color: 'var(--sapPositiveColor)' }} />
                  <div className="flex-1">
                    <div className="text-sm font-medium" style={{ color: 'var(--sapPositiveTextColor)' }}>Certified on {formatDate(bill.certifiedAt)}</div>
                    <div className="text-xs" style={{ color: 'var(--sapPositiveTextColor)' }}>
                      Certified Value: {formatCurrency(bill.certifiedValue || 0)} • Ref: {bill.certificationRef}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Shortfall Analysis */}
          {bill.shortfallValue && bill.shortfallValue > 0 && (
            <div className="p-4 rounded" style={{ background: 'var(--sapWarningBackground)' }}>
              <div className="flex items-start gap-2">
                <AlertTriangle size={16} style={{ color: 'var(--sapCriticalColor)' }} />
                <div className="flex-1">
                  <div className="text-sm font-semibold mb-1" style={{ color: 'var(--sapCriticalTextColor)' }}>
                    Certification Shortfall: {formatCurrency(bill.shortfallValue)}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--sapCriticalTextColor)' }}>
                    {bill.clientDeductionNote}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-4 border-t" style={{ borderColor: 'var(--sapList_BorderColor)' }}>
            <button className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium" style={{
              background: 'var(--sapButton_Emphasized_Background)',
              color: 'var(--sapButton_Emphasized_TextColor)',
            }}>
              <Printer size={16} />
              Print Bill
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium" style={{
              background: 'var(--sapButton_Background)',
              color: 'var(--sapButton_TextColor)',
              border: '1px solid var(--sapButton_BorderColor)',
            }}>
              <Download size={16} />
              Download Backup Pack
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium" style={{
              background: 'var(--sapButton_Background)',
              color: 'var(--sapButton_TextColor)',
              border: '1px solid var(--sapButton_BorderColor)',
            }}>
              <Eye size={16} />
              View MB Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Generate Bill Modal ─────────────────────────────────────────────────────

function GenerateBillModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="sap-card max-w-4xl w-full max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b" style={{ borderColor: 'var(--sapList_BorderColor)' }}>
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold" style={{ color: 'var(--sapTextColor)' }}>
              Generate New Bill
            </h3>
            <button onClick={onClose} className="p-2 rounded hover:bg-[var(--sapButton_Hover_Background)]">×</button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--sapTextColor)' }}>
                Bill Type <span style={{ color: 'var(--sapField_RequiredColor)' }}>*</span>
              </label>
              <select
                className="w-full px-3 py-2 rounded border text-sm"
                style={{
                  background: 'var(--sapField_Background)',
                  borderColor: 'var(--sapField_BorderColor)',
                  color: 'var(--sapField_TextColor)',
                }}
              >
                <option value="RA">RA Bill</option>
                <option value="MILESTONE">Milestone Bill</option>
                <option value="SUPPLEMENTARY">Supplementary Bill</option>
                <option value="FINAL">Final Bill</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--sapTextColor)' }}>
                Package
              </label>
              <select
                className="w-full px-3 py-2 rounded border text-sm"
                style={{
                  background: 'var(--sapField_Background)',
                  borderColor: 'var(--sapField_BorderColor)',
                  color: 'var(--sapField_TextColor)',
                }}
              >
                <option value="">All Packages</option>
                <option value="1">Package 1 - Civil Works</option>
                <option value="2">Package 2 - Electrical</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--sapTextColor)' }}>
                Period From <span style={{ color: 'var(--sapField_RequiredColor)' }}>*</span>
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
                Period To <span style={{ color: 'var(--sapField_RequiredColor)' }}>*</span>
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

          <div className="p-4 rounded" style={{ background: 'var(--sapInformationBackground)' }}>
            <div className="flex items-start gap-2">
              <FileText size={16} style={{ color: 'var(--sapInformativeColor)' }} />
              <div className="flex-1">
                <div className="text-sm font-semibold mb-1" style={{ color: 'var(--sapInformativeTextColor)' }}>
                  Auto-Assembly from Certified MBs
                </div>
                <div className="text-xs" style={{ color: 'var(--sapInformativeTextColor)' }}>
                  The system will automatically assemble bill items from all certified, unbilled measurement books in the selected period. You can exclude specific MBs with a reason if needed.
                </div>
              </div>
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
              Generate Bill
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
