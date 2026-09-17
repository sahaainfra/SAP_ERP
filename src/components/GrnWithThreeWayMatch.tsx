/**
 * Part 15 — GRN with Three-Way Match
 * Goods Receipt Note with PO/challan/physical matching
 */

import React, { useState } from 'react';
import { CheckCircle, AlertTriangle, XCircle, Eye } from 'lucide-react';
import { grnExtensions, grnItemExtensions } from '../data/inventoryData';
import type { GrnExtension, ThreeWayMatch } from '../types/inventory';
import { formatCurrency, formatDate } from '../utils/formatting';

export function GrnWithThreeWayMatch() {
  const [selectedGrn, setSelectedGrn] = useState<GrnExtension | null>(null);

  const getQcStatusColor = (status?: string) => {
    switch (status) {
      case 'PASSED': return 'var(--sapPositiveColor)';
      case 'FAILED': return 'var(--sapNegativeColor)';
      case 'PENDING':
      case 'IN_PROGRESS': return 'var(--sapCriticalColor)';
      default: return 'var(--sapContent_LabelColor)';
    }
  };

  const getToleranceStatusColor = (status: string) => {
    switch (status) {
      case 'WITHIN': return 'var(--sapPositiveColor)';
      case 'EXCESS': return 'var(--sapCriticalColor)';
      case 'SHORT': return 'var(--sapWarningColor)';
      case 'BLOCKED': return 'var(--sapNegativeColor)';
      default: return 'var(--sapContent_LabelColor)';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold" style={{ color: 'var(--sapTextColor)' }}>
            Goods Receipt Notes
          </h3>
          <p className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
            Three-way match: PO ↔ Challan ↔ Physical Receipt
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium" style={{
          background: 'var(--sapButton_Emphasized_Background)',
          color: 'var(--sapButton_Emphasized_TextColor)',
        }}>
          + New GRN
        </button>
      </div>

      <div className="sap-card overflow-hidden">
        <table className="w-full">
          <thead style={{ background: 'var(--sapList_HeaderBackground)' }}>
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>GRN No</th>
              <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>PO No</th>
              <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>Vehicle</th>
              <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>Challan</th>
              <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>QC Status</th>
              <th className="text-right px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>Invoice Value</th>
              <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>Received Date</th>
              <th className="text-center px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {grnExtensions.map((grn, idx) => (
              <tr
                key={grn.grnId}
                className="cursor-pointer hover:bg-[var(--sapList_Hover_Background)]"
                style={{
                  borderBottom: '1px solid var(--sapList_BorderColor)',
                  background: idx % 2 === 0 ? 'var(--sapList_Background)' : 'var(--sapList_AlternatingBackground)',
                }}
                onClick={() => setSelectedGrn(grn)}
              >
                <td className="px-4 py-3 text-sm font-mono" style={{ color: 'var(--sapTextColor)' }}>
                  GRN-{grn.grnId}
                </td>
                <td className="px-4 py-3 text-sm font-mono" style={{ color: 'var(--sapTextColor)' }}>
                  PO-{grn.poId}
                </td>
                <td className="px-4 py-3 text-sm" style={{ color: 'var(--sapTextColor)' }}>
                  {grn.vehicleNo}
                </td>
                <td className="px-4 py-3 text-sm" style={{ color: 'var(--sapTextColor)' }}>
                  {grn.challanNo}
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs px-2 py-1 rounded" style={{
                    background: `${getQcStatusColor(grn.qcStatus)}20`,
                    color: getQcStatusColor(grn.qcStatus),
                  }}>
                    {grn.qcStatus || 'NOT_REQUIRED'}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-right" style={{ color: 'var(--sapTextColor)' }}>
                  {formatCurrency(grn.invoiceValue || 0)}
                </td>
                <td className="px-4 py-3 text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>
                  {formatDate(grn.receivedAt)}
                </td>
                <td className="px-4 py-3 text-center">
                  <button className="p-1 rounded hover:bg-[var(--sapButton_Hover_Background)]">
                    <Eye size={16} style={{ color: 'var(--sapButton_TextColor)' }} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedGrn && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedGrn(null)}>
          <div className="sap-card max-w-4xl w-full max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b" style={{ borderColor: 'var(--sapList_BorderColor)' }}>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold" style={{ color: 'var(--sapTextColor)' }}>
                  GRN-{selectedGrn.grnId} — Three-Way Match
                </h3>
                <button onClick={() => setSelectedGrn(null)} className="p-2 rounded hover:bg-[var(--sapButton_Hover_Background)]">×</button>
              </div>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="p-3 rounded" style={{ background: 'var(--sapInformationBackground)' }}>
                  <div className="text-xs mb-1" style={{ color: 'var(--sapInformativeTextColor)' }}>PO Quantity</div>
                  <div className="text-2xl font-bold" style={{ color: 'var(--sapInformativeTextColor)' }}>
                    {grnItemExtensions.filter(g => g.grnItemId === selectedGrn.grnId).reduce((sum, g) => sum + g.challanQty, 0)}
                  </div>
                </div>
                <div className="p-3 rounded" style={{ background: 'var(--sapWarningBackground)' }}>
                  <div className="text-xs mb-1" style={{ color: 'var(--sapCriticalTextColor)' }}>Challan Quantity</div>
                  <div className="text-2xl font-bold" style={{ color: 'var(--sapCriticalTextColor)' }}>
                    {grnItemExtensions.filter(g => g.grnItemId === selectedGrn.grnId).reduce((sum, g) => sum + g.challanQty, 0)}
                  </div>
                </div>
                <div className="p-3 rounded" style={{ background: 'var(--sapSuccessBackground)' }}>
                  <div className="text-xs mb-1" style={{ color: 'var(--sapPositiveTextColor)' }}>Physical Received</div>
                  <div className="text-2xl font-bold" style={{ color: 'var(--sapPositiveTextColor)' }}>
                    {grnItemExtensions.filter(g => g.grnItemId === selectedGrn.grnId).reduce((sum, g) => sum + g.receivedQty, 0)}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--sapTextColor)' }}>
                  Line Items
                </h4>
                <div className="space-y-2">
                  {grnItemExtensions.filter(g => g.grnItemId === selectedGrn.grnId).map((item, idx) => (
                    <div key={idx} className="p-3 rounded border" style={{ borderColor: 'var(--sapList_BorderColor)' }}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium" style={{ color: 'var(--sapTextColor)' }}>
                          Item {item.poItemId}
                        </span>
                        <span className="text-xs px-2 py-1 rounded" style={{
                          background: `${getToleranceStatusColor(item.toleranceStatus)}20`,
                          color: getToleranceStatusColor(item.toleranceStatus),
                        }}>
                          {item.toleranceStatus}
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-xs">
                        <div>
                          <span style={{ color: 'var(--sapContent_LabelColor)' }}>Challan: </span>
                          <span style={{ color: 'var(--sapTextColor)' }}>{item.challanQty}</span>
                        </div>
                        <div>
                          <span style={{ color: 'var(--sapContent_LabelColor)' }}>Received: </span>
                          <span style={{ color: 'var(--sapTextColor)' }}>{item.receivedQty}</span>
                        </div>
                        <div>
                          <span style={{ color: 'var(--sapContent_LabelColor)' }}>Accepted: </span>
                          <span style={{ color: 'var(--sapPositiveColor)' }}>{item.acceptedQty}</span>
                        </div>
                        <div>
                          <span style={{ color: 'var(--sapContent_LabelColor)' }}>Rejected: </span>
                          <span style={{ color: 'var(--sapNegativeColor)' }}>{item.rejectedQty}</span>
                        </div>
                      </div>
                      {item.rejectionReason && (
                        <div className="mt-2 text-xs p-2 rounded" style={{ background: 'var(--sapErrorBackground)', color: 'var(--sapNegativeTextColor)' }}>
                          {item.rejectionReason}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t" style={{ borderColor: 'var(--sapList_BorderColor)' }}>
                <div>
                  <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--sapTextColor)' }}>
                    Vehicle & Transport
                  </h4>
                  <div className="space-y-1 text-xs">
                    <div><span style={{ color: 'var(--sapContent_LabelColor)' }}>Vehicle: </span><span style={{ color: 'var(--sapTextColor)' }}>{selectedGrn.vehicleNo}</span></div>
                    <div><span style={{ color: 'var(--sapContent_LabelColor)' }}>Driver: </span><span style={{ color: 'var(--sapTextColor)' }}>{selectedGrn.driverName}</span></div>
                    <div><span style={{ color: 'var(--sapContent_LabelColor)' }}>Gate Entry: </span><span style={{ color: 'var(--sapTextColor)' }}>{selectedGrn.gateEntryNo}</span></div>
                    <div><span style={{ color: 'var(--sapContent_LabelColor)' }}>Weighbridge: </span><span style={{ color: 'var(--sapTextColor)' }}>{selectedGrn.weighbridgeSlip}</span></div>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--sapTextColor)' }}>
                    Weights & Charges
                  </h4>
                  <div className="space-y-1 text-xs">
                    <div><span style={{ color: 'var(--sapContent_LabelColor)' }}>Gross: </span><span style={{ color: 'var(--sapTextColor)' }}>{selectedGrn.grossWeight} kg</span></div>
                    <div><span style={{ color: 'var(--sapContent_LabelColor)' }}>Tare: </span><span style={{ color: 'var(--sapTextColor)' }}>{selectedGrn.tareWeight} kg</span></div>
                    <div><span style={{ color: 'var(--sapContent_LabelColor)' }}>Net: </span><span style={{ color: 'var(--sapTextColor)' }}>{selectedGrn.netWeight} kg</span></div>
                    <div><span style={{ color: 'var(--sapContent_LabelColor)' }}>Freight: </span><span style={{ color: 'var(--sapTextColor)' }}>{formatCurrency(selectedGrn.freightCharges)}</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
