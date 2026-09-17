/**
 * Part 16 — Work Order Management Dashboard
 * Main dashboard for subcontractor work order management
 */

import React, { useState } from 'react';
import { 
  FileText, TrendingUp, AlertTriangle, CheckCircle, Clock, 
  DollarSign, Package, Users, Plus, Filter, Download, Eye, Edit2
} from 'lucide-react';
import { workOrders, scKpis } from '../data/subcontractorData';
import type { WorkOrder, WoStatus } from '../types/subcontractor';
import { formatCurrency, formatDate } from '../utils/formatting';

export function WorkOrderManagement() {
  const [selectedWo, setSelectedWo] = useState<WorkOrder | null>(null);
  const [filterStatus, setFilterStatus] = useState<WoStatus | 'ALL'>('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const filteredWorkOrders = workOrders.filter(wo => {
    if (filterStatus === 'ALL') return true;
    return wo.status === filterStatus;
  });

  const getStatusColor = (status: WoStatus) => {
    switch (status) {
      case 'DRAFT': return 'var(--sapNeutralColor)';
      case 'PENDING_APPROVAL': return 'var(--sapCriticalColor)';
      case 'APPROVED': return 'var(--sapInformativeColor)';
      case 'RELEASED': return 'var(--sapPositiveColor)';
      case 'IN_PROGRESS': return 'var(--sapInformativeColor)';
      case 'COMPLETED': return 'var(--sapPositiveColor)';
      case 'CLOSED': return 'var(--sapNeutralColor)';
      case 'TERMINATED': return 'var(--sapNegativeColor)';
      default: return 'var(--sapContent_LabelColor)';
    }
  };

  const getMarginColor = (margin: number) => {
    if (margin < 0) return 'var(--sapNegativeColor)';
    if (margin < 10) return 'var(--sapCriticalColor)';
    if (margin < 15) return 'var(--sapInformativeColor)';
    return 'var(--sapPositiveColor)';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--sapTextColor)' }}>
            Work Order Management
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
            Subcontractor work orders with margin tracking and compliance
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
          New Work Order
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="sap-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
              WO Value Awarded
            </span>
            <FileText size={16} style={{ color: 'var(--sapAccentColor6)' }} />
          </div>
          <div className="text-2xl font-bold" style={{ color: 'var(--sapTextColor)' }}>
            {formatCurrency(scKpis.woValueAwarded, { compact: true })}
          </div>
          <div className="text-xs mt-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
            {workOrders.length} work orders
          </div>
        </div>

        <div className="sap-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
              Average Margin
            </span>
            <TrendingUp size={16} style={{ color: 'var(--sapPositiveColor)' }} />
          </div>
          <div className="text-2xl font-bold" style={{ color: 'var(--sapPositiveColor)' }}>
            {scKpis.avgMarginPct.toFixed(1)}%
          </div>
          <div className="text-xs mt-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
            {scKpis.negativeMarginWoCount} negative margin WOs
          </div>
        </div>

        <div className="sap-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
              SC Payable
            </span>
            <DollarSign size={16} style={{ color: 'var(--sapAccentColor1)' }} />
          </div>
          <div className="text-2xl font-bold" style={{ color: 'var(--sapTextColor)' }}>
            {formatCurrency(scKpis.scPayable, { compact: true })}
          </div>
          <div className="text-xs mt-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
            Retention: {formatCurrency(scKpis.retentionHeld, { compact: true })}
          </div>
        </div>

        <div className="sap-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
              Labour Compliance
            </span>
            <Users size={16} style={{ color: scKpis.labourCompliancePct >= 90 ? 'var(--sapPositiveColor)' : 'var(--sapCriticalColor)' }} />
          </div>
          <div className="text-2xl font-bold" style={{ 
            color: scKpis.labourCompliancePct >= 90 ? 'var(--sapPositiveColor)' : 'var(--sapCriticalColor)' 
          }}>
            {scKpis.labourCompliancePct.toFixed(0)}%
          </div>
          <div className="text-xs mt-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
            Free issue excess: {formatCurrency(scKpis.freeIssueExcessValue)}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter size={16} style={{ color: 'var(--sapContent_LabelColor)' }} />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as WoStatus | 'ALL')}
            className="px-3 py-2 rounded border text-sm"
            style={{
              background: 'var(--sapField_Background)',
              borderColor: 'var(--sapField_BorderColor)',
              color: 'var(--sapField_TextColor)',
            }}
          >
            <option value="ALL">All Status</option>
            <option value="DRAFT">Draft</option>
            <option value="PENDING_APPROVAL">Pending Approval</option>
            <option value="APPROVED">Approved</option>
            <option value="RELEASED">Released</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="CLOSED">Closed</option>
            <option value="TERMINATED">Terminated</option>
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

      {/* Work Order List */}
      <div className="sap-card overflow-hidden">
        <table className="w-full">
          <thead style={{ background: 'var(--sapList_HeaderBackground)' }}>
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>
                WO No
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>
                Subcontractor
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>
                Title
              </th>
              <th className="text-right px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>
                WO Value
              </th>
              <th className="text-right px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>
                Margin %
              </th>
              <th className="text-right px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>
                Executed
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>
                Status
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>
                Completion
              </th>
              <th className="text-center px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredWorkOrders.map((wo, idx) => (
              <tr
                key={wo.id}
                className="cursor-pointer hover:bg-[var(--sapList_Hover_Background)]"
                style={{
                  borderBottom: '1px solid var(--sapList_BorderColor)',
                  background: idx % 2 === 0 ? 'var(--sapList_Background)' : 'var(--sapList_AlternatingBackground)',
                }}
                onClick={() => setSelectedWo(wo)}
              >
                <td className="px-4 py-3 text-sm font-mono" style={{ color: 'var(--sapTextColor)' }}>
                  {wo.woNo}
                </td>
                <td className="px-4 py-3 text-sm" style={{ color: 'var(--sapTextColor)' }}>
                  SC-{wo.subcontractorId}
                </td>
                <td className="px-4 py-3 text-sm" style={{ color: 'var(--sapTextColor)' }}>
                  <div className="truncate max-w-xs">{wo.title}</div>
                </td>
                <td className="px-4 py-3 text-sm text-right font-semibold" style={{ color: 'var(--sapTextColor)' }}>
                  {formatCurrency(wo.woValue, { compact: true })}
                </td>
                <td className="px-4 py-3 text-sm text-right font-bold" style={{ 
                  color: getMarginColor(wo.aggregateMarginPct || 0) 
                }}>
                  {wo.aggregateMarginPct?.toFixed(1)}%
                </td>
                <td className="px-4 py-3 text-sm text-right" style={{ color: 'var(--sapTextColor)' }}>
                  {formatCurrency(wo.executedValue || 0, { compact: true })}
                </td>
                <td className="px-4 py-3">
                  <span
                    className="text-xs px-2 py-1 rounded font-medium"
                    style={{
                      background: `${getStatusColor(wo.status)}20`,
                      color: getStatusColor(wo.status),
                    }}
                  >
                    {wo.status.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>
                  {wo.completionDate ? formatDate(wo.completionDate) : '—'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      className="p-1 rounded hover:bg-[var(--sapButton_Hover_Background)]"
                      title="View"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedWo(wo);
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
            ))}
          </tbody>
        </table>
      </div>

      {/* Work Order Detail Modal */}
      {selectedWo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedWo(null)}>
          <div className="sap-card max-w-5xl w-full max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b" style={{ borderColor: 'var(--sapList_BorderColor)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold" style={{ color: 'var(--sapTextColor)' }}>
                    {selectedWo.woNo}
                  </h3>
                  <p className="text-sm mt-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
                    {selectedWo.title}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedWo(null)}
                  className="p-2 rounded hover:bg-[var(--sapButton_Hover_Background)]"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Key Information */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs font-medium" style={{ color: 'var(--sapContent_LabelColor)' }}>
                    WO Type
                  </label>
                  <div className="text-sm font-semibold" style={{ color: 'var(--sapTextColor)' }}>
                    {selectedWo.woType.replace(/_/g, ' ')}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium" style={{ color: 'var(--sapContent_LabelColor)' }}>
                    WO Value
                  </label>
                  <div className="text-sm font-bold" style={{ color: 'var(--sapTextColor)' }}>
                    {formatCurrency(selectedWo.woValue)}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium" style={{ color: 'var(--sapContent_LabelColor)' }}>
                    Aggregate Margin
                  </label>
                  <div className="text-sm font-bold" style={{ color: getMarginColor(selectedWo.aggregateMarginPct || 0) }}>
                    {selectedWo.aggregateMarginPct?.toFixed(1)}%
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
                        background: `${getStatusColor(selectedWo.status)}20`,
                        color: getStatusColor(selectedWo.status),
                      }}
                    >
                      {selectedWo.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress */}
              <div>
                <h4 className="text-sm font-semibold mb-3" style={{ color: 'var(--sapTextColor)' }}>
                  Execution Progress
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-3 rounded" style={{ background: 'var(--sapList_Background)' }}>
                    <div className="text-xs mb-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
                      Executed
                    </div>
                    <div className="text-lg font-bold" style={{ color: 'var(--sapTextColor)' }}>
                      {formatCurrency(selectedWo.executedValue || 0)}
                    </div>
                    <div className="text-xs mt-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
                      {((selectedWo.executedValue || 0) / selectedWo.woValue * 100).toFixed(1)}% of WO
                    </div>
                  </div>
                  <div className="p-3 rounded" style={{ background: 'var(--sapList_Background)' }}>
                    <div className="text-xs mb-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
                      Certified
                    </div>
                    <div className="text-lg font-bold" style={{ color: 'var(--sapTextColor)' }}>
                      {formatCurrency(selectedWo.certifiedValue || 0)}
                    </div>
                    <div className="text-xs mt-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
                      {((selectedWo.certifiedValue || 0) / selectedWo.woValue * 100).toFixed(1)}% of WO
                    </div>
                  </div>
                  <div className="p-3 rounded" style={{ background: 'var(--sapList_Background)' }}>
                    <div className="text-xs mb-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
                      Billed
                    </div>
                    <div className="text-lg font-bold" style={{ color: 'var(--sapTextColor)' }}>
                      {formatCurrency(selectedWo.billedValue || 0)}
                    </div>
                    <div className="text-xs mt-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
                      {((selectedWo.billedValue || 0) / selectedWo.woValue * 100).toFixed(1)}% of WO
                    </div>
                  </div>
                </div>
              </div>

              {/* Scope of Work */}
              {selectedWo.scopeOfWork && (
                <div>
                  <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--sapTextColor)' }}>
                    Scope of Work
                  </h4>
                  <div className="p-3 rounded text-sm" style={{ 
                    background: 'var(--sapList_Background)',
                    color: 'var(--sapTextColor)',
                  }}>
                    {selectedWo.scopeOfWork}
                  </div>
                </div>
              )}

              {/* Key Terms */}
              <div>
                <h4 className="text-sm font-semibold mb-3" style={{ color: 'var(--sapTextColor)' }}>
                  Key Terms
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="text-xs">
                    <span style={{ color: 'var(--sapContent_LabelColor)' }}>Retention: </span>
                    <span className="font-semibold" style={{ color: 'var(--sapTextColor)' }}>
                      {selectedWo.retentionPct}%
                    </span>
                  </div>
                  <div className="text-xs">
                    <span style={{ color: 'var(--sapContent_LabelColor)' }}>Mobilisation Adv: </span>
                    <span className="font-semibold" style={{ color: 'var(--sapTextColor)' }}>
                      {selectedWo.mobilisationAdvPct}%
                    </span>
                  </div>
                  <div className="text-xs">
                    <span style={{ color: 'var(--sapContent_LabelColor)' }}>LD/Day: </span>
                    <span className="font-semibold" style={{ color: 'var(--sapTextColor)' }}>
                      {selectedWo.ldPerDayPct}%
                    </span>
                  </div>
                  <div className="text-xs">
                    <span style={{ color: 'var(--sapContent_LabelColor)' }}>DLP: </span>
                    <span className="font-semibold" style={{ color: 'var(--sapTextColor)' }}>
                      {selectedWo.defectLiabilityMonths} months
                    </span>
                  </div>
                  <div className="text-xs">
                    <span style={{ color: 'var(--sapContent_LabelColor)' }}>Free Issue: </span>
                    <span className="font-semibold" style={{ color: 'var(--sapTextColor)' }}>
                      {selectedWo.freeIssuePolicy?.replace(/_/g, ' ') || 'None'}
                    </span>
                  </div>
                  <div className="text-xs">
                    <span style={{ color: 'var(--sapContent_LabelColor)' }}>Wastage Allowance: </span>
                    <span className="font-semibold" style={{ color: 'var(--sapTextColor)' }}>
                      {selectedWo.wastageAllowancePct || 0}%
                    </span>
                  </div>
                  <div className="text-xs">
                    <span style={{ color: 'var(--sapContent_LabelColor)' }}>Start Date: </span>
                    <span className="font-semibold" style={{ color: 'var(--sapTextColor)' }}>
                      {selectedWo.startDate ? formatDate(selectedWo.startDate) : '—'}
                    </span>
                  </div>
                  <div className="text-xs">
                    <span style={{ color: 'var(--sapContent_LabelColor)' }}>Completion: </span>
                    <span className="font-semibold" style={{ color: 'var(--sapTextColor)' }}>
                      {selectedWo.completionDate ? formatDate(selectedWo.completionDate) : '—'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-4 border-t" style={{ borderColor: 'var(--sapList_BorderColor)' }}>
                {selectedWo.status === 'DRAFT' && (
                  <button className="px-4 py-2 rounded text-sm font-medium" style={{
                    background: 'var(--sapButton_Emphasized_Background)',
                    color: 'var(--sapButton_Emphasized_TextColor)',
                  }}>
                    Submit for Approval
                  </button>
                )}
                {selectedWo.status === 'APPROVED' && (
                  <button className="px-4 py-2 rounded text-sm font-medium" style={{
                    background: 'var(--sapButton_Emphasized_Background)',
                    color: 'var(--sapButton_Emphasized_TextColor)',
                  }}>
                    Release to SC
                  </button>
                )}
                <button className="px-4 py-2 rounded text-sm font-medium" style={{
                  background: 'var(--sapButton_Background)',
                  color: 'var(--sapButton_TextColor)',
                  border: '1px solid var(--sapButton_BorderColor)',
                }}>
                  View Items
                </button>
                <button className="px-4 py-2 rounded text-sm font-medium" style={{
                  background: 'var(--sapButton_Background)',
                  color: 'var(--sapButton_TextColor)',
                  border: '1px solid var(--sapButton_BorderColor)',
                }}>
                  View Amendments
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create WO Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowCreateModal(false)}>
          <div className="sap-card max-w-3xl w-full max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b" style={{ borderColor: 'var(--sapList_BorderColor)' }}>
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold" style={{ color: 'var(--sapTextColor)' }}>
                  Create New Work Order
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
                    Subcontractor <span style={{ color: 'var(--sapField_RequiredColor)' }}>*</span>
                  </label>
                  <select
                    className="w-full px-3 py-2 rounded border text-sm"
                    style={{
                      background: 'var(--sapField_Background)',
                      borderColor: 'var(--sapField_BorderColor)',
                      color: 'var(--sapField_TextColor)',
                    }}
                  >
                    <option value="">Select subcontractor...</option>
                    <option value="7">ABC Constructions</option>
                    <option value="8">XYZ Builders</option>
                    <option value="9">PQR Electricals</option>
                    <option value="10">LMN Plumbing</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--sapTextColor)' }}>
                    WO Type <span style={{ color: 'var(--sapField_RequiredColor)' }}>*</span>
                  </label>
                  <select
                    className="w-full px-3 py-2 rounded border text-sm"
                    style={{
                      background: 'var(--sapField_Background)',
                      borderColor: 'var(--sapField_BorderColor)',
                      color: 'var(--sapField_TextColor)',
                    }}
                  >
                    <option value="ITEM_RATE">Item Rate</option>
                    <option value="LUMPSUM">Lump Sum</option>
                    <option value="LABOUR_ONLY">Labour Only</option>
                    <option value="LABOUR_MATERIAL">Labour & Material</option>
                    <option value="PIECE_RATE">Piece Rate</option>
                    <option value="HIRE">Hire</option>
                  </select>
                </div>
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
                  placeholder="Enter work order title..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--sapTextColor)' }}>
                  Scope of Work
                </label>
                <textarea
                  rows={4}
                  className="w-full px-3 py-2 rounded border text-sm"
                  style={{
                    background: 'var(--sapField_Background)',
                    borderColor: 'var(--sapField_BorderColor)',
                    color: 'var(--sapField_TextColor)',
                  }}
                  placeholder="Describe the scope of work..."
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--sapTextColor)' }}>
                    Start Date
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
                    Completion Date
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
                    WO Value <span style={{ color: 'var(--sapField_RequiredColor)' }}>*</span>
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
                  Create Work Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
