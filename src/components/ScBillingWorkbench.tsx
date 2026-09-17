/**
 * Part 16 — SC Billing Workbench
 * Subcontractor bill creation and management with deduction engine
 */

import React, { useState } from 'react';
import { 
  FileText, CheckCircle, Clock, AlertTriangle, DollarSign, 
  Eye, Edit2, Plus, Filter, Download
} from 'lucide-react';
import { scBills, workOrders } from '../data/subcontractorData';
import type { ScBill, ScBillStatus } from '../types/subcontractor';
import { formatCurrency, formatDate } from '../utils/formatting';

export function ScBillingWorkbench() {
  const [selectedBill, setSelectedBill] = useState<ScBill | null>(null);
  const [filterStatus, setFilterStatus] = useState<ScBillStatus | 'ALL'>('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const filteredBills = scBills.filter(bill => {
    if (filterStatus === 'ALL') return true;
    return bill.status === filterStatus;
  });

  const getStatusColor = (status: ScBillStatus) => {
    switch (status) {
      case 'DRAFT': return 'var(--sapNeutralColor)';
      case 'MEASURED': return 'var(--sapInformativeColor)';
      case 'CHECKED': return 'var(--sapCriticalColor)';
      case 'CERTIFIED': return 'var(--sapPositiveColor)';
      case 'APPROVED_FOR_PAYMENT': return 'var(--sapPositiveColor)';
      case 'PAID': return 'var(--sapPositiveColor)';
      case 'REJECTED': return 'var(--sapNegativeColor)';
      default: return 'var(--sapContent_LabelColor)';
    }
  };

  const getWoDetails = (woId: number) => {
    return workOrders.find(wo => wo.id === woId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--sapTextColor)' }}>
            SC Billing Workbench
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
            Subcontractor bills with automated deduction engine
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
          New SC Bill
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="sap-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
              Pending Certification
            </span>
            <Clock size={16} style={{ color: 'var(--sapCriticalColor)' }} />
          </div>
          <div className="text-2xl font-bold" style={{ color: 'var(--sapTextColor)' }}>
            {scBills.filter(b => b.status === 'MEASURED' || b.status === 'CHECKED').length}
          </div>
          <div className="text-xs mt-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
            {formatCurrency(scBills.filter(b => b.status === 'MEASURED' || b.status === 'CHECKED').reduce((sum, b) => sum + b.grossValue, 0), { compact: true })}
          </div>
        </div>

        <div className="sap-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
              Certified (Unpaid)
            </span>
            <CheckCircle size={16} style={{ color: 'var(--sapInformativeColor)' }} />
          </div>
          <div className="text-2xl font-bold" style={{ color: 'var(--sapTextColor)' }}>
            {scBills.filter(b => b.status === 'CERTIFIED' || b.status === 'APPROVED_FOR_PAYMENT').length}
          </div>
          <div className="text-xs mt-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
            {formatCurrency(scBills.filter(b => b.status === 'CERTIFIED' || b.status === 'APPROVED_FOR_PAYMENT').reduce((sum, b) => sum + b.netPayable, 0), { compact: true })}
          </div>
        </div>

        <div className="sap-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
              Total Paid (This Month)
            </span>
            <DollarSign size={16} style={{ color: 'var(--sapPositiveColor)' }} />
          </div>
          <div className="text-2xl font-bold" style={{ color: 'var(--sapPositiveColor)' }}>
            {formatCurrency(scBills.filter(b => b.status === 'PAID').reduce((sum, b) => sum + b.netPayable, 0), { compact: true })}
          </div>
          <div className="text-xs mt-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
            {scBills.filter(b => b.status === 'PAID').length} bills
          </div>
        </div>

        <div className="sap-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
              Avg Bill Age
            </span>
            <AlertTriangle size={16} style={{ color: 'var(--sapCriticalColor)' }} />
          </div>
          <div className="text-2xl font-bold" style={{ color: 'var(--sapTextColor)' }}>
            12 days
          </div>
          <div className="text-xs mt-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
            Target: &lt; 15 days
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter size={16} style={{ color: 'var(--sapContent_LabelColor)' }} />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as ScBillStatus | 'ALL')}
            className="px-3 py-2 rounded border text-sm"
            style={{
              background: 'var(--sapField_Background)',
              borderColor: 'var(--sapField_BorderColor)',
              color: 'var(--sapField_TextColor)',
            }}
          >
            <option value="ALL">All Status</option>
            <option value="DRAFT">Draft</option>
            <option value="MEASURED">Measured</option>
            <option value="CHECKED">Checked</option>
            <option value="CERTIFIED">Certified</option>
            <option value="APPROVED_FOR_PAYMENT">Approved for Payment</option>
            <option value="PAID">Paid</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
        <button
          className="flex items-center gap-2 px-3 py-2 rounded text-sm"
          style={{
            background: 'var(--sapButton_Background)',
            color: 'var(--sapButton_TextColor)',
            border: '1px solid var(--sapButton_BorderColor)',
          }}
        >
          <Download size={16} />
          Export
        </button>
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
                WO No
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>
                Subcontractor
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>
                Type
              </th>
              <th className="text-right px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>
                Gross Value
              </th>
              <th className="text-right px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>
                Deductions
              </th>
              <th className="text-right px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>
                Net Payable
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>
                Status
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>
                Certified Date
              </th>
              <th className="text-center px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredBills.map((bill, idx) => {
              const wo = getWoDetails(bill.workOrderId);
              return (
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
                  <td className="px-4 py-3 text-sm font-mono" style={{ color: 'var(--sapTextColor)' }}>
                    {wo?.woNo || '—'}
                  </td>
                  <td className="px-4 py-3 text-sm" style={{ color: 'var(--sapTextColor)' }}>
                    SC-{bill.subcontractorId}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-1 rounded" style={{
                      background: 'var(--sapInformationBackground)',
                      color: 'var(--sapInformativeTextColor)',
                    }}>
                      {bill.billType}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-right" style={{ color: 'var(--sapTextColor)' }}>
                    {formatCurrency(bill.grossValue)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right" style={{ color: 'var(--sapNegativeColor)' }}>
                    ({formatCurrency(bill.totalDeductions)})
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-bold" style={{ color: 'var(--sapTextColor)' }}>
                    {formatCurrency(bill.netPayable)}
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
                    {bill.certifiedAt ? formatDate(bill.certifiedAt) : '—'}
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
                        title="Edit"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Edit2 size={16} style={{ color: 'var(--sapButton_TextColor)' }} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Bill Detail Modal */}
      {selectedBill && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedBill(null)}>
          <div className="sap-card max-w-6xl w-full max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b" style={{ borderColor: 'var(--sapList_BorderColor)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold" style={{ color: 'var(--sapTextColor)' }}>
                    {selectedBill.billNo}
                  </h3>
                  <p className="text-sm mt-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
                    {getWoDetails(selectedBill.workOrderId)?.title}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedBill(null)}
                  className="p-2 rounded hover:bg-[var(--sapButton_Hover_Background)]"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Bill Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs font-medium" style={{ color: 'var(--sapContent_LabelColor)' }}>
                    Bill Type
                  </label>
                  <div className="text-sm font-semibold" style={{ color: 'var(--sapTextColor)' }}>
                    {selectedBill.billType} #{selectedBill.raNumber}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium" style={{ color: 'var(--sapContent_LabelColor)' }}>
                    Period
                  </label>
                  <div className="text-sm" style={{ color: 'var(--sapTextColor)' }}>
                    {selectedBill.periodFrom ? formatDate(selectedBill.periodFrom) : '—'} to {selectedBill.periodTo ? formatDate(selectedBill.periodTo) : '—'}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium" style={{ color: 'var(--sapContent_LabelColor)' }}>
                    Status
                  </label>
                  <div>
                    <span
                      className="text-xs px-2 py-1 rounded font-medium"
                      style={{
                        background: `${getStatusColor(selectedBill.status)}20`,
                        color: getStatusColor(selectedBill.status),
                      }}
                    >
                      {selectedBill.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium" style={{ color: 'var(--sapContent_LabelColor)' }}>
                    SC Invoice
                  </label>
                  <div className="text-sm font-mono" style={{ color: 'var(--sapTextColor)' }}>
                    {selectedBill.scInvoiceNo || '—'}
                  </div>
                </div>
              </div>

              {/* Financial Summary */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded" style={{ background: 'var(--sapList_Background)' }}>
                  <div className="text-xs mb-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
                    Gross Value
                  </div>
                  <div className="text-2xl font-bold" style={{ color: 'var(--sapTextColor)' }}>
                    {formatCurrency(selectedBill.grossValue)}
                  </div>
                  <div className="text-xs mt-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
                    Current: {formatCurrency(selectedBill.currentGross)}
                  </div>
                </div>
                <div className="p-4 rounded" style={{ background: 'var(--sapErrorBackground)' }}>
                  <div className="text-xs mb-1" style={{ color: 'var(--sapNegativeTextColor)' }}>
                    Total Deductions
                  </div>
                  <div className="text-2xl font-bold" style={{ color: 'var(--sapNegativeTextColor)' }}>
                    ({formatCurrency(selectedBill.totalDeductions)})
                  </div>
                  <div className="text-xs mt-1" style={{ color: 'var(--sapNegativeTextColor)' }}>
                    System: {selectedBill.deductions?.filter(d => d.isSystemGenerated).length || 0}
                  </div>
                </div>
                <div className="p-4 rounded" style={{ background: 'var(--sapSuccessBackground)' }}>
                  <div className="text-xs mb-1" style={{ color: 'var(--sapPositiveTextColor)' }}>
                    Net Payable
                  </div>
                  <div className="text-2xl font-bold" style={{ color: 'var(--sapPositiveTextColor)' }}>
                    {formatCurrency(selectedBill.netPayable)}
                  </div>
                  <div className="text-xs mt-1" style={{ color: 'var(--sapPositiveTextColor)' }}>
                    Due: {selectedBill.paymentDueDate ? formatDate(selectedBill.paymentDueDate) : '—'}
                  </div>
                </div>
              </div>

              {/* Certification Chain */}
              <div>
                <h4 className="text-sm font-semibold mb-3" style={{ color: 'var(--sapTextColor)' }}>
                  Certification Chain
                </h4>
                <div className="flex items-center gap-4">
                  <div className="flex-1 p-3 rounded" style={{ background: selectedBill.measuredBy ? 'var(--sapSuccessBackground)' : 'var(--sapNeutralBackground)' }}>
                    <div className="text-xs mb-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
                      Measured By
                    </div>
                    <div className="text-sm font-semibold" style={{ color: 'var(--sapTextColor)' }}>
                      {selectedBill.measuredBy ? `User ${selectedBill.measuredBy}` : '—'}
                    </div>
                  </div>
                  <div className="flex-1 p-3 rounded" style={{ background: selectedBill.checkedBy ? 'var(--sapSuccessBackground)' : 'var(--sapNeutralBackground)' }}>
                    <div className="text-xs mb-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
                      Checked By
                    </div>
                    <div className="text-sm font-semibold" style={{ color: 'var(--sapTextColor)' }}>
                      {selectedBill.checkedBy ? `User ${selectedBill.checkedBy}` : '—'}
                    </div>
                  </div>
                  <div className="flex-1 p-3 rounded" style={{ background: selectedBill.certifiedBy ? 'var(--sapSuccessBackground)' : 'var(--sapNeutralBackground)' }}>
                    <div className="text-xs mb-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
                      Certified By
                    </div>
                    <div className="text-sm font-semibold" style={{ color: 'var(--sapTextColor)' }}>
                      {selectedBill.certifiedBy ? `User ${selectedBill.certifiedBy}` : '—'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Validation Flags */}
              {(selectedBill.exceedsClientCertifiedQty || selectedBill.hasOpenCriticalNcr || selectedBill.hasSafetyViolation || selectedBill.freeIssueUnreconciled) && (
                <div>
                  <h4 className="text-sm font-semibold mb-3" style={{ color: 'var(--sapNegativeColor)' }}>
                    Validation Flags
                  </h4>
                  <div className="space-y-2">
                    {selectedBill.exceedsClientCertifiedQty && (
                      <div className="flex items-start gap-2 p-3 rounded" style={{ background: 'var(--sapErrorBackground)' }}>
                        <AlertTriangle size={16} style={{ color: 'var(--sapNegativeColor)' }} />
                        <div className="text-sm" style={{ color: 'var(--sapNegativeTextColor)' }}>
                          SC certified quantity exceeds client certified quantity
                        </div>
                      </div>
                    )}
                    {selectedBill.hasOpenCriticalNcr && (
                      <div className="flex items-start gap-2 p-3 rounded" style={{ background: 'var(--sapErrorBackground)' }}>
                        <AlertTriangle size={16} style={{ color: 'var(--sapNegativeColor)' }} />
                        <div className="text-sm" style={{ color: 'var(--sapNegativeTextColor)' }}>
                          Open critical NCR against this work
                        </div>
                      </div>
                    )}
                    {selectedBill.hasSafetyViolation && (
                      <div className="flex items-start gap-2 p-3 rounded" style={{ background: 'var(--sapWarningBackground)' }}>
                        <AlertTriangle size={16} style={{ color: 'var(--sapCriticalColor)' }} />
                        <div className="text-sm" style={{ color: 'var(--sapCriticalTextColor)' }}>
                          Safety violation flagged for this SC
                        </div>
                      </div>
                    )}
                    {selectedBill.freeIssueUnreconciled && (
                      <div className="flex items-start gap-2 p-3 rounded" style={{ background: 'var(--sapWarningBackground)' }}>
                        <AlertTriangle size={16} style={{ color: 'var(--sapCriticalColor)' }} />
                        <div className="text-sm" style={{ color: 'var(--sapCriticalTextColor)' }}>
                          Free issue account not reconciled
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-4 border-t" style={{ borderColor: 'var(--sapList_BorderColor)' }}>
                {selectedBill.status === 'MEASURED' && (
                  <button className="px-4 py-2 rounded text-sm font-medium" style={{
                    background: 'var(--sapButton_Emphasized_Background)',
                    color: 'var(--sapButton_Emphasized_TextColor)',
                  }}>
                    Check Bill
                  </button>
                )}
                {selectedBill.status === 'CHECKED' && (
                  <button className="px-4 py-2 rounded text-sm font-medium" style={{
                    background: 'var(--sapButton_Emphasized_Background)',
                    color: 'var(--sapButton_Emphasized_TextColor)',
                  }}>
                    Certify Bill
                  </button>
                )}
                {selectedBill.status === 'CERTIFIED' && (
                  <button className="px-4 py-2 rounded text-sm font-medium" style={{
                    background: 'var(--sapButton_Emphasized_Background)',
                    color: 'var(--sapButton_Emphasized_TextColor)',
                  }}>
                    Approve for Payment
                  </button>
                )}
                <button className="px-4 py-2 rounded text-sm font-medium" style={{
                  background: 'var(--sapButton_Background)',
                  color: 'var(--sapButton_TextColor)',
                  border: '1px solid var(--sapButton_BorderColor)',
                }}>
                  View Deductions
                </button>
                <button className="px-4 py-2 rounded text-sm font-medium" style={{
                  background: 'var(--sapButton_Background)',
                  color: 'var(--sapButton_TextColor)',
                  border: '1px solid var(--sapButton_BorderColor)',
                }}>
                  Print Bill
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Bill Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowCreateModal(false)}>
          <div className="sap-card max-w-4xl w-full max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b" style={{ borderColor: 'var(--sapList_BorderColor)' }}>
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold" style={{ color: 'var(--sapTextColor)' }}>
                  Create New SC Bill
                </h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 rounded hover:bg-[var(--sapButton_Hover_Background)]"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--sapTextColor)' }}>
                    Work Order <span style={{ color: 'var(--sapField_RequiredColor)' }}>*</span>
                  </label>
                  <select
                    className="w-full px-3 py-2 rounded border text-sm"
                    style={{
                      background: 'var(--sapField_Background)',
                      borderColor: 'var(--sapField_BorderColor)',
                      color: 'var(--sapField_TextColor)',
                    }}
                  >
                    <option value="">Select work order...</option>
                    {workOrders.map(wo => (
                      <option key={wo.id} value={wo.id}>
                        {wo.woNo} - {wo.title}
                      </option>
                    ))}
                  </select>
                </div>
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
                    <option value="RA">Running Account (RA)</option>
                    <option value="FINAL">Final Bill</option>
                    <option value="SUPPLEMENTARY">Supplementary</option>
                    <option value="DLP_RELEASE">DLP Release</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--sapTextColor)' }}>
                    Period From
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
                    Period To
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

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--sapTextColor)' }}>
                  SC Invoice Number
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 rounded border text-sm"
                  style={{
                    background: 'var(--sapField_Background)',
                    borderColor: 'var(--sapField_BorderColor)',
                    color: 'var(--sapField_TextColor)',
                  }}
                  placeholder="Enter SC invoice number..."
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t" style={{ borderColor: 'var(--sapList_BorderColor)' }}>
                <button
                  onClick={() => setShowCreateModal(false)}
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
                  Create Bill
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
