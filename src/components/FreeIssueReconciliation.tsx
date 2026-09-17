/**
 * Part 16 — Free Issue Reconciliation
 * Track free-issue material issued to subcontractors with recovery
 */

import React, { useState } from 'react';
import { 
  Package, AlertTriangle, CheckCircle, TrendingUp, 
  Eye, RefreshCw, Download
} from 'lucide-react';
import { freeIssueAccounts, workOrders } from '../data/subcontractorData';
import type { FreeIssueAccount } from '../types/subcontractor';
import { formatCurrency } from '../utils/formatting';

export function FreeIssueReconciliation() {
  const [selectedAccount, setSelectedAccount] = useState<FreeIssueAccount | null>(null);
  const [filterWo, setFilterWo] = useState<number | 'ALL'>('ALL');

  const filteredAccounts = freeIssueAccounts.filter(account => {
    if (filterWo === 'ALL') return true;
    return account.workOrderId === filterWo;
  });

  const getWoDetails = (woId: number) => {
    return workOrders.find(wo => wo.id === woId);
  };

  const getExcessColor = (excessPct: number) => {
    if (excessPct === 0) return 'var(--sapPositiveColor)';
    if (excessPct <= 2) return 'var(--sapCriticalColor)';
    return 'var(--sapNegativeColor)';
  };

  const totalIssuedValue = filteredAccounts.reduce((sum, acc) => {
    const wo = getWoDetails(acc.workOrderId);
    return sum + (acc.issuedQty * (acc.recoveryRate || 0));
  }, 0);

  const totalRecoveryValue = filteredAccounts.reduce((sum, acc) => 
    sum + (acc.recoveryAmount || 0), 0
  );

  const totalExcessValue = filteredAccounts.reduce((sum, acc) => 
    sum + (acc.excessQty * (acc.recoveryRate || 0)), 0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--sapTextColor)' }}>
            Free Issue Material Reconciliation
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
            Track material issued to subcontractors with theoretical consumption and recovery
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium"
            style={{
              background: 'var(--sapButton_Background)',
              color: 'var(--sapButton_TextColor)',
              border: '1px solid var(--sapButton_BorderColor)',
            }}
          >
            <RefreshCw size={16} />
            Reconcile All
          </button>
          <button
            className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium"
            style={{
              background: 'var(--sapButton_Background)',
              color: 'var(--sapButton_TextColor)',
              border: '1px solid var(--sapButton_BorderColor)',
            }}
          >
            <Download size={16} />
            Export Statement
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="sap-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
              Total Issued Value
            </span>
            <Package size={16} style={{ color: 'var(--sapAccentColor6)' }} />
          </div>
          <div className="text-2xl font-bold" style={{ color: 'var(--sapTextColor)' }}>
            {formatCurrency(totalIssuedValue, { compact: true })}
          </div>
          <div className="text-xs mt-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
            {filteredAccounts.length} items tracked
          </div>
        </div>

        <div className="sap-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
              Theoretical Consumption
            </span>
            <CheckCircle size={16} style={{ color: 'var(--sapPositiveColor)' }} />
          </div>
          <div className="text-2xl font-bold" style={{ color: 'var(--sapPositiveColor)' }}>
            {formatCurrency(filteredAccounts.reduce((sum, acc) => sum + (acc.theoreticalConsumption * (acc.recoveryRate || 0)), 0), { compact: true })}
          </div>
          <div className="text-xs mt-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
            Based on certified qty × norms
          </div>
        </div>

        <div className="sap-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
              Excess Quantity
            </span>
            <AlertTriangle size={16} style={{ color: totalExcessValue > 0 ? 'var(--sapNegativeColor)' : 'var(--sapPositiveColor)' }} />
          </div>
          <div className="text-2xl font-bold" style={{ color: totalExcessValue > 0 ? 'var(--sapNegativeColor)' : 'var(--sapPositiveColor)' }}>
            {formatCurrency(totalExcessValue, { compact: true })}
          </div>
          <div className="text-xs mt-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
            To be recovered from SC
          </div>
        </div>

        <div className="sap-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
              Recovery Amount
            </span>
            <TrendingUp size={16} style={{ color: 'var(--sapAccentColor1)' }} />
          </div>
          <div className="text-2xl font-bold" style={{ color: 'var(--sapTextColor)' }}>
            {formatCurrency(totalRecoveryValue, { compact: true })}
          </div>
          <div className="text-xs mt-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
            Auto-deducted in next bill
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <select
            value={filterWo}
            onChange={(e) => setFilterWo(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
            className="px-3 py-2 rounded border text-sm"
            style={{
              background: 'var(--sapField_Background)',
              borderColor: 'var(--sapField_BorderColor)',
              color: 'var(--sapField_TextColor)',
            }}
          >
            <option value="ALL">All Work Orders</option>
            {workOrders.map(wo => (
              <option key={wo.id} value={wo.id}>
                {wo.woNo} - {wo.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Free Issue Accounts List */}
      <div className="sap-card overflow-hidden">
        <table className="w-full">
          <thead style={{ background: 'var(--sapList_HeaderBackground)' }}>
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>
                Work Order
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>
                Material
              </th>
              <th className="text-right px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>
                Issued
              </th>
              <th className="text-right px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>
                Returned
              </th>
              <th className="text-right px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>
                Theoretical
              </th>
              <th className="text-right px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>
                Excess
              </th>
              <th className="text-right px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>
                Recovery Rate
              </th>
              <th className="text-right px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>
                Recovery Amount
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>
                Last Reconciled
              </th>
              <th className="text-center px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredAccounts.map((account, idx) => {
              const wo = getWoDetails(account.workOrderId);
              const excessPct = account.theoreticalConsumption > 0 
                ? ((account.excessQty / account.theoreticalConsumption) * 100)
                : 0;

              return (
                <tr
                  key={account.id}
                  className="cursor-pointer hover:bg-[var(--sapList_Hover_Background)]"
                  style={{
                    borderBottom: '1px solid var(--sapList_BorderColor)',
                    background: idx % 2 === 0 ? 'var(--sapList_Background)' : 'var(--sapList_AlternatingBackground)',
                  }}
                  onClick={() => setSelectedAccount(account)}
                >
                  <td className="px-4 py-3">
                    <div className="text-sm font-mono" style={{ color: 'var(--sapTextColor)' }}>
                      {wo?.woNo || '—'}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
                      SC-{account.subcontractorId}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium" style={{ color: 'var(--sapTextColor)' }}>
                      {account.itemName}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
                      {account.itemCode} • {account.uom}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-right" style={{ color: 'var(--sapTextColor)' }}>
                    {account.issuedQty.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-right" style={{ color: 'var(--sapTextColor)' }}>
                    {account.returnedQty.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-right" style={{ color: 'var(--sapTextColor)' }}>
                    {account.theoreticalConsumption.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-bold" style={{ 
                    color: getExcessColor(excessPct)
                  }}>
                    {account.excessQty > 0 ? '+' : ''}{account.excessQty.toLocaleString()}
                    {excessPct > 0 && (
                      <div className="text-xs" style={{ color: getExcessColor(excessPct) }}>
                        ({excessPct.toFixed(1)}%)
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-right" style={{ color: 'var(--sapTextColor)' }}>
                    {formatCurrency(account.recoveryRate || 0)}/{account.uom}
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-semibold" style={{ 
                    color: (account.recoveryAmount || 0) > 0 ? 'var(--sapNegativeColor)' : 'var(--sapPositiveColor)'
                  }}>
                    {formatCurrency(account.recoveryAmount || 0)}
                  </td>
                  <td className="px-4 py-3 text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>
                    {account.lastReconciledAt ? new Date(account.lastReconciledAt).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        className="p-1 rounded hover:bg-[var(--sapButton_Hover_Background)]"
                        title="View Details"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedAccount(account);
                        }}
                      >
                        <Eye size={16} style={{ color: 'var(--sapButton_TextColor)' }} />
                      </button>
                      <button
                        className="p-1 rounded hover:bg-[var(--sapButton_Hover_Background)]"
                        title="Reconcile"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <RefreshCw size={16} style={{ color: 'var(--sapButton_TextColor)' }} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Account Detail Modal */}
      {selectedAccount && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedAccount(null)}>
          <div className="sap-card max-w-4xl w-full max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b" style={{ borderColor: 'var(--sapList_BorderColor)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold" style={{ color: 'var(--sapTextColor)' }}>
                    Free Issue Account
                  </h3>
                  <p className="text-sm mt-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
                    {selectedAccount.itemName} • {getWoDetails(selectedAccount.workOrderId)?.woNo}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedAccount(null)}
                  className="p-2 rounded hover:bg-[var(--sapButton_Hover_Background)]"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Material & WO Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium" style={{ color: 'var(--sapContent_LabelColor)' }}>
                    Material
                  </label>
                  <div className="text-sm font-semibold" style={{ color: 'var(--sapTextColor)' }}>
                    {selectedAccount.itemName} ({selectedAccount.itemCode})
                  </div>
                  <div className="text-xs mt-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
                    UOM: {selectedAccount.uom}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium" style={{ color: 'var(--sapContent_LabelColor)' }}>
                    Work Order
                  </label>
                  <div className="text-sm font-semibold" style={{ color: 'var(--sapTextColor)' }}>
                    {getWoDetails(selectedAccount.workOrderId)?.woNo}
                  </div>
                  <div className="text-xs mt-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
                    Subcontractor: SC-{selectedAccount.subcontractorId}
                  </div>
                </div>
              </div>

              {/* Quantity Breakdown */}
              <div>
                <h4 className="text-sm font-semibold mb-3" style={{ color: 'var(--sapTextColor)' }}>
                  Quantity Breakdown
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 rounded" style={{ background: 'var(--sapList_Background)' }}>
                    <div className="text-xs mb-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
                      Issued
                    </div>
                    <div className="text-xl font-bold" style={{ color: 'var(--sapTextColor)' }}>
                      {selectedAccount.issuedQty.toLocaleString()}
                    </div>
                    <div className="text-xs mt-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
                      {selectedAccount.uom}
                    </div>
                  </div>
                  <div className="p-3 rounded" style={{ background: 'var(--sapList_Background)' }}>
                    <div className="text-xs mb-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
                      Returned
                    </div>
                    <div className="text-xl font-bold" style={{ color: 'var(--sapTextColor)' }}>
                      {selectedAccount.returnedQty.toLocaleString()}
                    </div>
                    <div className="text-xs mt-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
                      {selectedAccount.uom}
                    </div>
                  </div>
                  <div className="p-3 rounded" style={{ background: 'var(--sapSuccessBackground)' }}>
                    <div className="text-xs mb-1" style={{ color: 'var(--sapPositiveTextColor)' }}>
                      Theoretical
                    </div>
                    <div className="text-xl font-bold" style={{ color: 'var(--sapPositiveTextColor)' }}>
                      {selectedAccount.theoreticalConsumption.toLocaleString()}
                    </div>
                    <div className="text-xs mt-1" style={{ color: 'var(--sapPositiveTextColor)' }}>
                      {selectedAccount.uom}
                    </div>
                  </div>
                  <div className="p-3 rounded" style={{ 
                    background: selectedAccount.excessQty > 0 ? 'var(--sapErrorBackground)' : 'var(--sapSuccessBackground)'
                  }}>
                    <div className="text-xs mb-1" style={{ 
                      color: selectedAccount.excessQty > 0 ? 'var(--sapNegativeTextColor)' : 'var(--sapPositiveTextColor)'
                    }}>
                      Excess
                    </div>
                    <div className="text-xl font-bold" style={{ 
                      color: selectedAccount.excessQty > 0 ? 'var(--sapNegativeTextColor)' : 'var(--sapPositiveTextColor)'
                    }}>
                      {selectedAccount.excessQty > 0 ? '+' : ''}{selectedAccount.excessQty.toLocaleString()}
                    </div>
                    <div className="text-xs mt-1" style={{ 
                      color: selectedAccount.excessQty > 0 ? 'var(--sapNegativeTextColor)' : 'var(--sapPositiveTextColor)'
                    }}>
                      {selectedAccount.uom}
                    </div>
                  </div>
                </div>
              </div>

              {/* Recovery Details */}
              <div>
                <h4 className="text-sm font-semibold mb-3" style={{ color: 'var(--sapTextColor)' }}>
                  Recovery Details
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium" style={{ color: 'var(--sapContent_LabelColor)' }}>
                      Recovery Rate Basis
                    </label>
                    <div className="text-sm font-semibold" style={{ color: 'var(--sapTextColor)' }}>
                      {selectedAccount.recoveryRateBasis?.replace(/_/g, ' ') || '—'}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium" style={{ color: 'var(--sapContent_LabelColor)' }}>
                      Recovery Rate
                    </label>
                    <div className="text-sm font-semibold" style={{ color: 'var(--sapTextColor)' }}>
                      {formatCurrency(selectedAccount.recoveryRate || 0)}/{selectedAccount.uom}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium" style={{ color: 'var(--sapContent_LabelColor)' }}>
                      Recovery Amount
                    </label>
                    <div className="text-lg font-bold" style={{ color: 'var(--sapNegativeColor)' }}>
                      {formatCurrency(selectedAccount.recoveryAmount)}
                    </div>
                    <div className="text-xs mt-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
                      Auto-deducted in next SC bill
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium" style={{ color: 'var(--sapContent_LabelColor)' }}>
                      Last Reconciled
                    </label>
                    <div className="text-sm" style={{ color: 'var(--sapTextColor)' }}>
                      {selectedAccount.lastReconciledAt 
                        ? new Date(selectedAccount.lastReconciledAt).toLocaleString()
                        : 'Never'
                      }
                    </div>
                  </div>
                </div>
              </div>

              {/* Allowed Wastage */}
              {selectedAccount.allowedWastage > 0 && (
                <div className="p-4 rounded" style={{ background: 'var(--sapInformationBackground)' }}>
                  <div className="flex items-start gap-2">
                    <CheckCircle size={16} style={{ color: 'var(--sapInformativeColor)' }} />
                    <div>
                      <div className="text-sm font-semibold" style={{ color: 'var(--sapInformativeTextColor)' }}>
                        Allowed Wastage
                      </div>
                      <div className="text-xs mt-1" style={{ color: 'var(--sapInformativeTextColor)' }}>
                        {selectedAccount.allowedWastage} {selectedAccount.uom} wastage is allowed as per WO terms.
                        Excess beyond this is recovered at penal rate.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-4 border-t" style={{ borderColor: 'var(--sapList_BorderColor)' }}>
                <button className="px-4 py-2 rounded text-sm font-medium" style={{
                  background: 'var(--sapButton_Emphasized_Background)',
                  color: 'var(--sapButton_Emphasized_TextColor)',
                }}>
                  Reconcile Now
                </button>
                <button className="px-4 py-2 rounded text-sm font-medium" style={{
                  background: 'var(--sapButton_Background)',
                  color: 'var(--sapButton_TextColor)',
                  border: '1px solid var(--sapButton_BorderColor)',
                }}>
                  View Issue History
                </button>
                <button className="px-4 py-2 rounded text-sm font-medium" style={{
                  background: 'var(--sapButton_Background)',
                  color: 'var(--sapButton_TextColor)',
                  border: '1px solid var(--sapButton_BorderColor)',
                }}>
                  Print Statement
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
