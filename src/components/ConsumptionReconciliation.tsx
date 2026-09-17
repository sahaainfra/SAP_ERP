/**
 * Part 15 — Consumption Reconciliation
 * Theoretical vs actual consumption variance analysis
 */

import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';
import { materialConsumptions } from '../data/inventoryData';
import type { MaterialConsumption, ConsumptionStatus } from '../types/inventory';
import { formatCurrency, formatDate } from '../utils/formatting';

export function ConsumptionReconciliation() {
  const [filterStatus, setFilterStatus] = useState<ConsumptionStatus | 'ALL'>('ALL');
  const [selectedConsumption, setSelectedConsumption] = useState<MaterialConsumption | null>(null);

  const filteredConsumptions = materialConsumptions.filter(c => {
    if (filterStatus === 'ALL') return true;
    return c.status === filterStatus;
  });

  const getStatusColor = (status: ConsumptionStatus) => {
    switch (status) {
      case 'WITHIN': return 'var(--sapPositiveColor)';
      case 'EXCESS': return 'var(--sapCriticalColor)';
      case 'INVESTIGATE': return 'var(--sapNegativeColor)';
      case 'EXPLAINED': return 'var(--sapInformativeColor)';
      default: return 'var(--sapContent_LabelColor)';
    }
  };

  const getStatusBg = (status: ConsumptionStatus) => {
    switch (status) {
      case 'WITHIN': return 'var(--sapSuccessBackground)';
      case 'EXCESS': return 'var(--sapWarningBackground)';
      case 'INVESTIGATE': return 'var(--sapErrorBackground)';
      case 'EXPLAINED': return 'var(--sapInformationBackground)';
      default: return 'var(--sapNeutralBackground)';
    }
  };

  const totalVarianceValue = filteredConsumptions.reduce((sum, c) => sum + c.varianceValue, 0);
  const itemsRequiringInvestigation = filteredConsumptions.filter(c => c.status === 'INVESTIGATE').length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold" style={{ color: 'var(--sapTextColor)' }}>
            Consumption Reconciliation
          </h3>
          <p className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
            Theoretical vs actual consumption variance analysis
          </p>
        </div>
        <button className="flex items-center gap-2 px-3 py-2 rounded text-sm" style={{
          background: 'var(--sapButton_Background)',
          color: 'var(--sapButton_TextColor)',
          border: '1px solid var(--sapButton_BorderColor)',
        }}>
          <TrendingUp size={16} />
          Recompute
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="sap-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
              Total Variance Value
            </span>
            <TrendingUp size={16} style={{ color: totalVarianceValue > 0 ? 'var(--sapNegativeColor)' : 'var(--sapPositiveColor)' }} />
          </div>
          <div className="text-2xl font-bold" style={{ color: totalVarianceValue > 0 ? 'var(--sapNegativeColor)' : 'var(--sapPositiveColor)' }}>
            {formatCurrency(Math.abs(totalVarianceValue))}
          </div>
          <div className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
            {totalVarianceValue > 0 ? 'Over consumption' : 'Under consumption'}
          </div>
        </div>

        <div className="sap-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
              Items Requiring Investigation
            </span>
            <AlertTriangle size={16} style={{ color: 'var(--sapNegativeColor)' }} />
          </div>
          <div className="text-2xl font-bold" style={{ color: 'var(--sapNegativeColor)' }}>
            {itemsRequiringInvestigation}
          </div>
          <div className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
            Beyond threshold variance
          </div>
        </div>

        <div className="sap-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
              Total Records
            </span>
            <CheckCircle size={16} style={{ color: 'var(--sapPositiveColor)' }} />
          </div>
          <div className="text-2xl font-bold" style={{ color: 'var(--sapTextColor)' }}>
            {filteredConsumptions.length}
          </div>
          <div className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
            Consumption entries
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as ConsumptionStatus | 'ALL')}
            className="px-3 py-2 rounded border text-sm"
            style={{
              background: 'var(--sapField_Background)',
              borderColor: 'var(--sapField_BorderColor)',
              color: 'var(--sapField_TextColor)',
            }}
          >
            <option value="ALL">All Status</option>
            <option value="WITHIN">Within Tolerance</option>
            <option value="EXCESS">Excess Consumption</option>
            <option value="INVESTIGATE">Requires Investigation</option>
            <option value="EXPLAINED">Explained</option>
          </select>
        </div>
      </div>

      {/* Consumption Table */}
      <div className="sap-card overflow-hidden">
        <table className="w-full">
          <thead style={{ background: 'var(--sapList_HeaderBackground)' }}>
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>Date</th>
              <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>BOQ Item</th>
              <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>Material</th>
              <th className="text-right px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>Executed Qty</th>
              <th className="text-right px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>Theoretical</th>
              <th className="text-right px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>Issued</th>
              <th className="text-right px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>Actual</th>
              <th className="text-right px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>Variance</th>
              <th className="text-right px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>Variance %</th>
              <th className="text-right px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>Value</th>
              <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>Status</th>
              <th className="text-center px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredConsumptions.map((consumption, idx) => (
              <tr
                key={consumption.id}
                className="cursor-pointer hover:bg-[var(--sapList_Hover_Background)]"
                style={{
                  borderBottom: '1px solid var(--sapList_BorderColor)',
                  background: idx % 2 === 0 ? 'var(--sapList_Background)' : 'var(--sapList_AlternatingBackground)',
                }}
                onClick={() => setSelectedConsumption(consumption)}
              >
                <td className="px-4 py-3 text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>
                  {formatDate(consumption.consumptionDate)}
                </td>
                <td className="px-4 py-3 text-sm font-mono" style={{ color: 'var(--sapTextColor)' }}>
                  BOQ-{consumption.boqItemId}
                </td>
                <td className="px-4 py-3 text-sm font-mono" style={{ color: 'var(--sapTextColor)' }}>
                  Item-{consumption.itemId}
                </td>
                <td className="px-4 py-3 text-sm text-right" style={{ color: 'var(--sapTextColor)' }}>
                  {consumption.executedQty}
                </td>
                <td className="px-4 py-3 text-sm text-right" style={{ color: 'var(--sapTextColor)' }}>
                  {consumption.theoreticalQty}
                </td>
                <td className="px-4 py-3 text-sm text-right" style={{ color: 'var(--sapTextColor)' }}>
                  {consumption.issuedQty}
                </td>
                <td className="px-4 py-3 text-sm text-right" style={{ color: 'var(--sapTextColor)' }}>
                  {consumption.actualConsumed}
                </td>
                <td className="px-4 py-3 text-sm text-right font-semibold" style={{
                  color: consumption.varianceQty > 0 ? 'var(--sapNegativeColor)' : 'var(--sapPositiveColor)',
                }}>
                  {consumption.varianceQty > 0 ? '+' : ''}{consumption.varianceQty}
                </td>
                <td className="px-4 py-3 text-sm text-right font-semibold" style={{
                  color: getStatusColor(consumption.status),
                }}>
                  {consumption.variancePct.toFixed(1)}%
                </td>
                <td className="px-4 py-3 text-sm text-right" style={{
                  color: consumption.varianceValue > 0 ? 'var(--sapNegativeColor)' : 'var(--sapPositiveColor)',
                }}>
                  {formatCurrency(Math.abs(consumption.varianceValue))}
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs px-2 py-1 rounded" style={{
                    background: getStatusBg(consumption.status),
                    color: getStatusColor(consumption.status),
                  }}>
                    {consumption.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <button className="p-1 rounded hover:bg-[var(--sapButton_Hover_Background)]">
                    <AlertTriangle size={16} style={{ color: 'var(--sapButton_TextColor)' }} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedConsumption && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedConsumption(null)}>
          <div className="sap-card max-w-3xl w-full max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b" style={{ borderColor: 'var(--sapList_BorderColor)' }}>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold" style={{ color: 'var(--sapTextColor)' }}>
                  Consumption #{selectedConsumption.id} — Variance Analysis
                </h3>
                <button onClick={() => setSelectedConsumption(null)} className="p-2 rounded hover:bg-[var(--sapButton_Hover_Background)]">×</button>
              </div>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium" style={{ color: 'var(--sapContent_LabelColor)' }}>Date</label>
                  <div className="text-sm" style={{ color: 'var(--sapTextColor)' }}>
                    {formatDate(selectedConsumption.consumptionDate)}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium" style={{ color: 'var(--sapContent_LabelColor)' }}>Status</label>
                  <div>
                    <span className="text-xs px-2 py-1 rounded" style={{
                      background: getStatusBg(selectedConsumption.status),
                      color: getStatusColor(selectedConsumption.status),
                    }}>
                      {selectedConsumption.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t" style={{ borderColor: 'var(--sapList_BorderColor)' }}>
                <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--sapTextColor)' }}>
                  Quantity Breakdown
                </h4>
                <div className="grid grid-cols-4 gap-4">
                  <div className="p-3 rounded" style={{ background: 'var(--sapInformationBackground)' }}>
                    <div className="text-xs mb-1" style={{ color: 'var(--sapInformativeTextColor)' }}>Executed</div>
                    <div className="text-xl font-bold" style={{ color: 'var(--sapInformativeTextColor)' }}>
                      {selectedConsumption.executedQty}
                    </div>
                  </div>
                  <div className="p-3 rounded" style={{ background: 'var(--sapNeutralBackground)' }}>
                    <div className="text-xs mb-1" style={{ color: 'var(--sapContent_LabelColor)' }}>Theoretical</div>
                    <div className="text-xl font-bold" style={{ color: 'var(--sapTextColor)' }}>
                      {selectedConsumption.theoreticalQty}
                    </div>
                  </div>
                  <div className="p-3 rounded" style={{ background: 'var(--sapWarningBackground)' }}>
                    <div className="text-xs mb-1" style={{ color: 'var(--sapCriticalTextColor)' }}>Issued</div>
                    <div className="text-xl font-bold" style={{ color: 'var(--sapCriticalTextColor)' }}>
                      {selectedConsumption.issuedQty}
                    </div>
                  </div>
                  <div className="p-3 rounded" style={{ background: 'var(--sapSuccessBackground)' }}>
                    <div className="text-xs mb-1" style={{ color: 'var(--sapPositiveTextColor)' }}>Actual</div>
                    <div className="text-xl font-bold" style={{ color: 'var(--sapPositiveTextColor)' }}>
                      {selectedConsumption.actualConsumed}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t" style={{ borderColor: 'var(--sapList_BorderColor)' }}>
                <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--sapTextColor)' }}>
                  Variance Analysis
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-medium" style={{ color: 'var(--sapContent_LabelColor)' }}>Variance Qty</label>
                    <div className="text-lg font-bold" style={{
                      color: selectedConsumption.varianceQty > 0 ? 'var(--sapNegativeColor)' : 'var(--sapPositiveColor)',
                    }}>
                      {selectedConsumption.varianceQty > 0 ? '+' : ''}{selectedConsumption.varianceQty}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium" style={{ color: 'var(--sapContent_LabelColor)' }}>Variance %</label>
                    <div className="text-lg font-bold" style={{ color: getStatusColor(selectedConsumption.status) }}>
                      {selectedConsumption.variancePct.toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium" style={{ color: 'var(--sapContent_LabelColor)' }}>Variance Value</label>
                    <div className="text-lg font-bold" style={{
                      color: selectedConsumption.varianceValue > 0 ? 'var(--sapNegativeColor)' : 'var(--sapPositiveColor)',
                    }}>
                      {formatCurrency(Math.abs(selectedConsumption.varianceValue))}
                    </div>
                  </div>
                </div>
              </div>

              {selectedConsumption.explanation && (
                <div className="pt-4 border-t" style={{ borderColor: 'var(--sapList_BorderColor)' }}>
                  <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--sapTextColor)' }}>
                    Explanation
                  </h4>
                  <div className="p-3 rounded" style={{ background: 'var(--sapNeutralBackground)' }}>
                    <div className="text-sm" style={{ color: 'var(--sapTextColor)' }}>
                      {selectedConsumption.explanation}
                    </div>
                  </div>
                  {selectedConsumption.reviewedBy && (
                    <div className="mt-2 text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
                      Reviewed by User {selectedConsumption.reviewedBy} on {formatDate(selectedConsumption.reviewedAt || '')}
                    </div>
                  )}
                </div>
              )}

              {selectedConsumption.status === 'INVESTIGATE' && (
                <div className="pt-4 border-t" style={{ borderColor: 'var(--sapList_BorderColor)' }}>
                  <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--sapNegativeColor)' }}>
                    Action Required
                  </h4>
                  <div className="p-3 rounded" style={{ background: 'var(--sapErrorBackground)' }}>
                    <div className="flex items-start gap-2">
                      <AlertTriangle size={16} style={{ color: 'var(--sapNegativeColor)' }} />
                      <div className="text-sm" style={{ color: 'var(--sapNegativeTextColor)' }}>
                        This consumption requires investigation. Please provide an explanation or escalate to Project Manager.
                      </div>
                    </div>
                  </div>
                  <div className="mt-3">
                    <textarea
                      placeholder="Provide explanation for variance..."
                      className="w-full px-3 py-2 rounded border text-sm"
                      style={{
                        background: 'var(--sapField_Background)',
                        borderColor: 'var(--sapField_BorderColor)',
                        color: 'var(--sapField_TextColor)',
                      }}
                      rows={3}
                    />
                    <div className="flex gap-2 mt-2">
                      <button className="px-4 py-2 rounded text-sm font-medium" style={{
                        background: 'var(--sapButton_Emphasized_Background)',
                        color: 'var(--sapButton_Emphasized_TextColor)',
                      }}>
                        Submit Explanation
                      </button>
                      <button className="px-4 py-2 rounded text-sm font-medium" style={{
                        background: 'var(--sapButton_Background)',
                        color: 'var(--sapButton_TextColor)',
                        border: '1px solid var(--sapButton_BorderColor)',
                      }}>
                        Escalate
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
